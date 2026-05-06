import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getApiEnv } from '@repo/env';
import bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import ms, { type StringValue } from 'ms';

import { randomUUID as uuid } from 'crypto';

import { Session } from './entities/session.entity';

import { LoginInput, RegisterInput } from '@repo/schemas';
import { UsersService } from '../users/users.service';
import { SessionRepository } from './session.repository';

type DeviceMeta = {
  userAgent?: string;
  ip?: string;
};

@Injectable()
export class AuthService {
  private config: { refreshTokenTtl: StringValue; refreshTokenSecret: string };
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionRepo: SessionRepository,
  ) {
    this.config = {
      refreshTokenSecret: getApiEnv().REFRESH_TOKEN_SECRET,
      refreshTokenTtl: getApiEnv().REFRESH_TOKEN_TTL as StringValue,
    };
  }

  private async signAccessToken(
    userId: string,
    sessionId: string,
    deviceId: string,
    version: number,
  ) {
    return this.jwtService.signAsync(
      { sub: userId, sessionId, deviceId, version },
      {
        secret: getApiEnv().ACCESS_TOKEN_SECRET,
        expiresIn: getApiEnv().ACCESS_TOKEN_TTL as StringValue,
      },
    );
  }

  private async signRefreshToken(
    userId: string,
    sessionId: string,
    deviceId: string,
    version: number,
  ) {
    return this.jwtService.signAsync(
      { sub: userId, sessionId, deviceId, version },
      {
        secret: this.config.refreshTokenSecret,
        expiresIn: this.config.refreshTokenTtl,
      },
    );
  }

  async register(
    dto: RegisterInput,
    deviceId: string,
    meta?: {
      userAgent?: string;
      ip?: string;
    },
  ) {
    const exists = await this.usersService.findByEmail(dto.email);

    if (exists) throw new UnauthorizedException('User already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      id: uuid(),
      email: dto.email,
      passwordHash,
    });

    return this.createSession(user.id, deviceId, meta);
  }

  async getUserDevices(userId: string) {
    const jtIs = await this.sessionRepo.getUserSessionIds(userId);

    const sessions = await Promise.all(
      jtIs.map((jti) => this.sessionRepo.find(jti)),
    );

    return sessions
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map((s) => ({
        deviceId: s.deviceId,
        userAgent: s.userAgent,
        ip: s.ip,
        lastUsedAt: s.lastUsedAt,
      }));
  }

  async login(
    dto: LoginInput,
    deviceId: string,
    meta?: {
      userAgent?: string;
      ip?: string;
    },
  ) {
    const email = dto.identifier;
    const user = await this.usersService.findByEmail(email);

    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!valid) throw new UnauthorizedException();

    const tokens = await this.createSession(user.id, deviceId, meta);

    return { user, tokens };
  }

  async revokeDevice(userId: string, deviceId: string) {
    await this.revokeSession(userId, deviceId);
  }

  // ---------- SESSION ----------
  private async revokeSession(userId: string, deviceId?: string) {
    await this.sessionRepo.revokeByUser(userId, deviceId);
  }

  private async createSession(
    userId: string,
    deviceId: string,
    meta?: DeviceMeta,
  ) {
    const sessionId = uuid();

    const version = 1;

    const refreshToken = await this.signRefreshToken(
      userId,
      sessionId,
      deviceId,
      version,
    );

    const accessToken = await this.signAccessToken(
      userId,
      sessionId,
      deviceId,
      version,
    );

    const session: Session = {
      id: sessionId,
      userId,
      deviceId,

      currentVersion: version,

      refreshTokenHash: createHash('sha256').update(refreshToken).digest('hex'),

      userAgent: meta?.userAgent,
      ip: meta?.ip,

      createdAt: new Date(),
      lastUsedAt: new Date(),

      expiresAt: new Date(Date.now() + ms(this.config.refreshTokenTtl)),
      maxExpiresAt: new Date(Date.now() + ms(this.config.refreshTokenTtl) * 7),
    };

    await this.sessionRepo.save(session);

    return { accessToken, refreshToken };
  }

  // ---------- LOGOUT ----------
  async logout(userId: string, deviceId: string) {
    await this.revokeSession(userId, deviceId);
  }

  async logoutAll(userId: string) {
    await this.revokeSession(userId);
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      user: {
        id: user.id,
        full_name: user.email,
      },
    };
  }

  private async findValidSession(
    userId: string,
    deviceId: string,
    jti: string,
  ): Promise<Session | undefined> {
    const session = await this.sessionRepo.find(jti);

    if (!session) return undefined;

    if (session.userId !== userId) return undefined;

    if (session.deviceId !== deviceId) return undefined;

    if (session.revokedAt) return undefined;

    if (session.expiresAt <= new Date()) return undefined;

    return session;
  }

  async refreshFromToken(token: string, deviceId: string) {
    let payload: {
      sub: string;
      sessionId: string;
      deviceId: string;
      version: number;
    };

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const {
      sub: userId,
      sessionId,
      version,
      deviceId: tokenDeviceId,
    } = payload;

    const session = await this.sessionRepo.find(sessionId);
    if (!session) throw new UnauthorizedException();

    if (session.revokedAt) throw new UnauthorizedException();

    if (session.expiresAt < new Date()) {
      await this.sessionRepo.revokeAll(userId);
      throw new UnauthorizedException();
    }

    if (session.deviceId !== deviceId || tokenDeviceId !== deviceId) {
      await this.sessionRepo.markCompromised(session);
      await this.sessionRepo.revokeAll(userId);
      throw new UnauthorizedException();
    }

    if (session.maxExpiresAt < new Date()) {
      await this.sessionRepo.revokeAll(userId);
      throw new UnauthorizedException();
    }

    if (session.currentVersion !== version) {
      throw new UnauthorizedException('STALE_REFRESH_TOKEN');
    }

    const hash = createHash('sha256').update(token).digest('hex');

    if (hash !== session.refreshTokenHash) {
      await this.sessionRepo.markCompromised(session);
      await this.sessionRepo.revokeAll(userId);
      throw new UnauthorizedException();
    }

    // 🔁 ROTATE
    const nextVersion = version + 1;

    const newRefreshToken = await this.signRefreshToken(
      userId,
      session.id,
      deviceId,
      nextVersion,
    );

    const newAccess = await this.signAccessToken(
      userId,
      session.id,
      deviceId,
      nextVersion,
    );

    await this.sessionRepo.rotate(
      session.id,
      version,
      createHash('sha256').update(newRefreshToken).digest('hex'),
    );

    return {
      accessToken: newAccess,
      refreshToken: newRefreshToken,
    };
  }
}
