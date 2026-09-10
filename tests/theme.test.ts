import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
	emptyTheme,
	parseTheme,
	valueError,
	History,
} from '../src/lib/theme.ts';

test('exports preserve safe CSS values, including quoted fonts and gradients', () => {
	const tokens = {
		'--os-ui-accent': '#93f0c6',
		'--os-bg': 'linear-gradient(160deg, #010101 0%, #111114 100%)',
		'--os-ui-font': '"Geist", system-ui, sans-serif',
		'--os-window-shadow': '0 8px 32px rgba(0,0,0,0.5)',
	};
	assert.deepEqual(parseTheme({ ...emptyTheme(), tokens }).tokens, tokens);
});
test('unsafe CSS and malformed manifests fail atomically', () => {
	for (const value of [
		'red; color: blue',
		'url(https://evil.test)',
		'var(--private)',
		'expression(alert(1))',
		'red/*comment*/',
		'rgba(0,0,0,1',
		'red}',
		'',
		'x'.repeat(257),
	])
		assert.notEqual(valueError(value), null, value);
	for (const patch of [
		{ id: '../bad' },
		{ name: '' },
		{ manifestVersion: 3 },
		{ tokens: [] },
		{ tokens: { '--private': 'red' } },
		{ unsupportedField: [] },
		{ tokens: { '--os-ui-accent': 'red;' } },
	])
		assert.throws(() => parseTheme({ ...emptyTheme(), ...patch }));
});
test('exact 512-token limit and supported future names round-trip', () => {
	const tokens = Object.fromEntries(
		Array.from({ length: 512 }, (_, i) => [`--os-future-${i}`, '1px'])
	);
	assert.equal(
		Object.keys(parseTheme({ ...emptyTheme(), tokens }).tokens).length,
		512
	);
	assert.throws(() =>
		parseTheme({ ...emptyTheme(), tokens: { ...tokens, '--os-extra': '1px' } })
	);
});
test('history restores full themes and branches after undo', () => {
	const h = new History(emptyTheme());
	const blue = { ...emptyTheme(), tokens: { '--os-ui-accent': 'blue' } };
	h.commit(blue);
	blue.tokens['--os-ui-accent'] = 'green';
	assert.equal(h.current.tokens['--os-ui-accent'], 'blue');
	h.undo();
	assert.deepEqual(h.current.tokens, {});
	h.redo();
	assert.equal(h.current.tokens['--os-ui-accent'], 'blue');
	h.undo();
	h.commit({ ...emptyTheme(), name: 'New theme' });
	assert.equal(h.future.length, 0);
});
test('landing Astro source preserves the design with the approved studio CTA', () => {
	const source = readFileSync('mockups/landing_v1.html', 'utf8')
		.replaceAll('../fonts/', 'fonts/')
		.replaceAll('../assets/', 'assets/')
		.replaceAll('../vendor/', 'vendor/')
		.replace(
			'<a class="btn outline" href="https://github.com/WordPress/openstation">Read the source</a>',
			'<a class="btn outline" href="https://github.com/WordPress/openstation">Read the source</a>\n      <a class="btn outline" href="/theme-creator/">Theme Creator</a>'
		);
	assert.equal(
		readFileSync('src/pages/index.astro', 'utf8').replaceAll(' is:inline', ''),
		source
	);
});
test('catalog has unique, sourced tokens and a fully exportable Legacy preset', () => {
	const catalog = JSON.parse(
		readFileSync('src/data/alcazaba-tokens.json', 'utf8')
	);
	assert.ok(catalog.tokens.length > 700);
	assert.equal(
		new Set(catalog.tokens.map((t: any) => t.name)).size,
		catalog.tokens.length
	);
	const legacy: Record<string, string> = {};
	for (const t of catalog.tokens) {
		assert.ok(t.sources.length, t.name);
		assert.ok(t.default, t.name);
		if (t.legacy) {
			assert.equal(valueError(t.legacy), null, t.name);
			legacy[t.name] = t.legacy;
		}
	}
	assert.ok(Object.keys(legacy).length <= 512);
	parseTheme({ ...emptyTheme(), tokens: legacy });
});
test('theme editor has no live imports from the plugin checkout or OpenStation packages', () => {
	for (const file of readdirSync('src/lib').filter((f) => f.endsWith('.ts'))) {
		const source = readFileSync(`src/lib/${file}`, 'utf8');
		assert.doesNotMatch(
			source,
			/from\s+['"][^'"]*(?:@openstation|alcazaba-plugin|\/openstation\/)/
		);
	}
});
