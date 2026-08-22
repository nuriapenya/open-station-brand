# Product tour

OpenStation keeps familiar WordPress screens and lets you use several of them side by side. These screenshots were captured from the live Playground demo on August 15, 2026. The demo may be a release behind the repository, so small details can change.

## The desktop

![OpenStation dashboard window with dock, taskbar, clock, wallpaper, and optional companion](/screenshots/openstation-dashboard.png)

The desktop holds your wallpaper, dock, taskbar, widgets, icons, and open windows. It also provides shared tools such as Overview, notifications, and the command palette.

The Dashboard in the screenshot is the regular WordPress Dashboard. Screen Options, Help, links, forms, and plugin screens continue to work inside their windows.

## Work with several screens

![Dashboard, Posts, and Media open as separate windows](/screenshots/openstation-multi-window.png)

Opening something from the dock does not have to replace the screen you were using. You can keep Posts, Media, and the Dashboard open together, then drag, resize, minimize, maximize, tile, or snap their windows.

You can also detach a window into a browser tab or a supported desktop host. This is useful when one screen needs its own monitor or a little less company.

Some windows contain existing WordPress admin pages. Others are built directly for OpenStation. You use the same basic controls either way. Developers who need the distinction can read [Architecture](../repo/architecture.md) and [Native windows](../repo/examples/native-windows.md).

## Organize work with Spaces

![OpenStation Overview showing three windows and one virtual desktop](/screenshots/openstation-spaces-overview.png)

Overview shows the windows in your current Space and lets you create, name, switch, or close Spaces. Each Space keeps its own set of windows. Your dock, wallpaper, and personal preferences stay the same.

You might keep the editor and Media Library in one Space, Comments and Users in another, and site maintenance in a third. Names are up to you. “Miscellaneous” is allowed, although experience suggests it is a long-term commitment.

## Set up the interface

![OpenStation Preferences appearance panel](/screenshots/openstation-preferences.png)

OpenStation Preferences includes appearance, desktop themes, window behavior, apps and plugins, optional features, components, file associations, and version information. Most preferences follow your WordPress account, so they can be restored when you sign in on another device. A few items, such as some widget positions, stay with the current device.

## Features worth knowing about

- **Command palette:** press Cmd+K on macOS or Ctrl+K on Windows and Linux to search available actions. Optional assistant features, when enabled and configured, also use this area.
- **Taskbar:** shows windows that are currently open. This is separate from the dock, which launches them.
- **Widgets:** includes clock, drafts, comments, post statistics, site views, notes, and a focus timer. Extensions can add more.
- **WP Explorer:** browses posts, pages, media, users, terms, WooCommerce records, and other supported content.
- **Desktop files:** supports shortcuts, folders, file associations, uploads, sharing, and Trash. Uploaded-file storage is still experimental; read [Files, folders, and collaboration](./files-and-collaboration.md) before relying on it for important files.
- **Games:** an optional framework with a library, scoreboards, challenges, and playtime tracking.
- **Mio:** an optional desktop companion. It is off by default and can be managed in Preferences.

Next: [Windows, the dock, and Spaces](./windows-and-spaces.md).
