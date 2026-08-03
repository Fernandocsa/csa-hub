import { Router } from "express";
import {
  ensureDailyPlayer,
  evaluateGuess,
  getAdminQueue,
  MAX_ATTEMPTS,
  todaySaoPauloDate,
} from "../lib/guess-player";

const router = Router();

router.get("/quem-e-o-jogador/today", async (req, res) => {
  try {
    const date = todaySaoPauloDate();
    const daily = await ensureDailyPlayer(date);
    res.json({
      date: daily.date,
      gameNumber: daily.gameNumber,
      maxAttempts: MAX_ATTEMPTS,
    });
  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: "Erro ao carregar o jogo do dia" });
  }
});

router.post("/quem-e-o-jogador/guess", async (req, res) => {
  try {
    const body = req.body as {
      playerId?: unknown;
      attempt?: unknown;
      date?: unknown;
    };
    const playerId = Number(body.playerId);
    const attempt = Number(body.attempt);
    if (!Number.isFinite(playerId) || playerId < 1) {
      return res.status(400).json({ error: "playerId inválido" });
    }
    if (!Number.isFinite(attempt) || attempt < 1 || attempt > MAX_ATTEMPTS) {
      return res
        .status(400)
        .json({ error: `attempt deve ser entre 1 e ${MAX_ATTEMPTS}` });
    }

    const date =
      typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : todaySaoPauloDate();

    // Só aceita o dia atual (sem jogar "ontem").
    if (date !== todaySaoPauloDate()) {
      return res.status(400).json({ error: "Só é possível jogar o desafio de hoje" });
    }

    const result = await evaluateGuess(date, playerId, attempt);
    res.json(result);
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "status" in err
        ? Number((err as { status: number }).status)
        : 500;
    const message =
      err instanceof Error ? err.message : "Erro ao processar palpite";
    if (status >= 500) req.log?.error?.(err);
    res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

export default router;
