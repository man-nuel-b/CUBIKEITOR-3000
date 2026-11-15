#!/bin/sh
set -eu
# Cloudflare Pages: publish only files needed by the browser.
# Keep tests, CI configuration and repository documentation outside the web root.
rm -rf dist
mkdir -p dist/src
cp index.html floor-plan.html completo.html cubikeitor-cpq-express.html cubikeitor-iso.html dist/
cp src/core.js src/app.js src/cost-worker.js src/worker-controller.js src/legacy-adapter.js src/floor-plan-core.js src/cpq-parser.js src/iso-presets.js src/iso-structure.js src/snap-engine.js src/vector-wall-mesh.js src/wall-cutouts.js src/vector-opening-mesh.js src/prices-demo.json dist/src/
printf 'User-agent: *\nDisallow: /\n' > dist/robots.txt
printf '/assets/*\n  X-Content-Type-Options: nosniff\n' > dist/_headers
test -s dist/index.html
test -s dist/floor-plan.html
test -s dist/completo.html
test -s dist/cubikeitor-cpq-express.html
test -s dist/cubikeitor-iso.html
for file in core.js app.js cost-worker.js worker-controller.js legacy-adapter.js floor-plan-core.js cpq-parser.js iso-presets.js iso-structure.js snap-engine.js vector-wall-mesh.js wall-cutouts.js vector-opening-mesh.js prices-demo.json; do
  test -s "dist/src/$file"
done
echo "CUBIKEITOR 3000 ready for Cloudflare Pages (dist/)"
