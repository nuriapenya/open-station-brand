#!/usr/bin/env bash
#
# Build a standalone bundle of the landing page for a flat static host.
#
# mockups/landing_v1.html reaches one directory up for its fonts, its Mio widget
# and its favicons. That resolves on GitHub Pages, where the whole brand guide is
# deployed, but not on a host that takes a single folder. This flattens the page
# into a self-contained directory:
#
#   index.html   the page, with ../fonts, ../vendor and ../assets rewritten
#   assets/      favicons
#   fonts/       Geist and Geist Mono, plus their licence
#   vendor/      mio.min.js, plus its provenance note
#
# Usage:  mockups/build-landing-bundle.sh [output-dir]
# Output: build/landing-bundle by default (gitignored)

set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source_page="$repo_root/mockups/landing_v1.html"
out=${1:-"$repo_root/build/landing-bundle"}

[ -f "$source_page" ] || { echo "error: $source_page not found" >&2; exit 1; }

rm -rf "$out"
mkdir -p "$out/assets" "$out/fonts" "$out/vendor"

# The page, with every upward reference pulled down one level. These three
# prefixes are the only ones that leave the mockups folder; the remaining "../"
# in the file is inside an HTML comment and is not a path.
sed -e 's|\.\./fonts/|fonts/|g' \
    -e 's|\.\./vendor/|vendor/|g' \
    -e 's|\.\./assets/|assets/|g' \
    "$source_page" > "$out/index.html"

cp "$repo_root/assets/logomark-app-circle.svg" "$out/assets/"
cp "$repo_root/assets/favicon.png"             "$out/assets/"

# The social card. Its <meta> URL is absolute (scrapers do not resolve relative
# paths), so no rewrite above touches it and nothing else would pull it in, but
# the file still has to exist at that path or every shared link loses its image.
mkdir -p "$out/assets/imagery"
cp "$repo_root/assets/imagery/og.png"          "$out/assets/imagery/"

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

echo "Bundle ready: $out"
find "$out" -type f | sed "s|^$out/|  |" | sort
cat <<EOF

Preview:  (cd "$out" && python3 -m http.server 8000)
Publish:  sf publish "$out" --space spc_cad149ec5a1a4dc097c84abc601e1e75
EOF
