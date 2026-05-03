import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),

    userId: text("user_id").notNull(),
    deviceId: text("device_id").notNull(),

    jti: text("jti").notNull().unique(),

    refreshTokenHash: text("refresh_token_hash").notNull(),

    userAgent: text("user_agent"),
    ip: text("ip"),
    deviceName: text("device_name").notNull(),

    fingerprint: text("fingerprint").notNull(),

    rotationCounter: integer("rotation_counter").notNull().default(0),
    compromised: boolean("compromised").default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull(),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    maxExpiresAt: timestamp("max_expires_at", { withTimezone: true }).notNull(),

    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (session) => [
    index("sessions_user_id_idx").on(session.userId),
    index("sessions_device_id_idx").on(session.deviceId),
    index("sessions_jti_idx").on(session.jti),
  ],
);
