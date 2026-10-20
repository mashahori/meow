import { Router } from "express";
import {
  completePasswordReset,
  forgotPassword,
  login,
  logout,
  me,
  register,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/require-auth";
import { passwordResetLimiter } from "../middleware/password-reset-limiter";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, completePasswordReset);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;
