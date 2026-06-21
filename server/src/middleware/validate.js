import { AppError } from '../utils/AppError.js';

/**
 * Validate a request segment (`body` | `params` | `query`) against a zod schema.
 * On success the parsed/coerced value replaces the original. On failure it
 * raises a 400 with field-level details.
 */
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        AppError.badRequest(
          'Validation failed',
          result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        ),
      );
    }
    // req.query is a getter in Express 5; assign defensively.
    try {
      req[source] = result.data;
    } catch {
      req.validated = { ...(req.validated || {}), [source]: result.data };
    }
    next();
  };
