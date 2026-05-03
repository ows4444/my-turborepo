import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
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

    // 🔒 decode cookie payload
    let parsed: { token: string } | null = null;
    try {
      const raw = Buffer.from(cookie, 'base64').toString('utf-8');
      const jsonPart = raw.split('.')[0];

      if (!jsonPart) {
        throw new ForbiddenException('CSRF_INVALID');
      }

      parsed = JSON.parse(jsonPart);
    } catch {
      throw new ForbiddenException('CSRF_INVALID');
    }

    if (!parsed?.token) {
      throw new ForbiddenException('CSRF_INVALID');
    }

    const valid = timingSafeEqual(parsed.token, String(header));

    if (!valid) {
      throw new ForbiddenException('CSRF_MISMATCH');
    }

    return true;
  }
}
