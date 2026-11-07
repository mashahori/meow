import { Router } from "express";
import {
  activate,
  archive,
  clone,
  create,
  deactivate,
  getActive,
  getOne,
  list,
  remove,
  setActive,
  unarchive,
  update,
} from "../controllers/budget.controller";
import {
  create as createCategory,
  list as listCategories,
} from "../controllers/category.controller";
import {
  create as createExpense,
  listByBudget as listExpenses,
} from "../controllers/expense.controller";
import { requireAuth } from "../middleware/require-auth";
import { requireBudgetOwner } from "../middleware/require-budget-owner";

const router = Router();

router.use(requireAuth);

router.get("/", list);
router.post("/", create);
router.get("/active", getActive);
router.put("/active", setActive);
router.get("/:budgetId/categories", requireBudgetOwner, listCategories);
router.post("/:budgetId/categories", requireBudgetOwner, createCategory);
router.get("/:budgetId/expenses", requireBudgetOwner, listExpenses);
router.post("/:budgetId/expenses", requireBudgetOwner, createExpense);
router.post("/:budgetId/activate", requireBudgetOwner, activate);
router.post("/:budgetId/deactivate", requireBudgetOwner, deactivate);
router.post("/:budgetId/archive", requireBudgetOwner, archive);
router.post("/:budgetId/clone", requireBudgetOwner, clone);
router.post("/:budgetId/unarchive", requireBudgetOwner, unarchive);
router.get("/:budgetId", requireBudgetOwner, getOne);
router.patch("/:budgetId", requireBudgetOwner, update);
router.delete("/:budgetId", requireBudgetOwner, remove);

export default router;
