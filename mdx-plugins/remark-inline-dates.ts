const DATE_PATTERN = /\b20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b/g;
const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;
const DATE_CLASS_NAME = "inline-date";

type MarkdownNode = {
  type: string;
  value?: unknown;
  children?: MarkdownNode[];
  [key: string]: unknown;
};

type MarkdownParent = {
  children?: MarkdownNode[];
};

type TextNode = MarkdownNode & {
  type: "text";
  value: string;
};

type MdxJsxTextElement = MarkdownNode & {
  type: "mdxJsxTextElement";
  name: "span";
  attributes: Array<{
    type: "mdxJsxAttribute";
    name: "className";
    value: typeof DATE_CLASS_NAME;
  }>;
  children: TextNode[];
};

type ReplacementNode = TextNode | MdxJsxTextElement;

const SKIP_CHILDREN_FOR_TYPES = new Set<string>([
  "code",
  "inlineCode",
  "mdxFlowExpression",
  "mdxTextExpression",
  "mdxjsEsm",
]);

function getUrlRanges(value: string): Array<[start: number, end: number]> {
  const ranges: Array<[start: number, end: number]> = [];

  URL_PATTERN.lastIndex = 0;
  for (const match of value.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;

    ranges.push([index, index + match[0].length]);
  }

  return ranges;
}

function isInsideRange(
  index: number,
  ranges: Array<[start: number, end: number]>,
): boolean {
  return ranges.some(([start, end]) => index >= start && index < end);
}

function splitTextWithInlineDates(value: string): ReplacementNode[] | null {
  const ranges = getUrlRanges(value);
  const nodes: ReplacementNode[] = [];
  let lastIndex = 0;
  let changed = false;

  DATE_PATTERN.lastIndex = 0;
  for (const match of value.matchAll(DATE_PATTERN)) {
    const index = match.index ?? 0;
    const matchedDate = match[0];

    if (isInsideRange(index, ranges)) {
      continue;
    }

    if (index > lastIndex) {
      nodes.push({ type: "text", value: value.slice(lastIndex, index) });
    }

    nodes.push({
      type: "mdxJsxTextElement",
      name: "span",
      attributes: [
        {
          type: "mdxJsxAttribute",
          name: "className",
          value: DATE_CLASS_NAME,
        },
      ],
      children: [{ type: "text", value: matchedDate }],
    });
    lastIndex = index + matchedDate.length;
    changed = true;
  }

  if (!changed) {
    return null;
  }

  if (lastIndex < value.length) {
    nodes.push({ type: "text", value: value.slice(lastIndex) });
  }

  return nodes;
}

function isTextNode(node: MarkdownNode): node is TextNode {
  return node.type === "text" && typeof node.value === "string";
}

function transformChildren(parent: MarkdownParent): void {
  if (!Array.isArray(parent.children)) {
    return;
  }

  for (let index = 0; index < parent.children.length; index += 1) {
    const child = parent.children[index];

    if (isTextNode(child)) {
      const replacement = splitTextWithInlineDates(child.value);

      if (replacement) {
        parent.children.splice(index, 1, ...replacement);
        index += replacement.length - 1;
      }

      continue;
    }

    if (!SKIP_CHILDREN_FOR_TYPES.has(child.type)) {
      transformChildren(child);
    }
  }
}

export default function remarkInlineDates() {
  return function transformer(tree: MarkdownParent): void {
    transformChildren(tree);
  };
}
