# Install and first run

You need WordPress **6.0 or newer** and PHP **7.4 or newer**. A normal installation does not require Node, Composer, or a build step.

## Install the plugin

1. Download `openstation.zip` from the [latest GitHub release](https://github.com/WordPress/openstation/releases/latest/download/openstation.zip).
2. In WordPress admin, go to **Plugins → Add New → Upload Plugin**.
3. Upload the ZIP and activate **OpenStation**.
4. Click the desktop icon on the right side of the admin bar.

OpenStation is enabled separately for each user. Turning it on for yourself does not change another person's admin layout.

## Open it directly

The main entry address is:

```text
https://your-site.example/openstation/
```

Open that address while signed in. If you are not signed in, WordPress will ask you to do so first. The portal enables OpenStation for your account and returns you to the most useful saved destination.

Older bookmarks using `/desktop-mode/` still work, but use `/openstation/` for new bookmarks and installed web apps. Once OpenStation is enabled, visits to `/wp-admin/` usually pass through the portal so saved windows and deep links can be restored.

## Get your bearings

Try these in order:

1. Open **Posts** or **Media** from the dock. It opens in a window without replacing everything else on screen.
2. Drag the title bar, resize the window, and try the minimize and maximize buttons.
3. Open **System** from the dock to find OpenStation Preferences.
4. Choose an accent, wallpaper, dock position, and dock size.
5. Open **Overview** to see all your windows and create another Space.

OpenStation remembers the size, position, state, and Space for each window. Reloading the page should restore your working set. If you move from a large monitor to a smaller one, saved windows are brought back within reach.

## Go back to standard WordPress admin

Choose **Exit OpenStation** from the dock, or use the desktop toggle in the admin bar. This changes your preference only. It does not change site content or anyone else's setup.

Deactivating the plugin also restores the regular WordPress admin. There is no content migration or repair step.

## Try the demo first

The [live demo](https://openstation.me) starts a temporary WordPress site in your browser. It does not install anything on your own site, and the temporary site disappears when the sandbox closes. The first launch usually takes about fifteen seconds.

## Building from source?

Plugin contributors and extension authors should use [Contributing and local development](./contributing.md). That guide covers the development tools, test environments, and generated files. None of them are required for a regular plugin installation.
