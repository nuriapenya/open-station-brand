# Optional assistant features

OpenStation's desktop, windows, Spaces, files, themes, and extensions work without AI. You do not need to configure a model provider to use the core product.

The command-palette assistant is experimental and off by default. It appears only when the site has a compatible provider and the current user enables it. Agents are a separate experimental feature behind a site-level option; enabling one does not automatically enable the other.

## What needs to be configured

On WordPress 7.0 or newer, a site administrator can configure a provider under **Settings → Connectors**. Availability also depends on the provider being reachable and on the current user's WordPress permissions.

If no provider is configured, or the feature is switched off, OpenStation continues to work normally. Assistant controls may be hidden or show that the service is unavailable.

## What may leave the site

During an assistant turn, OpenStation can send the selected provider:

- the prompt you enter;
- relevant conversation history;
- descriptions of tools available for that turn;
- matching excerpts from posts, pages, or comments when a tool or request needs them.

The exact data depends on the action and enabled tools. Check the provider's data terms and your site's permissions before turning the feature on, especially on sites with private, customer, or regulated content.

Tools still run under WordPress capability checks. Enabling an assistant does not grant a user new WordPress permissions. Site owners should review each available ability and confirm that its read-only label matches what it actually does.

## The automatic comment check

Comment moderation is the one feature that can send content for analysis without someone opening the assistant. It has its own site-wide **Score new comments with AI** switch under **OpenStation Preferences → Features**. The switch is off by default, only administrators can change it, and it does nothing until a text provider is configured.

When the switch is on, OpenStation sends each new or edited comment to the configured provider. The request includes up to 3,000 characters of comment text and the title of the parent post. The result records a topic, summary, and spam and harmful-content flags for the Comments window. Pingbacks and trackbacks are skipped.

This setting is independent of each user's assistant preference. Turning off the command-palette assistant does not turn off a site-wide comment check that an administrator enabled. OpenStation does not automatically analyze posts, pages, or terms.

Administrators should include this data flow in their privacy review and any notice required for the site.

## For builders and security reviewers

The implementation, tool contracts, permission boundaries, request tracing, and agent internals are covered in [AI and agents](./ai-and-agents.md). That page is intended for people building or auditing the integration; you do not need it for ordinary desktop use.
