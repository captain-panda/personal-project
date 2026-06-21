/**
 * Wrap an async Express handler so rejected promises flow to next() and reach
 * the centralized error handler instead of crashing the process.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
