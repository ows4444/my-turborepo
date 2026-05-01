type NormalizedError = {
  message: string;
  name?: string;
  stack?: string;
  status?: number;
  cause?: unknown;

  code?: string;
  meta?: Record<string, unknown>;
};

type ErrorWithMeta = Error & {
  status?: number;
  code?: string;
  meta?: Record<string, unknown>;
};

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof Error) {
    const e = err as ErrorWithMeta;

    return {
      message: err.message,
      name: err.name,

      ...(e.cause !== undefined ? { cause: e.cause } : undefined),
      // ...(err.stack ? { stack: err.stack } : undefined),

      ...(e.status !== undefined && { status: e.status }),
      ...(e.code !== undefined && { code: e.code }),
      ...(e.meta !== undefined && { meta: e.meta }),
    };
  }

  if (err && typeof err === "object") {
    try {
      return {
        message: JSON.stringify(err),
      };
    } catch {
      return {
        message: "[Unserializable error object]",
      };
    }
  }

  return {
    message: String(err),
  };
}
