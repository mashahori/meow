import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors/app-error";
import { isBudgetOwnedByUser } from "../repositories/budget.repository";

const budgetIdSchema = z.string().uuid();

export async function requireBudgetOwner(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.session.userId;
  if (!userId) {
    next(new UnauthorizedError("Authentication required"));
    return;
  }

  const result = budgetIdSchema.safeParse(req.params.budgetId);
  if (!result.success) {
    next(
      new ValidationError(
        result.error.issues.map((issue) => ({
          field: "budgetId",
          message: issue.message,
        })),
      ),
    );
    return;
  }

  if (!(await isBudgetOwnedByUser(result.data, userId))) {
    next(new NotFoundError("Budget not found"));
    return;
  }

  next();
}
