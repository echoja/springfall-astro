# LLM-Friendly Evidence Links

Checked on 2026-07-22. The narrow goal is to make a Springfall article a stable, public source for a Career database claim. It is not to optimize the whole blog for model training.

## Recommendation

Use the public article URL now:

```text
https://springfall.cc/ko/article/2023-06/company-contest/
```

The deployed response already contains the full article in its initial HTML and uses `<main>`, `<article>`, headings with IDs, image alt text, a self-referencing canonical link, and `BlogPosting` JSON-LD ([deployed article](https://springfall.cc/ko/article/2023-06/company-contest/), [HTML `article` definition](https://html.spec.whatwg.org/multipage/sections.html#the-article-element), [Google Article structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/article)). The repo also already generates a sitemap and permissive origin `robots.txt` ([Astro sitemap integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/), [deployed robots.txt](https://springfall.cc/robots.txt)). No LLM-specific rewrite is needed for this Evidence link; Google explicitly says that ordinary search best practices still apply to its generative AI features and that special AI files, Markdown copies, artificial chunking, and AI-only rewriting are unnecessary ([Google's generative-AI search guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)).

Implement only these small changes:

1. **Choose one language-explicit URL for each article.** At the time of research, the same Korean contest article was published at both [`/article/.../`](https://springfall.cc/article/2023-06/company-contest/) and [`/ko/article/.../`](https://springfall.cc/ko/article/2023-06/company-contest/); each page declared itself canonical, and both occurred in the [deployed sitemap](https://springfall.cc/sitemap-0.xml). Use `/{locale}/article/.../` for every article, remove the duplicate static route from the sitemap, and permanently redirect `/article/.../` to `/ko/article/.../`. Canonical signals should agree, and redirects plus `rel="canonical"` are stronger canonicalization signals than sitemap inclusion alone ([Google canonicalization guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)).
2. **Treat the whole page URL as the Evidence identifier.** Do not use fragments. The locale, year-month, and slug remain stable after a URL becomes Evidence; if a route must change later, preserve the old URL with a permanent redirect.
3. **Keep search/retrieval bots allowed separately from training bots.** OpenAI documents `OAI-SearchBot` for ChatGPT search and `GPTBot` for model training as independent controls ([OpenAI crawler documentation](https://developers.openai.com/api/docs/bots)). Anthropic similarly distinguishes `Claude-SearchBot`, `Claude-User`, and its training crawler ([Anthropic crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)). Springfall's deployed `robots.txt` currently allows the wildcard group while Cloudflare prepends managed rules that block `GPTBot` and `ClaudeBot`; this is compatible with public evidence retrieval because the search-specific bots are not disallowed ([deployed robots.txt](https://springfall.cc/robots.txt), [Cloudflare managed robots documentation](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/)). Keep AI Search and Agent access allowed in Cloudflare's dashboard if the intent is that assistants can fetch Evidence links; Cloudflare exposes Search, Agent, and Training as separate policies ([Cloudflare AI bot policy documentation](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/)).

## Features to defer

### `llms.txt`

Do not add it in the first iteration. Its own project calls it a proposal, so treat it as an emerging convention rather than an established standard ([Answer.AI `llms.txt` repository](https://github.com/AnswerDotAI/llms-txt)). Google says it does not use `llms.txt` for Search or its generative AI features ([Google's generative-AI search guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)). It may later be useful as a tiny curated index for tools that voluntarily support the proposal, but it should not be treated as crawler permission, canonicalization, or a replacement for navigable HTML and the sitemap.

### Markdown/plain-text article endpoints

Do not build separate `.md` routes in Astro. They would introduce another representation and maintenance surface without being required for Google or for the current Evidence use case ([Google's generative-AI search guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)). If Springfall is already on Cloudflare Pro, Business, or Enterprise and Markdown retrieval becomes measurably useful, Cloudflare's beta **Markdown for Agents** is the smaller experiment: one dashboard setting can return converted Markdown when a client sends `Accept: text/markdown`, while preserving page metadata and JSON-LD ([Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)). It is not currently enabled on the deployed contest article because that request still returns `text/html` ([deployed article](https://springfall.cc/ko/article/2023-06/company-contest/)). Before enabling it, set an origin `Content-Signal` response header deliberately: Cloudflare documents a default of `ai-train=yes, search=yes, ai-input=yes` when the origin sends no header, which would conflict with Springfall's current training opt-out ([Cloudflare Markdown for Agents: Content Signals](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/#content-signals-policy)).

## Minimal acceptance checks

- The chosen Evidence URL returns `200`, contains the article text in the response HTML, and has one self-canonical URL ([deployed article](https://springfall.cc/ko/article/2023-06/company-contest/)).
- Only that chosen URL is emitted for the article in the sitemap; a retired duplicate permanently redirects to it ([Google canonicalization guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)).
- `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, and `Claude-User` are not disallowed when assistant retrieval is desired; training access remains a separate choice ([OpenAI crawler documentation](https://developers.openai.com/api/docs/bots), [Anthropic crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)).
- Basana Evidence uses the whole language-explicit article URL without fragments.

## Google Search Console after deployment

Do not use Search Console's **Change of Address** tool. Google reserves it for domain or subdomain moves and says that path changes within one site need redirects and an updated sitemap instead ([Change of Address guidance](https://support.google.com/webmasters/answer/9370220?hl=en)). Keep the existing sitemap URL, deploy the updated contents, and optionally resubmit it in the Sitemaps report because this migration changes every article URL. Google periodically recrawls a successfully submitted sitemap, so resubmission is useful but not mandatory ([Sitemaps report](https://support.google.com/webmasters/answer/7451001?hl=en-GB)). After deployment, inspect one representative `/ko/article/.../` URL and monitor sitemap indexing rather than requesting every article individually ([URL Inspection guidance](https://support.google.com/webmasters/answer/9012289?hl=en)).
