import { asyncHandler } from '../../utils/asyncHandler.js';
import * as topicsService from './topics.service.js';

export const listTopics = asyncHandler(async (_req, res) => {
  const topics = await topicsService.getAllTopics();
  res.json({ topics });
});
