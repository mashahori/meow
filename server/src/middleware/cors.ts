import { NextFunction, Request, Response } from "express";

const allowedMethods = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const origin = req.headers.origin;
  const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((allowedOrigin) => allowedOrigin.trim())
    .filter(Boolean);

  res.vary("Origin");

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", allowedMethods);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
}
