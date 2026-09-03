import { Router, type IRouter, type Request, type Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { assertCriticalSchema, pingDatabase } from "@workspace/db";

const router: IRouter = Router();

async function healthHandler(_req: Request, res: Response) {
  try {
    await pingDatabase();
    const missing = await assertCriticalSchema();
    if (missing.length > 0) {
      res.status(503).json({
        status: "error",
        error: `schema missing: ${missing.join(", ")}`,
      });
      return;
    }
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
  } catch (err) {
    console.error(
      JSON.stringify({
        msg: "healthz-failed",
        code: (err as { code?: string }).code,
        message: err instanceof Error ? err.message : String(err),
      }),
    );
    res.status(503).json({ status: "error" });
  }
}

router.get("/healthz", healthHandler);
router.get("/health", healthHandler);

export default router;
