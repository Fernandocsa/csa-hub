/** Technical commission roles stored on managers.staff_role. */
export const STAFF_ROLES = [
  "manager",
  "assistant",
  "fitness",
  "doctor",
  "masseur",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/** Non-coach commission roles only (never técnico/treinador). */
export const COMMISSION_ROLES = [
  "assistant",
  "fitness",
  "doctor",
  "masseur",
] as const satisfies readonly StaffRole[];

export type CommissionRole = (typeof COMMISSION_ROLES)[number];

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);
}

export function isCommissionRole(value: unknown): value is CommissionRole {
  return typeof value === "string" && (COMMISSION_ROLES as readonly string[]).includes(value);
}

export const STAFF_ROLE_META: Record<
  StaffRole,
  {
    label: string;
    labelPlural: string;
    /** Admin list/detail base path */
    adminPath: string;
    /** Default registration type hint */
    registrationHint: string;
  }
> = {
  manager: {
    label: "Técnico",
    labelPlural: "Técnicos",
    adminPath: "/admin/tecnicos",
    registrationHint: "CREF …",
  },
  assistant: {
    label: "Auxiliar Técnico",
    labelPlural: "Auxiliares Técnicos",
    adminPath: "/admin/comissao/auxiliares",
    registrationHint: "RG/UF …",
  },
  fitness: {
    label: "Preparador Físico",
    labelPlural: "Preparadores Físicos",
    adminPath: "/admin/comissao/preparadores",
    registrationHint: "CREF ou RG/UF …",
  },
  doctor: {
    label: "Médico",
    labelPlural: "Médicos",
    adminPath: "/admin/comissao/medicos",
    registrationHint: "CRM/UF …",
  },
  masseur: {
    label: "Massagista",
    labelPlural: "Massagistas",
    adminPath: "/admin/comissao/massagistas",
    registrationHint: "RG/UF …",
  },
};

export function staffRoleFromAdminPath(pathname: string): StaffRole {
  if (pathname.startsWith("/admin/comissao/auxiliares")) return "assistant";
  if (pathname.startsWith("/admin/comissao/preparadores")) return "fitness";
  if (pathname.startsWith("/admin/comissao/medicos")) return "doctor";
  if (pathname.startsWith("/admin/comissao/massagistas")) return "masseur";
  return "manager";
}
