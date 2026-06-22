import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type UserSessionDocument = HydratedDocument<UserSession>;

/**
 * One row per issued refresh token (stored hashed). `familyId` groups rotations
 * from a single login for reuse detection.
 */
@Schema({ timestamps: true })
export class UserSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  familyId: string;

  @Prop({ required: true, unique: true })
  tokenHash: string;

  @Prop({ default: '' })
  userAgent: string;

  @Prop({ default: '' })
  ipAddress: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  revokedAt: Date | null;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
UserSessionSchema.index({ userId: 1 });
UserSessionSchema.index({ familyId: 1 });
// TTL — Mongo auto-purges expired sessions.
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
