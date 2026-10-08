import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Response } from "express";
import { corsMiddleware } from "../../src/middleware/cors";
import { createNext, createRequest } from "../helpers";

describe("corsMiddleware", () => {
  const originalCorsOrigin = process.env.CORS_ORIGIN;

  afterEach(() => {
    if (originalCorsOrigin === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = originalCorsOrigin;
    }
  });

  it("allows configured origins to use cookie-authenticated requests", () => {
    process.env.CORS_ORIGIN = "http://localhost:5173";
    const headers: Record<string, string> = {};
    const response = {
      vary: jest.fn(),
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
      }),
      sendStatus: jest.fn(),
    } as unknown as Response;
    const next = createNext();

    corsMiddleware(
      createRequest({
        method: "POST",
        headers: { origin: "http://localhost:5173" },
      }),
      response,
      next,
    );

    expect(headers["Access-Control-Allow-Origin"]).toBe("http://localhost:5173");
    expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("answers preflight requests without allowing unconfigured origins", () => {
    process.env.CORS_ORIGIN = "http://localhost:5173";
    const setHeader = jest.fn();
    const sendStatus = jest.fn();
    const response = {
      vary: jest.fn(),
      setHeader,
      sendStatus,
    } as unknown as Response;
    const next = createNext();

    corsMiddleware(
      createRequest({
        method: "OPTIONS",
        headers: { origin: "https://untrusted.example" },
      }),
      response,
      next,
    );

    expect(setHeader).not.toHaveBeenCalled();
    expect(sendStatus).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
  });
});
