import { Router } from "express";
import {
  loadBirthdays,
  saoPauloYmd,
} from "../lib/birthdays";

const router = Router();

router.get("/birthdays/today", async (req, res) => {
  try {
    const data = await loadBirthdays(saoPauloYmd(), false);
    res.json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
