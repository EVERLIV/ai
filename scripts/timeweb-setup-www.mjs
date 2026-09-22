#!/usr/bin/env node
import { readFileSync } from "node:fs";
const token = readFileSync(".env","utf8").match(/^VITE_TIMEWEB_API=(.+)$/m)[1].trim();
const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const APP = 192298;

async function req(method, path, body) {
  const r = await fetch(`https://api.timeweb.cloud${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  console.log(`${method} ${path} → ${r.status}`, t.slice(0, 800));
  try { return JSON.parse(t); } catch { return t; }
}

// 1. Создать поддомен www
await req("POST", "/api/v1/domains/dadatut.ru/subdomains/www", {});

// 2. A-запись для www.dadatut.ru
await req("POST", "/api/v1/domains/www.dadatut.ru/dns-records", {
  type: "A",
  value: "185.84.163.45",
  ttl: 600,
});

// 3. Привязать к аккаунту / приложению
await req("POST", "/api/v1/add-domain/www.dadatut.ru", {});

// 4. Проверить приложение
const app = await req("GET", `/api/v1/apps/${APP}`);
const sha = app?.app?.commit_sha;
const domains = app?.app?.domains?.map((d) => d.fqdn) || [];
console.log("Domains:", domains.join(", "));

if (domains.includes("www.dadatut.ru") && sha) {
  await req("POST", `/api/v1/apps/${APP}/deploy`, { commit_sha: sha });
} else if (!domains.includes("www.dadatut.ru")) {
  console.log("⚠ www.dadatut.ru не привязан к приложению — добавьте вручную: Timeweb → Apps → Arenda City → Домены → «Добавить домен» → www.dadatut.ru");
}
