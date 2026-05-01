"use client";

import ClientProviders from "@/providers/providers.client";
import { ThemeProvider } from "@/providers/theme-provider";
import { type Theme } from "@/shared/theme";

export function Providers({
  children,
  initialTheme,
  csrfToken,
}: Readonly<{
  children: React.ReactNode;
  initialTheme: Theme;
  csrfToken: string | null;
}>) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <ClientProviders csrfToken={csrfToken}>{children}</ClientProviders>
    </ThemeProvider>
  );
}
