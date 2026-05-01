import pino from "pino";

import { getWebEnv } from "@repo/env";

const isProd = getWebEnv().NODE_ENV === "production";

export const baseLogger = pino({
  level: getWebEnv().LOG_LEVEL ?? (isProd ? "info" : "debug"),

  base: {
    env: getWebEnv().NODE_ENV,
    service: "web-app",
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "headers.authorization", "headers.cookie"],
    censor: "[REDACTED]",
  },

  formatters: {
    level(label) {
      return { level: label };
    },
  },

  serializers: {
    err: pino.stdSerializers.err,
  },
});
