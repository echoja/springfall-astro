# Known Issues

## "Invalid hook call" warning in dev mode (harmless)

**Symptom:** `Invalid hook call. Hooks can only be called inside of the body of a function component.` appears in the terminal during `pnpm dev`.

**Root cause:** Known Astro bug ([#12802](https://github.com/withastro/astro/issues/12802)). The `check()` function in `@astrojs/react` and `@astrojs/mdx` calls React components as plain functions to detect renderer type, triggering React 19's stricter hook validation.

**Impact:** Dev-mode only warning. Does NOT affect build or deployed site. Pages render correctly (200 status).

**Fix status:** Fixed in [PR #12913](https://github.com/withastro/astro/pull/12913), but only available in beta versions (`@astrojs/mdx@5.0.0-beta.*`). Both `@astrojs/react@4.4.2` and `@astrojs/mdx@4.3.13` are the latest stable as of 2026-03.

**Action:** Ignore. Will be resolved when Astro 5 stable integrations include the fix.
