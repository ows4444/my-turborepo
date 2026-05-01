import { z } from "zod";

import { HttpError } from "@/shared/core/errors";
import { mapToDomainError } from "@/shared/core/errors/error-mapper";
import { normalizeError } from "@/shared/core/errors/normalize";
import { createAbortSignal } from "@/shared/infra/api-client/abort/abort";
import { type Logger } from "@/shared/infra/logger/contracts/logger";

import { apiResponseSchema } from "./api-response.schema";

type ApiOptions = RequestInit & {
  timeout?: number;
  signal?: AbortSignal | null;
};

export async function executeRequest<T>(
  path: string,
  options: ApiOptions = {},
  extraHeaders?: HeadersInit,
  logger?: Logger,
): Promise<T> {
  const start = Date.now();

  const exec = async (): Promise<T> => {
    const base = "";

    const signal = createAbortSignal({
      ...(options.signal !== undefined && {
        parent: options.signal,
      }),
      timeout: options.timeout ?? 8000,
    });
    const res = await fetch(`${base}${path}`, {
      ...options,
      credentials: "include",
      signal,
      headers: {
        ...(options.headers ?? {}),
        ...(extraHeaders ?? {}),
      },
    });

    // ✅ capture rotated CSRF token
    const newCsrfToken = res.headers.get("x-csrf-token");

    if (newCsrfToken && typeof window !== "undefined") {
      const { setCsrfToken } = await import("@/shared/security/csrf.client");

      setCsrfToken(newCsrfToken);
    }

    if (!res.ok) {
      logger?.error("API ERROR", {
        path,
        status: res.status,
        duration: Date.now() - start,
      });

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const json = await res.json().catch(() => null);
        throw new HttpError(res.status, json?.message ?? "HTTP_ERROR");
      }

      const text = await res.text();
      throw new HttpError(res.status, text || "HTTP_ERROR");
    }

    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const json = await res.json();

      const parsed = apiResponseSchema(z.any()).safeParse(json);

      if (!parsed.success) {
        throw new HttpError(res.status, "INVALID_RESPONSE_FORMAT");
      }

      const { data, error } = parsed.data;

      if (error) {
        throw new HttpError(res.status, error);
      }

      return data as T;
    }

    const text = await res.text();

    return text as T;
  };

  try {
    const result = await exec();

    if (process.env.NODE_ENV !== "production") {
      logger?.info("API success", {
        path,
        duration: Date.now() - start,
      });
    }

    return result;
  } catch (err) {
    logger?.error("API FAILURE", {
      path,
      duration: Date.now() - start,
      error: normalizeError(err),
    });

    throw mapToDomainError(err);
  }
}
