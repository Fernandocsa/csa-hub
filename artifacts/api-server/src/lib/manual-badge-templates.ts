export type ManualBadgeTemplate =
  | "cria_do_mutange"
  | "garcom"
  | "artilheiro"
  | "artilheiro_comp"
  | "campeao";

export type BadgeEntityType = "player" | "manager";

export const PLAYER_TEMPLATES: ManualBadgeTemplate[] = [
  "cria_do_mutange",
  "garcom",
  "artilheiro",
  "artilheiro_comp",
  "campeao",
];

export const MANAGER_TEMPLATES: ManualBadgeTemplate[] = ["campeao"];

export const TEMPLATE_SELECT_LABELS: Record<ManualBadgeTemplate, string> = {
  cria_do_mutange: "Cria do Mutange",
  garcom: "Garçom",
  artilheiro: "Artilheiro",
  artilheiro_comp: "Artilheiro (competição)",
  campeao: "Campeão",
};

export function templatesForEntity(
  entityType: BadgeEntityType,
): ManualBadgeTemplate[] {
  return entityType === "player" ? PLAYER_TEMPLATES : MANAGER_TEMPLATES;
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
  }
}

export function validateManualBadgeInput(
  entityType: BadgeEntityType,
  templateRaw: string,
  year: number | null,
  competitionId: number | null,
):
  | { ok: true; template: ManualBadgeTemplate }
  | { ok: false; error: string } {
  const allowed = templatesForEntity(entityType);
  if (!allowed.includes(templateRaw as ManualBadgeTemplate)) {
    return { ok: false, error: "template inválido para esta entidade" };
  }
  const template = templateRaw as ManualBadgeTemplate;

  if (template === "cria_do_mutange") {
    if (year != null) {
      return { ok: false, error: "Cria do Mutange não usa ano" };
    }
    if (competitionId != null) {
      return { ok: false, error: "Cria do Mutange não usa competição" };
    }
  } else if (template === "garcom" || template === "artilheiro") {
    if (year == null) return { ok: false, error: "ano obrigatório" };
    if (competitionId != null) {
      return { ok: false, error: "este template não usa competição" };
    }
  } else {
    if (year == null) return { ok: false, error: "ano obrigatório" };
    if (competitionId == null) {
      return { ok: false, error: "competição obrigatória" };
    }
  }

  return { ok: true, template };
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
