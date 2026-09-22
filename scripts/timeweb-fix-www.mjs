#!/usr/bin/env node
/** Добавить www.dadatut.ru в App Platform + DNS + redeploy для SSL */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const APP_ID = 192298;
const WWW = "www.dadatut.ru";
const APEX = "dadatut.ru";
const APP_IP = "185.84.163.45";

const token = readFileSync(resolve(process.cwd(), ".env"), "utf8")
  .match(/^VITE_TIMEWEB_API=(.+)$/m)[1]
  .trim();
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function api(method, path, body) {
  const res = await fetch(`https://api.timeweb.cloud${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  console.log(`${method} ${path} → ${res.status}`);
  if (parsed) console.log(JSON.stringify(parsed, null, 2)?.slice(0, 1500));
  return { status: res.status, body: parsed };
}

// 1. DNS A for www
const dns = await api("GET", `/api/v1/domains/${APEX}/dns-records`);
const records = dns.body?.dns_records || [];
const hasWww = records.some((r) => r.fqdn === WWW || r.data?.subdomain === "www");
if (!hasWww) {
  await api("POST", `/api/v1/domains/${APEX}/dns-records`, {
    type: "A",
    subdomain: "www",
    value: APP_IP,
    ttl: 600,
  });
} else {
  console.log("DNS www уже есть");
}

// 2. Привязка www к приложению
const addAttempts = [
  ["POST", `/api/v1/add-domain/${WWW}`, {}],
  ["POST", `/api/v1/add-domain/${WWW}`, { project_id: 2515390 }],
];
for (const [method, path, body] of addAttempts) {
  const r = await api(method, path, body);
  if (r.status === 200 || r.status === 201) break;
}

// 3. Проверить домены приложения
const app = await api("GET", `/api/v1/apps/${APP_ID}`);
const domains = app.body?.app?.domains?.map((d) => d.fqdn) || [];
console.log("App domains:", domains.join(", "));
if (!domains.includes(WWW)) {
  console.log("⚠ www ещё не в списке — возможно, нужно добавить в панели Timeweb → Apps → Arenda City → Домены");
}

// 4. Redeploy для выпуска SSL
const sha = app.body?.app?.commit_sha;
if (sha) {
  const d = await api("POST", `/api/v1/apps/${APP_ID}/deploy`, { commit_sha: sha });
  console.log("Deploy:", d.body?.deploy?.status || d.status);
}

console.log("\nПодождите 2–3 мин и проверьте https://www.dadatut.ru");
