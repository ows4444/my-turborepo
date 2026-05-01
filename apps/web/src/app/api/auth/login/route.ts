import { headers } from "next/headers";

import { z } from "zod";

export const runtime = "nodejs";

import { serviceClient } from "@/shared/infra/service-client/service-client";
import { createValidatedMutation, extractUpstreamError } from "@/shared/server/route/create-route";

const loginSchema = z.object({
  identifier: z.union([z.email(), z.string().regex(/^9715\d{8}$/)], {
    error: () => ({ message: "Must be a valid email or UAE phone number starting with 9715" }),
  }),
});

export const POST = createValidatedMutation(loginSchema, async (parsed) => {
  const headerStore = await headers();

  const upstream = await serviceClient<unknown>("AUTH", "/auth/login", {
    method: "POST",
    body: JSON.stringify(parsed),
    headers: {
      "x-request-id": headerStore.get("x-request-id") ?? "",
    },
  });

  const error = extractUpstreamError(upstream.data);

  if (error) {
    return Response.json({ error }, { status: upstream.status });
  }

  const res = Response.json(upstream.data, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  const raw = upstream.headers as unknown as { raw?: () => Record<string, string[]> };
  const cookies = raw?.raw?.()["set-cookie"];

  if (cookies) {
    for (const cookie of cookies) {
      res.headers.append("set-cookie", cookie);
    }
  }

  return res;
});
