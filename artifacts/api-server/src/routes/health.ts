import { Router, type IRouter, type Request, type Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { inspectSqlSchema, pingDatabase } from "@workspace/db";

const router: IRouter = Router();

async function healthHandler(_req: Request, res: Response) {
  try {
    await pingDatabase();
    const { missing, extras, pendingFiles } = await inspectSqlSchema();
    const problems = [...missing, ...extras];
    if (problems.length > 0) {
      const preview = problems.slice(0, 20);
      res.status(503).json({
        status: "error",
        error: `schema missing: ${preview.join(", ")}${problems.length > 20 ? ` (+${problems.length - 20} more)` : ""}`,
        pendingFiles,
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
