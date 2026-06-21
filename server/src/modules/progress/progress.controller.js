import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import * as progressService from './progress.service.js';

export const toggle = asyncHandler(async (req, res) => {
  const { completed, notes } = req.body;
  const progress = await progressService.setProgress(req.user.id, req.params.problemId, completed, notes);
  res.json({ progress });
});

export const myProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.getUserProgress(req.user.id);
  res.json({ progress });
});

export const stats = asyncHandler(async (req, res) => {
  const stats = await progressService.getStats(req.user.id);
  res.json({ stats });
});

// Matches the spec's /user/:userId shape, but ownership is enforced: a user can
// only read their own progress (IDOR protection).
export const progressByUserId = asyncHandler(async (req, res) => {
  if (req.params.userId !== req.user.id) {
    throw AppError.forbidden("Cannot access another user's progress");
  }
  const progress = await progressService.getUserProgress(req.user.id);
  res.json({ progress });
});
