"use strict";

/**
 * Vercel Serverless entry for the Express API (CommonJS).
 *
 * Vercel often loads /api handlers via require(). A static import of the
 * prebundled ESM app (dist/app.mjs) becomes ERR_REQUIRE_ESM. Native dynamic
 * import() works inside CommonJS and loads the ESM bundle safely.
 * Route mounts in app.ts are unchanged.
 */
const appPromise = import("../artifacts/api-server/dist/app.mjs").then(
  (mod) => mod.default,
);

module.exports = async function handler(req, res) {
  const app = await appPromise;
  return app(req, res);
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};
