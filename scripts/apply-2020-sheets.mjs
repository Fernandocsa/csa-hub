/**
 * APPLY CSA 2020 campaign sheets (~58 games) + meta.
 * Includes Série B / Pré-Nordeste dated Jan 2021 (stored as season=2021 in DB).
 * Own goals for CSA → own_goals_for_count (+ optional detail); not player goals.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { GAMES, convertMinute, norm } from "./data/season-2020-games.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();
const DRY = process.argv.includes("--dry");

const FORCE_ID = {
  yago: 216, // Yago Henrique
  "yago henrique": 216,
  rafinha: 23,
  "caique santos": 86,
  caique: 86,
  "caíque": 86,
  "caíque santos": 86,
  "gustavo schutz": 208,
  schutz: 208,
  "jean kleber": 105,
  "jean kléber": 105,
  "jean cleber": 105,
  "jean cléber": 105,
  cleberson: 236,
  "cléberson": 236,
  nadson: 230,
  "nádson": 230,
  marquinhos: 229,
  "joao paulo": 7,
  "joão paulo": 7,
  "joao victor": 213,
  "joão victor": 213,
  "bruno rafael": 217,
  danilo: 207, // Cantionilo
  geova: 47, // typo → Geovane
  lucao: 9,
  "lucão": 9,
};

const SPELL_TO_DB = {
  yago: "Yago Henrique",
  "caique santos": "Caíque",
  caique: "Caíque",
  "gustavo schutz": "Schutz",
  "jean kleber": "Jean Cléber",
  "jean kléber": "Jean Cléber",
  "jean cleber": "Jean Cléber",
  cleberson: "Cleberson",
  "cléberson": "Cleberson",
  geova: "Geovane",
  mozart: "Mozart Santos",
  "mauricio barbieri": "Mauricio Barbieri",
  "maurício barbieri": "Mauricio Barbieri",
};

const MANAGER_ALIASES = {
  mozart: "mozart santos",
  "mauricio barbieri": "mauricio barbieri",
  "maurício barbieri": "mauricio barbieri",
  "eduardo baptista": "eduardo baptista",
  "argel fuchs": "argel fuchs",
  "adriano rodrigues": "adriano rodrigues",
};

const STADIUM_MAP = {
  "rei pele": { prefer: ["rei pele", "trapichao"] },
  "edson matias": { prefer: ["edson matias"] },
  "jose gomes da costa": { prefer: ["jose gomes", "gomes da costa"] },
  "coaracy da mata fonseca": { prefer: ["coaracy"] },
  "salvador costa": {
    prefer: ["salvador costa"],
    create: { name: "Estádio Salvador Costa", city: "Vitória", state: "ES" },
  },
  albertao: { prefer: ["albertao"], create: { name: "Estádio Albertão", city: "Teresina", state: "PI" } },
  "arena castelao": { prefer: ["castelao"], cityHint: "fortaleza" },
  castelao: { prefer: ["castelao"], cityHint: "sao luis" },
  "ct praia do forte": {
    prefer: ["praia do forte"],
    create: { name: "CT Praia do Forte", city: "Mato de São João", state: "BA" },
  },
  "arena conda": { prefer: ["arena conda", "conda"] },
  "germano kruger": { prefer: ["germano kruger"] },
  "moises lucarelli": { prefer: ["moises lucarelli", "lucarelli"] },
  "arena independencia": { prefer: ["independencia"] },
  "arena barueri": {
    prefer: ["arena barueri", "barueri"],
    create: { name: "Arena Barueri", city: "Barueri", state: "SP" },
  },
  barradao: { prefer: ["barradao"] },
  ressacada: { prefer: ["ressacada"] },
  "bento freitas": { prefer: ["bento freitas"] },
  "brinco de ouro da princesa": { prefer: ["brinco de ouro"] },
  "arena pantanal": {
    prefer: ["arena pantanal", "pantanal"],
    create: { name: "Arena Pantanal", city: "Cuiabá", state: "MT" },
  },
  "lourival batista": { prefer: ["lourival baptista", "lourival batista", "batistao"] },
  "alfredo jaconi": {
    prefer: ["alfredo jaconi", "jaconi"],
    create: { name: "Estádio Alfredo Jaconi", city: "Caxias do Sul", state: "RS" },
  },
  "orlando scarpelli": { prefer: ["scarpelli"] },
  "durival britto": {
    prefer: ["durival"],
    create: { name: "Estádio Durival Britto e Silva", city: "Curitiba", state: "PR" },
  },
  "santa cruz": {
    prefer: ["santa cruz"],
    create: { name: "Estádio Santa Cruz", city: "Ribeirão Preto", state: "SP" },
  },
  "nhozinho santos": {
    prefer: ["nhozinho"],
    create: { name: "Estádio Nhozinho Santos", city: "São Luís", state: "MA" },
  },
};

function parseRef(raw) {
  const m = String(raw ?? "").trim().match(/^(.*?)(?:-([A-Z]{2}))?$/);
  return { name: (m?.[1] ?? raw).trim(), state: m?.[2] ?? null };
}

function ownGoalsCount(g) {
  if (Array.isArray(g.ownGoalsFor)) return g.ownGoalsFor.length;
  if (typeof g.ownGoalsFor === "number") return g.ownGoalsFor;
  return 0;
}

function scorersText(g) {
  const parts = g.goals.map((x) => x.p);
  if (ownGoalsCount(g) > 0) parts.unshift("GPF");
  return parts.join(", ") || null;
}

try {
  await client.query("BEGIN");

  const { rows: mgrRows } = await client.query(`SELECT id, name FROM managers`);
  function resolveManager(name) {
    const key = norm(name);
    const want = MANAGER_ALIASES[key] ?? key;
    const hit = mgrRows.find((m) => norm(m.name) === want);
    if (hit) return hit;
    const soft = mgrRows.filter(
      (m) => norm(m.name).includes(want) || want.includes(norm(m.name)),
    );
    if (soft.length === 1) return soft[0];
    throw new Error(`manager not found: ${name}`);
  }

  const refCache = new Map();
  async function resolveRef(raw) {
    const { name, state } = parseRef(raw);
    const key = norm(name);
    if (refCache.has(key)) return refCache.get(key);
    let { rows } = await client.query(
      `SELECT id, name FROM referees WHERE lower(name)=lower($1)`,
      [name],
    );
    if (!rows[0]) {
      ({ rows } = await client.query(
        `SELECT id, name FROM referees WHERE lower(name) LIKE lower($1)`,
        [`%${name.split(/\s+/).slice(0, 2).join(" ")}%`],
      ));
      const exact = rows.filter((r) => norm(r.name) === key);
      if (exact.length === 1) rows = exact;
      else if (rows.length !== 1) rows = [];
    }
    if (!rows[0]) {
      if (DRY) {
        console.log("would create ref", name, state);
        const fake = { id: -1, name };
        refCache.set(key, fake);
        return fake;
      }
      const ins = await client.query(
        `INSERT INTO referees (name, state) VALUES ($1, $2) RETURNING id, name`,
        [name, state],
      );
      console.log("+ ref", ins.rows[0]);
      rows = ins.rows;
    }
    refCache.set(key, rows[0]);
    return rows[0];
  }

  const { rows: allStadiums } = await client.query(`SELECT id, name FROM stadiums`);
  async function resolveStadium(name, cityUf) {
    if (!name) return null;
    const key = norm(name);
    const map = STADIUM_MAP[key];
    const prefers = map?.prefer ?? [key];
    const cityHint = map?.cityHint ?? norm(cityUf ?? "");

    if (key === "castelao" || key === "arena castelao") {
      const hits = allStadiums.filter((s) => norm(s.name).includes("castelao"));
      if (cityHint.includes("sao luis") || cityHint.includes("luis")) {
        const sl = hits.find(
          (s) =>
            norm(s.name).includes("sao luis") ||
            norm(s.name).includes("luis") ||
            norm(s.name).includes("castelao (sao"),
        );
        if (sl) return sl.id;
      }
      if (cityHint.includes("fortaleza")) {
        const ft = hits.find(
          (s) =>
            norm(s.name).includes("fortaleza") ||
            norm(s.name).includes("arena castelao"),
        );
        if (ft) return ft.id;
        if (hits.length === 1) return hits[0].id;
      }
    }

    // Santa Cruz Ribeirão vs Arruda Recife
    if (key === "santa cruz") {
      const hits = allStadiums.filter((s) => norm(s.name).includes("santa cruz"));
      const rp = hits.find(
        (s) =>
          norm(s.name).includes("ribeirao") ||
          norm(cityUf ?? "").includes("ribeirao"),
      );
      if (rp) return rp.id;
      if (cityHint.includes("ribeirao") || norm(cityUf ?? "").includes("ribeirao")) {
        // fall through to create
      } else if (hits.length === 1) return hits[0].id;
    }

    for (const pref of prefers) {
      const hits = allStadiums.filter((s) => norm(s.name).includes(pref));
      if (hits.length >= 1) {
        hits.sort((a, b) => a.name.length - b.name.length);
        return hits[0].id;
      }
    }

    if (map?.create) {
      if (DRY) {
        console.log("would create stadium", map.create.name);
        return null;
      }
      const ins = await client.query(
        `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,'Brasil') RETURNING id, name`,
        [map.create.name, map.create.city, map.create.state],
      );
      console.log("+ stadium", ins.rows[0]);
      allStadiums.push(ins.rows[0]);
      return ins.rows[0].id;
    }

    if (DRY) {
      console.log("would create stadium generic", name);
      return null;
    }
    const m = String(cityUf ?? "").match(/^(.+)-([A-Z]{2})$/);
    const ins = await client.query(
      `INSERT INTO stadiums (name, city, state, country) VALUES ($1,$2,$3,'Brasil') RETURNING id, name`,
      [
        name.startsWith("Estádio") || name.startsWith("Arena") || name.startsWith("CT")
          ? name
          : `Estádio ${name}`,
        m?.[1] ?? null,
        m?.[2] ?? null,
      ],
    );
    console.log("+ stadium", ins.rows[0]);
    allStadiums.push(ins.rows[0]);
    return ins.rows[0].id;
  }

  const { rows: allPlayers } = await client.query(`SELECT id, name FROM players`);
  const playersByNorm = new Map();
  for (const p of allPlayers) {
    const k = norm(p.name);
    if (!playersByNorm.has(k)) playersByNorm.set(k, []);
    playersByNorm.get(k).push(p);
  }

  async function resolvePlayer(name) {
    const key = norm(name);
    if (FORCE_ID[key] != null) {
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
        FORCE_ID[key],
      ]);
      if (!rows[0]) throw new Error(`FORCE_ID missing ${name}`);
      return rows[0];
    }
    if (SPELL_TO_DB[key]) {
      const spellKey = norm(SPELL_TO_DB[key]);
      const hits = playersByNorm.get(spellKey) ?? [];
      if (hits.length === 1) return hits[0];
      const exact = allPlayers.find((p) => p.name === SPELL_TO_DB[key]);
      if (exact) return exact;
    }
    const direct = playersByNorm.get(key) ?? [];
    if (direct.length === 1) return direct[0];
    if (direct.length > 1) {
      throw new Error(
        `player ambiguous: ${name} → ${direct.map((p) => `#${p.id} ${p.name}`).join(", ")}`,
      );
    }
    throw new Error(`player unresolved: ${name}`);
  }

  {
    const names = new Set();
    for (const g of GAMES) {
      resolveManager(g.mgr);
      for (const s of g.starters) names.add(s);
      for (const [a, b] of g.subs || []) {
        names.add(a);
        names.add(b);
      }
      for (const x of g.goals || []) names.add(x.p);
    }
    for (const n of names) await resolvePlayer(n);
    console.log(`resolved ${names.size} players, managers ok, games=${GAMES.length}`);
  }

  const { rows: dbMatches } = await client.query(`
    SELECT m.id, m.season, m.match_date::text AS d, o.name AS opp, c.name AS comp,
           m.home_away, m.goals_for, m.goals_against
    FROM matches m
    JOIN opponents o ON o.id=m.opponent_id
    JOIN competitions c ON c.id=m.competition_id
    WHERE m.is_friendly=false
      AND (
        m.season='2020'
        OR (m.season='2021' AND m.match_date < '2021-01-30')
      )
  `);

  function findMatch(g) {
    const sameDate = dbMatches.filter((m) => m.d.slice(0, 10) === g.date);
    if (sameDate.length === 1) return sameDate[0];
    const oppKey = norm(g.opp).split("-")[0].trim();
    const hit = sameDate.filter((m) => {
      const on = norm(m.opp);
      return on.includes(oppKey) || oppKey.includes(on.split("-")[0].trim());
    });
    if (hit.length === 1) return hit[0];
    const compHint =
      g.comp === "Alagoano"
        ? "alagoano"
        : g.comp === "Nordeste" || g.comp === "Pré-Nordeste"
          ? "nordeste"
          : g.comp === "Copa do Brasil"
            ? "copa do brasil"
            : "serie b";
    const pool2 = hit.length ? hit : sameDate;
    const byComp = pool2.filter((m) => norm(m.comp).includes(compHint));
    if (byComp.length === 1) return byComp[0];
    const byScore = pool2.filter(
      (m) => Number(m.goals_for) === g.gf && Number(m.goals_against) === g.ga,
    );
    if (byScore.length === 1) return byScore[0];
    throw new Error(
      `match not found n=${g.n} ${g.date} ${g.opp} candidates=${sameDate.map((m) => m.id + ":" + m.opp).join(",")}`,
    );
  }

  const applied = [];

  for (const g of GAMES) {
    const match = findMatch(g);
    const mgr = resolveManager(g.mgr);
    const ref = await resolveRef(g.ref);
    const stadiumId = await resolveStadium(g.stadium, g.cityUf);
    const og = ownGoalsCount(g);
    const att = g.gatesClosed ? null : (g.att ?? null);
    const attP = g.gatesClosed ? null : (g.attP ?? null);
    const renda = g.gatesClosed ? null : (g.renda ?? null);

    if (!DRY) {
      await client.query(
        `UPDATE matches SET
           manager_id=$2,
           referee_id=$3,
           stadium_id=COALESCE($4, stadium_id),
           attendance=$5,
           attendance_paid=$6,
           gross_revenue=COALESCE($7, gross_revenue),
           phase=$8,
           round=$9,
           own_goals_for_count=$10,
           scorers=$11
         WHERE id=$1`,
        [
          match.id,
          mgr.id,
          ref.id > 0 ? ref.id : null,
          stadiumId,
          att,
          attP,
          renda,
          g.phase ?? null,
          g.round ?? null,
          og,
          scorersText(g),
        ],
      );

      await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [
        match.id,
      ]);

      const lineupIdByPlayer = new Map();
      let sort = 0;
      for (const name of g.starters) {
        const p = await resolvePlayer(name);
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'starter',NULL,NULL,$4) RETURNING id`,
          [match.id, p.id, p.name, sort++],
        );
        lineupIdByPlayer.set(p.id, rows[0].id);
      }
      const benchNames = [];
      for (const [, inn] of g.subs || []) {
        if (!benchNames.includes(inn)) benchNames.push(inn);
      }
      for (const name of benchNames) {
        const p = await resolvePlayer(name);
        if (lineupIdByPlayer.has(p.id)) continue;
        const { rows } = await client.query(
          `INSERT INTO match_lineups
             (match_id, side, player_id, player_name, role, shirt_number, position, sort_order)
           VALUES ($1,'csa',$2,$3,'bench',NULL,NULL,$4) RETURNING id`,
          [match.id, p.id, p.name, sort++],
        );
        lineupIdByPlayer.set(p.id, rows[0].id);
      }

      for (const goal of g.goals || []) {
        const conv = convertMinute(goal.m, goal.h);
        if (conv.error) throw new Error(`n=${g.n} ${conv.error}`);
        const p = await resolvePlayer(goal.p);
        await client.query(
          `INSERT INTO match_goals
             (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name, minute, injury_time_minute)
           VALUES ($1,'csa',$2,$3,$4,$5,$6)`,
          [
            match.id,
            lineupIdByPlayer.get(p.id) ?? null,
            p.id,
            p.name,
            conv.minute,
            conv.injuryTimeMinute,
          ],
        );
      }

      for (const [outName, inName] of g.subs || []) {
        const outP = await resolvePlayer(outName);
        const inP = await resolvePlayer(inName);
        await client.query(
          `INSERT INTO match_substitutions
             (match_id, side, player_out_lineup_id, player_out_id, player_out_name,
              player_in_lineup_id, player_in_id, player_in_name, minute, injury_time_minute)
           VALUES ($1,'csa',$2,$3,$4,$5,$6,$7,0,NULL)`,
          [
            match.id,
            lineupIdByPlayer.get(outP.id) ?? null,
            outP.id,
            outP.name,
            lineupIdByPlayer.get(inP.id) ?? null,
            inP.id,
            inP.name,
          ],
        );
      }
    }

    applied.push({
      n: g.n,
      matchId: match.id,
      season: match.season,
      date: g.date,
      opp: g.opp,
      mgr: mgr.name,
      goals: (g.goals || []).length,
      og,
    });
    console.log(
      `* n=${g.n} #${match.id} s${match.season} ${g.date} ${g.opp} mgr=${mgr.name} goals=${(g.goals || []).length} og=${og}`,
    );
  }

  // Related: Alagoano has jogo único SF/Final — no pairs.
  // Pré-Nordeste Moto Club legs
  {
    const ida = applied.find((a) => a.date === "2021-01-05" || (a.opp.includes("Moto") && a.n && GAMES.find((g) => g.n === a.n)?.ha === "away"));
    const volta = applied.find((a) => a.date === "2021-01-26");
    const idaG = GAMES.find((g) => g.comp === "Pré-Nordeste" && g.ha === "away");
    const voltaG = GAMES.find((g) => g.comp === "Pré-Nordeste" && g.ha === "home");
    const idaA = idaG && applied.find((a) => a.n === idaG.n);
    const voltaA = voltaG && applied.find((a) => a.n === voltaG.n);
    if (idaA && voltaA && !DRY) {
      await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
        idaA.matchId,
        voltaA.matchId,
      ]);
      await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
        voltaA.matchId,
        idaA.matchId,
      ]);
      console.log(`* related Pré-Nordeste ${idaA.matchId}↔${voltaA.matchId}`);
    }
  }

  if (!DRY) {
    // Sync roster for season=2020 from sheets on season-2020 matches only;
    // also bump 2021 roster for Jan leftover sheets already counted there.
    for (const season of ["2020", "2021"]) {
      const dateFilter =
        season === "2020"
          ? `m.season='2020'`
          : `m.season='2021' AND m.match_date < '2021-01-30'`;
      const { rows: sheetStats } = await client.query(`
        WITH apps AS (
          SELECT ml.player_id, count(DISTINCT ml.match_id)::int AS appearances
          FROM match_lineups ml
          JOIN matches m ON m.id=ml.match_id
          WHERE ${dateFilter} AND ml.side='csa' AND ml.player_id IS NOT NULL
            AND (
              ml.role='starter'
              OR EXISTS (
                SELECT 1 FROM match_substitutions s
                WHERE s.match_id=ml.match_id AND s.side='csa' AND s.player_in_id=ml.player_id
              )
            )
          GROUP BY ml.player_id
        ),
        goals AS (
          SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
          FROM match_goals mg
          JOIN matches m ON m.id=mg.match_id
          WHERE ${dateFilter} AND mg.side='csa' AND mg.is_own_goal=false
            AND mg.scorer_player_id IS NOT NULL
          GROUP BY mg.scorer_player_id
        )
        SELECT a.player_id, a.appearances, coalesce(g.goals,0) AS goals
        FROM apps a LEFT JOIN goals g ON g.player_id=a.player_id
      `);
      // For 2020: SET from sheets (full campaign in season label).
      // For 2021 early: GREATEST so we don't wipe post-Jan-30 2021 sheets.
      let upserted = 0;
      for (const s of sheetStats) {
        const { rows: cur } = await client.query(
          `SELECT id, appearances, goals FROM player_season_stats WHERE player_id=$1 AND season=$2`,
          [s.player_id, season],
        );
        if (season === "2020") {
          if (cur[0]) {
            await client.query(
              `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
              [cur[0].id, s.appearances, s.goals],
            );
          } else {
            await client.query(
              `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
               VALUES ($1,'2020',$2,$3,0)`,
              [s.player_id, s.appearances, s.goals],
            );
          }
        } else if (cur[0]) {
          // early 2021 leftovers: only bump if sheet apps for early window exceed stored
          // Skip — 2021 roster already synced from full 2021 apply; early games now have sheets
          // Recompute full 2021 from all 2021 sheets would be better once:
        }
        upserted += 1;
      }
      console.log(`roster sync ${season} rows ${upserted}`);
    }

    // Re-sync full 2021 roster from all 2021 sheets (now includes Jan leftovers)
    {
      const { rows: sheetStats } = await client.query(`
        WITH apps AS (
          SELECT ml.player_id, count(DISTINCT ml.match_id)::int AS appearances
          FROM match_lineups ml
          JOIN matches m ON m.id=ml.match_id
          WHERE m.season='2021' AND ml.side='csa' AND ml.player_id IS NOT NULL
            AND (
              ml.role='starter'
              OR EXISTS (
                SELECT 1 FROM match_substitutions s
                WHERE s.match_id=ml.match_id AND s.side='csa' AND s.player_in_id=ml.player_id
              )
            )
          GROUP BY ml.player_id
        ),
        goals AS (
          SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
          FROM match_goals mg
          JOIN matches m ON m.id=mg.match_id
          WHERE m.season='2021' AND mg.side='csa' AND mg.is_own_goal=false
            AND mg.scorer_player_id IS NOT NULL
          GROUP BY mg.scorer_player_id
        )
        SELECT a.player_id, a.appearances, coalesce(g.goals,0) AS goals
        FROM apps a LEFT JOIN goals g ON g.player_id=a.player_id
      `);
      for (const s of sheetStats) {
        const { rows: cur } = await client.query(
          `SELECT id FROM player_season_stats WHERE player_id=$1 AND season='2021'`,
          [s.player_id],
        );
        if (cur[0]) {
          await client.query(
            `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
            [cur[0].id, s.appearances, s.goals],
          );
        } else {
          await client.query(
            `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
             VALUES ($1,'2021',$2,$3,0)`,
            [s.player_id, s.appearances, s.goals],
          );
        }
      }
      console.log(`roster resync 2021 full from sheets ${sheetStats.length}`);
    }
  }

  if (DRY) {
    await client.query("ROLLBACK");
    console.log(`\nDRY RUN ok, would apply ${applied.length}`);
  } else {
    await client.query("COMMIT");
    console.log(`\nDONE applied ${applied.length}`);
  }
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ROLLBACK", e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
