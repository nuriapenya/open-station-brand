# Contribute to OpenStation

OpenStation is a WordPress plugin with PHP subsystems, TypeScript bundles, CSS assets, standalone extensions, two test environments, packaging scripts, and public contracts used by other plugins. You do not need to learn all of it before making a focused change. You do need to test the part you touched and avoid editing generated output.

## What you need

- Node **24.x**. The repository requires `>=24.0.0 <25.0.0`.
- npm.
- Docker for `wp-env`, PHPUnit, PHPCS, and Plugin Check.
- WordPress 6.0+ and PHP 7.4+ for runtime compatibility.

## Get a local build running

```bash
git clone https://github.com/WordPress/openstation.git
cd openstation
npm install
npm run build
npm run test:js
npm run typecheck
npm run lint
```

Start the manual QA site with:

```bash
npm run env:start
```

The QA site runs on port 8890 with the repository mounted as its OpenStation plugin. PHPUnit and PHP lint use a dedicated site on port 8891 configured by `.wp-env.tests.json`.

## Work in source files

Most JavaScript under `assets/js/` is generated. The two exceptions are the tracked, handwritten files `admin-bar.js` and `media-library-enhanced.js`. For everything else, edit TypeScript under `src/` and rebuild.

The brand palette lives in `assets/css/variables.css` and is scoped to `body.os-active`. Keep existing pre-brand color literals as fallbacks in `var()` declarations. Do not place themeable `--os-ui-*` defaults on a component's bare `:host`; a declaration on the element itself wins over an inherited theme value.

Holographic effects belong in `src/ui/holo.ts`. Use the flat accent on form controls and reserve mesh effects for identity moments.

## Treat public APIs as contracts

Read the relevant reference before changing a public surface, then update that documentation in the same change. The code and docs should describe the same hook signature and lifecycle.

When you work on shell UI:

- use `wp.os.fetch()` or `trackedFetch()` for requests;
- use `wp.os.confirm()` or `osConfirm()` for confirmation;
- prefer the existing `<os-*>` components;
- use `createSharedStore()` for state shared across bundles;
- expose events and synchronous state instead of putting app-specific interface policy in the framework;
- preserve the frozen `desktop_mode_*` storage identifiers unless your change includes a migration.

## Match the test to the change

Use Vitest for modules and DOM contracts. Use PHPUnit for WordPress behavior and permissions. PHPCS checks PHP coding standards, the full Vite build checks the bundles that ship, and Plugin Check covers package compatibility. Reach for a real browser when the behavior depends on timing or WordPress's actual JavaScript.

The [testing guide](./testing.md) has the commands, environment details, and known Docker ownership caveat.

## Prepare a pull request

Create a feature branch and open a pull request instead of committing directly to trunk. Give the user or reviewer a chance to test the change before it is committed and published. Translation catalogs should stay untouched during unrelated feature work.

Run the full build after each completed batch of changes. If you changed PHP, run `npm run lint:php`. If you changed a public API, update the API index, reference, architecture page, and example that define its contract.

The repository's [Development guide](../repo/DEVELOPMENT.md), [release guide](../repo/RELEASE.md), and [project README](../repo/project-readme.md) are the authoritative operational references.
