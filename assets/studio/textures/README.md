# Theme Creator texture presets

Six project-owned PNG assets generated with the built-in image-generation tool on 2026-09-09. No external stock images or plugin artwork were used. Source outputs remain in the generating session's image archive; these checked-in files are the assets used by the standalone studio and exported themes.

| File | Material brief |
| --- | --- |
| `graphite.png` | Dark brushed graphite, fine horizontal satin grain, quiet and precise. |
| `linen.png` | Midnight indigo linen, fine matte interlaced fibers, soft and tactile. |
| `glass.png` | Cool frosted glass, fine etched grain and an even soft blue haze. |
| `paper.png` | Warm cream paper with delicate natural fibers. |
| `leather.png` | Soft burgundy leather with fine understated grain. |
| `pearl.png` | Pearlescent satin silver foil with lavender and teal reflections. |

Generation prompt set: create each material as one square, full-bleed texture for a repeating UI background, with uniform illumination, continuous opposite edges and no border, vignette, text, watermark, object, checkerboard or contact sheet. Preserve fine tactile detail at small CSS tile sizes. Graphite, glass and leather received targeted continuity/tone corrections. Linen was regenerated to remove a conspicuous edge band and soften the weave.

Final linen prompt: “Use case: photorealistic-natural. Create ONE square seamless tile texture, full bleed: midnight indigo soft linen, extremely fine matte textile fibers with subtly interlaced irregular threads. Production-quality seamless repeat tile for a UI background. Critical: NO selvage, hem, seams, dark lines, bright lines, borders or bands at any of the four edges. The image continues infinitely on a torus: left and right edges match; top and bottom edges match. Exactly uniform exposure and base color across the whole square. Delicate randomly varied very fine low-contrast fibers, rather than a rigid perfect grid. Soft, expensive tactile textile, dark desaturated navy blue. No flat checkerboard, no geometric pattern, no gradients, no vignettes, no shadows or folds, no objects, no text. It must look continuous when repeated in a 4x4 tiled grid. Output one tile only, not a contact sheet.”

Tiling QA uses actual browser `background-repeat` in both directions, including a multi-tile contact sheet and the chooser's **Repeat preview**. This is visual seam inspection, not a claim of identical opposite-edge pixels. Keep checking repeated views when replacing an asset. Do not introduce display-only seam hiding: the exported PNG must match the image the user previews.

The library is in `src/lib/texture-library.ts`. Selecting a template only previews it; applying adds the original PNG bytes to the theme's asset library. Default background tiling is 256px square. Frame and corner slots retain their distinct manifest rules. The preset files are shipped in both Astro and flat-host builds.
