/**
 * Vercel Serverless entry for the Express API.
 *
 * Imports the pre-bundled Express app (esbuild → dist/app.mjs) so Vercel does
 * not typecheck api-server TypeScript sources with node16/nodenext.
 * Route mounts in app.ts remain unchanged.
 */
// Built by: pnpm --filter @workspace/api-server run build
import app from "../artifacts/api-server/dist/app.mjs";

export default app;

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
};
