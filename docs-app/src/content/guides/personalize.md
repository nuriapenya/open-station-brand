# Make OpenStation yours

OpenStation preferences belong to your WordPress account. You can change the desktop without changing the site for anyone else.

## Appearance

Open **System → Appearance** to choose:

- an accent color or custom gradient;
- a built-in wallpaper or a suitable image from the Media Library;
- the dock's size and position;
- a layout mode;
- startup and window preferences.

Changes appear right away. Most settings are saved to your account and restored on another device. If two sessions change the same setting at about the same time, the most recent save wins.

## Desktop themes

A desktop theme can change fonts, wallpaper, icons, textures, and the colors used throughout the shell. It is different from a theme applied to one window.

Installing a theme ZIP normally requires the `manage_options` capability. Once a theme is installed on the site, each user can decide whether to activate it. A theme may recommend settings, but choosing it does not permanently lock those settings.

The built-in **Desktop Mode (Legacy)** theme preserves the older appearance. It is intentionally kept as a snapshot, so it will not pick up every later design change.

If you want to create or distribute a theme, switch to the builder guide: [Desktop themes](../repo/desktop-themes.md). It includes the package format, asset limits, and validation rules.

## Wallpapers

Wallpapers can be simple color and CSS presets, images from the Media Library, or animated scenes. Animated scenes should pause when hidden, which helps avoid unnecessary work in the background.

Some scenes can react to windows and widgets. If motion is distracting, turn on reduced motion in your operating system. OpenStation keeps the visual style while stopping tilt and drift effects that support that setting.

## Widgets and apps

The widget picker includes cards such as clock, notes, drafts, recent comments, statistics, site views, and a focus timer. Extensions can add their own widgets. Some can be moved or resized outside the widget column.

Most OpenStation preferences follow your account. Some widget positions and sizes are stored on the current device, so a second computer may use a different arrangement.

Use **Apps & Plugins** to manage launcher entries and optional features, including Mio. Hiding a launcher does not delete the feature's data or deactivate its plugin.

## A note on visual effects

The holographic treatment is reserved for accents and a few prominent controls. Regular form fields stay flatter and easier to read. Reduced motion removes movement from those effects without hiding their selected or active state.
