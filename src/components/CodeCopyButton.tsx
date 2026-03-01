export function CodeCopyButton({ text }: { text: string }) {
  return (
    <button
      className="code-copy-btn absolute top-1 right-1 block cursor-pointer rounded-sm bg-[rgba(46,52,64,0.5)] p-1 text-zinc-200 hover:bg-gray-400/20"
      aria-label="Copy to clipboard"
      data-code={text}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
    </button>
  );
}
