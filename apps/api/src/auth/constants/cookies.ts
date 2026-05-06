import { getApiEnv } from '@repo/env';
import ms, { StringValue } from 'ms';

function baseCookieConfig() {
  const env = getApiEnv();

  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? ('lax' as const) : ('strict' as const),
    path: '/',
  };
}

export function getRefreshCookieConfig() {
  const env = getApiEnv();

  return {
    ...baseCookieConfig(),

    maxAge: ms(env.REFRESH_TOKEN_TTL as StringValue),

    priority: 'high' as const,
  };
}

export function getAccessCookieConfig() {
  const env = getApiEnv();

  return {
    ...baseCookieConfig(),

    maxAge: ms(env.ACCESS_TOKEN_TTL as StringValue),

    priority: 'high' as const,
  };
}
