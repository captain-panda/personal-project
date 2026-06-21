import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TopicDocument = HydratedDocument<Topic>;

@Schema({ timestamps: true })
export class Topic {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: '' })
  iconUrl: string;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
TopicSchema.index({ order: 1 });
