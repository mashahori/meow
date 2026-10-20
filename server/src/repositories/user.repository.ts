import { PoolClient } from "pg";
import { pool } from "../db/pool";

export type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
};

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
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

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `
      SELECT id, email, password_hash, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function insertUser(
  email: string,
  passwordHash: string,
): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, password_hash, created_at, updated_at
    `,
    [email, passwordHash],
  );

  return result.rows[0];
}

export async function savePasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await pool.query(
    `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE
      SET token_hash = EXCLUDED.token_hash,
          expires_at = EXCLUDED.expires_at,
          created_at = now()
    `,
    [userId, tokenHash, expiresAt],
  );
}

export async function updatePasswordWithResetToken(
  tokenHash: string,
  passwordHash: string,
): Promise<boolean> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query("BEGIN");
    const tokenResult = await client.query<{ user_id: string }>(
      `
        DELETE FROM password_reset_tokens
        WHERE token_hash = $1 AND expires_at > now()
        RETURNING user_id
      `,
      [tokenHash],
    );

    if (!tokenResult.rowCount) {
      await client.query("ROLLBACK");
      return false;
    }

    const userId = tokenResult.rows[0].user_id;
    const userResult = await client.query(
      `
        UPDATE users
        SET password_hash = $2, updated_at = now()
        WHERE id = $1
      `,
      [userId, passwordHash],
    );

    if (!userResult.rowCount) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query(
      `DELETE FROM "session" WHERE sess->>'userId' = $1`,
      [userId],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
