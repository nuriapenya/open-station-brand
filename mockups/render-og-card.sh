#!/usr/bin/env bash
#
# Render mockups/og-card.html to assets/imagery/og.png at 2400x1260.
#
# That is 1200x630 at 2x: the ratio every social scraper expects, at twice the
# density so the type stays sharp on retina timelines.
#
# Headless Chrome rather than a browser session, because --window-size and
# --force-device-scale-factor are exact. Driving a real browser gives you
# whatever device pixel ratio that display happens to have, and the card comes
# out a size nobody asked for.
#
# The page needs a server: it loads Geist over @font-face, and font loading
# from file:// is unreliable.
#
# Usage:  mockups/render-og-card.sh

set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
out="$repo_root/assets/imagery/og.png"
port=8909

chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$chrome" ] || { echo "error: Chrome not found at $chrome" >&2; exit 1; }

python3 -m http.server "$port" --directory "$repo_root" >/dev/null 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true' EXIT

# Give the server a moment, then confirm it is actually answering before
# handing the URL to Chrome. A blank card is otherwise indistinguishable.
# Quiet while polling (-s, no -S): the first attempts are expected to fail
# and their errors would read like a broken render.
for _ in $(seq 1 20); do
  if curl -fs -o /dev/null "http://localhost:$port/mockups/og-card.html"; then break; fi
  sleep 0.2
done
curl -fsS -o /dev/null "http://localhost:$port/mockups/og-card.html" \
  || { echo "error: preview server never came up on $port" >&2; exit 1; }

mkdir -p "$(dirname "$out")"
"$chrome" \
  --headless \
  --disable-gpu \
  --hide-scrollbars \
  --force-device-scale-factor=2 \
  --window-size=1200,630 \
  --default-background-color=00000000 \
  --virtual-time-budget=4000 \
  --screenshot="$out" \
  "http://localhost:$port/mockups/og-card.html" >/dev/null 2>&1

[ -f "$out" ] || { echo "error: Chrome produced no file" >&2; exit 1; }

python3 - "$out" <<'PY'
import os, struct, sys
path = sys.argv[1]
with open(path, 'rb') as fh:
    w, h = struct.unpack('>II', fh.read(24)[16:24])
kb = os.path.getsize(path) / 1024
print(f"Rendered {path}")
print(f"  {w}x{h}  ratio {w/h:.4f}  {kb:.0f} kB")
if (w, h) != (2400, 1260):
    print(f"  warning: expected 2400x1260", file=sys.stderr)
# Scrapers vary, but every one of them documents a ceiling well above this.
if kb > 5120:
    print("  warning: over 5 MB, some scrapers will skip it", file=sys.stderr)
PY
