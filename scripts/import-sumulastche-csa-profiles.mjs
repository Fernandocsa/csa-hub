/**
 * Import CSA historic player profiles from Sumulas-Tchê (quem-e-quem/csa-al).
 * Only CSA seasons are stored; other clubs in Carreira are ignored.
 *
 * Usage:
 *   node scripts/import-sumulastche-csa-profiles.mjs --dry-run
 *   node scripts/import-sumulastche-csa-profiles.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry-run");
const HTML_PATH = join(__dirname, "data", "sumulastche-csa-al.html");

const POS_MAP = {
  GL: "Goleiro",
  LD: "Lateral Direito",
  LE: "Lateral Esquerdo",
  ZC: "Zagueiro",
  QZ: "Zagueiro",
  VL: "Volante",
  MC: "Meia Central",
  ME: "Meia Esquerda",
  MD: "Meia Direita",
  MO: "Meia Ofensivo",
  PE: "Ponta Esquerda",
  PD: "Ponta Direita",
  CA: "Centroavante",
  AT: "Atacante",
  SA: "2º Atacante",
  "??": null,
};

const COUNTRY = {
  BRA: { nationality: "Brasil", flag: "🇧🇷", birthCountry: "Brasil" },
  CHI: { nationality: "Chile", flag: "🇨🇱", birthCountry: "Chile" },
  ARG: { nationality: "Argentina", flag: "🇦🇷", birthCountry: "Argentina" },
  URU: { nationality: "Uruguai", flag: "🇺🇾", birthCountry: "Uruguai" },
  PAR: { nationality: "Paraguai", flag: "🇵🇾", birthCountry: "Paraguai" },
  BOL: { nationality: "Bolívia", flag: "🇧🇴", birthCountry: "Bolívia" },
  COL: { nationality: "Colômbia", flag: "🇨🇴", birthCountry: "Colômbia" },
  PER: { nationality: "Peru", flag: "🇵🇪", birthCountry: "Peru" },
  ECU: { nationality: "Equador", flag: "🇪🇨", birthCountry: "Equador" },
  VEN: { nationality: "Venezuela", flag: "🇻🇪", birthCountry: "Venezuela" },
  POR: { nationality: "Portugal", flag: "🇵🇹", birthCountry: "Portugal" },
};

function stripHtml(s) {
  return String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseApelido(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return s;
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => {
      if (!w) return w;
      // keep particles lowercase when mid-name
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function parseDateBr(raw) {
  const m = String(raw ?? "")
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return { birthDate: null, birthYear: null };
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (y < 1800 || y > 2010 || mo < 1 || mo > 12 || d < 1 || d > 31) {
    return { birthDate: null, birthYear: null };
  }
  const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { birthDate: iso, birthYear: y };
}

function parseLocal(raw) {
  const s = stripHtml(raw);
  if (!s) {
    return {
      birthCity: null,
      birthState: null,
      birthCountry: null,
      nationality: "Brasil",
      flag: "🇧🇷",
    };
  }
  // "Maceió, AL, BRA" | "Brasil (BRA)" | "PE, BRA" | "Chile (CHI)"
  const codeM = s.match(/\(([A-Z]{3})\)\s*$/) || s.match(/,\s*([A-Z]{3})\s*$/);
  const code = codeM ? codeM[1] : "BRA";
  const meta = COUNTRY[code] ?? {
    nationality: code,
    flag: null,
    birthCountry: code,
  };

  let rest = s
    .replace(/\s*\([A-Z]{3}\)\s*$/, "")
    .replace(/,\s*[A-Z]{3}\s*$/, "")
    .trim();

  // If rest is just country name
  if (/^(brasil|chile|argentina|uruguai|paraguai)$/i.test(rest)) {
    return {
      birthCity: null,
      birthState: null,
      birthCountry: meta.birthCountry,
      nationality: meta.nationality,
      flag: meta.flag,
    };
  }

  const parts = rest.split(",").map((p) => p.trim()).filter(Boolean);
  let birthCity = null;
  let birthState = null;
  if (parts.length >= 2) {
    const maybeUf = parts[parts.length - 1].toUpperCase();
    if (/^[A-Z]{2}$/.test(maybeUf)) {
      birthState = maybeUf;
      birthCity = parts.slice(0, -1).join(", ") || null;
    } else {
      birthCity = rest;
    }
  } else if (parts.length === 1) {
    if (/^[A-Z]{2}$/.test(parts[0].toUpperCase())) {
      birthState = parts[0].toUpperCase();
    } else {
      birthCity = parts[0];
    }
  }

  return {
    birthCity,
    birthState,
    birthCountry: meta.birthCountry,
    nationality: meta.nationality,
    flag: meta.flag,
  };
}

/** Expand CSA(AL) (YYYY) / CSA(AL) (YYYY a YYYY) spans → years[]. */
function extractCsaSeasons(carreira, outros) {
  const years = new Set();
  const text = `${carreira ?? ""} ${outros ?? ""}`;

  // CSA(AL) (1981 a 1982) / CSA(AL) (1995) / CSA (AL) (1972 a 1973)
  const re =
    /CSA\s*(?:[\(\[]\s*AL\s*[\)\]])?\s*\(\s*(\d{4})(?:\s*a\s*(\d{4}))?\s*\)/gi;
  let m;
  while ((m = re.exec(text))) {
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    const from = Math.min(a, b);
    const to = Math.max(a, b);
    if (from >= 1900 && to <= 2026) {
      for (let y = from; y <= to; y++) years.add(String(y));
    }
  }
  return [...years].sort();
}

function parsePlayers(html) {
  // Split by player tables that start with Apelido row
  const blocks = html.split(/<b>Apelido:<\/b>/i).slice(1);
  const players = [];

  for (const block of blocks) {
    const apelidoM = block.match(/^[\s\S]*?<td[^>]*>\s*([^<]+?)\s*<\/td>/i);
    const field = (label) => {
      const re = new RegExp(
        `<b>${label}:</b></td>\\s*<td[^>]*>\\s*([\\s\\S]*?)\\s*</td>`,
        "i",
      );
      const m = block.match(re);
      return m ? stripHtml(m[1]) : "";
    };

    const apelido = stripHtml(apelidoM?.[1] ?? "");
    const fullName = field("Nome");
    const posRaw = field("Posicao");
    const birthRaw = field("Nascimento");
    const localRaw = field("Local");
    const carreira = field("Carreira");
    const outros = field("Outros Clubes");
    const { birthDate, birthYear } = parseDateBr(birthRaw);
    const loc = parseLocal(localRaw);
    const seasons = extractCsaSeasons(carreira, outros);

    players.push({
      name: titleCaseApelido(apelido),
      fullName: fullName || null,
      position: POS_MAP[posRaw.toUpperCase()] ?? (posRaw === "??" ? null : null),
      posRaw,
      birthDate,
      birthYear,
      ...loc,
      seasons,
      carreira,
    });
  }
  return players;
}

function empty(v) {
  return v == null || String(v).trim() === "";
}

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

try {
  const html = readFileSync(HTML_PATH, "utf8");
  const parsed = parsePlayers(html);
  console.log(`Parsed ${parsed.length} profiles from HTML`);

  const { rows: existing } = await client.query(`
    SELECT id, name, full_name, position, birth_date::text AS birth_date, birth_year,
           birth_city, birth_state, birth_country, nationality, nationality_flag,
           verification_status
    FROM players
    ORDER BY id
  `);

  const byFull = new Map();
  const byName = new Map();
  for (const p of existing) {
    if (p.full_name) {
      const k = norm(p.full_name);
      if (!byFull.has(k)) byFull.set(k, []);
      byFull.get(k).push(p);
    }
    const nk = norm(p.name);
    if (!byName.has(nk)) byName.set(nk, []);
    byName.get(nk).push(p);
  }

  async function seasonsOf(playerId) {
    const { rows } = await client.query(
      `SELECT season FROM player_season_stats WHERE player_id = $1`,
      [playerId],
    );
    return rows.map((r) => r.season);
  }

  function seasonsOverlap(existingSeasons, srcSeasons) {
    if (!existingSeasons.length) return true; // empty roster shell OK to fill
    if (!srcSeasons.length) return false;
    const set = new Set(srcSeasons);
    return existingSeasons.some((s) => set.has(s));
  }

  function isShell(h) {
    return empty(h.full_name) && empty(h.birth_date) && h.birth_year == null;
  }

  async function findMatch(src) {
    if (src.fullName) {
      const hits = byFull.get(norm(src.fullName)) ?? [];
      if (hits.length === 1) return { player: hits[0], how: "full_name" };
      if (hits.length > 1) {
        if (src.birthDate) {
          const bd = hits.filter((h) => h.birth_date === src.birthDate);
          if (bd.length === 1) return { player: bd[0], how: "full_name+birth_date" };
        }
        return { player: null, how: "ambiguous_full_name", candidates: hits };
      }
    }

    const nameHits = byName.get(norm(src.name)) ?? [];
    if (nameHits.length === 0) return { player: null, how: "none" };

    if (src.birthDate) {
      const bd = nameHits.filter((h) => h.birth_date === src.birthDate);
      if (bd.length === 1) return { player: bd[0], how: "name+birth_date" };
      if (bd.length > 1) {
        return { player: null, how: "ambiguous_name+birth", candidates: bd };
      }
    }

    if (src.birthYear != null) {
      const by = nameHits.filter(
        (h) =>
          h.birth_year === src.birthYear ||
          (h.birth_date && h.birth_date.startsWith(String(src.birthYear))),
      );
      if (by.length === 1) return { player: by[0], how: "name+birth_year" };
    }

    if (src.fullName) {
      const fnHits = nameHits.filter(
        (h) => h.full_name && norm(h.full_name) === norm(src.fullName),
      );
      if (fnHits.length === 1) return { player: fnHits[0], how: "name+full_name" };
    }

    // Exactly one empty shell among same nickname → fill only if seasons overlap
    const shells = nameHits.filter(isShell);
    if (shells.length === 1 && (src.fullName || src.birthDate || src.birthYear != null)) {
      const shell = shells[0];
      const existingSeasons = await seasonsOf(shell.id);
      if (seasonsOverlap(existingSeasons, src.seasons)) {
        const othersConflict = nameHits
          .filter((h) => h.id !== shell.id)
          .some(
            (h) =>
              (h.full_name && src.fullName && norm(h.full_name) === norm(src.fullName)) ||
              (h.birth_date && src.birthDate && h.birth_date === src.birthDate),
          );
        if (!othersConflict) return { player: shell, how: "fill_shell" };
      }
    }

    // Unique nickname shell
    if (nameHits.length === 1 && isShell(nameHits[0])) {
      const existingSeasons = await seasonsOf(nameHits[0].id);
      if (seasonsOverlap(existingSeasons, src.seasons)) {
        return { player: nameHits[0], how: "unique_shell" };
      }
      return { player: null, how: "shell_season_mismatch" };
    }

    if (nameHits.length === 1) {
      const h = nameHits[0];
      if (
        (h.birth_date && src.birthDate && h.birth_date !== src.birthDate) ||
        (h.full_name && src.fullName && norm(h.full_name) !== norm(src.fullName)) ||
        (h.birth_year != null &&
          src.birthYear != null &&
          h.birth_year !== src.birthYear)
      ) {
        return { player: null, how: "homonym_conflict" };
      }
      if (!src.fullName && !src.birthDate && src.birthYear == null) {
        return { player: h, how: "unique_name_weak" };
      }
      return { player: null, how: "homonym_conflict" };
    }

    if (nameHits.length > 1) {
      return { player: null, how: "ambiguous_name", candidates: nameHits };
    }

    return { player: null, how: "none" };
  }

  function applyMemoryPatch(player, patch) {
    Object.assign(player, patch);
    if (patch.full_name) {
      const k = norm(patch.full_name);
      if (!byFull.has(k)) byFull.set(k, []);
      if (!byFull.get(k).includes(player)) byFull.get(k).push(player);
    }
  }

  const report = {
    dry: DRY,
    created: [],
    reused: [],
    enriched: [],
    seasonsAdded: [],
    ambiguous: [],
    skippedNoIdentity: [],
  };

  if (!DRY) await client.query("BEGIN");

  for (const src of parsed) {
    if (!src.name) {
      report.skippedNoIdentity.push(src);
      continue;
    }

    const match = await findMatch(src);

    if (match.how.startsWith("ambiguous")) {
      report.ambiguous.push({
        name: src.name,
        fullName: src.fullName,
        birthDate: src.birthDate,
        how: match.how,
        candidates: (match.candidates ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          full_name: c.full_name,
          birth_date: c.birth_date,
        })),
      });

      // Prefer filling a single empty shell among candidates (season-aware)
      const shells = (match.candidates ?? []).filter(
        (h) => empty(h.full_name) && empty(h.birth_date) && h.birth_year == null,
      );
      if (shells.length === 1 && (src.fullName || src.birthDate || src.birthYear != null)) {
        const existingSeasons = await seasonsOf(shells[0].id);
        if (seasonsOverlap(existingSeasons, src.seasons)) {
          match.player = shells[0];
          match.how = "ambiguous_fill_shell";
        } else if (src.fullName) {
          match.player = null;
          match.how = "ambiguous_create_new";
        } else {
          continue;
        }
      } else if (!src.fullName) {
        continue;
      } else {
        const collision = (match.candidates ?? []).some(
          (c) => c.full_name && norm(c.full_name) === norm(src.fullName),
        );
        if (collision) continue;
        match.player = null;
        match.how = "ambiguous_create_new";
      }
    }

    let playerId;
    let action;

    if (match.player) {
      playerId = match.player.id;
      action = "reused";

      // Fill empty profile fields only
      const patch = {};
      if (empty(match.player.full_name) && src.fullName) patch.full_name = src.fullName;
      if (empty(match.player.position) && src.position) patch.position = src.position;
      if (empty(match.player.birth_date) && src.birthDate) {
        patch.birth_date = src.birthDate;
        patch.birth_year = src.birthYear;
      } else if (match.player.birth_year == null && src.birthYear != null) {
        patch.birth_year = src.birthYear;
      }
      if (empty(match.player.birth_city) && src.birthCity) patch.birth_city = src.birthCity;
      if (empty(match.player.birth_state) && src.birthState) patch.birth_state = src.birthState;
      if (empty(match.player.birth_country) && src.birthCountry) {
        patch.birth_country = src.birthCountry;
      }
      if (empty(match.player.nationality) && src.nationality) {
        patch.nationality = src.nationality;
        patch.nationality_flag = src.flag;
      }

      if (Object.keys(patch).length) {
        if (!DRY) {
          const keys = Object.keys(patch);
          const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
          const vals = keys.map((k) => patch[k]);
          await client.query(`UPDATE players SET ${sets} WHERE id = $1`, [
            playerId,
            ...vals,
          ]);
        }
        applyMemoryPatch(match.player, patch);
        report.enriched.push({ id: playerId, name: src.name, patch, how: match.how });
      } else {
        report.reused.push({ id: playerId, name: src.name, how: match.how });
      }
    } else {
      action = "created";
      if (DRY) {
        playerId = `new:${src.name}:${src.fullName ?? ""}`;
        report.created.push({
          name: src.name,
          fullName: src.fullName,
          position: src.position,
          birthDate: src.birthDate,
          seasons: src.seasons,
          how: match.how,
        });
      } else {
        const { rows } = await client.query(
          `INSERT INTO players (
             name, full_name, position, nationality, nationality_flag,
             birth_date, birth_year, birth_city, birth_state, birth_country,
             verification_status
           ) VALUES ($1,$2,$3,$4,$5,$6::date,$7,$8,$9,$10,'unverified')
           RETURNING id, name, full_name`,
          [
            src.name,
            src.fullName,
            src.position,
            src.nationality ?? "Brasil",
            src.flag ?? "🇧🇷",
            src.birthDate,
            src.birthYear,
            src.birthCity,
            src.birthState,
            src.birthCountry ?? "Brasil",
          ],
        );
        playerId = rows[0].id;
        report.created.push({
          id: playerId,
          name: rows[0].name,
          fullName: rows[0].full_name,
          seasons: src.seasons,
          how: match.how,
        });

        // index for subsequent matches in same run
        const row = {
          id: playerId,
          name: src.name,
          full_name: src.fullName,
          birth_date: src.birthDate,
          birth_year: src.birthYear,
        };
        if (src.fullName) {
          const k = norm(src.fullName);
          if (!byFull.has(k)) byFull.set(k, []);
          byFull.get(k).push(row);
        }
        const nk = norm(src.name);
        if (!byName.has(nk)) byName.set(nk, []);
        byName.get(nk).push(row);
      }
    }

    // CSA seasons only
    for (const season of src.seasons) {
      if (!DRY) {
        await client.query(
          `INSERT INTO seasons (year) VALUES ($1) ON CONFLICT (year) DO NOTHING`,
          [Number(season)],
        );
        const ins = await client.query(
          `INSERT INTO player_season_stats (player_id, season, appearances, goals, assists)
           VALUES ($1, $2, 0, 0, 0)
           ON CONFLICT (player_id, season) DO NOTHING
           RETURNING season`,
          [playerId, season],
        );
        if (ins.rows[0]) {
          report.seasonsAdded.push({ playerId, name: src.name, season, action });
        }
      } else if (typeof playerId === "string" || action === "created") {
        report.seasonsAdded.push({ playerId, name: src.name, season, action });
      } else {
        // dry-run reuse: check if season missing
        const ex = await client.query(
          `SELECT 1 FROM player_season_stats WHERE player_id=$1 AND season=$2`,
          [playerId, season],
        );
        if (!ex.rows[0]) {
          report.seasonsAdded.push({ playerId, name: src.name, season, action });
        }
      }
    }
  }

  if (!DRY) await client.query("COMMIT");

  const summary = {
    dry: DRY,
    parsed: parsed.length,
    created: report.created.length,
    reused: report.reused.length,
    enriched: report.enriched.length,
    seasonsAdded: report.seasonsAdded.length,
    ambiguous: report.ambiguous.length,
    skippedNoIdentity: report.skippedNoIdentity.length,
  };
  console.log(JSON.stringify(summary, null, 2));

  const outPath = join(
    __dirname,
    "data",
    DRY ? "sumulastche-import-dry.json" : "sumulastche-import-report.json",
  );
  writeFileSync(outPath, JSON.stringify({ summary, ...report }, null, 2));
  console.log("Wrote", outPath);
} catch (e) {
  if (!DRY) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
  }
  console.error(e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
