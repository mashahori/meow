import { NextFunction, Request, Response } from 'express';
import {
  createExpense,
  editExpense,
  getCategoryExpenses,
  getExpenses,
  removeExpense,
} from '../services/expense.service';
import {
  validateCreateExpensePayload,
  validateExpenseCategoryId,
  validateExpenseId,
  validateUpdateExpensePayload,
} from '../validators/expense.validator';

const userId = (req: Request) => req.session.userId as string;
const param = (req: Request, name: string) => req.params[name] as string;

export async function listByBudget(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json({ items: await getExpenses(param(req, 'budgetId')) });
  } catch (error) {
    next(error);
  }
}

export async function listByCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const categoryId = validateExpenseCategoryId(param(req, 'categoryId'));
    res.status(200).json({
      items: await getCategoryExpenses(categoryId, userId(req)),
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validateCreateExpensePayload(req.body);
    res.status(201).json(await createExpense(param(req, 'budgetId'), userId(req), payload));
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const expenseId = validateExpenseId(req.params.expenseId);
    const payload = validateUpdateExpensePayload(req.body);
    res.status(200).json(await editExpense(expenseId, userId(req), payload));
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const expenseId = validateExpenseId(req.params.expenseId);
    await removeExpense(expenseId, userId(req));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
