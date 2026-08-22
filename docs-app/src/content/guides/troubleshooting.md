# Troubleshooting

Start with a reload, then work through the section that matches what you see. If you contact a site administrator or plugin author, include the screen you were opening, what you expected, and what happened instead.

## OpenStation does not appear

1. Confirm the site uses WordPress 6.0 or newer and PHP 7.4 or newer.
2. Confirm **OpenStation** is active on the Plugins screen.
3. While signed in, visit `/openstation/` on your site.
4. Try the desktop toggle on the right side of the WordPress admin bar.
5. Ask a site administrator whether OpenStation has been disabled for your account.

If the shell still does not load, an administrator can check the browser console and WordPress debug log for a failed script bundle.

## A window is missing or off-screen

Open **Overview**, then try **Arrange → Cascade**. You can also reopen the item from the dock.

OpenStation normally adjusts saved positions when you move to a smaller display. A window supplied by a plugin cannot be restored while that plugin is inactive.

## A plugin screen looks wrong in its window

First, update OpenStation and the affected plugin. Check whether the screen works in standard WordPress admin. If it does, report the issue with the plugin name, version, browser, and a screenshot.

Plugin authors can use [Plugin compatibility](../repo/plugin-compat-layer.md) to fix layout offsets and styles without changing the screen outside OpenStation.

## A new extension appears only after a reload

Reload the desktop after activating an extension. Most registered items update while OpenStation is running, but command palettes currently need a full reload.

## A window keeps showing a loading spinner

Reload once and try opening the screen from the dock again. If only one plugin screen is affected, the plugin may not be reporting its network activity or ready state to OpenStation.

For plugin authors: send HTTP requests through `wp.os.fetch()` (or the internal `trackedFetch()`) with the correct window ID. Native windows must report that they are ready through their render context. See [JavaScript reference](../repo/javascript-reference.md).

## A browser-style alert appears

An extension may be using the browser's built-in dialog instead of OpenStation's dialog. The action may still work, but the extension should be updated.

Plugin authors should use `wp.os.confirm()` or `osConfirm()`. Browser `confirm`, `alert`, and `prompt` are intentionally disallowed in shell code.

## A desktop theme setting has no effect

Check the theme's installation instructions and confirm that the package supports your OpenStation version. Try switching to the default theme and back. An invalid or unknown value may fall back quietly instead of showing an error.

Theme authors should verify the token name, allowed value, asset path, and slot spelling. Public component tokens must be declared so inherited theme and palette values can reach them. See [Desktop themes](../repo/desktop-themes.md).

## The optional assistant is unavailable

- OpenStation works without an assistant.
- On WordPress 7.0 or newer, a compatible provider must be configured under **Settings → Connectors**.
- The current user must enable the assistant.
- The selected provider must be available, and site permissions must allow the requested action.

Before sending a request, review which provider is selected and what site content the enabled tools may access. Administrators diagnosing a failed request should use the shared request ID in the observability actions. Logs should not contain secrets or full private content.

See [Optional assistant features](./optional-ai.md) for the plain-language privacy and availability notes.

## Help for contributors

### PHP tests will not start

The test and quality-check environments require Docker. Use Node 24, start Docker, then run `npm run env:start:tests`. The test environment uses port 8891 and `.wp-env.tests.json`; manual quality checks use port 8890 and `.wp-env.json`.

### The editor-preview regression will not run

The Puppeteer regression expects a separate WordPress development site on port 8889, OpenStation enabled for the `admin` user, and a product post that can be viewed. It runs outside the normal JavaScript test environment because the issue depends on real WordPress autosave and TinyMCE timing. See [Editor-preview browser regression](../repo/editor-preview-regression.md).

### A feature has different state in two bundles

Module state may have been compiled separately into each bundle. Use `wp.os.createSharedStore()` with the same stable key in every bundle. The builder docs explain the shared-store contract.
