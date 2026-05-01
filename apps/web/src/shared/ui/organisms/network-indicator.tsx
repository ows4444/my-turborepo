"use client";

import { useEffect } from "react";

import { onlineManager } from "@tanstack/react-query";

import { emitNotification } from "@/shared/notifications/model/service";

export function NetworkIndicator() {
  useEffect(() => {
    return onlineManager.subscribe((online) => {
      if (!online) {
        emitNotification({ type: "NETWORK_OFFLINE" });
      }
    });
  }, []);

  return null;
}
