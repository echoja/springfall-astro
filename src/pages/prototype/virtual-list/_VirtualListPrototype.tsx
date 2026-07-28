// PROTOTYPE — throwaway after the virtual-scroll behavior is understood.
// Three 10,000-item variable-height list shapes, switchable via ?variant=.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const ITEM_COUNT = 10_000;
const ROW_GAP = 16;
const OVERSCAN_VIEWPORTS = 2;

type VariantKey = "A" | "B" | "C";

type ArticleItem = {
  id: number;
  title: string;
  summary: string;
  date: string;
  category: string;
};

type ViewportState = {
  scrollY: number;
  height: number;
  listTop: number;
};

type VirtualModel = {
  columns: number;
  estimate: number;
  measured: Map<number, number>;
  rowCount: number;
  tree: FenwickTree;
};

const VARIANTS: Record<
  VariantKey,
  { name: string; description: string; estimate: number }
> = {
  A: {
    name: "Measured feed",
    description: "One column with ordinary variable-length summaries.",
    estimate: 176,
  },
  B: {
    name: "Springfall grid",
    description: "The current one/two-column homepage shape.",
    estimate: 224,
  },
  C: {
    name: "Variance stress test",
    description: "One column with occasional very tall entries.",
    estimate: 208,
  },
};
const VARIANT_KEYS = Object.keys(VARIANTS) as VariantKey[];

const SUMMARY_PARTS = [
  "가상 목록은 화면에 보이는 항목과 약간의 여유분만 DOM에 남깁니다.",
  "아직 방문하지 않은 행은 하나의 대략적인 높이를 사용합니다.",
  "실제 높이가 관측되면 누적 오프셋과 전체 스크롤 높이를 바로 고칩니다.",
  "현재 화면 위쪽의 오차만큼 scrollY를 보정하면 읽던 내용이 움직이지 않습니다.",
  "아래쪽 행의 변화는 스크롤 막대의 전체 길이에만 반영됩니다.",
  "이 문장은 카드마다 다른 높이를 만들기 위한 합성 데이터입니다.",
];

const CATEGORIES = ["기술", "리뷰", "회고", "일상"];

function createArticles(): ArticleItem[] {
  return Array.from({ length: ITEM_COUNT }, (_, index) => {
    const sentenceCount = 1 + ((index * 7) % 5);
    const summary = Array.from(
      { length: sentenceCount },
      (_, sentenceIndex) =>
        SUMMARY_PARTS[(index + sentenceIndex) % SUMMARY_PARTS.length],
    ).join(" ");
    const longTitle =
      index % 19 === 0
        ? " — 브라우저가 추정 높이와 실제 높이 사이의 차이를 자연스럽게 흡수하는 과정"
        : "";

    return {
      id: index,
      title: `가상화 실험 글 ${String(index + 1).padStart(5, "0")}${longTitle}`,
      summary,
      date: `20${String(20 + (index % 7)).padStart(2, "0")}.${String(
        1 + (index % 12),
      ).padStart(2, "0")}`,
      category: CATEGORIES[index % CATEGORIES.length],
    };
  });
}

class FenwickTree {
  readonly size: number;
  private readonly values: Float64Array;

  constructor(size: number, initialValue: number) {
    this.size = size;
    this.values = new Float64Array(size + 1);

    for (let index = 1; index <= size; index += 1) {
      this.values[index] += initialValue;
      const parent = index + (index & -index);
      if (parent <= size) this.values[parent] += this.values[index];
    }
  }

  add(index: number, delta: number) {
    for (let cursor = index + 1; cursor <= this.size; cursor += cursor & -cursor) {
      this.values[cursor] += delta;
    }
  }

  prefix(count: number) {
    let total = 0;
    for (let cursor = count; cursor > 0; cursor -= cursor & -cursor) {
      total += this.values[cursor];
    }
    return total;
  }

  total() {
    return this.prefix(this.size);
  }

  indexAtOffset(offset: number) {
    if (this.size === 0) return 0;

    const target = Math.max(0, Math.min(offset, this.total() - 1));
    let index = 0;
    let accumulated = 0;
    let step = 1;

    while (step * 2 <= this.size) step *= 2;

    for (; step > 0; step = Math.floor(step / 2)) {
      const next = index + step;
      if (
        next <= this.size &&
        accumulated + this.values[next] <= target
      ) {
        index = next;
        accumulated += this.values[next];
      }
    }

    return Math.min(index, this.size - 1);
  }
}

function useWideLayout() {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return wide;
}

function ArticleCard({
  item,
  variant,
}: {
  item: ArticleItem;
  variant: VariantKey;
}) {
  const position = item.id + 1;

  if (variant === "A") {
    return (
      <article
        role="listitem"
        aria-posinset={position}
        aria-setsize={ITEM_COUNT}
        className="grid grid-cols-[4rem_1fr] gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="font-mono text-sm text-gray-400">
          #{String(position).padStart(5, "0")}
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {item.date} · {item.category}
          </div>
          <h3 className="mb-2 text-lg leading-7 font-bold break-keep text-gray-900 dark:text-gray-100">
            {item.title}
          </h3>
          <p className="text-sm leading-6 break-keep">{item.summary}</p>
        </div>
      </article>
    );
  }

  if (variant === "B") {
    return (
      <article
        role="listitem"
        aria-posinset={position}
        aria-setsize={ITEM_COUNT}
        className="h-full rounded-md bg-gray-50 p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 sm:p-8"
      >
        <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {item.date}
          <span className="opacity-50"> | </span>
          {item.category}
        </div>
        <h3 className="mb-2 text-xl leading-7 font-bold break-keep text-gray-900 dark:text-gray-100">
          {item.title}
        </h3>
        <p className="text-sm leading-6 break-keep">{item.summary}</p>
      </article>
    );
  }

  const stressRepeat = item.id % 23 === 0 ? 5 : item.id % 7 === 0 ? 2 : 1;

  return (
    <article
      role="listitem"
      aria-posinset={position}
      aria-setsize={ITEM_COUNT}
      className="relative border-l-4 border-emerald-400 bg-emerald-50/70 p-5 pl-7 dark:bg-emerald-950/20"
    >
      <div className="absolute top-6 -left-2.5 h-4 w-4 rounded-full border-4 border-white bg-emerald-500 dark:border-gray-900" />
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-emerald-600 px-2 py-1 font-bold text-white">
          #{position}
        </span>
        <span>{item.date}</span>
        <span>{item.category}</span>
      </div>
      <h3 className="mb-3 text-xl font-black break-keep">{item.title}</h3>
      {Array.from({ length: stressRepeat }, (_, index) => (
        <p key={index} className="my-3 leading-7 break-keep">
          {item.summary}
        </p>
      ))}
    </article>
  );
}

function MeasuredRow({
  children,
  columns,
  offset,
  observe,
  rowIndex,
}: {
  children: ReactNode;
  columns: number;
  offset: number;
  observe: (rowIndex: number, node: HTMLDivElement | null) => void;
  rowIndex: number;
}) {
  const setNode = useCallback(
    (node: HTMLDivElement | null) => observe(rowIndex, node),
    [observe, rowIndex],
  );

  return (
    <div
      ref={setNode}
      data-row-index={rowIndex}
      className={columns === 2 ? "grid grid-cols-2 gap-4" : "grid grid-cols-1"}
      style={{
        boxSizing: "border-box",
        left: 0,
        paddingBottom: ROW_GAP,
        position: "absolute",
        top: 0,
        transform: `translateY(${offset}px)`,
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

function DynamicVirtualList({
  items,
  variant,
}: {
  items: ArticleItem[];
  variant: VariantKey;
}) {
  const wide = useWideLayout();
  const columns = variant === "B" && wide ? 2 : 1;
  const estimate = VARIANTS[variant].estimate;
  const rowCount = Math.ceil(items.length / columns);
  const listRef = useRef<HTMLDivElement>(null);
  const rowObserverRef = useRef<ResizeObserver | null>(null);
  const rowNodesRef = useRef(new Map<number, HTMLDivElement>());
  const viewportRef = useRef<ViewportState>({
    scrollY: 0,
    height: 800,
    listTop: 0,
  });
  const previousModelRef = useRef<VirtualModel | null>(null);
  const [listWidth, setListWidth] = useState(0);
  const [revision, setRevision] = useState(0);
  const [viewport, setViewport] = useState<ViewportState>(viewportRef.current);

  const model = useMemo<VirtualModel>(
    () => ({
      columns,
      estimate,
      measured: new Map(),
      rowCount,
      tree: new FenwickTree(rowCount, estimate),
    }),
    [columns, estimate, listWidth, rowCount, variant],
  );

  viewportRef.current = viewport;

  const readViewport = useCallback(() => {
    const listTop = listRef.current
      ? listRef.current.getBoundingClientRect().top + window.scrollY
      : 0;
    const next = {
      scrollY: window.scrollY,
      height: window.innerHeight,
      listTop,
    };
    viewportRef.current = next;
    setViewport(next);
  }, []);

  useLayoutEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        readViewport();
      });
    };

    readViewport();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [readViewport]);

  useLayoutEffect(() => {
    if (!listRef.current) return;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setListWidth(Math.round(entry.contentRect.width));
        readViewport();
      });
    });
    observer.observe(listRef.current);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [readViewport]);

  useLayoutEffect(() => {
    const previous = previousModelRef.current;
    previousModelRef.current = model;
    if (!previous || viewportRef.current.listTop === 0) return;

    const relativeScroll = Math.max(
      0,
      window.scrollY - viewportRef.current.listTop,
    );
    const oldRow = previous.tree.indexAtOffset(relativeScroll);
    const oldOffset = previous.tree.prefix(oldRow);
    const anchorItem = oldRow * previous.columns;
    const newRow = Math.floor(anchorItem / model.columns);
    const withinRow = Math.max(0, relativeScroll - oldOffset);
    const nextScroll =
      viewportRef.current.listTop +
      model.tree.prefix(newRow) +
      Math.min(withinRow, model.estimate - 1);

    window.scrollTo({ top: nextScroll });
    readViewport();
  }, [model, readViewport]);

  useLayoutEffect(() => {
    const pending = new Map<number, number>();
    let frame = 0;

    const flush = () => {
      frame = 0;
      const currentViewport = viewportRef.current;
      const relativeScroll = Math.max(
        0,
        currentViewport.scrollY - currentViewport.listTop,
      );
      const anchorRow = model.tree.indexAtOffset(relativeScroll);
      let correction = 0;
      let changed = false;

      for (const [rowIndex, nextHeight] of pending) {
        const previousHeight = model.measured.get(rowIndex) ?? model.estimate;
        const delta = nextHeight - previousHeight;
        if (Math.abs(delta) < 0.5) continue;

        model.measured.set(rowIndex, nextHeight);
        model.tree.add(rowIndex, delta);
        if (rowIndex < anchorRow) correction += delta;
        changed = true;
      }
      pending.clear();

      if (correction !== 0 && currentViewport.scrollY > currentViewport.listTop) {
        window.scrollBy({ top: correction });
      }
      if (changed) {
        setRevision((value) => value + 1);
        readViewport();
      }
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rowIndex = Number((entry.target as HTMLElement).dataset.rowIndex);
        const box = Array.isArray(entry.borderBoxSize)
          ? entry.borderBoxSize[0]
          : entry.borderBoxSize;
        const height = Math.ceil(box?.blockSize ?? entry.contentRect.height);
        pending.set(rowIndex, height);
      }

      if (!frame) frame = window.requestAnimationFrame(flush);
    });
    rowObserverRef.current = observer;
    rowNodesRef.current.forEach((node) => observer.observe(node));

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      if (rowObserverRef.current === observer) rowObserverRef.current = null;
    };
  }, [model, readViewport]);

  const observeRow = useCallback(
    (rowIndex: number, node: HTMLDivElement | null) => {
      const previous = rowNodesRef.current.get(rowIndex);
      if (previous) rowObserverRef.current?.unobserve(previous);

      if (node) {
        rowNodesRef.current.set(rowIndex, node);
        rowObserverRef.current?.observe(node);
      } else {
        rowNodesRef.current.delete(rowIndex);
      }
    },
    [],
  );

  const totalHeight = model.tree.total();
  const relativeTop = Math.max(0, viewport.scrollY - viewport.listTop);
  const overscan = viewport.height * OVERSCAN_VIEWPORTS;
  const startRow = model.tree.indexAtOffset(Math.max(0, relativeTop - overscan));
  const endRow = Math.min(
    rowCount - 1,
    model.tree.indexAtOffset(relativeTop + viewport.height + overscan),
  );
  const visibleRows = [];

  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
    const offset = model.tree.prefix(rowIndex);
    const cards = [];

    for (let column = 0; column < columns; column += 1) {
      const item = items[rowIndex * columns + column];
      if (!item) continue;
      cards.push(<ArticleCard key={item.id} item={item} variant={variant} />);
    }

    visibleRows.push(
      <MeasuredRow
        key={`${variant}-${columns}-${rowIndex}`}
        columns={columns}
        offset={offset}
        observe={observeRow}
        rowIndex={rowIndex}
      >
        {cards}
      </MeasuredRow>,
    );
  }

  const jumpToItem = (itemIndex: number) => {
    const rowIndex = Math.floor(itemIndex / columns);
    const top = viewportRef.current.listTop + model.tree.prefix(rowIndex);
    window.scrollTo({ top, behavior: "auto" });
  };

  return (
    <>
      <div className="sticky top-3 z-30 mb-4 flex flex-wrap gap-2 rounded-lg border border-gray-300 bg-white/90 p-3 text-xs shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/90">
        <strong>{VARIANTS[variant].name}</strong>
        <span>rows {startRow + 1}–{endRow + 1}</span>
        <span>DOM cards ≤ {visibleRows.length * columns}</span>
        <span>measured {model.measured.size}/{rowCount}</span>
        <span>revision {revision}</span>
        <span>{Math.round(totalHeight).toLocaleString()}px</span>
        <span className="ml-auto flex gap-1">
          {[0, 4_999, 9_999].map((index) => (
            <button
              key={index}
              type="button"
              className="rounded bg-gray-900 px-2 py-1 text-white dark:bg-gray-100 dark:text-gray-900"
              onClick={() => jumpToItem(index)}
            >
              #{(index + 1).toLocaleString()}
            </button>
          ))}
        </span>
      </div>

      <div
        ref={listRef}
        role="list"
        aria-label={`${ITEM_COUNT.toLocaleString()} synthetic articles`}
        className="relative"
        style={{ height: `${totalHeight}px` }}
      >
        {visibleRows}
      </div>
    </>
  );
}

function PrototypeSwitcher({
  current,
  onChange,
}: {
  current: VariantKey;
  onChange: (variant: VariantKey) => void;
}) {
  const enabled = import.meta.env.DEV;

  const cycle = useCallback(
    (direction: -1 | 1) => {
      const currentIndex = VARIANT_KEYS.indexOf(current);
      const nextIndex =
        (currentIndex + direction + VARIANT_KEYS.length) % VARIANT_KEYS.length;
      onChange(VARIANT_KEYS[nextIndex]);
    },
    [current, onChange],
  );

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches("input, textarea, [contenteditable='true']") ||
        (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
      ) {
        return;
      }
      event.preventDefault();
      cycle(event.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cycle, enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-gray-950 px-3 py-2 text-sm text-white shadow-2xl ring-1 ring-white/20">
      <button
        type="button"
        aria-label="Previous prototype variant"
        className="rounded-full px-3 py-1 hover:bg-white/15"
        onClick={() => cycle(-1)}
      >
        ←
      </button>
      <span className="min-w-44 text-center font-semibold">
        {current} — {VARIANTS[current].name}
      </span>
      <button
        type="button"
        aria-label="Next prototype variant"
        className="rounded-full px-3 py-1 hover:bg-white/15"
        onClick={() => cycle(1)}
      >
        →
      </button>
    </div>
  );
}

function readVariant(): VariantKey {
  if (typeof window === "undefined") return "A";
  const candidate = new URL(window.location.href).searchParams.get("variant");
  return candidate === "B" || candidate === "C" ? candidate : "A";
}

export default function VirtualListPrototype() {
  const items = useMemo(createArticles, []);
  const [variant, setVariant] = useState<VariantKey>(readVariant);

  const changeVariant = useCallback((next: VariantKey) => {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next);
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0 });
    setVariant(next);
  }, []);

  useEffect(() => {
    const onPopState = () => setVariant(readVariant());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <>
      <div className="mb-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-900">
        <strong>PROTOTYPE:</strong> {VARIANTS[variant].description} All unvisited
        rows begin with one {VARIANTS[variant].estimate}px estimate. ResizeObserver
        replaces estimates only for mounted rows.
      </div>
      <DynamicVirtualList key={variant} items={items} variant={variant} />
      <PrototypeSwitcher current={variant} onChange={changeVariant} />
    </>
  );
}
