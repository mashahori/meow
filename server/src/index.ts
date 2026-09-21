import "dotenv/config";
import express, { Application, Request, Response } from "express";
import { pool } from "./db/pool";

const app: Application = express();
const PORT = Number(process.env.PORT ?? 3000);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

async function start() {
  await pool.query("SELECT 1");

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exitCode = 1;
});
