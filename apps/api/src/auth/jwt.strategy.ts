import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { getApiEnv } from '@repo/env';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { SessionRepository } from './session.repository';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly sessionRepo: SessionRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getApiEnv().ACCESS_TOKEN_SECRET,
    });
  }
  async validate(payload: JwtPayload) {
    const session = await this.sessionRepo.find(payload.jti);

    if (!session) throw new UnauthorizedException();
    if (session.revokedAt) throw new UnauthorizedException();

    if (session.currentJti !== payload.jti) {
      throw new UnauthorizedException('Stale token');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    if (session.lastUsedAt < new Date(Date.now() - 1000 * 60 * 60 * 24)) {
      throw new UnauthorizedException('Session inactive');
    }

    if (session.userId !== payload.sub) {
      throw new UnauthorizedException();
    }

    if (session.deviceId !== payload.deviceId) {
      throw new UnauthorizedException();
    }

    void this.sessionRepo.touch(session.currentJti);

    return {
      userId: payload.sub,
      deviceId: payload.deviceId,
    };
  }
}
