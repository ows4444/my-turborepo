import crypto from "crypto";

import { type NextRequest, NextResponse } from "next/server";

import { getWebEnv } from "@repo/env";
import { buildCSP } from "@/shared/security/csp";
import { generateCsrfToken, verifyCsrf } from "@/shared/security/csrf.server";

export function proxy(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;

    const lastSegment = pathname.split("/").pop();
    const isPublicFile = lastSegment?.includes(".") ?? false;

    if (
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico" ||
      isPublicFile
    ) {
      return NextResponse.next();
    }

    const nonce = crypto.randomBytes(16).toString("base64");
    const csp = buildCSP(nonce);

    const requestHeaders = new Headers(req.headers);

    requestHeaders.set("x-nonce", nonce);

    if (!requestHeaders.get("x-request-id")) {
      requestHeaders.set("x-request-id", crypto.randomUUID());
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    const csrfCookie = req.cookies.get("csrf")?.value;

    const csrfValid = csrfCookie ? verifyCsrf(csrfCookie) : false;

    // regenerate when:
    // - missing
    // - invalid
    // - expired
    if (!csrfValid) {
      const encoded = generateCsrfToken();

      response.cookies.set("csrf", encoded, {
        httpOnly: true,
        sameSite: "lax",
        secure: getWebEnv().NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 5,
        priority: "high",
      });
    }

    const existingLocale = req.cookies.get("locale")?.value;
    const locale = existingLocale || "en";

    if (existingLocale !== locale) {
      response.cookies.set("locale", locale, {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: getWebEnv().NODE_ENV === "production",
      });
    }

    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

    return response;
  } catch {
    return new NextResponse("Proxy failure", { status: 500 });
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
