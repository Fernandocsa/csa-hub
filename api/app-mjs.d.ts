/**
 * Ambient fallback for the prebundled Express app.
 * Specifier must match api/index.ts import character-for-character.
 *
 * Primary types for Vercel (NodeNext): artifacts/api-server/dist/app.d.mts
 * written by build.mjs. Ambient declare module is unreliable under NodeNext
 * and Vercel clears tsconfig include/files — kept as a secondary hint via
 * /// <reference /> in index.ts.
 */
declare module "../artifacts/api-server/dist/app.mjs" {
  const app: {
    (req: unknown, res: unknown): unknown;
    use: (...args: unknown[]) => unknown;
    listen: (...args: unknown[]) => unknown;
  };
  export default app;
}
