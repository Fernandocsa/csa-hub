import { Router } from "express";
import {
  ensureDailyPlayer,
  evaluateGuess,
  getPlayerPhotoUrl,
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

/**
 * Proxy same-origin da foto (para canvas de compartilhamento sem CORS).
 * Fotos já são públicas nas fichas de jogador.
 */
router.get("/quem-e-o-jogador/photo/:playerId", async (req, res) => {
  try {
    const playerId = parseInt(req.params.playerId, 10);
    if (!Number.isFinite(playerId) || playerId < 1) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const photoUrl = await getPlayerPhotoUrl(playerId);
    if (!photoUrl) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }

    if (photoUrl.startsWith("data:")) {
      const m = photoUrl.match(/^data:([^;,]+);base64,([\s\S]+)$/);
      if (!m) return res.status(400).json({ error: "data URL inválida" });
      const buf = Buffer.from(m[2], "base64");
      res.setHeader("Content-Type", m[1]);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(buf);
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    try {
      const upstream = await fetch(photoUrl, {
        headers: { "User-Agent": "PortalMarujo/1.0" },
        signal: ctrl.signal,
      });
      if (!upstream.ok) {
        return res.status(502).json({ error: "Falha ao buscar foto" });
      }
      const contentType =
        upstream.headers.get("content-type") || "image/jpeg";
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buf);
    } finally {
      clearTimeout(timer);
    }  } catch (err) {
    req.log?.error?.(err);
    res.status(500).json({ error: "Erro ao carregar foto" });
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
