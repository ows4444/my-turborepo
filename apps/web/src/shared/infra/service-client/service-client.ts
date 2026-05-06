import "server-only";

import { HttpError } from "@/shared/core/errors";
import { mapToDomainError } from "@/shared/core/errors/error-mapper";
import { normalizeError } from "@/shared/core/errors/normalize";
import { apiLogger } from "@/shared/infra/logger/with-context.server";

import { refreshAccessToken } from "@/shared/server/auth/refresh-manager";
import { RequestAuthContext } from "@/shared/server/auth/request-auth-context";
import { rawServiceClient } from "./raw-service-client";

export type ServiceName = "AUTH" | "API";

export async function serviceClient<T>(
  service: ServiceName,
  path: string,
  options: RequestInit = {},
  didRetry = false,
): Promise<{ data: T; headers: Headers; status: number; statusText: string }> {
  const start = Date.now();

  const authContext = await RequestAuthContext.create();

  if (didRetry) {
    apiLogger.warn("SERVICE_CLIENT_RETRY_ATTEMPT", { service, path });
  }

  try {
    /**
     * First authenticated attempt
     */
    let response = await rawServiceClient<T>(
      service,
      path,
      options,
      authContext,
    );

    /**
     * ONLY retry once after refresh
     */

    if (response.status === 401 && path !== "/auth/refresh" && !didRetry) {
      apiLogger.info("ACCESS_TOKEN_REFRESH_REQUIRED", {
        service,
        path,
      });

      const refreshed = await refreshAccessToken(authContext);

      if (!refreshed) {
        throw new HttpError(401, "SESSION_REFRESH_FAILED");
      }

      /**
       * Retry original request once
       */
      response = await rawServiceClient<T>(service, path, options, authContext);
    }

    /**
     * Upstream failure normalization
     */
    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        typeof response.data === "object" &&
          response.data &&
          "error" in response.data
          ? String(response.data.error)
          : "SERVICE_ERROR",
      );
    }

    return response;
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
