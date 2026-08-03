/** Shared light/dark theme for portal + admin (localStorage + <html class="dark">). */
import { useCallback, useEffect, useState } from "react";

export type SiteTheme = "light" | "dark";

const STORAGE_KEY = "portal-marujo:theme";

function readStoredTheme(): SiteTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
    const legacy = localStorage.getItem("portal-marujo:admin-theme");
    if (legacy === "dark" || legacy === "light") return legacy;
  } catch {
    /* ignore */
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

function applyDomTheme(theme: SiteTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function useSiteTheme() {
  const [theme, setThemeState] = useState<SiteTheme>(() =>
    typeof window === "undefined" ? "light" : readStoredTheme(),
  );

  useEffect(() => {
    const next = readStoredTheme();
    setThemeState(next);
    applyDomTheme(next);
  }, []);

  const setTheme = useCallback((next: SiteTheme) => {
    setThemeState(next);
    applyDomTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem("portal-marujo:admin-theme", next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" } as const;
}

/** @deprecated use useSiteTheme */
export const useAdminTheme = useSiteTheme;
