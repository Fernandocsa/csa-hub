/** Technical commission roles stored on managers.staff_role. */
export const STAFF_ROLES = [
  "manager",
  "assistant",
  "fitness",
  "doctor",
  "masseur",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);
}
