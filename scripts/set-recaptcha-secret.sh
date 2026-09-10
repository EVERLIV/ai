#!/usr/bin/env bash
# Устарело: Google reCAPTCHA заменена на Яндекс SmartCaptcha.
# См. docs/SETUP_SMARTCAPTCHA.md
#
# Этот скрипт просто вызывает set-smartcaptcha-secret.sh
exec "$(dirname "$0")/set-smartcaptcha-secret.sh" "$@"
