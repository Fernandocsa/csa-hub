import Anthropic from "@anthropic-ai/sdk";
import type { ClaudeSeasonGame } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";

const SYSTEM = `Você é um extrator de dados de futebol para o Portal Marujo (CSA — Centro Sportivo Alagoano).
Extraia APENAS o que estiver explícito no texto. NÃO invente nomes, placares, minutos ou públicos.
Ignore completamente escalação, gols, cartões e substituições do adversário — só dados do CSA.
Gol contra (próprio do adversário a favor do CSA) deve ir com isOwnGoal=true e incrementar ownGoalsForCount; NÃO trate como gol de jogador do CSA.
Minutos no texto em 1º/2º tempo: devolva minuteRaw (número do tempo) e half (1 ou 2).
Se o minuto de substituição não aparecer, use minuteRaw=0 e half=null.
Se houver ambiguidade de nome, liste em ambiguities[] e ainda assim inclua o nome bruto nos campos.
Responda somente via a ferramenta extract_season_matches.`;

function buildUserPrompt(
  seasonYear: number,
  text: string,
  catalog: {
    players: string[];
    opponents: string[];
    competitions: string[];
    managers: string[];
    referees: string[];
  },
) {
  return `Temporada alvo: ${seasonYear}

Catálogo (apenas referência de grafia — NÃO invente IDs; use os nomes como aparecem no texto):
Adversários: ${catalog.opponents.join(" | ")}
Competições: ${catalog.competitions.join(" | ")}
Técnicos: ${catalog.managers.join(" | ")}
Árbitros: ${catalog.referees.join(" | ")}
Jogadores (amostra): ${catalog.players.slice(0, 250).join(" | ")}

Texto fonte:
---
${text}
---`;
}

const TOOL: Anthropic.Tool = {
  name: "extract_season_matches",
  description: "Extrai a lista estruturada de partidas da temporada a partir do texto.",
  input_schema: {
    type: "object",
    properties: {
      season: { type: "number" },
      games: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string", description: "YYYY-MM-DD" },
            homeAway: { type: "string", enum: ["home", "away", "neutral"] },
            opponentName: { type: "string" },
            competitionName: { type: "string" },
            phase: { type: ["string", "null"] },
            round: { type: ["string", "null"] },
            goalsFor: { type: ["number", "null"] },
            goalsAgainst: { type: ["number", "null"] },
            result: {
              type: ["string", "null"],
              enum: ["win", "draw", "loss", "unknown", null],
            },
            penaltiesFor: { type: ["number", "null"] },
            penaltiesAgainst: { type: ["number", "null"] },
            managerName: { type: ["string", "null"] },
            refereeName: { type: ["string", "null"] },
            attendance: { type: ["number", "null"] },
            attendancePaid: { type: ["number", "null"] },
            ownGoalsForCount: { type: "number" },
            csaStarters: { type: "array", items: { type: "string" } },
            csaBench: { type: "array", items: { type: "string" } },
            csaSubstitutions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  playerOut: { type: "string" },
                  playerIn: { type: "string" },
                  minuteRaw: { type: ["number", "null"] },
                  half: { type: ["number", "null"] },
                },
                required: ["playerOut", "playerIn"],
              },
            },
            csaGoals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scorerName: { type: ["string", "null"] },
                  assistName: { type: ["string", "null"] },
                  minuteRaw: { type: "number" },
                  half: { type: "number" },
                  isOwnGoal: { type: "boolean" },
                },
                required: ["minuteRaw", "half"],
              },
            },
            csaCards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  playerName: { type: "string" },
                  cardType: { type: "string", enum: ["yellow", "red"] },
                  minuteRaw: { type: ["number", "null"] },
                  half: { type: ["number", "null"] },
                },
                required: ["playerName", "cardType"],
              },
            },
            notes: { type: "array", items: { type: "string" } },
            ambiguities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  raw: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["field", "raw", "reason"],
              },
            },
          },
          required: [
            "date",
            "homeAway",
            "opponentName",
            "competitionName",
            "goalsFor",
            "goalsAgainst",
          ],
        },
      },
    },
    required: ["season", "games"],
  },
};

export type ClaudeExtractResult = {
  games: ClaudeSeasonGame[];
  season: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
    model: string;
    estimatedUsd: number;
  };
};

export async function extractSeasonMatchesWithClaude(opts: {
  seasonYear: number;
  text: string;
  catalog: {
    players: string[];
    opponents: string[];
    competitions: string[];
    managers: string[];
    referees: string[];
  };
}): Promise<ClaudeExtractResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Defina a variável de ambiente no servidor.",
    );
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16384,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "extract_season_matches" },
    messages: [
      {
        role: "user",
        content: buildUserPrompt(opts.seasonYear, opts.text, opts.catalog),
      },
    ],
  });

  const toolBlock = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolBlock || toolBlock.name !== "extract_season_matches") {
    throw new Error("Claude não retornou a ferramenta extract_season_matches");
  }

  const input = toolBlock.input as { season?: number; games?: ClaudeSeasonGame[] };
  const games = Array.isArray(input.games) ? input.games : [];
  const inTok = response.usage?.input_tokens ?? 0;
  const outTok = response.usage?.output_tokens ?? 0;
  // Sonnet ~ $3/M in + $15/M out
  const estimatedUsd = (inTok / 1e6) * 3 + (outTok / 1e6) * 15;

  return {
    season: input.season ?? opts.seasonYear,
    games,
    usage: {
      inputTokens: inTok,
      outputTokens: outTok,
      model: MODEL,
      estimatedUsd: Math.round(estimatedUsd * 10000) / 10000,
    },
  };
}
