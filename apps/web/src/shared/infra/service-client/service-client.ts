import "server-only";

import { headers } from "next/headers";

import { getWebEnv } from "@repo/env";
import { HttpError } from "@/shared/core/errors";
import { mapToDomainError } from "@/shared/core/errors/error-mapper";
import { normalizeError } from "@/shared/core/errors/normalize";
import { apiLogger } from "@/shared/infra/logger/with-context.server";

type ServiceName = "AUTH" | "API";

function resolveServiceUrl(service: ServiceName) {
  switch (service) {
    case "AUTH":
      return getWebEnv().AUTH_SERVICE_URL;
    case "API":
      return getWebEnv().API_SERVICE_URL;
  }
}

export async function serviceClient<T>(
  service: ServiceName,
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; headers: Headers; status: number; statusText: string }> {
  const start = Date.now();

  try {
    const headerStore = await headers();

    const cookie = headerStore.get("cookie");

    const csrf = headerStore.get("x-csrf-token");

    const traceId = headerStore.get("x-request-id");

    const res = await fetch(`${resolveServiceUrl(service)}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
        ...(traceId ? { "x-request-id": traceId } : {}),
        ...(csrf ? { "x-csrf-token": csrf } : {}),
        ...(cookie ? { cookie: cookie } : {}),
      },
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    });

    const contentType = res.headers.get("content-type") ?? "";

    if (!res.ok) {
      apiLogger.error("SERVICE_ERROR", {
        service,
        path,
        status: res.status,
        duration: Date.now() - start,
      });

      if (contentType.includes("application/json")) {
        const json = await res.json().catch(() => null);
        throw new HttpError(res.status, json?.message ?? "SERVICE_ERROR");
      }

      const text = await res.text();
      throw new HttpError(res.status, text || "SERVICE_ERROR");
    }

    let data: unknown;

    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return {
      data: data as T,
      headers: res.headers,
      status: res.status,
      statusText: res.statusText,
    };
  } catch (err) {
    apiLogger.error("SERVICE_FAILURE", {
      service,
      path,
      duration: Date.now() - start,
      error: normalizeError(err),
    });

    throw mapToDomainError(err);
  }
}
