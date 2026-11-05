const siteUrl = new URL("https://springfall.cc");

export function addUtmSource(href: string): string {
  let url: URL;
  try {
    url = new URL(href, siteUrl);
  } catch {
    return href;
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.hostname === siteUrl.hostname ||
    url.hostname === `www.${siteUrl.hostname}`
  ) {
    return href;
  }

  url.searchParams.set("utm_source", siteUrl.hostname);
  return url.href;
}
