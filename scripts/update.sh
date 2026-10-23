#!/bin/sh
# Refresh the site's data on your own machine, then publish by committing and pushing.
#   scripts/update.sh coe                      # after each COE bidding round
#   scripts/update.sh car <path-to-pdf> "Sep 2026"   # when LTA publishes a new Car Cost PDF
set -e
cd "$(dirname "$0")/.."
case "$1" in
  coe) python3 scripts/update_coe.py data/coe.json ;;
  car) [ -n "$2" ] && [ -n "$3" ] || { echo 'usage: update.sh car <pdf> "<Mon YYYY>"'; exit 1; }
       python3 scripts/parse_pdf.py "$2" data/cars.json "$3" ;;
  *)   echo "usage: update.sh coe | car <pdf> \"<Mon YYYY>\""; exit 1 ;;
esac
scripts/build.sh
echo "Done. To publish:  git add -A && git commit -m 'Update data' && git push"
