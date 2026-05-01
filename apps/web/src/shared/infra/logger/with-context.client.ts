import { baseLogger } from "./logger.client";

function withContext(baseCtx: Record<string, unknown>) {
  return baseLogger.child(baseCtx);
}

export const apiLogger = withContext({ scope: "api" });
export const appLogger = withContext({ scope: "app" });
export const uiLogger = withContext({ scope: "ui" });
