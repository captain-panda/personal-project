import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, trim: true, default: '' },
    lastLoginAt: { type: Date, default: null },

    // Instant revocation epoch: any access token with `iat` earlier than this
    // is rejected (used for ban / "log out everywhere"). See auth middleware.
    revokeAfter: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// `unique: true` on email already builds the lookup index used at login.
userSchema.index({ createdAt: -1 });

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    displayName: this.displayName,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt,
  };
};

export const User = mongoose.model('User', userSchema);
