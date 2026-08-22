# Welcome to OpenStation

OpenStation gives WordPress admin a desktop layout. Admin screens open in movable windows, the menu becomes a dock, and **Spaces** let you keep different kinds of work apart.

WordPress is still WordPress underneath it all. Your posts, settings, plugins, and permissions keep working as they did before. OpenStation changes how the admin screens are arranged and how you move between them.

## Here to use OpenStation?

Start with [Install and first run](./install-and-first-run.md), then take the [product tour](./product-tour.md). After that, the user guide covers:

- [windows, the dock, and Spaces](./windows-and-spaces.md);
- [appearance and personal settings](./personalize.md);
- [files, folders, and sharing](./files-and-collaboration.md);
- [optional assistant features](./optional-ai.md);
- [known limitations](./caveats.md);
- [troubleshooting](./troubleshooting.md).

You do not need Node, Composer, or API knowledge to use the plugin.

## Here to make something for OpenStation?

The builder documentation is a separate track. Begin with the repository's [Getting Started](../repo/getting-started.md) guide and keep the [API index](../repo/api-index.md) nearby. It covers window integrations, components, events, themes, extensions, and the compatibility rules that plugin authors need.

If you came here to get work done in WordPress, you can safely leave those tabs unopened.

## A few reassuring details

OpenStation is enabled per user. One person on a site can use it while another stays in the standard WordPress admin. You can leave through **Exit OpenStation**, and deactivating the plugin returns the site to its normal admin interface.

Your content remains in WordPress. It is not stored in the window layout, so moving or closing a window does not move or delete the post, page, or setting inside it.

## How this guide was checked

This documentation was reviewed against OpenStation `1.1.0` at repository commit `a24da7c0b0d7be0d26ff29b8d525a05dd97dc77a` on August 15, 2026. The build, type checks, lint checks, 4,319 JavaScript tests, and 2,196 PHP tests passed. The screenshots come from hands-on checks in the live WordPress Playground demo.

The published demo can lag behind the repository, so a button may move before its screenshot catches up. Exact results are in [Testing and quality](./testing.md).
