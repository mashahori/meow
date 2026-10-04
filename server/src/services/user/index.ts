import bcrypt from "bcryptjs";
import { ConflictError, UnauthorizedError } from "../../errors/app-error";
import {
  findUserByEmail,
  findUserById,
  insertUser,
  UserRecord,
} from "../../repositories/user.repository";

const PASSWORD_SALT_ROUNDS = 12;

export type PublicUser = {
  id: string;
  email: string;
};

export async function registerUser(
  email: string,
  password: string,
): Promise<PublicUser> {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ConflictError("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const user = await insertUser(email, passwordHash);

  return toPublicUser(user);
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<PublicUser> {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return toPublicUser(user);
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await findUserById(id);
  return user ? toPublicUser(user) : null;
}

function toPublicUser(user: UserRecord): PublicUser {
  return { id: user.id, email: user.email };
}