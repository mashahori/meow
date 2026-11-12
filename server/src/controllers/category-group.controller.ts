import { NextFunction, Request, Response } from "express";
import { getCategoryGroups } from "../services/category-group.service";

export async function list(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    res.status(200).json({ items: await getCategoryGroups() });
  } catch (error) {
    next(error);
  }
}
