#!/bin/sh
set -eu
# Cloudflare Pages: publish only files needed by the browser.
# Keep tests, CI configuration and repository documentation outside the web root.
rm -rf dist
mkdir -p dist/src
cp index.html floor-plan.html dist/
cp src/core.js src/app.js src/cost-worker.js src/worker-controller.js src/legacy-adapter.js src/floor-plan-core.js src/vector-wall-mesh.js src/prices-demo.json dist/src/
printf 'User-agent: *\nDisallow: /\n' > dist/robots.txt
printf '/assets/*\n  X-Content-Type-Options: nosniff\n' > dist/_headers
test -s dist/index.html
test -s dist/floor-plan.html
for file in core.js app.js cost-worker.js worker-controller.js legacy-adapter.js floor-plan-core.js vector-wall-mesh.js prices-demo.json; do
  test -s "dist/src/$file"
done
echo "CUBIKEITOR 3000 ready for Cloudflare Pages (dist/)"
