import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { surfaceTokens } from '../src/lib/surfaces.ts';
import { tokenScene } from '../src/lib/token-scenes.ts';

test('UI snapshot preserves the exact source bytes and its license', () => {
	const snapshot = JSON.parse(
		readFileSync('vendor/alcazaba-ui/snapshot.json', 'utf8'),
	);
	assert.equal(snapshot.files.length, 109);
	for (const file of snapshot.files) {
		assert.equal(
			createHash('sha256')
				.update(readFileSync('vendor/alcazaba-ui/' + file.path))
				.digest('hex'),
			file.sha256,
			file.path,
		);
	}
	assert.match(
		readFileSync('vendor/alcazaba-ui/LICENSE', 'utf8'),
		/GNU GENERAL PUBLIC LICENSE/,
	);
});

test('all catalog tokens have a named component part, including distinct step geometry', () => {
	for (const t of surfaceTokens) {
		const scene = tokenScene(t);
		assert.ok(scene.part, t.name);
		assert.ok(scene.label, t.name);
		assert.ok(scene.html.includes(`data-part="${scene.part}"`), t.name);
	}
	const scene = (name: string) =>
		tokenScene(surfaceTokens.find((t) => t.name === name)!);
	assert.equal(scene('--os-ui-step-chip-size').part, 'number');
	assert.equal(scene('--os-ui-step-connector-width').part, 'connector');
	assert.equal(scene('--os-ui-step-gap').part, 'step');
	assert.equal(scene('--os-ui-steps-gap').part, 'steps');
});

import { surfaces } from '../src/lib/surfaces.ts';
import { previewGroups } from '../src/lib/preview-groups.ts';
import { defaultCandidates } from '../scripts/station-defaults.mjs';

test('every token belongs to exactly one reviewed shared preview', () => {
	const groups = surfaces.flatMap(previewGroups);
	assert.equal(groups.length, 183);
	assert.deepEqual(
		groups.flatMap((g) => g.tokens.map((t) => t.name)).sort(),
		surfaceTokens.map((t) => t.name).sort(),
	);
	const code = groups.find((g) =>
		g.tokens.some((t) => t.name === '--os-ui-code-border'),
	)!;
	assert.ok(code.tokens.some((t) => t.name === '--os-ui-code-border-radius'));
});

test('Station snapshot prefers the base spinner fallback over the inline preset', () => {
	const candidates = defaultCandidates(
		readFileSync(
			'vendor/alcazaba-ui/src/ui/components/os-spinner/os-spinner.styles.ts',
			'utf8',
		),
		'src/ui/components/os-spinner/os-spinner.styles.ts',
	)
		.filter((t) => t.name === '--os-ui-spinner-size')
		.sort((a, b) => b.priority - a.priority);
	assert.equal(candidates[0].value, '48px');
	assert.equal(candidates[0].selector, ':host');
	assert.ok(candidates.some((t) => t.value === '16px'));
	assert.equal(
		surfaceTokens.find((t) => t.name === '--os-ui-spinner-size')!.default,
		'48px',
	);
});

test('another component’s nested styling is not a global Station default', () => {
	const own = defaultCandidates(
		'export const s = css`:host { padding: var(--os-ui-card-padding, 16px); }`;',
		'src/ui/components/os-card/os-card.styles.ts',
	);
	const nested = defaultCandidates(
		'export const s = css`:host { --os-ui-card-padding: 4px; }`;',
		'src/ui/components/os-modal/os-modal.styles.ts',
	);
	assert.ok(own[0].priority > nested[0].priority);
});
