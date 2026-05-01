import { serializeMeta } from "./serializer";

function log(level: string, msg: string, meta?: Record<string, unknown>) {
  const payload = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...serializeMeta(meta),
  };

  if (process.env.NODE_ENV === "development") {
    const method = resolveConsoleMethod(level);

    // eslint-disable-next-line no-console
    console[method as "log"]?.(payload);

    return;
  }

  const method = resolveConsoleMethod(level);

  // eslint-disable-next-line no-console
  console[method as "log"]?.(payload);
}

function resolveConsoleMethod(level: string): "log" | "info" | "warn" | "error" {
  switch (level) {
    case "error":
      return "error";
    case "warn":
      return "warn";
    case "info":
      return "info";
    default:
      return "log";
  }
}

export const baseLogger = {
  child: (ctx: Record<string, unknown>) => ({
    debug: (msg: string, meta?: Record<string, unknown>) => {
      log("debug", msg, { ...ctx, ...meta });
    },

    info: (msg: string, meta?: Record<string, unknown>) => {
      log("info", msg, { ...ctx, ...meta });
    },

    warn: (msg: string, meta?: Record<string, unknown>) => {
      log("warn", msg, { ...ctx, ...meta });
    },

    error: (msg: string, meta?: Record<string, unknown>) => {
      log("error", msg, { ...ctx, ...meta });
    },
  }),
};
