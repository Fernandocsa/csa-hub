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

export function validateManualBadgeInput(
  entityType: BadgeEntityType,
  templateRaw: string,
  year: number | null,
  competitionId: number | null,
  matchId: number | null,
):
  | { ok: true; template: ManualBadgeTemplate }
  | { ok: false; error: string } {
  const allowed = templatesForEntity(entityType);
  if (!allowed.includes(templateRaw as ManualBadgeTemplate)) {
    return { ok: false, error: "template inválido para esta entidade" };
  }
  const template = templateRaw as ManualBadgeTemplate;

  if (template === "cria_do_mutange") {
    if (year != null) return { ok: false, error: "Cria do Mutange não usa ano" };
    if (competitionId != null) {
      return { ok: false, error: "Cria do Mutange não usa competição" };
    }
    if (matchId != null) {
      return { ok: false, error: "Cria do Mutange não usa partida" };
    }
  } else if (template === "garcom" || template === "artilheiro") {
    if (year == null) return { ok: false, error: "ano obrigatório" };
    if (competitionId != null) {
      return { ok: false, error: "este template não usa competição" };
    }
    if (matchId != null) {
      return { ok: false, error: "este template não usa partida" };
    }
  } else if (
    template === "artilheiro_comp"
    || template === "campeao"
    || template === "acesso"
  ) {
    if (year == null) return { ok: false, error: "ano obrigatório" };
    if (competitionId == null) {
      return { ok: false, error: "competição obrigatória" };
    }
    if (matchId != null) {
      return { ok: false, error: "este template não usa partida" };
    }
  } else {
    if (year != null) {
      return { ok: false, error: "este template deriva o ano da partida" };
    }
    if (competitionId != null) {
      return { ok: false, error: "este template deriva a competição da partida" };
    }
    if (matchId == null) {
      return { ok: false, error: "partida obrigatória" };
    }
  }

  return { ok: true, template };
}

export function duplicateManualBadgeMessage(template: ManualBadgeTemplate): string {
  switch (template) {
    case "cria_do_mutange":
      return "Esta pessoa já possui o badge Cria do Mutange";
    case "garcom":
    case "artilheiro":
      return "Já existe um badge com este template e ano para esta pessoa";
    case "artilheiro_comp":
    case "campeao":
    case "acesso":
      return "Já existe um badge com este template, competição e ano para esta pessoa";
    case "heroi_do_acesso":
    case "gol_do_titulo":
    case "gol_historico":
      return "Já existe um badge com este template e partida para esta pessoa";
  }
}

export function parseSeasonYear(
  raw: unknown,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (raw == null || String(raw).trim() === "") {
    return { ok: true, value: null };
  }
  const y = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  if (!Number.isInteger(y) || y < 1900 || y > 2100) {
    return { ok: false, error: "seasonYear inválido" };
  }
  return { ok: true, value: y };
}

export function parseCompetitionId(
  raw: unknown,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (raw == null || String(raw).trim() === "") {
    return { ok: true, value: null };
  }
  const id = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: "competitionId inválido" };
  }
  return { ok: true, value: id };
}

export function parseMatchId(
  raw: unknown,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (raw == null || String(raw).trim() === "") {
    return { ok: true, value: null };
  }
  const id = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, error: "matchId inválido" };
  }
  return { ok: true, value: id };
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
