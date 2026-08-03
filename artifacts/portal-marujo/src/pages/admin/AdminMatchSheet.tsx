import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Pencil, Trash2, X } from "lucide-react";
import { PlayerPhoto } from "@/components/PlayerPhoto";
import { EntityPhoto } from "@/components/EntityPhoto";
import {
  compareByPositionGroupThenName,
  shortPositionCode,
  sortLineupByPosition,
} from "@/lib/position-groups";
import MatchGeneralForm, {
  type MatchGeneralFormData,
  type MatchLookupData,
  type RelatedMatchOption,
} from "./MatchGeneralForm";
import { matchPhaseRoundLabel } from "@/lib/match-phase-round";
import { withAdminFrom } from "@/hooks/useAdminReturnTo";
import { OpponentCrest, CsaCrest } from "@/components/OpponentCrest";
import {
  eventMinuteToFormValue,
  isUnknownEventMinute,
  normalizeEventMinute,
  UNKNOWN_EVENT_MINUTE_LABEL,
  UNKNOWN_EVENT_MINUTE_TITLE,
} from "@/lib/event-minute";

// ── Types ─────────────────────────────────────────────────────────────────

type RosterPlayer = {
  id: number;
  name: string;
  position: string | null;
  nationality: string | null;
  nationalityFlag: string | null;
  photoUrl?: string | null;
  shirtNumber: number | null;
  appearances: number;
  goals: number;
  assists: number;
  inSeason: boolean;
};

type PlayerInfo = {
  name: string;
  position: string | null;
  photoUrl?: string | null;
};

type EscalacaoRow = {
  playerId: number;
  playerName: string;
  position: string | null;
  photoUrl?: string | null;
};

type SheetLineup = {
  id: number;
  side: string;
  playerId: number | null;
  playerName: string;
  role: string;
  shirtNumber: number | null;
  position: string | null;
  sortOrder: number;
};

type SheetGoal = {
  id: number;
  scorerPlayerId: number | null;
  scorerName: string | null;
  minute: number;
  injuryTimeMinute: number | null;
  assistPlayerId: number | null;
  assistName: string | null;
  isPenalty: boolean;
  isFreeKick: boolean;
  isOwnGoal: boolean;
  ownGoalDirection: "for" | "against" | null;
};

type SheetCard = {
  id: number;
  cardType: string;
  playerId: number | null;
  playerName: string | null;
  minute: number;
  injuryTimeMinute: number | null;
};

type SheetManagerCard = {
  id: number;
  cardType: string;
  minute: number;
  injuryTimeMinute: number | null;
};

type SheetSubstitution = {
  id: number;
  playerOutId: number | null;
  playerOutName: string | null;
  playerInId: number | null;
  playerInName: string | null;
  minute: number;
  injuryTimeMinute: number | null;
};

type SheetResponse = {
  lineups: SheetLineup[];
  goals: SheetGoal[];
  cards: SheetCard[];
  substitutions: SheetSubstitution[];
  managerCards: SheetManagerCard[];
  captainPlayerId: number | null;
  managerId: number | null;
  ownGoalsForCount: number;
};

type MatchMeta = {
  id: number;
  matchDate: string;
  season: string;
  opponentName: string;
  opponentId: number;
  opponentLogoUrl?: string | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  competitionId: number;
  competitionName: string;
  stadiumId: number | null;
  attendance: number | null;
  scorers: string | null;
  managerId: number | null;
  managerName: string | null;
  captainPlayerId?: number | null;
  refereeId: number | null;
  refereeName: string | null;
  ownGoalsForCount?: number | null;
  phase?: string | null;
  round?: string | null;
  relatedMatchId?: number | null;
  relatedMatch?: RelatedMatchOption | null;
  penaltiesFor?: number | null;
  penaltiesAgainst?: number | null;
  isWalkover?: boolean;
  isFriendly?: boolean;
  status?: string;
};

type TabId = "general" | "lineup" | "events" | "subs";

type EventRow = {
  playerId: string;
  minute: string;
  injuryTimeMinute: string;
  isOwnGoal: boolean;
  isPenalty: boolean;
  isFreeKick: boolean;
};

function emptyEventRow(): EventRow {
  return {
    playerId: "",
    minute: "",
    injuryTimeMinute: "",
    isOwnGoal: false,
    isPenalty: false,
    isFreeKick: false,
  };
}

type ManagerCardRow = {
  cardType: "yellow" | "red";
  minute: string;
  injuryTimeMinute: string;
};

function defaultManagerCardRows(): ManagerCardRow[] {
  return [
    { cardType: "yellow", minute: "", injuryTimeMinute: "" },
    { cardType: "red", minute: "", injuryTimeMinute: "" },
    { cardType: "yellow", minute: "", injuryTimeMinute: "" },
    { cardType: "red", minute: "", injuryTimeMinute: "" },
  ];
}

type SubRow = {
  playerOutId: string;
  playerInId: string;
  minute: string;
  injuryTimeMinute: string;
};

function emptySubRow(): SubRow {
  return { playerOutId: "", playerInId: "", minute: "", injuryTimeMinute: "" };
}

function buildSubRows(subs: SheetSubstitution[]): SubRow[] {
  const rows: SubRow[] = subs.slice(0, SUB_ROWS_COUNT).map((s) => ({
    playerOutId: s.playerOutId != null ? String(s.playerOutId) : "",
    playerInId: s.playerInId != null ? String(s.playerInId) : "",
    minute: eventMinuteToFormValue(s.minute),
    injuryTimeMinute: s.injuryTimeMinute != null ? String(s.injuryTimeMinute) : "",
  }));
  while (rows.length < SUB_ROWS_COUNT) rows.push(emptySubRow());
  return rows;
}

function formatSavedMinute(minute: number, injury: number | null | undefined) {
  if (isUnknownEventMinute(minute)) {
    return (
      <span title={UNKNOWN_EVENT_MINUTE_TITLE} className="cursor-help underline decoration-dotted">
        {UNKNOWN_EVENT_MINUTE_LABEL}
      </span>
    );
  }
  return (
    <>
      {minute}
      {injury ? `+${injury}` : ""}&apos;
    </>
  );
}

function patchAt<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

const GOAL_ROWS_COUNT = 5;
const RED_ROWS_COUNT = 2;
const YELLOW_ROWS_COUNT = 5;
const ASSIST_ROWS_COUNT = 5;
const SUB_ROWS_COUNT = 10;

const selectCls = "w-full border rounded px-2 py-1.5 text-sm bg-white";

export default function AdminMatchSheet() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isNew = !params.id;
  const matchId = isNew ? null : Number(params.id);

  const [match, setMatch] = useState<MatchMeta | null>(null);
  const [lookup, setLookup] = useState<MatchLookupData | null>(null);
  /** All managers (lookup) — only used to resolve names for a manager already on the match. */
  const [allManagers, setAllManagers] = useState<
    { id: number; name: string; photoUrl?: string | null }[]
  >([]);
  /** Managers linked to the match season via /admin/seasons/:year/managers. */
  const [seasonManagers, setSeasonManagers] = useState<
    { id: number; name: string; photoUrl?: string | null }[]
  >([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [tab, setTab] = useState<TabId>("general");

  // Escalação state
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [rosterSeason, setRosterSeason] = useState("");
  const [playerInfo, setPlayerInfo] = useState<Map<number, PlayerInfo>>(new Map());
  const [starterIds, setStarterIds] = useState<Set<number>>(new Set());
  const [benchIds, setBenchIds] = useState<Set<number>>(new Set());
  const [shirtNumbers, setShirtNumbers] = useState<Record<number, string>>({});
  const [managerIdDraft, setManagerIdDraft] = useState("");
  const [savingLineup, setSavingLineup] = useState(false);

  // Eventos - CSA form state (fixed rows, reset after successful save)
  const [goalRows, setGoalRows] = useState<EventRow[]>(() =>
    Array.from({ length: GOAL_ROWS_COUNT }, emptyEventRow),
  );
  const [redRows, setRedRows] = useState<EventRow[]>(() =>
    Array.from({ length: RED_ROWS_COUNT }, emptyEventRow),
  );
  const [yellowRows, setYellowRows] = useState<EventRow[]>(() =>
    Array.from({ length: YELLOW_ROWS_COUNT }, emptyEventRow),
  );
  const [assistRows, setAssistRows] = useState<EventRow[]>(() =>
    Array.from({ length: ASSIST_ROWS_COUNT }, emptyEventRow),
  );
  const [gpdRow, setGpdRow] = useState<EventRow>(emptyEventRow);
  const [gpfRow, setGpfRow] = useState<EventRow>(emptyEventRow);
  const [captainDraft, setCaptainDraft] = useState("");
  const [managerCardRows, setManagerCardRows] = useState<ManagerCardRow[]>(defaultManagerCardRows);
  const [savingEvents, setSavingEvents] = useState(false);

  // Saved events (read-only list, 3C)
  const [sheetGoals, setSheetGoals] = useState<SheetGoal[]>([]);
  const [sheetCards, setSheetCards] = useState<SheetCard[]>([]);
  const [sheetManagerCards, setSheetManagerCards] = useState<SheetManagerCard[]>([]);
  const [captainPlayerId, setCaptainPlayerId] = useState<number | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [editGoalMinute, setEditGoalMinute] = useState("");
  const [editGoalInjury, setEditGoalInjury] = useState("");
  const [editGoalPenalty, setEditGoalPenalty] = useState(false);
  const [editGoalFreeKick, setEditGoalFreeKick] = useState(false);
  const [savingGoalEdit, setSavingGoalEdit] = useState(false);

  // Substituições
  const [subRows, setSubRows] = useState<SubRow[]>(() =>
    Array.from({ length: SUB_ROWS_COUNT }, emptySubRow),
  );
  const [savingSubs, setSavingSubs] = useState(false);
  const [relatedMatchOptions, setRelatedMatchOptions] = useState<RelatedMatchOption[]>([]);

  function resetEventForms() {
    setGoalRows(Array.from({ length: GOAL_ROWS_COUNT }, emptyEventRow));
    setRedRows(Array.from({ length: RED_ROWS_COUNT }, emptyEventRow));
    setYellowRows(Array.from({ length: YELLOW_ROWS_COUNT }, emptyEventRow));
    setAssistRows(Array.from({ length: ASSIST_ROWS_COUNT }, emptyEventRow));
    setGpdRow(emptyEventRow());
    setGpfRow(emptyEventRow());
    setCaptainDraft("");
    setManagerCardRows(defaultManagerCardRows());
  }

  function applySheetLineups(sheet: SheetResponse, fallbackManagerId?: number | null) {
    const csaLineups = (sheet.lineups ?? []).filter((l) => !l.side || l.side === "csa");
    const nextStarters = new Set<number>();
    const nextBench = new Set<number>();
    const nextShirt: Record<number, string> = {};
    setPlayerInfo((prev) => {
      const next = new Map(prev);
      for (const l of csaLineups) {
        if (l.playerId == null) continue;
        if (l.role === "starter") nextStarters.add(l.playerId);
        else if (l.role === "bench") nextBench.add(l.playerId);
        if (l.shirtNumber != null) nextShirt[l.playerId] = String(l.shirtNumber);
        if (!next.has(l.playerId)) {
          next.set(l.playerId, {
            name: l.playerName,
            position: l.position ?? null,
            photoUrl: null,
          });
        }
      }
      return next;
    });
    setStarterIds(nextStarters);
    setBenchIds(nextBench);
    setShirtNumbers(nextShirt);
    setManagerIdDraft(
      sheet.managerId != null
        ? String(sheet.managerId)
        : fallbackManagerId != null
          ? String(fallbackManagerId)
          : "",
    );
  }

  function applySheetEvents(sheet: SheetResponse) {
    setSheetGoals(sheet.goals ?? []);
    setSheetCards(sheet.cards ?? []);
    setSheetManagerCards(sheet.managerCards ?? []);
    setCaptainPlayerId(sheet.captainPlayerId ?? null);
  }

  useEffect(() => {
    if (isNew) setTab("general");
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [lookupRes, seasonsRes] = await Promise.all([
          adminFetch("/admin/lookup"),
          adminFetch("/admin/seasons"),
        ]);
        if (cancelled) return;

        if (lookupRes.ok) {
          const lookupJson = (await lookupRes.json()) as any;
          setLookup({
            opponents: lookupJson.opponents ?? [],
            competitions: lookupJson.competitions ?? [],
            stadiums: lookupJson.stadiums ?? [],
            referees: lookupJson.referees ?? [],
          });
          setAllManagers(
            [...(lookupJson.managers ?? [])].sort((a: { name: string }, b: { name: string }) =>
              a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
            ),
          );
        }
        if (seasonsRes.ok) {
          const seasonsJson = (await seasonsRes.json()) as Array<{ year: string | number }>;
          setSeasons(seasonsJson.map((s) => String(s.year)));
        }

        if (isNew || matchId == null || Number.isNaN(matchId)) {
          setMatch(null);
          setLoading(false);
          return;
        }

        const matchRes = await adminFetch(`/admin/matches/${matchId}`);
        if (!matchRes.ok) throw new Error("Erro ao carregar partida");
        const found = (await matchRes.json()) as MatchMeta;
        if (cancelled) return;
        setMatch(found);
        setRosterSeason(found.season);

        const [sheetRes, rosterRes, managersRes, seasonMatchesRes] = await Promise.all([
          adminFetch(`/admin/matches/${matchId}/sheet`),
          adminFetch(`/admin/matches/${matchId}/roster?season=${encodeURIComponent(found.season)}`),
          adminFetch(`/admin/seasons/${encodeURIComponent(found.season)}/managers`),
          adminFetch(
            `/admin/matches?season=${encodeURIComponent(found.season)}&limit=500&offset=0`,
          ),
        ]);
        if (!sheetRes.ok || !rosterRes.ok) throw new Error("Erro ao carregar ficha");
        if (cancelled) return;

        if (managersRes.ok) {
          const mgrJson = (await managersRes.json()) as {
            data?: Array<{
              managerId: number;
              managerName: string;
              photoUrl?: string | null;
            }>;
          };
          setSeasonManagers(
            (mgrJson.data ?? [])
              .map((m) => ({
                id: m.managerId,
                name: m.managerName,
                photoUrl: m.photoUrl ?? null,
              }))
              .sort((a, b) =>
                a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
              ),
          );
        } else {
          setSeasonManagers([]);
        }

        if (seasonMatchesRes.ok) {
          const sm = (await seasonMatchesRes.json()) as {
            data?: Array<{
              id: number;
              matchDate: string;
              opponentName: string;
              goalsFor: number | null;
              goalsAgainst: number | null;
              competitionName?: string;
              phase?: string | null;
              round?: string | null;
            }>;
          };
          setRelatedMatchOptions(
            (sm.data ?? [])
              .filter((m) => m.id !== matchId)
              .map((m) => ({
                id: m.id,
                matchDate: m.matchDate,
                opponentName: m.opponentName,
                goalsFor: m.goalsFor,
                goalsAgainst: m.goalsAgainst,
                competitionName: m.competitionName,
                phase: m.phase ?? null,
                round: m.round ?? null,
              })),
          );
        } else {
          setRelatedMatchOptions([]);
        }

        const rosterJson = (await rosterRes.json()) as { players?: RosterPlayer[] };
        const rosterPlayers = rosterJson.players ?? [];
        setRoster(rosterPlayers);
        setPlayerInfo((prev) => {
          const next = new Map(prev);
          for (const p of rosterPlayers) {
            next.set(p.id, {
              name: p.name,
              position: p.position,
              photoUrl: p.photoUrl ?? null,
            });
          }
          return next;
        });

        const sheet = (await sheetRes.json()) as SheetResponse;
        applySheetLineups(sheet, found.managerId);
        applySheetEvents(sheet);
        setSubRows(buildSubRows(sheet.substitutions ?? []));
        resetEventForms();
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message ?? "Erro ao carregar");
          setMatch(null);
        }
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, matchId]);

  const rosterShirtById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of roster) if (p.shirtNumber != null) m.set(p.id, String(p.shirtNumber));
    return m;
  }, [roster]);

  function shirtValueFor(playerId: number): string {
    if (shirtNumbers[playerId] !== undefined) return shirtNumbers[playerId];
    return rosterShirtById.get(playerId) ?? "";
  }

  const escalacaoRows: EscalacaoRow[] = useMemo(() => {
    const rows: EscalacaoRow[] = [];
    const seen = new Set<number>();
    for (const p of roster) {
      rows.push({
        playerId: p.id,
        playerName: p.name,
        position: p.position,
        photoUrl: p.photoUrl ?? null,
      });
      seen.add(p.id);
    }
    const extraIds = [...starterIds, ...benchIds].filter((id) => !seen.has(id));
    for (const id of extraIds) {
      const info = playerInfo.get(id);
      rows.push({
        playerId: id,
        playerName: info?.name ?? `Jogador #${id}`,
        position: info?.position ?? null,
        photoUrl: info?.photoUrl ?? null,
      });
      seen.add(id);
    }
    return [...rows].sort((a, b) =>
      compareByPositionGroupThenName(
        { name: a.playerName, position: a.position },
        { name: b.playerName, position: b.position },
      ),
    );
  }, [roster, starterIds, benchIds, playerInfo]);

  /** Season managers + current match manager if missing from the season link list. */
  const managerRows = useMemo(() => {
    const rows = [...seasonManagers];
    const selectedId = managerIdDraft ? Number(managerIdDraft) : null;
    if (selectedId != null && !Number.isNaN(selectedId) && !rows.some((m) => m.id === selectedId)) {
      const fromAll = allManagers.find((m) => m.id === selectedId);
      rows.push({
        id: selectedId,
        name: fromAll?.name ?? match?.managerName ?? `Técnico #${selectedId}`,
        photoUrl: fromAll?.photoUrl ?? null,
      });
      rows.sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
    }
    return rows;
  }, [seasonManagers, managerIdDraft, allManagers, match?.managerName]);

  const lineupOptions = useMemo(
    () =>
      escalacaoRows
        .filter((r) => starterIds.has(r.playerId) || benchIds.has(r.playerId))
        .sort((a, b) => a.playerName.localeCompare(b.playerName, "pt-BR", { sensitivity: "base" })),
    [escalacaoRows, starterIds, benchIds],
  );

  function playerNameById(id: number | null): string {
    if (id == null) return "—";
    return playerInfo.get(id)?.name ?? `Jogador #${id}`;
  }

  async function saveGeneral(data: MatchGeneralFormData) {
    setSavedMsg("");
    if (isNew) {
      const r = await adminFetch("/admin/matches", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao criar");
      }
      const created = await r.json();
      setLocation(`/admin/partidas/${created.id}`);
      return;
    }
    if (!match) return;
    const r = await adminFetch(`/admin/matches/${match.id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...data,
        managerId: match.managerId,
        ...(match.status === "scheduled" ? { status: "scheduled" } : {}),
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
    }
    setSavedMsg("Dados gerais salvos.");
    setLocation(`/admin/partidas/${match.id}`);
  }

  async function deleteMatch() {
    if (!match) return;
    const r = await adminFetch(`/admin/matches/${match.id}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Erro ao excluir");
    }
    setLocation("/admin/partidas");
  }

  async function changeRosterSeason(season: string) {
    setRosterSeason(season);
    if (matchId == null) return;
    setError("");
    try {
      const r = await adminFetch(`/admin/matches/${matchId}/roster?season=${encodeURIComponent(season)}`);
      if (!r.ok) throw new Error("Erro ao carregar elenco da temporada");
      const data = (await r.json()) as { players?: RosterPlayer[] };
      const players = data.players ?? [];
      setRoster(players);
      setPlayerInfo((prev) => {
        const next = new Map(prev);
        for (const p of players) {
          next.set(p.id, {
            name: p.name,
            position: p.position,
            photoUrl: p.photoUrl ?? null,
          });
        }
        return next;
      });
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar elenco da temporada");
    }
  }

  function handleTitChange(playerId: number, checked: boolean) {
    setSavedMsg("");
    if (checked) {
      if (starterIds.size >= 11 && !starterIds.has(playerId)) {
        setError("Máximo de 11 titulares. Desmarque outro jogador antes de adicionar este.");
        return;
      }
      setError("");
      setStarterIds((prev) => new Set(prev).add(playerId));
      setBenchIds((prev) => {
        if (!prev.has(playerId)) return prev;
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    } else {
      setStarterIds((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  }

  function handleResChange(playerId: number, checked: boolean) {
    setSavedMsg("");
    if (checked) {
      setBenchIds((prev) => new Set(prev).add(playerId));
      setStarterIds((prev) => {
        if (!prev.has(playerId)) return prev;
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    } else {
      setBenchIds((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  }

  async function saveEscalacao() {
    if (matchId == null) return;
    setSavingLineup(true);
    setError("");
    setSavedMsg("");
    try {
      const selected = escalacaoRows.filter(
        (r) => starterIds.has(r.playerId) || benchIds.has(r.playerId),
      );
      const lineupsPayload = selected.map((r) => ({
        playerId: r.playerId,
        playerName: r.playerName,
        role: starterIds.has(r.playerId) ? ("starter" as const) : ("bench" as const),
        shirtNumber: shirtValueFor(r.playerId) === "" ? null : Number(shirtValueFor(r.playerId)),
        position: r.position,
      }));
      const sorted = sortLineupByPosition(lineupsPayload).map((l, i) => ({
        ...l,
        sortOrder: i,
        side: "csa" as const,
      }));
      const body = {
        lineups: sorted,
        managerId: managerIdDraft === "" ? null : Number(managerIdDraft),
      };
      const r = await adminFetch(`/admin/matches/${matchId}/sheet/lineup`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar escalação");
      }
      const sheet = (await r.json()) as SheetResponse;
      applySheetLineups(sheet, sheet.managerId);
      if (match) setMatch({ ...match, managerId: sheet.managerId });
      setSavedMsg("Escalação salva.");
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar escalação");
    }
    setSavingLineup(false);
  }

  async function saveEvents() {
    if (matchId == null) return;
    setSavingEvents(true);
    setError("");
    setSavedMsg("");
    try {
      const goals: Record<string, unknown>[] = [];
      const assists: Record<string, unknown>[] = [];
      const cards: Record<string, unknown>[] = [];
      const managerCardsPayload: Record<string, unknown>[] = [];

      for (const row of goalRows) {
        if (!row.playerId && !row.minute && !row.isOwnGoal) continue;
        if (!row.isOwnGoal && !row.playerId) {
          throw new Error("Selecione o autor do gol ou marque g.c.");
        }
        goals.push({
          scorerPlayerId: row.playerId ? Number(row.playerId) : null,
          minute: normalizeEventMinute(row.minute),
          injuryTimeMinute: row.injuryTimeMinute ? Number(row.injuryTimeMinute) : null,
          isPenalty: row.isPenalty && !row.isOwnGoal,
          isFreeKick: row.isFreeKick && !row.isOwnGoal && !row.isPenalty,
          isOwnGoal: row.isOwnGoal,
          ownGoalDirection: row.isOwnGoal ? "for" : null,
        });
      }

      for (const row of redRows) {
        if (!row.playerId) continue;
        cards.push({
          cardType: "red",
          playerId: Number(row.playerId),
          minute: normalizeEventMinute(row.minute),
          injuryTimeMinute: row.injuryTimeMinute ? Number(row.injuryTimeMinute) : null,
        });
      }
      for (const row of yellowRows) {
        if (!row.playerId) continue;
        cards.push({
          cardType: "yellow",
          playerId: Number(row.playerId),
          minute: normalizeEventMinute(row.minute),
          injuryTimeMinute: row.injuryTimeMinute ? Number(row.injuryTimeMinute) : null,
        });
      }
      for (const row of assistRows) {
        if (!row.playerId) continue;
        const minute = normalizeEventMinute(row.minute);
        if (isUnknownEventMinute(minute)) {
          throw new Error(
            "Assistência precisa do minuto conhecido do gol (não use vazio/200).",
          );
        }
        assists.push({
          assistPlayerId: Number(row.playerId),
          minute,
          injuryTimeMinute: row.injuryTimeMinute ? Number(row.injuryTimeMinute) : null,
        });
      }
      if (gpdRow.playerId) {
        goals.push({
          scorerPlayerId: Number(gpdRow.playerId),
          minute: normalizeEventMinute(gpdRow.minute),
          injuryTimeMinute: gpdRow.injuryTimeMinute ? Number(gpdRow.injuryTimeMinute) : null,
          isOwnGoal: true,
          ownGoalDirection: "against",
        });
      }
      if (gpfRow.minute || gpfRow.playerId) {
        goals.push({
          scorerPlayerId: gpfRow.playerId ? Number(gpfRow.playerId) : null,
          minute: normalizeEventMinute(gpfRow.minute),
          injuryTimeMinute: gpfRow.injuryTimeMinute ? Number(gpfRow.injuryTimeMinute) : null,
          isOwnGoal: true,
          ownGoalDirection: "for",
        });
      }
      for (const row of managerCardRows) {
        if (String(row.minute).trim() === "") continue;
        managerCardsPayload.push({
          cardType: row.cardType,
          minute: normalizeEventMinute(row.minute),
          injuryTimeMinute: row.injuryTimeMinute ? Number(row.injuryTimeMinute) : null,
        });
      }

      const body: Record<string, unknown> = {
        goals,
        assists,
        cards,
        managerCards: managerCardsPayload,
      };
      // Only send captainPlayerId when the C field was actually filled in this
      // batch — the field always starts blank, so leaving it blank must never
      // wipe out a captain saved previously.
      if (captainDraft) body.captainPlayerId = Number(captainDraft);

      const r = await adminFetch(`/admin/matches/${matchId}/sheet/events`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao gravar eventos");
      }
      const sheet = (await r.json()) as SheetResponse;
      applySheetEvents(sheet);
      resetEventForms();
      setSavedMsg("Eventos gravados.");
    } catch (e: any) {
      setError(e.message ?? "Erro ao gravar eventos");
    }
    setSavingEvents(false);
  }

  async function deleteGoal(id: number) {
    if (matchId == null) return;
    setError("");
    const r = await adminFetch(`/admin/matches/${matchId}/sheet/goals/${id}`, { method: "DELETE" });
    if (r.ok) {
      applySheetEvents((await r.json()) as SheetResponse);
      if (editingGoalId === id) setEditingGoalId(null);
    } else {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao excluir gol");
    }
  }

  function startEditGoal(g: SheetGoal) {
    setEditingGoalId(g.id);
    setEditGoalMinute(eventMinuteToFormValue(g.minute));
    setEditGoalInjury(
      g.injuryTimeMinute != null && g.injuryTimeMinute > 0
        ? String(g.injuryTimeMinute)
        : "",
    );
    setEditGoalPenalty(!!g.isPenalty);
    setEditGoalFreeKick(!!g.isFreeKick);
    setError("");
    setSavedMsg("");
  }

  async function saveGoalEdit(goalId: number) {
    if (matchId == null) return;
    setSavingGoalEdit(true);
    setError("");
    setSavedMsg("");
    try {
      const r = await adminFetch(`/admin/matches/${matchId}/sheet/goals/${goalId}`, {
        method: "PUT",
        body: JSON.stringify({
          minute: editGoalMinute,
          injuryTimeMinute: editGoalInjury.trim() === "" ? null : editGoalInjury,
          isPenalty: editGoalPenalty,
          isFreeKick: editGoalFreeKick && !editGoalPenalty,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao editar gol");
      }
      applySheetEvents((await r.json()) as SheetResponse);
      setEditingGoalId(null);
      setSavedMsg("Gol atualizado.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao editar gol");
    }
    setSavingGoalEdit(false);
  }

  async function deleteCard(id: number) {
    if (matchId == null) return;
    setError("");
    const r = await adminFetch(`/admin/matches/${matchId}/sheet/cards/${id}`, { method: "DELETE" });
    if (r.ok) {
      applySheetEvents((await r.json()) as SheetResponse);
    } else {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao excluir cartão");
    }
  }

  async function deleteManagerCard(id: number) {
    if (matchId == null) return;
    setError("");
    const r = await adminFetch(`/admin/matches/${matchId}/sheet/manager-cards/${id}`, {
      method: "DELETE",
    });
    if (r.ok) {
      applySheetEvents((await r.json()) as SheetResponse);
    } else {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao excluir cartão do técnico");
    }
  }

  async function saveSubs() {
    if (matchId == null) return;
    setSavingSubs(true);
    setError("");
    setSavedMsg("");
    try {
      const substitutions = subRows
        .filter((s) => s.playerOutId || s.playerInId || s.minute)
        .map((s) => {
          if (!s.playerOutId || !s.playerInId) {
            throw new Error(
              "Cada substituição preenchida precisa de quem saiu e quem entrou.",
            );
          }
          return {
            playerOutId: Number(s.playerOutId),
            playerInId: Number(s.playerInId),
            minute: normalizeEventMinute(s.minute),
            injuryTimeMinute: s.injuryTimeMinute ? Number(s.injuryTimeMinute) : null,
          };
        });
      const r = await adminFetch(`/admin/matches/${matchId}/sheet/substitutions`, {
        method: "PUT",
        body: JSON.stringify({ substitutions }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar substituições");
      }
      const sheet = (await r.json()) as SheetResponse;
      setSubRows(buildSubRows(sheet.substitutions ?? []));
      setSavedMsg("Substituições salvas.");
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar substituições");
    }
    setSavingSubs(false);
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando...</p>;
  }

  if (!isNew && (error || !match) && !lookup) {
    return (
      <div>
        <p className="text-sm text-red-600">{error || "Partida não encontrada"}</p>
        <Link href="/admin/partidas" className="text-sm text-[#1B3A6B] hover:underline mt-2 inline-block">
          Voltar às partidas
        </Link>
      </div>
    );
  }

  if (!isNew && !match) {
    return (
      <div>
        <p className="text-sm text-red-600">{error || "Partida não encontrada"}</p>
        <Link href="/admin/partidas" className="text-sm text-[#1B3A6B] hover:underline mt-2 inline-block">
          Voltar às partidas
        </Link>
      </div>
    );
  }

  if (!lookup) {
    return <p className="text-sm text-red-600">Erro ao carregar lookups</p>;
  }

  const tabs: { id: TabId; label: string }[] = isNew
    ? [{ id: "general", label: "Dados Gerais" }]
    : [
        { id: "general", label: "Dados Gerais" },
        { id: "lineup", label: "Escalação" },
        { id: "events", label: "Eventos" },
        { id: "subs", label: "Substituições" },
      ];

  const isHome = match?.homeAway === "home";
  const opponentLogo =
    match?.opponentLogoUrl ??
    lookup.opponents.find((o) => o.id === match?.opponentId)?.logoUrl ??
    null;
  const titleLeftGoals = match
    ? isHome
      ? match.goalsFor
      : match.goalsAgainst
    : null;
  const titleRightGoals = match
    ? isHome
      ? match.goalsAgainst
      : match.goalsFor
    : null;

  return (
    <div className="space-y-4 pb-10">
      <div>
        <Link
          href="/admin/partidas"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#1B3A6B] mb-2"
        >
          <ChevronLeft size={13} /> Partidas
        </Link>
        <h1 className="text-xl font-bold text-gray-900">
          {isNew || !match ? (
            "Nova partida"
          ) : (
            <span className="inline-flex items-center gap-2 flex-wrap">
              {isHome ? (
                <span className="inline-flex items-center gap-1.5">
                  <CsaCrest size="md" />
                  <span>CSA</span>
                </span>
              ) : (
                <Link
                  href={withAdminFrom(
                    `/admin/adversarios/${match.opponentId}`,
                    `/admin/partidas/${match.id}`,
                  )}
                  className="inline-flex items-center gap-1.5 hover:text-[#1B3A6B] hover:underline underline-offset-2"
                  title="Editar adversário"
                >
                  <OpponentCrest
                    url={opponentLogo}
                    name={match.opponentName}
                    size="md"
                    fallback
                  />
                  <span>{match.opponentName}</span>
                </Link>
              )}
              <a
                href={`/partidas/${match.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tabular-nums text-[#1B3A6B] hover:underline underline-offset-2"
                title="Abrir página pública da partida"
              >
                {titleLeftGoals ?? "–"}–{titleRightGoals ?? "–"}
              </a>
              {isHome ? (
                <Link
                  href={withAdminFrom(
                    `/admin/adversarios/${match.opponentId}`,
                    `/admin/partidas/${match.id}`,
                  )}
                  className="inline-flex items-center gap-1.5 hover:text-[#1B3A6B] hover:underline underline-offset-2"
                  title="Editar adversário"
                >
                  <span>{match.opponentName}</span>
                  <OpponentCrest
                    url={opponentLogo}
                    name={match.opponentName}
                    size="md"
                    fallback
                  />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span>CSA</span>
                  <CsaCrest size="md" />
                </span>
              )}
            </span>
          )}
        </h1>
        {!isNew && match && (
          <p className="text-sm text-gray-500 mt-1">
            {match.matchDate} · {match.competitionName}
            {matchPhaseRoundLabel(match.phase, match.round)
              ? ` · ${matchPhaseRoundLabel(match.phase, match.round)}`
              : ""}
            {" · "}temp. {match.season}
            {" · "}
            <a
              href={`/partidas/${match.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1B3A6B] hover:underline"
            >
              Ver no site →
            </a>
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {isNew
            ? "Preencha os dados gerais e salve para liberar a ficha CSA."
            : "Dados gerais salvam separados. Escalação (com técnico) salva junto. Eventos são adicionados aos já salvos, um lote por vez. Substituições salvam à parte."}
        </p>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-[#1B3A6B] text-[#1B3A6B]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <MatchGeneralForm
          key={isNew ? "new" : match!.id}
          initial={isNew ? undefined : match!}
          lookup={lookup}
          isNew={isNew}
          matchId={matchId}
          relatedMatchOptions={
            match?.relatedMatch &&
            !relatedMatchOptions.some((m) => m.id === match.relatedMatch!.id)
              ? [
                  {
                    id: match.relatedMatch.id,
                    matchDate: match.relatedMatch.matchDate,
                    opponentName: match.relatedMatch.opponentName,
                    goalsFor: match.relatedMatch.goalsFor,
                    goalsAgainst: match.relatedMatch.goalsAgainst,
                    phase: match.relatedMatch.phase,
                    round: match.relatedMatch.round,
                  },
                  ...relatedMatchOptions,
                ]
              : relatedMatchOptions
          }
          onSave={saveGeneral}
          onDelete={isNew ? undefined : deleteMatch}
        />
      )}

      {tab === "lineup" && match && (
        <section className="bg-white border rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">CSA</h2>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Temporada do elenco
              </label>
              <select
                className="border rounded px-2 py-1.5 text-sm bg-white"
                value={rosterSeason}
                onChange={(e) => changeRosterSeason(e.target.value)}
              >
                {rosterSeason && !seasons.includes(rosterSeason) && (
                  <option value={rosterSeason}>{rosterSeason}</option>
                )}
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            {starterIds.size} titulares · {benchIds.size} reservas
            {starterIds.size !== 11 && (
              <span className="text-amber-600"> — aviso: o usual são 11 titulares</span>
            )}
          </p>

          <div className="border rounded overflow-x-auto">
            {/*
              Mobile: Tit./Res. stick to the right (OGOL-like) so checkboxes stay fully visible.
              Desktop (md+): static columns, same layout as before.
            */}
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-100 text-left text-[11px] uppercase text-gray-500">
                  <th className="px-1.5 md:px-2 py-2 w-11 md:w-14">N.</th>
                  <th className="px-1.5 md:px-2 py-2 min-w-0">Jogador</th>
                  <th className="px-1.5 md:px-2 py-2 w-10 md:w-16">Pos</th>
                  <th className="px-1.5 md:px-2 py-2 w-11 md:w-14 min-w-[2.75rem] text-center sticky right-11 md:static z-[2] bg-gray-100">
                    Tit.
                  </th>
                  <th className="px-1.5 md:px-2 py-2 w-11 md:w-14 min-w-[2.75rem] text-center sticky right-0 md:static z-[2] bg-gray-100 shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.18)] md:shadow-none">
                    Res.
                  </th>
                </tr>
              </thead>
              <tbody>
                {escalacaoRows.map((row, i) => {
                  const zebra = i % 2 === 0 ? "bg-white" : "bg-gray-50";
                  return (
                    <tr key={row.playerId} className={zebra}>
                      <td className={`px-1.5 md:px-2 py-1.5 ${zebra}`}>
                        <Input
                          className="w-10 md:w-14 h-8 text-center"
                          value={shirtValueFor(row.playerId)}
                          onChange={(e) =>
                            setShirtNumbers((prev) => ({
                              ...prev,
                              [row.playerId]: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className={`px-1.5 md:px-2 py-1.5 min-w-0 ${zebra}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <PlayerPhoto
                            url={row.photoUrl}
                            name={row.playerName}
                            size="sm"
                          />
                          <a
                            href={`/admin/jogadores/${row.playerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium truncate min-w-0 text-[#1B3A6B] hover:underline"
                            title="Abrir perfil do jogador"
                          >
                            {row.playerName}
                          </a>
                        </div>
                      </td>
                      <td className={`px-1.5 md:px-2 py-1.5 text-xs text-gray-500 ${zebra}`}>
                        {shortPositionCode(row.position)}
                      </td>
                      <td
                        className={`px-1.5 md:px-2 py-1.5 text-center sticky right-11 md:static z-[1] min-w-[2.75rem] ${zebra}`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#1B3A6B]"
                          checked={starterIds.has(row.playerId)}
                          onChange={(e) => handleTitChange(row.playerId, e.target.checked)}
                        />
                      </td>
                      <td
                        className={`px-1.5 md:px-2 py-1.5 text-center sticky right-0 md:static z-[1] min-w-[2.75rem] shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.18)] md:shadow-none ${zebra}`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#1B3A6B]"
                          checked={benchIds.has(row.playerId)}
                          onChange={(e) => handleResChange(row.playerId, e.target.checked)}
                        />
                      </td>
                    </tr>
                  );
                })}
                {escalacaoRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-xs text-gray-400">
                      Nenhum jogador na temporada selecionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Técnico</h3>
            <p className="text-xs text-gray-400">
              Técnicos vinculados à temporada {match.season}. Uma seleção apenas.
            </p>
            <div className="border rounded overflow-hidden overflow-x-auto max-w-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-[11px] uppercase text-gray-500">
                    <th className="px-2 py-2">Técnico</th>
                    <th className="px-2 py-2 w-14 text-center">Sel.</th>
                  </tr>
                </thead>
                <tbody>
                  {managerRows.map((m, i) => {
                    const selected = managerIdDraft === String(m.id);
                    return (
                      <tr key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-2 py-1.5 font-medium">
                          <div className="flex items-center gap-2 min-w-0">
                            <EntityPhoto
                              url={m.photoUrl}
                              name={m.name}
                              size="sm"
                              shape="circle"
                              label={`Foto de ${m.name}`}
                            />
                            <a
                              href={`/admin/tecnicos/${m.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1B3A6B] hover:underline truncate"
                              title="Abrir perfil do técnico"
                            >
                              {m.name}
                            </a>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[#1B3A6B]"
                            checked={selected}
                            onChange={(e) => {
                              setSavedMsg("");
                              setManagerIdDraft(e.target.checked ? String(m.id) : "");
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {managerRows.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-2 py-4 text-center text-xs text-gray-400">
                        Nenhum técnico vinculado a {match.season}. Vincule em Temporadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Button type="button" className="bg-[#1B3A6B]" onClick={saveEscalacao} disabled={savingLineup}>
            {savingLineup ? "Salvando…" : "Salvar Escalação"}
          </Button>
        </section>
      )}

      {tab === "events" && match && (
        <div className="space-y-6">
          <section className="bg-white border rounded-lg p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Eventos - CSA
            </h2>
            <p className="text-xs text-gray-400">
              Minuto é opcional: deixe em branco ou use 200 para “não disponível” (aparece como n/d).
              Assistências ainda precisam do minuto do gol para vincular.
            </p>
            {lineupOptions.length === 0 && (
              <p className="text-xs text-gray-400">
                Escale jogadores (Tit. ou Res.) na aba Escalação antes de cadastrar eventos.
              </p>
            )}
            <div className="border rounded overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-[11px] uppercase text-gray-500">
                    <th className="px-2 py-2 w-10"></th>
                    <th className="px-2 py-2 min-w-[10rem]">Jogador</th>
                    <th className="px-2 py-2 w-20">Min</th>
                    <th className="px-2 py-2 w-28">Min Acrésc.</th>
                    <th className="px-2 py-2 w-14 text-center">g.c.</th>
                    <th className="px-2 py-2 w-14 text-center">Pen</th>
                    <th className="px-2 py-2 w-14 text-center">Falta</th>
                  </tr>
                </thead>
                <tbody>
                  {goalRows.map((row, i) => (
                    <tr key={`goal-${i}`} className="border-t">
                      <td className="px-2 py-1.5 text-center">⚽</td>
                      <td className="px-2 py-1.5">
                        <select
                          className={selectCls}
                          value={row.playerId}
                          onChange={(e) =>
                            setGoalRows((rows) => patchAt(rows, i, { playerId: e.target.value }))
                          }
                        >
                          <option value="">(Nenhum)</option>
                          {lineupOptions.map((p) => (
                            <option key={p.playerId} value={p.playerId}>
                              {p.playerName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-8"
                          value={row.minute}
                          onChange={(e) =>
                            setGoalRows((rows) => patchAt(rows, i, { minute: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-8"
                          value={row.injuryTimeMinute}
                          onChange={(e) =>
                            setGoalRows((rows) =>
                              patchAt(rows, i, { injuryTimeMinute: e.target.value }),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={row.isOwnGoal}
                          onChange={(e) =>
                            setGoalRows((rows) =>
                              patchAt(rows, i, {
                                isOwnGoal: e.target.checked,
                                isPenalty: e.target.checked ? false : row.isPenalty,
                                isFreeKick: e.target.checked ? false : row.isFreeKick,
                              }),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={row.isPenalty}
                          disabled={row.isOwnGoal}
                          onChange={(e) =>
                            setGoalRows((rows) =>
                              patchAt(rows, i, {
                                isPenalty: e.target.checked,
                                isFreeKick: e.target.checked ? false : row.isFreeKick,
                              }),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={row.isFreeKick}
                          disabled={row.isOwnGoal}
                          onChange={(e) =>
                            setGoalRows((rows) =>
                              patchAt(rows, i, {
                                isFreeKick: e.target.checked,
                                isPenalty: e.target.checked ? false : row.isPenalty,
                              }),
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}

                  {redRows.map((row, i) => (
                    <tr key={`red-${i}`} className="border-t bg-red-50">
                      <td className="px-2 py-1.5 text-center">
                        <span className="inline-block w-3 h-4 rounded-sm bg-red-600" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          className={selectCls}
                          value={row.playerId}
                          onChange={(e) =>
                            setRedRows((rows) => patchAt(rows, i, { playerId: e.target.value }))
                          }
                        >
                          <option value="">(Nenhum)</option>
                          {lineupOptions.map((p) => (
                            <option key={p.playerId} value={p.playerId}>
                              {p.playerName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-8"
                          value={row.minute}
                          onChange={(e) =>
                            setRedRows((rows) => patchAt(rows, i, { minute: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-8"
                          value={row.injuryTimeMinute}
                          onChange={(e) =>
                            setRedRows((rows) =>
                              patchAt(rows, i, { injuryTimeMinute: e.target.value }),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5"></td>
                    </tr>
                  ))}

                  {yellowRows.map((row, i) => (
                    <tr key={`yellow-${i}`} className="border-t bg-yellow-50">
                      <td className="px-2 py-1.5 text-center">
                        <span className="inline-block w-3 h-4 rounded-sm bg-yellow-400" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          className={selectCls}
                          value={row.playerId}
                          onChange={(e) =>
                            setYellowRows((rows) => patchAt(rows, i, { playerId: e.target.value }))
                          }
                        >
                          <option value="">(Nenhum)</option>
                          {lineupOptions.map((p) => (
                            <option key={p.playerId} value={p.playerId}>
                              {p.playerName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-8"
                          value={row.minute}
                          onChange={(e) =>
                            setYellowRows((rows) => patchAt(rows, i, { minute: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-8"
                          value={row.injuryTimeMinute}
                          onChange={(e) =>
                            setYellowRows((rows) =>
                              patchAt(rows, i, { injuryTimeMinute: e.target.value }),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5"></td>
                    </tr>
                  ))}

                  {assistRows.map((row, i) => (
                    <tr key={`assist-${i}`} className="border-t">
                      <td className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-500">
                        ASS:
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          className={selectCls}
                          value={row.playerId}
                          onChange={(e) =>
                            setAssistRows((rows) => patchAt(rows, i, { playerId: e.target.value }))
                          }
                        >
                          <option value="">(Nenhum)</option>
                          {lineupOptions.map((p) => (
                            <option key={p.playerId} value={p.playerId}>
                              {p.playerName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-8"
                          value={row.minute}
                          onChange={(e) =>
                            setAssistRows((rows) => patchAt(rows, i, { minute: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-8"
                          value={row.injuryTimeMinute}
                          onChange={(e) =>
                            setAssistRows((rows) =>
                              patchAt(rows, i, { injuryTimeMinute: e.target.value }),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5"></td>
                    </tr>
                  ))}

                  <tr className="border-t">
                    <td className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-500">
                      GPD:
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        className={selectCls}
                        value={gpdRow.playerId}
                        onChange={(e) => setGpdRow((r) => ({ ...r, playerId: e.target.value }))}
                      >
                        <option value="">(Nenhum)</option>
                        {lineupOptions.map((p) => (
                          <option key={p.playerId} value={p.playerId}>
                            {p.playerName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8"
                        value={gpdRow.minute}
                        onChange={(e) => setGpdRow((r) => ({ ...r, minute: e.target.value }))}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8"
                        value={gpdRow.injuryTimeMinute}
                        onChange={(e) =>
                          setGpdRow((r) => ({ ...r, injuryTimeMinute: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                  </tr>

                  <tr className="border-t">
                    <td className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-500">
                      GPF:
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        className={selectCls}
                        value={gpfRow.playerId}
                        onChange={(e) => setGpfRow((r) => ({ ...r, playerId: e.target.value }))}
                      >
                        <option value="">(Nenhum)</option>
                        {lineupOptions.map((p) => (
                          <option key={p.playerId} value={p.playerId}>
                            {p.playerName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8"
                        value={gpfRow.minute}
                        onChange={(e) => setGpfRow((r) => ({ ...r, minute: e.target.value }))}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8"
                        value={gpfRow.injuryTimeMinute}
                        onChange={(e) =>
                          setGpfRow((r) => ({ ...r, injuryTimeMinute: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                  </tr>

                  <tr className="border-t">
                    <td className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-500">
                      C:
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        className={selectCls}
                        value={captainDraft}
                        onChange={(e) => setCaptainDraft(e.target.value)}
                      >
                        <option value="">(Nenhum)</option>
                        {lineupOptions.map((p) => (
                          <option key={p.playerId} value={p.playerId}>
                            {p.playerName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                    <td className="px-2 py-1.5"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white border rounded-lg p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Eventos - Treinador
            </h2>
            <div className="border rounded overflow-x-auto max-w-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-[11px] uppercase text-gray-500">
                    <th className="px-2 py-2 w-14">Tipo</th>
                    <th className="px-2 py-2">Min</th>
                    <th className="px-2 py-2">Min Acrésc.</th>
                  </tr>
                </thead>
                <tbody>
                  {managerCardRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-t ${row.cardType === "yellow" ? "bg-yellow-50" : "bg-red-50"}`}
                    >
                      <td className="px-2 py-1.5 text-center">
                        <span
                          className={`inline-block w-3 h-4 rounded-sm ${
                            row.cardType === "yellow" ? "bg-yellow-400" : "bg-red-600"
                          }`}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-8"
                          value={row.minute}
                          onChange={(e) =>
                            setManagerCardRows((rows) =>
                              patchAt(rows, i, { minute: e.target.value }),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-8"
                          value={row.injuryTimeMinute}
                          onChange={(e) =>
                            setManagerCardRows((rows) =>
                              patchAt(rows, i, { injuryTimeMinute: e.target.value }),
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <Button type="button" className="bg-[#1B3A6B]" onClick={saveEvents} disabled={savingEvents}>
            {savingEvents ? "Gravando…" : "Grava Eventos"}
          </Button>

          <section className="bg-white border rounded-lg p-4 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Eventos registrados
            </h2>
            <p className="text-xs text-gray-600 flex items-center gap-2 flex-wrap">
              <span>
                Capitão: <span className="font-medium">{playerNameById(captainPlayerId)}</span>
              </span>
              {captainPlayerId != null && (
                <button
                  type="button"
                  className="text-[11px] text-red-600 hover:underline"
                  onClick={async () => {
                    if (matchId == null) return;
                    const r = await adminFetch(`/admin/matches/${matchId}/sheet/events`, {
                      method: "POST",
                      body: JSON.stringify({
                        goals: [],
                        assists: [],
                        cards: [],
                        managerCards: [],
                        captainPlayerId: null,
                      }),
                    });
                    if (r.ok) applySheetEvents((await r.json()) as SheetResponse);
                    else {
                      const err = await r.json().catch(() => ({}));
                      setError((err as { error?: string }).error ?? "Erro ao limpar capitão");
                    }
                  }}
                >
                  Limpar
                </button>
              )}
            </p>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Gols ({sheetGoals.length})
              </h3>
              <ul className="divide-y border rounded">
                {sheetGoals.map((g) => (
                  <li key={g.id} className="px-3 py-2 text-sm">
                    {editingGoalId === g.id ? (
                      <div className="space-y-2">
                        <p className="font-medium">
                          {g.isOwnGoal ? "Gol contra" : (g.scorerName ?? "—")}
                          {g.assistName ? (
                            <span className="ml-1 text-xs text-gray-400 font-normal">
                              assist.: {g.assistName}
                            </span>
                          ) : null}
                        </p>
                        <div className="flex flex-wrap items-end gap-3">
                          <div>
                            <label className="text-[10px] uppercase text-gray-400 block mb-0.5">
                              Min
                            </label>
                            <Input
                              className="h-8 w-20"
                              value={editGoalMinute}
                              onChange={(e) => setEditGoalMinute(e.target.value)}
                              placeholder="n/d"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase text-gray-400 block mb-0.5">
                              Acrésc.
                            </label>
                            <Input
                              className="h-8 w-20"
                              value={editGoalInjury}
                              onChange={(e) => setEditGoalInjury(e.target.value)}
                              placeholder="—"
                            />
                          </div>
                          {!g.isOwnGoal && (
                            <>
                              <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 pb-1.5">
                                <input
                                  type="checkbox"
                                  checked={editGoalPenalty}
                                  onChange={(e) => {
                                    setEditGoalPenalty(e.target.checked);
                                    if (e.target.checked) setEditGoalFreeKick(false);
                                  }}
                                />
                                Pênalti
                              </label>
                              <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 pb-1.5">
                                <input
                                  type="checkbox"
                                  checked={editGoalFreeKick}
                                  onChange={(e) => {
                                    setEditGoalFreeKick(e.target.checked);
                                    if (e.target.checked) setEditGoalPenalty(false);
                                  }}
                                />
                                Falta
                              </label>
                            </>
                          )}
                          <div className="flex gap-1.5 pb-0.5">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 bg-[#1B3A6B]"
                              disabled={savingGoalEdit}
                              onClick={() => saveGoalEdit(g.id)}
                            >
                              {savingGoalEdit ? "…" : "Salvar"}
                            </Button>
                            <button
                              type="button"
                              className="p-1.5 text-gray-400 hover:text-gray-700"
                              onClick={() => setEditingGoalId(null)}
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {formatSavedMinute(g.minute, g.injuryTimeMinute)}{" "}
                          {g.isOwnGoal ? "Gol contra" : (g.scorerName ?? "—")}
                          {g.isPenalty && (
                            <span className="ml-1 text-[10px] uppercase text-gray-400">(Pênalti)</span>
                          )}
                          {g.isFreeKick && (
                            <span className="ml-1 text-[10px] uppercase text-gray-400">(Falta)</span>
                          )}
                          {g.isOwnGoal && (
                            <span className="ml-1 text-[10px] uppercase text-gray-400">
                              ({g.ownGoalDirection === "for" ? "a favor" : "contra"})
                            </span>
                          )}
                          {g.assistName && (
                            <span className="ml-1 text-xs text-gray-400">assist.: {g.assistName}</span>
                          )}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            className="p-1 text-gray-400 hover:text-[#1B3A6B]"
                            onClick={() => startEditGoal(g)}
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-400 hover:text-red-600"
                            onClick={() => deleteGoal(g.id)}
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
                {sheetGoals.length === 0 && (
                  <li className="px-3 py-2 text-xs text-gray-400">Nenhum gol registrado</li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Cartões ({sheetCards.length})
              </h3>
              <ul className="divide-y border rounded">
                {sheetCards.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span>
                      {formatSavedMinute(c.minute, c.injuryTimeMinute)}{" "}
                      <span
                        className={`inline-block w-2.5 h-3.5 rounded-sm align-middle mr-1 ${
                          c.cardType === "red" ? "bg-red-600" : "bg-yellow-400"
                        }`}
                      />
                      {c.playerName ?? "—"}
                    </span>
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-red-600 shrink-0"
                      onClick={() => deleteCard(c.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
                {sheetCards.length === 0 && (
                  <li className="px-3 py-2 text-xs text-gray-400">Nenhum cartão registrado</li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Cartões do técnico ({sheetManagerCards.length})
              </h3>
              <ul className="divide-y border rounded">
                {sheetManagerCards.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span>
                      {formatSavedMinute(c.minute, c.injuryTimeMinute)}{" "}
                      <span
                        className={`inline-block w-2.5 h-3.5 rounded-sm align-middle mr-1 ${
                          c.cardType === "red" ? "bg-red-600" : "bg-yellow-400"
                        }`}
                      />
                      Técnico
                    </span>
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-red-600 shrink-0"
                      onClick={() => deleteManagerCard(c.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
                {sheetManagerCards.length === 0 && (
                  <li className="px-3 py-2 text-xs text-gray-400">Nenhum cartão do técnico registrado</li>
                )}
              </ul>
            </div>
          </section>
        </div>
      )}

      {tab === "subs" && match && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Substituições CSA
          </h2>
          <p className="text-xs text-gray-400">
            Minuto opcional (vazio ou 200 = n/d).
          </p>
          {lineupOptions.length === 0 && (
            <p className="text-xs text-gray-400">
              Escale jogadores (Tit. ou Res.) na aba Escalação antes de cadastrar substituições.
            </p>
          )}
          <div className="border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-[11px] uppercase text-gray-500">
                  <th className="px-2 py-2 min-w-[9rem]">Saiu</th>
                  <th className="px-2 py-2 min-w-[9rem]">Entrou</th>
                  <th className="px-2 py-2 w-20">Min</th>
                  <th className="px-2 py-2 w-28">Min Acrésc.</th>
                </tr>
              </thead>
              <tbody>
                {subRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white border-t" : "bg-gray-50 border-t"}>
                    <td className="px-2 py-1.5">
                      <select
                        className={selectCls}
                        value={row.playerOutId}
                        onChange={(e) =>
                          setSubRows((rows) => patchAt(rows, i, { playerOutId: e.target.value }))
                        }
                      >
                        <option value="">(Nenhum)</option>
                        {lineupOptions.map((p) => (
                          <option key={p.playerId} value={p.playerId}>
                            {p.playerName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        className={selectCls}
                        value={row.playerInId}
                        onChange={(e) =>
                          setSubRows((rows) => patchAt(rows, i, { playerInId: e.target.value }))
                        }
                      >
                        <option value="">(Nenhum)</option>
                        {lineupOptions.map((p) => (
                          <option key={p.playerId} value={p.playerId}>
                            {p.playerName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8"
                        value={row.minute}
                        onChange={(e) =>
                          setSubRows((rows) => patchAt(rows, i, { minute: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8"
                        value={row.injuryTimeMinute}
                        onChange={(e) =>
                          setSubRows((rows) =>
                            patchAt(rows, i, { injuryTimeMinute: e.target.value }),
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" className="bg-[#1B3A6B]" onClick={saveSubs} disabled={savingSubs}>
            {savingSubs ? "Salvando…" : "Salvar Substituições"}
          </Button>
        </section>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {savedMsg && <p className="text-sm text-green-700">{savedMsg}</p>}
    </div>
  );
}
