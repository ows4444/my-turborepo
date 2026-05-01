import { getWebEnv } from "@repo/env";

export function buildCSP(nonce: string) {
  const isDev = getWebEnv().NODE_ENV !== "production";

  const noncePart = `'nonce-${nonce}'`;

  const api = new URL(getWebEnv().API_SERVICE_URL).origin;
  const auth = new URL(getWebEnv().AUTH_SERVICE_URL).origin;

  return [
    "default-src 'self'",

    `script-src 'self' ${noncePart} 'strict-dynamic' https://www.google.com https://www.gstatic.com ${
      isDev ? "'unsafe-eval'" : ""
    }`,

    "script-src-attr 'none'",

    `style-src 'self' ${isDev ? "'unsafe-inline'" : noncePart}`,

    "img-src 'self' data: blob:",

    `connect-src 'self' ${api} ${auth}`,
    "font-src 'self' data:",
    `script-src-elem 'self' ${noncePart} https://www.google.com https://www.gstatic.com`,
    "worker-src 'self' blob:",

    "frame-src 'self' https://www.google.com",
    "frame-ancestors 'none'",

    "base-uri 'self'",
    "form-action 'self'",

    "object-src 'none'",

    "upgrade-insecure-requests",
    "report-uri /api/csp-report",

    ...(isDev ? [] : ["require-trusted-types-for 'script'", "trusted-types nextjs nextjs#bundler"]),
  ].join("; ");
}
