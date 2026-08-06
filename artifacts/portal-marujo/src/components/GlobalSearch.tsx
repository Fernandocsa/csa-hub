import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Loader2, Users, Shield, Trophy, CalendarDays, X } from "lucide-react";
import {
  listPlayers,
  listOpponents,
  listManagers,
  listSeasons,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { foldAccents } from "@/lib/accent-fold";

type SearchHit = {
  key: string;
  href: string;
  label: string;
  meta?: string;
  kind: "player" | "opponent" | "manager" | "season";
};

const KIND_ICON = {
  player: Users,
  opponent: Shield,
  manager: Trophy,
  season: CalendarDays,
} as const;

const KIND_LABEL = {
  player: "Jogador",
  opponent: "Adversário",
  manager: "Técnico",
  season: "Temporada",
} as const;

async function runSearch(q: string, signal: AbortSignal): Promise<SearchHit[]> {
  const query = q.trim();
  if (query.length < 2) return [];

  const yearOnly = /^\d{4}$/.test(query);
  const [playersRes, opponentsRes, managers, seasons] = await Promise.all([
    listPlayers({ search: query, limit: 6 }, { signal }).catch(() => null),
    listOpponents({ search: query, limit: 6 }, { signal }).catch(() => null),
    listManagers({ signal }).catch(() => null),
    listSeasons({ signal }).catch(() => null),
  ]);

  const hits: SearchHit[] = [];
  const nq = foldAccents(query).trim();

  for (const p of playersRes?.data ?? []) {
    hits.push({
      key: `player-${p.id}`,
      href: `/jogadores/${p.id}`,
      label: p.name,
      meta: p.position ?? undefined,
      kind: "player",
    });
  }

  for (const o of opponentsRes?.data ?? []) {
    hits.push({
      key: `opponent-${o.id}`,
      href: `/adversarios/${o.id}`,
      label: o.name,
      meta: `${o.matches} jogos`,
      kind: "opponent",
    });
  }

  if (Array.isArray(managers)) {
    const matched = managers
      .filter((m) => foldAccents(m.name).includes(nq))
      .slice(0, 6);
    for (const m of matched) {
      hits.push({
        key: `manager-${m.id}`,
        href: `/tecnicos/${m.id}`,
        label: m.name,
        meta: "Técnico",
        kind: "manager",
      });
    }
  }

  if (Array.isArray(seasons)) {
    const matched = seasons
      .filter((s) => {
        const y = String(s.year);
        return yearOnly ? y === query : y.includes(query);
      })
      .slice(0, 6);
    for (const s of matched) {
      hits.push({
        key: `season-${s.year}`,
        href: `/temporadas/${s.year}`,
        label: String(s.year),
        meta: `${s.matches} jogos`,
        kind: "season",
      });
    }
  }

  return hits.slice(0, 16);
}

export function GlobalSearch({
  className,
  autoFocus = false,
  size = "md",
}: {
  className?: string;
  autoFocus?: boolean;
  size?: "sm" | "md";
}) {
  const listId = useId();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    const t = window.setTimeout(() => {
      runSearch(q, ac.signal)
        .then((rows) => {
          if (!ac.signal.aborted) {
            setHits(rows);
            setActive(0);
            setOpen(true);
          }
        })
        .catch(() => {
          if (!ac.signal.aborted) setHits([]);
        })
        .finally(() => {
          if (!ac.signal.aborted) setLoading(false);
        });
    }, 280);

    return () => {
      ac.abort();
      window.clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(hit: SearchHit) {
    setOpen(false);
    setQuery("");
    setHits([]);
    setLocation(hit.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && hits.length > 0 && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
    }
    if (!open || hits.length === 0) {
      if (e.key === "Escape") {
        setQuery("");
        setOpen(false);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(hits[active] ?? hits[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <label className="sr-only" htmlFor={listId}>
        Busca global
      </label>
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          )}
        />
        <input
          ref={inputRef}
          id={listId}
          type="search"
          value={query}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder="Buscar jogador, adversário, técnico ou ano…"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full rounded-md border border-border bg-background pl-9 pr-9 text-sm",
            "placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
            size === "sm" ? "h-9" : "h-11",
          )}
          data-testid="input-global-search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${listId}-list`}
          aria-autocomplete="list"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery("");
              setHits([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showPanel && (
        <div
          id={`${listId}-list`}
          role="listbox"
          className="absolute z-50 mt-1.5 w-full max-h-80 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg"
          data-testid="global-search-results"
        >
          {loading && hits.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Buscando…</p>
          ) : hits.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Nenhum resultado para “{query.trim()}”.
            </p>
          ) : (
            <ul className="py-1">
              {hits.map((hit, i) => {
                const Icon = KIND_ICON[hit.kind];
                return (
                  <li key={hit.key} role="option" aria-selected={i === active}>
                    <Link
                      href={hit.href}
                      onClick={(e) => {
                        e.preventDefault();
                        go(hit);
                      }}
                    >
                      <span
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer",
                          i === active ? "bg-muted" : "hover:bg-muted/60",
                        )}
                        onMouseEnter={() => setActive(i)}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="font-medium block truncate">{hit.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {KIND_LABEL[hit.kind]}
                            {hit.meta ? ` · ${hit.meta}` : ""}
                          </span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
