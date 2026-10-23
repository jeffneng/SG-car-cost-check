#!/bin/sh
# Encrypt data/*.json into site/data.enc.js. Asks for the passcode (or reads $PASSCODE); it is never saved.
cd "$(dirname "$0")/.." || exit 1
if [ -z "$PASSCODE" ]; then printf 'Passcode: '; stty -echo; read -r PASSCODE; stty echo; echo; fi
PASSCODE="$PASSCODE" node scripts/encrypt.mjs
