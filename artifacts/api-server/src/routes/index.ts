import { Router, type IRouter } from "express";
import healthRouter from "./health";
import summaryRouter from "./summary";
import playersRouter from "./players";
import matchesRouter from "./matches";
import seasonsRouter from "./seasons";
import opponentsRouter from "./opponents";
import managersRouter from "./managers";
import miscRouter from "./misc";

const router: IRouter = Router();

router.use(healthRouter);
router.use(summaryRouter);
router.use(playersRouter);
router.use(matchesRouter);
router.use(seasonsRouter);
router.use(opponentsRouter);
router.use(managersRouter);
router.use(miscRouter);

export default router;
