import { Link, useParams } from "wouter";
import { useGetManager, getGetManagerQueryKey } from "@workspace/api-client-react";
import type { ManagerMatch } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { EntityBadges } from "@/components/EntityBadges";
import { EntityComments } from "@/components/EntityComments";
import { EntitySuggestionForm } from "@/components/EntitySuggestionForm";
import { VerificationCard } from "@/components/VerificationCard";
import { PlayerFlag } from "@/components/PlayerFlag";
import { ShareButton } from "@/components/ShareButton";
import { EntityPhoto } from "@/components/EntityPhoto";
import { MatchRows } from "@/components/MatchRows";
import type { ReactNode } from "react";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return ((wins / total) * 100).toFixed(1) + "%";
}

function calcAge(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate.includes("T") ? birthDate : birthDate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
}

function fmtBirthDate(birthDate?: string | null): string | null {
  if (!birthDate) return null;
  const d = new Date(birthDate.includes("T") ? birthDate : birthDate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR");
}

function PersonalRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground shrink-0 min-w-[7.5rem]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

type ManagerProfile = {
  id: number;
  name: string;
  fullName?: string | null;
  nationality?: string | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  birthCity?: string | null;
  birthState?: string | null;
  birthCountry?: string | null;
  isDeceased?: boolean;
  startYear?: number | null;
  endYear?: number | null;
  verificationStatus?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winPercentage?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  seasonStats?: {
    year: string;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
  }[];
  recentMatches?: ManagerMatch[];
  badges?: { id: number; label: string; source?: string }[];
  titleCount?: number;
  titles?: { season: string; competitionId: number; competitionName: string }[];
  linkedPlayer?: { id: number; name: string } | null;
};

export default function ManagerDetail() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);

  const { data, isLoading, isError } = useGetManager(id, {
    query: { enabled: !!id, queryKey: getGetManagerQueryKey(id) },
  });
  const manager = data as ManagerProfile | undefined;

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !manager) {
    return <div className="text-center p-8 text-destructive">Técnico não encontrado.</div>;
  }

  const age = manager.isDeceased ? null : calcAge(manager.birthDate);
  const showFullName =
    !!manager.fullName?.trim() &&
    manager.fullName.trim().toLowerCase() !== manager.name.trim().toLowerCase();
  const birthDateLabel = fmtBirthDate(manager.birthDate);
  const locality = [manager.birthCity, manager.birthState]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join(", ");
  const birthCountry = manager.birthCountry?.trim() || null;
  const birthSuffix = manager.isDeceased
    ? " (Falecido)"
    : age != null
      ? ` (${age} anos)`
      : "";

  const personalRows: { label: string; value: ReactNode }[] = [];
  if (showFullName) {
    personalRows.push({ label: "Nome completo", value: manager.fullName!.trim() });
  }
  if (birthDateLabel) {
    personalRows.push({
      label: "Data de nascimento",
      value: `${birthDateLabel}${birthSuffix}`,
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
  } else if (manager.nationality) {
    personalRows.push({
      label: "Nacionalidade",
      value: (
        <span className="inline-flex items-center gap-1">
          <PlayerFlag nationality={manager.nationality} size="sm" />
          <span>{manager.nationality}</span>
        </span>
      ),
    });
  }
  if (manager.startYear != null) {
    personalRows.push({
      label: "Período no CSA",
      value:
        manager.endYear != null && manager.endYear !== manager.startYear
          ? `${manager.startYear}–${manager.endYear}`
          : String(manager.startYear),
    });
  }
  if (manager.linkedPlayer) {
    personalRows.push({
      label: "Como jogador",
      value: (
        <Link
          href={`/jogadores/${manager.linkedPlayer.id}`}
          className="text-primary hover:underline"
        >
          {manager.linkedPlayer.name}
        </Link>
      ),
    });
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Link href="/tecnicos">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para Técnicos
        </span>
      </Link>

      <div className="border-b pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <div className="flex items-start gap-3">
            <EntityPhoto
              url={manager.photoUrl}
              name={manager.name}
              size="lg"
              className="mt-0.5"
              label="Foto do técnico"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold" data-testid="heading-manager">{manager.name}</h1>
                {manager.isDeceased && (
                  <span
                    className="text-muted-foreground text-lg leading-none"
                    title="Falecido"
                    aria-label="Falecido"
                  >
                    †
                  </span>
                )}
                <ShareButton title={manager.name} />
                <VerificationCard
                  status={manager.verificationStatus}
                  verifiedBy={manager.verifiedBy}
                  verifiedAt={manager.verifiedAt}
                />
              </div>
              <EntityBadges badges={manager.badges} />
            </div>
          </div>
        </div>

        {personalRows.length > 0 && (
          <div data-testid="manager-personal-data">
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

      <StarRating entityType="manager" entityId={manager.id} />

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-border rounded overflow-hidden" data-testid="manager-stat-bar">
        {[
          { label: "Partidas", value: manager.matches, highlight: true },
          { label: "Vitórias", value: manager.wins, color: "text-green-600" },
          { label: "Empates", value: manager.draws, color: "text-amber-600" },
          { label: "Derrotas", value: manager.losses, color: "text-red-600" },
          { label: "Títulos", value: manager.titleCount ?? 0, highlight: true },
          { label: "Aproveit.", value: `${(manager.winPercentage ?? 0).toFixed(1)}%`, highlight: true },
        ].map(({ label, value, color, highlight }) => (
          <div key={label} className="bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-xl font-bold mt-0.5 ${color ?? (highlight ? "text-primary" : "")}`}>{value}</p>
          </div>
        ))}
      </div>

      {(manager.titles?.length ?? 0) > 0 && (
        <div data-testid="manager-titles">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Títulos
          </h2>
          <ul className="space-y-1 text-sm">
            {manager.titles!.map((t) => (
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

      {(manager.recentMatches?.length ?? 0) > 0 && (
        <div data-testid="manager-recent-matches" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Jogos
            </h2>
            <Link
              href={`/tecnicos/${manager.id}/jogos`}
              className="text-xs text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <MatchRows matches={manager.recentMatches!} />
        </div>
      )}

      {manager.seasonStats && manager.seasonStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Histórico por Temporada</h2>
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2">Ano</TableHead>
                  <TableHead className="py-2 text-right">J</TableHead>
                  <TableHead className="py-2 text-right text-green-600">V</TableHead>
                  <TableHead className="py-2 text-right text-amber-600">E</TableHead>
                  <TableHead className="py-2 text-right text-red-600">D</TableHead>
                  <TableHead className="py-2 text-right">Aproveit.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manager.seasonStats.map((s) => (
                  <TableRow key={s.year} className="text-sm" data-testid={`row-manager-season-${s.year}`}>
                    <TableCell className="py-2 font-medium">
                      <Link href={`/temporadas/${s.year}`} className="hover:text-primary hover:underline">
                        {s.year}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 text-right">{s.matches}</TableCell>
                    <TableCell className="py-2 text-right text-green-600">{s.wins}</TableCell>
                    <TableCell className="py-2 text-right text-amber-600">{s.draws}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{s.losses}</TableCell>
                    <TableCell className="py-2 text-right font-medium">{pct(s.wins, s.matches)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <EntityComments entityType="manager" entityId={manager.id} />
      <EntitySuggestionForm entityType="manager" entityId={manager.id} />
    </div>
  );
}
