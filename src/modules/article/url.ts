import type { Locale } from "@modules/i18n/types";

interface ArticleRouteSource {
  id: string;
  data: {
    locale?: Locale;
  };
}

export function getArticlePath(article: ArticleRouteSource): string {
  const [yearMonth, slug] = article.id.split("/");
  const locale = article.data.locale ?? "ko";

  return `/${locale}/article/${yearMonth}/${slug}/`;
}
