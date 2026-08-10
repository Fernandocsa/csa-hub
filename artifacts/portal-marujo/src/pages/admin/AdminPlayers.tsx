import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";
import { AdminMergeButton } from "@/components/AdminMergeButton";
import { withAdminFrom } from "@/hooks/useAdminReturnTo";
import { PlayerPhoto } from "@/components/PlayerPhoto";
import type { Player } from "./AdminPlayerDetail";
import { includesFolded } from "@/lib/accent-fold";
import { formatSeasonSpans } from "@/lib/format-season-spans";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const LIST_PATH = "/admin/jogadores";

type AdminPlayerRow = Player & { seasons?: string[] };

function nameInitial(name: string): string {
  const ch = name.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(ch) ? ch : "#";
}

function filtersFromSearch(search: string): { q: string; letter: string | null } {
  const qs = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const q = qs.get("q") ?? "";
  const letterRaw = qs.get("letter");
  if (letterRaw === "#") return { q, letter: "#" };
  if (letterRaw && /^[A-Za-z]$/.test(letterRaw)) {
    return { q, letter: letterRaw.toUpperCase() };
  }
  return { q, letter: null };
}

function buildListPath(q: string, letter: string | null): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (letter) params.set("letter", letter);
  const qs = params.toString();
  return qs ? `${LIST_PATH}?${qs}` : LIST_PATH;
}

function currentPathWithSearch(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export default function AdminPlayers() {
  const [, setLocation] = useLocation();
  const urlSearch = useSearch();
  const [players, setPlayers] = useState<AdminPlayerRow[]>([]);
  const [search, setSearch] = useState(() => filtersFromSearch(urlSearch).q);
  const [letter, setLetter] = useState<string | null>(
    () => filtersFromSearch(urlSearch).letter,
  );
  const [loading, setLoading] = useState(true);

  // Browser Back / Forward restores ?q= / ?letter=
  useEffect(() => {
    const next = filtersFromSearch(urlSearch);
    setSearch(next.q);
    setLetter(next.letter);
  }, [urlSearch]);

  const listPath = useMemo(() => buildListPath(search, letter), [search, letter]);

  const syncUrl = useCallback((q: string, nextLetter: string | null) => {
    const next = buildListPath(q, nextLetter);
    if (currentPathWithSearch() === next) return;
    // replaceState: typing must not flood history; Back from a profile returns here
    window.history.replaceState(window.history.state, "", next);
  }, []);

  function onSearchChange(value: string) {
    setSearch(value);
    syncUrl(value, letter);
  }

  function onLetterChange(next: string | null) {
    setLetter(next);
    syncUrl(search, next);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/players");
    if (r.ok) setPlayers(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function deletePlayer(id: number) {
    if (!confirm("Excluir este jogador e todas as suas estatísticas?")) return;
    await adminFetch(`/admin/players/${id}`, { method: "DELETE" });
    await load();
  }

  function openPlayer(id: number) {
    setLocation(withAdminFrom(`${LIST_PATH}/${id}`, listPath));
  }

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (
        search.trim() &&
        !includesFolded(p.name, search) &&
        !includesFolded(p.fullName, search)
      ) {
        return false;
      }
      if (letter == null) return true;
      return nameInitial(p.name) === letter;
    });
  }, [players, search, letter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jogadores</h1>
          <p className="text-sm text-gray-500">{players.length} cadastrados</p>
        </div>
        <Button className="bg-[#1B3A6B]" asChild>
          <Link href={withAdminFrom(`${LIST_PATH}/novo`, listPath)}>
            <Plus size={14} className="mr-1" /> Adicionar
          </Link>
        </Button>
      </div>

      <AdminEntitySearch
        items={players.map((p) => ({
          id: p.id,
          name: p.name,
          searchExtra: p.fullName,
          subtitle:
            [p.fullName && p.fullName !== p.name ? p.fullName : null, p.position, p.nationality]
              .filter(Boolean)
              .join(" · ") || null,
        }))}
        placeholder="Buscar por nome ou nome completo…"
        value={search}
        onValueChange={onSearchChange}
        preserveQueryOnSelect
        onSelect={(item) => openPlayer(item.id)}
      />

      <div className="flex flex-wrap items-center gap-1 mb-3">
        <button
          type="button"
          onClick={() => onLetterChange(null)}
          className={`px-2 py-1 text-xs rounded border ${
            letter == null
              ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          Todos
        </button>
        {LETTERS.map((L) => (
          <button
            key={L}
            type="button"
            onClick={() => onLetterChange(L)}
            className={`w-7 h-7 text-xs rounded border ${
              letter === L
                ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {L}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onLetterChange("#")}
          className={`w-7 h-7 text-xs rounded border ${
            letter === "#"
              ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
          title="Nomes que não começam com A–Z"
        >
          #
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Nome
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Temporadas
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Posição
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Nacionalidade
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Nasc.
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => {
                const seasonsLabel = formatSeasonSpans(player.seasons);
                const href = withAdminFrom(`${LIST_PATH}/${player.id}`, listPath);
                return (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 min-w-0 text-[#1B3A6B] hover:underline"
                      >
                        <PlayerPhoto
                          url={player.photoUrl}
                          name={player.name}
                          size="sm"
                          className="h-7 w-7 text-[9px]"
                        />
                        <span className="min-w-0">
                          <span className="block truncate">{player.name}</span>
                          {player.fullName && player.fullName !== player.name ? (
                            <span className="block text-xs text-gray-400 font-normal truncate max-w-[16rem]">
                              {player.fullName}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </td>
                    <td
                      className="px-4 py-2 text-gray-600 whitespace-nowrap"
                      title={player.seasons?.join(", ") || undefined}
                    >
                      {seasonsLabel || "–"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{player.position ?? "–"}</td>
                    <td className="px-4 py-2 text-gray-600">{player.nationality ?? "–"}</td>
                    <td className="px-4 py-2 text-gray-600">{player.birthYear ?? "–"}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <AdminMergeButton
                          keepId={player.id}
                          keepName={player.name}
                          mode={{ kind: "pair", endpoint: "/admin/players/merge" }}
                          onDone={load}
                        />
                        <button
                          type="button"
                          onClick={() => deletePlayer(player.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum jogador encontrado</p>
          )}
        </div>
      )}
    </div>
  );
}
