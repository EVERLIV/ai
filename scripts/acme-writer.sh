#!/bin/bash
while IFS= read -r line; do
  name="${line%% *}"
  body="${line#* }"
  printf '%s' "$body" > "/var/www/html/.well-known/acme-challenge/${name}"
done
