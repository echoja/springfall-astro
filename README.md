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
