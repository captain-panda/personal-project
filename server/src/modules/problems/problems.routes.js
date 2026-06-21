import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { dataLimiters } from '../../middleware/rateLimit.js';
import { getOne } from './problems.controller.js';

const router = Router();

router.get('/:problemId', ...dataLimiters, requireAuth, getOne);

export default router;
