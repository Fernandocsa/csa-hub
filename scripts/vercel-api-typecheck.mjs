/**
 * Mimics @vercel/node TypeScript compile of api/index.ts:
 * - finds root tsconfig
 * - clears include/files (as Vercel does)
 * - forces module/moduleResolution NodeNext when unset in raw config
 * - typechecks with noEmitOnError from resolved options
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, "api", "index.ts");
const configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");

if (!configPath) {
  console.error("No tsconfig.json found");
  process.exit(1);
}

const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
config.files = [];
config.include = [];
config.compilerOptions = {
  ...(config.compilerOptions || {}),
  sourceMap: true,
  inlineSourceMap: false,
  inlineSources: true,
  declaration: false,
  noEmit: false,
  outDir: "$$ts-node$$",
};

// Same as Vercel fixConfig when module is unset in the *raw* JSON (before extends)
if (config.compilerOptions.module === undefined) {
  config.compilerOptions.module = "NodeNext";
  config.compilerOptions.moduleResolution = "NodeNext";
  config.compilerOptions.strict = false;
}
if (config.compilerOptions.esModuleInterop === undefined) {
  config.compilerOptions.esModuleInterop = true;
}

const parsed = ts.parseJsonConfigFileContent(
  config,
  ts.sys,
  path.dirname(configPath),
  undefined,
  configPath,
);

const program = ts.createProgram({
  rootNames: [entry],
  options: {
    ...parsed.options,
    noEmit: true,
  },
});

const diagnostics = ts
  .getPreEmitDiagnostics(program)
  .filter((d) => d.code !== 18002 && d.code !== 18003 && d.code !== 6059);

const host = {
  getCanonicalFileName: (f) => f,
  getCurrentDirectory: () => root,
  getNewLine: () => "\n",
};

if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
  const has7016 = diagnostics.some((d) => d.code === 7016);
  console.error(
    has7016
      ? "FAIL: TS7016 still present (missing declaration for app.mjs)"
      : `FAIL: ${diagnostics.length} diagnostic(s)`,
  );
  process.exit(1);
}

console.log("OK: Vercel-like typecheck of api/index.ts passed (no TS7016)");
