/**
 * APPLY CSA 2022 match sheets (64 games) + meta (attendance/renda/phase/pens/stadiums).
 * Reassigns Seletiva CdB legs to competition Seletiva da Copa do Brasil.
 * Own goals for CSA (e.g. Paulo OG vs Aliança) → own_goals_for_count only.
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";
import { GAMES, convertMinute, norm } from "./data/season-2022-games.mjs";

loadEnvFromDotenv();
const pool = createPgPool();
const client = await pool.connect();
const DRY = process.argv.includes("--dry");
const SEASON = "2022";
const SELETIVA_COMP_ID = 10020;

const FORCE_ID = {
  "giva santos": 141,
  giva: 141,
  marcel: 286, // Marcel Scalese
  wellington: 293, // Wellington Nascimento
  denilson: 290, // Denílson
  "denílson": 290,
  "luiz henrique": 284, // Luiz Beserra
  william: 595, // William Fernando
  elton: 12, // Élton
  "élton": 12,
  canteros: 289, // Héctor Canteros
  edson: 300, // Edson Lucas
  leo: 277, // Léo Carvalho
  "léo": 277,
  "everton silva": 265, // Éverton Silva
  "éverton silva": 265,
  geovane: 47,
  lucao: 9,
  "lucão": 9,
};

const SPELL_TO_DB = {
  "giva santos": "Giva",
  marcel: "Marcel Scalese",
  wellington: "Wellington Nascimento",
  denilson: "Denílson",
  "luiz henrique": "Luiz Beserra",
  william: "William Fernando",
  elton: "Élton",
  canteros: "Héctor Canteros",
  edson: "Edson Lucas",
  leo: "Léo Carvalho",
  "léo": "Léo Carvalho",
  "everton silva": "Éverton Silva",
  mozart: "Mozart Santos",
};

const CREATE_MANAGERS = ["Fernando Alves", "Felipe Alves"];

const MANAGER_ALIASES = {
  mozart: "mozart santos",
  "mozart santos": "mozart santos",
  "denis iwamura": "denis iwamura",
  "alberto valentim": "alberto valentim",
  "adriano rodrigues": "adriano rodrigues",
  "roberto fernandes": "roberto fernandes",
  "fernando alves": "fernando alves",
  "felipe alves": "felipe alves",
};

const STADIUM_MAP = {
  "rei pele": { prefer: ["rei pele", "trapichao"], create: { name: "Estádio Rei Pelé (Trapichão)", city: "Maceió", state: "AL" } },
  "coaracy da mata fonseca": { prefer: ["coaracy"], create: { name: "Coaracy da Mata (Fumeirão)", city: "Arapiraca", state: "AL" } },
  "jose gomes da costa": { prefer: ["jose gomes", "gomes da costa"], create: { name: "José Gomes (Murici)", city: "Murici", state: "AL" } },
  marizao: { prefer: ["marizao"], create: { name: "Estádio Marizão", city: "Sousa", state: "PB" } },
  "arena fonte nova": { prefer: ["fonte nova"], create: { name: "Arena Fonte Nova", city: "Salvador", state: "BA" } },
  "arena castelao": { prefer: ["castelao"], create: { name: "Arena Castelão", city: "Fortaleza", state: "CE" }, cityHint: "fortaleza" },
  castelao: { prefer: ["castelao"], create: { name: "Castelão (São Luís)", city: "São Luís", state: "MA" }, cityHint: "sao luis" },
  "antonio carneiro": { prefer: ["antonio carneiro"], create: { name: "Estádio Antônio Carneiro", city: "Alagoinhas", state: "BA" } },
  "arena independencia": { prefer: ["independencia"], create: { name: "Arena Independência", city: "Belo Horizonte", state: "MG" } },
  "novelli junior": { prefer: ["novelli"], create: { name: "Estádio Novelli Júnior", city: "Itu", state: "SP" } },
  "augusto bauer": { prefer: ["augusto bauer"], create: { name: "Estádio Augusto Bauer", city: "Brusque", state: "SC" } },
  "sao januario": { prefer: ["januario"], create: { name: "Estádio de São Januário", city: "Rio de Janeiro", state: "RJ" } },
  aflitos: { prefer: ["aflitos"], create: { name: "Estádio dos Aflitos", city: "Recife", state: "PE" } },
  "soares de azevedo": { prefer: ["soares de azevedo"], create: { name: "Estádio Soares de Azevedo", city: "Muriaé", state: "MG" } },
  "brinco de ouro da princesa": { prefer: ["brinco de ouro"], create: { name: "Estádio Brinco de Ouro", city: "Campinas", state: "SP" } },
  cafe: { prefer: ["estadio do cafe", "do cafe"], create: { name: "Estádio do Café", city: "Londrina", state: "PR" } },
  "onesio brasileiro alvarenga": { prefer: ["onesio", "alvarenga"], create: { name: "Estádio Onésio Brasileiro Alvarenga", city: "Goiânia", state: "GO" } },
  "heriberto hulse": { prefer: ["heriberto hulse"], create: { name: "Estádio Heriberto Hülse", city: "Criciúma", state: "SC" } },
  "arena de pernambuco": { prefer: ["arena de pernambuco"], create: { name: "Arena de Pernambuco", city: "São Lourenço da Mata", state: "PE" } },
  "germano kruger": { prefer: ["germano kruger"], create: { name: "Estádio Germano Krüger", city: "Ponta Grossa", state: "PR" } },
  "jorge ismael de biasi": { prefer: ["ismael de biasi", "jorge ismael"], create: { name: "Estádio Jorge Ismael de Biasi", city: "Novo Horizonte", state: "SP" } },
  "arena conda": { prefer: ["arena conda", "conda"], create: { name: "Arena Condá", city: "Chapecó", state: "SC" } },
  "moises lucarelli": { prefer: ["moises lucarelli", "lucarelli"], create: { name: "Estádio Moisés Lucarelli", city: "Campinas", state: "SP" } },
  mineirao: { prefer: ["mineirao"], create: { name: "Estádio Mineirão", city: "Belo Horizonte", state: "MG" } },
};

const PHASE_ROUND = {
  1: { phase: "1ª Fase", round: "1ª rodada" },
  2: { phase: "1ª Fase", round: "2ª rodada" },
  3: { phase: "1ª Fase", round: "3ª rodada" },
  4: { phase: "1ª Fase", round: "4ª rodada" },
  5: { phase: "1ª Fase", round: "5ª rodada" },
  6: { phase: "1ª Fase", round: "6ª rodada" },
  7: { phase: "1ª Fase", round: "7ª rodada" },
  8: { phase: "Semifinal", round: "Jogo de ida" },
  9: { phase: "Semifinal", round: "Jogo de volta" },
  10: { phase: "3º lugar", round: "Jogo de ida" },
  11: { phase: "3º lugar", round: "Jogo de volta" },
  12: { phase: null, round: "Jogo de ida" },
  13: { phase: null, round: "Jogo de volta" },
};
for (let i = 14; i <= 21; i++) {
  PHASE_ROUND[i] = { phase: "Fase de grupos", round: `${i - 13}ª rodada` };
}
PHASE_ROUND[22] = { phase: "Quartas de final", round: "Jogo único" };
PHASE_ROUND[23] = { phase: "1ª Fase", round: "Jogo único" };
PHASE_ROUND[24] = { phase: "2ª Fase", round: "Jogo único" };
PHASE_ROUND[25] = { phase: "3ª Fase", round: "Jogo de ida" };
PHASE_ROUND[26] = { phase: "3ª Fase", round: "Jogo de volta" };
for (let i = 27; i <= 64; i++) {
  // n27 = rodada 1 … but n28 is rodada 2 with earlier date; use data.round
  PHASE_ROUND[i] = { phase: null, round: null };
}

function phaseRoundFor(g) {
  const d = PHASE_ROUND[g.n] ?? { phase: null, round: null };
  return {
    phase: g.phase ?? d.phase,
    round: g.round ?? d.round,
  };
}

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

  for (const name of CREATE_MANAGERS) {
    let { rows } = await client.query(
      `SELECT id, name FROM managers WHERE lower(name)=lower($1)`,
      [name],
    );
    if (!rows[0]) {
      if (DRY) {
        console.log("would create manager", name);
      } else {
        ({ rows } = await client.query(
          `INSERT INTO managers (name) VALUES ($1) RETURNING id, name`,
          [name],
        ));
        console.log("+ manager", rows[0]);
      }
    }
  }

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
    if (DRY && CREATE_MANAGERS.some((n) => norm(n) === want)) {
      return { id: -1, name };
    }
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
      const preferSl = cityHint.includes("sao luis") || cityHint.includes("luis");
      const preferFort = cityHint.includes("fortaleza");
      if (preferSl) {
        const sl = hits.find(
          (s) =>
            norm(s.name).includes("sao luis") ||
            norm(s.name).includes("luis") ||
            norm(s.name).includes("castelao (sao"),
        );
        if (sl) return sl.id;
      }
      if (preferFort) {
        const ft = hits.find(
          (s) =>
            norm(s.name).includes("fortaleza") ||
            norm(s.name).includes("arena castelao"),
        );
        if (ft) return ft.id;
        if (hits.length === 1) return hits[0].id;
      }
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
        name.startsWith("Estádio") || name.startsWith("Estadio") || name.startsWith("Arena")
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
  const playerCache = new Map();
  async function resolvePlayer(name) {
    const key = norm(name);
    if (playerCache.has(key)) return playerCache.get(key);
    if (FORCE_ID[key]) {
      const { rows } = await client.query(`SELECT id, name FROM players WHERE id=$1`, [
        FORCE_ID[key],
      ]);
      if (!rows[0]) throw new Error(`FORCE_ID missing ${name}`);
      playerCache.set(key, rows[0]);
      return rows[0];
    }
    if (SPELL_TO_DB[key]) {
      const spellKey = norm(SPELL_TO_DB[key]);
      const hits = playersByNorm.get(spellKey) ?? [];
      if (hits.length === 1) {
        playerCache.set(key, hits[0]);
        return hits[0];
      }
      const exact = allPlayers.find((p) => p.name === SPELL_TO_DB[key]);
      if (exact) {
        playerCache.set(key, exact);
        return exact;
      }
    }
    const direct = playersByNorm.get(key) ?? [];
    if (direct.length === 1) {
      playerCache.set(key, direct[0]);
      return direct[0];
    }
    if (direct.length > 1) {
      throw new Error(
        `player ambiguous: ${name} → ${direct.map((p) => `#${p.id} ${p.name}`).join(", ")}`,
      );
    }
    throw new Error(`player unresolved: ${name}`);
  }

  // Dry-run: resolve all names first
  {
    const names = new Set();
    for (const g of GAMES) {
      resolveManager(g.mgr);
      for (const s of g.starters) names.add(s);
      for (const [a, b] of g.subs) {
        names.add(a);
        names.add(b);
      }
      for (const x of g.goals) names.add(x.p);
    }
    for (const n of names) await resolvePlayer(n);
    console.log(`resolved ${names.size} players, managers ok`);
  }

  const { rows: dbMatches } = await client.query(`
    SELECT m.id, m.match_date::text AS d, o.name AS opp, c.name AS comp, m.home_away,
           m.goals_for, m.goals_against
    FROM matches m
    JOIN opponents o ON o.id=m.opponent_id
    JOIN competitions c ON c.id=m.competition_id
    WHERE m.season=$1 AND m.is_friendly=false
  `, [SEASON]);

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
      g.comp === "Alagoano" || g.comp === "Seletiva CdB"
        ? "alagoano"
        : g.comp === "Nordeste"
          ? "nordeste"
          : g.comp === "Copa do Brasil"
            ? "copa do brasil"
            : "serie b";
    // Seletiva still stored as Alagoano until reassigned
    const byComp = (hit.length ? hit : sameDate).filter((m) => {
      const cn = norm(m.comp);
      if (g.comp === "Seletiva CdB") return cn.includes("alagoano") || cn.includes("seletiva");
      return cn.includes(compHint);
    });
    if (byComp.length === 1) return byComp[0];
    // score fallback
    const byScore = (hit.length ? hit : sameDate).filter(
      (m) => Number(m.goals_for) === g.gf && Number(m.goals_against) === g.ga,
    );
    if (byScore.length === 1) return byScore[0];
    throw new Error(
      `match not found n=${g.n} ${g.date} ${g.opp} candidates=${sameDate.map((m) => m.id + ":" + m.opp + ":" + m.comp).join(",")}`,
    );
  }

  const applied = [];

  for (const g of GAMES) {
    const match = findMatch(g);
    const mgr = resolveManager(g.mgr);
    const ref = await resolveRef(g.ref);
    const stadiumId = await resolveStadium(g.stadium, g.cityUf);
    const pr = phaseRoundFor(g);
    const og = ownGoalsCount(g);
    const competitionId = g.comp === "Seletiva CdB" ? SELETIVA_COMP_ID : null;

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
           penalties_for=$10,
           penalties_against=$11,
           own_goals_for_count=$12,
           scorers=$13,
           competition_id=COALESCE($14, competition_id)
         WHERE id=$1`,
        [
          match.id,
          mgr.id,
          ref.id > 0 ? ref.id : null,
          stadiumId,
          g.att ?? null,
          g.attP ?? null,
          g.renda ?? null,
          pr.phase,
          pr.round,
          g.pensFor ?? null,
          g.pensAgainst ?? null,
          og,
          scorersText(g),
          competitionId,
        ],
      );

      await client.query(`DELETE FROM match_goals WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_cards WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_substitutions WHERE match_id=$1`, [match.id]);
      await client.query(`DELETE FROM match_lineups WHERE match_id=$1 AND side='csa'`, [match.id]);

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
      for (const [, inn] of g.subs) {
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

      for (const goal of g.goals) {
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

      for (const [outName, inName] of g.subs) {
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
      date: g.date,
      opp: g.opp,
      mgr: mgr.name,
      goals: g.goals.length,
      subs: g.subs.length,
      og,
    });
    console.log(
      `* n=${g.n} #${match.id} ${g.date} ${g.opp} mgr=${mgr.name} goals=${g.goals.length} subs=${g.subs.length} og=${og}`,
    );
  }

  const relatedPairs = [
    [8, 9],
    [10, 11],
    [12, 13],
    [25, 26],
  ];
  for (const [a, b] of relatedPairs) {
    const ida = applied.find((x) => x.n === a);
    const volta = applied.find((x) => x.n === b);
    if (ida && volta && !DRY) {
      await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
        ida.matchId,
        volta.matchId,
      ]);
      await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
        volta.matchId,
        ida.matchId,
      ]);
      console.log(`* related ${ida.matchId}↔${volta.matchId}`);
    }
  }

  if (!DRY) {
    const { rows: sheetStats } = await client.query(`
      WITH apps AS (
        SELECT ml.player_id,
          count(DISTINCT ml.match_id)::int AS appearances
        FROM match_lineups ml
        JOIN matches m ON m.id=ml.match_id
        WHERE m.season=$1 AND ml.side='csa' AND ml.player_id IS NOT NULL
          AND (
            ml.role='starter'
            OR EXISTS (
              SELECT 1 FROM match_substitutions s
              WHERE s.match_id=ml.match_id AND s.side='csa'
                AND s.player_in_id=ml.player_id
            )
          )
        GROUP BY ml.player_id
      ),
      goals AS (
        SELECT mg.scorer_player_id AS player_id, count(*)::int AS goals
        FROM match_goals mg
        JOIN matches m ON m.id=mg.match_id
        WHERE m.season=$1 AND mg.side='csa' AND mg.is_own_goal=false
          AND mg.scorer_player_id IS NOT NULL
        GROUP BY mg.scorer_player_id
      )
      SELECT a.player_id, a.appearances, coalesce(g.goals,0) AS goals
      FROM apps a
      LEFT JOIN goals g ON g.player_id=a.player_id
    `, [SEASON]);
    let upserted = 0;
    for (const s of sheetStats) {
      const { rows: cur } = await client.query(
        `SELECT id FROM player_season_stats WHERE player_id=$1 AND season=$2`,
        [s.player_id, SEASON],
      );
      if (cur[0]) {
        await client.query(
          `UPDATE player_season_stats SET appearances=$2, goals=$3 WHERE id=$1`,
          [cur[0].id, s.appearances, s.goals],
        );
      } else {
        await client.query(
          `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
           VALUES ($1,$2,$3,$4,0)`,
          [s.player_id, SEASON, s.appearances, s.goals],
        );
      }
      upserted += 1;
    }
    console.log(`roster sync rows ${upserted}`);
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
