import { Link, useParams } from "wouter";
import { useGetPlayer, getGetPlayerQueryKey } from "@workspace/api-client-react";
import type { PlayerSheetMatch } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { VerificationCard } from "@/components/VerificationCard";
import { PlayerMatchRows } from "@/components/PlayerMatchRows";
import { StarRating } from "@/components/StarRating";
import { EntityComments } from "@/components/EntityComments";
import { EntityBadges } from "@/components/EntityBadges";
import type { ReactNode } from "react";

type PlayerProfile = {
  id: number;
  name: string;
  fullName?: string | null;
  position?: string | null;
  nationality?: string | null;
  nationalityFlag?: string | null;
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
  seasonStats: {
    season: string;
    appearances: number;
    goals: number;
    assists?: number | null;
  }[];
  recentMatches?: PlayerSheetMatch[];
  badges?: {
    id: number;
    label: string;
    source?: string;
    autoKind?: string | null;
    seasonYear?: number | null;
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

function birthPlace(p: PlayerProfile): string | null {
  const parts = [p.birthCity, p.birthState, p.birthCountry]
    .map((x) => x?.trim())
    .filter(Boolean) as string[];
  return parts.length ? parts.join(", ") : null;
}

function PersonalRow({ label, value }: { label: string; value: string }) {
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

  const avgGoals =
    player.totalAppearances > 0
      ? (player.totalGoals / player.totalAppearances).toFixed(2)
      : "–";

  const flag = player.nationalityFlag;
  const isForeign = !!player.nationality && player.nationality !== "Brasil";
  const age = player.isDeceased ? null : calcAge(player.birthDate, player.birthYear);
  const showFullName =
    !!player.fullName?.trim() &&
    player.fullName.trim().toLowerCase() !== player.name.trim().toLowerCase();
  const birthDateLabel = fmtBirthDate(player.birthDate);
  const place = birthPlace(player);
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

  const personalRows: { label: string; value: string }[] = [];
  if (showFullName) personalRows.push({ label: "Nome completo", value: player.fullName!.trim() });
  if (birthDateLabel) personalRows.push({ label: "Data de nascimento", value: birthDateLabel });
  else if (player.birthYear != null) {
    personalRows.push({ label: "Ano de nascimento", value: String(player.birthYear) });
  }
  if (place) personalRows.push({ label: "Local de nascimento", value: place });
  if (player.position) personalRows.push({ label: "Posição", value: player.position });
  if ((player.secondaryPositions?.length ?? 0) > 0) {
    personalRows.push({
      label: "Também joga",
      value: player.secondaryPositions!.join(", "),
    });
  }
  if (foot) personalRows.push({ label: "Pé preferencial", value: foot });
  if (heightWeight) personalRows.push({ label: "Altura / Peso", value: heightWeight });

  const latestSeason = player.seasonStats?.[0] ?? null;

  const metaParts: ReactNode[] = [];
  if (player.nationality) {
    metaParts.push(
      <span key="nat" className="inline-flex items-center gap-1">
        {isForeign && flag && <span className="text-base leading-none">{flag}</span>}
        {isForeign ? (
          <Link
            href={`/jogadores/estrangeiros/${encodeURIComponent(player.nationality)}`}
            className="hover:text-primary hover:underline"
          >
            {player.nationality}
          </Link>
        ) : (
          <span>{player.nationality}</span>
        )}
      </span>,
    );
  }
  if (age != null) metaParts.push(<span key="age">{age} anos</span>);
  if (player.position) metaParts.push(<span key="pos">{player.position}</span>);

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/jogadores">
        <span
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          data-testid="link-back"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Jogadores
        </span>
      </Link>

      {/* Header + Dados Pessoais */}
      <div className="border-b pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isForeign && flag && <span className="text-3xl leading-none">{flag}</span>}
            <h1 className="text-2xl font-bold" data-testid="heading-player-name">
              {player.name}
            </h1>
            <VerificationCard
              status={player.verificationStatus}
              verifiedBy={player.verifiedBy}
              verifiedAt={player.verifiedAt}
            />
          </div>
          <EntityBadges badges={player.badges} />
          {metaParts.length > 0 && (
            <p className="mt-1.5 text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
              {metaParts.map((part, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="text-muted-foreground/50">·</span>}
                  {part}
                </span>
              ))}
            </p>
          )}
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

      {/* Stat bar — unchanged */}
      <div
        className="grid grid-cols-4 gap-px bg-border rounded overflow-hidden"
        data-testid="player-stat-bar"
      >
        {[
          { label: "Partidas", value: player.totalAppearances, highlight: true },
          { label: "Gols", value: player.totalGoals },
          { label: "Assistências", value: player.totalAssists ?? "–" },
          { label: "Gols/Jogo", value: avgGoals },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="bg-background p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${highlight ? "text-primary" : ""}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Latest season compact summary */}
      {latestSeason && (
        <div data-testid="player-latest-season">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Temporada{" "}
            <Link
              href={`/temporadas/${latestSeason.season}`}
              className="hover:text-primary hover:underline normal-case font-semibold tracking-normal"
            >
              {latestSeason.season}
            </Link>
          </h2>
          <p className="text-sm">
            {latestSeason.appearances} Jogos · {latestSeason.goals} Gols ·{" "}
            {latestSeason.assists ?? 0} Assistências
          </p>
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
          <PlayerMatchRows matches={player.recentMatches!} />
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
                <TableHead className="py-2 text-right">Gols</TableHead>
                <TableHead className="py-2 text-right">Assistências</TableHead>
                <TableHead className="py-2 text-right">Média</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {player.seasonStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
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
                    <TableCell className="py-2 text-right font-medium">{stat.goals}</TableCell>
                    <TableCell className="py-2 text-right">{stat.assists ?? "–"}</TableCell>
                    <TableCell className="py-2 text-right text-muted-foreground text-xs">
                      {stat.appearances > 0
                        ? (stat.goals / stat.appearances).toFixed(2)
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
    </div>
  );
}
