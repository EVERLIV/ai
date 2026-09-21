#!/usr/bin/env bash
# Live VPS: journald 6 months, TLS 1.2/1.3, HSTS, ufw, SSH keys-only.
set -euo pipefail

echo "== journald =="
mkdir -p /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/retention.conf <<'EOF'
[Journal]
Storage=persistent
MaxRetentionSec=6month
SystemMaxUse=4G
EOF
systemctl restart systemd-journald
grep -E 'MaxRetentionSec|SystemMaxUse|Storage' /etc/systemd/journald.conf.d/retention.conf

echo "== nginx TLS =="
cp -a /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.bak.$(date +%Y%m%d%H%M%S)"
cp -a /etc/nginx/sites-available/supabase "/etc/nginx/sites-available/supabase.bak.$(date +%Y%m%d%H%M%S)"
sed -i 's/ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;/ssl_protocols TLSv1.2 TLSv1.3;/' /etc/nginx/nginx.conf
sed -i 's/listen 443 ssl;/listen 443 ssl http2;/' /etc/nginx/sites-available/supabase
if ! grep -q Strict-Transport-Security /etc/nginx/sites-available/supabase; then
  sed -i '/ssl_dhparam/a\    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;' /etc/nginx/sites-available/supabase
fi
if ! grep -q 'ssl_protocols TLSv1.2 TLSv1.3;' /etc/nginx/sites-available/supabase; then
  sed -i '/include \/etc\/letsencrypt\/options-ssl-nginx.conf;/a\    ssl_protocols TLSv1.2 TLSv1.3;' /etc/nginx/sites-available/supabase
fi
nginx -t
systemctl reload nginx
echo "nginx reloaded"

echo "== ufw =="
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 8000/tcp
ufw deny 8443/tcp
ufw deny 8001/tcp
ufw --force enable
ufw status numbered | head -20

echo "== harden-ssh =="
APPLY=1 AUTH_KEYS=/root/.ssh/authorized_keys bash /opt/arendacity/scripts/harden-ssh.sh
sshd -T | grep -Ei 'passwordauthentication|permitrootlogin|pubkeyauthentication|kbdinteractive'
echo "DONE"
