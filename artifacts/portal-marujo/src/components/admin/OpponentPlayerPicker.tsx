import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntityPhoto } from "@/components/EntityPhoto";
import { adminFetch } from "@/hooks/useAdminAuth";
import { foldAccents } from "@/lib/accent-fold";

export type OpponentPlayerHit = {
  id: number;
  name: string;
  photoUrl: string | null;
  position: string | null;
  match: "exact" | "similar";
  csa: boolean;
};

type SearchRow = {
  id: number;
  name: string;
  photoUrl?: string | null;
  position?: string | null;
  csa?: boolean;
};

type NameCheckRow = {
  id: number;
  name: string;
  photoUrl?: string | null;
  match: "exact" | "similar";
  csa?: boolean;
};

/**
 * Auto-pick only a unique display-name exact hit.
 * Two exacts (CSA vs só-adversário, or two people with the same name) stay pending.
 * Similar-only never auto-resolves.
 */
export function pickUnambiguousOpponentPlayer(
  hits: OpponentPlayerHit[],
  query: string,
): OpponentPlayerHit | null {
  const q = foldAccents(query).trim();
  if (q.length < 2) return null;
  const exact = hits.filter((h) => foldAccents(h.name) === q);
  if (exact.length !== 1) return null;
  return exact[0];
}

type Props = {
  playerId: number | null;
  playerName: string;
  photoUrl?: string | null;
  disabledIds: Set<number>;
  onResolved: (hit: {
    id: number;
    name: string;
    position: string | null;
    photoUrl: string | null;
  }) => void;
  onClear: () => void;
  onQueryChange: (query: string) => void;
};

export function OpponentPlayerPicker({
  playerId,
  playerName,
  photoUrl,
  disabledIds,
  onResolved,
  onClear,
  onQueryChange,
}: Props) {
  const [query, setQuery] = useState(playerId == null ? playerName : "");
  const [focused, setFocused] = useState(false);
  const [userEdited, setUserEdited] = useState(false);
  const [searchHits, setSearchHits] = useState<SearchRow[]>([]);
  const [nameHits, setNameHits] = useState<NameCheckRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const dismissedKey = useRef("");
  const blurTimer = useRef<number | null>(null);
  const onResolvedRef = useRef(onResolved);
  const onClearRef = useRef(onClear);
  const onQueryChangeRef = useRef(onQueryChange);
  onResolvedRef.current = onResolved;
  onClearRef.current = onClear;
  onQueryChangeRef.current = onQueryChange;

  useEffect(() => {
    if (playerId != null) {
      setQuery("");
      setUserEdited(false);
    }
  }, [playerId]);

  useEffect(() => {
    return () => {
      if (blurTimer.current != null) window.clearTimeout(blurTimer.current);
    };
  }, []);

  const qTrim = query.trim();
  const shouldFetch = playerId == null && qTrim.length >= 2 && (focused || userEdited);

  useEffect(() => {
    if (!shouldFetch) {
      setSearchHits([]);
      setNameHits([]);
      return;
    }
    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const [searchRes, checkRes] = await Promise.all([
          adminFetch(
            `/admin/players/search?q=${encodeURIComponent(qTrim)}&limit=20`,
          ),
          adminFetch(
            `/admin/players/name-check?q=${encodeURIComponent(qTrim)}`,
          ),
        ]);
        if (ac.signal.aborted) return;
        const searchJson = searchRes.ok
          ? ((await searchRes.json()) as SearchRow[])
          : [];
        const checkJson = checkRes.ok
          ? ((await checkRes.json()) as { matches?: NameCheckRow[] })
          : { matches: [] };
        if (!ac.signal.aborted) {
          setSearchHits(Array.isArray(searchJson) ? searchJson : []);
          setNameHits(checkJson.matches ?? []);
        }
      } catch {
        if (!ac.signal.aborted) {
          setSearchHits([]);
          setNameHits([]);
        }
      }
    }, 250);
    return () => {
      ac.abort();
      window.clearTimeout(t);
    };
  }, [shouldFetch, qTrim, playerId]);

  const suggestions = useMemo(() => {
    const q = foldAccents(qTrim);
    const byId = new Map<number, OpponentPlayerHit>();
    for (const r of searchHits) {
      byId.set(r.id, {
        id: r.id,
        name: r.name,
        photoUrl: r.photoUrl?.trim() || null,
        position: r.position?.trim() || null,
        match: foldAccents(r.name) === q ? "exact" : "similar",
        csa: Boolean(r.csa),
      });
    }
    for (const h of nameHits) {
      const prev = byId.get(h.id);
      if (prev) {
        if (h.match === "exact" && prev.match === "similar") prev.match = "exact";
        if (h.csa) prev.csa = true;
        continue;
      }
      byId.set(h.id, {
        id: h.id,
        name: h.name,
        photoUrl: h.photoUrl?.trim() || null,
        position: null,
        match: foldAccents(h.name) === q ? "exact" : h.match,
        csa: Boolean(h.csa),
      });
    }
    return [...byId.values()]
      .filter((h) => !disabledIds.has(h.id))
      .sort((a, b) => {
        if (a.csa !== b.csa) return a.csa ? -1 : 1;
        if (a.match !== b.match) return a.match === "exact" ? -1 : 1;
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
      })
      .slice(0, 8);
  }, [searchHits, nameHits, qTrim, disabledIds]);

  const queryFolded = foldAccents(qTrim);
  const hasExact = suggestions.some((h) => foldAccents(h.name) === queryFolded);

  useEffect(() => {
    if (playerId != null || !userEdited) return;
    const picked = pickUnambiguousOpponentPlayer(suggestions, qTrim);
    if (!picked) return;
    const key = `${queryFolded}|${picked.id}`;
    if (dismissedKey.current === key) return;
    dismissedKey.current = key;
    onResolvedRef.current({
      id: picked.id,
      name: picked.name,
      position: picked.position,
      photoUrl: picked.photoUrl,
    });
  }, [suggestions, qTrim, queryFolded, userEdited, playerId]);

  if (playerId != null) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <EntityPhoto
          url={photoUrl}
          name={playerName}
          size="sm"
          shape="circle"
          label={`Foto de ${playerName}`}
        />
        <a
          href={`/admin/jogadores/${playerId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1B3A6B] hover:underline truncate font-medium"
        >
          {playerName || `Jogador #${playerId}`}
        </a>
        <button
          type="button"
          className="text-xs text-gray-500 hover:text-red-600 shrink-0"
          onClick={() => {
            dismissedKey.current = `${foldAccents(playerName).trim()}|${playerId}`;
            setQuery(playerName);
            onClearRef.current();
          }}
        >
          Limpar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 min-w-0">
      <Input
        className="h-8"
        placeholder="Buscar jogador…"
        value={query}
        onFocus={() => {
          if (blurTimer.current != null) window.clearTimeout(blurTimer.current);
          setFocused(true);
        }}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setFocused(false), 200);
        }}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          setUserEdited(true);
          setError("");
          onQueryChangeRef.current(next);
        }}
      />
      {playerName.trim() && !userEdited && (
        <p className="text-[11px] text-amber-700">
          Sem cadastro — resolva para salvar
        </p>
      )}
      {suggestions.length > 0 && (
        <div
          className="border rounded overflow-hidden"
          onMouseDown={(e) => e.preventDefault()}
        >
          <table className="w-full text-sm">
            <tbody>
              {suggestions.map((h, i) => (
                <tr key={h.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-1.5 py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <EntityPhoto
                        url={h.photoUrl}
                        name={h.name}
                        size="sm"
                        shape="circle"
                        label={`Foto de ${h.name}`}
                      />
                      <span className="truncate">{h.name}</span>
                    </div>
                  </td>
                  <td className="px-1.5 py-1 text-[11px] text-gray-500 whitespace-nowrap">
                    {h.csa ? "passagem CSA" : "só adversário"}
                    {h.match === "similar" ? " · similar" : ""}
                  </td>
                  <td className="px-1.5 py-1 text-center w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#1B3A6B]"
                      checked={false}
                      onChange={(e) => {
                        if (!e.target.checked) return;
                        dismissedKey.current = `${foldAccents(h.name).trim()}|${h.id}`;
                        onResolvedRef.current({
                          id: h.id,
                          name: h.name,
                          position: h.position,
                          photoUrl: h.photoUrl,
                        });
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {queryFolded.length >= 2 && !hasExact && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={creating}
          onMouseDown={(e) => e.preventDefault()}
          onClick={async () => {
            const name = qTrim;
            if (name.length < 2) return;
            setCreating(true);
            setError("");
            try {
              const r = await adminFetch("/admin/players", {
                method: "POST",
                body: JSON.stringify({ name }),
              });
              if (!r.ok) {
                const err = await r.json().catch(() => ({}));
                throw new Error(
                  (err as { error?: string }).error ?? "Erro ao criar jogador",
                );
              }
              const created = (await r.json()) as {
                id: number;
                name: string;
                position?: string | null;
                photoUrl?: string | null;
              };
              onResolvedRef.current({
                id: created.id,
                name: created.name,
                position: created.position ?? null,
                photoUrl: created.photoUrl ?? null,
              });
            } catch (e: unknown) {
              setError(e instanceof Error ? e.message : "Erro ao criar jogador");
            }
            setCreating(false);
          }}
        >
          {creating ? "Criando…" : `Criar novo: ${qTrim}`}
        </Button>
      )}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
