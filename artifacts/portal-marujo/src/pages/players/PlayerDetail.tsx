import { Link, useParams } from "wouter";
import { useGetPlayer, getGetPlayerQueryKey } from "@workspace/api-client-react";
import type { PlayerSheetMatch } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { VerificationCard } from "@/components/VerificationCard";
import { PlayerMatchHistoryTable } from "@/components/PlayerMatchHistoryTable";
import { StarRating } from "@/components/StarRating";
import { EntityComments } from "@/components/EntityComments";
import { EntitySuggestionForm } from "@/components/EntitySuggestionForm";
import { EntityBadges } from "@/components/EntityBadges";
import { PlayerFlag } from "@/components/PlayerFlag";
import { PlayerPhoto } from "@/components/PlayerPhoto";
import { OpponentHistoryLink } from "@/components/MatchNavLinks";
import { ShareButton } from "@/components/ShareButton";
import { OpponentCountList } from "@/components/OpponentCountList";
import { formatDateBr } from "@/lib/utils";
import { lineupPositionSlot } from "@/lib/position-groups";
import type { ReactNode } from "react";

type PlayerProfile = {
  id: number;
  name: string;
  fullName?: string | null;
  position?: string | null;
  nationality?: string | null;
  nationalityFlag?: string | null;
  photoUrl?: string | null;
  birthYear?: number | null;
  birthDate?: string | null;
  birthCity?: string | null;
  birthState?: string | null;
  birthCountry?: string | null;
  preferredFoot?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  isDeceased?: boolean;
  secondaryPositions?: string[] | null;
  verificationStatus?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  totalAppearances: number;
  totalGoals: number;
  totalAssists?: number | null;
  totalPenaltiesMissed?: number;
  totalPenaltiesSaved?: number;
  totalYellowCards?: number;
  totalRedCards?: number;
  totalOwnGoals?: number;
  totalGoalsConceded?: number;
  titleCount?: number;
  titles?: { season: string; competitionId: number; competitionName: string }[];
  seasonStats: {
    season: string;
    appearances: number;
    goals: number;
    assists?: number | null;
    penaltiesMissed?: number;
    penaltiesSaved?: number;
    yellowCards?: number;
    redCards?: number;
    ownGoals?: number;
    goalsConceded?: number;
  }[];
  recentMatches?: PlayerSheetMatch[];
  badges?: {
    id: number;
    label: string;
    source?: string;
    autoKind?: string | null;
    seasonYear?: number | null;
  }[];
  linkedManager?: { id: number; name: string } | null;
  mostFacedOpponents?: {
    opponentId: number;
    opponentName: string;
    logoUrl?: string | null;
    value: number;
  }[];
  mostGoalsVsOpponents?: {
    opponentId: number;
    opponentName: string;
    logoUrl?: string | null;
    value: number;
  }[];
  transfers?: {
    id: number;
    direction: "in" | "out";
    club: string | null;
    opponentId?: number | null;
    clubLogoUrl?: string | null;
    transferDate: string | null;
    season: string;
    transferType: string | null;
    notes: string | null;
  }[];
};

function calcAge(birthDate?: string | null, birthYear?: number | null): number | null {
  const now = new Date();
  if (birthDate) {
    const d = new Date(birthDate.includes("T") ? birthDate : birthDate + "T12:00:00");
    if (Number.isNaN(d.getTime())) return null;
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age >= 0 ? age : null;
  }
  if (birthYear != null && birthYear > 1900) {
    return Math.max(0, now.getFullYear() - birthYear);
  }
  return null;
}

function fmtBirthDate(birthDate?: string | null): string | null {
  if (!birthDate) return null;
  const d = new Date(birthDate.includes("T") ? birthDate : birthDate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR");
}

function footLabel(foot?: string | null): string | null {
  if (!foot) return null;
  if (foot === "destro") return "Destro";
  if (foot === "canhoto") return "Canhoto";
  if (foot === "ambidestro") return "Ambidestro";
  return foot;
}

function birthPlaceParts(p: PlayerProfile): {
  locality: string | null;
  country: string | null;
} {
  const locality = [p.birthCity, p.birthState]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join(", ");
  const country = p.birthCountry?.trim() || null;
  return { locality: locality || null, country };
}

function isGoalkeeper(p: PlayerProfile): boolean {
  if (lineupPositionSlot(p.position) === "Goleiro") return true;
  return (p.secondaryPositions ?? []).some((x) => lineupPositionSlot(x) === "Goleiro");
}

function PersonalRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground shrink-0 min-w-[7.5rem]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function PlayerDetail() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);

  const { data: raw, isLoading, isError } = useGetPlayer(id, {
    query: { enabled: !!id, queryKey: getGetPlayerQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !raw) {
    return <div className="text-center p-8 text-destructive">Jogador não encontrado.</div>;
  }

  const player = raw as unknown as PlayerProfile;

  const isGk = isGoalkeeper(player);
  const showGoalsCol = !isGk || (player.totalGoals ?? 0) > 0;
  const showAssistsCol = !isGk || (player.totalAssists ?? 0) > 0;
  const avgGoals =
    player.totalAppearances > 0
      ? (player.totalGoals / player.totalAppearances).toFixed(2)
      : "–";
  const avgGoalsConceded =
    player.totalAppearances > 0
      ? ((player.totalGoalsConceded ?? 0) / player.totalAppearances).toFixed(2)
      : "–";
  const showPenaltiesMissed =
    (player.totalPenaltiesMissed ?? 0) > 0 ||
    player.seasonStats.some((s) => (s.penaltiesMissed ?? 0) > 0);
  const showPenaltiesSaved =
    isGk ||
    (player.totalPenaltiesSaved ?? 0) > 0 ||
    player.seasonStats.some((s) => (s.penaltiesSaved ?? 0) > 0);
  const showYellowCards =
    (player.totalYellowCards ?? 0) > 0 ||
    player.seasonStats.some((s) => (s.yellowCards ?? 0) > 0);
  const showRedCards =
    (player.totalRedCards ?? 0) > 0 ||
    player.seasonStats.some((s) => (s.redCards ?? 0) > 0);
  const showOwnGoals =
    (player.totalOwnGoals ?? 0) > 0 ||
    player.seasonStats.some((s) => (s.ownGoals ?? 0) > 0);
  const showDisciplineCols = showYellowCards || showRedCards || showOwnGoals;

  const age = player.isDeceased ? null : calcAge(player.birthDate, player.birthYear);
  const showFullName =
    !!player.fullName?.trim() &&
    player.fullName.trim().toLowerCase() !== player.name.trim().toLowerCase();
  const birthDateLabel = fmtBirthDate(player.birthDate);
  const { locality, country: birthCountry } = birthPlaceParts(player);
  const foot = footLabel(player.preferredFoot);
  const height =
    player.heightCm != null && Number.isFinite(player.heightCm)
      ? `${player.heightCm} cm`
      : null;
  const weight =
    player.weightKg != null && Number.isFinite(player.weightKg)
      ? `${player.weightKg} kg`
      : null;
  const heightWeight = [height, weight].filter(Boolean).join(" / ") || null;

  const birthSuffix = player.isDeceased
    ? " (Falecido)"
    : age != null
      ? ` (${age} anos)`
      : "";

  const personalRows: { label: string; value: ReactNode }[] = [];
  if (showFullName) personalRows.push({ label: "Nome completo", value: player.fullName!.trim() });
  if (birthDateLabel) {
    personalRows.push({
      label: "Data de nascimento",
      value: `${birthDateLabel}${birthSuffix}`,
    });
  } else if (player.birthYear != null) {
    personalRows.push({
      label: "Ano de nascimento",
      value: `${player.birthYear}${birthSuffix}`,
    });
  }
  if (locality || birthCountry) {
    personalRows.push({
      label: "Local de nascimento",
      value: (
        <span className="inline-flex flex-wrap items-center gap-x-1">
          {locality ? <span>{locality}{birthCountry ? "," : ""}</span> : null}
          {birthCountry ? (
            <span className="inline-flex items-center gap-1">
              <PlayerFlag nationality={birthCountry} size="sm" />
              <span>{birthCountry}</span>
            </span>
          ) : null}
        </span>
      ),
    });
  }
  if (player.position) personalRows.push({ label: "Posição", value: player.position });
  if ((player.secondaryPositions?.length ?? 0) > 0) {
    personalRows.push({
      label: "Também joga",
      value: player.secondaryPositions!.join(", "),
    });
  }
  if (foot) personalRows.push({ label: "Pé preferencial", value: foot });
  if (heightWeight) personalRows.push({ label: "Altura / Peso", value: heightWeight });
  if (player.linkedManager) {
    personalRows.push({
      label: "Como técnico",
      value: (
        <Link
          href={`/tecnicos/${player.linkedManager.id}`}
          className="text-primary hover:underline"
        >
          {player.linkedManager.name}
        </Link>
      ),
    });
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <Link href="/jogadores">
        <span
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          data-testid="link-back"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Jogadores
        </span>
      </Link>

      {/* Header + Dados Pessoais */}
      <div className="border-b pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl">
        <div>
          <div className="flex items-start gap-3">
            <PlayerPhoto
              url={player.photoUrl}
              name={player.name}
              size="lg"
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold" data-testid="heading-player-name">
                  {player.name}
                </h1>
                {player.isDeceased && (
                  <span
                    className="text-muted-foreground text-lg leading-none"
                    title="Falecido"
                    aria-label="Falecido"
                    data-testid="badge-deceased"
                  >
                    †
                  </span>
                )}
                <ShareButton title={player.name} />
                <VerificationCard
                  status={player.verificationStatus}
                  verifiedBy={player.verifiedBy}
                  verifiedAt={player.verifiedAt}
                />
              </div>
              <EntityBadges badges={player.badges} />
            </div>
          </div>
        </div>

        {personalRows.length > 0 && (
          <div data-testid="player-personal-data">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Dados Pessoais
            </h2>
            <div className="space-y-1.5">
              {personalRows.map((r) => (
                <PersonalRow key={r.label} label={r.label} value={r.value} />
              ))}
            </div>
          </div>
        )}
      </div>

      <StarRating entityType="player" entityId={player.id} />

      {/* Stat bar — GKs swap zero gols/assists for gols sofridos + pênaltis def. */}
      <div
        className={`grid gap-px bg-border rounded overflow-hidden ${
          isGk
            ? showGoalsCol || showAssistsCol
              ? "grid-cols-3 sm:grid-cols-6 lg:grid-cols-7"
              : "grid-cols-2 sm:grid-cols-5"
            : showPenaltiesSaved
              ? "grid-cols-3 sm:grid-cols-6"
              : "grid-cols-5"
        }`}
        data-testid="player-stat-bar"
      >
        {[
          { label: "Partidas", value: player.totalAppearances, highlight: true },
          ...(isGk
            ? [
                {
                  label: "Gols sofridos",
                  value: player.totalGoalsConceded ?? 0,
                },
                {
                  label: "Pênaltis def.",
                  value: player.totalPenaltiesSaved ?? 0,
                  highlight: true,
                },
              ]
            : []),
          ...(showGoalsCol ? [{ label: "Gols", value: player.totalGoals }] : []),
          ...(showAssistsCol
            ? [{ label: "Assistências", value: player.totalAssists ?? "–" }]
            : []),
          ...(!isGk && showPenaltiesSaved
            ? [
                {
                  label: "Pênaltis def.",
                  value: player.totalPenaltiesSaved ?? 0,
                  highlight: true,
                },
              ]
            : []),
          isGk
            ? { label: "GS/Jogo", value: avgGoalsConceded }
            : { label: "Gols/Jogo", value: avgGoals },
          { label: "Títulos", value: player.titleCount ?? 0, highlight: true },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="bg-background p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${highlight ? "text-primary" : ""}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {(showPenaltiesMissed || showDisciplineCols) && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {showPenaltiesMissed && (
            <p>
              Pênaltis perdidos:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {player.totalPenaltiesMissed ?? 0}
              </span>
            </p>
          )}
          {showYellowCards && (
            <p>
              Cartões amarelos:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {player.totalYellowCards ?? 0}
              </span>
            </p>
          )}
          {showRedCards && (
            <p>
              Cartões vermelhos:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {player.totalRedCards ?? 0}
              </span>
            </p>
          )}
          {showOwnGoals && (
            <p>
              Gols contra:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {player.totalOwnGoals ?? 0}
              </span>
            </p>
          )}
        </div>
      )}

      {(player.titles?.length ?? 0) > 0 && (
        <div data-testid="player-titles">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Títulos
          </h2>
          <ul className="space-y-1 text-sm">
            {player.titles!.map((t) => (
              <li key={`${t.competitionId}-${t.season}`}>
                <Link
                  href={`/temporadas/${t.season}`}
                  className="font-medium tabular-nums hover:text-primary hover:underline"
                >
                  {t.season}
                </Link>
                <span className="text-muted-foreground"> · </span>
                <Link
                  href={`/competicoes/${t.competitionId}`}
                  className="hover:text-primary hover:underline"
                >
                  {t.competitionName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {((player.mostFacedOpponents?.length ?? 0) > 0 ||
        (player.mostGoalsVsOpponents?.length ?? 0) > 0) && (
        <div
          className="grid sm:grid-cols-2 gap-6"
          data-testid="player-opponent-stats"
        >
          <OpponentCountList
            title="Adversário que mais enfrentou"
            rows={player.mostFacedOpponents ?? []}
            valueLabel={(n) => `${n} ${n === 1 ? "jogo" : "jogos"}`}
            testId="player-most-faced"
          />
          <OpponentCountList
            title="Adversário que mais fez gol"
            rows={player.mostGoalsVsOpponents ?? []}
            valueLabel={(n) => `${n} ${n === 1 ? "gol" : "gols"}`}
            testId="player-most-goals-vs"
          />
        </div>
      )}

      {(player.transfers?.length ?? 0) > 0 && (
        <div data-testid="player-transfers">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Transferências
          </h2>
          <ul className="space-y-1.5 text-sm">
            {player.transfers!.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  className={`text-xs font-semibold uppercase ${
                    t.direction === "in" ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {t.direction === "in" ? "Chegada" : "Saída"}
                </span>
                <span className="tabular-nums text-muted-foreground">{t.season}</span>
                {t.club && (
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <span className="text-muted-foreground">
                      {t.direction === "in" ? "de" : "para"}
                    </span>
                    <OpponentHistoryLink
                      opponentId={t.opponentId}
                      name={t.club}
                      logoUrl={t.clubLogoUrl}
                      crestAfter={false}
                      crestFallback
                    />
                  </span>
                )}
                {t.transferType && (
                  <span className="text-xs text-muted-foreground">· {t.transferType}</span>
                )}
                {t.transferDate && (
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                    {formatDateBr(t.transferDate)}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/transferencias"
            className="text-xs text-primary hover:underline mt-2 inline-block"
          >
            Ver todas as transferências →
          </Link>
        </div>
      )}

      {/* Recent sheet matches — omitted when empty */}
      {(player.recentMatches?.length ?? 0) > 0 && (
        <div data-testid="player-recent-matches" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Jogos
            </h2>
            <Link
              href={`/jogadores/${player.id}/jogos`}
              className="text-xs text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <PlayerMatchHistoryTable matches={player.recentMatches!} />
        </div>
      )}

      {/* Season stats table — unchanged */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Estatísticas por Temporada
        </h2>
        <div className="border rounded">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="py-2">Temporada</TableHead>
                <TableHead className="py-2 text-right">Jogos</TableHead>
                {isGk && (
                  <TableHead className="py-2 text-right" title="Gols sofridos">
                    GS
                  </TableHead>
                )}
                {showGoalsCol && (
                  <TableHead className="py-2 text-right">Gols</TableHead>
                )}
                {showAssistsCol && (
                  <TableHead className="py-2 text-right">Assistências</TableHead>
                )}
                {showPenaltiesMissed && (
                  <TableHead className="py-2 text-right" title="Pênaltis perdidos">
                    Pên. perd.
                  </TableHead>
                )}
                {showPenaltiesSaved && (
                  <TableHead className="py-2 text-right" title="Pênaltis defendidos">
                    Pên. def.
                  </TableHead>
                )}
                {showYellowCards && (
                  <TableHead className="py-2 text-right" title="Cartões amarelos">
                    <span aria-label="Cartões amarelos">🟨</span>
                  </TableHead>
                )}
                {showRedCards && (
                  <TableHead className="py-2 text-right" title="Cartões vermelhos">
                    <span aria-label="Cartões vermelhos">🟥</span>
                  </TableHead>
                )}
                {showOwnGoals && (
                  <TableHead className="py-2 text-right" title="Gols contra">
                    GC
                  </TableHead>
                )}
                <TableHead className="py-2 text-right">
                  {isGk ? "GS/J" : "Média"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {player.seasonStats.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      3 +
                      (isGk ? 1 : 0) +
                      (showGoalsCol ? 1 : 0) +
                      (showAssistsCol ? 1 : 0) +
                      (showPenaltiesMissed ? 1 : 0) +
                      (showPenaltiesSaved ? 1 : 0) +
                      (showYellowCards ? 1 : 0) +
                      (showRedCards ? 1 : 0) +
                      (showOwnGoals ? 1 : 0)
                    }
                    className="h-16 text-center text-muted-foreground"
                  >
                    Sem estatísticas por temporada.
                  </TableCell>
                </TableRow>
              ) : (
                player.seasonStats.map((stat, idx) => (
                  <TableRow
                    key={`${stat.season}-${idx}`}
                    className="text-sm"
                    data-testid={`row-season-${stat.season}`}
                  >
                    <TableCell className="py-2 font-medium">
                      <Link
                        href={`/temporadas/${stat.season}`}
                        className="hover:text-primary hover:underline"
                      >
                        {stat.season}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-right">{stat.appearances}</TableCell>
                    {isGk && (
                      <TableCell className="py-2 text-right">
                        {stat.goalsConceded ?? 0}
                      </TableCell>
                    )}
                    {showGoalsCol && (
                      <TableCell className="py-2 text-right font-medium">{stat.goals}</TableCell>
                    )}
                    {showAssistsCol && (
                      <TableCell className="py-2 text-right">{stat.assists ?? "–"}</TableCell>
                    )}
                    {showPenaltiesMissed && (
                      <TableCell className="py-2 text-right">
                        {stat.penaltiesMissed ?? 0}
                      </TableCell>
                    )}
                    {showPenaltiesSaved && (
                      <TableCell className="py-2 text-right">
                        {stat.penaltiesSaved ?? 0}
                      </TableCell>
                    )}
                    {showYellowCards && (
                      <TableCell className="py-2 text-right">{stat.yellowCards ?? 0}</TableCell>
                    )}
                    {showRedCards && (
                      <TableCell className="py-2 text-right">{stat.redCards ?? 0}</TableCell>
                    )}
                    {showOwnGoals && (
                      <TableCell className="py-2 text-right">{stat.ownGoals ?? 0}</TableCell>
                    )}
                    <TableCell className="py-2 text-right text-muted-foreground text-xs">
                      {stat.appearances > 0
                        ? (
                            (isGk ? (stat.goalsConceded ?? 0) : stat.goals) /
                            stat.appearances
                          ).toFixed(2)
                        : "–"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <EntityComments entityType="player" entityId={player.id} />
      <EntitySuggestionForm entityType="player" entityId={player.id} />
    </div>
  );
}
