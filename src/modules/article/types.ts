import type { Locale } from "@/modules/i18n/types";
import type { Category } from "@modules/category";

export type ArticleItem = {
  title: string;
  slug: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  image?: string;
  imageAlt: string;
  category?: Category;
  tags?: string[];
  series?: { name: string; order: string };
  locale?: Locale;
};
