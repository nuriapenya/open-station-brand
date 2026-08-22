# Optional AI features and agents

This page is for builders deciding whether to integrate with OpenStation's AI features. The desktop, windows, dock, files, themes, widgets, and extension APIs work without them.

There are two separate features to evaluate: an optional assistant in the command palette and an experimental agents framework. Both involve external model output and site data, so provider choice, permissions, and trust boundaries need to be part of the implementation plan.

## Command-palette assistant

The assistant appears in the Cmd+K / Ctrl+K palette. On WordPress 7.0 or newer, requests go through the WordPress AI Client to the provider selected in **Settings → Connectors**. OpenStation does not receive or manage the provider's key.

If no provider is configured, OpenStation does not make an external AI request. Check provider configuration when a request cannot start, and handle provider or network failures like any other remote-service failure.

During an assistant turn, the selected provider can receive:

- the user's prompt;
- conversation history from the active session;
- tool-call metadata;
- excerpts from WordPress posts, pages, or comments returned by the built-in search tools.

Those search tools perform ordinary WordPress keyword searches. The only automatic content analysis is comment spam scoring when a comment is saved. OpenStation does not silently analyze posts, pages, or terms in the background.

Before enabling the assistant, confirm which provider is configured and whether sending matching content excerpts fits the site's privacy requirements.

## Extend the assistant

A plugin can:

- add a slash command with `wp.os.registerCommand()`;
- make a request through `wp.os.ai.ask()`;
- adjust model configuration with the documented filters;
- expose client commands that may be called during an assistant turn.

Start with [Programmatic AI](../repo/examples/ai-ask.md) and [Register a command](../repo/examples/register-command.md). Treat remote responses as untrusted data and show useful failure states when the provider is missing, unreachable, or returns an error.

## Server tools and the Abilities API

Server-dispatched tools use the WordPress Abilities API. OpenStation offers the model only abilities whose metadata marks them as read-only. At execution time, WordPress still runs the ability's permission callback and validates its input schema.

That read-only label is a security boundary, so it must describe the real behavior. Never label a write-capable ability as read-only just to make it available to the model.

Tool results may contain attacker-controlled text from a post or comment. That text remains data. It cannot grant permission or change the allowed tool set, and it should never be processed in the same loop as a write-capable ability.

## Experimental agents

Agents are behind an extended option and disabled by default. Each agent uses a real WordPress user row as its authorization identity. Its associated data includes a description, instructions, role, abilities, conversation history, and invocation endpoints.

Keep these boundaries intact:

1. **An agent cannot authenticate.** Its user row provides an identity for authorization checks; it is not a login account.
2. **A run cannot exceed its invoker.** Effective capabilities are capped by the human or process that starts the run.
3. **Tool output carries no authority.** Output may affect model processing, but it cannot grant capabilities or bypass permission checks.
4. **A role grants capabilities.** Review an agent role with the same care as any other WordPress role assignment.

Conversation ownership, endpoint permissions, rate limits, cancellation, drag-and-drop invocation, and the complete security review checklist are documented in [Agents security](../repo/agents-security.md) and the [Agents recipe](../repo/examples/agents.md).

## Review before enabling either feature

- Identify the configured provider and the data it can receive.
- Assume that matching WordPress content excerpts can leave the site during an assistant turn.
- Verify that every model-visible server ability is genuinely read-only.
- Keep authorization checks in server callbacks. Hiding a command or button is only an interface choice.
- Treat prompts, site content, previous tool results, and remote responses as untrusted data.
- Make missing configuration, denied permissions, network errors, provider errors, and cancellation visible to the user.
