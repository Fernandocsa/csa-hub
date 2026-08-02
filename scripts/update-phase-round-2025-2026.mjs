/**
 * Update phase/round for CSA matches 2025–2026 from Sofascore events + CBF naming.
 * Also fixes Uberlândia ida season typo and normalizes knockout labels.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const __dirname = dirname(fileURLToPath(import.meta.url));
const events = JSON.parse(
  readFileSync(join(__dirname, "data/_sofascore-2025-2026-events.json"), "utf8"),
);
const sfEvents = (events.events || events).filter(
  (e) => e.uniqueTournament !== "Club Friendly Games" && e.status !== "notstarted",
);

function stripTeam(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/clube de regatas brasil/g, " crb ")
    .replace(/\b(fc|sc|ec|ac|saf|u23)\b/g, " ")
    .replace(/b u23/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function oppKey(name) {
  let s = stripTeam(name);
  // Drop UF suffixes from DB ("Murici-AL" → murici)
  s = s.replace(/\b(al|ba|ce|go|ma|mg|pa|pb|pe|pr|rj|rn|rs|sc|se|sp)\b$/i, "").trim();
  const aliases = [
    [/barcelona.*/, "barcelona"],
    [/maracana.*/, "maracana"],
    [/\bigaci.*/, "igaci"],
    [/murici.*/, "murici"],
    [/coruripe.*/, "coruripe"],
    [/\bcrb\b.*/, "crb"],
    [/\basa\b.*/, "asa"],
    [/\bcse\b.*/, "cse"],
    [/penedense.*/, "penedense"],
    [/dimensao.*/, "dimensao"],
    [/zumbi.*/, "zumbi"],
    [/confianca.*/, "confianca"],
    [/ceara.*/, "ceara"],
    [/sampaio.*/, "sampaio"],
    [/nautico.*/, "nautico"],
    [/juazeirense.*/, "juazeirense"],
    [/bahia\b.*/, "bahia"],
    [/america.*/, "america"],
    [/ferroviario.*/, "ferroviario"],
    [/boavista.*/, "boavista"],
    [/tuna.*/, "tuna"],
    [/gremio.*/, "gremio"],
    [/vasco.*/, "vasco"],
    [/anapolis.*/, "anapolis"],
    [/\babc\b.*/, "abc"],
    [/ypiranga.*/, "ypiranga"],
    [/maringa.*/, "maringa"],
    [/tombense.*/, "tombense"],
    [/sao bernardo.*/, "saobernardo"],
    [/floresta.*/, "floresta"],
    [/guarani.*/, "guarani"],
    [/caxias.*/, "caxias"],
    [/retro.*/, "retro"],
    [/figueirense.*/, "figueirense"],
    [/londrina.*/, "londrina"],
    [/botafogo.*/, "botafogo"],
    [/itabaiana.*/, "itabaiana"],
    [/ituano.*/, "ituano"],
    [/ponte preta.*/, "pontepreta"],
    [/brusque.*/, "brusque"],
    [/cruzeiro.*/, "cruzeiro"],
    [/joinville.*/, "joinville"],
    [/atletico.*/, "atletico"],
    [/jacuipense.*/, "jacuipense"],
    [/lagarto.*/, "lagarto"],
    [/betim.*/, "betim"],
    [/sao luiz.*/, "saoluiz"],
    [/uberlandia.*/, "uberlandia"],
    [/coruripe.*/, "coruripe"],
  ];
  for (const [re, key] of aliases) {
    if (re.test(s)) return key;
  }
  return s.split(" ")[0];
}

function dayMs(d) {
  return Date.parse(String(d).slice(0, 10) + "T12:00:00Z");
}

function rodada(n) {
  return `${n}ª rodada`;
}

function legRound(sfHome, sfAway, dbHomeAway, forceUnique = false) {
  if (forceUnique) return "Jogo único";
  // Two-legged: infer ida/volta by pairing later; for single event use home/away heuristic
  return null;
}

/** Map Sofascore event → { phase, roundHint } — round may be refined for legs */
function mapFromSofascore(ev, compName) {
  const ut = ev.uniqueTournament || "";
  const tour = ev.tournament || "";
  const rn = ev.roundName || "";
  const r = ev.round;

  // --- Copa do Nordeste ---
  if (ut === "Copa do Nordeste") {
    if (/Qualification/i.test(tour)) {
      return { phase: "Pré-Copa", round: r === 2 ? "2ª Fase" : "1ª Fase" };
    }
    if (/Knockout/i.test(tour)) {
      if (/Quarter/i.test(rn)) return { phase: "Quartas de final", round: "Jogo único" };
      if (/Semi/i.test(rn)) return { phase: "Semifinal", round: "Jogo único" };
      if (/Final/i.test(rn)) return { phase: "Final", round: "Jogo único" };
    }
    return { phase: "Fase de grupos", round: rodada(r) };
  }

  // --- Alagoano ---
  if (ut === "Alagoano") {
    if (/Playoffs/i.test(tour) || /Semi/i.test(rn)) {
      return { phase: "Semifinal", round: "__LEG__" };
    }
    if (/Cup Qualification/i.test(tour) || (/Final/i.test(rn) && /Qualification/i.test(tour))) {
      return { phase: "3º lugar", round: "__LEG__" };
    }
    return { phase: "1ª Fase", round: rodada(r) };
  }

  // --- Copa Alagoas ---
  if (ut === "Copa Alagoas") {
    if (/Knockout/i.test(tour)) {
      if (/Semi/i.test(rn)) return { phase: "Semifinal", round: "__LEG_OR_UNIQUE__" };
      if (/Final/i.test(rn)) return { phase: "Final", round: "Jogo único" };
    }
    return { phase: "Fase de grupos", round: rodada(r) };
  }

  // --- Copa do Brasil ---
  if (/Copa Betano do Brasil|Copa do Brasil/i.test(ut)) {
    if (/Round of 16/i.test(rn)) return { phase: "Oitavas de final", round: "__LEG__" };
    if (/Round 1/i.test(rn) || r === 1) return { phase: "1ª Fase", round: "Jogo único" };
    if (/Round 2/i.test(rn) || r === 2) return { phase: "2ª Fase", round: "Jogo único" };
    if (/Round 3/i.test(rn) || r === 3) return { phase: "3ª Fase", round: "__LEG_OR_UNIQUE__" };
  }

  // --- Série C ---
  if (/Série C/i.test(ut)) {
    return { phase: "Fase de grupos", round: rodada(r) };
  }

  // --- Série D ---
  if (/Série D/i.test(ut)) {
    if (/Knockout/i.test(tour)) {
      if (/Round of 64/i.test(rn)) return { phase: "2ª Fase", round: "__LEG__" };
      if (/Round of 32/i.test(rn)) return { phase: "3ª Fase", round: "__LEG__" };
      if (/Round of 16/i.test(rn)) return { phase: "Oitavas de final", round: "__LEG__" };
      if (/Quarter/i.test(rn)) return { phase: "Quartas de final", round: "__LEG__" };
      if (/Semi/i.test(rn)) return { phase: "Semifinal", round: "__LEG__" };
      if (/Final/i.test(rn)) return { phase: "Final", round: "__LEG__" };
    }
    return { phase: "Fase de grupos", round: rodada(r) };
  }

  return null;
}

function csaIsHome(ev) {
  return stripTeam(ev.home).includes("csa") && !stripTeam(ev.away).includes("csa");
}

function sfOpponent(ev) {
  return csaIsHome(ev) ? ev.away : ev.home;
}

function findSfEvent(match) {
  const wantOpp = oppKey(match.opp);
  const wantHa = match.home_away;
  const t0 = dayMs(match.d);
  let best = null;
  let bestScore = -1;
  for (const ev of sfEvents) {
    const opp = oppKey(sfOpponent(ev));
    if (opp !== wantOpp) continue;
    const dt = Math.abs(dayMs(ev.date) - t0);
    if (dt > 3 * 86400000) continue;
    const haOk = (wantHa === "home") === csaIsHome(ev);
    let score = 100 - dt / 86400000;
    if (haOk) score += 20;
    // Prefer same competition family
    const comp = (match.competition || "").toLowerCase();
    const ut = (ev.uniqueTournament || "").toLowerCase();
    if (comp.includes("nordeste") && ut.includes("nordeste")) score += 15;
    if (comp.includes("alagoano") && ut === "alagoano") score += 15;
    if (comp.includes("copa alagoas") && ut.includes("copa alagoas")) score += 15;
    if (comp.includes("copa do brasil") && ut.includes("brasil")) score += 15;
    if (comp.includes("série c") && ut.includes("série c")) score += 15;
    if (comp.includes("série d") && ut.includes("série d")) score += 15;
    if (score > bestScore) {
      bestScore = score;
      best = ev;
    }
  }
  return best;
}

function assignLegs(updates) {
  // Group by competition+phase+opponent for __LEG__ markers
  const groups = new Map();
  for (const u of updates) {
    if (u.round !== "__LEG__" && u.round !== "__LEG_OR_UNIQUE__") continue;
    const key = `${u.season}|${u.competition}|${u.phase}|${oppKey(u.opp)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(u);
  }
  for (const [, list] of groups) {
    list.sort((a, b) => dayMs(a.d) - dayMs(b.d) || a.id - b.id);
    if (list.length === 1) {
      const u = list[0];
      u.round = u.round === "__LEG_OR_UNIQUE__" || /Quartas de final|Semifinal|Final/i.test(u.phase)
        ? (u.phase === "3ª Fase" && /Copa do Brasil/i.test(u.competition) ? "Jogo único" : "Jogo único")
        : "Jogo único";
      // Copa do Brasil 3ª Fase Grêmio is two-legged — handled when length===2
      if (u.roundMarker === "__LEG__") u.round = "Jogo único";
    } else {
      for (let i = 0; i < list.length; i++) {
        list[i].round = i === 0 ? "Jogo de ida" : "Jogo de volta";
      }
    }
  }
  // Cleanup any remaining markers
  for (const u of updates) {
    if (u.round === "__LEG__" || u.round === "__LEG_OR_UNIQUE__") {
      u.round = "Jogo único";
    }
  }
}

const { rows: matches } = await pool.query(`
  SELECT m.id, m.match_date::text AS d, m.season, m.phase, m.round,
         o.name AS opp, c.name AS competition, m.home_away,
         m.goals_for, m.goals_against, m.status, m.related_match_id
  FROM matches m
  JOIN opponents o ON o.id = m.opponent_id
  JOIN competitions c ON c.id = m.competition_id
  WHERE (
      m.season IN ('2025', '2026')
      OR m.id IN (2271, 2273)
    )
    AND coalesce(m.is_friendly, false) = false
  ORDER BY m.match_date, m.id
`);

const updates = [];
const unmatched = [];

for (const m of matches) {
  // Manual / structural fixes first for known knockout already partially filled
  const manual = manualOverride(m);
  if (manual) {
    updates.push({ ...m, ...manual, source: "manual" });
    continue;
  }

  const ev = findSfEvent(m);
  if (!ev) {
    unmatched.push(m);
    continue;
  }
  const mapped = mapFromSofascore(ev, m.competition);
  if (!mapped) {
    unmatched.push(m);
    continue;
  }
  updates.push({
    ...m,
    phase: mapped.phase,
    round: mapped.round,
    source: `sf:${ev.sfId}:${ev.date}:${ev.roundName || "r" + ev.round}`,
  });
}

function manualOverride(m) {
  // Fix Uberlândia scheduled pair + season typo on #2271
  if (m.id === 2271) {
    return {
      phase: "Quartas de final",
      round: "Jogo de ida",
      seasonFix: "2026",
    };
  }
  if (m.id === 2273) {
    return { phase: "Quartas de final", round: "Jogo de volta" };
  }
  // Betim was wrongly labeled Oitavas
  if (/betim/i.test(m.opp) && m.season === "2026") {
    const isIda = m.home_away === "away";
    return {
      phase: "3ª Fase",
      round: isIda ? "Jogo de ida" : "Jogo de volta",
    };
  }
  // São Luiz = Oitavas
  if (/são luiz|sao luiz/i.test(m.opp) && m.season === "2026") {
    const isIda = m.home_away === "away";
    return {
      phase: "Oitavas de final",
      round: isIda ? "Jogo de ida" : "Jogo de volta",
    };
  }
  // Alagoano 2026 SF CRB — normalize Ida/Volta
  if (/crb/i.test(m.opp) && m.season === "2026" && /alagoano/i.test(m.competition) && /semi/i.test(m.phase || "")) {
    const isIda = m.home_away === "away";
    return {
      phase: "Semifinal",
      round: isIda ? "Jogo de ida" : "Jogo de volta",
    };
  }
  // Normalize Alagoano 2026 1ª RODADA casing only
  if (m.id === 1300) {
    return { phase: "1ª Fase", round: "1ª rodada" };
  }
  // Copa Alagoas 2025 SF already good — keep
  if (m.id === 1333) return { phase: "Semifinal", round: "Jogo de ida" };
  if (m.id === 1334) return { phase: "Semifinal", round: "Jogo de volta" };
  // Nordeste QF already good
  if (m.id === 1273) return { phase: "Quartas de final", round: "Jogo único" };
  return null;
}

assignLegs(updates);

// Copa Alagoas 2026 group: Sofascore round numbers are unordered — renumber chronologically
{
  const group = updates
    .filter(
      (u) =>
        /copa alagoas/i.test(u.competition) &&
        u.season === "2026" &&
        u.phase === "Fase de grupos",
    )
    .sort((a, b) => dayMs(a.d) - dayMs(b.d));
  group.forEach((u, i) => {
    u.round = rodada(i + 1);
    u.source = (u.source || "") + "|renumbered";
  });
}

const client = await pool.connect();
let changed = 0;
try {
  await client.query("BEGIN");
  for (const u of updates) {
    const phase = u.phase;
    const round = u.round;
    if (!phase || !round) continue;
    const same =
      (u.phase_old ?? matches.find((m) => m.id === u.id)?.phase) === phase &&
      (matches.find((m) => m.id === u.id)?.round) === round &&
      !u.seasonFix;
    const prev = matches.find((m) => m.id === u.id);
    const needs =
      prev.phase !== phase || prev.round !== round || Boolean(u.seasonFix);
    if (!needs) continue;

    if (u.seasonFix) {
      await client.query(
        `UPDATE matches SET phase=$1, round=$2, season=$3 WHERE id=$4`,
        [phase, round, u.seasonFix, u.id],
      );
    } else {
      await client.query(`UPDATE matches SET phase=$1, round=$2 WHERE id=$3`, [
        phase,
        round,
        u.id,
      ]);
    }
    changed++;
    console.log(
      `#${u.id} ${String(u.d).slice(0, 10)} ${u.opp}: ${prev.phase || "NULL"}/${prev.round || "NULL"} → ${phase}/${round} (${u.source || "manual"})`,
    );
  }
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}

console.log(`\nupdated=${changed} planned=${updates.length} unmatched=${unmatched.length}`);
if (unmatched.length) {
  console.log("UNMATCHED:");
  for (const m of unmatched) {
    console.log(
      `  #${m.id} ${String(m.d).slice(0, 10)} [${m.competition}] ${m.home_away} ${m.opp} phase=${m.phase} round=${m.round}`,
    );
  }
}

// Verify remaining gaps
const { rows: left } = await pool.query(`
  SELECT count(*)::int AS n
  FROM matches m
  WHERE (m.season IN ('2025','2026') OR m.id IN (2271,2273))
    AND coalesce(m.is_friendly,false)=false
    AND (m.phase IS NULL OR m.round IS NULL)
`);
console.log(`remaining_missing_phase_or_round=${left[0].n}`);

const { rows: u2271 } = await pool.query(
  `SELECT id, season, phase, round, match_date::text FROM matches WHERE id IN (2271,2273) ORDER BY id`,
);
console.log("uberlandia", u2271);

await pool.end();
