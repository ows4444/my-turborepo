import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import crypto from 'crypto';
import { getApiEnv } from '@repo/env';
import { timingSafeEqual } from '../../utils/timing-safe-equal';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();

    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;

    const header = req.headers['x-csrf-token'];
    const cookie = req.cookies['csrf'];

    if (!header || !cookie) {
      throw new ForbiddenException('CSRF_MISSING');
    }

    const secret = getApiEnv().CSRF_SECRET;

    let payload: { token: string; iat: number; exp: number } | null = null;

    try {
      const raw = Buffer.from(cookie, 'base64').toString('utf-8');
      const [json, signature] = raw.split('.');

      if (!json || !signature) {
        throw new ForbiddenException('CSRF_INVALID');
      }

      const expected = crypto.createHmac('sha256', secret).update(json).digest('hex');

      if (!timingSafeEqual(signature, expected)) {
        throw new ForbiddenException('CSRF_INVALID_SIGNATURE');
      }

      payload = JSON.parse(json);
    } catch {
      throw new ForbiddenException('CSRF_INVALID');
    }

    if (!payload?.token) {
      throw new ForbiddenException('CSRF_INVALID');
    }

    const now = Date.now();

    if (now > payload.exp) {
      throw new ForbiddenException('CSRF_EXPIRED');
    }

    if (!timingSafeEqual(payload.token, String(header))) {
      throw new ForbiddenException('CSRF_MISMATCH');
    }

    return true;
  }
}
