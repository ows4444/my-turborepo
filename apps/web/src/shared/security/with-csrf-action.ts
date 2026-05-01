import { assertValidCsrf } from "./csrf.guard";

type AsyncFn<Args extends unknown[], R> = (...args: Args) => Promise<R>;

export function withCsrfAction<Args extends unknown[], R>(fn: AsyncFn<Args, R>): AsyncFn<Args, R> {
  return async (...args: Args): Promise<R> => {
    await assertValidCsrf();

    return fn(...args);
  };
}
