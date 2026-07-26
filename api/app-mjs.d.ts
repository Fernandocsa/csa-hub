/** Ambient types for the pre-bundled Express app (no Express types needed at repo root). */
declare module "../artifacts/api-server/dist/app.mjs" {
  const app: import("http").RequestListener & {
    use: (...args: unknown[]) => unknown;
  };
  export default app;
}
