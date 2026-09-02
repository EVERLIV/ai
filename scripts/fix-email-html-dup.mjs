import fs from "node:fs";
import path from "node:path";

const dirs = ["supabase/email-templates", "public/email"];
const dup = /\s*<\/td>\s*<\/tr>\s*(?=\s*<\/td>\s*\n\s*<\/tr>\s*\n\s*<tr>\s*\n\s*<td style="padding:20px)/;

for (const d of dirs) {
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith(".html")) continue;
    const p = path.join(d, f);
    let h = fs.readFileSync(p, "utf8");
    if (dup.test(h)) {
      h = h.replace(dup, "\n");
      fs.writeFileSync(p, h);
      console.log("fixed", p);
    }
  }
}
