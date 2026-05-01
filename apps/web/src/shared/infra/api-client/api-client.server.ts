import "server-only";

import { apiLogger } from "@/shared/infra/logger/with-context.server";
import { getServerRequestContext } from "@/shared/request/request-context.server";

import { executeRequest } from "./api-client.base";

export async function apiClient<T>(
  path: string,
  options?: RequestInit & { retry?: { retries?: number }; cache?: RequestCache },
) {
  const ctx = await getServerRequestContext();

  const headers: HeadersInit = {
    ...(options?.headers ?? {}),
    ...(ctx ? { "x-request-id": ctx.traceId } : {}),
    ...(ctx?.locale ? { "accept-language": ctx.locale } : {}),
  };

  return executeRequest<T>(path, options, headers, apiLogger);
}
