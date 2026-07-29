import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { useSeasonQueryParam } from "@/hooks/useSeasonQueryParam";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Trash2, Plus } from "lucide-react";
import { ResultBadge } from "@/components/ui/result-badge";

interface MatchRow {
  id: number;
  matchDate: string;
  season: string;
  goalsFor: number;
  goalsAgainst: number;
  result: string;
  homeAway: string;
  opponentName: string;
  competitionName: string;
}

export default function AdminMatches() {
  const [, setLocation] = useLocation();
  const { season, setSeason } = useSeasonQueryParam("/admin/partidas");
  const [years, setYears] = useState<number[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [yearSearch, setYearSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const seasonSelected = season !== "all";

  useEffect(() => {
    (async () => {
      const r = await adminFetch("/admin/seasons");
      if (!r.ok) return;
      const rows = (await r.json()) as { year: number }[];
      setYears(rows.map((s) => s.year).sort((a, b) => b - a));
      setLoading(false);
    })();
  }, []);

  const load = useCallback(async () => {
    if (!seasonSelected) {
      setMatches([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    const qs = new URLSearchParams({
      limit: "500",
      offset: "0",
      season,
    });
    const r = await adminFetch(`/admin/matches?${qs}`);
    if (r.ok) {
      const data = await r.json();
      setMatches(data.data);
      setTotal(data.total);
    }
    setLoading(false);
  }, [season, seasonSelected]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
    setSearch("");
  }, [season]);

  async function deleteMatch(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Excluir esta partida?")) return;
    await adminFetch(`/admin/matches/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = matches.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.opponentName.toLowerCase().includes(q) ||
      m.competitionName.toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const filteredYears = years.filter((y) => {
    if (!yearSearch.trim()) return true;
    return String(y).includes(yearSearch.trim());
  });

  function homeAwayLabel(v: string) {
    return v === "home" ? "Casa" : v === "away" ? "Fora" : "Neutro";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Partidas</h1>
          <p className="text-sm text-gray-500">
            {seasonSelected ? `${total} em ${season}` : `${years.length} temporadas`}
          </p>
        </div>
        <Button className="bg-[#1B3A6B]" asChild>
          <Link href="/admin/partidas/novo">
            <Plus size={14} className="mr-1" /> Adicionar
          </Link>
        </Button>
      </div>

      {!seasonSelected ? (
        <div>
          <Input
            placeholder="Buscar temporada (ano)..."
            value={yearSearch}
            onChange={(e) => setYearSearch(e.target.value)}
            className="mb-4 max-w-sm"
          />
          {loading && years.length === 0 ? (
            <p className="text-sm text-gray-400">Carregando...</p>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden" data-testid="admin-season-list">
              <ul className="divide-y">
                {filteredYears.map((y) => (
                  <li key={y}>
                    <button
                      type="button"
                      onClick={() => setSeason(String(y))}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-[#1B3A6B] hover:bg-gray-50 transition-colors"
                      data-testid={`link-admin-season-${y}`}
                    >
                      Temporada {y}
                    </button>
                  </li>
                ))}
              </ul>
              {filteredYears.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma temporada encontrada</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setSeason("all")}
            className="inline-flex items-center text-sm text-gray-500 hover:text-[#1B3A6B] mb-4"
          >
            <ChevronLeft size={16} className="mr-0.5" /> Temporadas
          </button>

          <h2 className="text-base font-semibold text-gray-800 mb-3">Temporada {season}</h2>

          <Input
            placeholder="Buscar adversário ou competição..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="mb-4 max-w-sm"
          />

          {loading ? (
            <p className="text-sm text-gray-400">Carregando...</p>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Data
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Adversário
                    </th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Res.
                    </th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Placar
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Mando
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Competição
                    </th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => setLocation(`/admin/partidas/${m.id}`)}
                      data-testid={`row-admin-match-${m.id}`}
                    >
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{m.matchDate}</td>
                      <td className="px-3 py-2 font-medium text-[#1B3A6B]">{m.opponentName}</td>
                      <td className="px-3 py-2 text-center">
                        <ResultBadge result={m.result as "win" | "draw" | "loss"} />
                      </td>
                      <td className="px-3 py-2 text-center font-mono">
                        {m.goalsFor}–{m.goalsAgainst}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{homeAwayLabel(m.homeAway)}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[160px] truncate">
                        {m.competitionName}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => deleteMatch(m.id, e)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paginated.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma partida encontrada</p>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2 border-t text-sm text-gray-500">
                  <span>{filtered.length} resultados</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <span>
                      Pág. {page + 1} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
