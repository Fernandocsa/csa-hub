import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MatchLookupData {
  opponents: { id: number; name: string }[];
  competitions: { id: number; name: string }[];
  stadiums: { id: number; name: string }[];
  referees: { id: number; name: string; state?: string | null }[];
}

export interface MatchGeneralInitial {
  matchDate?: string;
  season?: string;
  opponentId?: number;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  result?: string;
  homeAway?: string;
  competitionId?: number;
  stadiumId?: number | null;
  managerId?: number | null;
  refereeId?: number | null;
  attendance?: number | null;
  scorers?: string | null;
  ownGoalsForCount?: number | null;
  phase?: string | null;
  round?: string | null;
}

export interface MatchGeneralFormData {
  matchDate: string;
  season: string;
  opponentId: number;
  goalsFor: number;
  goalsAgainst: number;
  result: string;
  homeAway: string;
  competitionId: number;
  stadiumId: number | null;
  managerId: number | null;
  refereeId: number | null;
  attendance: number | null;
  scorers: string | null;
  ownGoalsForCount: number;
  phase: string | null;
  round: string | null;
}

export default function MatchGeneralForm({
  initial,
  lookup,
  isNew,
  onSave,
  onDelete,
}: {
  initial?: MatchGeneralInitial;
  lookup: MatchLookupData;
  isNew: boolean;
  onSave: (data: MatchGeneralFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [matchDate, setMatchDate] = useState(initial?.matchDate ?? "");
  const [season, setSeason] = useState(initial?.season ?? "");
  const [opponentId, setOpponentId] = useState(String(initial?.opponentId ?? ""));
  const [goalsFor, setGoalsFor] = useState(String(initial?.goalsFor ?? "0"));
  const [goalsAgainst, setGoalsAgainst] = useState(String(initial?.goalsAgainst ?? "0"));
  const [result, setResult] = useState(initial?.result ?? "");
  const [homeAway, setHomeAway] = useState(initial?.homeAway ?? "home");
  const [competitionId, setCompetitionId] = useState(String(initial?.competitionId ?? ""));
  const [stadiumId, setStadiumId] = useState(String(initial?.stadiumId ?? ""));
  const [attendance, setAttendance] = useState(
    initial?.attendance != null ? String(initial.attendance) : "",
  );
  const [scorers, setScorers] = useState(initial?.scorers ?? "");
  const [ownGoalsForCount, setOwnGoalsForCount] = useState(
    String(initial?.ownGoalsForCount ?? "0"),
  );
  const [phase, setPhase] = useState(initial?.phase ?? "");
  const [round, setRound] = useState(initial?.round ?? "");
  const [refereeId, setRefereeId] = useState(
    initial?.refereeId != null ? String(initial.refereeId) : "",
  );
  const [refereeQuery, setRefereeQuery] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMatchDate(initial?.matchDate ?? "");
    setSeason(initial?.season ?? "");
    setOpponentId(String(initial?.opponentId ?? ""));
    setGoalsFor(String(initial?.goalsFor ?? "0"));
    setGoalsAgainst(String(initial?.goalsAgainst ?? "0"));
    setResult(initial?.result ?? "");
    setHomeAway(initial?.homeAway ?? "home");
    setCompetitionId(String(initial?.competitionId ?? ""));
    setStadiumId(String(initial?.stadiumId ?? ""));
    setAttendance(initial?.attendance != null ? String(initial.attendance) : "");
    setScorers(initial?.scorers ?? "");
    setOwnGoalsForCount(String(initial?.ownGoalsForCount ?? "0"));
    setPhase(initial?.phase ?? "");
    setRound(initial?.round ?? "");
    setRefereeId(initial?.refereeId != null ? String(initial.refereeId) : "");
    setRefereeQuery("");
  }, [initial]);

  useEffect(() => {
    if (!result) {
      const gf = parseInt(goalsFor, 10);
      const ga = parseInt(goalsAgainst, 10);
      if (!Number.isNaN(gf) && !Number.isNaN(ga)) {
        setResult(gf > ga ? "win" : gf < ga ? "loss" : "draw");
      }
    }
  }, [goalsFor, goalsAgainst]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (matchDate && !season) {
      setSeason(matchDate.substring(0, 4));
    }
  }, [matchDate]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        matchDate,
        season,
        opponentId: parseInt(opponentId, 10),
        goalsFor: parseInt(goalsFor, 10) || 0,
        goalsAgainst: parseInt(goalsAgainst, 10) || 0,
        result,
        homeAway,
        competitionId: parseInt(competitionId, 10),
        stadiumId: stadiumId ? parseInt(stadiumId, 10) : null,
        managerId: initial?.managerId ?? null,
        refereeId: refereeId ? parseInt(refereeId, 10) : null,
        attendance: attendance ? parseInt(attendance, 10) : null,
        scorers: scorers || null,
        ownGoalsForCount: Math.max(0, parseInt(ownGoalsForCount, 10) || 0),
        phase: phase.trim() || null,
        round: round.trim() || null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Excluir esta partida? A ficha CSA associada também será removida.")) return;
    setDeleting(true);
    setError("");
    try {
      await onDelete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
    setDeleting(false);
  }

  const sel = "w-full border rounded px-3 py-2 text-sm bg-white";
  const q = refereeQuery.trim().toLowerCase();
  const allReferees = lookup.referees ?? [];
  const selectedReferee = allReferees.find((r) => String(r.id) === refereeId);
  const filteredReferees = allReferees.filter((r) => {
    if (!q) return true;
    const hay = `${r.name} ${r.state ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
  const refereeOptions =
    selectedReferee && !filteredReferees.some((r) => r.id === selectedReferee.id)
      ? [selectedReferee, ...filteredReferees]
      : filteredReferees;

  return (
    <form onSubmit={submit} className="space-y-3 max-w-xl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Data *
          </label>
          <Input
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            required
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Temporada *
          </label>
          <Input
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="2023"
            required
            className="h-9"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Adversário *
        </label>
        <select
          className={sel}
          value={opponentId}
          onChange={(e) => setOpponentId(e.target.value)}
          required
        >
          <option value="">Selecionar...</option>
          {lookup.opponents.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Gols Pró
          </label>
          <Input
            type="number"
            min={0}
            value={goalsFor}
            onChange={(e) => setGoalsFor(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Gols Contra
          </label>
          <Input
            type="number"
            min={0}
            value={goalsAgainst}
            onChange={(e) => setGoalsAgainst(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Resultado
          </label>
          <select
            className={sel}
            value={result}
            onChange={(e) => setResult(e.target.value)}
            required
          >
            <option value="">Auto</option>
            <option value="win">Vitória</option>
            <option value="draw">Empate</option>
            <option value="loss">Derrota</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Gols contra a favor (own goals)
        </label>
        <Input
          type="number"
          min={0}
          value={ownGoalsForCount}
          onChange={(e) => setOwnGoalsForCount(e.target.value)}
          className="h-9 max-w-[8rem]"
        />
        <p className="text-[10px] text-gray-400 mt-1">
          Quantos gols do placar CSA vieram de gol contra do adversário (não entram na ficha de
          gols). Usado no gate de Artilheiro por competição: ficha + este número = gols pró.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Mando
          </label>
          <select
            className={sel}
            value={homeAway}
            onChange={(e) => setHomeAway(e.target.value)}
          >
            <option value="home">Casa</option>
            <option value="away">Fora</option>
            <option value="neutral">Neutro</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Competição *
          </label>
          <select
            className={sel}
            value={competitionId}
            onChange={(e) => setCompetitionId(e.target.value)}
            required
          >
            <option value="">Selecionar...</option>
            {lookup.competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Estádio
        </label>
        <select
          className={sel}
          value={stadiumId}
          onChange={(e) => setStadiumId(e.target.value)}
        >
          <option value="">–</option>
          {lookup.stadiums.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-gray-400 mt-1">
          Técnico é editado na aba Técnico desta página.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase block">
          Árbitro
        </label>
        <Input
          value={refereeQuery}
          onChange={(e) => setRefereeQuery(e.target.value)}
          placeholder="Buscar por nome ou UF…"
          className="h-9"
        />
        <select
          className={sel}
          value={refereeId}
          onChange={(e) => setRefereeId(e.target.value)}
        >
          <option value="">– sem árbitro –</option>
          {refereeOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {r.state ? ` (${r.state})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Fase
          </label>
          <Input
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            placeholder="ex: Final, 1º Turno, Oitavas"
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Rodada
          </label>
          <Input
            value={round}
            onChange={(e) => setRound(e.target.value)}
            placeholder="ex: 15, 15ª rodada, Ida, Volta"
            className="h-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Público
          </label>
          <Input
            type="number"
            min={0}
            value={attendance}
            onChange={(e) => setAttendance(e.target.value)}
            placeholder="0"
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Artilheiros
          </label>
          <Input
            value={scorers}
            onChange={(e) => setScorers(e.target.value)}
            placeholder="Nome1, Nome2"
            className="h-9"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" className="bg-[#1B3A6B]" disabled={saving || deleting}>
          {saving ? "Salvando…" : isNew ? "Criar partida" : "Salvar"}
        </Button>
        {!isNew && onDelete && (
          <Button
            type="button"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={saving || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Excluindo…" : "Excluir partida"}
          </Button>
        )}
      </div>
    </form>
  );
}
