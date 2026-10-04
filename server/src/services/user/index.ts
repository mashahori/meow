import bcrypt from "bcryptjs";
import { pool } from "../../db/pool";

export type User = {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
};

export async function createUser(
  email: string,
  password: string,
): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query<User>(
    `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, password_hash, created_at, updated_at
    `,
    [email, passwordHash],
  );

  return result.rows[0];
}

export async function findUser(email: string): Promise<User | null> {
  const result = await pool.query<User>(
    `
      SELECT id, email, password_hash, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}