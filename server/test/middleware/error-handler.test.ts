import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../src/errors/app-error";
import { errorHandler } from "../../src/middleware/error-handler";
import { validateRegisterPayload } from "../../src/validators/auth.validator";
import { createNext, createRequest, createResponse } from "../helpers";

function handle(error: unknown) {
  const res = createResponse();
  errorHandler(error, createRequest(), res, createNext());
  return res;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("errorHandler", () => {
  it("serializes AppError with its status and details", () => {
    const res = handle(
      new ValidationError([{ field: "name", message: "Required" }]),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request data is invalid",
        details: [{ field: "name", message: "Required" }],
      },
    });
  });

  it.each<[AppError, number, string]>([
    [new UnauthorizedError("Authentication required"), 401, "UNAUTHORIZED"],
    [new NotFoundError("Budget not found"), 404, "NOT_FOUND"],
    [new ConflictError("Email already registered"), 409, "CONFLICT"],
  ])("maps %p to status %i", (error, status, code) => {
    const res = handle(error);

    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({
      error: { code, message: error.message },
    });
  });

  it("serializes ZodError into field-level details", () => {
    let zodError: unknown;
    try {
      validateRegisterPayload({});
    } catch (error) {
      zodError = error;
    }

    const res = handle(zodError);

    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0][0] as {
      error: { code: string; details: { field: string }[] };
    };
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(payload.error.details.map((detail) => detail.field).sort()).toEqual([
      "email",
      "password",
    ]);
  });

  it("maps malformed JSON from body-parser to a 400", () => {
    const error = Object.assign(new SyntaxError("Unexpected token"), {
      status: 400,
      type: "entity.parse.failed",
    });

    const res = handle(error);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body is not valid JSON",
      },
    });
  });

  it("hides internals of unexpected errors and logs them", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const res = handle(new Error("db password leaked"));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
    expect(consoleError).toHaveBeenCalled();
  });
});
