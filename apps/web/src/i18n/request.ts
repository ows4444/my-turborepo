import { cookies } from "next/headers";

import { getRequestConfig } from "next-intl/server";

import { defaultLocale, locales } from "./routing";

function isLocale(value: string | undefined): value is (typeof locales)[number] {
  return !!value && (locales as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const raw = store.get("locale")?.value;

  const locale = isLocale(raw) ? raw : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
