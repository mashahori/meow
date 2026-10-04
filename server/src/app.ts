import express, { Application } from "express";
import { sessionMiddleware } from "./config/session";
import { NotFoundError } from "./errors/app-error";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import authRoutes from "./routes/auth.routes";
import budgetRoutes from "./routes/budget.routes";

export const app: Application = express();

app.use(requestLogger);
app.use(express.json());
app.use(sessionMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/budgets", budgetRoutes);

app.use((_req, _res, next) => {
  next(new NotFoundError("Route not found"));
});

app.use(errorHandler);
