import { apiLogger } from "@/shared/infra/logger/with-context.client";
import { getClientRequestContext } from "@/shared/request/request-context.client";
import { getCsrfToken } from "@/shared/security/csrf.client";

import { executeRequest } from "./api-client.base";

export async function apiClient<T>(
  path: string,
  options?: RequestInit & { retry?: { retries?: number }; cache?: RequestCache },
) {
  const ctx = getClientRequestContext();

  const csrfToken = getCsrfToken();

  const headers: HeadersInit = {
    ...(options?.headers ?? {}),
    ...(ctx ? { "x-request-id": ctx.traceId } : {}),
    ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
  };

  return executeRequest<T>(`/api${path}`, options, headers, apiLogger);
}
