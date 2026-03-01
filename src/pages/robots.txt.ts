import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const base = site?.toString().replace(/\/$/, "") ?? "https://springfall.cc";

  const body = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap-index.xml
Host: ${base}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
