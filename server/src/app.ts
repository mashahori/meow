import { existsSync } from "node:fs";
import path from "node:path";
import express, { Application } from "express";
import { sessionMiddleware } from "./config/session";
import { NotFoundError } from "./errors/app-error";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import authRoutes from "./routes/auth.routes";
import budgetRoutes from "./routes/budget.routes";
import categoryRoutes from "./routes/category.routes";
import expenseRoutes from "./routes/expense.routes";

export const app: Application = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(requestLogger);
app.use(corsMiddleware);
app.use(express.json());
app.use(sessionMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/expenses", expenseRoutes);

const clientBuildPath = path.resolve(__dirname, "../../client/dist");
const clientIndexPath = path.join(clientBuildPath, "index.html");

if (existsSync(clientIndexPath)) {
  app.use(express.static(clientBuildPath));
  app.get("/{*path}", (req, res, next) => {
    if (/^\/api(?:\/|$)/.test(req.path)) {
      next();
      return;
    }

    res.sendFile(clientIndexPath, (error) => {
      if (error) {
        next(error);
      }
    });
  });
}

app.use((_req, _res, next) => {
  next(new NotFoundError("Route not found"));
});

app.use(errorHandler);
