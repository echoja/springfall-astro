import { z } from "zod";
import { categories } from "@/modules/category";
import { i18n } from "@/modules/i18n/types";

export const articleSchema = z.object({
  title: z.string(),
  summary: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  image: z.string().optional(),
  imageAlt: z.string().default(""),
  category: z.enum(categories).optional(),
  tags: z.array(z.string()).default([]),
  locale: z.enum(i18n.locales).default(i18n.defaultLocale),
  translationKey: z.string().optional(),
});
