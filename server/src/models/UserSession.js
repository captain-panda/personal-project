import mongoose from 'mongoose';

/**
 * One row per *issued* refresh token (stored as a SHA-256 hash).
 *
 * `familyId` groups all rotations descended from a single login. Reuse
 * detection: if an already-rotated (revoked) token is presented again, the
 * whole family is revoked — see auth.service rotateRefreshToken().
 */
const userSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    familyId: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSessionSchema.index({ userId: 1 });
userSessionSchema.index({ familyId: 1 });
// TTL: Mongo auto-purges expired sessions — no cron needed.
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserSession = mongoose.model('UserSession', userSessionSchema);
