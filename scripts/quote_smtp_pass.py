from pathlib import Path

p = Path("/opt/supabase/.env")
lines = p.read_text().splitlines(True)
out = []
changed = False
for line in lines:
    if line.startswith("SMTP_PASS="):
        raw = line[len("SMTP_PASS=") :].rstrip("\n")
        if not (raw.startswith("'") or raw.startswith('"')):
            esc = raw.replace("'", "'\"'\"'")
            line = f"SMTP_PASS='{esc}'\n"
            changed = True
    out.append(line)
if changed:
    p.write_text("".join(out))
    print("quoted")
else:
    print("already_quoted")
