import { useMemo, useState } from "react";
import { Link } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronDown, ChevronRight, Sparkles } from "lucide-react";

type Candidate = { id: number; name: string };

type ResolvedName = {
  raw: string;
  status: string;
  id: number | null;
  name: string | null;
  candidates: Candidate[];
  createNew?: boolean;
  selectedId?: number | null;
};

type PreviewGame = {
  key: string;
  include: boolean;
  date: string;
  homeAway: string;
  opponent: ResolvedName;
  competition: ResolvedName;
  phase: string | null;
  round: string | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  manager: ResolvedName | null;
  referee: ResolvedName | null;
  attendance: number | null;
  attendancePaid: number | null;
  ownGoalsForCount: number;
  starters: (ResolvedName & { role?: string; sortOrder?: number })[];
  bench: (ResolvedName & { role?: string; sortOrder?: number })[];
  goals: Array<{
    isOwnGoal: boolean;
    scorer: ResolvedName | null;
    assist: ResolvedName | null;
    minute: number;
    injuryTimeMinute: number | null;
    minuteRaw: number;
    half: number;
  }>;
  substitutions: Array<{
    playerOut: ResolvedName;
    playerIn: ResolvedName;
    minute: number;
  }>;
  cards: Array<{ player: ResolvedName; cardType: string; minute: number }>;
  notes: string[];
  scoreConsistencyWarning: string | null;
  existingMatch: { id: number; sheetLineupCount: number; opponentName: string } | null;
  overwriteSheet: boolean;
  fieldDiffs: Array<{
    field: string;
    label: string;
    current: string | number | null;
    proposed: string | number | null;
    apply: boolean;
  }>;
  unresolvedCount: number;
};

type SeasonPreview = {
  seasonYear: number;
  games: PreviewGame[];
  summary: { total: number; unresolved: number; existing: number; create: number };
};

function statusDot(r: ResolvedName | null | undefined) {
  if (!r) return "⚪";
  if (r.createNew) return "🔴";
  if (r.selectedId != null || r.status === "exact" || r.status === "fuzzy" || r.status === "resolved")
    return "🟢";
  if (r.status === "ambiguous") return "🟡";
  if (r.status === "missing") return "🔴";
  return "⚪";
}

function ResolveControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ResolvedName;
  onChange: (next: ResolvedName) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm py-1">
      <span className="text-gray-500 w-28 shrink-0">{label}</span>
      <span>{statusDot(value)}</span>
      <span className="font-medium text-gray-900">{value.raw}</span>
      {value.name && value.name !== value.raw && (
        <span className="text-xs text-gray-400">→ {value.name}</span>
      )}
      {value.status === "ambiguous" && (
        <select
          className="border rounded px-2 py-1 text-xs"
          value={value.selectedId ?? ""}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null;
            const cand = value.candidates.find((c) => c.id === id);
            onChange({
              ...value,
              selectedId: id,
              createNew: false,
              id: id,
              name: cand?.name ?? value.name,
              status: id != null ? "resolved" : "ambiguous",
            });
          }}
        >
          <option value="">Escolher…</option>
          {value.candidates.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.id} {c.name}
            </option>
          ))}
        </select>
      )}
      {(value.status === "missing" || value.status === "ambiguous") && (
        <label className="text-xs flex items-center gap-1 text-gray-600">
          <input
            type="checkbox"
            checked={Boolean(value.createNew)}
            onChange={(e) =>
              onChange({
                ...value,
                createNew: e.target.checked,
                selectedId: e.target.checked ? null : value.selectedId,
                status: e.target.checked ? "resolved" : value.candidates.length ? "ambiguous" : "missing",
              })
            }
          />
          Criar novo
        </label>
      )}
    </div>
  );
}

function GameCard({
  game,
  onChange,
}: {
  game: PreviewGame;
  onChange: (g: PreviewGame) => void;
}) {
  const [open, setOpen] = useState(game.unresolvedCount > 0 || !game.existingMatch);

  const patchResolved = (path: string, next: ResolvedName) => {
    const g = { ...game };
    if (path === "opponent") g.opponent = next;
    else if (path === "competition") g.competition = next;
    else if (path === "manager" && g.manager) g.manager = next;
    else if (path === "referee" && g.referee) g.referee = next;
    onChange(g);
  };

  const patchStarter = (idx: number, next: ResolvedName) => {
    const starters = game.starters.map((s, i) => (i === idx ? { ...s, ...next } : s));
    onChange({ ...game, starters });
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="text-sm font-semibold text-gray-900 flex-1">
          {game.existingMatch ? "🔵" : "⚪"} {game.date} · CSA {game.goalsFor ?? "–"}–{game.goalsAgainst ?? "–"}{" "}
          {game.opponent.raw} · {game.competition.raw}
        </span>
        <span className="text-xs text-gray-500">
          {game.unresolvedCount > 0 ? `🟡 ${game.unresolvedCount}` : "🟢 ok"}
        </span>
        <label
          className="text-xs flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={game.include}
            onChange={(e) => onChange({ ...game, include: e.target.checked })}
          />
          Incluir
        </label>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t">
          {game.existingMatch && (
            <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1.5 mt-3">
              Partida existente #{game.existingMatch.id} ({game.existingMatch.opponentName}) · ficha com{" "}
              {game.existingMatch.sheetLineupCount} na escalação
            </p>
          )}
          {game.scoreConsistencyWarning && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1.5">{game.scoreConsistencyWarning}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-2 text-sm pt-2">
            <div>
              <span className="text-xs text-gray-400 uppercase">Casa/fora</span>
              <p>{game.homeAway}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase">Resultado</span>
              <p>{game.result}</p>
            </div>
            {(game.phase || game.round) && (
              <div className="sm:col-span-2">
                <span className="text-xs text-gray-400 uppercase">Fase / rodada</span>
                <p>
                  {[game.phase, game.round].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-400 uppercase">Público</span>
              <p>
                {game.attendance ?? "—"}
                {game.attendancePaid != null ? ` (pago ${game.attendancePaid})` : ""}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase">Gols contra (próprios)</span>
              <p>{game.ownGoalsForCount}</p>
            </div>
          </div>

          <div className="space-y-0.5 border rounded p-2">
            <ResolveControl label="Adversário" value={game.opponent} onChange={(n) => patchResolved("opponent", n)} />
            <ResolveControl
              label="Competição"
              value={game.competition}
              onChange={(n) => patchResolved("competition", n)}
            />
            {game.manager && (
              <ResolveControl label="Técnico" value={game.manager} onChange={(n) => patchResolved("manager", n)} />
            )}
            {game.referee && (
              <ResolveControl label="Árbitro" value={game.referee} onChange={(n) => patchResolved("referee", n)} />
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Titulares ({game.starters.length})
            </p>
            <div className="space-y-0.5 border rounded p-2 max-h-56 overflow-auto">
              {game.starters.map((s, i) => (
                <ResolveControl
                  key={`${s.raw}-${i}`}
                  label={`#${i + 1}`}
                  value={s}
                  onChange={(n) => patchStarter(i, n)}
                />
              ))}
            </div>
          </div>

          {game.goals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Gols</p>
              <ul className="text-sm space-y-1">
                {game.goals.map((g, i) => (
                  <li key={i} className="flex gap-2 items-center">
                    <span className="font-mono text-xs text-gray-400 w-12">
                      {g.minute}
                      {g.injuryTimeMinute ? `+${g.injuryTimeMinute}` : ""}'
                    </span>
                    {g.isOwnGoal ? (
                      <span className="text-amber-700">Gol contra</span>
                    ) : (
                      <span>
                        {statusDot(g.scorer)} {g.scorer?.raw}
                        {g.assist ? ` (assist. ${g.assist.raw})` : ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {game.substitutions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Substituições ({game.substitutions.length})
              </p>
              <ul className="text-sm space-y-1">
                {game.substitutions.map((s, i) => (
                  <li key={i}>
                    {s.minute}' · {statusDot(s.playerOut)} {s.playerOut.raw} → {statusDot(s.playerIn)}{" "}
                    {s.playerIn.raw}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {game.fieldDiffs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Diff (partida existente)</p>
              <div className="border rounded divide-y text-xs">
                {game.fieldDiffs.map((d) => (
                  <label key={d.field} className="flex items-center gap-2 px-2 py-1.5">
                    <input
                      type="checkbox"
                      checked={d.apply}
                      onChange={(e) =>
                        onChange({
                          ...game,
                          fieldDiffs: game.fieldDiffs.map((x) =>
                            x.field === d.field ? { ...x, apply: e.target.checked } : x,
                          ),
                        })
                      }
                    />
                    <span className="w-28 text-gray-500">{d.label}</span>
                    <span className="text-gray-400 line-through">{String(d.current ?? "—")}</span>
                    <span>→</span>
                    <span className="font-medium">{String(d.proposed ?? "—")}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {game.existingMatch && (
            <label className="text-xs flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={game.overwriteSheet}
                onChange={(e) => onChange({ ...game, overwriteSheet: e.target.checked })}
              />
              Sobrescrever ficha CSA
              {game.existingMatch.sheetLineupCount > 0 && !game.overwriteSheet && (
                <span className="text-amber-600">(ficha atual será mantida)</span>
              )}
            </label>
          )}

          {game.notes.length > 0 && (
            <p className="text-xs text-gray-400">Notas: {game.notes.join(" · ")}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAiImport() {
  const [seasonYear, setSeasonYear] = useState(2024);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [preview, setPreview] = useState<SeasonPreview | null>(null);
  const [usage, setUsage] = useState<{
    inputTokens: number;
    outputTokens: number;
    model: string;
    estimatedUsd: number;
  } | null>(null);
  const [commitResult, setCommitResult] = useState<string>("");

  const canCommit = useMemo(() => {
    if (!preview) return false;
    return preview.summary.unresolved === 0 && preview.games.some((g) => g.include);
  }, [preview]);

  async function handleParse(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCommitResult("");
    setPreview(null);
    setSessionId(null);
    try {
      const r = await adminFetch("/admin/ai-import/season/parse", {
        method: "POST",
        body: JSON.stringify({ seasonYear, text }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Falha na extração");
      setSessionId(data.sessionId);
      setPreview(data.preview);
      setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
    setLoading(false);
  }

  async function persistPreview(next: SeasonPreview) {
    setPreview(next);
    if (!sessionId) return;
    // fire-and-forget save of resolutions
    await adminFetch(`/admin/ai-import/season/${sessionId}`, {
      method: "PUT",
      body: JSON.stringify({ preview: next }),
    }).catch(() => {});
  }

  function updateGame(idx: number, game: PreviewGame) {
    if (!preview) return;
    const games = preview.games.map((g, i) => (i === idx ? game : g));
    // local unresolved recount (server also refreshes on PUT/commit)
    const recount = (g: PreviewGame) => {
      const unresolved = (r: ResolvedName | null | undefined) => {
        if (!r) return false;
        if (r.createNew || r.selectedId != null) return false;
        if (r.status === "exact" || r.status === "fuzzy" || r.status === "resolved") return false;
        return r.status === "ambiguous" || r.status === "missing";
      };
      let n = 0;
      if (unresolved(g.opponent)) n++;
      if (unresolved(g.competition)) n++;
      if (unresolved(g.manager)) n++;
      if (unresolved(g.referee)) n++;
      for (const s of g.starters) if (unresolved(s)) n++;
      for (const s of g.bench) if (unresolved(s)) n++;
      for (const goal of g.goals) {
        if (!goal.isOwnGoal && unresolved(goal.scorer)) n++;
        if (unresolved(goal.assist)) n++;
      }
      for (const s of g.substitutions) {
        if (unresolved(s.playerOut)) n++;
        if (unresolved(s.playerIn)) n++;
      }
      return n;
    };
    const withCounts = games.map((g) => ({ ...g, unresolvedCount: recount(g) }));
    const next: SeasonPreview = {
      ...preview,
      games: withCounts,
      summary: {
        total: withCounts.length,
        unresolved: withCounts.reduce((a, g) => a + g.unresolvedCount, 0),
        existing: withCounts.filter((g) => g.existingMatch).length,
        create: withCounts.filter((g) => !g.existingMatch).length,
      },
    };
    void persistPreview(next);
  }

  async function handleCommit() {
    if (!sessionId || !preview || !canCommit) return;
    if (
      !confirm(
        `Confirmar: criar ~${preview.summary.create}, atualizar ~${preview.summary.existing} partidas?`,
      )
    ) {
      return;
    }
    setCommitting(true);
    setError("");
    try {
      const r = await adminFetch(`/admin/ai-import/season/${sessionId}/commit`, {
        method: "POST",
        body: JSON.stringify({ preview }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.preview) setPreview(data.preview);
        throw new Error(data.error ?? "Falha ao salvar");
      }
      setCommitResult(
        `Criadas ${data.created}, atualizadas ${data.updated}, fichas ${data.sheetsApplied}` +
          (data.errors?.length ? ` · erros: ${data.errors.join("; ")}` : ""),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
    setCommitting(false);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/importar-exportar"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
      >
        <ChevronLeft size={13} className="mr-0.5" /> Importar / Exportar
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles size={20} className="text-[#F5A623]" />
          Importação IA — temporada
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Cole o relato dos jogos. A IA (Claude) extrai a estrutura; você confere a prévia e só então
          grava. Escalação do adversário é ignorada.
        </p>
      </div>

      <form onSubmit={handleParse} className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Temporada
            </label>
            <Input
              type="number"
              className="w-28"
              value={seasonYear}
              onChange={(e) => setSeasonYear(Number(e.target.value))}
              required
            />
          </div>
          <Button type="submit" className="bg-[#1B3A6B]" disabled={loading}>
            {loading ? "Extraindo…" : "Extrair com IA"}
          </Button>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Texto fonte
          </label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm min-h-[180px] font-mono"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole aqui os jogos da temporada…"
            required
          />
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {commitResult && <p className="text-sm text-green-700">{commitResult}</p>}

      {preview && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              <strong>{preview.summary.total}</strong> jogos ·{" "}
              <strong className="text-amber-700">{preview.summary.unresolved}</strong> ambíguos ·{" "}
              <strong>{preview.summary.existing}</strong> existentes ·{" "}
              <strong>{preview.summary.create}</strong> novos
              {usage && (
                <span className="text-gray-400 ml-2">
                  · {usage.model} · ~US$ {usage.estimatedUsd} ({usage.inputTokens}+{usage.outputTokens} tok)
                </span>
              )}
            </div>
            <Button
              className="bg-[#1B3A6B]"
              disabled={!canCommit || committing}
              onClick={handleCommit}
            >
              {committing ? "Salvando…" : "Confirmar e Salvar"}
            </Button>
          </div>

          <div className="space-y-2">
            {preview.games.map((g, i) => (
              <GameCard key={g.key} game={g} onChange={(next) => updateGame(i, next)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
