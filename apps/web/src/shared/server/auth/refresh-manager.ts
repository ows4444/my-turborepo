import "server-only";

import { cookies } from "next/headers";
import { apiLogger } from "@/shared/infra/logger/with-context.server";
import { rawServiceClient } from "@/shared/infra/service-client/raw-service-client";
import { extractSetCookies } from "./extract-set-cookie";
import { RequestAuthContext } from "./request-auth-context";

/**
 * Refresh dedupe MUST be scoped per-session.
 *
 * Global promise sharing causes:
 * - cross-user auth corruption
 * - leaked refresh state
 * - race conditions
 */

const refreshLocks = new Map<string, Promise<boolean>>();

function buildRefreshKey(
  refreshToken: string | undefined,
  deviceId: string | undefined,
) {
  return `${refreshToken ?? "none"}:${deviceId ?? "none"}`;
}

async function executeRefresh(
  authContext: RequestAuthContext,
): Promise<boolean> {
  try {
    apiLogger.info("ACCESS_TOKEN_REFRESH_START");
    /**
     * IMPORTANT:
     * refresh must NEVER use authenticated service client
     * otherwise refresh recursion can occur.
     */
    const res = await rawServiceClient(
      "AUTH",
      "/auth/refresh",
      {
        method: "POST",
      },
      authContext,
    );

    const cookies = extractSetCookies(res.headers);

    for (const cookie of cookies) {
      authContext.setCookie(cookie.name, cookie.value);
    }
    apiLogger.info("ACCESS_TOKEN_REFRESH_SUCCESS");
    return res.status === 200;
  } catch (error) {
    apiLogger.error("ACCESS_TOKEN_REFRESH_FAILED", { error });
    return false;
  }
}

export async function refreshAccessToken(
  authContext: RequestAuthContext,
): Promise<boolean> {
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get("refresh_token")?.value;
  const deviceId = cookieStore.get("device_id")?.value;

  const key = buildRefreshKey(refreshToken, deviceId);

  const existing = refreshLocks.get(key);

  if (existing) {
    return existing;
  }

  const promise = executeRefresh(authContext).finally(() => {
    refreshLocks.delete(key);
  });

  refreshLocks.set(key, promise);

  return promise;
}
