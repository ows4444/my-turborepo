export type ParsedSetCookie = {
  name: string;
  value: string;
};

export function extractSetCookies(headers: Headers): ParsedSetCookie[] {
  const raw = headers as unknown as {
    raw?: () => Record<string, string[]>;
  };

  const values = raw.raw?.()["set-cookie"] ?? [];

  const parsed: ParsedSetCookie[] = [];

  for (const cookie of values) {
    const first = cookie.split(";")[0];

    if (!first) {
      continue;
    }

    const index = first.indexOf("=");

    if (index === -1) {
      continue;
    }

    const name = first.slice(0, index).trim();
    const value = first.slice(index + 1).trim();

    parsed.push({
      name,
      value,
    });
  }

  return parsed;
}
