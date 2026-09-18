# Local UI component snapshot

Source: https://github.com/WordPress/openstation (local `alcazaba-plugin` checkout).
License: GPL-2.0-or-later; see LICENSE. Original source comments are retained.

This snapshot contains 48 component modules and their recursive dependencies (109 source files). `snapshot.json` records the source commit and SHA-256 for every copied file. The source checkout contained working-tree edits; the hashes, not the commit alone, identify the exact copied version.

The source files are unmodified. `entry.ts` is the studio's registration entry point. `scripts/build-ui.mjs` bundles it to `assets/studio/components.js`. Regular builds only read this repository. No live import from the plugin checkout, WordPress backend, REST service, shell bootstrap, window manager or plugin package is needed. The copied translation helper returns its English fallback when WordPress is absent. Components that require the shell or network services are excluded by the snapshot script's dependency allowlist.

`src/lib/component-scenes.ts` provides static sample data and preview states. These specimens are inert: they do not create real WordPress records, navigate or submit forms. The preview adapter releases document-level handlers for category pickers, tag inputs and flyouts so those samples cannot consume the studio's keyboard shortcuts or close when an editor field is clicked. Hover/focus/pressed specimens use derived state selectors from the original stylesheets; the vendored styles remain unchanged. Artwork-placement specimens use a labeled sample texture until a real asset is uploaded.

To explicitly refresh the snapshot:

```sh
npm run components:snapshot -- /path/to/alcazaba-plugin
npm run components:build
```

Review snapshot changes, run the studio checks and inspect the component fixtures after refreshing. This is a deliberate maintenance action, never an install or build side effect.
