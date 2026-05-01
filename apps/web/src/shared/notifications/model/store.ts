type Listener = () => void;

import { type Notification } from "./types";

class NotificationStore {
  private queue: Notification[] = [];

  private listeners: Listener[] = [];

  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  push(notification: Notification) {
    if (notification.dedupeKey && this.queue.some((n) => n.dedupeKey === notification.dedupeKey)) {
      return; // ✅ deterministic dedupe
    }

    const id = `${notification.id}_${Date.now()}`;

    const enriched: Notification = {
      ...notification,
      id,
    };

    this.queue = [...this.queue, enriched];
    this.emit();

    if (notification.ttl) {
      const timer = setTimeout(() => {
        this.remove(id);
        this.timers.delete(id);
      }, notification.ttl);

      this.timers.set(id, timer);
    }
  }

  remove(id: string) {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);

    this.queue = this.queue.filter((n) => n.id !== id);
    this.emit();
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getState() {
    return this.queue;
  }

  private emit() {
    this.listeners.forEach((l) => {
      l();
    });
  }
}

export const notificationStore = new NotificationStore();
