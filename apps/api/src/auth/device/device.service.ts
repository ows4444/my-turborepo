import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

import { getApiEnv } from '@repo/env';

import { randomUUID as uuid } from 'crypto';

const DEVICE_COOKIE = 'device_id';

export type DeviceMeta = {
  userAgent?: string;
  ip?: string;
};

@Injectable()
export class DeviceService {
  getOrCreateDeviceId(req: Request, res: Response): string {
    let deviceId = req.signedCookies?.[DEVICE_COOKIE];

    if (!deviceId || deviceId === 'undefined') {
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
      userAgent:
        typeof req.headers['user-agent'] === 'string'
          ? req.headers['user-agent'].slice(0, 512)
          : undefined,

      ip:
        typeof req.headers['x-forwarded-for'] === 'string'
          ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
          : req.ip,
    };
  }
}
