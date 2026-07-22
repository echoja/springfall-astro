import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const site = "https://springfall.cc";
const outputDirectory = path.resolve("dist");
const failures = [];

async function findFiles(directory, fileName) {
  if (!existsSync(directory)) return [];

  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return findFiles(entryPath, fileName);
      return entry.name === fileName ? [entryPath] : [];
    }),
  );

  return nested.flat();
}

function countOccurrences(value, search) {
  return value.split(search).length - 1;
}

if (!existsSync(outputDirectory)) {
  failures.push("dist does not exist; run astro build first");
}

if (existsSync(path.join(outputDirectory, "article"))) {
  failures.push("legacy /article pages must not be generated");
}

const redirectPath = path.join(outputDirectory, "_redirects");
if (!existsSync(redirectPath)) {
  failures.push("dist/_redirects is missing");
} else {
  const redirects = await readFile(redirectPath, "utf8");
  if (!redirects.split("\n").includes("/article/* /ko/article/:splat 301")) {
    failures.push("legacy /article paths must permanently redirect to /ko/article");
  }
}

const sitemapFiles = await findFiles(outputDirectory, "sitemap-0.xml");
const sitemap = (
  await Promise.all(sitemapFiles.map((file) => readFile(file, "utf8")))
).join("\n");

if (!sitemap) {
  failures.push("generated sitemap is missing");
} else if (sitemap.includes(`<loc>${site}/article/`)) {
  failures.push("sitemap contains a legacy /article URL");
}

const outputEntries = existsSync(outputDirectory)
  ? await readdir(outputDirectory, { withFileTypes: true })
  : [];
const locales = outputEntries
  .filter(
    (entry) =>
      entry.isDirectory() &&
      existsSync(path.join(outputDirectory, entry.name, "article")),
  )
  .map((entry) => entry.name)
  .sort();

if (locales.length === 0) {
  failures.push("no localized article directories were generated");
}

for (const locale of locales) {
  const articleDirectory = path.join(outputDirectory, locale, "article");
  const articleFiles = await findFiles(articleDirectory, "index.html");

  for (const articleFile of articleFiles) {
    const relativePath = path.relative(outputDirectory, articleFile);
    const route = `/${relativePath.split(path.sep).slice(0, -1).join("/")}/`;
    const canonicalUrl = `${site}${route}`;
    const html = await readFile(articleFile, "utf8");

    if (!html.includes(`<link rel="canonical" href="${canonicalUrl}">`)) {
      failures.push(`${route} does not declare itself canonical`);
    }

    const sitemapEntry = `<loc>${canonicalUrl}</loc>`;
    if (countOccurrences(sitemap, sitemapEntry) !== 1) {
      failures.push(`${canonicalUrl} must occur exactly once as a sitemap location`);
    }
  }
}

const feedPath = path.join(outputDirectory, "feed.xml");
if (!existsSync(feedPath)) {
  failures.push("generated RSS feed is missing");
} else {
  const feed = await readFile(feedPath, "utf8");
  if (feed.includes(`${site}/article/`)) {
    failures.push("RSS feed contains a legacy /article URL");
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Article routes are canonical and localized.");
