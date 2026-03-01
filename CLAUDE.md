# Project: springfall

Follow @README.md 

Astro 5 blog deployed to Cloudflare Pages.

## URL Conventions

- `trailingSlash: "always"` is set in `astro.config.mjs`.
- All internal page links **must** end with `/` (e.g., `/article/2024-02/tsup/`, `/ko/til/`).
- Asset links (`/icon.png`, `/feed.xml`, CSS) do **not** get trailing slashes.
- Redirect destinations in `astro.config.mjs` must also include trailing slashes.
