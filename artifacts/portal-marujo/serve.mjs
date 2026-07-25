/**
 * Production static server for Portal Marujo.
 *
 * Replaces Replit's built-in static serving so we can set correct
 * Cache-Control headers:
 *
 *   /assets/*  → public, max-age=31536000, immutable  (content-hashed by Vite)
 *   /*         → no-cache, no-store, must-revalidate   (index.html, always fresh)
 */

import { createServer } from "node:http";
import { createReadStream, statSync, existsSync } from "node:fs";
import { join, extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const dist  = resolve(__dir, "dist", "public");
const port  = Number(process.env.PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".mjs":  "application/javascript",
  ".css":  "text/css",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".txt":  "text/plain",
  ".json": "application/json",
  ".xml":  "application/xml",
};

function send(res, filePath, cacheControl) {
  const stat = statSync(filePath);
  const ext  = extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type":   MIME[ext] ?? "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control":  cacheControl,
  });
  createReadStream(filePath).pipe(res);
}

function sendIndex(res) {
  const idx = join(dist, "index.html");
  send(res, idx, "no-cache, no-store, must-revalidate");
}

createServer((req, res) => {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

  // Content-hashed Vite assets — cache forever
  if (pathname.startsWith("/assets/")) {
    const file = join(dist, pathname);
    if (existsSync(file)) {
      return send(res, file, "public, max-age=31536000, immutable");
    }
  }

  // Known static files with an extension (favicon, robots.txt, etc.)
  const ext = extname(pathname);
  if (ext && ext !== ".html") {
    const file = join(dist, pathname);
    if (existsSync(file)) {
      return send(res, file, "public, max-age=3600");
    }
  }

  // Everything else → SPA index.html, never cached
  sendIndex(res);
}).listen(port, "0.0.0.0", () => {
  console.log(`[portal-marujo] serving dist/public on port ${port}`);
});
