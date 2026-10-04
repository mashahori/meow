import { Router } from "express";
import {
  create,
  getActive,
  getOne,
  list,
  remove,
  setActive,
  update,
} from "../controllers/budget.controller";
import { requireAuth } from "../middleware/require-auth";
import { requireBudgetOwner } from "../middleware/require-budget-owner";

const router = Router();

router.use(requireAuth);

router.get("/", list);
router.post("/", create);
router.get("/active", getActive);
router.put("/active", setActive);
router.get("/:budgetId", requireBudgetOwner, getOne);
router.patch("/:budgetId", requireBudgetOwner, update);
router.delete("/:budgetId", requireBudgetOwner, remove);

export default router;
