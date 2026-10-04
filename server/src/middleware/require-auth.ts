import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/app-error";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.session.userId) {
    next(new UnauthorizedError("Authentication required"));
    return;
  }

  next();
}
