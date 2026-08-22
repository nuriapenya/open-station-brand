# How OpenStation fits together

Here is the shortest useful mental model: OpenStation is a WordPress plugin with PHP registration and persistence, a multi-bundle TypeScript shell, two ways to render windows, and a typed bridge that connects the shell to existing WordPress admin pages.

## From a WordPress request to the desktop

```text
WordPress request
  → plugin bootstrap + registrations
  → shell configuration payload
  → OpenStation desktop boot
  → registries + saved preferences + saved session
  → dock, taskbar, wallpaper, widgets, files, windows
  → iframe bridge or native render callback
```

Most feature modules load on normal requests. REST routes, content-change recording, and third-party registrations may be needed outside `wp-admin`, so they cannot be limited to the desktop request. OpenStation does skip the heavier admin-rendering layer on unambiguous front-end page views.

## The TypeScript shell

`src/desktop.ts` coordinates boot. Public API assembly lives in a separate API facade, and the rest of `src/` is divided into boot, protocol, UI, window system, layout, features, registries, and independent bundle entries.

Vite compiles development and minified IIFE bundles into `assets/js/`. Those bundles are generated files. Make changes in the TypeScript source under `src/`, then rebuild.

## The two window paths

### Existing admin pages use iframes

OpenStation loads an existing WordPress admin screen with `openstation_chromeless=1`. PHP removes the standard admin chrome. The standalone iframe bridge then coordinates identity, titles, focus, navigation, external links, Screen Options, Help, unsaved changes, autosave, loading, errors, networks, drag and drop, notifications, and cross-window channels.

This bridge depends on same-origin access. A cross-origin iframe cannot participate.

### Native windows render in the shell

A native window renders directly into the parent document from a PHP template and a JavaScript render callback. The shell supplies a DOM container and lifecycle context. Your extension can mount React, Vue, Svelte, Lit, another framework, or plain DOM code. Return a cleanup function so the shell can unmount it correctly.

## Registries and live refresh

PHP registrations become a server payload consumed by the shell. Some registrations contain only metadata. Others provide a script URL; when the shell loads that script, it publishes the complete client-side definition.

Games defer their script until the first play. Desktop themes contain compiled data and do not need a script. When registrations change, the shell diffs each registry and notifies its subscribers.

## Where state lives

- **OS settings:** user meta, synchronized through REST and cached in the browser for a faster boot.
- **Window session:** the full window stack, geometry, state, focus, desktop assignment, and native parameters.
- **Desktop files:** custom tables plus protected upload storage for the file bytes.
- **Games:** score and challenge tables, with playtime kept in user meta.
- **Notes:** a private/published custom post type with owner-scoped operations and optimistic concurrency.
- **Agents:** real WordPress user identities plus agent metadata and conversation records.

You will still encounter storage names beginning with `desktop_mode_*`. These names are frozen for compatibility. Do not rename them without a migration.

## The public surface

Extensions can use PHP registration functions and hooks, `wp.os.*`, DOM `CustomEvent`s, the hook bus, activity channels, Heartbeat contributions, and the `postMessage` bridge. Each public API is labeled **Stable**, **Experimental**, **Planned**, or historical in the source documentation.

For the detailed contracts, continue with [Architecture](../repo/architecture.md), the [API index](../repo/api-index.md), [Hooks](../repo/hooks-reference.md), the [JavaScript reference](../repo/javascript-reference.md), and the [Bridge protocol](../repo/bridge-protocol.md).
