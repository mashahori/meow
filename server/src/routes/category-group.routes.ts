import { Router } from "express";
import { list } from "../controllers/category-group.controller";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

router.use(requireAuth);

router.get("/", list);

export default router;
