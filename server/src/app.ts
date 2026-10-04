import express, { Application } from "express";
import { sessionMiddleware } from "./config/session";
import { errorHandler } from "./middleware/error-handler";
import authRoutes from "./routes/auth.routes";

export const app: Application = express();

app.use(express.json());
app.use(sessionMiddleware);

app.use("/api/auth", authRoutes);

app.use(errorHandler);
