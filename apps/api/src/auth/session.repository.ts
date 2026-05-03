import { Injectable } from '@nestjs/common';
import { getApiEnv } from '@repo/env';
import { getRedis } from '@repo/redis';
import { Session } from './entities/session.entity';

const PREFIX = 'session';

@Injectable()
export class SessionRepository {
  private redis = getRedis(getApiEnv().REDIS_URL);

  private key(jti: string) {
    return `${PREFIX}:${jti}`;
  }

  async save(session: Session) {
    await this.redis.set(
      this.key(session.jti),
      JSON.stringify(session),
      'PX',
      session.expiresAt.getTime() - Date.now(),
    );
  }

  async find(jti: string): Promise<Session | null> {
    const raw = await this.redis.get(this.key(jti));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Session;

    // restore dates
    parsed.createdAt = new Date(parsed.createdAt);
    parsed.expiresAt = new Date(parsed.expiresAt);
    parsed.lastUsedAt = new Date(parsed.lastUsedAt);
    parsed.maxExpiresAt = new Date(parsed.maxExpiresAt);
    parsed.revokedAt = parsed.revokedAt
      ? new Date(parsed.revokedAt)
      : undefined;

    return parsed;
  }

  async delete(jti: string) {
    await this.redis.del(this.key(jti));
  }

  async revokeByUser(userId: string, deviceId?: string) {
    const stream = this.redis.scanStream({ match: `${PREFIX}:*` });

    for await (const keys of stream) {
      for (const key of keys) {
        const raw = await this.redis.get(key);
        if (!raw) continue;

        const session = JSON.parse(raw) as Session;

        if (session.userId !== userId) continue;
        if (deviceId && session.deviceId !== deviceId) continue;

        session.revokedAt = new Date();

        await this.redis.set(key, JSON.stringify(session));
      }
    }
  }
}
