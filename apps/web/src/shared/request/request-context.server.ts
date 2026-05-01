import "server-only";

import { cookies, headers } from "next/headers";

import { cache } from "react";

export const getServerRequestContext = cache(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  const traceId =
    headerStore.get("x-request-id") ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : (() => {
          throw new Error("crypto.randomUUID is not supported in this environment");
        })());

  return {
    traceId,
    locale: cookieStore.get("locale")?.value ?? null,
  };
});
