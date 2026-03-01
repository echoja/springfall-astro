# springfall-astro

https://springfall.cc 블로그 소스코드.

Astro 5 + React 19 + Tailwind CSS 4 + MDX + CodeHike. Cloudflare Pages에 배포.

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

## 배포

```bash
pnpm deploy
```

`astro build` 후 `wrangler pages deploy`로 Cloudflare Pages에 배포합니다.

## URL Conventions

- `trailingSlash: "always"` is set in `astro.config.mjs`.
- All internal page links **must** end with `/` (e.g., `/article/2024-02/tsup/`, `/ko/til/`).
- Asset links (`/icon.png`, `/feed.xml`, CSS) do **not** get trailing slashes.
- Redirect destinations in `astro.config.mjs` must also include trailing slashes.