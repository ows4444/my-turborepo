import { type Notification, type NotificationEvent } from "./types";

export function mapEventToNotification(event: NotificationEvent): Notification | null {
  switch (event.type) {
    case "AUTH_LOGIN_SUCCESS":
      return {
        id: "auth.success",
        message: "Welcome back",
        level: "success",
        dedupeKey: "auth.success",
        ttl: 3000,
        createdAt: Date.now(),
      };

    case "AUTH_LOGIN_FAILED":
      return {
        id: "auth.failed",
        message: "Invalid credentials",
        level: "error",
        ttl: 4000,
        createdAt: Date.now(),
      };

    case "NETWORK_OFFLINE":
      return {
        id: "network.offline",
        message: "You are offline",
        level: "warning",
        dedupeKey: "network",
        ttl: 5000,
        createdAt: Date.now(),
      };

    case "UNKNOWN_ERROR":
      return {
        id: "unknown.error",
        message: "Something went wrong",
        level: "error",
        ttl: 4000,
        createdAt: Date.now(),
      };

    default:
      return null;
  }
}
