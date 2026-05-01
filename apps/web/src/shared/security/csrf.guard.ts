import { cookies, headers } from "next/headers";

import { CSRF_HEADER, timingSafeEqual } from "@/shared/security/csrf.core";

import { decode, verifyCsrf } from "./csrf.server";
import { HttpError } from "../core/errors";

export async function assertValidCsrf() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const encoded = cookieStore.get("csrf")?.value;
  const header = headerStore.get(CSRF_HEADER);

  if (!encoded) {
    throw new HttpError(403, "CSRF_COOKIE_MISSING");
  }

  if (!header) {
    throw new HttpError(403, "CSRF_HEADER_MISSING");
  }

  const valid = verifyCsrf(encoded);
  const payload = decode(encoded);

  if (!valid || !payload) {
    throw new HttpError(403, "CSRF_INVALID_OR_EXPIRED");
  }

  const same = timingSafeEqual(payload.token, header);

  if (!same) {
    throw new HttpError(403, "CSRF_TOKEN_MISMATCH");
  }
}
