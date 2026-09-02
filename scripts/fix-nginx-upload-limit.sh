#!/usr/bin/env bash
# Увеличить лимит upload на api.arendacity.com (nginx default = 1MB → 413).
set -euo pipefail
CONF="/etc/nginx/sites-enabled/supabase"
python3 - <<'PY'
from pathlib import Path
p = Path("/etc/nginx/sites-enabled/supabase")
text = p.read_text(encoding="utf-8")
needle = "ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;\n"
insert = needle + "\n    client_max_body_size 50m;\n"
if "client_max_body_size" in text:
    print("client_max_body_size already set")
else:
    if needle not in text:
        raise SystemExit("Expected ssl_dhparam line not found")
    p.write_text(text.replace(needle, insert, 1), encoding="utf-8")
    print("Patched", p)
PY
nginx -t
systemctl reload nginx
echo "OK: nginx reloaded with client_max_body_size 50m"
