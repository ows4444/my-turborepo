"use client";

import { memo } from "react";

import { CsrfProvider } from "@/providers/csrf-provider";
import { QueryProvider } from "@/providers/query-provider";
import { UIProvider } from "@/providers/ui-provider";
import { NotificationRenderer } from "@/shared/notifications/ui/notification-renderer";
import { NetworkIndicator } from "@/shared/ui/organisms/network-indicator";

export function ClientProviders({
  children,
  csrfToken,
}: Readonly<{ children: React.ReactNode; csrfToken: string | null }>) {
  return (
    <QueryProvider>
      <CsrfProvider token={csrfToken}>
        <UIProvider>{children}</UIProvider>

        <NetworkIndicator />
        <NotificationRenderer />
      </CsrfProvider>
    </QueryProvider>
  );
}

export default memo(ClientProviders);
