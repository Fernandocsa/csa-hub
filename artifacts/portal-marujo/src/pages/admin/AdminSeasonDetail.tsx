import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";

type CompStat = {
  id: number;
  season: string;
  competitionId: number;
  competitionName: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  classification: string | null;
  statsSource: string;
  statsRecalculatedAt: string | null;
};

type Draft = {
  games: string;
  wins: string;
  draws: string;
  losses: string;
  goalsFor: string;
  goalsAgainst: string;
  classification: string;
};

type LookupCompetition = { id: number; name: string };

function draftsFromStats(stats: CompStat[]): Record<number, Draft> {
  const out: Record<number, Draft> = {};
  for (const s of stats) {
    out[s.id] = {
      games: String(s.games),
      wins: String(s.wins),
      draws: String(s.draws),
      losses: String(s.losses),
      goalsFor: String(s.goalsFor),
      goalsAgainst: String(s.goalsAgainst),
      classification: s.classification ?? "",
    };
  }
  return out;
}

function sourceLabel(source: string, recalculatedAt: string | null): string {
  if (source === "manual") return "Manual";
  if (source === "calculated") {
    return recalculatedAt
      ? `Calc. ${new Date(recalculatedAt).toLocaleDateString("pt-BR")}`
      : "Calculado";
  }
  return source;
}

export default function AdminSeasonDetail() {
  const params = useParams<{ year: string }>();
  const year = parseInt(params.year ?? "", 10);
  const season = String(year);

  const [stats, setStats] = useState<CompStat[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [competitions, setCompetitions] = useState<LookupCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addCompetitionId, setAddCompetitionId] = useState("");

  const load = useCallback(async () => {
    if (!Number.isInteger(year)) return;
    setLoading(true);
    setError("");
    const [statsRes, lookupRes] = await Promise.all([
      adminFetch(`/admin/seasons/${year}/competition-stats`),
      adminFetch("/admin/lookup"),
    ]);
    if (!statsRes.ok) {
      setError("Falha ao carregar resumo");
      setLoading(false);
      return;
    }
    const data = await statsRes.json();
    const rows = (data.data ?? []) as CompStat[];
    setStats(rows);
    setDrafts(draftsFromStats(rows));
    if (lookupRes.ok) {
      const lookup = await lookupRes.json();
      setCompetitions(lookup.competitions ?? []);
    }
    setLoading(false);
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => {
    return stats.some((s) => {
      const d = drafts[s.id];
      if (!d) return false;
      return (
        d.games !== String(s.games) ||
        d.wins !== String(s.wins) ||
        d.draws !== String(s.draws) ||
        d.losses !== String(s.losses) ||
        d.goalsFor !== String(s.goalsFor) ||
        d.goalsAgainst !== String(s.goalsAgainst) ||
        d.classification !== (s.classification ?? "")
      );
    });
  }, [stats, drafts]);

  const totals = useMemo(() => {
    return stats.reduce(
      (acc, s) => {
        const d = drafts[s.id];
        const n = (v: string, fallback: number) => {
          const parsed = parseInt(v, 10);
          return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
        };
        return {
          games: acc.games + (d ? n(d.games, s.games) : s.games),
          wins: acc.wins + (d ? n(d.wins, s.wins) : s.wins),
          draws: acc.draws + (d ? n(d.draws, s.draws) : s.draws),
          losses: acc.losses + (d ? n(d.losses, s.losses) : s.losses),
          goalsFor: acc.goalsFor + (d ? n(d.goalsFor, s.goalsFor) : s.goalsFor),
          goalsAgainst:
            acc.goalsAgainst + (d ? n(d.goalsAgainst, s.goalsAgainst) : s.goalsAgainst),
        };
      },
      { games: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
    );
  }, [stats, drafts]);

  function updateDraft(id: number, field: keyof Draft, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    setSavedMsg("");
  }

  async function saveBulk() {
    setSaving(true);
    setError("");
    setSavedMsg("");
    const payload = stats.map((s) => {
      const d = drafts[s.id];
      return {
        id: s.id,
        games: parseInt(d.games, 10),
        wins: parseInt(d.wins, 10),
        draws: parseInt(d.draws, 10),
        losses: parseInt(d.losses, 10),
        goalsFor: parseInt(d.goalsFor, 10),
        goalsAgainst: parseInt(d.goalsAgainst, 10),
        classification: d.classification,
      };
    });
    const r = await adminFetch(`/admin/seasons/${year}/competition-stats/bulk`, {
      method: "PUT",
      body: JSON.stringify({ stats: payload }),
    });
    const data = await r.json().catch(() => ([]));
    if (!r.ok) {
      setError((data as { error?: string }).error ?? "Erro ao salvar");
      setSaving(false);
      return;
    }
    const rows = data as CompStat[];
    setStats(rows);
    setDrafts(draftsFromStats(rows));
    setSavedMsg("Resumo salvo (origem: manual)");
    setSaving(false);
  }

  async function recalculate() {
    if (
      !confirm(
        "Atualiza competições calculadas a partir das partidas (sem amistosos). Linhas manuais e classificações são preservadas. Continuar?",
      )
    ) {
      return;
    }
    setRecalculating(true);
    setError("");
    setSavedMsg("");
    const r = await adminFetch(
      `/admin/seasons/${year}/recalculate-competition-stats`,
      { method: "POST" },
    );
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError((data as { error?: string }).error ?? "Erro ao recalcular");
      setRecalculating(false);
      return;
    }
    const rows = (data.data ?? []) as CompStat[];
    setStats(rows);
    setDrafts(draftsFromStats(rows));
    setSavedMsg(
      `Recalculado: ${data.upserted ?? 0} atualizada(s), ${data.preservedManual ?? 0} manual(is) preservada(s), ${data.removedCalculated ?? 0} órfã(s) removida(s)`,
    );
    setRecalculating(false);
  }

  async function deleteRow(id: number) {
    if (!confirm("Excluir esta linha do resumo?")) return;
    const r = await adminFetch(`/admin/season-competition-stats/${id}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Erro ao excluir");
      return;
    }
    await load();
  }

  async function addCompetition() {
    const competitionId = parseInt(addCompetitionId, 10);
    if (!Number.isInteger(competitionId)) {
      setError("Selecione uma competição");
      return;
    }
    setError("");
    const r = await adminFetch(`/admin/seasons/${year}/competition-stats`, {
      method: "POST",
      body: JSON.stringify({
        competitionId,
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        classification: "",
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError((data as { error?: string }).error ?? "Erro ao adicionar");
      return;
    }
    setAddOpen(false);
    setAddCompetitionId("");
    await load();
  }

  const usedCompetitionIds = new Set(stats.map((s) => s.competitionId));
  const availableCompetitions = competitions.filter(
    (c) => !usedCompetitionIds.has(c.id),
  );

  if (!Number.isInteger(year) || year < 1900) {
    return <p className="text-sm text-red-600">Ano inválido</p>;
  }

  return (
    <div>
      <Link
        href="/admin/temporadas"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#1B3A6B] mb-3"
      >
        <ChevronLeft size={13} /> Temporadas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Temporada {season}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resumo por competição (dual: calculado ou manual) e classificação livre.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={recalculating || dirty || loading}
            title={dirty ? "Salve ou descarte alterações antes" : undefined}
            onClick={recalculate}
          >
            {recalculating ? "Recalculando…" : "Recalcular a partir das partidas"}
          </Button>
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            className="text-xs text-[#1B3A6B] font-medium hover:underline flex items-center gap-1"
          >
            <Plus size={11} /> Adicionar competição
          </button>
        </div>
      </div>

      {addOpen && (
        <div className="bg-white border rounded-lg p-3 mb-4 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[14rem]">
            <label className="text-xs text-gray-500 block mb-1">Competição</label>
            <select
              value={addCompetitionId}
              onChange={(e) => setAddCompetitionId(e.target.value)}
              className="w-full h-9 border rounded-md px-2 text-sm bg-white"
            >
              <option value="">Selecione…</option>
              {availableCompetitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" size="sm" className="bg-[#1B3A6B]" onClick={addCompetition}>
            Adicionar
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="bg-white border rounded-lg p-4">
          {stats.length === 0 ? (
            <p className="text-sm text-gray-400">
              Nenhuma competição no resumo. Use “Recalcular a partir das partidas” ou
              adicione manualmente.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[48rem]">
                <thead>
                  <tr className="text-xs text-gray-400 border-b">
                    <th className="text-left py-1.5">Competição</th>
                    <th className="text-left py-1.5 w-24">Classif.</th>
                    <th className="text-right py-1.5 w-14">J</th>
                    <th className="text-right py-1.5 w-14">V</th>
                    <th className="text-right py-1.5 w-14">E</th>
                    <th className="text-right py-1.5 w-14">D</th>
                    <th className="text-right py-1.5 w-14">GP</th>
                    <th className="text-right py-1.5 w-14">GC</th>
                    <th className="text-right py-1.5 w-14">SG</th>
                    <th className="text-left py-1.5 pl-2">Origem</th>
                    <th className="py-1.5 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => {
                    const d = drafts[stat.id] ?? draftsFromStats([stat])[stat.id];
                    const gp = parseInt(d.goalsFor, 10) || 0;
                    const gc = parseInt(d.goalsAgainst, 10) || 0;
                    return (
                      <tr key={stat.id} className="border-b border-gray-100">
                        <td className="py-2 font-medium pr-2 max-w-[14rem]">
                          <span className="truncate block" title={stat.competitionName}>
                            {stat.competitionName}
                          </span>
                        </td>
                        <td className="py-1.5">
                          <Input
                            value={d.classification}
                            onChange={(e) =>
                              updateDraft(stat.id, "classification", e.target.value)
                            }
                            placeholder="—"
                            className="h-8 w-[5.5rem] px-1.5"
                          />
                        </td>
                        {(
                          [
                            "games",
                            "wins",
                            "draws",
                            "losses",
                            "goalsFor",
                            "goalsAgainst",
                          ] as const
                        ).map((field) => (
                          <td key={field} className="py-1.5 text-right">
                            <Input
                              type="number"
                              min={0}
                              value={d[field]}
                              onChange={(e) =>
                                updateDraft(stat.id, field, e.target.value)
                              }
                              className="h-8 w-[3.5rem] ml-auto text-right px-1.5"
                            />
                          </td>
                        ))}
                        <td className="py-2 text-right tabular-nums text-gray-600">
                          {gp - gc > 0 ? `+${gp - gc}` : gp - gc}
                        </td>
                        <td className="py-2 pl-2 text-xs text-gray-500 whitespace-nowrap">
                          {sourceLabel(stat.statsSource, stat.statsRecalculatedAt)}
                        </td>
                        <td className="py-2">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => deleteRow(stat.id)}
                              className="p-0.5 text-gray-400 hover:text-red-600"
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-gray-200">
                    <td className="py-2 font-semibold text-gray-800" colSpan={2}>
                      Total
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {totals.games}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {totals.wins}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {totals.draws}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {totals.losses}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {totals.goalsFor}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {totals.goalsAgainst}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {totals.goalsFor - totals.goalsAgainst > 0
                        ? `+${totals.goalsFor - totals.goalsAgainst}`
                        : totals.goalsFor - totals.goalsAgainst}
                    </td>
                    <td />
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {dirty && (
            <p className="text-xs text-amber-700 mt-2">Alterações não salvas</p>
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          {savedMsg && <p className="text-sm text-green-700 mt-2">{savedMsg}</p>}

          {stats.length > 0 && (
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                className="bg-[#1B3A6B]"
                disabled={!dirty || saving}
                onClick={saveBulk}
              >
                {saving ? "Salvando…" : "Salvar alterações"}
              </Button>
              {dirty && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => {
                    setDrafts(draftsFromStats(stats));
                    setSavedMsg("");
                    setError("");
                  }}
                >
                  Descartar
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
