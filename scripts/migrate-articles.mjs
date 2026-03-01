#!/usr/bin/env node

/**
 * Migration script: Convert legacy Next.js articles to Astro content collections.
 *
 * For each legacy article:
 * 1. Parse metadata.tsx to extract frontmatter fields
 * 2. Read page.mdx and strip Next.js-specific imports/components
 * 3. Replace ArticleImage usage with new src-based pattern
 * 4. Copy images to public/content/
 * 5. Write new MDX with YAML frontmatter
 */

import fs from "node:fs";
import path from "node:path";

const SPRINGFALL_ROOT = "/Users/th.kim/Desktop/springfall";
const ASTRO_ROOT = "/Users/th.kim/Desktop/springfall-astro";
const LEGACY_ARTICLES_DIR = path.join(SPRINGFALL_ROOT, "src/app/article");
const NEW_CONTENT_DIR = path.join(ASTRO_ROOT, "src/content/articles");
const PUBLIC_CONTENT_DIR = path.join(ASTRO_ROOT, "public/content");

// Articles already migrated (skip them)
const ALREADY_MIGRATED = new Set([
  "2022-09/company",
  "2022-10/hello-sadness",
  "2025-08/effective-burn-out-tips",
]);

// Articles NOT listed in items.tsx (skip them)
const SKIP_ARTICLES = new Set([
  "2025-02/monorepo", // Duplicate slug of signal article
  "2025-07/simple-api-analytics", // Data inconsistency
  "2025-07/sm-hidden-portal", // Commented out in items.tsx
]);

// Bilingual articles: { base slug => { ko: path, en: path } }
const BILINGUAL = {
  "2025-08/effective-burn-out-tips": true,
};

function parseMetadata(metadataContent) {
  const result = {};

  // Extract title
  const titleMatch = metadataContent.match(
    /export\s+const\s+title\s*=\s*["'`](.*?)["'`]/s,
  );
  if (titleMatch) result.title = titleMatch[1];

  // Extract summary
  const summaryMatch = metadataContent.match(
    /export\s+const\s+summary\s*=\s*\n?\s*["'`](.*?)["'`]/s,
  );
  if (summaryMatch) result.summary = summaryMatch[1];

  // Extract slug (may be const or export const)
  const slugMatch = metadataContent.match(
    /(?:export\s+)?const\s+slug\s*=\s*["'`](.*?)["'`]/,
  );
  if (slugMatch) result.slug = slugMatch[1];

  // Extract createdAt date
  const createdMatch = metadataContent.match(
    /createdAt\s*=\s*dayjs\(["'`](.*?)["'`]\)/,
  );
  if (createdMatch) result.createdAt = createdMatch[1];

  // Extract updatedAt date
  const updatedMatch = metadataContent.match(
    /updatedAt\s*=\s*dayjs\(["'`](.*?)["'`]\)/,
  );
  if (updatedMatch) result.updatedAt = updatedMatch[1];

  // Extract imageAlt
  const imageAltMatch = metadataContent.match(
    /export\s+const\s+imageAlt\s*=\s*["'`](.*?)["'`]/,
  );
  if (imageAltMatch) result.imageAlt = imageAltMatch[1];

  // Extract category
  const categoryMatch = metadataContent.match(
    /(?:export\s+)?(?:const\s+)?category(?::\s*Category)?\s*=\s*["'`](.*?)["'`]/,
  );
  if (categoryMatch) result.category = categoryMatch[1];

  // Extract locale
  const localeMatch = metadataContent.match(/locale:\s*["'`](.*?)["'`]/);
  if (localeMatch) result.locale = localeMatch[1];

  return result;
}

function stripNextJsImports(mdxContent) {
  const lines = mdxContent.split("\n");
  const filtered = [];
  let skipBlock = false;

  for (const line of lines) {
    // Skip Next.js specific imports
    if (
      line.match(
        /^import\s+(ArticleHeader|getArticleHeaderProps|getArticleJsonLdProps|getArticleMetadata)\s/,
      )
    )
      continue;
    if (line.match(/^import\s+\{\s*(ArticleJsonLd|ArticleHeader)\s*\}/))
      continue;
    if (line.match(/^import.*from\s+["']next-seo["']/)) continue;
    if (line.match(/^import.*from\s+["']\.\/metadata["']/)) continue;

    // Skip metadata export
    if (line.match(/^export\s+const\s+metadata\s*=/)) continue;

    // Skip ArticleJsonLd and ArticleHeader component usage
    if (line.match(/^<ArticleJsonLd\s/)) continue;
    if (line.match(/^<ArticleHeader\s/)) continue;

    // Skip separator comments
    if (line.match(/^\{\/\*\s*-{10,}\s*\*\/\}$/)) continue;

    filtered.push(line);
  }

  return filtered.join("\n");
}

function transformArticleImages(mdxContent, yearMonth, slug) {
  // Collect image imports: import varName from "./filename.ext"
  const imageImports = {};
  const importRegex =
    /^import\s+(\w+)\s+from\s+["']\.\/([^"']+\.(jpe?g|png|webp|avif|gif|svg))["'];?\s*$/gm;
  let match;
  while ((match = importRegex.exec(mdxContent)) !== null) {
    imageImports[match[1]] = match[2];
  }

  // Also match imports with relative paths (for bilingual articles)
  const relativeImportRegex =
    /^import\s+(\w+)\s+from\s+["'](?:\.\.\/)+(?:article\/)?([^"']+\.(jpe?g|png|webp|avif|gif|svg))["'];?\s*$/gm;
  while ((match = relativeImportRegex.exec(mdxContent)) !== null) {
    // Extract just the filename
    const fullPath = match[2];
    const filename = path.basename(fullPath);
    imageImports[match[1]] = filename;
  }

  let result = mdxContent;

  // Remove image imports
  result = result.replace(
    /^import\s+\w+\s+from\s+["'][^"']*\.(jpe?g|png|webp|avif|gif|svg)["'];?\s*$/gm,
    "",
  );

  // Transform <ArticleImage img={varName} ...> to <ArticleImage src="/content/..." ...>
  for (const [varName, filename] of Object.entries(imageImports)) {
    // Match img={varName} and replace with src="/content/yearMonth/slug/filename"
    const imgRegex = new RegExp(`img=\\{${varName}\\}`, "g");
    result = result.replace(
      imgRegex,
      `src="/content/${yearMonth}/${slug}/${filename}"`,
    );
  }

  // The ArticleImage import from the original file uses @modules/article/ArticleImage
  // which is the same path in Astro, so we leave it as-is.

  return result;
}

function generateFrontmatter(meta, locale = "ko", translationKey = undefined) {
  const lines = ["---"];
  lines.push(`title: ${JSON.stringify(meta.title || "")}`);
  lines.push(`summary: ${JSON.stringify(meta.summary || "")}`);
  lines.push(`createdAt: "${meta.createdAt}"`);
  lines.push(`updatedAt: "${meta.updatedAt}"`);
  if (meta.imageAlt) lines.push(`imageAlt: ${JSON.stringify(meta.imageAlt)}`);
  if (meta.category) lines.push(`category: "${meta.category}"`);
  lines.push(`locale: "${locale}"`);
  if (translationKey) lines.push(`translationKey: "${translationKey}"`);
  lines.push("---");
  return lines.join("\n");
}

function copyImages(srcDir, yearMonth, slug) {
  const destDir = path.join(PUBLIC_CONTENT_DIR, yearMonth, slug);
  fs.mkdirSync(destDir, { recursive: true });

  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    if (file.match(/\.(jpe?g|png|webp|avif|gif|svg)$/i)) {
      const src = path.join(srcDir, file);
      const dest = path.join(destDir, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
    }
  }
}

function migrateArticle(yearMonth, slug) {
  const articleDir = path.join(LEGACY_ARTICLES_DIR, yearMonth, slug);
  const metadataPath = path.join(articleDir, "metadata.tsx");
  const mdxPath = path.join(articleDir, "page.mdx");

  if (!fs.existsSync(metadataPath) || !fs.existsSync(mdxPath)) {
    console.warn(`  SKIP: Missing files for ${yearMonth}/${slug}`);
    return;
  }

  const metadataContent = fs.readFileSync(metadataPath, "utf-8");
  const mdxContent = fs.readFileSync(mdxPath, "utf-8");

  const meta = parseMetadata(metadataContent);

  // Strip Next.js imports and components
  let cleanMdx = stripNextJsImports(mdxContent);

  // Transform ArticleImage references
  cleanMdx = transformArticleImages(cleanMdx, yearMonth, slug);

  // Clean up excessive blank lines
  cleanMdx = cleanMdx.replace(/\n{4,}/g, "\n\n\n");
  cleanMdx = cleanMdx.trim();

  // Generate frontmatter
  const frontmatter = generateFrontmatter(meta);

  // Ensure ArticleImage import exists after frontmatter if used in content
  if (cleanMdx.includes("<ArticleImage") && !cleanMdx.includes("import ArticleImage from")) {
    cleanMdx = 'import ArticleImage from "@modules/article/ArticleImage";\n\n' + cleanMdx;
  }

  // Combine
  const finalMdx = `${frontmatter}\n\n${cleanMdx}\n`;

  // Write to content directory
  const outputDir = path.join(NEW_CONTENT_DIR, yearMonth, slug);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "ko.mdx"), finalMdx);

  // Copy images
  copyImages(articleDir, yearMonth, slug);

  console.log(`  OK: ${yearMonth}/${slug} => ${meta.title?.slice(0, 50)}`);
}

function migrateBilingualArticle(yearMonth, slug) {
  // Handle bilingual articles that have separate ko/en directories
  const koDir = path.join(
    SPRINGFALL_ROOT,
    "src/app/ko/article",
    yearMonth,
    slug,
  );
  const enDir = path.join(
    SPRINGFALL_ROOT,
    "src/app/en/article",
    yearMonth,
    slug,
  );
  const baseDir = path.join(LEGACY_ARTICLES_DIR, yearMonth, slug);

  // Already handled by the base migration, but we need the en version too
  if (fs.existsSync(enDir)) {
    const enMetaPath = path.join(enDir, "metadata.tsx");
    const enMdxPath = path.join(enDir, "page.mdx");

    if (fs.existsSync(enMetaPath) && fs.existsSync(enMdxPath)) {
      const enMeta = parseMetadata(fs.readFileSync(enMetaPath, "utf-8"));
      let enMdx = stripNextJsImports(fs.readFileSync(enMdxPath, "utf-8"));
      enMdx = transformArticleImages(enMdx, yearMonth, slug);
      enMdx = enMdx.replace(/\n{4,}/g, "\n\n\n").trim();

      const frontmatter = generateFrontmatter(enMeta, "en", slug);
      const finalMdx = `${frontmatter}\n\n${enMdx}\n`;

      const outputDir = path.join(NEW_CONTENT_DIR, yearMonth, slug);
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, "en.mdx"), finalMdx);
      console.log(`  OK (en): ${yearMonth}/${slug} => ${enMeta.title?.slice(0, 50)}`);
    }

    // Also update ko version with translationKey
    const koOutputPath = path.join(
      NEW_CONTENT_DIR,
      yearMonth,
      slug,
      "ko.mdx",
    );
    if (fs.existsSync(koOutputPath)) {
      let koContent = fs.readFileSync(koOutputPath, "utf-8");
      if (!koContent.includes("translationKey:")) {
        koContent = koContent.replace(
          /locale: "ko"\n---/,
          `locale: "ko"\ntranslationKey: "${slug}"\n---`,
        );
        fs.writeFileSync(koOutputPath, koContent);
      }
    }
  }
}

// Main
console.log("Starting article migration...\n");

// Discover all legacy articles
const yearMonths = fs.readdirSync(LEGACY_ARTICLES_DIR).filter((d) => {
  return (
    fs.statSync(path.join(LEGACY_ARTICLES_DIR, d)).isDirectory() &&
    /^\d{4}-\d{2}$/.test(d)
  );
});

let total = 0;
let migrated = 0;
let skipped = 0;

for (const yearMonth of yearMonths.sort()) {
  const slugs = fs.readdirSync(path.join(LEGACY_ARTICLES_DIR, yearMonth)).filter((d) => {
    return fs.statSync(path.join(LEGACY_ARTICLES_DIR, yearMonth, d)).isDirectory();
  });

  for (const slug of slugs.sort()) {
    total++;
    const key = `${yearMonth}/${slug}`;

    if (ALREADY_MIGRATED.has(key)) {
      console.log(`  SKIP (already migrated): ${key}`);
      skipped++;
      continue;
    }

    if (SKIP_ARTICLES.has(key)) {
      console.log(`  SKIP (excluded): ${key}`);
      skipped++;
      continue;
    }

    migrateArticle(yearMonth, slug);
    migrated++;

    // Handle bilingual
    if (BILINGUAL[key]) {
      migrateBilingualArticle(yearMonth, slug);
    }
  }
}

// Also migrate new content system article (live-editor)
const newContentDir = path.join(SPRINGFALL_ROOT, "src/content/articles");
if (fs.existsSync(newContentDir)) {
  console.log("\nMigrating new content system articles...");
  const metaJsonPath = path.join(
    newContentDir,
    "2025-12/live-editor/meta.json",
  );
  if (fs.existsSync(metaJsonPath)) {
    const meta = JSON.parse(fs.readFileSync(metaJsonPath, "utf-8"));

    for (const locale of meta.locales) {
      const srcMdx = path.join(
        newContentDir,
        "2025-12/live-editor",
        `${locale}.mdx`,
      );
      if (!fs.existsSync(srcMdx)) continue;

      let mdxContent = fs.readFileSync(srcMdx, "utf-8");

      // These MDX files don't have the Next.js boilerplate but may need image path fixes
      // Check if they have frontmatter already
      if (!mdxContent.startsWith("---")) {
        const frontmatter = [
          "---",
          `title: ${JSON.stringify(meta.title[locale])}`,
          `summary: ${JSON.stringify(meta.summary[locale])}`,
          `createdAt: "${meta.createdAt}"`,
          `updatedAt: "${meta.updatedAt}"`,
          `imageAlt: ${JSON.stringify(meta.imageAlt[locale])}`,
          `category: "${meta.category}"`,
          `locale: "${locale}"`,
          `translationKey: "live-editor"`,
          "---",
        ].join("\n");
        mdxContent = `${frontmatter}\n\n${mdxContent}`;
      }

      const outputDir = path.join(NEW_CONTENT_DIR, "2025-12/live-editor");
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, `${locale}.mdx`), mdxContent);
      console.log(`  OK: 2025-12/live-editor (${locale})`);
    }

    // Copy images from assets
    const assetsDir = path.join(newContentDir, "2025-12/live-editor/assets");
    if (fs.existsSync(assetsDir)) {
      copyImages(assetsDir, "2025-12", "live-editor");
      console.log("  OK: Copied live-editor assets");
    }

    migrated++;
  }
}

console.log(`\nDone! Total: ${total}, Migrated: ${migrated}, Skipped: ${skipped}`);

// Also handle the intl-number-format article which isn't in items.tsx but exists
// Check for any other articles in the directory that might not be imported
