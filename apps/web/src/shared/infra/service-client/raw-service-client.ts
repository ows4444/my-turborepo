import "server-only";

import { headers } from "next/headers";

import { getWebEnv } from "@repo/env";

import { createAbortSignal } from "../api-client/abort/abort";
import { RequestAuthContext } from "@/shared/server/auth/request-auth-context";

type ServiceName = "AUTH" | "API";

function resolveServiceUrl(service: ServiceName) {
  switch (service) {
    case "AUTH":
      return getWebEnv().AUTH_SERVICE_URL;

    case "API":
      return getWebEnv().API_SERVICE_URL;
  }
}

export async function rawServiceClient<T>(
  service: ServiceName,
  path: string,
  options: RequestInit = {},
  authContext?: RequestAuthContext,
): Promise<{
  data: T;
  headers: Headers;
  status: number;
  statusText: string;
}> {
  const headerStore = await headers();

  const traceId = headerStore.get("x-request-id");

  const response = await fetch(`${resolveServiceUrl(service)}${path}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(options.headers ?? {}),

      ...(traceId
        ? {
            "x-request-id": traceId,
          }
        : {}),

      ...(authContext?.getCookieHeader()
        ? {
            cookie: authContext.getCookieHeader(),
          }
        : {}),
    },

    signal: createAbortSignal({
      timeout: 10000,
    }),
  });

  const contentType = response.headers.get("content-type") ?? "";

  let data: unknown;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    data: data as T,
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  };
}
