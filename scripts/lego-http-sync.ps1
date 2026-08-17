$ErrorActionPreference = "Stop"
$key = Join-Path $env:USERPROFILE ".ssh\id_ed25519_cursor_vps"
$www = Join-Path $env:TEMP "acme-www"
$challenge = Join-Path $www ".well-known\acme-challenge"
New-Item -ItemType Directory -Force $challenge | Out-Null

$ssh = @(
  "-i", $key, "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes",
  "root@72.56.247.221"
)

Get-ChildItem $challenge -File -ErrorAction SilentlyContinue | ForEach-Object {
  scp @("-i", $key, "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes", $_.FullName, "root@72.56.247.221:/var/www/html/.well-known/acme-challenge/$($_.Name)")
}

$watcher = New-Object System.IO.FileSystemWatcher $challenge
$watcher.EnableRaisingEvents = $true
$action = {
  Start-Sleep -Milliseconds 150
  $name = $Event.SourceEventArgs.Name
  $full = Join-Path $Event.SourceEventArgs.FullPath.Replace($name, "") $name
  if (Test-Path $full) {
    & scp -i $using:key -o IdentitiesOnly=yes -o BatchMode=yes $full "root@72.56.247.221:/var/www/html/.well-known/acme-challenge/$name"
  }
}
Register-ObjectEvent $watcher Created -Action $action | Out-Null
Register-ObjectEvent $watcher Changed -Action $action | Out-Null
