import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";
import { ChevronLeft, Plus, Trash2, RefreshCw } from "lucide-react";
import {
  compareByPositionGroupThenName,
  shortPositionCode,
} from "@/lib/position-groups";

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

type CompDraft = {
  games: string;
  wins: string;
  draws: string;
  losses: string;
  goalsFor: string;
  goalsAgainst: string;
  classification: string;
};

type RosterRow = {
  id: number;
  playerId: number;
  playerName: string;
  position: string | null;
  season: string;
  appearances: number;
  goals: number;
  assists: number;
  shirtNumber: number | null;
};

type RosterDraft = {
  shirtNumber: string;
  appearances: string;
  goals: string;
  assists: string;
};

type ManagerRow = {
  id: number;
  managerId: number;
  managerName: string;
  season: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  statsSource: string;
  statsRecalculatedAt: string | null;
};

type ManagerDraft = {
  games: string;
  wins: string;
  draws: string;
  losses: string;
  goalsFor: string;
  goalsAgainst: string;
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

type LookupCompetition = { id: number; name: string };
type PlayerOption = { id: number; name: string; position?: string | null };
type ManagerOption = { id: number; name: string };

function draftsFromComp(stats: CompStat[]): Record<number, CompDraft> {
  const out: Record<number, CompDraft> = {};
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

function draftsFromRoster(rows: RosterRow[]): Record<number, RosterDraft> {
  const out: Record<number, RosterDraft> = {};
  for (const r of rows) {
    out[r.id] = {
      shirtNumber: r.shirtNumber != null ? String(r.shirtNumber) : "",
      appearances: String(r.appearances),
      goals: String(r.goals),
      assists: String(r.assists),
    };
  }
  return out;
}

function draftsFromManagers(rows: ManagerRow[]): Record<number, ManagerDraft> {
  const out: Record<number, ManagerDraft> = {};
  for (const r of rows) {
    out[r.id] = {
      games: String(r.games),
      wins: String(r.wins),
      draws: String(r.draws),
      losses: String(r.losses),
      goalsFor: String(r.goalsFor),
      goalsAgainst: String(r.goalsAgainst),
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

  // Competition summary
  const [stats, setStats] = useState<CompStat[]>([]);
  const [drafts, setDrafts] = useState<Record<number, CompDraft>>({});
  const [competitions, setCompetitions] = useState<LookupCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [compError, setCompError] = useState("");
  const [compSavedMsg, setCompSavedMsg] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addCompetitionId, setAddCompetitionId] = useState("");

  // Roster
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [rosterDrafts, setRosterDrafts] = useState<Record<number, RosterDraft>>({});
  const [allPlayers, setAllPlayers] = useState<PlayerOption[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterSaving, setRosterSaving] = useState(false);
  const [rosterError, setRosterError] = useState("");
  const [rosterSavedMsg, setRosterSavedMsg] = useState("");
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");

  // Managers
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [managerDrafts, setManagerDrafts] = useState<Record<number, ManagerDraft>>({});
  const [allManagers, setAllManagers] = useState<ManagerOption[]>([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [managersSaving, setManagersSaving] = useState(false);
  const [managerRecalcId, setManagerRecalcId] = useState<number | null>(null);
  const [managersError, setManagersError] = useState("");
  const [managersSavedMsg, setManagersSavedMsg] = useState("");
  const [addManagerOpen, setAddManagerOpen] = useState(false);
  const [managerSearch, setManagerSearch] = useState("");

  // Verification & badges
  const [verified, setVerified] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [compBadges, setCompBadges] = useState<
    CompetitionBadgeStatus[] | "loading" | "error" | null
  >(null);

  const loadComp = useCallback(async () => {
    if (!Number.isInteger(year)) return;
    setLoading(true);
    setCompError("");
    const [statsRes, lookupRes] = await Promise.all([
      adminFetch(`/admin/seasons/${year}/competition-stats`),
      adminFetch("/admin/lookup"),
    ]);
    if (!statsRes.ok) {
      setCompError("Falha ao carregar resumo");
      setLoading(false);
      return;
    }
    const data = await statsRes.json();
    const rows = (data.data ?? []) as CompStat[];
    setStats(rows);
    setDrafts(draftsFromComp(rows));
    if (lookupRes.ok) {
      const lookup = await lookupRes.json();
      setCompetitions(lookup.competitions ?? []);
    }
    setLoading(false);
  }, [year]);

  const loadRoster = useCallback(async () => {
    if (!Number.isInteger(year)) return;
    setRosterLoading(true);
    setRosterError("");
    const [rosterRes, playersRes] = await Promise.all([
      adminFetch(`/admin/seasons/${year}/players`),
      adminFetch("/admin/players"),
    ]);
    if (!rosterRes.ok) {
      setRosterError("Falha ao carregar elenco");
      setRosterLoading(false);
      return;
    }
    const data = await rosterRes.json();
    const rows = (data.data ?? []) as RosterRow[];
    setRoster(rows);
    setRosterDrafts(draftsFromRoster(rows));
    if (playersRes.ok) {
      const players = (await playersRes.json()) as PlayerOption[];
      setAllPlayers(players);
    }
    setRosterLoading(false);
  }, [year]);

  const loadManagers = useCallback(async () => {
    if (!Number.isInteger(year)) return;
    setManagersLoading(true);
    setManagersError("");
    const [mgrRes, listRes] = await Promise.all([
      adminFetch(`/admin/seasons/${year}/managers`),
      adminFetch("/admin/managers"),
    ]);
    if (!mgrRes.ok) {
      setManagersError("Falha ao carregar técnicos");
      setManagersLoading(false);
      return;
    }
    const data = await mgrRes.json();
    const rows = (data.data ?? []) as ManagerRow[];
    setManagers(rows);
    setManagerDrafts(draftsFromManagers(rows));
    if (listRes.ok) {
      const list = (await listRes.json()) as ManagerOption[];
      setAllManagers(list);
    }
    setManagersLoading(false);
  }, [year]);

  const loadVerification = useCallback(async () => {
    if (!Number.isInteger(year)) return;
    const r = await adminFetch("/admin/seasons");
    if (!r.ok) return;
    const rows = (await r.json()) as {
      year: number;
      statsFullyVerified: boolean;
      statsVerifiedAt: string | null;
    }[];
    const row = rows.find((s) => s.year === year);
    if (row) {
      setVerified(row.statsFullyVerified);
      setVerifiedAt(row.statsVerifiedAt);
    }
  }, [year]);

  const loadCompetitionBadges = useCallback(async () => {
    if (!Number.isInteger(year)) return;
    setCompBadges("loading");
    const r = await adminFetch(`/admin/seasons/${year}/competition-badges`);
    if (!r.ok) {
      setCompBadges("error");
      return;
    }
    const data = await r.json();
    setCompBadges((data.details ?? []) as CompetitionBadgeStatus[]);
  }, [year]);

  useEffect(() => {
    loadComp();
    loadRoster();
    loadManagers();
    loadVerification();
    loadCompetitionBadges();
  }, [loadComp, loadRoster, loadManagers, loadVerification, loadCompetitionBadges]);

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

  const rosterDirty = useMemo(() => {
    return roster.some((r) => {
      const d = rosterDrafts[r.id];
      if (!d) return false;
      const shirt = d.shirtNumber.trim() === "" ? null : parseInt(d.shirtNumber, 10);
      return (
        (shirt ?? null) !== (r.shirtNumber ?? null) ||
        d.appearances !== String(r.appearances) ||
        d.goals !== String(r.goals) ||
        d.assists !== String(r.assists)
      );
    });
  }, [roster, rosterDrafts]);

  const managersDirty = useMemo(() => {
    return managers.some((m) => {
      const d = managerDrafts[m.id];
      if (!d) return false;
      return (
        d.games !== String(m.games) ||
        d.wins !== String(m.wins) ||
        d.draws !== String(m.draws) ||
        d.losses !== String(m.losses) ||
        d.goalsFor !== String(m.goalsFor) ||
        d.goalsAgainst !== String(m.goalsAgainst)
      );
    });
  }, [managers, managerDrafts]);

  const rosterSorted = useMemo(
    () =>
      [...roster].sort((a, b) =>
        compareByPositionGroupThenName(
          { name: a.playerName, position: a.position },
          { name: b.playerName, position: b.position },
        ),
      ),
    [roster],
  );

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

  function updateDraft(id: number, field: keyof CompDraft, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setCompSavedMsg("");
  }

  function updateRosterDraft(id: number, field: keyof RosterDraft, value: string) {
    setRosterDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    setRosterSavedMsg("");
  }

  function updateManagerDraft(id: number, field: keyof ManagerDraft, value: string) {
    setManagerDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    setManagersSavedMsg("");
  }

  async function saveBulk() {
    setSaving(true);
    setCompError("");
    setCompSavedMsg("");
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
      setCompError((data as { error?: string }).error ?? "Erro ao salvar");
      setSaving(false);
      return;
    }
    const rows = data as CompStat[];
    setStats(rows);
    setDrafts(draftsFromComp(rows));
    setCompSavedMsg("Resumo salvo (origem: manual)");
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
    setCompError("");
    setCompSavedMsg("");
    const r = await adminFetch(
      `/admin/seasons/${year}/recalculate-competition-stats`,
      { method: "POST" },
    );
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setCompError((data as { error?: string }).error ?? "Erro ao recalcular");
      setRecalculating(false);
      return;
    }
    const rows = (data.data ?? []) as CompStat[];
    setStats(rows);
    setDrafts(draftsFromComp(rows));
    setCompSavedMsg(
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
      setCompError((data as { error?: string }).error ?? "Erro ao excluir");
      return;
    }
    await loadComp();
  }

  async function addCompetition() {
    const competitionId = parseInt(addCompetitionId, 10);
    if (!Number.isInteger(competitionId)) {
      setCompError("Selecione uma competição");
      return;
    }
    setCompError("");
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
      setCompError((data as { error?: string }).error ?? "Erro ao adicionar");
      return;
    }
    setAddOpen(false);
    setAddCompetitionId("");
    await loadComp();
  }

  async function saveRosterBulk() {
    setRosterSaving(true);
    setRosterError("");
    setRosterSavedMsg("");
    const payload = roster.map((r) => {
      const d = rosterDrafts[r.id];
      const shirtRaw = d.shirtNumber.trim();
      return {
        id: r.id,
        appearances: parseInt(d.appearances, 10) || 0,
        goals: parseInt(d.goals, 10) || 0,
        assists: parseInt(d.assists, 10) || 0,
        shirtNumber: shirtRaw === "" ? null : parseInt(shirtRaw, 10),
      };
    });
    const r = await adminFetch(`/admin/seasons/${year}/players/bulk`, {
      method: "PUT",
      body: JSON.stringify({ stats: payload }),
    });
    const data = await r.json().catch(() => ([]));
    if (!r.ok) {
      setRosterError((data as { error?: string }).error ?? "Erro ao salvar elenco");
      setRosterSaving(false);
      return;
    }
    const rows = data as RosterRow[];
    setRoster(rows);
    setRosterDrafts(draftsFromRoster(rows));
    setRosterSavedMsg("Elenco salvo");
    setRosterSaving(false);
  }

  async function addPlayer(playerId: number) {
    setRosterError("");
    const r = await adminFetch(`/admin/seasons/${year}/players`, {
      method: "POST",
      body: JSON.stringify({
        playerId,
        appearances: 0,
        goals: 0,
        assists: 0,
        shirtNumber: null,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setRosterError((data as { error?: string }).error ?? "Erro ao adicionar jogador");
      return;
    }
    setAddPlayerOpen(false);
    setPlayerSearch("");
    await loadRoster();
  }

  async function deleteRosterRow(id: number, name: string) {
    if (!confirm(`Remover ${name} do elenco de ${season}?`)) return;
    const r = await adminFetch(`/admin/player-stats/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      setRosterError((data as { error?: string }).error ?? "Erro ao excluir");
      return;
    }
    await loadRoster();
  }

  async function saveManagersBulk() {
    setManagersSaving(true);
    setManagersError("");
    setManagersSavedMsg("");
    const payload = managers.map((m) => {
      const d = managerDrafts[m.id];
      return {
        id: m.id,
        games: parseInt(d.games, 10) || 0,
        wins: parseInt(d.wins, 10) || 0,
        draws: parseInt(d.draws, 10) || 0,
        losses: parseInt(d.losses, 10) || 0,
        goalsFor: parseInt(d.goalsFor, 10) || 0,
        goalsAgainst: parseInt(d.goalsAgainst, 10) || 0,
      };
    });
    const r = await adminFetch(`/admin/seasons/${year}/managers/bulk`, {
      method: "PUT",
      body: JSON.stringify({ stats: payload }),
    });
    const data = await r.json().catch(() => ([]));
    if (!r.ok) {
      setManagersError((data as { error?: string }).error ?? "Erro ao salvar técnicos");
      setManagersSaving(false);
      return;
    }
    const rows = data as ManagerRow[];
    setManagers(rows);
    setManagerDrafts(draftsFromManagers(rows));
    setManagersSavedMsg("Técnicos salvos (origem: manual)");
    setManagersSaving(false);
  }

  async function addManager(managerId: number) {
    setManagersError("");
    const r = await adminFetch(`/admin/seasons/${year}/managers`, {
      method: "POST",
      body: JSON.stringify({
        managerId,
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setManagersError((data as { error?: string }).error ?? "Erro ao vincular técnico");
      return;
    }
    setAddManagerOpen(false);
    setManagerSearch("");
    await loadManagers();
  }

  async function deleteManagerRow(id: number, name: string) {
    if (!confirm(`Remover ${name} da temporada ${season}?`)) return;
    const r = await adminFetch(`/admin/manager-stats/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      setManagersError((data as { error?: string }).error ?? "Erro ao excluir");
      return;
    }
    await loadManagers();
  }

  async function recalculateManager(managerId: number, name: string) {
    if (
      !confirm(
        `Recalcular temporadas de ${name} a partir das partidas? Linhas manuais são preservadas.`,
      )
    ) {
      return;
    }
    setManagerRecalcId(managerId);
    setManagersError("");
    setManagersSavedMsg("");
    const r = await adminFetch(`/admin/managers/${managerId}/recalculate-stats`, {
      method: "POST",
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setManagersError((data as { error?: string }).error ?? "Erro ao recalcular");
      setManagerRecalcId(null);
      return;
    }
    await loadManagers();
    setManagersSavedMsg(
      `${name}: recalculado (${data.upserted ?? 0} atualizada(s), ${data.preservedManual ?? 0} manual(is) preservada(s))`,
    );
    setManagerRecalcId(null);
  }

  async function setSeasonVerified(next: boolean) {
    setVerifyBusy(true);
    setVerifyError("");
    setVerifyMessage("");
    const r = await adminFetch(`/admin/seasons/${year}/verification`, {
      method: "PUT",
      body: JSON.stringify({ verified: next }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setVerifyError((data as { error?: string }).error ?? "Erro ao atualizar");
      setVerifyBusy(false);
      return;
    }
    if (next) {
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
      setVerifyMessage(
        `Verificada. Badges auto: ${b?.created ?? 0}` +
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
        setCompBadges(b.competition.details);
      } else {
        await loadCompetitionBadges();
      }
    } else {
      const cleared =
        (data as { badges?: { cleared?: number } }).badges?.cleared ?? 0;
      setVerifyMessage(`Verificação removida. Badges auto apagados: ${cleared}`);
      await loadCompetitionBadges();
    }
    await loadVerification();
    setVerifyBusy(false);
  }

  async function recalculateBadges() {
    setVerifyBusy(true);
    setVerifyError("");
    setVerifyMessage("");
    const r = await adminFetch(`/admin/seasons/${year}/recalculate-badges`, {
      method: "POST",
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setVerifyError((data as { error?: string }).error ?? "Erro ao recalcular");
      setVerifyBusy(false);
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
    setVerifyMessage(
      `Recalculado: ${d.created ?? 0} badges` +
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
      setCompBadges(d.competition.details);
    } else {
      await loadCompetitionBadges();
    }
    setVerifyBusy(false);
  }

  function renderCompetitionBadgesPanel() {
    if (compBadges === "loading" || compBadges == null) {
      return <p className="text-xs text-gray-400">Carregando competições…</p>;
    }
    if (compBadges === "error") {
      return (
        <p className="text-xs text-red-600">
          Erro ao carregar status.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => loadCompetitionBadges()}
          >
            Tentar de novo
          </button>
        </p>
      );
    }
    if (compBadges.length === 0) {
      return (
        <p className="text-xs text-gray-400">
          Nenhuma competição (não amistoso/W.O.) nesta temporada.
        </p>
      );
    }
    return (
      <ul className="space-y-1.5">
        {compBadges.map((c) => {
          const incomplete = c.matchCount - c.completeCount;
          return (
            <li
              key={c.competitionId}
              className="flex flex-wrap items-baseline justify-between gap-2 text-xs bg-gray-50 border rounded px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <span className="font-medium text-gray-900">{c.competitionName}</span>
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

  const usedCompetitionIds = new Set(stats.map((s) => s.competitionId));
  const availableCompetitions = competitions.filter(
    (c) => !usedCompetitionIds.has(c.id),
  );
  const usedPlayerIds = new Set(roster.map((r) => r.playerId));
  const availablePlayers = allPlayers
    .filter((p) => !usedPlayerIds.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.position ?? null,
    }));
  const usedManagerIds = new Set(managers.map((m) => m.managerId));
  const availableManagers = allManagers
    .filter((m) => !usedManagerIds.has(m.id))
    .map((m) => ({ id: m.id, name: m.name }));

  if (!Number.isInteger(year) || year < 1900) {
    return <p className="text-sm text-red-600">Ano inválido</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/temporadas"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#1B3A6B] mb-3"
        >
          <ChevronLeft size={13} /> Temporadas
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Temporada {season}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Verificação, badges, resumo, elenco e técnicos desta temporada.
        </p>
      </div>

      {/* ── Verificação & Badges ── */}
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Verificação & Badges
          </h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={verifyBusy || !verified}
            onClick={recalculateBadges}
            className="h-8"
          >
            <RefreshCw size={13} className={`mr-1 ${verifyBusy ? "animate-spin" : ""}`} />
            Recalcular badges
          </Button>
        </div>

        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                disabled={verifyBusy}
                onChange={(e) => setSeasonVerified(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span
                className={
                  verified ? "text-sm font-medium text-emerald-700" : "text-sm text-gray-600"
                }
              >
                Stats completamente verificadas
              </span>
            </label>
            {verifiedAt && (
              <span className="text-xs text-gray-400">
                Verificado em {new Date(verifiedAt).toLocaleString("pt-BR")}
              </span>
            )}
          </div>

          {verifyMessage && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              {verifyMessage}
            </p>
          )}
          {verifyError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {verifyError}
            </p>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Artilheiro por competição
              </span>
              <button
                type="button"
                className="text-xs text-[#1B3A6B] hover:underline"
                onClick={() => loadCompetitionBadges()}
              >
                Atualizar status
              </button>
            </div>
            {renderCompetitionBadgesPanel()}
          </div>
        </div>
      </section>

      {/* ── Resumo por competição ── */}
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Resumo por competição
          </h2>
          <p className="text-xs text-gray-400 w-full order-last basis-full">
            Classif. <span className="font-mono">1º</span> = título (página pública /titulos).
          </p>
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
          <div className="bg-white border rounded-lg p-3 mb-3 flex flex-wrap items-end gap-2">
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
                      const d = drafts[stat.id] ?? draftsFromComp([stat])[stat.id];
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
                              placeholder="1º"
                              title='Use exatamente "1º" para contar como título'
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
            {compError && <p className="text-sm text-red-600 mt-2">{compError}</p>}
            {compSavedMsg && (
              <p className="text-sm text-green-700 mt-2">{compSavedMsg}</p>
            )}

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
                      setDrafts(draftsFromComp(stats));
                      setCompSavedMsg("");
                      setCompError("");
                    }}
                  >
                    Descartar
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Elenco ── */}
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Elenco
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {roster.length} jogador{roster.length === 1 ? "" : "es"} · camisa fixa da
              temporada (independente da ficha de cada partida)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddPlayerOpen((v) => !v)}
            className="text-xs text-[#1B3A6B] font-medium hover:underline flex items-center gap-1"
          >
            <Plus size={11} /> Adicionar jogador
          </button>
        </div>

        {addPlayerOpen && (
          <div className="bg-white border rounded-lg p-3 mb-3 max-w-md">
            <AdminEntitySearch
              items={availablePlayers}
              placeholder="Buscar jogador para adicionar…"
              value={playerSearch}
              onValueChange={setPlayerSearch}
              onSelect={(item) => addPlayer(item.id)}
            />
          </div>
        )}

        {rosterLoading ? (
          <p className="text-sm text-gray-400">Carregando elenco...</p>
        ) : (
          <div className="bg-white border rounded-lg p-4">
            {roster.length === 0 ? (
              <p className="text-sm text-gray-400">
                Nenhum jogador nesta temporada. Adicione pela busca acima.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[36rem]">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b">
                      <th className="text-left py-1.5">Jogador</th>
                      <th className="text-left py-1.5 w-12">Pos</th>
                      <th className="text-right py-1.5 w-16">Camisa</th>
                      <th className="text-right py-1.5 w-16">J</th>
                      <th className="text-right py-1.5 w-16">G</th>
                      <th className="text-right py-1.5 w-16">A</th>
                      <th className="py-1.5 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {rosterSorted.map((row) => {
                      const d =
                        rosterDrafts[row.id] ?? draftsFromRoster([row])[row.id];
                      return (
                        <tr key={row.id} className="border-b border-gray-100">
                          <td className="py-2 pr-2">
                            <Link
                              href={`/admin/jogadores/${row.playerId}`}
                              className="font-medium text-[#1B3A6B] hover:underline"
                            >
                              {row.playerName}
                            </Link>
                          </td>
                          <td className="py-2 pr-2 text-xs text-gray-500">
                            {shortPositionCode(row.position)}
                          </td>
                          {(
                            [
                              "shirtNumber",
                              "appearances",
                              "goals",
                              "assists",
                            ] as const
                          ).map((field) => (
                            <td key={field} className="py-1.5 text-right">
                              <Input
                                type="number"
                                min={0}
                                value={d[field]}
                                onChange={(e) =>
                                  updateRosterDraft(row.id, field, e.target.value)
                                }
                                placeholder={field === "shirtNumber" ? "—" : undefined}
                                className="h-8 w-[3.75rem] ml-auto text-right px-1.5"
                              />
                            </td>
                          ))}
                          <td className="py-2">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  deleteRosterRow(row.id, row.playerName)
                                }
                                className="p-0.5 text-gray-400 hover:text-red-600"
                                title="Remover do elenco"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {rosterDirty && (
              <p className="text-xs text-amber-700 mt-2">Alterações não salvas no elenco</p>
            )}
            {rosterError && (
              <p className="text-sm text-red-600 mt-2">{rosterError}</p>
            )}
            {rosterSavedMsg && (
              <p className="text-sm text-green-700 mt-2">{rosterSavedMsg}</p>
            )}

            {roster.length > 0 && (
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  className="bg-[#1B3A6B]"
                  disabled={!rosterDirty || rosterSaving}
                  onClick={saveRosterBulk}
                >
                  {rosterSaving ? "Salvando…" : "Salvar elenco"}
                </Button>
                {rosterDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={rosterSaving}
                    onClick={() => {
                      setRosterDrafts(draftsFromRoster(roster));
                      setRosterSavedMsg("");
                      setRosterError("");
                    }}
                  >
                    Descartar
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Treinadores ── */}
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Treinadores
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {managers.length} técnico{managers.length === 1 ? "" : "s"} · edição marca
              origem manual; recalcular preserva manuais
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddManagerOpen((v) => !v)}
            className="text-xs text-[#1B3A6B] font-medium hover:underline flex items-center gap-1"
          >
            <Plus size={11} /> Vincular técnico
          </button>
        </div>

        {addManagerOpen && (
          <div className="bg-white border rounded-lg p-3 mb-3 max-w-md">
            <AdminEntitySearch
              items={availableManagers}
              placeholder="Buscar técnico para vincular…"
              value={managerSearch}
              onValueChange={setManagerSearch}
              onSelect={(item) => addManager(item.id)}
            />
          </div>
        )}

        {managersLoading ? (
          <p className="text-sm text-gray-400">Carregando técnicos...</p>
        ) : (
          <div className="bg-white border rounded-lg p-4">
            {managers.length === 0 ? (
              <p className="text-sm text-gray-400">
                Nenhum técnico nesta temporada. Vincule pela busca acima.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[40rem]">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b">
                      <th className="text-left py-1.5">Técnico</th>
                      <th className="text-right py-1.5 w-14">J</th>
                      <th className="text-right py-1.5 w-14">V</th>
                      <th className="text-right py-1.5 w-14">E</th>
                      <th className="text-right py-1.5 w-14">D</th>
                      <th className="text-right py-1.5 w-14">GP</th>
                      <th className="text-right py-1.5 w-14">GC</th>
                      <th className="text-left py-1.5 pl-2">Origem</th>
                      <th className="py-1.5 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((row) => {
                      const d =
                        managerDrafts[row.id] ?? draftsFromManagers([row])[row.id];
                      const busy = managerRecalcId === row.managerId;
                      return (
                        <tr key={row.id} className="border-b border-gray-100">
                          <td className="py-2 pr-2">
                            <Link
                              href={`/admin/tecnicos/${row.managerId}`}
                              className="font-medium text-[#1B3A6B] hover:underline"
                            >
                              {row.managerName}
                            </Link>
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
                                  updateManagerDraft(row.id, field, e.target.value)
                                }
                                className="h-8 w-[3.5rem] ml-auto text-right px-1.5"
                              />
                            </td>
                          ))}
                          <td className="py-2 pl-2 text-xs text-gray-500 whitespace-nowrap">
                            {sourceLabel(row.statsSource, row.statsRecalculatedAt)}
                          </td>
                          <td className="py-2">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                disabled={busy || managersDirty}
                                title={
                                  managersDirty
                                    ? "Salve ou descarte antes de recalcular"
                                    : "Recalcular a partir das partidas"
                                }
                                onClick={() =>
                                  recalculateManager(row.managerId, row.managerName)
                                }
                                className="p-0.5 text-gray-400 hover:text-[#1B3A6B] disabled:opacity-40"
                              >
                                <RefreshCw
                                  size={12}
                                  className={busy ? "animate-spin" : ""}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  deleteManagerRow(row.id, row.managerName)
                                }
                                className="p-0.5 text-gray-400 hover:text-red-600"
                                title="Remover da temporada"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {managersDirty && (
              <p className="text-xs text-amber-700 mt-2">
                Alterações não salvas nos técnicos
              </p>
            )}
            {managersError && (
              <p className="text-sm text-red-600 mt-2">{managersError}</p>
            )}
            {managersSavedMsg && (
              <p className="text-sm text-green-700 mt-2">{managersSavedMsg}</p>
            )}

            {managers.length > 0 && (
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  className="bg-[#1B3A6B]"
                  disabled={!managersDirty || managersSaving}
                  onClick={saveManagersBulk}
                >
                  {managersSaving ? "Salvando…" : "Salvar técnicos"}
                </Button>
                {managersDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={managersSaving}
                    onClick={() => {
                      setManagerDrafts(draftsFromManagers(managers));
                      setManagersSavedMsg("");
                      setManagersError("");
                    }}
                  >
                    Descartar
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
