import { useCallback, useEffect, useState, Fragment } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { Link } from "wouter";

type SeasonRow = {
  year: number;
  statsFullyVerified: boolean;
  statsVerifiedAt: string | null;
};

type CompetitionBadgeStatus = {
  competitionId: number;
  competitionName: string;
  seasonYear: number;
  eligible: boolean;
  matchCount: number;
  completeCount: number;
  incompleteMatchIds: number[];
  topScorerIds: number[];
  topGoals: number;
  badgesCreated: number;
};

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyYear, setBusyYear] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [compStatus, setCompStatus] = useState<
    Record<number, CompetitionBadgeStatus[] | "loading" | "error">
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/seasons");
    if (r.ok) setSeasons(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function loadCompetitionStatus(year: number) {
    setCompStatus((prev) => ({ ...prev, [year]: "loading" }));
    const r = await adminFetch(`/admin/seasons/${year}/competition-badges`);
    if (!r.ok) {
      setCompStatus((prev) => ({ ...prev, [year]: "error" }));
      return;
    }
    const data = await r.json();
    setCompStatus((prev) => ({
      ...prev,
      [year]: data.details as CompetitionBadgeStatus[],
    }));
  }

  function toggleExpand(year: number) {
    if (expandedYear === year) {
      setExpandedYear(null);
      return;
    }
    setExpandedYear(year);
    if (!compStatus[year] || compStatus[year] === "error") {
      loadCompetitionStatus(year);
    }
  }

  async function setVerified(year: number, verified: boolean) {
    setBusyYear(year);
    setError("");
    setMessage("");
    const r = await adminFetch(`/admin/seasons/${year}/verification`, {
      method: "PUT",
      body: JSON.stringify({ verified }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError((data as { error?: string }).error ?? "Erro ao atualizar");
      setBusyYear(null);
      return;
    }
    if (verified) {
      const b = data.badges as {
        created?: number;
        topScorerIds?: number[];
        topAssisterIds?: number[];
        competition?: {
          eligible?: number;
          incomplete?: number;
          created?: number;
          details?: CompetitionBadgeStatus[];
        };
      };
      setMessage(
        `${year}: verificada. Badges auto: ${b?.created ?? 0}` +
          (b?.topScorerIds?.length
            ? ` · Artilheiros temporada: ${b.topScorerIds.length}`
            : "") +
          (b?.topAssisterIds?.length
            ? ` · Garçons: ${b.topAssisterIds.length}`
            : "") +
          (b?.competition
            ? ` · competições elegíveis: ${b.competition.eligible ?? 0}, incompletas: ${b.competition.incomplete ?? 0}, badges competição: ${b.competition.created ?? 0}`
            : ""),
      );
      if (b?.competition?.details) {
        setCompStatus((prev) => ({
          ...prev,
          [year]: b.competition!.details!,
        }));
      } else {
        await loadCompetitionStatus(year);
      }
    } else {
      const cleared =
        (data as { badges?: { cleared?: number } }).badges?.cleared ?? 0;
      setMessage(`${year}: verificação removida. Badges auto apagados: ${cleared}`);
      await loadCompetitionStatus(year);
    }
    await load();
    setBusyYear(null);
  }

  async function recalculate(year: number) {
    setBusyYear(year);
    setError("");
    setMessage("");
    const r = await adminFetch(`/admin/seasons/${year}/recalculate-badges`, {
      method: "POST",
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError((data as { error?: string }).error ?? "Erro ao recalcular");
      setBusyYear(null);
      return;
    }
    const d = data as {
      created?: number;
      topScorerIds?: number[];
      topAssisterIds?: number[];
      topScorerGoals?: number;
      topAssisterAssists?: number;
      competition?: {
        eligible?: number;
        incomplete?: number;
        created?: number;
        details?: CompetitionBadgeStatus[];
      };
    };
    setMessage(
      `${year} recalculado: ${d.created ?? 0} badges` +
        (d.topScorerIds?.length
          ? ` · Artilheiro (${d.topScorerGoals} gols): ${d.topScorerIds.length}`
          : " · sem Artilheiro") +
        (d.topAssisterIds?.length
          ? ` · Garçom (${d.topAssisterAssists} assists): ${d.topAssisterIds.length}`
          : " · sem Garçom") +
        (d.competition
          ? ` · competição: ${d.competition.created ?? 0} badges (${d.competition.eligible ?? 0} elegíveis)`
          : ""),
    );
    if (d.competition?.details) {
      setCompStatus((prev) => ({ ...prev, [year]: d.competition!.details! }));
    } else {
      await loadCompetitionStatus(year);
    }
    setBusyYear(null);
  }

  function renderCompetitionPanel(year: number) {
    const status = compStatus[year];
    if (status === "loading" || status == null) {
      return <p className="text-xs text-gray-400">Carregando competições…</p>;
    }
    if (status === "error") {
      return (
        <p className="text-xs text-red-600">
          Erro ao carregar status.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => loadCompetitionStatus(year)}
          >
            Tentar de novo
          </button>
        </p>
      );
    }
    if (status.length === 0) {
      return (
        <p className="text-xs text-gray-400">
          Nenhuma competição (não amistoso/W.O.) nesta temporada.
        </p>
      );
    }
    return (
      <ul className="space-y-1.5">
        {status.map((c) => {
          const incomplete = c.matchCount - c.completeCount;
          return (
            <li
              key={c.competitionId}
              className="flex flex-wrap items-baseline justify-between gap-2 text-xs bg-white border rounded px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <span className="font-medium text-gray-900">
                  {c.competitionName}
                </span>
                {c.eligible && c.topScorerIds.length > 0 && (
                  <span className="text-gray-500 ml-2">
                    · líder(es): {c.topScorerIds.length} ({c.topGoals} gols)
                  </span>
                )}
              </div>
              <div className="shrink-0">
                {c.eligible ? (
                  <span className="text-emerald-700 font-medium">
                    Elegível ({c.completeCount}/{c.matchCount} fichas OK)
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium">
                    Incompleto — {incomplete}/{c.matchCount} partidas sem ficha
                    {c.incompleteMatchIds.length > 0 && (
                      <>
                        {" "}
                        (
                        {c.incompleteMatchIds.slice(0, 5).map((id, i) => (
                          <span key={id}>
                            {i > 0 && ", "}
                            <Link
                              href={`/admin/partidas/${id}`}
                              className="underline hover:text-[#1B3A6B]"
                            >
                              #{id}
                            </Link>
                          </span>
                        ))}
                        {c.incompleteMatchIds.length > 5
                          ? `, +${c.incompleteMatchIds.length - 5}`
                          : ""}
                        )
                      </>
                    )}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Temporadas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Resumo por competição (link no ano), verificação de stats e badges
          Artilheiro/Garçom.
        </p>
      </div>

      {message && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 mb-3">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                <th className="text-left px-3 py-2 w-8"></th>
                <th className="text-left px-3 py-2">Ano</th>
                <th className="text-left px-3 py-2">Stats verificadas</th>
                <th className="text-left px-3 py-2">Verificado em</th>
                <th className="text-right px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => {
                const busy = busyYear === s.year;
                const open = expandedYear === s.year;
                return (
                  <Fragment key={s.year}>
                    <tr className="border-b">
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggleExpand(s.year)}
                          className="text-gray-400 hover:text-[#1B3A6B]"
                          title="Artilheiro por competição"
                        >
                          {open ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 font-semibold">
                        <Link
                          href={`/admin/temporadas/${s.year}`}
                          className="text-[#1B3A6B] hover:underline"
                        >
                          {s.year}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={s.statsFullyVerified}
                            disabled={busy}
                            onChange={(e) =>
                              setVerified(s.year, e.target.checked)
                            }
                            className="rounded border-gray-300"
                          />
                          <span
                            className={
                              s.statsFullyVerified
                                ? "text-emerald-700 font-medium"
                                : "text-gray-500"
                            }
                          >
                            {s.statsFullyVerified ? "Sim" : "Não"}
                          </span>
                        </label>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">
                        {s.statsVerifiedAt
                          ? new Date(s.statsVerifiedAt).toLocaleString("pt-BR")
                          : "–"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/admin/temporadas/${s.year}`}
                            className="text-xs font-medium text-[#1B3A6B] hover:underline"
                          >
                            Resumo
                          </Link>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy || !s.statsFullyVerified}
                            onClick={() => recalculate(s.year)}
                            className="h-8"
                          >
                            <RefreshCw size={13} className="mr-1" />
                            Recalcular badges
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b">
                        <td colSpan={5} className="bg-gray-50 px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase">
                              Artilheiro por competição — {s.year}
                            </span>
                            <button
                              type="button"
                              className="text-xs text-[#1B3A6B] hover:underline"
                              onClick={() => loadCompetitionStatus(s.year)}
                            >
                              Atualizar status
                            </button>
                          </div>
                          {renderCompetitionPanel(s.year)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {seasons.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhuma temporada cadastrada
            </p>
          )}
        </div>
      )}
    </div>
  );
}
