export type Session = {
  id: string;
  userId: string;
  deviceId: string;

  currentJti: string;
  previousJti?: string;

  refreshTokenHash: string;

  userAgent?: string;
  ip?: string;

  compromised?: boolean;

  createdAt: Date;
  lastUsedAt: Date;

  expiresAt: Date;
  maxExpiresAt: Date;

  revokedAt?: Date;
};
