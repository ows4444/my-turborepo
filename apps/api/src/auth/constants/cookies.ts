import { getApiEnv } from '@repo/env';
import ms, { StringValue } from 'ms';

export function getRefreshCookieConfig() {
  const env = getApiEnv();

  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? ('lax' as const) : ('strict' as const),
    path: '/',
    maxAge: ms(env.REFRESH_TOKEN_TTL as StringValue),
  };
}
