"use client";

import { useEffect } from "react";

import { setCsrfToken } from "@/shared/security/csrf.client";

export function CsrfProvider({ token, children }: { token: string | null; children: React.ReactNode }) {
  if (token) {
    setCsrfToken(token);
  }

  useEffect(() => {
    if (token) {
      setCsrfToken(token);
    }
  }, [token]);

  return children;
}
