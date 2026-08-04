/**
 * Parse Ogol match sheet paste (CSA side only).
 *
 * Notation:
 * - shirt number line + name line (+ optional event lines)
 * - (C) on name = captain
 * - R + NN' / 90+4' = yellow (2×R same player → second becomes red)
 * - NN' alone = goal (supports 90+N' stoppage time)
 * - multiple goals on one line: `19' 27'`
 * - NN' (pen.) = penalty goal
 * - B + NN' = assist at minute
 * - A + NN' = missed penalty
 * - C + NN' = saved penalty
 * - 7 + NN' = sub in; 8 + NN' = sub out
 */

export type OgolRole = "starter" | "bench";

export type OgolClock = {
  minute: number;
  /** Stoppage time (e.g. 4 in 90+4'); null when not present. */
  injuryTimeMinute: number | null;
};

export type OgolParsedPlayer = {
  shirtNumber: number | null;
  name: string;
  isCaptain: boolean;
  role: OgolRole;
  /** Raw position hint left empty — filled by roster match later. */
  position?: string | null;
};

export type OgolGoal = { playerName: string; isPenalty?: boolean } & OgolClock;
export type OgolAssist = { playerName: string } & OgolClock;
export type OgolCard = {
  playerName: string;
  cardType: "yellow" | "red";
} & OgolClock;
export type OgolPenalty = {
  playerName: string;
  eventType: "missed" | "saved";
} & OgolClock;
export type OgolSubOut = { playerName: string } & OgolClock;
export type OgolSubIn = { playerName: string } & OgolClock;
export type OgolSubPair = {
  playerOutName: string;
  playerInName: string;
  paired: boolean;
  note?: string;
} & OgolClock;

export type OgolParseResult = {
  players: OgolParsedPlayer[];
  managerName: string | null;
  captainName: string | null;
  goals: OgolGoal[];
  assists: OgolAssist[];
  cards: OgolCard[];
  penalties: OgolPenalty[];
  /** Paired where possible; unpaired listed with empty counterpart. */
  substitutions: OgolSubPair[];
  warnings: string[];
};

const SECTION_STARTERS = /^(csa|titulares?)$/i;
const SECTION_BENCH = /^reservas?$/i;
const SECTION_COACH = /^treinadores?$/i;
const SHIRT_RE = /^\d{1,3}$/;
/** `63'` or stoppage `90+4'` / `45+2'` (apostrophe required) */
const MINUTE_RE = /^(\d{1,3})(?:\s*\+\s*(\d{1,2}))?\s*'$/;
/** Goal clock, optionally marked as penalty: `65'` / `65' (pen.)` / `90+2'(pen)` */
const GOAL_CLOCK_RE =
  /^(\d{1,3})(?:\s*\+\s*(\d{1,2}))?\s*'(?:\s*\(pen\.?\))?$/i;
const EVENT_TOKEN = /^(R|B|A|C|7|8)$/i;

/** Normalize fancy quotes so `90+4'` / `78'` from Ogol still parse. */
function normalizeOgolToken(raw: string): string {
  return raw
    .trim()
    .replace(/[\u2018\u2019\u2032\u00B4]/g, "'")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2000-\u200B\u202F\u205F]/g, " ")
    .replace(/\s+/g, " ");
}

function parseMinuteToken(raw: string | undefined | null): OgolClock | null {
  if (!raw) return null;
  // Strip optional (pen.) so assists/cards can reuse clocks next to pen markers if needed
  const base = normalizeOgolToken(raw).replace(/\s*\(pen\.?\)$/i, "");
  const m = base.match(MINUTE_RE);
  if (!m) return null;
  return {
    minute: Number(m[1]),
    injuryTimeMinute: m[2] != null ? Number(m[2]) : null,
  };
}

function parseGoalToken(
  raw: string | undefined | null,
): ({ clock: OgolClock; isPenalty: boolean }) | null {
  if (!raw) return null;
  const t = normalizeOgolToken(raw);
  const m = t.match(GOAL_CLOCK_RE);
  if (!m) return null;
  return {
    clock: {
      minute: Number(m[1]),
      injuryTimeMinute: m[2] != null ? Number(m[2]) : null,
    },
    isPenalty: /\(pen\.?\)/i.test(t),
  };
}

/**
 * Split a token line into individual clock tokens.
 * Handles `19' 27'`, `65' (pen.)`, mixed spaces / fancy quotes.
 */
function expandTokenLine(line: string): string[] {
  const t = normalizeOgolToken(line);
  if (!t) return [];
  if (EVENT_TOKEN.test(t)) return [t];
  if (/^(csa|titulares?|reservas?|treinadores?)$/i.test(t)) return [t];

  // Fresh /g regex each call — shared lastIndex would break match+replace.
  const re = /\d{1,3}(?:\s*\+\s*\d{1,2})?\s*'(?:\s*\(pen\.?\))?/gi;
  const parts = t.match(re);
  if (parts?.length) {
    const stripped = t.replace(re, "").trim();
    if (!stripped) {
      return parts.map((p) => normalizeOgolToken(p));
    }
  }
  return [t];
}

/** Consume consecutive minute tokens starting at `from` (inclusive index into toks). */
function takeClocks(toks: string[], from: number): { clocks: OgolClock[]; next: number } {
  const clocks: OgolClock[] = [];
  let j = from;
  while (j < toks.length) {
    const c = parseMinuteToken(toks[j]);
    if (!c) break;
    clocks.push(c);
    j += 1;
  }
  return { clocks, next: j };
}

function clockOnly(c: OgolClock): OgolClock {
  return { minute: c.minute, injuryTimeMinute: c.injuryTimeMinute };
}

function isMinuteLine(t: string): boolean {
  const s = normalizeOgolToken(t);
  if (parseGoalToken(s) != null || parseMinuteToken(s) != null) return true;
  const expanded = expandTokenLine(s);
  return expanded.length > 1 || (expanded.length === 1 && parseGoalToken(expanded[0]) != null);
}

function clockKey(c: OgolClock): string {
  return `${c.minute}+${c.injuryTimeMinute ?? 0}`;
}

export function formatOgolClock(c: OgolClock): string {
  if (c.injuryTimeMinute != null && c.injuryTimeMinute > 0) {
    return `${c.minute}+${c.injuryTimeMinute}'`;
  }
  return `${c.minute}'`;
}

function normName(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function stripCaptain(raw: string): { name: string; isCaptain: boolean } {
  const m = raw.match(/^(.*?)\s*\(C\)\s*$/i);
  if (m) return { name: m[1].trim(), isCaptain: true };
  return { name: raw.trim(), isCaptain: false };
}

type RawPlayer = {
  shirtNumber: number;
  name: string;
  isCaptain: boolean;
  role: OgolRole;
  tokens: string[];
};

function isSectionHeader(line: string): "starters" | "bench" | "coach" | null {
  const t = line.trim();
  if (!t) return null;
  if (SECTION_BENCH.test(t)) return "bench";
  if (SECTION_COACH.test(t)) return "coach";
  if (SECTION_STARTERS.test(t)) return "starters";
  return null;
}

/**
 * Pair outs/ins at the same clock (minute + stoppage):
 * 1) unique position-group 1:1
 * 2) remaining with equal counts → FIFO (complete rows; may need review)
 * 3) only leave incomplete rows when out/in counts differ
 */
export function pairSubstitutions(
  outs: OgolSubOut[],
  ins: OgolSubIn[],
  positionByName: Map<string, string | null | undefined>,
  positionGroupFn: (pos: string | null | undefined) => string,
): { pairs: OgolSubPair[]; warnings: string[] } {
  const warnings: string[] = [];
  const pairs: OgolSubPair[] = [];
  const clocks = new Set([
    ...outs.map((o) => clockKey(o)),
    ...ins.map((i) => clockKey(i)),
  ]);

  for (const key of [...clocks].sort((a, b) => {
    const [am, ai] = a.split("+").map(Number);
    const [bm, bi] = b.split("+").map(Number);
    return am - bm || ai - bi;
  })) {
    const outsM = outs.filter((o) => clockKey(o) === key);
    const insM = ins.filter((i) => clockKey(i) === key);
    const clock = clockOnly(outsM[0] ?? insM[0]);
    const label = formatOgolClock(clock);

    if (outsM.length === 1 && insM.length === 1) {
      pairs.push({
        ...clock,
        playerOutName: outsM[0].playerName,
        playerInName: insM[0].playerName,
        paired: true,
      });
      continue;
    }

    const usedOut = new Set<number>();
    const usedIn = new Set<number>();
    let usedOrderFallback = false;

    const groupOf = (name: string) =>
      positionGroupFn(positionByName.get(normName(name)) ?? null);

    const groups = new Set<string>([
      ...outsM.map((o) => groupOf(o.playerName)),
      ...insM.map((i) => groupOf(i.playerName)),
    ]);
    for (const group of groups) {
      const outIdxs = outsM
        .map((o, idx) => ({ o, idx }))
        .filter(({ o, idx }) => !usedOut.has(idx) && groupOf(o.playerName) === group)
        .map(({ idx }) => idx);
      const inIdxs = insM
        .map((i, idx) => ({ i, idx }))
        .filter(({ i, idx }) => !usedIn.has(idx) && groupOf(i.playerName) === group)
        .map(({ idx }) => idx);

      if (outIdxs.length === 1 && inIdxs.length === 1) {
        usedOut.add(outIdxs[0]);
        usedIn.add(inIdxs[0]);
        pairs.push({
          ...clock,
          playerOutName: outsM[outIdxs[0]].playerName,
          playerInName: insM[inIdxs[0]].playerName,
          paired: true,
        });
      }
    }

    const remainingOuts = outsM
      .map((o, idx) => ({ o, idx }))
      .filter(({ idx }) => !usedOut.has(idx));
    const remainingIns = insM
      .map((i, idx) => ({ i, idx }))
      .filter(({ idx }) => !usedIn.has(idx));
    const fifoCount = Math.min(remainingOuts.length, remainingIns.length);
    for (let k = 0; k < fifoCount; k++) {
      usedOut.add(remainingOuts[k].idx);
      usedIn.add(remainingIns[k].idx);
      usedOrderFallback = true;
      pairs.push({
        ...clock,
        playerOutName: remainingOuts[k].o.playerName,
        playerInName: remainingIns[k].i.playerName,
        paired: true,
        note: "Pareado por ordem (revise se a seta do Ogol for outra)",
      });
    }

    outsM.forEach((o, idx) => {
      if (usedOut.has(idx)) return;
      pairs.push({
        ...clock,
        playerOutName: o.playerName,
        playerInName: "",
        paired: false,
        note: "Saída sem entrada no mesmo minuto",
      });
    });
    insM.forEach((i, idx) => {
      if (usedIn.has(idx)) return;
      pairs.push({
        ...clock,
        playerOutName: "",
        playerInName: i.playerName,
        paired: false,
        note: "Entrada sem saída no mesmo minuto",
      });
    });

    const unpairedAfter = pairs.filter((p) => clockKey(p) === key && !p.paired);
    if (usedOrderFallback && unpairedAfter.length === 0) {
      // Complete rows via order — UI shows pair notes; no blocking warning.
    } else if (unpairedAfter.length) {
      warnings.push(
        `${label}: ${unpairedAfter.length} substituição(ões) incompleta(s) — revise na ficha`,
      );
    }
  }

  return { pairs, warnings };
}

export function parseOgolPaste(raw: string): OgolParseResult {
  const warnings: string[] = [];
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let role: OgolRole = "starter";
  let inCoach = false;
  const coachLines: string[] = [];
  const rawPlayers: RawPlayer[] = [];

  let i = 0;
  // Skip leading CSA header
  if (lines[0] && SECTION_STARTERS.test(lines[0])) i = 1;

  while (i < lines.length) {
    const line = normalizeOgolToken(lines[i]);
    const section = isSectionHeader(line);
    if (section === "bench") {
      role = "bench";
      inCoach = false;
      i += 1;
      continue;
    }
    if (section === "coach") {
      inCoach = true;
      i += 1;
      continue;
    }
    if (section === "starters") {
      role = "starter";
      inCoach = false;
      i += 1;
      continue;
    }

    if (inCoach) {
      coachLines.push(line);
      i += 1;
      continue;
    }

    if (SHIRT_RE.test(line) && i + 1 < lines.length && !SHIRT_RE.test(normalizeOgolToken(lines[i + 1]))) {
      const nextName = normalizeOgolToken(lines[i + 1]);

      // `8` / `7` immediately before Reservas/Treinadores is an event on the
      // previous player, not shirt number + player named "Reservas".
      if (isSectionHeader(nextName)) {
        if (rawPlayers.length > 0 && EVENT_TOKEN.test(line)) {
          rawPlayers[rawPlayers.length - 1].tokens.push(line);
        } else {
          warnings.push(`Número solto ignorado antes de "${nextName}": ${line}`);
        }
        i += 1;
        continue;
      }

      const shirtNumber = Number(line);
      const { name, isCaptain } = stripCaptain(nextName);
      // Never create a player whose "name" is a section header
      if (isSectionHeader(name)) {
        i += 1;
        continue;
      }
      i += 2;
      const tokens: string[] = [];
      while (i < lines.length) {
        const t = normalizeOgolToken(lines[i]);
        if (isSectionHeader(t)) break;
        if (
          SHIRT_RE.test(t) &&
          i + 1 < lines.length &&
          !EVENT_TOKEN.test(normalizeOgolToken(lines[i + 1])) &&
          !isMinuteLine(lines[i + 1])
        ) {
          const next = normalizeOgolToken(lines[i + 1]);
          // Next shirt + section header → current `t` is event (7/8), not new player
          if (isSectionHeader(next)) {
            // fall through and push `t` as token
          } else if (
            next &&
            !EVENT_TOKEN.test(next) &&
            !isMinuteLine(next) &&
            !SHIRT_RE.test(next)
          ) {
            break;
          }
        }
        tokens.push(...expandTokenLine(t));
        i += 1;
      }
      rawPlayers.push({ shirtNumber, name, isCaptain, role, tokens });
      continue;
    }

    warnings.push(`Linha ignorada: "${line}"`);
    i += 1;
  }

  const players: OgolParsedPlayer[] = rawPlayers.map((p) => ({
    shirtNumber: p.shirtNumber,
    name: p.name,
    isCaptain: p.isCaptain,
    role: p.role,
  }));

  const goals: OgolGoal[] = [];
  const assists: OgolAssist[] = [];
  const cardEvents: ({ playerName: string } & OgolClock)[] = [];
  const penalties: OgolPenalty[] = [];
  const subOuts: OgolSubOut[] = [];
  const subIns: OgolSubIn[] = [];
  /** `8` / `7` without a following minute — minute inferred from the other side later. */
  const pendingOutNames: string[] = [];
  const pendingInNames: string[] = [];

  for (const p of rawPlayers) {
    let ti = 0;
    const toks = p.tokens;
    while (ti < toks.length) {
      const t = toks[ti];
      const goalTok = parseGoalToken(t);
      if (goalTok) {
        goals.push({
          playerName: p.name,
          ...goalTok.clock,
          isPenalty: goalTok.isPenalty,
        });
        ti += 1;
        continue;
      }
      // Mid-stream expand for unsplit multi-minute / pen. lines
      const splitClocks = expandTokenLine(t);
      if (splitClocks.length > 1 || (splitClocks.length === 1 && splitClocks[0] !== t)) {
        toks.splice(ti, 1, ...splitClocks);
        continue;
      }
      const up = t.toUpperCase();
      if (up === "R") {
        const { clocks, next } = takeClocks(toks, ti + 1);
        if (clocks.length) {
          for (const clock of clocks) {
            cardEvents.push({ playerName: p.name, ...clock });
          }
          ti = next;
        } else {
          cardEvents.push({ playerName: p.name, minute: 200, injuryTimeMinute: null });
          ti += 1;
          warnings.push(`Cartão de ${p.name} sem minuto`);
        }
        continue;
      }
      if (up === "B") {
        const { clocks, next } = takeClocks(toks, ti + 1);
        if (clocks.length) {
          for (const clock of clocks) {
            assists.push({ playerName: p.name, ...clock });
          }
          ti = next;
        } else {
          warnings.push(`Assistência de ${p.name} sem minuto`);
          ti += 1;
        }
        continue;
      }
      if (up === "A" || up === "C") {
        const { clocks, next } = takeClocks(toks, ti + 1);
        if (clocks.length) {
          for (const clock of clocks) {
            penalties.push({
              playerName: p.name,
              ...clock,
              eventType: up === "A" ? "missed" : "saved",
            });
          }
          ti = next;
        } else {
          warnings.push(`Pênalti (${up}) de ${p.name} sem minuto`);
          ti += 1;
        }
        continue;
      }
      if (up === "7" || up === "8") {
        const { clocks, next } = takeClocks(toks, ti + 1);
        if (clocks.length) {
          for (const clock of clocks) {
            if (up === "8") subOuts.push({ playerName: p.name, ...clock });
            else subIns.push({ playerName: p.name, ...clock });
          }
          ti = next;
        } else {
          // Minute often lives only on the other side of the substitution.
          if (up === "8") pendingOutNames.push(p.name);
          else pendingInNames.push(p.name);
          ti += 1;
        }
        continue;
      }
      warnings.push(`Token desconhecido em ${p.name}: "${t}"`);
      ti += 1;
    }
  }

  // Cards: first R yellow; second R for same player → red
  const cards: OgolCard[] = [];
  const yellowCount = new Map<string, number>();
  for (const c of cardEvents) {
    const key = normName(c.playerName);
    const n = (yellowCount.get(key) ?? 0) + 1;
    yellowCount.set(key, n);
    if (n === 1) {
      cards.push({
        playerName: c.playerName,
        minute: c.minute,
        injuryTimeMinute: c.injuryTimeMinute,
        cardType: "yellow",
      });
    } else if (n === 2) {
      cards.push({
        playerName: c.playerName,
        minute: c.minute,
        injuryTimeMinute: c.injuryTimeMinute,
        cardType: "red",
      });
    } else {
      cards.push({
        playerName: c.playerName,
        minute: c.minute,
        injuryTimeMinute: c.injuryTimeMinute,
        cardType: "yellow",
      });
      warnings.push(`Mais de 2 cartões para ${c.playerName}`);
    }
  }

  // Assist ambiguity: multiple goals same clock + assists
  const goalsByClock = new Map<string, OgolGoal[]>();
  for (const g of goals) {
    const k = clockKey(g);
    const list = goalsByClock.get(k) ?? [];
    list.push(g);
    goalsByClock.set(k, list);
  }
  for (const a of assists) {
    const gs = goalsByClock.get(clockKey(a)) ?? [];
    const label = formatOgolClock(a);
    if (gs.length === 0) {
      warnings.push(
        `Assistência de ${a.playerName} aos ${label} sem gol no mesmo minuto`,
      );
    } else if (gs.length > 1) {
      warnings.push(
        `Assistência de ${a.playerName} aos ${label} ambígua (${gs.length} gols) — vincular na revisão`,
      );
    }
  }

  const captainName = players.find((p) => p.isCaptain)?.name ?? null;
  const managerName =
    coachLines
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ")
      .trim() || null;

  const { pairs: substitutions, warnings: subWarn } = pairSubstitutions(
    subOuts,
    subIns,
    new Map(),
    () => "Outros",
  );
  warnings.push(...subWarn);

  // Fill bare 8/7 using incomplete rows (minute only on the other side).
  for (const pair of substitutions) {
    if (pair.paired) continue;
    if (pair.playerInName && !pair.playerOutName && pendingOutNames.length) {
      pair.playerOutName = pendingOutNames.shift()!;
      pair.paired = true;
      delete pair.note;
    } else if (pair.playerOutName && !pair.playerInName && pendingInNames.length) {
      pair.playerInName = pendingInNames.shift()!;
      pair.paired = true;
      delete pair.note;
    }
  }
  while (pendingOutNames.length && pendingInNames.length) {
    substitutions.push({
      minute: 200,
      injuryTimeMinute: null,
      playerOutName: pendingOutNames.shift()!,
      playerInName: pendingInNames.shift()!,
      paired: true,
      note: "Sem minuto no Ogol — revise na ficha",
    });
  }
  for (const name of pendingOutNames) {
    substitutions.push({
      minute: 200,
      injuryTimeMinute: null,
      playerOutName: name,
      playerInName: "",
      paired: false,
      note: "Saída sem minuto/entrada",
    });
    warnings.push(`Substituição (8) de ${name} sem minuto/entrada correspondente`);
  }
  for (const name of pendingInNames) {
    substitutions.push({
      minute: 200,
      injuryTimeMinute: null,
      playerOutName: "",
      playerInName: name,
      paired: false,
      note: "Entrada sem minuto/saída",
    });
    warnings.push(`Substituição (7) de ${name} sem minuto/saída correspondente`);
  }

  // Drop stale "incomplete" warnings when we filled them via pending names
  const stillIncomplete = substitutions.filter((s) => !s.paired).length;
  if (stillIncomplete === 0) {
    for (let wi = warnings.length - 1; wi >= 0; wi--) {
      if (/substituição\(ões\) incompleta/i.test(warnings[wi])) {
        warnings.splice(wi, 1);
      }
    }
  }

  return {
    players,
    managerName,
    captainName,
    goals,
    assists,
    cards,
    penalties,
    substitutions,
    warnings,
  };
}

export { normName as normalizeOgolPlayerName };
