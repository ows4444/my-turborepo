import { QueryCache, QueryClient } from "@tanstack/react-query";

import { isAppError } from "@/shared/core/errors";
import { mapErrorToEvent } from "@/shared/notifications/model/error-to-event";
import { emitNotification } from "@/shared/notifications/model/service";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        networkMode: "online",

        retry: (failureCount, error: unknown) => {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            return false;
          }

          if (isAppError(error)) {
            if (!error.retryable) return false;

            return failureCount < 2;
          }

          return failureCount < 1;
        },

        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        networkMode: "online",
        onError: (error) => {
          emitNotification(mapErrorToEvent(error));
        },
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        emitNotification(mapErrorToEvent(error));
      },
    }),
  });
}
