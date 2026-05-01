import { NextResponse } from "next/server";

import { type z } from "zod";

import { getWebEnv } from "@repo/env";
import { isSafeMethod } from "@/shared/security/csrf.core";
import { assertValidCsrf } from "@/shared/security/csrf.guard";
import { decode, generateCsrfToken } from "@/shared/security/csrf.server";

import { type AppRouteHandler } from "./types";

export function createValidatedMutation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (data: z.infer<T>, req: Request, ctx: unknown) => Promise<Response>,
): AppRouteHandler {
  return createMutation(async (req, ctx) => {
    const MAX_BODY_SIZE = 1024 * 10; // 10kb

    const contentLength = req.headers.get("content-length");

    if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    }

    const body = await req.json();

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    return handler(parsed.data, req, ctx);
  });
}

export function extractUpstreamError(data: unknown): string | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as Record<string, unknown>).error === "string"
  ) {
    return (data as { error: string }).error;
  }

  return null;
}

// ─────────────────────────────────────────────
// 🔒 MUTATION (CSRF ENFORCED ALWAYS)
// ─────────────────────────────────────────────
export function createMutation(handler: AppRouteHandler): AppRouteHandler {
  return async (req, ctx) => {
    const MAX_BODY_SIZE = 1024 * 10; // 10kb

    const contentLength = req.headers.get("content-length");

    if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    }

    if (!isSafeMethod(req.method)) {
      try {
        await assertValidCsrf(); // ✅ SINGLE SOURCE OF TRUTH
      } catch {
        return NextResponse.json(
          { error: "CSRF_VALIDATION_FAILED" },
          { status: 403 },
        );
      }
    }

    const res = await handler(req, ctx);

    // 🔁 rotate token after every mutation

    const encoded = generateCsrfToken();
    const payload = decode(encoded);

    const headers = new Headers(res.headers);

    const next = new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });

    if (payload) {
      // httpOnly signed payload
      next.cookies.set("csrf", encoded, {
        httpOnly: true,
        sameSite: "lax",
        secure: getWebEnv().NODE_ENV === "production",
        path: "/",
      });

      // ✅ critical fix: sync client immediately
      next.headers.set("x-csrf-token", payload.token);
    } else {
      // fallback safety (should never happen)
      return NextResponse.json(
        { error: "CSRF_ROTATION_FAILED" },
        { status: 500 },
      );
    }

    return next;
  };
}

// ─────────────────────────────────────────────
// 🌐 QUERY (SAFE)
// ─────────────────────────────────────────────
export function createQuery(handler: AppRouteHandler): AppRouteHandler {
  return handler;
}
