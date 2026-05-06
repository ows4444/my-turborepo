import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { getApiEnv } from '@repo/env';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionRepository } from './session.repository';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly sessionRepo: SessionRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.cookies?.access_token ?? null;
        },

        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),

      secretOrKey: getApiEnv().ACCESS_TOKEN_SECRET,
      algorithms: ['HS256'],
    });
  }
  async validate(payload: JwtPayload) {
    const session = await this.sessionRepo.find(payload.sessionId);

    if (!session) throw new UnauthorizedException();
    if (session.revokedAt) throw new UnauthorizedException();

    if (session.currentVersion !== payload.version) {
      throw new UnauthorizedException('Stale token');
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

   void this.sessionRepo.touch(session.id);

    return {
      userId: payload.sub,
      deviceId: payload.deviceId,
    };
  }
}
