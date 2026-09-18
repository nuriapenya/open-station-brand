import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { zipSync, strToU8 } from 'fflate';
import { emptyTheme, parseTheme } from '../src/lib/theme.ts';
import {
	packageTheme,
	importArchive,
	AssetLibrary,
	validateAssetBytes,
	LIMITS,
} from '../src/lib/theme-assets.ts';
import { referencedAssets } from '../src/lib/manifest-fields.ts';
import {
	surfaceTokens,
	surfaces,
	tokensForSurface,
} from '../src/lib/surfaces.ts';
import contract from '../src/data/theme-contract.json' with { type: 'json' };
const art = strToU8(
	'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#ec9bff"/></svg>',
);
const font = new Uint8Array(readFileSync('fonts/Geist-Variable.woff2'));
const fields = {
	...emptyTheme(),
	textures: Object.fromEntries(
		contract.textures.map((t) => [
			t.id,
			{
				type: t.type,
				path: 'art.svg',
				...(t.type === 'border-image'
					? { slice: '8 8 8 8 fill', width: '10px', repeat: 'round stretch' }
					: { size: '32px', repeat: 'no-repeat', position: 'center' }),
			},
		]),
	),
	icons: Object.fromEntries(
		[...contract.icons, 'APP:my-app'].map((slot) => [
			slot,
			{ type: 'image', path: 'art.svg', color: 'none' },
		]),
	),
	fonts: [
		{
			family: 'My Font',
			src: ['font.woff2'],
			weight: '100 900',
			style: 'normal',
			display: 'swap',
			stretch: '75% 125%',
			unicodeRange: 'U+0000-00FF',
		},
	],
	wallpapers: [
		{
			id: 'desk',
			path: 'art.svg',
			label: 'Desk',
			position: 'center',
			size: 'cover',
			repeat: 'no-repeat',
		},
	],
	iconColor: '#ec9bff',
	preview: 'art.svg',
	recommendedOsSettings: Object.fromEntries(
		Object.entries(contract.settings).map(([k, r]) => [
			k,
			'values' in r ? r.values[0] : 500,
		]),
	),
};
test('full manifest and every asset survive ZIP export/import', () => {
	const theme = parseTheme(fields);
	const assets = {
		'art.svg': art,
		'font.woff2': font,
		'LICENSE.txt': strToU8('License retained'),
	};
	const result = importArchive(packageTheme(theme, assets));
	assert.deepEqual(result.theme, theme);
	assert.deepEqual(result.assets, assets);
	assert.equal(Object.keys(theme.textures!).length, 24);
	assert.equal(Object.keys(theme.icons!).length, 28);
	assert.equal(Object.keys(theme.recommendedOsSettings!).length, 9);
	assert.equal(referencedAssets(theme).length, 2);
});
test('all 712 catalog entries belong to one reachable inspector with a live CSS binding', () => {
	assert.equal(surfaceTokens.length, 712);
	assert.equal(surfaces.flatMap(tokensForSurface).length, 712);
	for (const t of surfaceTokens) {
		assert.ok(t.previewProperty, t.name);
		assert.ok(t.previewValue.includes(t.name), t.name);
		assert.ok(!t.previewProperty.startsWith('--'), t.name);
	}
});
test('v1 and wallpaper shorthand shapes normalize without losing options', () => {
	for (const wallpaper of [
		'art.svg',
		{ path: 'art.svg', label: 'Sky' },
		[{ id: 'sky', path: 'art.svg' }],
		{ sky: 'art.svg' },
	]) {
		const result = parseTheme({
			...emptyTheme(),
			manifestVersion: 1,
			wallpaper,
		});
		assert.equal(result.wallpapers!.length, 1);
		assert.equal(result.wallpapers![0].path, 'art.svg');
	}
	assert.equal(
		parseTheme({
			...emptyTheme(),
			fonts: [{ family: 'Test', src: [{ path: 'font.woff2' }], weight: 400 }],
		}).fonts![0].weight,
		'400',
	);
});
test('missing references, active SVGs, path escapes and archive limits fail before export/import', () => {
	assert.throws(() => packageTheme(parseTheme(fields), {}), /missing/);
	for (const svg of [
		'<svg><script>alert(1)</script></svg>',
		'<svg onload="x"/>',
		'<svg><image href="https://test.test/a.png"/></svg>',
	])
		assert.throws(() => validateAssetBytes('bad.svg', strToU8(svg)));
	assert.throws(
		() => importArchive(zipSync({ '../theme.json': strToU8('{}') })),
		/paths/,
	);
	assert.throws(
		() =>
			importArchive(
				zipSync({
					'theme.json': strToU8(JSON.stringify(emptyTheme())),
					'large.txt': new Uint8Array(LIMITS.file + 1),
				}),
			),
		/limits/,
	);
	assert.throws(
		() =>
			importArchive(zipSync({ 'theme.json': strToU8(JSON.stringify(fields)) })),
		/missing/,
	);
	assert.throws(() => validateAssetBytes('bad.png', art), /PNG/);
});
test('contract limits and malformed nested fields are enforced', () => {
	for (const patch of [
		{ fonts: Array(17).fill({ family: 'A', src: 'font.woff2' }) },
		{ wallpapers: Array(13).fill('art.svg') },
		{ textures: { UNKNOWN: { path: 'art.svg' } } },
		{ textures: { WINDOW_FRAME: { type: 'image', path: 'art.svg' } } },
		{ icons: { 'APP:Bad Slug': { type: 'image', path: 'art.svg' } } },
		{ fonts: [{ family: 'A', src: Array(5).fill('font.woff2') }] },
		{ recommendedOsSettings: { dockSize: 'huge' } },
		{ recommendedOsSettings: { windowRevealDuration: 79 } },
		{ textures: { TITLEBAR: { path: 'art.svg', position: 'center;evil' } } },
		{ fonts: [{ family: 'A', src: 'font.woff2', unknown: 1 }] },
	])
		assert.throws(() => parseTheme({ ...emptyTheme(), ...patch }));
});
test('asset collisions preserve both imports and their earlier undo references', () => {
	const library = new AssetLibrary();
	library.files = { 'art.svg': art };
	const second = strToU8(
		'<svg xmlns="http://www.w3.org/2000/svg"><circle r="2"/></svg>',
	);
	const merged = library.merge(
		parseTheme({ ...emptyTheme(), preview: 'art.svg' }),
		{ 'art.svg': second },
	);
	assert.equal(merged.preview, 'art-import-1.svg');
	assert.deepEqual(library.files['art.svg'], art);
	assert.deepEqual(library.files[merged.preview!], second);
});

test('every token has unique plain-language help, value guidance and source references', () => {
	const help = JSON.parse(
		readFileSync('src/data/token-help.json', 'utf8'),
	).tokens;
	assert.deepEqual(
		Object.keys(help).sort(),
		surfaceTokens.map((t) => t.name).sort(),
	);
	assert.equal(new Set(Object.values(help).map((h: any) => h.title)).size, 712);
	for (const t of surfaceTokens) {
		const h = help[t.name];
		assert.ok(h.title.length > 3 && h.title.length < 90, t.name);
		assert.ok(h.description.length > 45, t.name);
		assert.doesNotMatch(h.description, /undefined|\\b(?:bg|fg|btn)\\b/);
		assert.ok(h.inputHint.length > 15, t.name);
		assert.equal(h.surface, t.surface);
		assert.ok(h.evidence.length, t.name);
		for (const source of h.evidence) {
			assert.ok(t.sources.includes(source.path), t.name);
			assert.ok(Number.isInteger(source.line) && source.line > 0, t.name);
		}
	}
});
