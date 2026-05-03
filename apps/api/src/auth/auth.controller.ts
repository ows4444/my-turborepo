import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type Request, type Response } from 'express';

import { AuthService } from './auth.service';
import { DeviceService } from './device/device.service';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  type LoginInput,
  type RegisterInput,
  type RefreshInput,
  LoginSchema,
  RegisterSchema,
  RefreshSchema,
} from '@repo/schemas';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly deviceService: DeviceService,
  ) {}

  @Post('login')
  login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = this.deviceService.getOrCreateDeviceId(req, res);
    const meta = this.deviceService.extractMeta(req);

    return this.authService.login(dto, deviceId, meta);
  }

  @Post('register')
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
  refresh(
    @Body(new ZodValidationPipe(RefreshSchema)) dto: RefreshInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = this.deviceService.getOrCreateDeviceId(req, res);
    const meta = this.deviceService.extractMeta(req);

    return this.authService.refreshFromToken(dto.refreshToken, deviceId, meta);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(
    @Req() req: { user: { userId: string; deviceId?: string } },
    @Body('deviceId') deviceId: string,
  ) {
    return this.authService.logout(req.user.userId, deviceId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout-all')
  logoutAll(@Req() req: { user: { userId: string } }) {
    return this.authService.logoutAll(req.user.userId);
  }
}
