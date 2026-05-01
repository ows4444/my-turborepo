import { serviceClient } from "@/shared/infra/service-client/service-client";
import { createMutation, extractUpstreamError } from "@/shared/server/route/create-route";

export const runtime = "nodejs";

export const POST = createMutation(async (req) => {
  const upstream = await serviceClient<unknown>("AUTH", "/auth/logout", {
    method: "POST",
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
