import connectPgSimple from "connect-pg-simple";
import session, { SessionOptions } from "express-session";
import { pool } from "../db/pool";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "";
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

const PgSession = connectPgSimple(session);

const sessionOptions: SessionOptions = {
  store: new PgSession({
    pool,
    tableName: "session",
    createTableIfMissing: false,
  }),
  name: "sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_WEEK_MS,
  },
};

export const sessionMiddleware = session(sessionOptions);
