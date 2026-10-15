import { Router } from 'express';
import { remove, update } from '../controllers/category.controller';
import { listByCategory as listExpenses } from '../controllers/expense.controller';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

router.use(requireAuth);

router.get('/:categoryId/expenses', listExpenses);
router.patch('/:categoryId', update);
router.delete('/:categoryId', remove);

export default router;
