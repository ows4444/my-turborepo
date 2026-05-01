type MergeOptions = {
  timeout?: number;
  parent?: AbortSignal | null;
};

export function createAbortSignal({ parent, timeout }: MergeOptions = {}): AbortSignal {
  const controller = new AbortController();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const abort = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  if (parent) {
    if (parent.aborted) {
      abort();
    } else {
      parent.addEventListener("abort", abort, { once: true });
    }
  }

  if (timeout != null) {
    timeoutId = setTimeout(abort, timeout);
  }

  controller.signal.addEventListener(
    "abort",
    () => {
      if (timeoutId) clearTimeout(timeoutId);
    },
    { once: true },
  );

  return controller.signal;
}
