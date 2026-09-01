/** Calendar helpers for birthday queries (America/Sao_Paulo). */

import { db } from "@workspace/db";
import { playersTable, managersTable } from "@workspace/db";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { playerHasCsaLineupSql, managerHasCsaAssignmentSql } from "./match-filters";

export type Ymd = { year: number; month: number; day: number };

export function saoPauloYmd(date = new Date()): Ymd {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function formatYmd(ymd: Ymd): string {
  return `${ymd.year}-${String(ymd.month).padStart(2, "0")}-${String(ymd.day).padStart(2, "0")}`;
}

/** Parse YYYY-MM-DD; returns null if invalid. */
export function parseYmd(raw: string | undefined | null): Ymd | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split("-").map((n) => parseInt(n, 10));
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { year: y, month: m, day: d };
}

/** Age in full years on the given calendar day (birthday day → turns that age). */
export function ageTurningOn(birthDate: string, on: Ymd): number | null {
  const m = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const by = parseInt(m[1], 10);
  const age = on.year - by;
  return age >= 0 && age < 150 ? age : null;
}

export async function loadBirthdays(ymd: Ymd, includeDeceased: boolean) {
  const monthDay = and(
    isNotNull(playersTable.birthDate),
    sql`extract(month from ${playersTable.birthDate}) = ${ymd.month}`,
    sql`extract(day from ${playersTable.birthDate}) = ${ymd.day}`,
  );
  const playerWhere = includeDeceased
    ? and(monthDay, playerHasCsaLineupSql())
    : and(monthDay, eq(playersTable.isDeceased, false), playerHasCsaLineupSql());

  const players = await db
    .select({
      id: playersTable.id,
      name: playersTable.name,
      position: playersTable.position,
      nationality: playersTable.nationality,
      nationalityFlag: playersTable.nationalityFlag,
      photoUrl: playersTable.photoUrl,
      birthDate: playersTable.birthDate,
      isDeceased: playersTable.isDeceased,
    })
    .from(playersTable)
    .where(playerWhere)
    .orderBy(asc(playersTable.name));

  const managerMonthDay = and(
    isNotNull(managersTable.birthDate),
    sql`extract(month from ${managersTable.birthDate}) = ${ymd.month}`,
    sql`extract(day from ${managersTable.birthDate}) = ${ymd.day}`,
  );
  const managerWhere = includeDeceased
    ? and(managerMonthDay, managerHasCsaAssignmentSql())
    : and(managerMonthDay, eq(managersTable.isDeceased, false), managerHasCsaAssignmentSql());

  const managers = await db
    .select({
      id: managersTable.id,
      name: managersTable.name,
      nationality: managersTable.nationality,
      photoUrl: managersTable.photoUrl,
      birthDate: managersTable.birthDate,
      isDeceased: managersTable.isDeceased,
    })
    .from(managersTable)
    .where(managerWhere)
    .orderBy(asc(managersTable.name));

  return {
    date: formatYmd(ymd),
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position ?? null,
      nationality: p.nationality ?? null,
      nationalityFlag: p.nationalityFlag ?? null,
      photoUrl: p.photoUrl ?? null,
      birthDate: p.birthDate!,
      age: ageTurningOn(p.birthDate!, ymd),
      isDeceased: p.isDeceased,
      kind: "player" as const,
    })),
    managers: managers.map((m) => ({
      id: m.id,
      name: m.name,
      nationality: m.nationality ?? null,
      photoUrl: m.photoUrl ?? null,
      birthDate: m.birthDate!,
      age: ageTurningOn(m.birthDate!, ymd),
      isDeceased: m.isDeceased,
      kind: "manager" as const,
    })),
  };
}
