import { serviceClient } from "@/shared/infra/service-client/service-client";
import { createQuery, extractUpstreamError } from "@/shared/server/route/create-route";

export const runtime = "nodejs";

export const GET = createQuery(async () => {
  const upstream = await serviceClient("AUTH", "/auth/me", {
    method: "GET",
  });
  const error = extractUpstreamError(upstream.data);

  if (error) {
    return Response.json({ error }, { status: upstream.status });
  }

  return Response.json(upstream.data, {
    status: upstream.status,
    statusText: upstream.statusText,
  });
});
