import { Router } from 'express';
import { remove, update } from '../controllers/expense.controller';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

router.use(requireAuth);

router.patch('/:expenseId', update);
router.delete('/:expenseId', remove);

export default router;
