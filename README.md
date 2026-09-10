# OpenStation · Brand Guidelines

The living visual identity reference for [OpenStation](https://wordpress.org/plugins/desktop-mode/), the open-source WordPress plugin that turns wp-admin into a desktop OS.

**Live guide:** https://nuriapenya.github.io/open-station-brand/

## What's here

- `index.html`: the whole guide, a single self-contained page (no build step)
- `brand.json`: design tokens (colors, meshes, typography, radii, logo rules)
- `llms.txt`: machine-readable brand summary for AI agents and tooling
- `assets/`: logomark, app icon, gradient meshes, Mio mascot explorations, merch renders
- `icons/`: the [full icon inventory](https://nuriapenya.github.io/open-station-brand/icons/), every icon OpenStation uses, and which of them come from [`@wordpress/icons`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-icons/) rather than being drawn here
- `fonts/`: Geist and Geist Mono (variable), licensed under the SIL Open Font License 1.1 (`fonts/OFL.txt`)

## Using the brand

Everything here is meant to be reused: grab assets from the [Use this brand](https://nuriapenya.github.io/open-station-brand/#use-this-brand) section of the guide, or point your tooling at `brand.json` / `llms.txt`. OpenStation itself is GPL, like all WordPress plugins; keep derived work freely licensable and don't present modified marks as official.

## Status

V0.2, a work in progress designed in the open. Iconography, imagery art direction, voice, and Mio's final form are still evolving. Feedback and issues welcome.

## Astro landing and Theme Creator (local review)

The **landing page only** now has an Astro source at `src/pages/index.astro`. The root brand-guide `index.html` stays unchanged. Its existing landing design, scripts, and assets are preserved.

```sh
npm ci                  # Node 22.12+, preferably Node 24
npm run dev             # Landing: http://127.0.0.1:4321/
                        # Studio:  http://127.0.0.1:4321/theme-creator/
npm run check           # Astro / TypeScript diagnostics
npm test                # Token, manifest, history and source-contract tests
npm run test:e2e         # Browser tests (first run: npx playwright install chromium)
npm run build           # Static site in dist/, including index.html
npm run preview         # Preview the static build
npm run build:bundle    # Existing flat-host package in build/landing-bundle/
npm run tokens:snapshot -- /path/to/alcazaba-plugin  # Explicit token data refresh
npm run themes:snapshot -- /path/to/alcazaba-plugin  # Texture/icon/settings contract
npm run tokens:help -- /path/to/alcazaba-plugin      # Refresh source-backed help
```

The existing `mockups/build-landing-bundle.sh [output-dir]` command and `index.html` output contract remain available. Building does not deploy.

Theme Creator has 712 tokens with descriptive titles, explanations and source references, 183 shared preview cards across 70 surface inspectors, Station palette and component defaults, 24 texture slots, built-in and per-app icons, bundled fonts, wallpapers, layout/effect recommendations, local drafts with assets, undo/redo and complete JSON/ZIP theme import/export. Its component specimens use a checked-in copy of the real UI kit; desktop shell scenes remain independent sketches. It runs without WordPress or a plugin checkout. See [the studio guide](docs/theme-creator.md) for architecture, preview limits, token provenance, and testing details.

The UI snapshot is maintained with `npm run components:snapshot -- /path/to/alcazaba-plugin` and compiled with `npm run components:build`. Normal dev/build commands compile the checked-in copy automatically. See [snapshot provenance and licensing](vendor/alcazaba-ui/README.md).

For ready-made materials, open **Textures → Example textures**. Six image textures include window and repeated-tile previews. Choose **Upload my own image** to add a PNG or other supported image directly; no theme ZIP is needed. Applied textures save locally and travel with exported ZIPs.

After `npm run build:bundle`, run `npm run test:bundle` to check the standalone Theme Creator, component assets, centered gallery and live token editing on a temporary local server.
