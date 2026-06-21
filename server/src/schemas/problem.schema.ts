import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type ProblemDocument = HydratedDocument<Problem>;

@Schema({ _id: false })
export class ProblemLinks {
  @Prop({ default: '' }) youtube: string;
  @Prop({ default: '' }) leetcode: string;
  @Prop({ default: '' }) codeforces: string;
  @Prop({ default: '' }) article: string;
}
const ProblemLinksSchema = SchemaFactory.createForClass(ProblemLinks);

@Schema({ timestamps: true })
export class Problem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ default: '', trim: true })
  subtopic: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true, enum: DIFFICULTIES })
  difficulty: Difficulty;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ type: ProblemLinksSchema, default: () => ({}) })
  links: ProblemLinks;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const ProblemSchema = SchemaFactory.createForClass(Problem);
ProblemSchema.index({ topicId: 1, order: 1 });
ProblemSchema.index({ topicId: 1, difficulty: 1 });
ProblemSchema.index({ difficulty: 1 });
ProblemSchema.index({ tags: 1 });
