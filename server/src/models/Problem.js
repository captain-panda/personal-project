import mongoose from 'mongoose';

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const problemSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    subtopic: { type: String, default: '', trim: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    links: {
      youtube: { type: String, default: '' },
      leetcode: { type: String, default: '' },
      codeforces: { type: String, default: '' },
      article: { type: String, default: '' },
    },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

// Fetch problems by topic in display order (the common read).
problemSchema.index({ topicId: 1, order: 1 });
// Filter by difficulty within a topic.
problemSchema.index({ topicId: 1, difficulty: 1 });
// Global difficulty filter / stats.
problemSchema.index({ difficulty: 1 });
// Tag-based lookups.
problemSchema.index({ tags: 1 });

export const Problem = mongoose.model('Problem', problemSchema);
