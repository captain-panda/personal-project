import { z } from 'zod';

export const toggleSchema = z.object({
  completed: z.boolean(),
  notes: z.string().max(2000).optional(),
});
