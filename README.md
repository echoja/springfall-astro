# springfall-astro

https://springfall.cc 블로그 소스코드.

Astro 5 + React 19 + Tailwind CSS 4 + MDX + CodeHike. Cloudflare Pages에 배포.

## Agent Notes

- Agent entrypoints such as `AGENTS.md` and `CLAUDE.md` should stay thin and point back to this README.
- When writing or editing Korean articles, follow [docs/writing-style.md](./docs/writing-style.md).

## 개발

```bash
pnpm install
pnpm dev
```

## 빌드

```bash
pnpm build
pnpm preview  # 로컬에서 빌드 결과 확인
```

`pnpm build` also validates that article canonicals, sitemap entries, RSS links, and the legacy redirect use localized article URLs.

## 배포

```bash
pnpm run deploy
```

`astro build` 후 `wrangler pages deploy`로 Cloudflare Pages에 배포합니다.

## URL Conventions

- `trailingSlash: "always"` is set in `astro.config.mjs`.
- Article URLs always include their locale (e.g., `/ko/article/2024-02/tsup/`).
- Build article URLs with `getArticlePath` from `src/modules/article/url.ts`.
- All internal page links **must** end with `/` (e.g., `/ko/article/2024-02/tsup/`, `/ko/til/`).
- Asset links (`/icon.png`, `/feed.xml`, CSS) do **not** get trailing slashes.
- Redirect destinations in `astro.config.mjs` must also include trailing slashes.
