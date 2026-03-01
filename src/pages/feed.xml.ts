import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import dayjs from "dayjs";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async ({ site }) => {
  const BASE = site?.toString().replace(/\/$/, "") ?? "https://springfall.cc";
  const feedUrl = `${BASE}/feed.xml`;

  const allArticles = await getCollection("articles");

  // Deduplicate by translationKey, prefer ko
  const seen = new Set<string>();
  const articles = allArticles
    .sort((a, b) => dayjs(b.data.createdAt).diff(dayjs(a.data.createdAt)))
    .filter((a) => {
      const locale = a.data.locale ?? "ko";
      if (locale !== "ko") return false;
      if (a.data.translationKey) {
        if (seen.has(a.data.translationKey)) return false;
        seen.add(a.data.translationKey);
      }
      return true;
    });

  const itemsXml = articles
    .map((article) => {
      const parts = article.id.split("/");
      const yearMonth = parts[0];
      const slug = parts[1];
      const hasTranslation = !!article.data.translationKey;
      const url = hasTranslation
        ? `${BASE}/ko/article/${yearMonth}/${slug}/`
        : `${BASE}/article/${yearMonth}/${slug}/`;

      return `    <item>
      <title>${escapeXml(article.data.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <description>${escapeXml(article.data.summary)}</description>
      <pubDate>${new Date(article.data.createdAt).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>봄가을</title>
    <link>${escapeXml(BASE)}</link>
    <description>봄가을 블로그</description>
    <language>ko</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
};
