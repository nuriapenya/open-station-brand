#!/usr/bin/env bash
#
# Build a standalone bundle of the landing page for a flat static host.
#
# src/pages/index.astro preserves the landing_v1.html design. Astro emits a
# static index.html; this keeps the existing flat-host deployment contract:
#
#   index.html             the page, with ../fonts, ../vendor and ../assets rewritten
#   press/index.html       the press page, copied as-is (see below)
#   contribute/index.html  the contribute page, same
#   docs/                  the documentation site, built from docs-app/ (Node 22+)
#   assets/press/          the press page's coverage thumbnails
#   _headers          cache and security headers, read by the host at the root
#   assets/           favicons
#   fonts/            Geist and Geist Mono, plus their licence
#   vendor/           mio.min.js, plus its provenance note
#
# Usage:  mockups/build-landing-bundle.sh [output-dir]
# Output: build/landing-bundle by default (gitignored)

set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source_page="$repo_root/dist/index.html"
press_page="$repo_root/mockups/press_v1.html"
contrib_page="$repo_root/mockups/contribute_v1.html"
out=${1:-"$repo_root/build/landing-bundle"}

# Astro owns the landing source. Keep the same command, output folder and
# flat index.html contract used by the existing deployment pipelines.
command -v npm >/dev/null || { echo "error: npm not found; building the landing needs Node 22.12 or later" >&2; exit 1; }
[ -d "$repo_root/node_modules" ] || npm ci --prefix "$repo_root" --no-audit --no-fund
npm run --prefix "$repo_root" --silent build

[ -f "$source_page" ] || { echo "error: $source_page not found" >&2; exit 1; }
[ -f "$press_page" ]  || { echo "error: $press_page not found" >&2; exit 1; }
[ -f "$contrib_page" ] || { echo "error: $contrib_page not found" >&2; exit 1; }

rm -rf "$out"
mkdir -p "$out/assets" "$out/fonts" "$out/vendor" "$out/press" "$out/contribute"

# The page, with every upward reference pulled down one level. These three
# prefixes are the only ones that leave the mockups folder; the remaining "../"
# in the file is inside an HTML comment and is not a path.
sed -e 's|\.\./fonts/|fonts/|g' \
    -e 's|\.\./vendor/|vendor/|g' \
    -e 's|\.\./assets/|assets/|g' \
    "$source_page" > "$out/index.html"

# The independent theme studio is another static directory page. Its compiled
# assets live beside the index, so every existing flat host can serve it.
cp -R "$repo_root/dist/theme-creator" "$out/theme-creator"
cp -R "$repo_root/dist/_astro" "$out/_astro"
cp -R "$repo_root/dist/assets/studio" "$out/assets/studio"

# The press and contribute pages are the exceptions to the rewrite above. Each is published at
# <name>/index.html, which Spacefast resolves as a directory index (sf.jsonc
# "index", default "index.html"), so /press/ serves it and a bare /press gets a
# 308 to the same place. From that depth a page's own "../fonts" and "../assets"
# already resolve to the bundle root, so flattening them would break it; copying
# them verbatim is what makes them work.
cp "$press_page"   "$out/press/index.html"
cp "$contrib_page" "$out/contribute/index.html"

# The docs are a Vite app in docs-app/, built here and placed at docs/, so a
# page reads openstation.me/docs/#/guides/welcome. Its asset paths are relative
# and it reaches for /fonts and /assets at the bundle root rather than carrying
# copies, which is why it is only ever built into this bundle, never on its own.
docs_app="$repo_root/docs-app"
command -v npm >/dev/null || { echo "error: npm not found; building the docs needs Node 22 or later" >&2; exit 1; }
[ -d "$docs_app/node_modules" ] || npm ci --prefix "$docs_app" --no-audit --no-fund
npm run --prefix "$docs_app" --silent build
mkdir -p "$out/docs"
cp -R "$docs_app/dist/." "$out/docs/"

# The host only reads _headers from the root of the published folder, so it has
# to be copied in rather than left in mockups/. Without it the fonts come back
# with max-age=0 and the hero reflows on every visit; see the file itself.
cp "$repo_root/mockups/_headers"               "$out/_headers"

cp "$repo_root/assets/logomark-app-circle.svg" "$out/assets/"
cp "$repo_root/assets/favicon.png"             "$out/assets/"

# The social card. Its <meta> URL is absolute (scrapers do not resolve relative
# paths), so no rewrite above touches it and nothing else would pull it in, but
# the file still has to exist at that path or every shared link loses its image.
mkdir -p "$out/assets/imagery"
cp "$repo_root/assets/imagery/og.png"          "$out/assets/imagery/"

# The press page's coverage thumbnails.
mkdir -p "$out/assets/press"
cp "$repo_root"/assets/press/*.webp            "$out/assets/press/"

# OFL.txt and vendor/README.md carry the font licence and the Mio provenance.
# They ship with the bundle so the copy stays as redistributable as the repo.
cp "$repo_root/fonts/Geist-Variable.woff2"     "$out/fonts/"
cp "$repo_root/fonts/GeistMono-Variable.woff2" "$out/fonts/"
cp "$repo_root/fonts/OFL.txt"                  "$out/fonts/"
cp "$repo_root/vendor/mio.min.js"              "$out/vendor/"
cp "$repo_root/vendor/README.md"               "$out/vendor/"

# Nothing may still climb out of the bundle: those references would 404 silently
# and the page would render in a fallback font with no Mio.
for prefix in '../fonts/' '../vendor/' '../assets/'; do
  if grep -q -F -- "$prefix" "$out/index.html"; then
    echo "error: '$prefix' survived the rewrite in index.html" >&2
    exit 1
  fi
done

# And the mirror image for the pages one directory down: those same references
# have to still be there. A stray rewrite would leave them fontless with no
# favicon, which is exactly as silent a failure as the above.
for page in press contribute; do
  for prefix in '../fonts/' '../assets/'; do
    if ! grep -q -F -- "$prefix" "$out/$page/index.html"; then
      echo "error: '$prefix' missing from $page/index.html" >&2
      exit 1
    fi
  done
done

echo "Bundle ready: $out"
# The docs are a hundred-odd hashed chunks; one line for them is enough.
find "$out" -type f -not -path "$out/docs/*" | sed "s|^$out/|  |" | sort
echo "  docs/ ($(find "$out/docs" -type f | wc -l | tr -d ' ') files)"
cat <<EOF

Preview:  (cd "$out" && python3 -m http.server 8000)
Publish:  sf publish "$out" --space spc_cad149ec5a1a4dc097c84abc601e1e75
EOF
