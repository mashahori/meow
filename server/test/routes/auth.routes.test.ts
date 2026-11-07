import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createHash } from "node:crypto";
import {
  findUserById,
  findUserByEmail,
  insertUser,
  savePasswordResetToken,
  updatePasswordWithResetToken,
} from "../../src/repositories/user.repository";
import {
  setupTestServer,
  signIn,
  TEST_EMAIL,
  TEST_PASSWORD,
  TEST_USER,
  TEST_USER_ID,
  TestClient,
} from "./route-helpers";

jest.mock("../../src/config/session", () => {
  const session = jest.requireActual("express-session") as typeof import("express-session");
  return {
    sessionMiddleware: session({
      name: "sid",
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
    }),
  };
});

// The limiter keeps in-memory counters shared across requests; it is tested separately.
jest.mock("../../src/middleware/password-reset-limiter", () => ({
  passwordResetLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../src/repositories/user.repository");

const RESET_TOKEN = "a".repeat(43);

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describe("auth routes", () => {
  const newClient = setupTestServer();
  let client: TestClient;

  beforeEach(() => {
    process.env.CLIENT_URL = "http://localhost:5173";
    process.env.MAIL_MOCK = "true";
    client = newClient();
  });

  describe("POST /api/auth/register", () => {
    it("creates a user with a hashed password and normalized email", async () => {
      jest.mocked(findUserByEmail).mockResolvedValue(null);
      jest.mocked(insertUser).mockResolvedValue({ ...TEST_USER, id: "new-id", email: "new@example.com" });

      const response = await client.post("/api/auth/register", {
        email: "  New@Example.com ",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ user: { id: "new-id", email: "new@example.com" } });
      expect(findUserByEmail).toHaveBeenCalledWith("new@example.com");
      const [email, passwordHash] = jest.mocked(insertUser).mock.calls[0];
      expect(email).toBe("new@example.com");
      expect(passwordHash).not.toBe("password123");
      expect(passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it("returns 409 when the email is already registered", async () => {
      jest.mocked(findUserByEmail).mockResolvedValue(TEST_USER);

      const response = await client.post("/api/auth/register", {
        email: TEST_EMAIL,
        password: "password123",
      });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({ error: { code: "CONFLICT" } });
      expect(insertUser).not.toHaveBeenCalled();
    });

    it("returns 400 with details for an invalid payload", async () => {
      const response = await client.post("/api/auth/register", {
        email: "not-an-email",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
      const details = (response.body as { error: { details: { field: string }[] } }).error.details;
      expect(details.map((detail) => detail.field)).toEqual(["email", "password"]);
      expect(insertUser).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns the user and sets a session cookie", async () => {
      jest.mocked(findUserByEmail).mockResolvedValue(TEST_USER);

      const response = await client.post("/api/auth/login", {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: { id: TEST_USER_ID, email: TEST_EMAIL } });
      // The cookie is stored by the client, so the session is used for later requests.
      jest.mocked(findUserById).mockResolvedValue(TEST_USER);
      expect((await client.get("/api/auth/me")).status).toBe(200);
    });

    it("returns 401 for a wrong password", async () => {
      jest.mocked(findUserByEmail).mockResolvedValue(TEST_USER);

      const response = await client.post("/api/auth/login", {
        email: TEST_EMAIL,
        password: "wrong-password",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
      });
    });

    it("returns the same 401 for an unknown email", async () => {
      jest.mocked(findUserByEmail).mockResolvedValue(null);

      const response = await client.post("/api/auth/login", {
        email: "unknown@example.com",
        password: TEST_PASSWORD,
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
      });
    });

    it("returns 400 when the password is missing", async () => {
      const response = await client.post("/api/auth/login", { email: TEST_EMAIL });

      expect(response.status).toBe(400);
      expect(findUserByEmail).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("returns the generic message without storing a token for an unknown email", async () => {
      jest.mocked(findUserByEmail).mockResolvedValue(null);

      const response = await client.post("/api/auth/forgot-password", {
        email: "unknown@example.com",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "If an account with that email exists, a reset link has been sent.",
      });
      expect(savePasswordResetToken).not.toHaveBeenCalled();
    });

    it("stores a hashed token and logs a reset link for a known email", async () => {
      jest.mocked(findUserByEmail).mockResolvedValue(TEST_USER);

      const response = await client.post("/api/auth/forgot-password", { email: TEST_EMAIL });

      expect(response.status).toBe(200);
      expect(savePasswordResetToken).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.stringMatching(/^[a-f0-9]{64}$/),
        expect.any(Date),
      );
    });

    it("issues a link whose token completes the password reset", async () => {
      jest.mocked(findUserByEmail).mockResolvedValue(TEST_USER);
      jest.mocked(updatePasswordWithResetToken).mockResolvedValue(true);

      await client.post("/api/auth/forgot-password", { email: TEST_EMAIL });

      const logLine = jest
        .mocked(console.info)
        .mock.calls.map((call) => String(call[0]))
        .find((line) => line.includes("Password reset link"));
      const link = logLine?.match(/https?:\/\/\S+/)?.[0];
      const token = new URL(link ?? "").searchParams.get("token") ?? "";
      expect(token).toHaveLength(43);
      expect(jest.mocked(savePasswordResetToken).mock.calls[0][1]).toBe(sha256(token));

      const response = await client.post("/api/auth/reset-password", {
        token,
        password: "new-password-123",
      });

      expect(response.status).toBe(204);
      expect(updatePasswordWithResetToken).toHaveBeenCalledWith(sha256(token), expect.any(String));
    });

    it("returns 400 for an invalid email", async () => {
      const response = await client.post("/api/auth/forgot-password", { email: "nope" });

      expect(response.status).toBe(400);
      expect(findUserByEmail).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("updates the password and returns 204 for a valid token", async () => {
      jest.mocked(updatePasswordWithResetToken).mockResolvedValue(true);

      const response = await client.post("/api/auth/reset-password", {
        token: RESET_TOKEN,
        password: "new-password-123",
      });

      expect(response.status).toBe(204);
      expect(response.body).toBeUndefined();
      expect(updatePasswordWithResetToken).toHaveBeenCalledWith(
        sha256(RESET_TOKEN),
        expect.stringMatching(/^\$2[aby]\$/),
      );
    });

    it("returns 401 for an invalid or expired token", async () => {
      jest.mocked(updatePasswordWithResetToken).mockResolvedValue(false);

      const response = await client.post("/api/auth/reset-password", {
        token: RESET_TOKEN,
        password: "new-password-123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: {
          code: "UNAUTHORIZED",
          message: "Password reset link is invalid or has expired",
        },
      });
    });

    it("returns 400 for a malformed token or a short password", async () => {
      const response = await client.post("/api/auth/reset-password", {
        token: "short",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(updatePasswordWithResetToken).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/logout", () => {
    it("returns 401 without a session", async () => {
      const response = await client.post("/api/auth/logout");

      expect(response.status).toBe(401);
    });

    it("ends the session so later requests are unauthenticated", async () => {
      await signIn(client);

      const response = await client.post("/api/auth/logout");

      expect(response.status).toBe(204);
      expect(response.body).toBeUndefined();
      expect((await client.get("/api/auth/me")).status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 without a session", async () => {
      const response = await client.get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ error: { code: "UNAUTHORIZED" } });
    });

    it("returns the current user for an active session", async () => {
      await signIn(client);
      jest.mocked(findUserById).mockResolvedValue(TEST_USER);

      const response = await client.get("/api/auth/me");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ user: { id: TEST_USER_ID, email: TEST_EMAIL } });
      expect(findUserById).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it("returns 401 and drops the session when the user no longer exists", async () => {
      await signIn(client);
      jest.mocked(findUserById).mockResolvedValue(null);

      const response = await client.get("/api/auth/me");

      expect(response.status).toBe(401);
      expect((await client.get("/api/auth/me")).status).toBe(401);
    });
  });
});
