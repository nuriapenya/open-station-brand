# Landing port and Theme Studio

## Scope and entry points

Only the landing page is ported. `src/pages/index.astro` is the Astro source for the exact design in `mockups/landing_v1.html`. Its global, inline CSS and progressively enhanced scripts retain the original cascade and loading behavior. The only path changes are the same `../assets/`, `../fonts/`, and `../vendor/` rewrites the existing bundle script already performed.

The root `index.html` is still the original **brand guide**, unchanged. The original landing HTML is retained as the visual regression reference. Press and Contribute remain original HTML documents; Docs remains its existing independent Vite app. Nothing changes in the Alcazaba repository.

| Local URL | Content |
| --- | --- |
| `/` | Astro landing |
| `/theme-creator/` | Independent theme editor |
| `/press/`, `/contribute/`, `/docs/` | Existing supporting documents |

The final “Dock your wp-admin.” section includes a Theme Studio button beside Install the plugin and Read the source, using the existing outline button style. This is the approved addition to the original landing design.

## Development and packaging

Use Node 22.12+ (Node 24 recommended):

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4321/` or `http://127.0.0.1:4321/theme-creator/`. Astro prints the actual port if 4321 is occupied. The setup stages existing public assets into the ignored `.astro-public/` directory. On a fresh checkout it also installs and builds the existing Docs app once, so the landing's supporting links work. To refresh Docs after editing its source, run its own `npm run --prefix docs-app build` and then restart the landing dev server.

`npm run build` emits static HTML, including `dist/index.html` and `dist/theme-creator/index.html`. `npm run preview` serves that output. No server adapter or plugin connection is required.

The existing deployment command still works:

```sh
mockups/build-landing-bundle.sh
# Equivalent convenience command:
npm run build:bundle
npm run test:bundle
```

It builds the Astro landing and emits the same `build/landing-bundle/index.html` with the existing fonts, Mio vendor asset, favicons, social card, supporting pages, Docs and host headers. It now also includes `theme-creator/index.html` and its `_astro/` assets. It **does not deploy**. Existing static pipelines can keep using the same command and output directory. Astro and its lockfile are required at build time; the deployed output remains plain static files.

## Editing a theme

- Start from Station, Daylight (the frozen Legacy token snapshot), or After hours. Presets change token overrides and retain uploaded assets; Undo restores the prior theme.
- Click the desktop or component mock to inspect its whole surface. **All surfaces** exposes 70 visual inspectors containing shared previews with individual controls for all 712 catalog tokens. Search matches token names, readable titles, descriptions and states.
- Every token has a short explanation and a **?** button. Help explains the effect, relevant state, value syntax, inherited defaults and source-file/line references. Shared preview cards show the selected property’s explanation beside its controls. The workspace uses one main preview area; there is no duplicate loupe beneath it. Runtime values are identified explicitly where their code usage requires it.
- Every color swatch opens the custom picker: drag a shade, adjust hue and opacity (0–100%), or enter RGB and hex values. The checkerboard shows transparency; changes preview immediately. Six-digit hex retains the current opacity; eight-digit hex sets it. Keyboard arrows adjust the shade, with separate saturation/brightness sliders available. Opening the picker does not create an override. Gradient stops, shadow colors, quick palettes and icon tints retain alpha, including through undo, local save and export.
- Use numeric sliders, system typefaces, two-stop gradient controls and shadow controls, or enter an exact CSS value. Gradient/shadow controls deliberately replace complex values with a simpler editable construction.
- **Textures** exposes all 24 slots. Upload or drop PNG, JPEG, WebP, GIF, AVIF or self-contained SVG artwork. Adjust tiling, scaling and alignment; frame artwork has nine-slice sliders, source-image guides, edge widths, repeats and center fill. Focused title bars inherit base placement; focused frame companions fall back individually. The four corners share the first specified size in NE/NW/SE/SW order, and have a token-controlled inset.
- **Textures → Example textures** opens six material templates: brushed graphite, midnight linen, frosted glass, warm paper, soft leather and pearlescent foil. Select a material to preview the selected surface on a sample window; switch to **Repeat preview** to inspect tiling in both directions. Browsing does not edit the draft. **Apply** adds the PNG to the local asset library and updates only that texture slot, with undo/redo and ZIP packaging. Background slots start at a repeating 256px square; frame slots use an editable nine-slice descriptor and corners use the shared size. Sample text colors aid readability; applying a material does not change text-color tokens.
- Use **Upload my own image** in the chooser, or **Upload texture** in the sidebar, to select artwork from your computer. A PNG or other supported image is enough; no template ZIP is required. Image-related token controls also provide a direct **Choose or upload texture** button. Preset image provenance and generation briefs are recorded in `assets/studio/textures/README.md`.
- **Icons** covers 27 built-in slots plus `APP:<slug>`. Upload artwork or choose a Dashicon, with a searchable gallery of 350 bundled glyph names. Global and per-icon tint controls preserve full-color images or use their alpha as a mask. Window controls and recycle actions follow the host’s monochrome fallback.
- **Fonts** bundles up to 16 faces with up to four sources per face. Edit family, weight range, style, display, stretch, Unicode ranges and source order. A real browser-loaded specimen previews the selected face. “Use for interface” adds font-family overrides; individual typography tokens remain editable.
- **Wallpapers** offers up to 12 images with stable IDs, labels, descriptions, placement and repeat controls. These are choices for the user; installing a theme does not force a wallpaper change.
- **Layout & effects** exposes all nine supported recommendations. The independent mock shows dock size/position, window radius, admin-bar behavior, accent and sketches of all built-in reveal modes. Custom registry IDs are retained; their actual implementation must exist on the target site. Recommendations apply once on activation, not on every page load.
- **Assets** holds theme-preview artwork, licenses/readmes and missing file references. JSON imports containing asset paths open this panel so the files can be attached.
- **Compare original** temporarily previews the unmodified theme; it does not alter the draft. Focused/Unfocused switches window chrome states.
- **Reset theme** in the header opens a styled confirmation dialog and starts a fresh, untitled Station theme only after confirmation. It clears token edits, texture/icon/font/wallpaper assignments and layout recommendations. Uploaded files stay in the library so Undo can restore the complete previous theme. **Reset edits** confirms a narrower, token-only reset. Keep editing, the close button and Escape cancel without changes; Undo restores a confirmed reset in one step during the current session.
- The complete draft and uploaded file bytes save to IndexedDB on this device. A localStorage manifest supports migration from the original token-only studio. Undo/redo lasts for the current page session; asset references are retained across history and imports. There is no account or server save. Export ZIP for a portable backup.
- Import accepts manifest v1/v2 JSON or a ZIP. Validation is atomic: unsupported fields and malformed values are reported without silently discarding them. ZIP import accepts a root manifest or one enclosing folder, rejects unsafe paths/active SVGs, and enforces archive limits before inflation. Asset filename collisions are remapped without breaking earlier undo references.
- ZIP export contains `theme.json`, all referenced images/fonts and license/readme files. JSON export contains the manifest only. Missing referenced files block ZIP export. Only explicit token overrides are exported; defaults and accent derivations remain with the host.

## Token information and copied UI components

`src/data/alcazaba-tokens.json` is a checked-in data snapshot, captured from Alcazaba commit `bd30d985c1fac926a97d26adcbcd8cc161e03cf6` on 2026-09-09. It contains **712** unique token names, their reference defaults, Legacy values when available, categories, consuming CSS properties, and source-file provenance.

The extraction reads public `--os-*` and `--wp-admin-theme-color` declarations and `var()` uses in hand-authored styles, plus the Legacy theme manifest. `scripts/station-defaults.mjs` parses static CSS templates without executing plugin modules and records each default’s file, selector and declaration/fallback provenance. Station’s base `body.os-active` palette wins, followed by base component declarations and the component’s own CSS fallbacks. App-specific compact overrides and another component’s nested styles cannot become global defaults. Private holographic aliases are expressed through their public palette tokens. The terminal fill token exists only in Legacy and is labeled as such.

Real component specimens inherit the Station palette and retain their natural CSS fallbacks and variant rules. Only explicit user edits override those rules. For example, the base spinner is **48px**; its inline preset is **16px**. A vertical step’s connector defaults to zero, while the horizontal fixture supplies **20px**. Reset restores the component’s natural cascade. Reference defaults are not exported as token edits. Context modifiers and runtime settings can produce different resolved values in the actual plugin. The catalog is not a promise that all 712 tokens are visible simultaneously in one desktop.

The second data snapshot, `src/data/theme-contract.json`, records built-in texture/icon slots, recommendation values and package limits. `src/data/token-help.json` contains all 712 unique titles, explanatory copy, editing hints and file/line evidence. `scripts/build-token-help.mjs` derives references from source consumers/definitions and combines them with explanatory rules and carefully specified special cases. No help copy is executed as code.

To deliberately refresh the data and help:

```sh
npm run tokens:snapshot -- /path/to/alcazaba-plugin
npm run themes:snapshot -- /path/to/alcazaba-plugin
npm run tokens:help -- /path/to/alcazaba-plugin
```

These are explicit maintenance operations. Regular install, dev, build and tests never require the plugin repository. The inspector now uses real custom elements from the checked-in `vendor/alcazaba-ui` snapshot, with sample content in `src/lib/component-scenes.ts`. The snapshot preserves the original source, license and file hashes. See its README for refresh commands. The shell scenes are independent HTML/CSS sketches in `src/lib/token-scenes.ts`; they do not boot the plugin. The landing’s existing Mio behavior remains separate.

## Contract and preview limits

Alcazaba accepts at most **512 overrides** per manifest, even though more names are available to theme. The editor enforces that limit on import and edits. It also mirrors the data-only token value grammar: bounded strings, permitted characters, balanced parentheses, and no code, comments, URLs, or `var()` references. Direct custom values are validated; inherited reference defaults may contain `var()` because they are informational and are never exported automatically.

The studio covers the built-in desktop-theme manifest contract: 24 textures, up to 256 icon overrides, 16 font faces, four sources per face, 12 wallpapers, all nine settings, metadata and preview artwork. Archives allow up to 256 files, 8 MB per file and 32 MB uncompressed. Tokens themselves cannot contain image URLs; use the asset sections instead.

All 712 tokens are organized into **183 shared specimen cards** across 70 surfaces. `src/lib/preview-groups.ts` explicitly maps each surface’s parts into related groups; every token belongs to exactly one group. Property buttons below each specimen select its live binding and explanation. Code background, border, radius and typography share one code-block preview; the copy control has its own group. Distinct tones, compact variants and interaction states stay separately visible. Shell groups apply compatible bindings together; native groups share the real component’s complete token cascade.

Each catalog token has a semantic component specimen. Chips, labels, connectors, geometry, states and typography appear on the relevant component; generic A/B/C property boxes are no longer used. The step chip size controls the circle’s width and height; connector width controls only the rule, and the two gap controls act inside versus between complete steps. Each shell token has a named-part CSS binding. Tokens used inside functions receive an appropriate wrapper (for example, a brightness number is applied inside `brightness()`, and a hue inside `hsl()`). Component-local defaults come from the copied component CSS; shell reference defaults come from the source snapshot.

Component specimens use the copied UI kit and its actual CSS token consumers. Shell specimens use named parts (title bars, buttons, window frames, dock items, icons, connectors, overlays and desktop regions). Specimens are scaled to fit, so measured CSS sizes and displayed screen pixels differ. Open, selected, completed, hover and focus states are configured as fixtures. Retained category-map and trigger tokens whose elements are absent from the current picker are explicitly labeled as legacy reference sketches. Artwork placement uses a labeled sample when no file exists; uploaded artwork replaces it. This is not a running WordPress shell; it cannot guarantee pixel-identical app layouts or reproduce registered third-party effects. Runtime geometry, gestures, user accent choices and plugin behavior can override theme values on the target site. Third-party extensions to the manifest schema are reported as unsupported; registered recommendation IDs and per-app icon slots are retained.

The all-surfaces gallery centers compact specimens, including the category picker's closed trigger. Its detailed inspector opens the category list. The admin-bar specimen animates `inset-block-start` vertically between the parked peek strip and the top edge with the source's 180ms `ease` transition, with pauses between reveals for inspection. The reveal-zone property shows the otherwise invisible hover target.

The studio includes the public WordPress Dashicons font and CSS, with licensing under `assets/studio/`, plus the GPL UI snapshot under `vendor/alcazaba-ui/`. It uses no WordPress APIs or live plugin imports. The copied components' global interaction handlers are disabled for inert specimens so they cannot intercept studio keyboard shortcuts.

The desktop window uses copied `os-text-field`, `os-button`, `os-card`, `os-badge`, `os-avatar` and `os-switch` components. Inputs, navigation, actions, links, card spacing, status badges, avatars and switches retain the kit's actual token consumers and interaction states instead of duplicate mock CSS. Their defaults follow the same Station cascade as the component inspector. Clicking a control opens its related properties; the switch also toggles its preview state. The desktop window's texture frame paints on a separate, non-interactive layer above its contents: a border image wider than the physical 1px border remains equally visible on all four sides instead of being covered by the title bar and sidebar. Corner artwork stays above that layer.

## Verification

```sh
npm run check
npm test
npx playwright install chromium
npm run test:e2e
npm run build:bundle
npm run test:bundle
```

The unit tests cover the full manifest, asset-preserving ZIP round trips, archive attacks/limits, wallpaper normalization, filename collisions, token limits, immutable history, all help entries, source preservation and import isolation. Browser tests click through every one of the 712 property controls and help panels across the shared specimens, verify their CSS declaration templates, upload artwork to every texture and built-in icon slot, load a font, add a wallpaper and all settings, then check export/reimport and persistence byte-for-byte. They also cover Station defaults versus component presets, reset behavior, simultaneous border/radius edits, centered category previews, vertical admin-bar movement, focused texture inheritance, tint masks, all reveal previews, help search, mobile controls, the landing menu and supporting links.

The landing visual tests render the original HTML plus the approved Theme Studio button and the Astro route with the same fonts and viewport at 1440px and 390px, then compare full-page screenshots with **zero differing pixels**. JavaScript is disabled for the visual comparison so third-party network content and animation do not alter the reference. The menu script is tested separately with JavaScript enabled.

`test:bundle` serves the generated flat bundle on a temporary loopback port and verifies that public assets load, all 70 gallery specimens are centered, and the real spinner keeps its Station default and accepts live edits. It closes its browser and server afterward. The bundle includes `assets/studio/` as well as Astro’s compiled files.

The desktop dock uses the source Mio, Overview, full Trash and System SVGs plus the bundled Exit Dashicon, in the reference order. The source artwork is stored under `assets/studio/dock/` with file hashes and attribution. Alpha masks keep the dock tint theme-controlled; no plugin runtime is imported.
