export type Session = {
  id: string;
  userId: string;
  deviceId: string;
  jti: string;
  refreshTokenHash: string;
  userAgent?: string;
  deviceName: string;
  ip?: string;
  lastUsedAt: Date;
  createdAt: Date;
  fingerprint: string;
  compromised?: boolean;
  expiresAt: Date;
  rotationCounter: number;
  maxExpiresAt: Date;
  revokedAt?: Date;
};
