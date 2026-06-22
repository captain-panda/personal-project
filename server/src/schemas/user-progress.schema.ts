import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type UserProgressDocument = HydratedDocument<UserProgress>;

@Schema({ timestamps: true })
export class UserProgress {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Problem', required: true })
  problemId: Types.ObjectId;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ default: '' })
  notes: string;
}

export const UserProgressSchema = SchemaFactory.createForClass(UserProgress);
// Upsert key — one row per (user, problem).
UserProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });
UserProgressSchema.index({ userId: 1, completed: 1 });
UserProgressSchema.index({ problemId: 1 });
