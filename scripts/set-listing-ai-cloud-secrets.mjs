#!/usr/bin/env node
/**
 * Sets Edge Function secrets on cloud project from local .env
 * without printing secret values.
 *
 * Usage: node scripts/set-listing-ai-cloud-secrets.mjs
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "xbdwapunrlnxcuxjhaca";

function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let k = line.slice(0, i).trim();
    // tolerate BOM / typos like eVITE_
    k = k.replace(/^\uFEFF/, "").replace(/^e(?=VITE_)/, "");
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = parseEnv(readFileSync(join(root, ".env"), "utf8"));
const anthropic = env.ANTHROPIC_API_KEY || "";
const catalogUrl = env.VITE_SUPABASE_URL || "https://api.arendacity.com";
const catalogAnon =
  env.CATALOG_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const catalogService =
  env.CATALOG_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!anthropic.startsWith("sk-ant-")) {
  console.error("ANTHROPIC_API_KEY missing or invalid in .env");
  process.exit(1);
}
if (!catalogAnon) {
  console.error("VITE_SUPABASE_PUBLISHABLE_KEY missing in .env");
  process.exit(1);
}
if (!catalogService.startsWith("eyJ")) {
  console.error(
    "VITE_SUPABASE_SERVICE_ROLE_KEY missing in .env (need eyJ… JWT from VPS)",
  );
  process.exit(1);
}

console.log("Project:", PROJECT_REF);
console.log("ANTHROPIC_API_KEY: ok len=" + anthropic.length);
console.log("CATALOG_URL:", catalogUrl);
console.log("CATALOG_ANON_KEY: ok len=" + catalogAnon.length);
console.log("CATALOG_SERVICE_ROLE_KEY: ok len=" + catalogService.length);

const args = [
  "supabase",
  "secrets",
  "set",
  `ANTHROPIC_API_KEY=${anthropic}`,
  `CATALOG_URL=${catalogUrl}`,
  `CATALOG_ANON_KEY=${catalogAnon}`,
  `CATALOG_SERVICE_ROLE_KEY=${catalogService}`,
  "--project-ref",
  PROJECT_REF,
];

const r = spawnSync("npx", args, {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});
process.exit(r.status ?? 1);
