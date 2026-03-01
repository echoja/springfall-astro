import { useCallback, useEffect, useState } from "react";

type ColorModeSetting = "light" | "dark" | "system";
type ResolvedColorMode = "light" | "dark";

const STORAGE_KEY = "colorMode";

function getInitialSetting(): ColorModeSetting {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(STORAGE_KEY) as ColorModeSetting | null;
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

function getSystemPreference(): ResolvedColorMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolve(setting: ColorModeSetting, systemPref: ResolvedColorMode): ResolvedColorMode {
  return setting === "system" ? systemPref : setting;
}

function applyTheme(resolved: ResolvedColorMode) {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }
  window.dispatchEvent(new CustomEvent("theme-change", { detail: { theme: resolved } }));
}

interface ThemeToggleProps {
  labels: { system: string; light: string; dark: string; group: string };
}

export default function ThemeToggle({ labels }: ThemeToggleProps) {
  const [setting, setSetting] = useState<ColorModeSetting>(getInitialSetting);
  const [systemPref, setSystemPref] = useState<ResolvedColorMode>(getSystemPreference);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (ev: MediaQueryListEvent) => setSystemPref(ev.matches ? "dark" : "light");
    mql.addEventListener("change", handler);
    setSystemPref(mql.matches ? "dark" : "light");
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    applyTheme(resolve(setting, systemPref));
  }, [setting, systemPref]);

  const select = useCallback((value: ColorModeSetting) => () => {
    localStorage.setItem(STORAGE_KEY, value);
    setSetting(value);
  }, []);

  const selected = (value: ColorModeSetting) => mounted ? setting === value : false;

  return (
    <div className="relative">
      <div
        role="radiogroup"
        aria-label={labels.group}
        className="inline-flex items-center overflow-hidden rounded-sm border border-gray-400/30 text-xs"
      >
        <SegButton label={labels.system} checked={selected("system")} onClick={select("system")} />
        <SegButton label={labels.light} checked={selected("light")} onClick={select("light")} />
        <SegButton label={labels.dark} checked={selected("dark")} onClick={select("dark")} />
      </div>
    </div>
  );
}

function SegButton({ label, checked, onClick }: { label: string; checked?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!checked}
      onClick={onClick}
      className={
        "px-2.5 py-1 whitespace-nowrap transition " +
        (checked
          ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
          : "hover:bg-gray-400/10")
      }
    >
      {label}
    </button>
  );
}
