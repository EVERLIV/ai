#!/usr/bin/env python3
"""Добавляет location /email/ в nginx для api.arendacity.com."""
from pathlib import Path

p = Path("/etc/nginx/sites-enabled/supabase")
t = p.read_text()
if "location /email/" in t:
    print("nginx_email_exists")
else:
    needle = "    location / {\n        proxy_pass http://localhost:8000;"
    insert = (
        "    location /email/ {\n"
        "        alias /var/www/html/email/;\n"
        "        default_type text/html;\n"
        "        charset utf-8;\n"
        "        add_header Access-Control-Allow-Origin *;\n"
        "    }\n\n"
    )
    if needle not in t:
        raise SystemExit("nginx needle not found")
    p.write_text(t.replace(needle, insert + needle, 1))
    print("nginx_email_ok")
