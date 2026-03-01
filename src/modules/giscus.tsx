import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";

type ResolvedColorMode = "light" | "dark";

function getResolvedTheme(): ResolvedColorMode {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

interface GiscusProps extends ComponentProps<"div"> {
  locale?: string;
}

const Giscus: React.FC<GiscusProps> = ({ locale = "ko", ...props }) => {
  const loaded = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<ResolvedColorMode>("light");

  useEffect(() => {
    setTheme(getResolvedTheme());

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.theme) {
        setTheme(detail.theme);
      }
    };
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, []);

  useEffect(() => {
    if (!containerRef.current || loaded.current) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", "echoja/springfall-comments");
    script.setAttribute("data-repo-id", "R_kgDOIWvdzg");
    script.setAttribute("data-category-id", "DIC_kwDOIWvdzs4C0ctx");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    script.setAttribute("data-lang", locale);
    script.setAttribute("data-loading", "lazy");

    containerRef.current.appendChild(script);
    loaded.current = true;
  }, [theme, locale]);

  useEffect(() => {
    if (!loaded.current) return;

    const iframe = document.querySelector<HTMLIFrameElement>(
      "iframe.giscus-frame",
    );
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          giscus: {
            setConfig: {
              theme: theme === "dark" ? "dark" : "light",
              lang: locale,
            },
          },
        },
        "https://giscus.app",
      );
    }
  }, [theme, locale]);

  return <div {...props} ref={containerRef} />;
};

export default Giscus;
