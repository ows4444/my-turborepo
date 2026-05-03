import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { JwtPayload } from "./types/jwt-payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>("auth.accessTokenSecret"),
    });
  }

  validate(payload: JwtPayload): { userId: string; deviceId?: string } {
    if (!payload?.sub) {
      throw new UnauthorizedException("Invalid JWT payload");
    }

    if (!payload.deviceId) throw new UnauthorizedException("Invalid JWT payload");

    return {
      userId: payload.sub,
      deviceId: payload.deviceId,
    };
  }
}
