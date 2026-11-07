import { afterAll, beforeAll, beforeEach, expect, jest } from "@jest/globals";
import bcrypt from "bcryptjs";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { app } from "../../src/app";
import type { UserRecord } from "../../src/repositories/user.repository";
import { findUserByEmail } from "../../src/repositories/user.repository";

export const TEST_USER_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
export const TEST_EMAIL = "user@example.com";
export const TEST_PASSWORD = "correct-password";

export const TEST_USER: UserRecord = {
  id: TEST_USER_ID,
  email: TEST_EMAIL,
  password_hash: bcrypt.hashSync(TEST_PASSWORD, 4),
  created_at: new Date("2026-01-01T00:00:00Z"),
  updated_at: new Date("2026-01-01T00:00:00Z"),
};

export type JsonResponse = {
  status: number;
  body: unknown;
};

// Keeps the session cookie between requests, like a browser would.
export class TestClient {
  private baseUrl: string;
  private sessionCookie: string | undefined;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  get(path: string): Promise<JsonResponse> {
    return this.request("GET", path);
  }

  post(path: string, body?: unknown): Promise<JsonResponse> {
    return this.request("POST", path, body);
  }

  put(path: string, body?: unknown): Promise<JsonResponse> {
    return this.request("PUT", path, body);
  }

  patch(path: string, body?: unknown): Promise<JsonResponse> {
    return this.request("PATCH", path, body);
  }

  delete(path: string): Promise<JsonResponse> {
    return this.request("DELETE", path);
  }

  async request(method: string, path: string, body?: unknown): Promise<JsonResponse> {
    const headers: Record<string, string> = {};
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (this.sessionCookie) {
      headers.Cookie = this.sessionCookie;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    // An empty "sid=" value means the session was cleared (logout).
    const setCookie = response.headers.get("set-cookie")?.split(";")[0];
    if (setCookie?.startsWith("sid=")) {
      this.sessionCookie = setCookie.length > "sid=".length ? setCookie : undefined;
    }

    const text = await response.text();
    return {
      status: response.status,
      body: text ? (JSON.parse(text) as unknown) : undefined,
    };
  }
}

// Registers the server lifecycle hooks; call inside a describe block.
export function setupTestServer(): () => TestClient {
  let server: Server | undefined;
  let baseUrl = "";

  beforeAll(async () => {
    jest.spyOn(console, "info").mockImplementation(() => undefined);
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
  });

  return () => new TestClient(baseUrl);
}

// Logs in as the given user through POST /api/auth/login.
// The calling test file must mock repositories/user.repository.
export async function signIn(client: TestClient, user: UserRecord = TEST_USER): Promise<void> {
  jest.mocked(findUserByEmail).mockResolvedValueOnce(user);
  const response = await client.post("/api/auth/login", {
    email: user.email,
    password: TEST_PASSWORD,
  });
  expect(response.status).toBe(200);
}
