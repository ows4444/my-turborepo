import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { getApiEnv } from '@repo/env';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getApiEnv().ACCESS_TOKEN_SECRET,
    });
  }

  validate(payload: JwtPayload): { userId: string; deviceId?: string } {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    if (!payload.deviceId)
      throw new UnauthorizedException('Invalid JWT payload');

    return {
      userId: payload.sub,
      deviceId: payload.deviceId,
    };
  }
}
