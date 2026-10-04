import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;
