/**
 * Parse Ogol match sheet paste (CSA side only).
 *
 * Notation:
 * - shirt number line + name line (+ optional event lines)
 * - (C) on name = captain
 * - R + NN' = yellow (2×R same player → second becomes red)
 * - NN' alone = goal
 * - B + NN' = assist at minute
 * - A + NN' = missed penalty
 * - C + NN' = saved penalty
 * - 7 + NN' = sub in; 8 + NN' = sub out
 */

export type OgolRole = "starter" | "bench";

export type OgolParsedPlayer = {
  shirtNumber: number | null;
  name: string;
  isCaptain: boolean;
  role: OgolRole;
  /** Raw position hint left empty — filled by roster match later. */
  position?: string | null;
};

export type OgolGoal = { playerName: string; minute: number };
export type OgolAssist = { playerName: string; minute: number };
export type OgolCard = {
  playerName: string;
  minute: number;
  cardType: "yellow" | "red";
};
export type OgolPenalty = {
  playerName: string;
  minute: number;
  eventType: "missed" | "saved";
};
export type OgolSubOut = { playerName: string; minute: number };
export type OgolSubIn = { playerName: string; minute: number };
export type OgolSubPair = {
  minute: number;
  playerOutName: string;
  playerInName: string;
  paired: boolean;
  note?: string;
};

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
const MINUTE_RE = /^(\d{1,3})\s*'$/;
const EVENT_TOKEN = /^(R|B|A|C|7|8)$/i;

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
 * Pair outs/ins at the same minute:
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
  const minutes = new Set([...outs.map((o) => o.minute), ...ins.map((i) => i.minute)]);

  for (const minute of [...minutes].sort((a, b) => a - b)) {
    const outsM = outs.filter((o) => o.minute === minute);
    const insM = ins.filter((i) => i.minute === minute);

    if (outsM.length === 1 && insM.length === 1) {
      pairs.push({
        minute,
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

    // 1) Unique position-group pairs (exactly one out + one in in that group)
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
          minute,
          playerOutName: outsM[outIdxs[0]].playerName,
          playerInName: insM[inIdxs[0]].playerName,
          paired: true,
        });
      }
    }

    // 2) Remaining: FIFO so we don't create empty Saiu/Entrou rows when counts match
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
        minute,
        playerOutName: remainingOuts[k].o.playerName,
        playerInName: remainingIns[k].i.playerName,
        paired: true,
        note: "Pareado por ordem (revise se a seta do Ogol for outra)",
      });
    }

    // 3) True leftovers only when counts differ
    outsM.forEach((o, idx) => {
      if (usedOut.has(idx)) return;
      pairs.push({
        minute,
        playerOutName: o.playerName,
        playerInName: "",
        paired: false,
        note: "Saída sem entrada no mesmo minuto",
      });
    });
    insM.forEach((i, idx) => {
      if (usedIn.has(idx)) return;
      pairs.push({
        minute,
        playerOutName: "",
        playerInName: i.playerName,
        paired: false,
        note: "Entrada sem saída no mesmo minuto",
      });
    });

    if (usedOrderFallback) {
      warnings.push(
        `${minute}': trocas simultâneas pareadas por ordem — confira quem saiu por quem`,
      );
    }
    const unpaired = pairs.filter((p) => p.minute === minute && !p.paired);
    if (unpaired.length) {
      warnings.push(
        `${minute}': ${unpaired.length} substituição(ões) incompleta(s) — revise na ficha`,
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
    const line = lines[i];
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

    if (SHIRT_RE.test(line) && i + 1 < lines.length && !SHIRT_RE.test(lines[i + 1])) {
      const shirtNumber = Number(line);
      const { name, isCaptain } = stripCaptain(lines[i + 1]);
      i += 2;
      const tokens: string[] = [];
      while (i < lines.length) {
        const t = lines[i];
        if (isSectionHeader(t)) break;
        if (SHIRT_RE.test(t) && i + 1 < lines.length && !EVENT_TOKEN.test(lines[i + 1]) && !MINUTE_RE.test(lines[i + 1])) {
          // Next shirt + name — stop unless it's a lone event digit handled below
          // Shirt numbers 7/8 can conflict with sub codes — only treat as shirt when
          // the following line looks like a name (not minute / event).
          const next = lines[i + 1];
          if (
            next &&
            !EVENT_TOKEN.test(next) &&
            !MINUTE_RE.test(next) &&
            !SHIRT_RE.test(next)
          ) {
            break;
          }
        }
        tokens.push(t);
        i += 1;
      }
      rawPlayers.push({ shirtNumber, name, isCaptain, role, tokens });
      continue;
    }

    // Orphan line
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
  const cardEvents: { playerName: string; minute: number }[] = [];
  const penalties: OgolPenalty[] = [];
  const subOuts: OgolSubOut[] = [];
  const subIns: OgolSubIn[] = [];

  for (const p of rawPlayers) {
    let ti = 0;
    const toks = p.tokens;
    while (ti < toks.length) {
      const t = toks[ti];
      const minuteMatch = t.match(MINUTE_RE);
      if (minuteMatch) {
        goals.push({ playerName: p.name, minute: Number(minuteMatch[1]) });
        ti += 1;
        continue;
      }
      const up = t.toUpperCase();
      if (up === "R") {
        const next = toks[ti + 1];
        const mm = next?.match(MINUTE_RE);
        if (mm) {
          cardEvents.push({ playerName: p.name, minute: Number(mm[1]) });
          ti += 2;
        } else {
          cardEvents.push({ playerName: p.name, minute: 200 });
          ti += 1;
          warnings.push(`Cartão de ${p.name} sem minuto`);
        }
        continue;
      }
      if (up === "B") {
        const next = toks[ti + 1];
        const mm = next?.match(MINUTE_RE);
        if (mm) {
          assists.push({ playerName: p.name, minute: Number(mm[1]) });
          ti += 2;
        } else {
          warnings.push(`Assistência de ${p.name} sem minuto`);
          ti += 1;
        }
        continue;
      }
      if (up === "A" || up === "C") {
        const next = toks[ti + 1];
        const mm = next?.match(MINUTE_RE);
        if (mm) {
          penalties.push({
            playerName: p.name,
            minute: Number(mm[1]),
            eventType: up === "A" ? "missed" : "saved",
          });
          ti += 2;
        } else {
          warnings.push(`Pênalti (${up}) de ${p.name} sem minuto`);
          ti += 1;
        }
        continue;
      }
      if (up === "7" || up === "8") {
        const next = toks[ti + 1];
        const mm = next?.match(MINUTE_RE);
        if (mm) {
          const minute = Number(mm[1]);
          if (up === "8") subOuts.push({ playerName: p.name, minute });
          else subIns.push({ playerName: p.name, minute });
          ti += 2;
        } else {
          warnings.push(`Substituição (${up}) de ${p.name} sem minuto`);
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
      cards.push({ playerName: c.playerName, minute: c.minute, cardType: "yellow" });
    } else if (n === 2) {
      cards.push({ playerName: c.playerName, minute: c.minute, cardType: "red" });
    } else {
      cards.push({ playerName: c.playerName, minute: c.minute, cardType: "yellow" });
      warnings.push(`Mais de 2 cartões para ${c.playerName}`);
    }
  }

  // Assist ambiguity: multiple goals same minute + assists
  const goalsByMinute = new Map<number, OgolGoal[]>();
  for (const g of goals) {
    const list = goalsByMinute.get(g.minute) ?? [];
    list.push(g);
    goalsByMinute.set(g.minute, list);
  }
  for (const a of assists) {
    const gs = goalsByMinute.get(a.minute) ?? [];
    if (gs.length === 0) {
      warnings.push(
        `Assistência de ${a.playerName} aos ${a.minute}' sem gol no mesmo minuto`,
      );
    } else if (gs.length > 1) {
      warnings.push(
        `Assistência de ${a.playerName} aos ${a.minute}' ambígua (${gs.length} gols) — vincular na revisão`,
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

  // Default sub pairing without positions (1:1 only); caller can re-pair with positions
  const { pairs: substitutions, warnings: subWarn } = pairSubstitutions(
    subOuts,
    subIns,
    new Map(),
    () => "Outros",
  );
  warnings.push(...subWarn);

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
