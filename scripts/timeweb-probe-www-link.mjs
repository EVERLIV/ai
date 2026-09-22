#!/usr/bin/env node
import { readFileSync } from "node:fs";
const token = readFileSync(".env", "utf8").match(/^VITE_TIMEWEB_API=(.+)$/m)[1].trim();
const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const APP = 192298;
const fqdn = "www.dadatut.ru";
const paths = [
  ["POST", `/api/v1/apps/${APP}/domains`, { fqdn }],
  ["POST", `/api/v1/apps/${APP}/domain`, { fqdn }],
  ["PUT", `/api/v1/apps/${APP}/domains`, { fqdn }],
  ["POST", `/api/v1/apps/${APP}/link-domain`, { fqdn }],
  ["POST", `/api/v1/apps/${APP}/attach-domain`, { fqdn }],
  ["POST", `/api/v1/app-domains`, { app_id: APP, fqdn }],
  ["POST", `/api/v1/domains/${fqdn}/link-app`, { app_id: APP }],
];
for (const [m, p, b] of paths) {
  const r = await fetch(`https://api.timeweb.cloud${p}`, { method: m, headers: h, body: JSON.stringify(b) });
  const t = await r.text();
  if (r.status !== 404 && r.status !== 405) console.log(m, p, r.status, t.slice(0, 350));
}
