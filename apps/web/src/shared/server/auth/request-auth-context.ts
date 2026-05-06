import "server-only";

import { headers } from "next/headers";

type CookieMap = Map<string, string>;

function parseCookieHeader(value: string | null): CookieMap {
  const map: CookieMap = new Map();

  if (!value) {
    return map;
  }

  const parts = value.split(";");

  for (const part of parts) {
    const trimmed = part.trim();

    const index = trimmed.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const val = trimmed.slice(index + 1).trim();

    map.set(key, val);
  }

  return map;
}

export class RequestAuthContext {
  private readonly cookies: CookieMap;

  constructor(initialCookieHeader: string | null) {
    this.cookies = parseCookieHeader(initialCookieHeader);
  }

  static async create() {
    const headerStore = await headers();

    return new RequestAuthContext(headerStore.get("cookie"));
  }

  setCookie(name: string, value: string) {
    this.cookies.set(name, value);
  }

  removeCookie(name: string) {
    this.cookies.delete(name);
  }

  getCookieHeader(): string | undefined {
    const allowed = ["access_token", "refresh_token", "csrf", "device_id"];

    const parts: string[] = [];

    for (const key of allowed) {
      const value = this.cookies.get(key);

      if (!value) {
        continue;
      }

      parts.push(`${key}=${value}`);
    }

    if (parts.length === 0) {
      return undefined;
    }

    return parts.join("; ");
  }
}
