export type Session = {
  id: string;

  userId: string;
  deviceId: string;

  currentVersion: number;


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
