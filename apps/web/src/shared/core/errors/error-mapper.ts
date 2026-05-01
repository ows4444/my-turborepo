import { AppError, HttpError, NetworkError, SessionExpiredError } from "@/shared/core/errors";

export function mapToDomainError(err: unknown): AppError {
  if (err instanceof HttpError) {
    if (err.status === 401) return new SessionExpiredError();

    if (err.status === 403) return new HttpError(403, "Unauthorized");

    return err;
  }

  if (err instanceof AppError) return err;

  if (err instanceof DOMException && err.name === "AbortError") {
    return new NetworkError();
  }

  return new NetworkError();
}
