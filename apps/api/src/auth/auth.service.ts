import { createHash } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import ms, { type StringValue } from 'ms';

import { randomUUID as uuid } from 'crypto';

import { Session } from './entities/session.entity';

import { UsersService } from '../users/users.service';
import { SessionRepository } from './session.repository';
import { LoginInput, RegisterInput } from '@repo/schemas';

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
      refreshTokenSecret: 'asd',
      refreshTokenTtl: '2h',
    };
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

  private signAccessToken(userId: string, deviceId: string, jti: string) {
    return this.jwtService.signAsync({
      sub: userId,
      deviceId,
      jti,
    });
  }

  private async signRefreshToken(userId: string, deviceId: string) {
    const jti = uuid();

    const token = await this.jwtService.signAsync(
      {
        sub: userId,
        deviceId,
        jti,
      },
      {
        secret: this.config.refreshTokenSecret,
        expiresIn: this.config.refreshTokenTtl,
      },
    );

    return { token, jti };
  }

  getUserDevices(userId: string) {
    const map = new Map<string, Session[]>();

    return Array.from(map.entries())
      .map(([deviceId, sessions]) => {
        const latest = sessions
          .slice()
          .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())[0];

        if (!latest) return null;

        return {
          deviceId,
          deviceName: latest.deviceName,
          userAgent: latest.userAgent,
          ip: latest.ip,
          lastUsedAt: latest.lastUsedAt,
          compromised: sessions.some((s) => s.compromised),
        };
      })
      .filter(Boolean);
  }

  async login(
    dto: LoginInput,
    deviceId: string,
    meta?: {
      userAgent?: string;
      ip?: string;
    },
  ) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!valid) throw new UnauthorizedException();

    return this.createSession(user.id, deviceId, meta);
  }

  async revokeDevice(userId: string, deviceId: string) {
    await this.revokeSession(userId, deviceId);
  }

  private parseDeviceName(ua?: string): string {
    if (!ua) return 'Unknown Device';

    if (ua.includes('Chrome')) return 'Chrome Browser';

    if (ua.includes('Firefox')) return 'Firefox Browser';

    if (ua.includes('Safari')) return 'Safari Browser';

    return 'Unknown Device';
  }

  private isHighRisk(session: Session, meta: DeviceMeta): boolean {
    return this.calculateRisk(session, meta) >= 50;
  }

  private calculateRisk(session: Session, meta: DeviceMeta): number {
    let score = 0;

    if (session.ip && session.ip !== meta.ip) score += 40;

    if (session.userAgent && session.userAgent !== meta.userAgent) score += 30;

    const lastUsedDelta = Date.now() - session.lastUsedAt.getTime();

    if (lastUsedDelta > 1000 * 60 * 60 * 24) score += 20; // idle 1 day

    return score;
  }

  // ---------- SESSION ----------
  private async revokeSession(userId: string, deviceId?: string) {
    await this.sessionRepo.revokeByUser(userId, deviceId);
  }

  private async createSession(
    userId: string,
    deviceId: string,
    meta?: { userAgent?: string; ip?: string },
  ) {
    const { token: refreshToken, jti } = await this.signRefreshToken(
      userId,
      deviceId,
    );
    const accessToken = await this.signAccessToken(userId, deviceId, jti);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const fingerprint = this.generateFingerprint(meta);

    await this.revokeSession(userId, deviceId);

    const session: Session = {
      id: uuid(),
      userId,
      deviceId,
      jti,
      refreshTokenHash,
      userAgent: meta?.userAgent,
      ip: meta?.ip,
      deviceName: this.parseDeviceName(meta?.userAgent),
      fingerprint,
      rotationCounter: 0,
      createdAt: new Date(),
      maxExpiresAt: new Date(Date.now() + ms(this.config.refreshTokenTtl) * 10), // or config-driven
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + ms(this.config.refreshTokenTtl)),
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

  private generateFingerprint(meta?: DeviceMeta) {
    return createHash('sha256')
      .update(`${meta?.userAgent ?? ''}|${meta?.ip ?? ''}`)
      .digest('hex');
  }

  async refreshFromToken(token: string, deviceId: string, meta: DeviceMeta) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        deviceId?: string;
        jti: string;
      }>(token, {
        secret: this.config.refreshTokenSecret,
      });

      const { sub: userId, jti, deviceId: tokenDeviceId } = payload;

      const currentFingerprint = this.generateFingerprint(meta);

      if (tokenDeviceId !== deviceId) {
        throw new UnauthorizedException('Device mismatch');
      }

      const session = await this.findValidSession(userId, deviceId, jti);

      if (!session) {
        await this.revokeSession(userId);

        throw new UnauthorizedException('Token reuse detected');
      }

      if (session.revokedAt) {
        await this.revokeSession(userId);

        throw new UnauthorizedException('Replay detected');
      }

      if (session.rotationCounter > 0) {
        session.compromised = true;
        await this.revokeSession(userId, deviceId);

        throw new UnauthorizedException('Replay detected');
      }

      session.rotationCounter += 1;

      session.lastUsedAt = new Date();
      const nextExpiry = new Date(Date.now() + ms(this.config.refreshTokenTtl));

      session.expiresAt =
        nextExpiry > session.maxExpiresAt ? session.maxExpiresAt : nextExpiry;

      if (this.isHighRisk(session, meta)) {
        session.compromised = true;
        await this.revokeSession(userId, deviceId);

        throw new UnauthorizedException('High risk detected');
      }

      if (session.fingerprint !== currentFingerprint) {
        session.compromised = true;
        await this.revokeSession(userId, deviceId);

        throw new UnauthorizedException('Fingerprint mismatch');
      }

      const valid = await bcrypt.compare(token, session.refreshTokenHash);

      if (!valid) throw new UnauthorizedException();

      session.revokedAt = new Date();

      return this.createSession(userId, deviceId, meta);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
