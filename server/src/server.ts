import "dotenv/config";
import { app } from "./app";
import { pool } from "./db/pool";

const PORT = Number(process.env.PORT ?? 3000);

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
