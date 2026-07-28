/**
 * Year ranges for players (match lineups, fallback season stats).
 * Shared by match CSV import and players CSV import.
 */
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export type YearRange = { yearFrom: number | null; yearTo: number | null };

export async function yearsForPlayers(
  ids: number[],
): Promise<Map<number, YearRange>> {
  const map = new Map<number, YearRange>();
  for (const id of ids) map.set(id, { yearFrom: null, yearTo: null });
  if (!ids.length) return map;

  const idList = sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
  const fromLineups = await db.execute(sql`
    SELECT ml.player_id AS id,
           MIN(EXTRACT(YEAR FROM m.match_date)::int) AS y_from,
           MAX(EXTRACT(YEAR FROM m.match_date)::int) AS y_to
    FROM match_lineups ml
    INNER JOIN matches m ON m.id = ml.match_id
    WHERE ml.player_id IN (${idList})
    GROUP BY ml.player_id
  `);

  for (const r of fromLineups.rows as Array<{ id: number; y_from: number; y_to: number }>) {
    map.set(Number(r.id), {
      yearFrom: r.y_from ?? null,
      yearTo: r.y_to ?? null,
    });
  }

  const missing = ids.filter((id) => map.get(id)?.yearFrom == null);
  if (missing.length) {
    const missList = sql.join(
      missing.map((id) => sql`${id}`),
      sql`, `,
    );
    const stats = await db.execute(sql`
      SELECT player_id AS id, season
      FROM player_season_stats
      WHERE player_id IN (${missList})
    `);
    const agg = new Map<number, number[]>();
    for (const s of stats.rows as Array<{ id: number; season: string }>) {
      const y = parseInt(String(s.season).slice(0, 4), 10);
      if (!Number.isFinite(y)) continue;
      const arr = agg.get(Number(s.id)) ?? [];
      arr.push(y);
      agg.set(Number(s.id), arr);
    }
    for (const [id, years] of agg) {
      map.set(id, {
        yearFrom: Math.min(...years),
        yearTo: Math.max(...years),
      });
    }
  }
  return map;
}

export async function yearsForManagers(
  ids: number[],
): Promise<Map<number, YearRange>> {
  const map = new Map<number, YearRange>();
  for (const id of ids) map.set(id, { yearFrom: null, yearTo: null });
  if (!ids.length) return map;

  const idList = sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
  const fromMatches = await db.execute(sql`
    SELECT manager_id AS id,
           MIN(EXTRACT(YEAR FROM match_date)::int) AS y_from,
           MAX(EXTRACT(YEAR FROM match_date)::int) AS y_to
    FROM matches
    WHERE manager_id IN (${idList})
    GROUP BY manager_id
  `);
  for (const r of fromMatches.rows as Array<{ id: number; y_from: number; y_to: number }>) {
    map.set(Number(r.id), { yearFrom: r.y_from ?? null, yearTo: r.y_to ?? null });
  }

  const missing = ids.filter((id) => map.get(id)?.yearFrom == null);
  if (missing.length) {
    const missList = sql.join(
      missing.map((id) => sql`${id}`),
      sql`, `,
    );
    const stats = await db.execute(sql`
      SELECT manager_id AS id, season
      FROM manager_season_stats
      WHERE manager_id IN (${missList})
    `);
    const agg = new Map<number, number[]>();
    for (const s of stats.rows as Array<{ id: number; season: string }>) {
      const y = parseInt(String(s.season).slice(0, 4), 10);
      if (!Number.isFinite(y)) continue;
      const arr = agg.get(Number(s.id)) ?? [];
      arr.push(y);
      agg.set(Number(s.id), arr);
    }
    for (const [id, years] of agg) {
      map.set(id, {
        yearFrom: Math.min(...years),
        yearTo: Math.max(...years),
      });
    }
  }
  return map;
}
