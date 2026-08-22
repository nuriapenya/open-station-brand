# OpenStation Docs

The documentation site at [openstation.me/docs](https://openstation.me/docs/): a field guide for people who use [OpenStation](https://github.com/WordPress/openstation), plus the repository's full documentation library for people who build on it. It began as Nick Hamze's [openstation-docs](https://github.com/RegionallyFamous/openstation-docs) prototype and now ships as one route of the landing page, with the landing page's chrome, tokens and icons.

Writing follows the two-audience, plain-language rules in [EDITORIAL.md](./EDITORIAL.md).

## Where the content comes from

- `src/content/guides/` is written here: the product guides and the builder overview.
- `src/content/repo/` mirrors the plugin repository's `docs/` folder, README and readme.txt. These pages are source-backed reference and keep their technical meaning; the site only changes how they are presented. The commit they were checked against is in [`src/site.ts`](./src/site.ts), which is also where the version and the home page's audit figures live.

Pages are Markdown files with a level-one heading. Their title, blurb, section and headings are extracted at build time (see `docContent()` in [`vite.config.ts`](./vite.config.ts) and [`src/content-metadata.ts`](./src/content-metadata.ts)); the navigation order and section names are in that metadata module too.

## Run locally

Node 22 or later.

```bash
npm ci
npm run dev
```

Fonts, favicons and the social card are borrowed from the brand guide one level up rather than copied, so the dev server answers `/fonts/*` and `/assets/*` from there. To test the production artifact:

```bash
npm run check
npm run preview
```

`npm run check` type-checks, builds, then verifies the content inventory, the Markdown links between pages, the screenshots and the production entry point.

## How it ships

The site is not published on its own. `mockups/build-landing-bundle.sh` in the repository root builds it and places `dist/` at `docs/` inside the landing bundle, which is what gets published to Spacefast as openstation.me. Routes are hash-based (`/docs/#/guides/welcome`), so no host rewrite rule is needed and a deep link is just a file plus a fragment.

What the build produces:

- one small application chunk (React, the Markdown renderer, the app);
- one chunk per page, fetched the first time that page opens;
- one search corpus chunk, fetched the first time search opens.

## License

GPL-2.0-or-later, matching OpenStation. See [LICENSE](./LICENSE).
