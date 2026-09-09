# Alcazaba dock artwork snapshot

Copied from the local Alcazaba plugin on 2026-09-09 for independent Theme Studio previews. These are data-only SVG assets; no shell runtime or plugin import is used. Original artwork is GPL-2.0-or-later, like the source plugin; see the GPL license in `vendor/alcazaba-ui/LICENSE`.

- `mio.svg`: `MIO_ICON_SVG` from `src/mio/controller.ts`.
- `overview.svg` and `system.svg`: `OS_OVERVIEW_SVG` and `OS_SYSTEM_SVG` from `src/dock-shell-tiles.ts`.
- `trash.svg`: full-bin state of `openstation_recycle_bin_icon_svg(true)` in `includes/recycle-bin/window.php`, including the lifted lid and crumpled paper.
- Exit uses the already bundled `dashicons-exit` glyph, as `src/exit-openstation.ts` does.

`provenance.json` records the source-file hashes at capture, including local changes. The preview follows the reference order: Mio, Overview, Trash, System, Exit. Images use alpha masks so theme colors remain editable; Mio's original color gradient is retained in its source asset but does not dictate the dock tint. Trash and Exit retain their manifest icon override slots. System is the sliders menu icon, not the distinct Preferences gear slot.
