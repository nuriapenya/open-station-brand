# Limits and things to know

OpenStation covers a lot of WordPress admin, and some parts are still experimental. This page collects the limits most likely to affect day-to-day use or a deployment decision.

## It is designed for a desktop-sized screen

The current interface is desktop-first. A phone experience and a fuller tablet layout remain future work. Some screens may fit on a small display, but the desktop window behavior is not promised there.

## Settings use the most recent save

Preferences can follow your account across devices. If two browser sessions change the same setting at the same time, there is no conflict screen. The most recent save wins.

## Some extensions need a reload

Most OpenStation items refresh after a plugin is activated. Command palettes are currently registered in JavaScript, so a newly activated palette extension may need a full page reload before it appears.

## External pages have limited integration

The window bridge, navigation checks, drag and drop, and window identity are built for admin pages from the same WordPress site. A page from another origin needs its own integration and may open outside the desktop.

## Optional assistant features can send site content to a provider

The assistant is experimental and off by default. It works only after a compatible provider is configured and the current user enables it.

When used, a request can include your prompt, conversation history, tool descriptions, and relevant excerpts from posts, pages, or comments. That information is sent to the selected provider. Review the provider's data terms, site permissions, and available tools before enabling the feature. Ability descriptions marked read-only are part of the permission boundary and should be treated accordingly.

OpenStation itself does not require an assistant or an external model provider. See [Optional assistant features](./optional-ai.md) for the user-facing details.

## Uploaded-file storage is experimental

Desktop shortcuts do not own the item they point to. Uploaded files do contain real stored bytes. Deleting an owner's final placement permanently removes the file and its related shares.

On nginx, the server administrator must explicitly protect the upload directory. See [Files, folders, and sharing](./files-and-collaboration.md) before putting important files there.

## Desktop themes need careful review

Theme packages are validated and their assets are limited, but they still affect the whole interface. Test contrast, focus indicators, controls, small windows, fallbacks, icons, and fonts before making a theme available to others.

The **Desktop Mode (Legacy)** theme is intentionally frozen. It will not follow every current default.

## phpMyAdmin is for local environments

The bundled phpMyAdmin extension is intended for WordPress installations whose environment type is `local`. The shortcut's permission check does not protect the underlying phpMyAdmin address. Do not expose it on a public site.

## Notes for builders

Several old identifiers containing `desktop_mode` or `desktop-mode` are preserved for compatibility. This includes saved options, user metadata, tables, upload directories, REST routes, scheduled hooks, and browser storage keys. Renaming one without a migration can make existing data appear to vanish.

The reference documentation marks APIs as stable, experimental, planned, or historical. Check that label before depending on a surface. Native windows run in the shell's page rather than an iframe sandbox, so they should be treated as trusted plugin code. Server-side capability checks and nonces are still required, and native windows must clean up their listeners and other resources when they close.

PHPUnit, PHP coding standards, Plugin Check, and the isolated WordPress test environments require `wp-env` and a running Docker service. A passing JavaScript suite does not cover those checks. See [Testing and quality](./testing.md).
