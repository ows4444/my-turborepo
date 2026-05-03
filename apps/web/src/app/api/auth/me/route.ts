import { serviceClient } from "@/shared/infra/service-client/service-client";
import { createQuery, extractUpstreamError } from "@/shared/server/route/create-route";

import { z } from "zod";

const meSchema = z.object({
  data: z.object({
    user: z.object({
      id: z.string(),
      full_name: z.string(),
    }),
  }),
});

export const runtime = "nodejs";

export const GET = createQuery(async () => {
  const upstream = await serviceClient("AUTH", "/auth/me", {
    method: "GET",
  });

  const parsed = meSchema.safeParse(upstream.data);

  if (!parsed.success) {
    return Response.json({ error: "INVALID_ME_RESPONSE" }, { status: 500 });
  }


  const error = extractUpstreamError(upstream.data);

  if (error) {
    return Response.json({ error }, { status: upstream.status });
  }

  return Response.json(upstream.data, {
    status: upstream.status,
    statusText: upstream.statusText,
  });
});
