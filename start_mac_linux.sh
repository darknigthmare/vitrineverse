#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  printf '%s\n' 'Ouvrir http://localhost:8080 dans le navigateur.'
  python3 -m http.server 8080
elif command -v python >/dev/null 2>&1; then
  printf '%s\n' 'Ouvrir http://localhost:8080 dans le navigateur.'
  python -m http.server 8080
else
  printf '%s\n' 'Python est absent. Ouvrez VITRINEVERSE_PLAY.html directement.'
fi
