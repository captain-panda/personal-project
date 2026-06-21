import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ trim: true, default: '' })
  displayName: string;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  // Instant-revocation epoch: access tokens with iat before this are rejected.
  @Prop({ type: Date, default: null })
  revokeAfter: Date | null;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ createdAt: -1 });

/** Public-safe user projection (matches the Express toSafeJSON()). */
export function toSafeUser(user: UserDocument) {
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    createdAt: (user as unknown as { createdAt: Date }).createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}
