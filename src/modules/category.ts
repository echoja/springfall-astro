import type { Locale } from "@/modules/i18n/types";

export const categories = ["회고", "리뷰", "기술", "일상", "기타", "디자인"] as const;

export type Category = (typeof categories)[number];

export function getCategoryLabel(category: Category, locale: Locale): string {
  if (locale === "ko") {
    return category;
  }

  switch (category) {
    case "회고":
      return "Retrospective";
    case "리뷰":
      return "Review";
    case "기술":
      return "Tech";
    case "일상":
      return "Life";
    case "기타":
      return "Misc";
    case "디자인":
      return "Design";
  }
}
