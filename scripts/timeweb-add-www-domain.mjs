#!/usr/bin/env node
import { readFileSync } from "node:fs";
const token = readFileSync(".env", "utf8").match(/^VITE_TIMEWEB_API=(.+)$/m)[1].trim();
const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const fqdn = "www.dadatut.ru";
const bodies = [
  {},
  { app_id: 192298 },
  { app_id: "192298" },
  { project_id: 2515390 },
  { app_id: 192298, project_id: 2515390 },
  { resource_id: 192298, resource_type: "app" },
];
for (const b of bodies) {
  const r = await fetch(`https://api.timeweb.cloud/api/v1/add-domain/${fqdn}`, { method: "POST", headers: h, body: JSON.stringify(b) });
  console.log(JSON.stringify(b), "→", r.status, (await r.text()).slice(0, 200));
}
for (const q of ["?app_id=192298", "?project_id=2515390", "?app_id=192298&project_id=2515390"]) {
  const r = await fetch(`https://api.timeweb.cloud/api/v1/add-domain/${fqdn}${q}`, { method: "POST", headers: h, body: "{}" });
  console.log("query", q, "→", r.status, (await r.text()).slice(0, 200));
}
