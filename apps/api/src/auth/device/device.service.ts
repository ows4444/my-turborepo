import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

import {getApiEnv} from "@repo/env"

import { randomUUID as uuid } from 'crypto';

const DEVICE_COOKIE = 'device_id';

export type DeviceMeta = {
  userAgent?: string;
  ip?: string;
};

@Injectable()
export class DeviceService {
  getOrCreateDeviceId(req: Request, res: Response): string {
    let deviceId = String(req.signedCookies?.[DEVICE_COOKIE]);

    if (!deviceId) {
      deviceId = uuid();

      res.cookie(DEVICE_COOKIE, deviceId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: getApiEnv().isProd,
        signed: true,
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 365,
      });
    }

    return deviceId;
  }

  extractMeta(req: Request): DeviceMeta {
    return {
      userAgent: req.headers['user-agent'],
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      ip:
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        req.ip,
    };
  }
}
