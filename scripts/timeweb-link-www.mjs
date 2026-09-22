#!/usr/bin/env node
import { readFileSync } from "node:fs";
const token = readFileSync(".env","utf8").match(/^VITE_TIMEWEB_API=(.+)$/m)[1].trim();
const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const APP = 192298;

async function req(method, path, body) {
  const r = await fetch(`https://api.timeweb.cloud${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  console.log(`${method} ${path} → ${r.status}`, t.slice(0, 600));
  try { return JSON.parse(t); } catch { return t; }
}

await req("GET", "/api/v1/domains/www.dadatut.ru");
await req("GET", "/api/v1/domains/dadatut.ru/subdomains");

for (const body of [
  { app_id: APP },
  { app_id: String(APP) },
  { type: "frontend" },
]) {
  await req("PATCH", "/api/v1/domains/www.dadatut.ru", body);
}

for (const body of [
  { fqdn: "www.dadatut.ru" },
  { domain: "www.dadatut.ru" },
  { domains: [{ fqdn: "www.dadatut.ru" }] },
]) {
  await req("PATCH", `/api/v1/apps/${APP}`, body);
}

await req("GET", `/api/v1/apps/${APP}`);
