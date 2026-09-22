#!/usr/bin/env node
import { readFileSync } from "node:fs";
const token = readFileSync(".env","utf8").match(/^VITE_TIMEWEB_API=(.+)$/m)[1].trim();
const h = { Authorization: `Bearer ${token}` };
const r = await fetch("https://api.timeweb.cloud/api/v1/domains", { headers: h });
const data = await r.json();
const all = data.domains || data || [];
for (const d of all) {
  const fqdn = d.fqdn || d.name;
  if (String(fqdn).includes("dadatut") || String(fqdn).includes("arendacity")) {
    console.log(JSON.stringify(d, null, 2));
  }
}
