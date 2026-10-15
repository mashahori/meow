import { NextFunction, Request, Response } from "express";
import {
  createCategory,
  editCategory,
  getCategories,
  removeCategory,
} from "../services/category.service";
import {
  validateCategoryId,
  validateCreateCategoryPayload,
  validateUpdateCategoryPayload,
} from "../validators/category.validator";

const userId = (req: Request) => req.session.userId as string;
const budgetId = (req: Request) => req.params.budgetId as string;

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    res.status(200).json({ items: await getCategories(budgetId(req)) });
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload = validateCreateCategoryPayload(req.body);
    res.status(201).json(await createCategory(budgetId(req), payload));
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const categoryId = validateCategoryId(req.params.categoryId);
    const payload = validateUpdateCategoryPayload(req.body);
    res.status(200).json(await editCategory(categoryId, userId(req), payload));
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const categoryId = validateCategoryId(req.params.categoryId);
    await removeCategory(categoryId, userId(req));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
