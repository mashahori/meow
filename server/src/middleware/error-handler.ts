import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { ZodError } from "zod";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request data is invalid",
        details: error.issues.map((issue) => ({
          field: issue.path.join(".") || "body",
          message: issue.message,
        })),
      },
    });
    return;
  }

  // Malformed JSON bodies are reported by body-parser as a SyntaxError with this shape.
  if (isBodyParserSyntaxError(error)) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body is not valid JSON",
      },
    });
    return;
  }

  console.error("Unexpected error", error);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
}

function isBodyParserSyntaxError(
  error: unknown,
): error is SyntaxError & { status: number; type: string } {
  return (
    error instanceof SyntaxError &&
    "status" in error &&
    (error as { status?: unknown }).status === 400 &&
    "type" in error &&
    (error as { type?: unknown }).type === "entity.parse.failed"
  );
}
