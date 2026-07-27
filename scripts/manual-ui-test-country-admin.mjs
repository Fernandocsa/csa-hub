/**
 * Manual checklist items 2 & 3: foreign opponent edit + create via real browser UI.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, join } from "node:path";
import crypto from "node:crypto";
import os from "node:os";

const requireMain = createRequire(import.meta.url);
const pwDir = join(os.tmpdir(), "csa-pw-test", "node_modules", "playwright");
const { chromium } = requireMain(pwDir);

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  if (process.env[key] === undefined) {
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const BASE = process.env.MANUAL_TEST_BASE ?? "http://127.0.0.1:3001";
const API = process.env.MANUAL_TEST_API ?? "http://127.0.0.1:9898/api";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "admin";
const TAG = `manual-ui-${Date.now()}`;

const requireDb = createRequire(resolve("lib/db/package.json"));
const pg = requireDb("pg");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function adminToken() {
  const secret = process.env.SESSION_SECRET ?? "fallback-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`marujo-admin:${PASSWORD}`)
    .digest("hex");
}

async function apiDelete(id) {
  await fetch(`${API}/admin/opponents/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken()}` },
  });
}

let createdId = null;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  console.log("=== Item 2: edit foreign opponent (id=162) ===");

  await page.goto(`${BASE}/admin/adversarios/162`, { waitUntil: "networkidle" });

  if (page.url().includes("/admin") && (await page.getByRole("button", { name: "Entrar" }).count())) {
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(/\/admin\/adversarios\/162/, { timeout: 15000 });
  }

  await page.getByText("Talleres", { exact: false }).first().waitFor({ timeout: 10000 });

  const countryInput = page.locator('input[list="country-suggestions"]');
  await countryInput.waitFor();
  const countryValue = await countryInput.inputValue();
  assert(countryValue.toLowerCase().includes("argentin"), `country field shows Argentina, got "${countryValue}"`);

  const ufLabel = page.getByText("Estado (UF)", { exact: true });
  assert((await ufLabel.count()) === 0, "UF field must be hidden for foreign opponent");

  const suffixBtn = page.getByRole("button", { name: "Aplicar sufixo ao nome" });
  assert((await suffixBtn.count()) === 0, "suffix button must be hidden for foreign opponent");

  await page.getByText("Adversário estrangeiro (ARG)").waitFor();
  console.log("OK item 2: país preenchido, UF e sufixo ocultos");

  console.log("=== Item 3: create new foreign opponent (Argentina) ===");

  await page.goto(`${BASE}/admin/adversarios/novo`, { waitUntil: "domcontentloaded" });
  await page.getByText("Novo adversário", { exact: true }).waitFor({ timeout: 15000 });

  const novoCountryInput = page.locator('input[list="country-suggestions"]');
  const nameInput = page.locator("form").first().locator('input:not([list])').first();
  await nameInput.fill(`${TAG}-Club`);
  await novoCountryInput.fill("Argentina");
  await page.waitForTimeout(300);

  assert((await page.getByText("Estado (UF)", { exact: true }).count()) === 0, "UF hidden while typing Argentina");
  await page.getByText("Adversário estrangeiro (ARG)").waitFor();

  await page.locator('input[placeholder="ex: Córdoba"], input[placeholder="ex: Maceió"]').fill("Córdoba");
  await page.getByRole("button", { name: "Criar adversário" }).click();

  await page.waitForURL(/\/admin\/adversarios\/\d+/, { timeout: 15000 });
  const m = page.url().match(/\/admin\/adversarios\/(\d+)/);
  assert(m, "redirected to saved opponent");
  createdId = Number(m[1]);

  const savedCountry = await novoCountryInput.inputValue();
  assert(savedCountry.toLowerCase().includes("argentin"), `saved country label "${savedCountry}"`);
  assert((await page.getByText("Estado (UF)", { exact: true }).count()) === 0, "UF still hidden after save");

  const apiRes = await fetch(`${API}/admin/opponents/${createdId}`, {
    headers: { Authorization: `Bearer ${adminToken()}` },
  });
  const apiData = await apiRes.json();
  assert(apiRes.ok, `API GET ${apiRes.status}`);
  assert(apiData.country === "ARG", `API country ${apiData.country}`);
  assert(!apiData.state, `API state should be null, got ${apiData.state}`);
  assert(apiData.city === "Córdoba", `API city ${apiData.city}`);

  console.log(`OK item 3: created id=${createdId} with country=ARG, state=null`);
  console.log("=== Manual UI checklist items 2 & 3 PASSED ===");
} finally {
  if (createdId != null) await apiDelete(createdId);
  await pool.query(`DELETE FROM opponents WHERE name LIKE $1`, [`${TAG}%`]);
  await pool.end();
  await browser.close();
}
