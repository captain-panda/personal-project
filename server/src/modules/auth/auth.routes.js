import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiters } from '../../middleware/rateLimit.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import * as c from './auth.controller.js';

const router = Router();

router.post('/register', ...authLimiters, validate(registerSchema), c.register);
router.post('/login', ...authLimiters, validate(loginSchema), c.login);
router.post('/refresh', ...authLimiters, c.refresh);
router.post('/logout', c.logout);
router.post('/logout-all', requireAuth, c.logoutAll);
router.get('/me', requireAuth, c.me);

export default router;
