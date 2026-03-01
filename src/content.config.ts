import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/articles" }),
  schema: z.object({
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
  }),
});

export const collections = { articles };
