import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { TokenService } from '../infra/tokens/token.service';
import { User, UserDocument, toSafeUser } from '../schemas/user.schema';
import { AppException } from '../common/exceptions/app.exception';
import { APP_CONFIG, Env } from '../config/env.validation';

const REFRESH_COOKIE = 'refreshToken';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(APP_CONFIG) private readonly config: Env,
  ) {}

  private cookieOpts(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.COOKIE_SECURE,
      sameSite: this.config.COOKIE_SECURE ? 'none' : 'lax',
      domain: this.config.COOKIE_DOMAIN || undefined,
      path: '/api/auth',
      maxAge: 7 * 24 * 3600 * 1000,
    };
  }

  private clearOpts(): CookieOptions {
    const { maxAge, ...rest } = this.cookieOpts();
    return rest;
  }

  private meta(req: Request) {
    return { userAgent: req.headers['user-agent'] || '', ip: req.ip };
  }

  private bearer(req: Request): string | null {
    const header = req.headers.authorization || '';
    return header.startsWith('Bearer ') ? header.slice(7) : null;
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.auth.register({ ...dto, ...this.meta(req) });
    res.cookie(REFRESH_COOKIE, refreshToken, this.cookieOpts());
    return { user: toSafeUser(user), accessToken };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.auth.login({ ...dto, ...this.meta(req) });
    res.cookie(REFRESH_COOKIE, refreshToken, this.cookieOpts());
    return { user: toSafeUser(user), accessToken };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    const result = await this.auth.rotateRefreshToken({ refreshToken, ...this.meta(req) });
    res.cookie(REFRESH_COOKIE, result.refreshToken, this.cookieOpts());
    return { user: toSafeUser(result.user), accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    const accessToken = this.bearer(req);
    let accessJti: string | undefined;
    let accessExp: number | undefined;
    if (accessToken) {
      try {
        const p = this.tokens.verifyAccessToken(accessToken);
        accessJti = p.jti;
        accessExp = p.exp;
      } catch {
        /* expired/invalid — still revoke the refresh session */
      }
    }
    await this.auth.logout({ refreshToken, accessJti, accessExp });
    res.clearCookie(REFRESH_COOKIE, this.clearOpts());
    return { success: true };
  }

  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll({ userId: user.id });
    res.clearCookie(REFRESH_COOKIE, this.clearOpts());
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    const found = await this.userModel.findById(user.id);
    if (!found) throw AppException.notFound('User not found');
    return { user: toSafeUser(found) };
  }
}
