"use client";

import { useEffect, useState } from "react";

import { notificationStore } from "../model/store";

export function NotificationRenderer() {
  const [notifications, setNotifications] = useState(notificationStore.getState());

  useEffect(() => {
    return notificationStore.subscribe(() => {
      setNotifications([...notificationStore.getState()]);
    });
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2" role="status" aria-live="polite">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`rounded-md px-4 py-2 text-sm shadow ${
            n.level === "success"
              ? "bg-green-500 text-white"
              : n.level === "error"
                ? "bg-red-500 text-white"
                : n.level === "warning"
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-800 text-white"
          }`}
          onClick={() => {
            notificationStore.remove(n.id);
          }}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
