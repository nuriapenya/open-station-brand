# Windows, the dock, and Spaces

Most of your time in OpenStation is spent opening WordPress screens, arranging them, and switching between groups of work. Here is how those pieces fit together.

## Use a window

Windows share the same basic controls. You can:

- drag and resize them;
- bring one to the front;
- minimize and restore;
- maximize and return to the previous size;
- enter and leave fullscreen;
- detach to a browser tab or supported desktop host;
- close the window.

When a supported screen has unsaved changes, OpenStation can check before closing it. A plugin screen has to participate in that check, so do not treat it as a substitute for saving your work.

The title bar may also include **Screen Options**, **Help**, notices, related links, theme controls, or actions supplied by the screen you are using.

## Arrange several windows

Open the **Arrange** menu in the admin bar to find:

- **Cascade**, which offsets windows so each title bar remains visible;
- **Tile**, which divides the available space between windows;
- **Overview**, which shows the current Space from a distance;
- **Snap to grid**, which lines up window positions.

Snapping, tiling, or maximizing does not erase a window's usual floating size. When you return it to normal, OpenStation uses the saved geometry.

## Dock and taskbar

The **dock** launches WordPress screens, system tools, and installed extensions. You can place it on the left, right, or bottom and change its size in Preferences.

The **taskbar** shows what is already open. If an item can have more than one window, the taskbar keeps those windows separate.

An extension may add, hide, reorder, or badge a dock item. If something you installed is missing, check **Preferences → Apps & Plugins** before assuming it has disappeared completely.

## Spaces

Spaces are separate window groups for your account. Open **Overview** to:

1. see the windows in the active Space;
2. switch to another Space;
3. add and name a Space;
4. close a Space.

OpenStation saves each window with its assigned Space. It also remembers empty Spaces, which is useful if you like to set up the room before inviting the windows in.

## Keyboard and accessibility

Press Cmd+K on macOS or Ctrl+K on Windows and Linux to open the command palette. Keyboard focus follows the active window, including its loading and activity indicators.

The shell and built-in components include keyboard controls, labels for assistive technology, focus handling, and reduced-motion support. A broader accessibility audit is still in progress. Third-party screens keep responsibility for the accessibility of their own content.

## If something goes missing

- On a smaller display, OpenStation should move saved windows back within reach.
- Use **Overview** or **Arrange → Cascade** if you cannot find a window.
- If a window came from a plugin that is now inactive, its content cannot be restored until the plugin is available again.
- If a desktop theme is no longer installed, OpenStation uses the default theme without changing your saved choice.
- Leaving OpenStation does not remove posts, media, settings, or plugin data.

See [Troubleshooting](./troubleshooting.md) for more help. Building a window or dock integration? Use [The event-driven framework](../repo/event-driven-framework.md) and [JavaScript reference](../repo/javascript-reference.md).
