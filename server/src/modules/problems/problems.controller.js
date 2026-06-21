import { asyncHandler } from '../../utils/asyncHandler.js';
import * as problemsService from './problems.service.js';

export const listByTopic = asyncHandler(async (req, res) => {
  const data = await problemsService.getProblemsByTopic(req.params.topicId);
  res.json(data);
});

export const getOne = asyncHandler(async (req, res) => {
  const problem = await problemsService.getProblemById(req.params.problemId);
  res.json({ problem });
});
