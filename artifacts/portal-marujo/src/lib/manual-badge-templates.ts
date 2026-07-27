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

export function templateNeedsYear(template: ManualBadgeTemplate): boolean {
  return template !== "cria_do_mutange";
}

export function templateNeedsCompetition(template: ManualBadgeTemplate): boolean {
  return template === "artilheiro_comp" || template === "campeao";
}
