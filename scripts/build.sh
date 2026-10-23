#!/bin/sh
# Bundle data/*.json into site/data.js so the site works on any static host (and from file://).
cd "$(dirname "$0")/.." || exit 1
{ printf 'window.CARS_DATA = '; cat data/cars.json; printf ';\nwindow.COE_DATA = '; cat data/coe.json; printf ';\n'; } > site/data.js
echo "wrote site/data.js"
