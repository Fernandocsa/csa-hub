import { useCallback, useEffect, useState } from "react";
import { useSearch } from "wouter";

/** Read ?season=YYYY from the current search string; otherwise "all". */
export function seasonFromSearch(search: string): string {
  const raw = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(
    "season",
  );
  if (raw && /^\d{4}$/.test(raw)) return raw;
  return "all";
}

function currentPathWithSearch(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Season filter synced with ?season= on the current path.
 * "all" clears the query param.
 *
 * Uses history.pushState directly: wouter's setLocation often no-ops when only
 * the query string changes (same pathname), so browser Back skipped the filtered view.
 */
export function useSeasonQueryParam(basePath: string) {
  const search = useSearch();
  const [season, setSeasonState] = useState(() => seasonFromSearch(search));

  useEffect(() => {
    setSeasonState(seasonFromSearch(search));
  }, [search]);

  const setSeason = useCallback(
    (value: string) => {
      setSeasonState(value);
      const next =
        value === "all" ? basePath : `${basePath}?season=${encodeURIComponent(value)}`;
      if (currentPathWithSearch() === next) return;
      window.history.pushState(window.history.state, "", next);
      dispatchEvent(new PopStateEvent("popstate"));
    },
    [basePath],
  );

  return { season, setSeason } as const;
}
