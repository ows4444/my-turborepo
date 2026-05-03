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

  private key(jti: string) {
    return `${PREFIX}:${jti}`;
  }

  async save(session: Session) {
    const ttl = session.maxExpiresAt.getTime() - Date.now();

    const key = this.key(session.currentJti);

    await this.redis.set(key, JSON.stringify(session), 'PX', ttl);

    await this.redis.sadd(
      `${USER_INDEX}:${session.userId}`,
      session.currentJti,
    );

    await this.redis.sadd(
      `${DEVICE_INDEX}:${session.userId}:${session.deviceId}`,
      session.currentJti,
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
    session: Session,
    data: {
      newJti: string;
      newRefreshTokenHash: string;
    },
  ) {
    const oldJti = session.currentJti;
    const oldKey = this.key(oldJti);

    const ttl = session.maxExpiresAt.getTime() - Date.now();
    if (ttl <= 0) {
      throw new Error('Session expired during rotation');
    }

    const updated: Session = {
      ...session,
      previousJti: oldJti,
      currentJti: data.newJti,
      refreshTokenHash: data.newRefreshTokenHash,
      lastUsedAt: new Date(),
    };

    const newKey = this.key(data.newJti);

    const pipeline = this.redis.pipeline();

    // remove old token
    pipeline.del(oldKey);

    // write new token
    pipeline.set(newKey, JSON.stringify(updated), 'PX', ttl);

    // update indexes
    pipeline.srem(`${USER_INDEX}:${session.userId}`, oldJti);
    pipeline.sadd(`${USER_INDEX}:${session.userId}`, data.newJti);

    pipeline.srem(
      `${DEVICE_INDEX}:${session.userId}:${session.deviceId}`,
      oldJti,
    );
    pipeline.sadd(
      `${DEVICE_INDEX}:${session.userId}:${session.deviceId}`,
      data.newJti,
    );

    await pipeline.exec();
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
          this.key(session.currentJti),
          JSON.stringify(session),
          'PX',
          ttl,
        );
      } else {
        update.del(this.key(session.currentJti));
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
          this.key(session.currentJti),
          JSON.stringify(session),
          'PX',
          ttl,
        );
      } else {
        update.del(this.key(session.currentJti));
      }

      update.srem(`${USER_INDEX}:${userId}`, session.currentJti);
      update.srem(`${DEVICE_INDEX}:${userId}:${deviceId}`, session.currentJti);
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
        this.key(session.currentJti),
        JSON.stringify(updated),
        'PX',
        ttl,
      );
    } else {
      await this.redis.del(this.key(session.currentJti));
    }
  }

  async delete(jti: string) {
    await this.redis.del(this.key(jti));
  }
}
