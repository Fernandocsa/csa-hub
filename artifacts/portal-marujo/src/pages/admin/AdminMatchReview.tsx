import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { ResultBadge } from "@/components/ui/result-badge";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab =
  | "duplicates"
  | "unknown"
  | "incomplete"
  | "noSheet"
  | "noManager";

interface ReviewMatch {
  id: number;
  matchDate: string;
  season: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  phase: string | null;
  round: string | null;
  opponentName: string;
  competitionName: string;
  isFriendly?: boolean;
  isWalkover?: boolean;
}

interface DupGroup {
  matchDate: string;
  year: number | null;
  is1920sPlaceholder: boolean;
  count: number;
  matches: ReviewMatch[];
}

function homeAwayLabel(v: string) {
  return v === "home" ? "Casa" : v === "away" ? "Fora" : "Neutro";
}

function scoreLabel(m: ReviewMatch) {
  if (m.goalsFor == null || m.goalsAgainst == null) return "—";
  return `${m.goalsFor}–${m.goalsAgainst}`;
}

function MatchCard({ m }: { m: ReviewMatch }) {
  return (
    <Link
      href={`/admin/partidas/${m.id}`}
      className="block border rounded-lg bg-white p-3 hover:border-[#1B3A6B]/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-[#1B3A6B] truncate">{m.opponentName}</p>
          <p className="text-xs text-gray-500 truncate">{m.competitionName}</p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-gray-400 font-mono">
          #{m.id}
          <ExternalLink size={11} />
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {m.result === "unknown" ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold bg-gray-200 text-gray-600">
            ?
          </span>
        ) : (
          <ResultBadge result={m.result} />
        )}
        <span className="font-mono font-medium">{scoreLabel(m)}</span>
        <span className="text-gray-500">{homeAwayLabel(m.homeAway)}</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">{m.season}</span>
      </div>
      {(m.phase || m.round) && (
        <p className="text-xs text-gray-400 mt-1.5 truncate">
          {[m.phase, m.round].filter(Boolean).join(" · ")}
        </p>
      )}
    </Link>
  );
}

function MatchTable({
  matches,
  emptyLabel,
}: {
  matches: ReviewMatch[];
  emptyLabel: string;
}) {
  if (matches.length === 0) {
    return (
      <div className="bg-white border rounded-lg px-4 py-10 text-center text-sm text-gray-400">
        {emptyLabel}
      </div>
    );
  }

  return (
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
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Placar
            </th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Competição
            </th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Temp.
            </th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Mando
            </th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              ID
            </th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id} className="border-b hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap font-mono text-xs">
                <Link href={`/admin/partidas/${m.id}`} className="hover:text-[#1B3A6B]">
                  {m.matchDate}
                </Link>
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/admin/partidas/${m.id}`}
                  className="font-medium text-[#1B3A6B] hover:underline"
                >
                  {m.opponentName}
                </Link>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  {m.result === "unknown" ? (
                    <span className="text-xs text-gray-400">?</span>
                  ) : (
                    <ResultBadge result={m.result} />
                  )}
                  <span className="font-mono text-xs">{scoreLabel(m)}</span>
                </span>
              </td>
              <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">
                {m.competitionName}
              </td>
              <td className="px-3 py-2 text-gray-600">{m.season}</td>
              <td className="px-3 py-2 text-gray-600">{homeAwayLabel(m.homeAway)}</td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/admin/partidas/${m.id}`}
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#1B3A6B] font-mono"
                >
                  #{m.id}
                  <ExternalLink size={11} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "duplicates", label: "Datas duplicadas" },
  { id: "unknown", label: "Sem resultado" },
  { id: "incomplete", label: "Ficha incompleta" },
  { id: "noSheet", label: "Sem ficha" },
  { id: "noManager", label: "Sem treinador" },
];

export default function AdminMatchReview() {
  const [tab, setTab] = useState<Tab>("duplicates");
  const [groups, setGroups] = useState<DupGroup[]>([]);
  const [unknown, setUnknown] = useState<ReviewMatch[]>([]);
  const [incomplete, setIncomplete] = useState<ReviewMatch[]>([]);
  const [noSheet, setNoSheet] = useState<ReviewMatch[]>([]);
  const [noManager, setNoManager] = useState<ReviewMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hide1920s, setHide1920s] = useState(true);
  const [dupMeta, setDupMeta] = useState({ totalGroups: 0, placeholder1920sGroups: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dupRes, unkRes, incRes, missRes, mgrRes] = await Promise.all([
        adminFetch("/admin/matches/duplicate-dates"),
        adminFetch("/admin/matches/unknown-results"),
        adminFetch("/admin/matches/incomplete-sheets"),
        adminFetch("/admin/matches/missing-sheets"),
        adminFetch("/admin/matches/missing-managers"),
      ]);
      if (!dupRes.ok || !unkRes.ok || !incRes.ok || !missRes.ok || !mgrRes.ok) {
        throw new Error("Falha ao carregar dados de revisão");
      }
      const [dupData, unkData, incData, missData, mgrData] = await Promise.all([
        dupRes.json(),
        unkRes.json(),
        incRes.json(),
        missRes.json(),
        mgrRes.json(),
      ]);
      setGroups(dupData.groups ?? []);
      setDupMeta({
        totalGroups: dupData.totalGroups ?? 0,
        placeholder1920sGroups: dupData.placeholder1920sGroups ?? 0,
      });
      setUnknown(unkData.data ?? []);
      setIncomplete(incData.data ?? []);
      setNoSheet(missData.data ?? []);
      setNoManager(mgrData.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleGroups = useMemo(
    () => (hide1920s ? groups.filter((g) => !g.is1920sPlaceholder) : groups),
    [groups, hide1920s],
  );

  const tabCount = (id: Tab) => {
    switch (id) {
      case "duplicates":
        return hide1920s ? visibleGroups.length : dupMeta.totalGroups;
      case "unknown":
        return unknown.length;
      case "incomplete":
        return incomplete.length;
      case "noSheet":
        return noSheet.length;
      case "noManager":
        return noManager.length;
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Revisão de Partidas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Lacunas de placar, ficha e técnico — abra a partida para corrigir.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 mb-5 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-[#1B3A6B] text-[#1B3A6B]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-gray-400">({tabCount(t.id)})</span>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : tab === "duplicates" ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-gray-500">
              {visibleGroups.length} grupo{visibleGroups.length === 1 ? "" : "s"}
              {hide1920s && dupMeta.placeholder1920sGroups > 0
                ? ` · ${dupMeta.placeholder1920sGroups} placeholder(s) de 1920s ocultos`
                : null}
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hide1920s}
                onChange={(e) => setHide1920s(e.target.checked)}
                className="rounded border-gray-300"
              />
              Ocultar placeholders 1920–1929
            </label>
          </div>

          {visibleGroups.length === 0 ? (
            <div className="bg-white border rounded-lg px-4 py-10 text-center text-sm text-gray-400">
              Nenhuma data duplicada para revisar.
            </div>
          ) : (
            <div className="space-y-5">
              {visibleGroups.map((g) => (
                <section key={g.matchDate} className="border rounded-lg overflow-hidden bg-gray-50/80">
                  <header className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-white border-b">
                    <h2 className="font-semibold text-gray-900 font-mono">{g.matchDate}</h2>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {g.count} partidas
                    </span>
                    {g.is1920sPlaceholder && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Placeholder 1920s
                      </span>
                    )}
                  </header>
                  <div className="p-3 grid gap-3 sm:grid-cols-2">
                    {g.matches.map((m) => (
                      <MatchCard key={m.id} m={m} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : tab === "unknown" ? (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Mesmo critério do portal público (
            <code className="text-xs bg-gray-100 px-1 rounded">result = unknown</code>, excluindo
            WO e amistosos).
          </p>
          <MatchTable matches={unknown} emptyLabel="Nenhuma partida sem resultado." />
        </div>
      ) : tab === "incomplete" ? (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Há gols atribuídos (<code className="text-xs bg-gray-100 px-1 rounded">match_goals</code>{" "}
            ou campo artilheiros), mas nenhuma escalação CSA.
          </p>
          <MatchTable matches={incomplete} emptyLabel="Nenhuma ficha incompleta." />
        </div>
      ) : tab === "noSheet" ? (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Sem escalação CSA e sem atribuição de gols — ficha vazia (placar pode existir).
          </p>
          <MatchTable matches={noSheet} emptyLabel="Nenhuma partida sem ficha." />
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Partidas oficiais com placar conhecido e sem técnico vinculado.
          </p>
          <MatchTable matches={noManager} emptyLabel="Nenhuma partida sem treinador." />
        </div>
      )}
    </div>
  );
}
