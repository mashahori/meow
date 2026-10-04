import { NextFunction, Request, Response } from "express";
import {
  activateBudget,
  createBudget,
  editBudget,
  getActiveBudget,
  getBudgetDetails,
  getBudgets,
  removeBudget,
} from "../services/budget.service";
import {
  validateCreateBudgetPayload,
  validateSetActiveBudgetPayload,
  validateUpdateBudgetPayload,
} from "../validators/budget.validator";

// requireAuth guarantees userId is set; requireBudgetOwner guarantees a valid budgetId.
const userId = (req: Request) => req.session.userId as string;
const budgetId = (req: Request) => req.params.budgetId as string;

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json({ items: await getBudgets(userId(req)) });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validateCreateBudgetPayload(req.body);
    res.status(201).json(await createBudget(userId(req), payload));
  } catch (error) {
    next(error);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await getBudgetDetails(budgetId(req), userId(req)));
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validateUpdateBudgetPayload(req.body);
    res.status(200).json(await editBudget(budgetId(req), userId(req), payload));
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await removeBudget(budgetId(req), userId(req));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function getActive(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    res.status(200).json({ budget: await getActiveBudget(userId(req)) });
  } catch (error) {
    next(error);
  }
}

export async function setActive(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload = validateSetActiveBudgetPayload(req.body);
    res.status(200).json(await activateBudget(payload.budgetId, userId(req)));
  } catch (error) {
    next(error);
  }
}
