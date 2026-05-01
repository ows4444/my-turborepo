import { mapEventToNotification } from "./mapper";
import { notificationStore } from "./store";
import { type NotificationEvent } from "./types";

export function emitNotification(event: NotificationEvent) {
  const notification = mapEventToNotification(event);

  if (!notification) return;

  notificationStore.push(notification);
}
