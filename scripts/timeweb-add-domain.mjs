#!/usr/bin/env node
/**
 * Привязка домена к Timeweb App Platform (SSL Let's Encrypt автоматически).
 * Использование: node scripts/timeweb-add-domain.mjs dadatut.ru
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const domain = process.argv[2] || "dadatut.ru";
const envPath = resolve(process.cwd(), ".env");
let token = process.env.TIMEWEB_API_TOKEN || process.env.VITE_TIMEWEB_API || "";

if (!token) {
  try {
    const raw = readFileSync(envPath, "utf8");
    const m = raw.match(/^VITE_TIMEWEB_API=(.+)$/m);
    if (m) token = m[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    /* ignore */
  }
}

if (!token) {
  console.error("Нет TIMEWEB_API_TOKEN или VITE_TIMEWEB_API в .env");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function api(path, opts = {}) {
  const res = await fetch(`https://api.timeweb.cloud${path}`, {
    ...opts,
    headers: { ...headers, ...opts.headers },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${opts.method || "GET"} ${path} → ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

const apps = await api("/api/v1/apps");
const list = apps?.apps || apps?.data || apps || [];
console.log(`Apps: ${list.length}`);

for (const app of list) {
  const id = app.id;
  const name = app.name || app.domain || id;
  const domains = app.domains || [];
  console.log(`- [${id}] ${name} domains=${JSON.stringify(domains.map((d) => d.fqdn || d))}`);

  if (name.includes("everliv") || name.includes("ai") || domains.some((d) => (d.fqdn || d).includes("arendacity"))) {
    const has = domains.some((d) => (d.fqdn || d) === domain);
    if (has) {
      console.log(`  ✓ ${domain} уже привязан`);
      continue;
    }
    console.log(`  → привязываем ${domain}...`);
    try {
      await api(`/api/v1/apps/${id}/domains`, {
        method: "POST",
        body: JSON.stringify({ fqdn: domain }),
      });
      console.log(`  ✓ POST domains OK`);
    } catch (e) {
      console.log(`  POST /domains failed: ${e.message}`);
      try {
        await api(`/api/v1/apps/${id}/domain`, {
          method: "POST",
          body: JSON.stringify({ fqdn: domain }),
        });
        console.log(`  ✓ POST domain OK`);
      } catch (e2) {
        console.log(`  POST /domain failed: ${e2.message}`);
      }
    }
  }
}

console.log("\nПроверка SSL через 1-2 мин: curl -I https://" + domain);
