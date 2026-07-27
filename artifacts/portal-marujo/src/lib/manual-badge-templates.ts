export type ManualBadgeTemplate =
  | "cria_do_mutange"
  | "garcom"
  | "artilheiro"
  | "artilheiro_comp"
  | "campeao"
  | "acesso"
  | "heroi_do_acesso"
  | "gol_do_titulo"
  | "gol_historico";

export type BadgeEntityType = "player" | "manager";

export const PLAYER_TEMPLATES: ManualBadgeTemplate[] = [
  "cria_do_mutange",
  "garcom",
  "artilheiro",
  "artilheiro_comp",
  "campeao",
  "acesso",
  "heroi_do_acesso",
  "gol_do_titulo",
  "gol_historico",
];

export const MANAGER_TEMPLATES: ManualBadgeTemplate[] = ["campeao"];

export const TEMPLATE_SELECT_LABELS: Record<ManualBadgeTemplate, string> = {
  cria_do_mutange: "Cria do Mutange",
  garcom: "Garçom",
  artilheiro: "Artilheiro",
  artilheiro_comp: "Artilheiro (competição)",
  campeao: "Campeão",
  acesso: "Acesso",
  heroi_do_acesso: "Herói do Acesso",
  gol_do_titulo: "Gol do Título",
  gol_historico: "Gol Histórico",
};

export function templatesForEntity(
  entityType: BadgeEntityType,
): ManualBadgeTemplate[] {
  return entityType === "player" ? PLAYER_TEMPLATES : MANAGER_TEMPLATES;
}

export function templateNeedsYear(template: ManualBadgeTemplate): boolean {
  return (
    template === "garcom"
    || template === "artilheiro"
    || template === "artilheiro_comp"
    || template === "campeao"
    || template === "acesso"
  );
}

export function templateNeedsCompetition(template: ManualBadgeTemplate): boolean {
  return (
    template === "artilheiro_comp"
    || template === "campeao"
    || template === "acesso"
  );
}

export function templateNeedsMatch(template: ManualBadgeTemplate): boolean {
  return (
    template === "heroi_do_acesso"
    || template === "gol_do_titulo"
    || template === "gol_historico"
  );
}

export function buildManualBadgeLabel(
  template: ManualBadgeTemplate,
  params: { year?: number; competitionName?: string },
): string {
  switch (template) {
    case "cria_do_mutange":
      return "Cria do Mutange";
    case "garcom":
      return `Garçom ${params.year}`;
    case "artilheiro":
      return `Artilheiro ${params.year}`;
    case "artilheiro_comp":
      return `Artilheiro ${params.competitionName} ${params.year}`;
    case "campeao":
      return `Campeão ${params.competitionName} ${params.year}`;
    case "acesso":
      return `Acesso ${params.competitionName} ${params.year}`;
    case "heroi_do_acesso":
      return `Herói do Acesso ${params.competitionName} ${params.year}`;
    case "gol_do_titulo":
      return `Gol do Título ${params.competitionName} ${params.year}`;
    case "gol_historico":
      return `Gol Histórico ${params.competitionName} ${params.year}`;
  }
}

export function deriveBadgeYearFromMatch(
  matchDate: string,
  season: string,
): number | null {
  const seasonYear = parseInt(season, 10);
  if (Number.isInteger(seasonYear) && seasonYear >= 1900 && seasonYear <= 2100) {
    return seasonYear;
  }
  const matchYear = parseInt(matchDate.slice(0, 4), 10);
  if (Number.isInteger(matchYear) && matchYear >= 1900 && matchYear <= 2100) {
    return matchYear;
  }
  return null;
}

export function formatMatchBadgeOption(match: {
  matchDate: string;
  opponentName: string;
  competitionName: string;
}): string {
  const [y, m, d] = match.matchDate.split("-");
  const dateLabel =
    y && m && d ? `${d}/${m}/${y}` : match.matchDate;
  return `${dateLabel} · ${match.opponentName} · ${match.competitionName}`;
}
