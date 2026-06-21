import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { UserSession, UserSessionDocument } from '../schemas/user-session.schema';
import { TokenService } from '../infra/tokens/token.service';
import { RedisService } from '../infra/redis/redis.service';
import { AppException } from '../common/exceptions/app.exception';
import { APP_CONFIG, Env } from '../config/env.validation';

interface Meta {
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserSession.name) private readonly sessionModel: Model<UserSessionDocument>,
    private readonly tokens: TokenService,
    private readonly redisService: RedisService,
    @Inject(APP_CONFIG) private readonly config: Env,
  ) {}

  private async issueSession(user: UserDocument, familyId: string, meta: Meta) {
    const { token: refreshToken } = this.tokens.signRefreshToken(String(user._id), familyId);
    await this.sessionModel.create({
      userId: user._id,
      familyId,
      tokenHash: this.tokens.hashToken(refreshToken),
      userAgent: meta.userAgent || '',
      ipAddress: meta.ip || '',
      expiresAt: this.tokens.getTokenExpiry(refreshToken) ?? new Date(Date.now() + 7 * 864e5),
    });
    const { token: accessToken } = this.tokens.signAccessToken(String(user._id));
    return { accessToken, refreshToken };
  }

  async register(input: { email: string; password: string; displayName?: string } & Meta) {
    const existing = await this.userModel.findOne({ email: input.email }).lean();
    if (existing) throw AppException.conflict('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, this.config.BCRYPT_COST);
    const user = await this.userModel.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName || '',
    });
    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.issueSession(user, this.tokens.newFamilyId(), input);
    return { user, ...tokens };
  }

  async login(input: { email: string; password: string } & Meta) {
    const user = await this.userModel.findOne({ email: input.email });
    if (!user || !user.isActive) throw AppException.unauthorized('Invalid credentials');

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw AppException.unauthorized('Invalid credentials');

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.issueSession(user, this.tokens.newFamilyId(), input);
    return { user, ...tokens };
  }

  async rotateRefreshToken(input: { refreshToken?: string } & Meta) {
    if (!input.refreshToken) throw AppException.unauthorized('Missing refresh token');

    let payload;
    try {
      payload = this.tokens.verifyRefreshToken(input.refreshToken);
    } catch {
      throw AppException.unauthorized('Invalid or expired refresh token');
    }
    if (payload.type !== 'refresh') throw AppException.unauthorized('Invalid token type');

    const session = await this.sessionModel.findOne({
      tokenHash: this.tokens.hashToken(input.refreshToken),
    });
    if (!session) throw AppException.unauthorized('Invalid refresh token');

    // REUSE DETECTION — a revoked token replayed = theft → revoke the family.
    if (session.revokedAt) {
      await this.sessionModel.updateMany(
        { familyId: session.familyId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
      this.logger.warn(`Refresh token reuse detected — session family revoked (user ${session.userId})`);
      throw AppException.unauthorized('Refresh token reuse detected. Please log in again.');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw AppException.unauthorized('Refresh token expired');
    }

    const user = await this.userModel.findById(session.userId);
    if (!user || !user.isActive) throw AppException.unauthorized('Account unavailable');

    session.revokedAt = new Date();
    await session.save();

    const tokens = await this.issueSession(user, session.familyId, input);
    return { user, ...tokens };
  }

  async logout(input: { refreshToken?: string; accessJti?: string; accessExp?: number }) {
    if (input.refreshToken) {
      await this.sessionModel.updateOne(
        { tokenHash: this.tokens.hashToken(input.refreshToken), revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    }

    const redis = this.redisService.getClient();
    if (redis && input.accessJti && input.accessExp) {
      const ttl = input.accessExp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        try {
          await redis.set(`denylist:${input.accessJti}`, '1', 'EX', ttl);
        } catch (err) {
          this.logger.debug(`denylist set failed: ${(err as Error).message}`);
        }
      }
    }
  }

  async logoutAll(input: { userId: string }) {
    const now = new Date();
    await this.userModel.updateOne({ _id: input.userId }, { $set: { revokeAfter: now } });
    await this.sessionModel.updateMany(
      { userId: input.userId, revokedAt: null },
      { $set: { revokedAt: now } },
    );

    const redis = this.redisService.getClient();
    if (redis) {
      const epoch = Math.floor(now.getTime() / 1000) + 1;
      try {
        await redis.set(`revokeAfter:${input.userId}`, String(epoch), 'EX', 7 * 24 * 3600);
      } catch (err) {
        this.logger.debug(`revokeAfter set failed: ${(err as Error).message}`);
      }
    }
  }
}
