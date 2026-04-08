#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { glob } from "node:fs/promises";
import yaml from "js-yaml";
import { z } from "zod";

const ARTICLES_DIR = resolve(import.meta.dirname, "../src/content/articles");

const articleSchema = z.object({
  title: z.string(),
  summary: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  image: z.string().optional(),
  imageAlt: z.string().default(""),
  category: z
    .enum(["회고", "리뷰", "기술", "일상", "기타", "디자인"])
    .optional(),
  tags: z.array(z.string()).default([]),
  locale: z.enum(["ko", "en"]).default("ko"),
  translationKey: z.string().optional(),
});

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return yaml.load(match[1]) ?? {};
}

let errors = 0;

for await (const filePath of glob(`${ARTICLES_DIR}/**/*.mdx`)) {
  const raw = readFileSync(filePath, "utf-8");
  const data = parseFrontmatter(raw);
  const result = articleSchema.safeParse(data);

  if (!result.success) {
    const rel = relative(process.cwd(), filePath);
    console.error(`\n✗ ${rel}`);
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n${errors} file(s) with invalid frontmatter.`);
  process.exit(1);
} else {
  console.log("All frontmatter is valid.");
}
