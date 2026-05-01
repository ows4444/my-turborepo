import { getWebEnv } from "@repo/env";

export const SERVICES = {
  AUTH: getWebEnv ().AUTH_SERVICE_URL,
  API: getWebEnv().API_SERVICE_URL,
} as const;

if (!SERVICES.AUTH || !SERVICES.API) {
  throw new Error("Missing required service URLs");
}
