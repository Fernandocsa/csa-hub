import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";

/** Read ?season=YYYY from the current search string; otherwise "all". */
export function seasonFromSearch(search: string): string {
  const raw = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(
    "season",
  );
  if (raw && /^\d{4}$/.test(raw)) return raw;
  return "all";
}

/**
 * Season filter synced with ?season= on the current path.
 * "all" clears the query param.
 */
export function useSeasonQueryParam(basePath: string) {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const [season, setSeasonState] = useState(() => seasonFromSearch(search));

  useEffect(() => {
    setSeasonState(seasonFromSearch(search));
  }, [search]);

  const setSeason = useCallback(
    (value: string) => {
      setSeasonState(value);
      const next =
        value === "all" ? basePath : `${basePath}?season=${encodeURIComponent(value)}`;
      setLocation(next);
    },
    [basePath, setLocation],
  );

  return { season, setSeason } as const;
}
