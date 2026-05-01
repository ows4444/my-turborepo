export type NotificationLevel = "info" | "success" | "error" | "warning";

export type NotificationEvent =
  | { type: "AUTH_LOGIN_SUCCESS"; userId: string }
  | { type: "AUTH_LOGIN_FAILED" }
  | { type: "NETWORK_OFFLINE" }
  | { type: "UNKNOWN_ERROR" };

export type Notification = {
  id: string;
  message: string;
  level: NotificationLevel;
  dedupeKey?: string;
  ttl?: number;
  createdAt: number;
};
