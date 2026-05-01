import { baseLogger } from "./logger.server";
import { serializeMeta } from "./serializer";

function withContext(baseCtx: Record<string, unknown>) {
  const logger = baseLogger.child(baseCtx);

  return {
    debug: (msg: string, meta?: Record<string, unknown>) => {
      logger.debug({ ...serializeMeta(meta) }, msg);
    },

    info: (msg: string, meta?: Record<string, unknown>) => {
      logger.info({ ...serializeMeta(meta) }, msg);
    },

    warn: (msg: string, meta?: Record<string, unknown>) => {
      logger.warn({ ...serializeMeta(meta) }, msg);
    },

    error: (msg: string, meta?: Record<string, unknown>) => {
      logger.error({ ...serializeMeta(meta) }, msg);
    },
  };
}

export const apiLogger = withContext({ scope: "api" });
export const appLogger = withContext({ scope: "app" });
export const routeLogger = withContext({ scope: "route" });
