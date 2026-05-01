import { AppError, NetworkError, SessionExpiredError } from "@/shared/core/errors";

import { type NotificationEvent } from "./types";

export function mapErrorToEvent(error: unknown): NotificationEvent {
  if (error instanceof SessionExpiredError) {
    return { type: "UNKNOWN_ERROR" };
  }

  if (error instanceof NetworkError) {
    return { type: "NETWORK_OFFLINE" };
  }

  if (error instanceof AppError) {
    return { type: "UNKNOWN_ERROR" };
  }

  return { type: "UNKNOWN_ERROR" };
}
