import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

// Upsert key: one progress row per (user, problem). Enables atomic
// findOneAndUpdate with no pre-check query.
userProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });
// Fetch a user's completed set.
userProgressSchema.index({ userId: 1, completed: 1 });
// Global per-problem completion rate.
userProgressSchema.index({ problemId: 1 });

export const UserProgress = mongoose.model('UserProgress', userProgressSchema);
