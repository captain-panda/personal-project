import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    iconUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

// Topics are listed in display order; slug index comes from `unique: true`.
topicSchema.index({ order: 1 });

export const Topic = mongoose.model('Topic', topicSchema);
