export type ValidationErrorDetail = {
  field: string;
  message: string;
};

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ValidationErrorDetail[];

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: ValidationErrorDetail[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(details: ValidationErrorDetail[]) {
    super(400, "VALIDATION_ERROR", "Request data is invalid", details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(401, "UNAUTHORIZED", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, "NOT_FOUND", message);
  }
}
