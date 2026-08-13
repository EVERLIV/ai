$ErrorActionPreference = "Stop"
$key = Join-Path $env:USERPROFILE ".ssh\id_ed25519_cursor_vps"
$lego = Join-Path $env:TEMP "lego\lego.exe"
$www = Join-Path $env:TEMP "acme-www"
$challenge = Join-Path $www ".well-known\acme-challenge"
$certs = Join-Path $env:TEMP "lego-certs"
New-Item -ItemType Directory -Force $challenge | Out-Null
Get-ChildItem $challenge -File -ErrorAction SilentlyContinue | Remove-Item -Force

scp -i $key -o IdentitiesOnly=yes -o BatchMode=yes `
  (Join-Path $PSScriptRoot "acme-writer.sh") `
  root@72.56.247.221:/tmp/acme-writer.sh

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "ssh"
$psi.Arguments = "-i `"$key`" -o IdentitiesOnly=yes -o BatchMode=yes root@72.56.247.221 `"chmod +x /tmp/acme-writer.sh && bash /tmp/acme-writer.sh`""
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$ssh = New-Object System.Diagnostics.Process
$ssh.StartInfo = $psi
if (-not $ssh.Start()) { throw "ssh writer failed to start" }
Start-Sleep -Milliseconds 500

$p = Start-Process -FilePath $lego -ArgumentList @(
  "--email", "noreply@arendacity.com",
  "--accept-tos",
  "-d", "api.arendacity.com",
  "--http",
  "--http.webroot", $www,
  "--path", $certs,
  "run"
) -PassThru -NoNewWindow -RedirectStandardOutput (Join-Path $env:TEMP "lego-out.txt") -RedirectStandardError (Join-Path $env:TEMP "lego-err.txt")

$copied = @{}
while (-not $p.HasExited) {
  Get-ChildItem $challenge -File -ErrorAction SilentlyContinue | ForEach-Object {
    if (-not $copied.ContainsKey($_.Name) -and $_.Length -gt 0) {
      $body = [IO.File]::ReadAllText($_.FullName).Trim()
      $ssh.StandardInput.WriteLine("$($_.Name) $body")
      $ssh.StandardInput.Flush()
      $copied[$_.Name] = $true
    }
  }
  Start-Sleep -Milliseconds 10
}

try { $ssh.StandardInput.Close() } catch {}
try { if (-not $ssh.HasExited) { $ssh.Kill() } } catch {}

Get-Content (Join-Path $env:TEMP "lego-err.txt") -ErrorAction SilentlyContinue
if ($p.ExitCode -ne 0) { exit $p.ExitCode }

$crt = Get-ChildItem (Join-Path $certs "certificates") -Filter "api.arendacity.com.crt" | Select-Object -First 1
$keyFile = Get-ChildItem (Join-Path $certs "certificates") -Filter "api.arendacity.com.key" | Select-Object -First 1
if (-not $crt -or -not $keyFile) { throw "lego cert files missing" }

scp -i $key -o IdentitiesOnly=yes -o BatchMode=yes $crt.FullName root@72.56.247.221:/tmp/api.arendacity.com.crt
scp -i $key -o IdentitiesOnly=yes -o BatchMode=yes $keyFile.FullName root@72.56.247.221:/tmp/api.arendacity.com.key

ssh -i $key -o IdentitiesOnly=yes -o BatchMode=yes root@72.56.247.221 @"
set -e
cp /tmp/api.arendacity.com.crt /etc/letsencrypt/live/api.arendacity.com/fullchain.pem
cp /tmp/api.arendacity.com.key /etc/letsencrypt/live/api.arendacity.com/privkey.pem
chmod 644 /etc/letsencrypt/live/api.arendacity.com/fullchain.pem
chmod 600 /etc/letsencrypt/live/api.arendacity.com/privkey.pem
nginx -t && systemctl reload nginx
openssl x509 -in /etc/letsencrypt/live/api.arendacity.com/fullchain.pem -noout -dates -subject
"@
