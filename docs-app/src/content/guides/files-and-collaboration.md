# Files, folders, and sharing

OpenStation can place shortcuts and uploaded files on the desktop. They may look similar, but deleting them can have very different results.

## Shortcuts

A desktop shortcut can point to a post, page, media item, user, admin screen, web address, or an item supplied by a plugin. The shortcut is only a reference. Moving it or sending it to Trash does not delete the thing it opens.

OpenStation chooses how to open each kind of item through file associations. You can change an association when more than one suitable app is available.

## Uploaded files

Uploaded-file storage is experimental. You can upload a file or folder tree into storage assigned to your WordPress account. These are real file bytes, not shortcuts.

Keep these boundaries in mind:

- WordPress file-type rules apply, and executable file types are blocked.
- Downloads go through WordPress permission checks and are sent as attachments.
- You control files you own. Access to a shared folder does not automatically let another person rename, move, replace, or delete your stored files.
- Deleting your final placement of an uploaded file permanently removes its bytes, metadata, shares, and placements for recipients.
- Downloading a folder as a ZIP requires the server's `ZipArchive` extension.
- On nginx servers, an administrator must add the documented protection rule for the OpenStation upload directory. nginx does not use the included `.htaccess` file.

Because this feature is experimental, include its storage directory and database tables in any backup plan. Site administrators and developers can find the storage contract in [Files on the Desktop](../repo/files-on-desktop.md).

## Drag and drop

You can drag supported items between desktop folders, the wallpaper, Trash, the Media Library, and some editor screens. You can also drop files from your computer. OpenStation will ask whether to put them in desktop storage or the Media Library.

Dragging content into an editor works only with supported screens from the same WordPress site. External pages embedded from another origin are outside this integration.

## Share a folder

Folder sharing uses invitations. A recipient gets their own placement for the shared folder and can leave it later.

The important rules are:

- seeing a folder does not always mean you can edit it;
- moving a shared folder on your desktop does not change its identity or everyone else's layout;
- a recipient cannot share the folder onward in the current version;
- individual files use the same sharing model;
- permissions are checked when a change is made, not only when buttons are displayed.

For the exact permission matrix and conflict behavior, see the builder and administrator reference: [Folder sharing](../repo/folder-sharing.md).

## Presence and live updates

OpenStation can show another user as `online`, `inactive`, or `offline` and deliver changes while the desktop is open. File invitations, content updates, games, notes, and extensions can use the same update channel.

Presence is a recent activity signal. It should not be treated as proof that someone is reading a particular screen or available to respond.
