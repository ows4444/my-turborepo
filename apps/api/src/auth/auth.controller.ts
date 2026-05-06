import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type Request, type Response } from 'express';

import { AuthService } from './auth.service';
import { DeviceService } from './device/device.service';

import {
  type LoginInput,
  type RegisterInput,
  LoginSchema,
  RegisterSchema,
} from '@repo/schemas';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  getAccessCookieConfig,
  getRefreshCookieConfig,
} from './constants/cookies';
import { getApiEnv } from '@repo/env';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly deviceService: DeviceService,
  ) {}

  @Post('login')
  @UseGuards(CsrfGuard)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = this.deviceService.getOrCreateDeviceId(req, res);
    const meta = this.deviceService.extractMeta(req);

    const { user, tokens } = await this.authService.login(dto, deviceId, meta);

    res.cookie('refresh_token', tokens.refreshToken, getRefreshCookieConfig());

    res.cookie('access_token', tokens.accessToken, getAccessCookieConfig());

    return {
      user: {
        id: user.id,
        full_name: user.email,
      },
    };
  }

  @Post('register')
  @UseGuards(CsrfGuard)
  register(
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = this.deviceService.getOrCreateDeviceId(req, res);
    const meta = this.deviceService.extractMeta(req);

    return this.authService.register(dto, deviceId, meta);
  }

  @Post('refresh')
  @UseGuards(CsrfGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = this.deviceService.getOrCreateDeviceId(req, res);

    const token = req.cookies['refresh_token'];
    if (!token) throw new UnauthorizedException();

    const tokens = await this.authService.refreshFromToken(token, deviceId);

    res.cookie('refresh_token', tokens.refreshToken, getRefreshCookieConfig());
    res.cookie('access_token', tokens.accessToken, getAccessCookieConfig());

    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'), CsrfGuard)
  @Post('logout')
  logout(
    @Req() req: { user: { userId: string; deviceId: string } },
    @Res({ passthrough: true }) res: Response,
  ) {

    const cookieConfig = {
      path: '/',
      httpOnly: true,
      secure: getApiEnv().isProd,
      sameSite: getApiEnv().isProd ? ('lax' as const) : ('strict' as const),
    };

    res.clearCookie('refresh_token', cookieConfig);

    res.clearCookie('access_token', cookieConfig);

    return this.authService.logout(req.user.userId, req.user.deviceId);
  }

  @UseGuards(AuthGuard('jwt'), CsrfGuard)
  @Post('logout-all')
  logoutAll(@Req() req: { user: { userId: string } }) {
    return this.authService.logoutAll(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: { user: { userId: string } }) {
    return this.authService.getMe(req.user.userId);
  }
}
