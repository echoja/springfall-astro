import { i18n, type Locale } from "@/modules/i18n/types";

export function getLocaleFromPathname(pathname: string): Locale | null {
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  return isLocale(first) ? first : null;
}

function isLocale(value: string): value is Locale {
  return (i18n.locales as readonly string[]).includes(value);
}
