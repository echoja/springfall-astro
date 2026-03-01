# Architecture Notes

## MDX Component Overrides

- Defined in `src/modules/article/mdx-components.ts`
- Maps HTML elements (h2, a, code, etc.) to React components
- Components are in `block-components.tsx`, `format-components.tsx`, `list-components.tsx`

## ArticleImage (src/modules/article/ArticleImage.astro)

- Supports `src` prop (string URL) and `img` prop (imported ImageMetadata)
- String captions via `caption` prop
- Rich captions (with links/HTML) via default slot (children)
- `.tsx` version exists but is unused — Astro version handles both patterns

## Heading Anchors

- rehype-autolink-headings adds anchors to h2-h6
- Detection in `Anchor` component uses `tabIndex === -1` (not className) because className from rehype gets lost during Astro→React prop conversion
- Styling in `src/common/globals.css` using `.heading-anchor` class and `h2:has(.heading-anchor)` selector

## Code Blocks (CodeHike)

- `Code` component in `format-components.tsx` is async (uses `await highlight()`)
- `CodeCopyButton` uses vanilla JS (not React hooks) — static HTML button + event delegation script in `ArticleLayout.astro`
- Reason: React components inside CodeHike rendering pipeline aren't hydrated

## Interactive React Components in MDX

- Must have `client:load` (or similar) directive to work
- Without it, hooks fail silently and components render as static HTML
- Examples: UI (glassmorphism), ContentGraph, PostPage, FoodOrderApp, ShowAllCurrency, Tester, ExpandableText

## URL Conventions

- `trailingSlash: "always"` is configured in `astro.config.mjs`
- All internal page links must end with `/` (e.g., `/article/2024-02/tsup/`)
- Asset links (`/icon.png`, `/feed.xml`, CSS) do not get trailing slashes
- Cloudflare Pages issues 308 redirects for missing trailing slashes; this config eliminates those extra round-trips

## CSS

- Pretendard font CSS loaded via `<link>` tag in BaseLayout.astro (not ES import — public dir CSS can't be imported as modules)
