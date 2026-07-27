import { Router, type IRouter } from "express";
import healthRouter from "./health";
import summaryRouter from "./summary";
import playersRouter from "./players";
import matchesRouter from "./matches";
import seasonsRouter from "./seasons";
import opponentsRouter from "./opponents";
import managersRouter from "./managers";
import refereesRouter from "./referees";
import miscRouter from "./misc";
import nextMatchRouter from "./next-match";
import adminRouter from "./admin";
import ratingsRouter from "./ratings";
import commentsRouter from "./comments";
import suggestionsRouter from "./suggestions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(summaryRouter);
router.use(playersRouter);
router.use(matchesRouter);
router.use(seasonsRouter);
router.use(opponentsRouter);
router.use(managersRouter);
router.use(refereesRouter);
router.use(miscRouter);
router.use(nextMatchRouter);
router.use(ratingsRouter);
router.use(commentsRouter);
router.use(suggestionsRouter);
router.use(adminRouter);

export default router;
