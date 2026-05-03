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
import { getRefreshCookieConfig } from './constants/cookies';

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

    return {
      user: {
        id: user.id,
        full_name: user.email,
      },
      accessToken: tokens.accessToken,
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

    return { accessToken: tokens.accessToken };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @UseGuards(CsrfGuard)
  logout(
    @Req() req: { user: { userId: string; deviceId: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('refresh_token', {
      path: '/',
    });

    return this.authService.logout(req.user.userId, req.user.deviceId);
  }

  @UseGuards(AuthGuard('jwt'))
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
