import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { dataLimiters } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { toggleSchema } from './progress.validation.js';
import * as c from './progress.controller.js';

const router = Router();

router.get('/me', ...dataLimiters, requireAuth, c.myProgress);
router.get('/stats', ...dataLimiters, requireAuth, c.stats);
router.get('/user/:userId', ...dataLimiters, requireAuth, c.progressByUserId);
router.patch('/:problemId', ...dataLimiters, requireAuth, validate(toggleSchema), c.toggle);

export default router;
