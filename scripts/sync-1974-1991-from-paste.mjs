/**
 * Sync CSA matches 1974–1991 from pasted list (priority for dates/scores).
 * - Creates missing competitions / opponents / matches
 * - Amistosos: is_friendly=true (excluded from stats); scorers text only (no lineups in source)
 * - User score overrides applied
 *
 * Usage: node scripts/sync-1974-1991-from-paste.mjs [--dry]
 */
import fs from "fs";
import path from "path";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const DRY = process.argv.includes("--dry");
const pool = createPgPool();
const client = await pool.connect();

const PASTE_FILE = path.resolve("scripts/data/_paste-1974-1991.tsv");

const MONTHS = {
  jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06",
  jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12",
};

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseDate(raw) {
  const m = String(raw).trim().match(/^(\d{1,2})\/([a-z]{3})\/(\d{4})$/i);
  if (!m) return null;
  const mm = MONTHS[m[2].toLowerCase()];
  if (!mm) return null;
  return `${m[3]}-${mm}-${m[1].padStart(2, "0")}`;
}

function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function venueToHa(v) {
  if (v === "C") return "home";
  if (v === "F") return "away";
  return "neutral";
}

function resultFrom(gf, ga, letter, walkover, woSide) {
  if (walkover) return woSide === "csa" ? "win" : "loss";
  if (letter === "v") return "win";
  if (letter === "e") return "draw";
  if (letter === "d") return "loss";
  if (gf == null || ga == null) return "draw";
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
}

function scorersText(raw) {
  let t = String(raw ?? "").trim();
  if (!t) return null;
  const dash = t.split(/\s+-\s+/);
  t = dash[0].trim();
  if (/^\(.*\)$/.test(t)) return null;
  if (/^o csa nao compareceu/i.test(norm(t))) return null;
  t = t
    .replace(/\s*\([^)]*encerrado[^)]*\)\s*$/i, "")
    .replace(/\s*\([^)]*substituicao[^)]*\)\s*$/i, "")
    .replace(/\s*\([^)]*resultado determinado[^)]*\)\s*$/i, "")
    .trim();
  if (!t) return null;
  // Normalize "A e B" → "A, B" for storage consistency
  return t.replace(/\s+e\s+/gi, ", ");
}

function stateFromOpp(name) {
  const m = String(name).trim().match(/-([A-Z]{2})$/i);
  return m ? m[1].toUpperCase() : null;
}

/** Existing DB opponent preferred name */
const OPP_ALIAS = {
  "internacional de limeira sp": "Inter de Limeira-SP",
  "atletico pr": "Athletico-PR",
  "ceub df": "Ceub-DF",
  "portuguesa de desportos sp": "Portuguesa-SP",
  "santa cruz de penedo al": "Santa Cruz-AL",
  "operario de campo grande mt": "Operário-MS",
  "potiguar de mossoro rn": "Potiguar-RN",
  "cruzeiro al": "Cruzeiro de Arapiraca-AL",
  "botafogo de salvador ba": "Botafogo de Salvador-BA",
  "botafogo de ribeirao preto sp": "Botafogo de Ribeirão Preto-SP",
  "comercial de ribeirao preto sp": "Comercial de Ribeirão Preto-SP",
  "comercial de campo grande ms": "Comercial de Campo Grande-MS",
  "guarany de sobral ce": "Guarany de Sobral-CE",
  "estudantes de timbauba pe": "Estudantes de Timbaúba-PE",
  "fluminense de feira ba": "Fluminense de Feira-BA",
  "operario de campo grande mt": "Operário-MS",
  "desportiva es": "Desportiva-ES",
  "xv de piracicaba sp": "XV de Piracicaba-SP",
  "comb itabaiana se sergipe se": "Combinado Itabaiana-SE/Sergipe-SE",
  "porto por": "Porto-POR",
  "ypiranga ba": "Ypiranga-BA",
  "vasco se": "Vasco-SE",
  "vasco da gama al": "Vasco-SE",
};

function oppLoose(name) {
  // Keep state/country suffix so Porto-POR ≠ Porto-PE
  return norm(name)
    .replace(/\bde desportos\b/g, "")
    .replace(/\bde campo grande\b/g, "")
    .replace(/\bde salvador\b/g, "")
    .replace(/\bde ribeirao preto\b/g, "")
    .replace(/\bde mossoro\b/g, "")
    .replace(/\bde sobral\b/g, "")
    .replace(/\bde timbauba\b/g, "")
    .replace(/\bde feira\b/g, "")
    .replace(/\bde arapiraca\b/g, "")
    .replace(/\binternacional de limeira\b/g, "inter de limeira")
    .replace(/\batletico pr\b/g, "athletico pr")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Map paste competition → { name, type, friendly }
 */
function mapCompetition(raw) {
  const n = norm(raw);
  if (n === "amistoso") {
    return { name: "Amistoso", type: "friendly", friendly: true };
  }
  if (n.startsWith("torneio inicio")) {
    return { name: "Torneio Início de Alagoas", type: "friendly", friendly: true };
  }
  if (n === "alagoano" || n.startsWith("alagoano ")) {
    return { name: "Campeonato Alagoano", type: "state", friendly: false };
  }
  if (n === "copa do brasil") {
    return { name: "Copa do Brasil", type: "national", friendly: false };
  }
  if (n.includes("taca de prata") || n.includes("2a divisao") || n.includes("2 divisao")) {
    return { name: "Taça de Prata", type: "national", friendly: false };
  }
  if (n.includes("serie b")) {
    return { name: "Campeonato Brasileiro Série B", type: "national", friendly: false };
  }
  if (n.includes("3a divisao") || n.includes("3 divisao")) {
    return { name: "Campeonato Brasileiro 3ª Divisão", type: "national", friendly: false };
  }
  if (n.includes("modulo amarelo")) {
    return { name: "Campeonato Brasileiro Módulo Amarelo", type: "national", friendly: false };
  }
  if (n.includes("divisao especial")) {
    return { name: "Campeonato Brasileiro Divisão Especial", type: "national", friendly: false };
  }
  if (n.includes("alagoas paraiba")) {
    return { name: "Torneio Alagoas-Paraíba", type: "regional", friendly: false };
  }
  if (n.includes("torneio seletivo") && n.includes("cbf")) {
    return { name: "Torneio Seletivo Taça CBF", type: "national", friendly: false };
  }
  if (n.includes("torneio seletivo")) {
    return { name: "Torneio Seletivo Brasileiro", type: "national", friendly: false };
  }
  if (n.includes("antonio bayma")) {
    return { name: "Torneio Antônio Bayma", type: "regional", friendly: false };
  }
  if (n.includes("jose americo")) {
    return { name: "Torneio José Américo de Almeida Filho", type: "regional", friendly: false };
  }
  if (n.includes("divaldo suruagy")) {
    return { name: "Torneio Divaldo Suruagy", type: "state", friendly: false };
  }
  if (
    n.includes("brasileiro") ||
    n.includes("nacional") ||
    n.includes("copa brasil") ||
    n.includes("taca de ouro")
  ) {
    return { name: "Taça de Ouro", type: "national", friendly: false };
  }
  return { name: String(raw).trim(), type: "other", friendly: false };
}

/** Explicit user corrections (paste priority + spoken overrides). */
const SCORE_OVERRIDE = {
  // list 4x0
  "1975-05-29|santa cruz": { gf: 4, ga: 0, scorers: "Ferretti (2), Sérgio, Maurício" },
  // user: 2x1 (campo), not STJD 0x1
  "1984-06-05|asa": { gf: 2, ga: 1, result: "win", scorers: "Jacozinho, Frazão" },
  // list 1x1
  "1984-08-26|penedense": { gf: 1, ga: 1, scorers: "Luisão" },
  "1987-07-26|penedense": { gf: 1, ga: 1 },
  // list CSA 2x0 Comercial (casa)
  "1991-05-05|comercial": {
    gf: 2,
    ga: 0,
    homeAway: "home",
    scorers: "Neném, Chico",
    result: "win",
  },
  // list 2x1
  "1991-06-09|cruzeiro": { gf: 2, ga: 1, scorers: "Haroldo, Ivan" },
  // CSE 0x1 CSA in ET (volta); ida 18/07 2x2
  "1991-07-21|cse": {
    gf: 1,
    ga: 0,
    scorers: "Rinaldo",
    result: "win",
    phase: "Semifinal 2º turno",
    round: "Volta",
    relateDate: "1991-07-18",
  },
};

function overrideKey(date, opp) {
  const o = oppLoose(opp);
  if (o.includes("santa cruz")) return `${date}|santa cruz`;
  if (o.includes("asa")) return `${date}|asa`;
  if (o.includes("penedense")) return `${date}|penedense`;
  if (o.includes("comercial")) return `${date}|comercial`;
  if (o.includes("cruzeiro")) return `${date}|cruzeiro`;
  if (o === "cse" || o.startsWith("cse ")) return `${date}|cse`;
  return null;
}

function parsePaste(file) {
  const text = fs.readFileSync(file, "utf8");
  const games = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("Nº") || line.startsWith("No")) continue;
    const cols = line.split("\t");
    if (cols.length < 9) continue;
    const num = Number(String(cols[0]).replace(/\./g, ""));
    if (!Number.isFinite(num)) continue;
    const date = parseDate(cols[1]);
    const competitionRaw = cols[2].trim();
    const venue = cols[3].trim();
    const gfS = String(cols[5] ?? "").trim().toUpperCase();
    const gaS = String(cols[7] ?? "").trim().toUpperCase();
    const walkover = gfS === "WO" || gaS === "WO";
    const woSide = gfS === "WO" ? "csa" : gaS === "WO" ? "opp" : null;
    let gf = walkover ? (woSide === "csa" ? 1 : 0) : gfS === "" ? null : Number(gfS);
    let ga = walkover ? (woSide === "csa" ? 0 : 1) : gaS === "" ? null : Number(gaS);
    if (!walkover && !Number.isFinite(gf)) gf = null;
    if (!walkover && !Number.isFinite(ga)) ga = null;
    const opponent = cols[8].trim();
    const golsRaw = cols[9] ?? "";
    const letter = String(cols[10] ?? "").trim().toLowerCase();
    const mapped = mapCompetition(competitionRaw);
    const ov = SCORE_OVERRIDE[overrideKey(date, opponent) ?? ""];
    if (ov) {
      if (ov.gf != null) gf = ov.gf;
      if (ov.ga != null) ga = ov.ga;
    }
    const homeAway = ov?.homeAway ?? venueToHa(venue);
    const scorers = ov?.scorers ?? scorersText(golsRaw);
    const result = ov?.result ?? resultFrom(gf, ga, letter, walkover, woSide);
    const desconsiderado = /desconsiderado/i.test(competitionRaw);
    games.push({
      num,
      date,
      season: date ? date.slice(0, 4) : null,
      competitionRaw,
      mapped,
      homeAway,
      gf,
      ga,
      walkover,
      opponent,
      opponentCanon: OPP_ALIAS[norm(opponent)] ?? opponent,
      scorers,
      result,
      phase: ov?.phase ?? (desconsiderado ? "Desconsiderado" : null),
      round: ov?.round ?? null,
      relateDate: ov?.relateDate ?? null,
      golsRaw,
    });
  }
  return games;
}

const created = { competitions: [], opponents: [], matches: [] };
const updated = [];
const linked = [];

async function ensureCompetition(name, type) {
  const { rows } = await client.query(`SELECT id, name FROM competitions WHERE name=$1`, [name]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM competitions`);
  const hit = all.find((c) => norm(c.name) === norm(name));
  if (hit) return hit;
  if (DRY) {
    const stub = { id: -created.competitions.length - 1, name };
    created.competitions.push(name);
    console.log("COMP_WOULD_CREATE", name, type);
    return stub;
  }
  const ins = await client.query(
    `INSERT INTO competitions (name, type) VALUES ($1,$2) RETURNING id, name`,
    [name, type],
  );
  created.competitions.push(name);
  console.log("COMP_CREATED", ins.rows[0]);
  return ins.rows[0];
}

async function ensureOpponent(name) {
  const canon = OPP_ALIAS[norm(name)] ?? name;
  let { rows } = await client.query(`SELECT id, name FROM opponents WHERE name=$1`, [canon]);
  if (rows[0]) return rows[0];
  const { rows: all } = await client.query(`SELECT id, name FROM opponents`);
  const byNorm = all.find((o) => norm(o.name) === norm(canon));
  if (byNorm) return byNorm;
  const loose = oppLoose(canon);
  const soft = all.find((o) => oppLoose(o.name) === loose);
  if (soft) return soft;
  if (DRY) {
    const stub = { id: -created.opponents.length - 1, name: canon };
    created.opponents.push(canon);
    console.log("OPP_WOULD_CREATE", canon);
    return stub;
  }
  const state = stateFromOpp(canon);
  const country = state === "POR" || /-POR$/i.test(canon) ? "Portugal" : "Brasil";
  const ins = await client.query(
    `INSERT INTO opponents (name, state, country) VALUES ($1,$2,$3) RETURNING id, name`,
    [canon, state === "POR" ? null : state, country],
  );
  created.opponents.push(canon);
  console.log("OPP_CREATED", ins.rows[0]);
  return ins.rows[0];
}

function parsePasteScorerNames(scorers) {
  if (!scorers) return [];
  const names = [];
  for (const part of String(scorers).split(/,\s*/)) {
    const p = part.trim();
    if (!p) continue;
    if (/\(contra\)|\(gc\)/i.test(p)) continue;
    const m = p.match(/^(.+?)\s*\((\d+)\)\s*$/);
    if (m) {
      const n = Number(m[2]);
      for (let i = 0; i < n; i++) names.push(m[1].trim());
    } else names.push(p);
  }
  return names;
}

async function findPlayerId(name, season) {
  const key = norm(name);
  const aliases = {
    rinaldo: ["Rinaldo Daniello", "Rinaldo"],
    nenem: ["Neném"],
    "neném": ["Neném"],
    chico: ["Chico"],
    luisao: ["Luisão"],
    "luisão": ["Luisão"],
  };
  const candidates = aliases[key] ?? [name];
  for (const c of candidates) {
    const { rows } = await client.query(
      `SELECT p.id FROM players p
       JOIN player_season_stats pss ON pss.player_id=p.id
       WHERE p.name=$1 AND pss.season::text=$2
       ORDER BY p.id LIMIT 1`,
      [c, season],
    );
    if (rows[0]) return rows[0].id;
  }
  for (const c of candidates) {
    const { rows } = await client.query(
      `SELECT id FROM players WHERE name=$1 ORDER BY id LIMIT 1`,
      [c],
    );
    if (rows[0]) return rows[0].id;
  }
  return null;
}

async function replaceCsaGoals(matchId, season, scorers, friendly) {
  if (friendly) return; // never count friendly goals into player stats
  if (DRY) return;
  await client.query(`DELETE FROM match_goals WHERE match_id=$1 AND side='csa'`, [matchId]);
  const names = parsePasteScorerNames(scorers);
  for (const name of names) {
    const pid = await findPlayerId(name, season);
    await client.query(
      `INSERT INTO match_goals
         (match_id, side, scorer_lineup_id, scorer_player_id, scorer_name,
          minute, injury_time_minute, is_penalty, is_own_goal)
       VALUES ($1,'csa',NULL,$2,$3,$4,NULL,false,false)`,
      [matchId, pid, name, name.toLowerCase().includes("rinaldo") && season === "1991" ? 97 : 0],
    );
  }
}

try {
  if (!DRY) await client.query("BEGIN");

  const paste = parsePaste(PASTE_FILE);
  console.log("pasteGames", paste.length);

  // Ensure seasons exist
  const seasons = [...new Set(paste.map((g) => g.season).filter(Boolean))];
  for (const y of seasons) {
    if (!DRY) {
      await client.query(`INSERT INTO seasons (year) VALUES ($1) ON CONFLICT (year) DO NOTHING`, [
        Number(y),
      ]);
    }
  }

  const { rows: dbRows } = await client.query(`
    SELECT m.id, m.match_date::date::text AS d, m.season::text AS season,
           m.opponent_id, o.name AS opp, m.goals_for AS gf, m.goals_against AS ga,
           m.home_away, m.competition_id, c.name AS comp,
           m.scorers, m.result, m.is_friendly, m.is_walkover, m.phase, m.round,
           m.related_match_id
    FROM matches m
    JOIN opponents o ON o.id=m.opponent_id
    JOIN competitions c ON c.id=m.competition_id
    WHERE m.match_date >= '1974-01-01' AND m.match_date <= '1991-12-31'
    ORDER BY m.match_date, m.id
  `);

  const dbById = new Map(dbRows.map((r) => [r.id, { ...r, used: false }]));
  const dbList = [...dbById.values()];

  function oppMatch(a, b) {
    const ol = oppLoose(a);
    const or_ = oppLoose(b);
    if (!ol || !or_) return false;
    if (ol === or_) return true;
    // Avoid tiny false positives (e.g. "porto" matching wrong state)
    if (ol.length >= 5 && or_.length >= 5 && (ol.includes(or_) || or_.includes(ol))) {
      return true;
    }
    return false;
  }

  function sameScore(g, r) {
    if (g.walkover) return !!r.is_walkover;
    if (g.gf == null || g.ga == null) return false;
    return r.gf === g.gf && r.ga === g.ga;
  }

  function findDb(g) {
    const unused = () => dbList.filter((r) => !r.used);

    // 1) Exact date + opponent (+ prefer same score)
    {
      const cands = unused().filter((r) => r.d === g.date && oppMatch(r.opp, g.opponentCanon));
      const scored = cands.find((r) => sameScore(g, r));
      if (scored) return scored;
      // score override cases: same date+opp even if score differs
      if (cands.length && SCORE_OVERRIDE[overrideKey(g.date, g.opponent) ?? ""]) {
        return cands[0];
      }
    }

    // 2) ±1 / ±2 / ±3 days + opponent + SAME score (date priority shifts)
    for (const delta of [1, -1, 2, -2, 3, -3]) {
      const d = addDays(g.date, delta);
      const hit = unused().find(
        (r) => r.d === d && oppMatch(r.opp, g.opponentCanon) && sameScore(g, r),
      );
      if (hit) return hit;
    }

    // 3) Exact date alone if single unused match that day with same score (rare)
    {
      const cands = unused().filter((r) => r.d === g.date && sameScore(g, r));
      if (cands.length === 1) return cands[0];
    }

    return null;
  }

  const compCache = new Map();
  async function compFor(g) {
    const key = g.mapped.name;
    if (!compCache.has(key)) {
      compCache.set(key, await ensureCompetition(g.mapped.name, g.mapped.type));
    }
    return compCache.get(key);
  }

  for (const g of paste) {
    if (!g.date) continue;
    const comp = await compFor(g);
    const opp = await ensureOpponent(g.opponentCanon);
    const existing = findDb(g);

    if (existing) {
      existing.used = true;
      const patch = {
        date: g.date,
        season: g.season,
        gf: g.gf,
        ga: g.ga,
        result: g.result,
        homeAway: g.homeAway,
        competitionId: comp.id,
        opponentId: opp.id,
        scorers: g.scorers,
        isFriendly: g.mapped.friendly,
        isWalkover: g.walkover,
        phase: g.phase ?? existing.phase,
        round: g.round ?? existing.round,
      };
      const changed =
        existing.d !== patch.date ||
        existing.gf !== patch.gf ||
        existing.ga !== patch.ga ||
        existing.result !== patch.result ||
        existing.home_away !== patch.homeAway ||
        existing.competition_id !== patch.competitionId ||
        existing.opponent_id !== patch.opponentId ||
        (existing.scorers ?? null) !== (patch.scorers ?? null) ||
        !!existing.is_friendly !== patch.isFriendly ||
        !!existing.is_walkover !== patch.isWalkover ||
        (g.phase && existing.phase !== g.phase) ||
        (g.round && existing.round !== g.round);

      if (changed) {
        if (!DRY) {
          await client.query(
            `UPDATE matches SET
               match_date=$2, season=$3, goals_for=$4, goals_against=$5, result=$6,
               home_away=$7, competition_id=$8, opponent_id=$9, scorers=$10,
               is_friendly=$11, is_walkover=$12, phase=$13, round=$14
             WHERE id=$1`,
            [
              existing.id,
              patch.date,
              patch.season,
              patch.gf,
              patch.ga,
              patch.result,
              patch.homeAway,
              patch.competitionId,
              patch.opponentId,
              patch.scorers,
              patch.isFriendly,
              patch.isWalkover,
              patch.phase,
              patch.round,
            ],
          );
          // Rebuild CSA goals for key score overrides / when gf changed on official games
          const ovKey = overrideKey(g.date, g.opponent);
          if (ovKey && SCORE_OVERRIDE[ovKey] && !patch.isFriendly) {
            await replaceCsaGoals(existing.id, g.season, patch.scorers, false);
          }
        }
        updated.push({
          id: existing.id,
          num: g.num,
          from: `${existing.d} ${existing.gf}x${existing.ga} ${existing.opp}`,
          to: `${patch.date} ${patch.gf}x${patch.ga} ${opp.name} [${comp.name}]`,
        });
      }

      if (g.relateDate && !DRY) {
        const rel = dbList.find(
          (r) =>
            r.d === g.relateDate &&
            (oppLoose(r.opp) === oppLoose(g.opponent) ||
              oppLoose(r.opp).includes("cse") ||
              g.relateDate === r.d),
        );
        // Prefer CSE on relateDate
        const relCse =
          dbList.find(
            (r) => r.d === g.relateDate && oppLoose(r.opp).includes("cse"),
          ) ?? rel;
        if (relCse && relCse.id !== existing.id) {
          await client.query(`UPDATE matches SET related_match_id=$2 WHERE id=$1`, [
            existing.id,
            relCse.id,
          ]);
          await client.query(`UPDATE matches SET related_match_id=$2, round=COALESCE(round,'Ida') WHERE id=$1`, [
            relCse.id,
            existing.id,
          ]);
          linked.push([existing.id, relCse.id]);
        }
      }
      continue;
    }

    // Insert missing
    if (DRY) {
      created.matches.push({
        num: g.num,
        date: g.date,
        comp: comp.name,
        opp: opp.name,
        score: g.walkover ? "WO" : `${g.gf}x${g.ga}`,
        friendly: g.mapped.friendly,
      });
      console.log(
        "MATCH_WOULD_CREATE",
        g.num,
        g.date,
        comp.name,
        opp.name,
        g.walkover ? "WO" : `${g.gf}x${g.ga}`,
        g.mapped.friendly ? "friendly" : "",
      );
      continue;
    }

    const { rows: ins } = await client.query(
      `INSERT INTO matches (
         match_date, season, opponent_id, goals_for, goals_against, result,
         home_away, competition_id, scorers, is_walkover, is_friendly, status, phase, round
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'played',$12,$13)
       RETURNING id`,
      [
        g.date,
        g.season,
        opp.id,
        g.gf,
        g.ga,
        g.result,
        g.homeAway,
        comp.id,
        g.scorers,
        g.walkover,
        g.mapped.friendly,
        g.phase,
        g.round,
      ],
    );
    created.matches.push({
      id: ins[0].id,
      num: g.num,
      date: g.date,
      comp: comp.name,
      opp: opp.name,
      friendly: g.mapped.friendly,
    });

    if (!g.mapped.friendly && g.scorers && g.gf > 0) {
      await replaceCsaGoals(ins[0].id, g.season, g.scorers, false);
    }
  }

  // Refresh season_competition_stats for non-friendly comps touched
  if (!DRY) {
    const { rows: pairs } = await client.query(`
      SELECT DISTINCT season::text AS season, competition_id
      FROM matches
      WHERE match_date >= '1974-01-01' AND match_date <= '1991-12-31'
        AND coalesce(is_friendly,false)=false
    `);
    for (const p of pairs) {
      const { rows: agg } = await client.query(
        `SELECT
           count(*)::int AS games,
           count(*) FILTER (WHERE result='win')::int AS wins,
           count(*) FILTER (WHERE result='draw')::int AS draws,
           count(*) FILTER (WHERE result='loss')::int AS losses,
           coalesce(sum(goals_for),0)::int AS goals_for,
           coalesce(sum(goals_against),0)::int AS goals_against
         FROM matches
         WHERE season::text=$1 AND competition_id=$2
           AND coalesce(is_friendly,false)=false
           AND coalesce(is_walkover,false)=false
           AND coalesce(status,'played')='played'`,
        [p.season, p.competition_id],
      );
      const a = agg[0];
      const ex = await client.query(
        `SELECT id FROM season_competition_stats WHERE season::text=$1 AND competition_id=$2`,
        [p.season, p.competition_id],
      );
      if (ex.rows[0]) {
        await client.query(
          `UPDATE season_competition_stats SET
             games=$1,wins=$2,draws=$3,losses=$4,goals_for=$5,goals_against=$6,
             stats_source='calculated', stats_recalculated_at=now()
           WHERE id=$7`,
          [a.games, a.wins, a.draws, a.losses, a.goals_for, a.goals_against, ex.rows[0].id],
        );
      } else {
        await client.query(
          `INSERT INTO season_competition_stats
             (season, competition_id, games, wins, draws, losses, goals_for, goals_against,
              stats_source, stats_recalculated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'calculated',now())`,
          [
            p.season,
            p.competition_id,
            a.games,
            a.wins,
            a.draws,
            a.losses,
            a.goals_for,
            a.goals_against,
          ],
        );
      }
    }
  }

  if (!DRY) await client.query("COMMIT");

  console.log(DRY ? "DRY OK" : "OK");
  console.log(
    JSON.stringify(
      {
        updated: updated.length,
        createdComps: created.competitions,
        createdOpponents: created.opponents.length,
        createdMatches: created.matches.length,
        createdFriendlies: created.matches.filter((m) => m.friendly).length,
        linked: linked.length,
      },
      null,
      2,
    ),
  );
  console.log("updatedSample", updated.slice(0, 40));
  console.log(
    "createdMatchSample",
    created.matches.slice(0, 30),
  );
} catch (e) {
  if (!DRY) await client.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
