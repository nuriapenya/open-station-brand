# Test OpenStation changes

OpenStation has several test gates because its behavior crosses PHP, WordPress permissions, TypeScript, the DOM, CSS, browser timing, build output, and plugin packaging. Choose the test that exercises the boundary you changed, then run the full set before you ship.

## Results from this documentation audit

These results were recorded against commit `a24da7c0b0d7be0d26ff29b8d525a05dd97dc77a` on August 15, 2026.

| Check | Result | Evidence |
|---|---:|---|
| Vitest | Passed | 346 files, 4,319 tests |
| TypeScript | Passed | `tsc --noEmit` |
| ESLint | Passed | all `src/**/*.ts` |
| Production build | Passed | every development and minified Vite target |
| Live product flow | Passed | dashboard, Posts + Media windows, Overview, Preferences |
| PHPUnit | Passed | 2,196 tests, 6,955 assertions, 5 skips |
| PHPCS | Passed | 208 PHP files, errors-only CI profile |
| Plugin Check | Not run | separate QA environment; not part of the repository's required test script |

We also walked through the currently published product in WordPress Playground. The public demo can trail the repository trunk, so its screenshots confirm the interaction model. They should not be used as pixel-level evidence for unreleased changes.

## JavaScript and DOM behavior with Vitest

Run the JavaScript suite with:

```bash
npm run test:js
```

Vitest uses jsdom and imports the real modules under `src/`. Test files live in `tests/vitest/` and beside components as `src/**/*.test.ts`. Every test file receives an isolated module graph, which prevents registry state from leaking between suites.

The suite covers windowing, registries, components, accessibility mechanics, brand tokens, theme reachability, bridge protocols, drag and drop, files, games, AI, agents, PWA behavior, settings, live refresh, persistence, and regression contracts.

## WordPress behavior with PHPUnit

PHPUnit runs in a dedicated `wp-env` site on port 8891. It boots the WordPress test library, activates OpenStation, and forces the opt-in Games and Agents modules on so their tests are included. The QA site on port 8890 uses a separate database and set of containers.

```bash
npm run env:start:tests
npm run test:php
npm run test:php -- --filter='Tests_OpenStation_Render'
```

### Docker Desktop file ownership

During this audit, `wp-env` 11.7.0 created `wp-config.php` as `root:root` inside Docker Desktop, while the CLI container ran as the mapped host user. `npm run env:start:tests` brought up a healthy WordPress and MariaDB stack, then failed when it tried to rewrite that file. We completed the audit in the same generated containers by running the setup command as container root, then calling the repository's unchanged PHPUnit binary with its unchanged configuration.

If you see `wp-config.php is not writable`, inspect the file's ownership inside the CLI container before removing the environment. This error comes from the local mount and ownership setup; it does not mean an OpenStation assertion failed.

A successful run may also finish with an `Undefined array key "REQUEST_URI"` warning from WordPress Core's cron bootstrap. The audited suite completed with that warning and had no OpenStation test failures.

## Linting and type checks

- `npm run lint` checks TypeScript source.
- `npm run typecheck` checks source and test types without emitting files.
- `npm run lint:php` runs the errors-only PHPCS profile inside the test environment.
- `npm run lint:php:all` includes advisory PHPCS warnings.
- `npm run check:plugin` runs WordPress Plugin Check against the live QA environment.

ESLint's project does not include the files under `tests/vitest/`. Those files are covered by typecheck and Vitest.

## Build every shipping bundle

The top-level build copies the pinned PixiJS vendor bundle, then creates development and minified output for the desktop shell, bridges, native windows, settings, overlays, window system, wallpapers, Mio, games, widgets, agents, and the service worker.

Run the full build after every repository change, including a PHP-only change. JavaScript under `assets/js/` is generated; do not edit it by hand.

## Use a real browser for browser timing

`tests/e2e/editor-preview/preview-regression.mjs` runs with Puppeteer, real WordPress autosave, and TinyMCE. It checks both sides of one regression:

- opening Preview when there is nothing to save must leave the companion window alone;
- opening Preview after a real edit must refresh the companion window.

This test was added after jsdom stubs allowed two fixes that looked reasonable but did not work in WordPress. When the bug depends on browser timing or WordPress's own JavaScript, keep the regression test at that same boundary.

See [Development](../repo/DEVELOPMENT.md) for the complete test matrix and [the regression README](../repo/editor-preview-regression.md) for that test's environment.
