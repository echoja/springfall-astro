# Virtual List Prototype

Question: can 10,000 variable-height items feel natural with normal window scrolling when every unseen row starts from one approximate height and only mounted rows are measured?

Run `pnpm dev`, then open `/prototype/virtual-list/`.

- `?variant=A`: one-column measured feed
- `?variant=B`: responsive Springfall-style one/two-column grid
- `?variant=C`: extreme height-variance stress test

## Shape

- One estimated row height per variant; no per-item height calculation.
- A Fenwick tree maps scroll offsets to rows and applies measured height deltas.
- One `ResizeObserver` measures mounted rows and applies each native observer batch immediately.
- Changes above the current anchor correct `window.scrollY`; changes below it only alter the total height.
- The Astro fallback is one estimated-height div, not an SSR list. It provides a scroll surface before React loads.

## Baseline Playwright performance run

Final production build, Chrome 151 / Pixel 10 emulation at 393×852:

- 6× CPU slowdown.
- 150 ms RTT, 1.6 Mbps down, 0.75 Mbps up, cache disabled.
- V8 launched with `--max-old-space-size=128`; Chrome reported a 227.9 MiB overall JS heap limit because the flag limits old space rather than every V8 heap region.
- Each variant ran a 2.5-second continuous scroll, five top/middle/bottom jump cycles, and forced GC before memory samples.

| Variant | First cards, cold | Scroll rAF p95 / max | Frames over 50 ms | Used heap before → after | Max mounted cards | Max DOM elements |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 6.82 s | 9.3 / 25.8 ms | 0 | 5.43 → 6.07 MiB | 13 | 164 |
| B | 6.88 s | 9.3 / 25.1 ms | 0 | 5.38 → 6.14 MiB | 15 | 163 |
| C | 6.92 s | 9.3 / 25.7 ms | 0 | 5.42 → 6.07 MiB | 15 | 210 |

FCP was 1.10–1.12 seconds. The cold first-card time is mainly asset delivery: the React renderer competed with several dynamically selected Korean font subsets. With the same 6× CPU slowdown and no network throttle, variant A rendered its first cards in 598 ms. This makes cold asset priority/caching a separate production concern from virtualization.

The single fallback div reduced cold-start CLS without recent input from about 0.082 to 0.0002. Under a harsher 150 ms / 0.4 Mbps pre-hydration test, a starting scroll position of 880,000 px became 881,057 px after hydration; mounted items were 4,992–5,004 and item 5,000 remained present.

At 820 px wide, variant B rendered two 344 px columns. A jump to item 5,000 mounted both items 4,999 and 5,000 with 30 cards total. Mobile resizing preserved the item-5,000 anchor. No console or page errors occurred in the final run.

## Immediate observer correction experiment

The original prototype copied `ResizeObserver` entries into a pending map and applied them in a separately scheduled animation frame. Removing that extra frame produced this result on variant C under 6× CPU slowdown, throttled mobile networking, and a 128 MiB V8 old-space cap:

- Forced row 4,999, immediately above the item-5,000 anchor, to grow by 180 px.
- `scrollY` corrected by exactly 180 px.
- Item 5,000 moved by 0 px in the viewport.
- Observer-to-`scrollBy` latency measured 0 ms.
- A subsequent 2.5-second continuous scroll had a 9.3 ms p95 frame interval, 9.4 ms maximum, and no frames over 50 ms.
- Eight article cards and 151 total DOM elements remained mounted; used JS heap after GC was 6.25 MiB.
- No console or page errors occurred.

This removes the guaranteed one-frame delay from height correction. Real content can still do expensive layout work before the observer callback, but the virtualizer no longer adds a second frame afterward.

## Verdict

The data structure and live-measurement approach are viable for 10,000 items: DOM size stays bounded, heap growth stays small, and deep jumps and continuous scrolling remain responsive under CPU throttling. The remaining decision is perceptual—whether the roughly 1,057 px deep-position correction feels natural during real touch scrolling. Cold React/font delivery should be optimized separately if this is promoted to the homepage.

Delete this route after the behavior is understood, or rewrite the winning approach as production code.
