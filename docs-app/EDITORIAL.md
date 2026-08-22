# Editorial guide

This site has two jobs: help someone use OpenStation, and help someone build on it. Write for the person doing one of those jobs right now.

## Voice

- Talk to the reader directly. Use **you** when it makes an instruction clearer.
- Prefer ordinary words and concrete verbs: “Open Preferences,” “register a window,” “the request fails with 403.”
- Explain the behavior first. A dry aside is fine when it fits, but jokes do not carry technical meaning.
- Use contractions when they sound natural. Read the paragraph aloud; if nobody would say it that way, rewrite it.
- Keep qualifications close to the claim they qualify. OpenStation has experimental surfaces, opt-in features, and version differences worth naming plainly.

## Things we avoid

- canned reversals such as “not just X, but Y”;
- generic enthusiasm: “powerful,” “seamless,” “game-changing,” “revolutionary”;
- throat-clearing and scene-setting that delay the useful sentence;
- slogan fragments, forced three-part lists, and a punchline at the end of every section;
- fake quotations attributed to an imaginary reader;
- space metaphors in place of product terms;
- calling something “simple” or “obvious” when the reader may be seeing it for the first time.

## Two audiences

### Use OpenStation

Start with the action a site owner, editor, author, or administrator wants to take. Keep implementation details out of the main path. Link to the builder material when the distinction matters.

### Build for OpenStation

Lead with contracts, prerequisites, lifecycle, failure behavior, and compatibility. Examples should be runnable and explicit about whether an API is stable, experimental, planned, or historical.

The copied repository reference pages remain source-backed documentation. We can improve their navigation and presentation without silently changing their technical meaning.

## AI and agents

AI features are optional product capabilities, not the site's narrator or its personality.

- Say when a provider or explicit configuration is required.
- State what data is sent, stored, or made available to a model.
- Name the WordPress capability checks and trust boundaries that matter.
- Describe failure and unavailable states alongside the happy path.
- Avoid anthropomorphism and claims about intelligence, judgment, intent, or autonomy.
- Never imply that enabling an AI feature is required to get value from OpenStation.

When the feature is off, say so. When a boundary depends on site code or provider policy, say that too.
