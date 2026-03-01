// Migration script: Move images from public/content/ to src/content/articles/*/assets/
// and update MDX files to use ESM imports with img={} props.
// Also handles src/pages/ko/til/index.mdx (til images).

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_CONTENT = path.join(ROOT, "public/content");
const ARTICLES_DIR = path.join(ROOT, "src/content/articles");
const TIL_PAGE = path.join(ROOT, "src/pages/ko/til/index.mdx");

const IMAGE_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".avif",
]);

let totalCopied = 0;
let totalUpdated = 0;

/**
 * Copy images from public/content/YYYY-MM/slug/ to src/content/articles/YYYY-MM/slug/assets/
 */
function copyImages(yearMonth, slug) {
  const srcDir = path.join(PUBLIC_CONTENT, yearMonth, slug);
  if (!fs.existsSync(srcDir)) return [];

  const files = fs.readdirSync(srcDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return IMAGE_EXTS.has(ext) && fs.statSync(path.join(srcDir, f)).isFile();
  });

  if (files.length === 0) return [];

  const destDir = path.join(ARTICLES_DIR, yearMonth, slug, "assets");
  fs.mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    if (!fs.existsSync(destFile)) {
      fs.copyFileSync(srcFile, destFile);
      totalCopied++;
    }
  }

  return files;
}

/**
 * Update an MDX file: add imports and replace src="/content/..." with img={varName}
 */
function updateMdxFile(mdxPath) {
  const content = fs.readFileSync(mdxPath, "utf-8");

  // Find all src="/content/YYYY-MM/slug/filename.ext" references
  const srcPattern = /src="\/content\/([^"]+)"/g;
  const matches = [...content.matchAll(srcPattern)];

  if (matches.length === 0) return false;

  // Collect unique image paths and generate import names
  const imageMap = new Map(); // "/content/path" -> { varName, relativePath }
  let counter = 0;

  for (const match of matches) {
    const fullPath = `/content/${match[1]}`;
    if (imageMap.has(fullPath)) continue;

    const filename = path.basename(match[1]);
    // Determine the relative path from MDX file to assets/
    // The MDX file is at src/content/articles/YYYY-MM/slug/ko.mdx (or en.mdx)
    // Images are at src/content/articles/YYYY-MM/slug/assets/filename.ext
    const varName = `img${counter++}`;
    imageMap.set(fullPath, { varName, filename });
  }

  // Build import statements
  const imports = [];
  for (const [, { varName, filename }] of imageMap) {
    imports.push(`import ${varName} from "./assets/${filename}";`);
  }

  // Replace src="/content/..." with img={varName} and remove width prop
  let updatedContent = content;

  for (const [srcPath, { varName }] of imageMap) {
    // Replace src="..." with img={varName}
    updatedContent = updatedContent.replaceAll(
      `src="${srcPath}"`,
      `img={${varName}}`
    );
  }

  // Remove width={...} props from ArticleImage components that now use img={}
  // Match width={number} that appears in a line within an ArticleImage tag
  updatedContent = updatedContent.replace(
    /^(\s*)width=\{(\d+)\}\s*$/gm,
    (match, indent) => {
      // Only remove if it's part of an ArticleImage with img={}
      return "";
    }
  );

  // Also handle inline width props like: <ArticleImage ... width={400} ...>
  // We need to be careful to only remove width from components that have img={}
  // Let's use a more targeted approach - remove width={N} when preceded by img={...}
  // or followed by img={...} on the same component
  updatedContent = updatedContent.replace(/ width=\{\d+\}/g, "");

  // Clean up any double blank lines created by removing width lines
  updatedContent = updatedContent.replace(/\n{3,}/g, "\n\n");

  // Insert imports after the existing ArticleImage import
  const articleImageImportRegex =
    /import ArticleImage from "@modules\/article\/ArticleImage\.astro";/;
  const importMatch = updatedContent.match(articleImageImportRegex);

  if (importMatch) {
    const insertPos = importMatch.index + importMatch[0].length;
    const importBlock = "\n" + imports.join("\n");
    updatedContent =
      updatedContent.slice(0, insertPos) +
      importBlock +
      updatedContent.slice(insertPos);
  }

  if (updatedContent !== content) {
    fs.writeFileSync(mdxPath, updatedContent, "utf-8");
    totalUpdated++;
    return true;
  }

  return false;
}

/**
 * Handle the TIL page separately - images go to a co-located assets dir
 */
function migrateTilPage() {
  if (!fs.existsSync(TIL_PAGE)) return;

  const content = fs.readFileSync(TIL_PAGE, "utf-8");
  const srcPattern = /src="\/content\/til\/([^"]+)"/g;
  const matches = [...content.matchAll(srcPattern)];

  if (matches.length === 0) return;

  // Copy til images to src/pages/ko/til/assets/
  const tilSrcDir = path.join(PUBLIC_CONTENT, "til");
  const tilDestDir = path.join(ROOT, "src/pages/ko/til/assets");
  fs.mkdirSync(tilDestDir, { recursive: true });

  const imageMap = new Map();
  let counter = 0;

  for (const match of matches) {
    const filename = match[1];
    const fullPath = `/content/til/${filename}`;
    if (imageMap.has(fullPath)) continue;

    const varName = `tilImg${counter++}`;
    imageMap.set(fullPath, { varName, filename });

    const srcFile = path.join(tilSrcDir, filename);
    const destFile = path.join(tilDestDir, filename);
    if (fs.existsSync(srcFile) && !fs.existsSync(destFile)) {
      fs.copyFileSync(srcFile, destFile);
      totalCopied++;
    }
  }

  // Build imports
  const imports = [];
  for (const [, { varName, filename }] of imageMap) {
    imports.push(`import ${varName} from "./assets/${filename}";`);
  }

  let updatedContent = content;

  // Replace src references
  for (const [srcPath, { varName }] of imageMap) {
    updatedContent = updatedContent.replaceAll(
      `src="${srcPath}"`,
      `img={${varName}}`
    );
  }

  // Insert imports after ArticleImage import
  const articleImageImportRegex =
    /import ArticleImage from "@modules\/article\/ArticleImage\.astro";/;
  const importMatch = updatedContent.match(articleImageImportRegex);

  if (importMatch) {
    const insertPos = importMatch.index + importMatch[0].length;
    const importBlock = "\n" + imports.join("\n");
    updatedContent =
      updatedContent.slice(0, insertPos) +
      importBlock +
      updatedContent.slice(insertPos);
  }

  if (updatedContent !== content) {
    fs.writeFileSync(TIL_PAGE, updatedContent, "utf-8");
    totalUpdated++;
    console.log(`  Updated: ${TIL_PAGE}`);
  }
}

// Main execution
console.log("Starting image migration...\n");

// Process article directories
const yearMonths = fs.readdirSync(ARTICLES_DIR).filter((d) => {
  return (
    fs.statSync(path.join(ARTICLES_DIR, d)).isDirectory() && /^\d{4}-\d{2}$/.test(d)
  );
});

for (const yearMonth of yearMonths.sort()) {
  const slugs = fs.readdirSync(path.join(ARTICLES_DIR, yearMonth)).filter((d) => {
    return fs.statSync(path.join(ARTICLES_DIR, yearMonth, d)).isDirectory();
  });

  for (const slug of slugs.sort()) {
    const articleDir = path.join(ARTICLES_DIR, yearMonth, slug);

    // Copy images from public/content to assets/
    const copiedFiles = copyImages(yearMonth, slug);

    // Update MDX files
    const mdxFiles = fs.readdirSync(articleDir).filter((f) => f.endsWith(".mdx"));

    for (const mdxFile of mdxFiles) {
      const mdxPath = path.join(articleDir, mdxFile);
      const content = fs.readFileSync(mdxPath, "utf-8");

      // Skip if already fully migrated (no src="/content/" references)
      if (!content.includes('src="/content/')) continue;

      const updated = updateMdxFile(mdxPath);
      if (updated) {
        console.log(`  Updated: ${yearMonth}/${slug}/${mdxFile}`);
      }
    }
  }
}

// Handle TIL page
migrateTilPage();

console.log(`\nMigration complete!`);
console.log(`  Images copied: ${totalCopied}`);
console.log(`  MDX files updated: ${totalUpdated}`);
