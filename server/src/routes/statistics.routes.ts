import { Router } from 'express';
import { getMonthly } from '../controllers/statistics.controller';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

router.use(requireAuth);

router.get('/', getMonthly);

export default router;
