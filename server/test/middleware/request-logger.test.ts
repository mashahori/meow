import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Request, Response } from "express";
import { requestLogger } from "../../src/middleware/request-logger";
import { createNext } from "../helpers";

afterEach(() => {
  jest.restoreAllMocks();
});

function createFinishableResponse(statusCode: number): Response {
  return Object.assign(new EventEmitter(), { statusCode }) as unknown as Response;
}

describe("requestLogger", () => {
  it("logs method, path, status and duration once the response finishes", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const res = createFinishableResponse(204);
    const next = createNext();

    requestLogger({ method: "GET", path: "/api/auth/me" } as Request, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(info).not.toHaveBeenCalled();

    res.emit("finish");

    expect(info).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(info.mock.calls[0][0] as string);
    expect(entry).toMatchObject({
      level: "info",
      method: "GET",
      path: "/api/auth/me",
      status: 204,
    });
    expect(typeof entry.durationMs).toBe("number");
    expect(entry.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("does not log query strings, bodies or credentials", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const res = createFinishableResponse(200);

    requestLogger(
      {
        method: "POST",
        path: "/api/auth/login",
        url: "/api/auth/login?token=secret",
        body: { password: "secret" },
      } as unknown as Request,
      res,
      createNext(),
    );
    res.emit("finish");

    expect(info.mock.calls[0][0]).not.toContain("secret");
  });
});
