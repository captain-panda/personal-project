import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { dataLimiters } from '../../middleware/rateLimit.js';
import { listTopics } from './topics.controller.js';
import { listByTopic } from '../problems/problems.controller.js';

const router = Router();

router.get('/', ...dataLimiters, requireAuth, listTopics);
router.get('/:topicId/problems', ...dataLimiters, requireAuth, listByTopic);

export default router;
