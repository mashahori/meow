import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/app-error";
import { authenticateUser, getUserById, registerUser } from "../services/user";
import {
  validateLoginPayload,
  validateRegisterPayload,
} from "../validators/auth.validator";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload = validateRegisterPayload(req.body);
    const user = await registerUser(payload.email, payload.password);

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validateLoginPayload(req.body);
    const user = await authenticateUser(payload.email, payload.password);

    // Regenerate the session on login to prevent session fixation.
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        next(regenerateError);
        return;
      }

      req.session.userId = user.id;
      req.session.save((saveError) => {
        if (saveError) {
          next(saveError);
          return;
        }

        res.status(200).json({ user });
      });
    });
  } catch (error) {
    next(error);
  }
}

export function logout(req: Request, res: Response, next: NextFunction) {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie("sid");
    res.status(204).end();
  });
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    // requireAuth guarantees userId is set before this handler runs.
    const user = await getUserById(req.session.userId as string);
    if (!user) {
      // The session outlived the user record (e.g. deleted account); treat as unauthenticated.
      req.session.destroy(() => undefined);
      throw new UnauthorizedError("Authentication required");
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

