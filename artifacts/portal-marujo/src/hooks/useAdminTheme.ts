/** Admin panel light/dark theme (localStorage). */
import { useCallback, useEffect, useState } from "react";

export type AdminTheme = "light" | "dark";

const STORAGE_KEY = "portal-marujo:admin-theme";

function readStoredTheme(): AdminTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function useAdminTheme() {
  const [theme, setThemeState] = useState<AdminTheme>(() =>
    typeof window === "undefined" ? "light" : readStoredTheme(),
  );

  useEffect(() => {
    setThemeState(readStoredTheme());
  }, []);

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" } as const;
}
