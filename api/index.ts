/**
 * Vercel Serverless entry for the Express API.
 * All /api/* traffic is rewritten here (see root vercel.json).
 * Existing route mounts in app.ts (app.use("/api", router)) are unchanged.
 */
import app from "../artifacts/api-server/src/app";

export default app;

// Let Express parse the body (required for admin POST/PUT payloads).
export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
};
