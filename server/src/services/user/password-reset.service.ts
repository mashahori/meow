import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { UnauthorizedError } from "../../errors/app-error";
import {
  findUserByEmail,
  savePasswordResetToken,
  updatePasswordWithResetToken,
} from "../../repositories/user.repository";

const PASSWORD_SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export async function requestPasswordReset(email: string): Promise<void> {
  const resetUrl = new URL(
    "/reset-password",
    requiredEnvironmentVariable("CLIENT_URL"),
  );
  const mailTransport = isMailMocked() ? null : createMailTransport();
  const user = await findUserByEmail(email);
  if (!user) {
    return;
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  await savePasswordResetToken(
    user.id,
    tokenHash,
    new Date(Date.now() + RESET_TOKEN_TTL_MS),
  );

  resetUrl.searchParams.set("token", token);

  if (isMailMocked()) {
    console.info(`[mail mock] Password reset link for ${user.email}: ${resetUrl.toString()}`);
    return;
  }

  await mailTransport!.sendMail({
    from: requiredEnvironmentVariable("SMTP_FROM"),
    to: user.email,
    subject: "Reset your password",
    text: [
      "We received a request to reset your password.",
      `Use this link within 30 minutes: ${resetUrl.toString()}`,
      "If you did not request a password reset, you can ignore this email.",
    ].join("\n\n"),
  });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const tokenWasValid = await updatePasswordWithResetToken(
    hashToken(token),
    passwordHash,
  );

  if (!tokenWasValid) {
    throw new UnauthorizedError("Password reset link is invalid or has expired");
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isMailMocked(): boolean {
  return process.env.MAIL_MOCK === "true";
}

function createMailTransport() {
  const port = Number(requiredEnvironmentVariable("SMTP_PORT"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid TCP port");
  }

  return nodemailer.createTransport({
    host: requiredEnvironmentVariable("SMTP_HOST"),
    port,
    secure: port === 465,
    auth: {
      user: requiredEnvironmentVariable("SMTP_USER"),
      pass: requiredEnvironmentVariable("SMTP_PASSWORD"),
    },
  });
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}
