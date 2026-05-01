import { dehydrate } from "@tanstack/react-query";

import { createQueryClient } from "./get-query-client";

export async function getDehydratedState(key: readonly unknown[], fn: () => Promise<unknown>) {
  const queryClient = createQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: fn,
    });
  } catch {
    // Ignore errors
  }

  return dehydrate(queryClient, {
    shouldDehydrateQuery: (q) => q.state.status === "success",
  });
}
