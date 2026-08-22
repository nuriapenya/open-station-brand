# Build apps and extensions

If you want to add something to OpenStation, start here. The bundled extensions are useful examples because they exercise the same public APIs available to other WordPress plugins. Between them, they cover windows, storage, permissions, live registration, deferred loading, and desktop-host integration.

## Learn from the bundled extensions

### Code Editor

The Code Editor is a Monaco-backed native window for browsing and editing files under `wp-content`. A user needs the `edit_plugins` capability to make changes, and editing is disabled when `DISALLOW_FILE_EDIT` is set.

Give this extension the same care you would give WordPress's built-in file editor. It is handy on a local site and deserves serious access controls in production.

### Cron Manager

Cron Manager is a native WP-Cron browser. It can edit, delete, and run events, so access requires `manage_options`.

### SOL Inbound Monologue

SOL Inbound Monologue is an inbound-only RSS and Atom reader inspired by AIM. It has a movable buddy-list widget, a native conversation window, per-user subscriptions, unread state, safe server-side feed discovery, and optional synthesized chimes. Its implementation is a good reference for an extension that spans UI, remote content, and user-specific state.

### Popup Siege

Popup Siege is a 90-second, Breakout-style archive rescue game. It includes leaderboards, playtime, and challenges. Its bundle is not loaded until the user starts the first game, which makes it the example to follow for deferred game code.

### phpMyAdmin

The phpMyAdmin extension registers only when `wp_get_environment_type()` returns `local`. The bundled instance uses `auth_type=config` with the WordPress database credentials.

There is an important security limit here: the `manage_options` check hides the OpenStation shortcut, but it does not protect the underlying phpMyAdmin URL. Never expose this extension on a public environment.

### Electron adapter

The Electron adapter lets a supported OpenStation desktop host detach windows into real operating-system windows. It does not affect ordinary browser sessions. If you are building a compatible host, follow the [Native Desktop Host](../repo/desktop-host.md) contract.

## What a plugin can register

The public PHP and JavaScript registries cover:

- native windows and tabs;
- dock items, badges, decorators, and rail renderers;
- desktop icons, file types, file openers, and drop handlers;
- widgets and wallpapers;
- commands, palettes, and settings tabs;
- desktop themes and per-window themes;
- title-bar buttons, actions, controls, slots, notices, reveal effects, and full chrome;
- games, scoreboards, challenges, and playtime;
- OAuth relays, notifications, PWA affordances, presence, activity, and shared stores.

The [API index](../repo/api-index.md) shows the complete public surface and its stability labels. Pick the closest [working recipe](../repo/examples/README.md) before designing an integration from scratch.

## Registrations can update while OpenStation is running

Many registries refresh after a plugin is installed, activated, or deactivated, so the user usually does not need to reload the page. PHP captures a new registration payload in a real admin context, then the shell reconciles it with what is already running. When a registration needs JavaScript, its script publishes the full client-side definition.

Commands, settings tabs, dock renderers, window chrome, widgets, wallpapers, games, and themes each use a documented version of this pattern. Palettes are the current exception: they remain JavaScript-only and may require a reload after a new plugin is activated.

## Share state across bundles explicitly

OpenStation builds features as separate IIFE bundles. If two bundles import the same module, each bundle gets its own copy of that module-level singleton state.

Use `wp.os.createSharedStore()` or the corresponding internal helper for state that must be shared across bundles. If you skip this step, two perfectly healthy bundles can disagree about the same session. That is an unusually creative way to spend a debugging afternoon.
