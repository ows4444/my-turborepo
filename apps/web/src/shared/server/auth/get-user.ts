import { serviceClient } from "@/shared/infra/service-client/service-client";

export async function getUser() {
  try {
    const res = await serviceClient<{ user: { id: string; full_name: string } }>("AUTH", "/auth/me", {
      method: "GET",
    });

    return res.data.user ?? null;
  } catch (err) {
    if (
      err instanceof Error &&
      typeof (err as { status?: unknown }).status === "number" &&
      (err as { status?: number }).status === 401
    ) {
      return null;
    }

    throw err;
  }
}
