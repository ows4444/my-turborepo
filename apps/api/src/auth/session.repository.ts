import { Injectable } from '@nestjs/common';
import { getApiEnv } from '@repo/env';
import { getRedis } from '@repo/redis';
import { Session } from './entities/session.entity';

const PREFIX = 'session';
const USER_INDEX = 'user_sessions';
const DEVICE_INDEX = 'device_sessions';

@Injectable()
export class SessionRepository {
  private redis = getRedis(getApiEnv().REDIS_URL);

  async getUserSessionIds(userId: string): Promise<string[]> {
    return this.redis.smembers(`${USER_INDEX}:${userId}`);
  }

  async revokeByUser(userId: string, deviceId?: string) {
    if (deviceId) {
      return this.revokeDevice(userId, deviceId);
    }

    return this.revokeAll(userId);
  }

  private key(sessionId: string) {
    return `${PREFIX}:${sessionId}`;
  }

  async save(session: Session) {
    const ttl = session.maxExpiresAt.getTime() - Date.now();

    const key = this.key(session.id);

    await this.redis.set(key, JSON.stringify(session), 'PX', ttl);

    await this.redis.sadd(`${USER_INDEX}:${session.userId}`, session.id);

    await this.redis.sadd(
      `${DEVICE_INDEX}:${session.userId}:${session.deviceId}`,
      session.id,
    );
  }

  async touch(jti: string) {
    const raw = await this.redis.get(this.key(jti));
    if (!raw) return;

    const session = JSON.parse(raw) as Session;
    session.lastUsedAt = new Date();

    const ttl = session.maxExpiresAt.getTime() - Date.now();
    if (ttl <= 0) return;

    await this.redis.set(this.key(jti), JSON.stringify(session), 'PX', ttl);
  }

  async rotate(
    sessionId: string,
    expectedVersion: number,
    nextRefreshHash: string,
  ): Promise<number> {
    const session = await this.find(sessionId);

    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }

    if (session.currentVersion !== expectedVersion) {
      throw new Error('STALE_REFRESH');
    }

    const nextVersion = expectedVersion + 1;

    session.currentVersion = nextVersion;

    session.refreshTokenHash = nextRefreshHash;

    session.lastUsedAt = new Date();

    const ttl = session.maxExpiresAt.getTime() - Date.now();

    await this.redis.set(
      this.key(session.id),
      JSON.stringify(session),
      'PX',
      ttl,
    );

    return nextVersion;
  }

  async find(jti: string): Promise<Session | null> {
    const raw = await this.redis.get(this.key(jti));
    if (!raw) return null;

    let s: Session;
    try {
      s = JSON.parse(raw) as Session;
    } catch {
      return null;
    }

    s.createdAt = new Date(s.createdAt);
    s.lastUsedAt = new Date(s.lastUsedAt);
    s.expiresAt = new Date(s.expiresAt);
    s.maxExpiresAt = new Date(s.maxExpiresAt);

    if (s.revokedAt) s.revokedAt = new Date(s.revokedAt);

    return s;
  }

  async revokeAll(userId: string) {
    const jtIs = await this.redis.smembers(`${USER_INDEX}:${userId}`);

    const pipeline = this.redis.pipeline();

    for (const jti of jtIs) {
      pipeline.get(this.key(jti));
    }

    const results = await pipeline.exec();
    if (!results) return;

    const update = this.redis.pipeline();

    for (const [, raw] of results) {
      if (!raw) continue;

      const session = JSON.parse(raw as string) as Session;
      session.revokedAt = new Date();

      const ttl = session.maxExpiresAt.getTime() - Date.now();
      if (ttl > 0) {
        update.set(
          this.key(session.id),
          JSON.stringify(session),
          'PX',
          ttl,
        );
      } else {
        update.del(this.key(session.id));
      }
    }

    update.del(`${USER_INDEX}:${userId}`);

    await update.exec();
  }

  async revokeDevice(userId: string, deviceId: string) {
    const jtIs = await this.redis.smembers(
      `${DEVICE_INDEX}:${userId}:${deviceId}`,
    );

    const pipeline = this.redis.pipeline();

    for (const jti of jtIs) {
      const key = this.key(jti);

      pipeline.get(key);
    }

    const results = await pipeline.exec();
    if (!results) return;

    const update = this.redis.pipeline();

    for (const [, raw] of results) {
      if (!raw) continue;

      const session = JSON.parse(raw as string) as Session;
      session.revokedAt = new Date();

      const ttl = session.maxExpiresAt.getTime() - Date.now();

      if (ttl > 0) {
        update.set(
          this.key(session.id),
          JSON.stringify(session),
          'PX',
          ttl,
        );
      } else {
        update.del(this.key(session.id));
      }

      update.srem(`${USER_INDEX}:${userId}`, session.id);
      update.srem(`${DEVICE_INDEX}:${userId}:${deviceId}`, session.id);
    }

    await update.exec();
  }

  async markCompromised(session: Session) {
    const ttl = session.maxExpiresAt.getTime() - Date.now();

    const updated: Session = {
      ...session,
      compromised: true,
      revokedAt: new Date(),
    };

    if (ttl > 0) {
      await this.redis.set(
        this.key(session.id),
        JSON.stringify(updated),
        'PX',
        ttl,
      );
    } else {
      await this.redis.del(this.key(session.id));
    }
  }

  async delete(jti: string) {
    await this.redis.del(this.key(jti));
  }
}
