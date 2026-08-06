# vendor/

Third-party files served by this site, copied here rather than fetched from a
CDN so the guide keeps working from a plain checkout.

## mio.min.js

Mio, the OpenStation companion, as a single self-contained script: the
soft-body simulation, the renderer and PixiJS in one file. The landing mockup
loads it when a visitor presses "Release Mio".

- **From:** [WordPress/openstation](https://github.com/WordPress/openstation),
  `extensions/mio-js/dist/mio.min.js`
- **Commit:** `c4eba48` (2026-08-06)
- **License:** GPL-2.0-or-later, same as the OpenStation plugin
- **Unmodified.** SHA-256 `0de51fa28704a876827bcdcb295d182668b612e1784c4c23b74a33d72e075dc7`

To update, download the file again from `trunk` and note the new commit above.
The library is deliberately not configurable, so there is nothing to re-apply:

```
curl -o vendor/mio.min.js \
  https://raw.githubusercontent.com/WordPress/openstation/trunk/extensions/mio-js/dist/mio.min.js
```
