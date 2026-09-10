import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = resolve(process.argv[2] || '../alcazaba-plugin');
const source = readFileSync(
	join(root, 'includes/desktop-themes/store.php'),
	'utf8',
);
const textureBlock = source
	.split('function openstation_desktop_theme_texture_slots()')[1]
	.split('return (array) apply_filters')[0];
const textures = [
	...textureBlock.matchAll(
		/'([A-Z][A-Z_]+)'\s*=>\s*array\(([\s\S]*?)\n\s*\),/g,
	),
].map(([, id, body]) => ({
	id,
	type: body.match(/'type'\s*=>\s*'([^']+)'/)[1],
	property: body.match(/'prop'\s*=>\s*'([^']+)'/)[1],
	sharedSize: body.includes('sizeGroup'),
	base:
		id === 'TITLEBAR_FOCUSED'
			? 'TITLEBAR'
			: id === 'WINDOW_FRAME_FOCUSED'
				? 'WINDOW_FRAME'
				: null,
}));
const iconBlock = source
	.split('function openstation_desktop_theme_icon_slots()')[1]
	.split(');')[0];
const icons = [...iconBlock.matchAll(/'([A-Z][A-Z_]+)'/g)].map((m) => m[1]);
const settings = {
	dockSize: { label: 'Dock size', values: ['compact', 'default', 'large'] },
	desktopLayout: { label: 'Desktop layout', values: ['classic', 'unified'] },
	dockPlacement: {
		label: 'Dock position',
		values: ['bottom', 'left', 'right'],
	},
	windowRadius: {
		label: 'Window corners',
		values: ['sharp', 'default', 'round'],
	},
	adminBarMode: { label: 'Admin bar', values: ['static', 'dynamic', 'hidden'] },
	dockRailRenderer: {
		label: 'Dock renderer',
		values: ['default'],
		custom: true,
	},
	windowReveal: {
		label: 'Window reveal',
		values: [
			'none',
			'sweep',
			'rise',
			'diagonal',
			'iris',
			'diamond',
			'curtain',
			'shutter',
			'blinds',
			'slats',
			'mosaic',
			'radar',
			'obturator',
		],
		custom: true,
	},
	windowRevealDuration: { label: 'Reveal duration', min: 80, max: 4000 },
	accent: {
		label: 'Accent swatch',
		values: [
			'pulse',
			'nebula',
			'sirius',
			'lagoon',
			'wp-blue',
			'indigo',
			'teal',
			'emerald',
			'amber',
			'rose',
		],
		custom: true,
	},
};
const schema = source
	.split(
		'function openstation_desktop_theme_recommended_os_settings_schema()',
	)[1]
	.split('$schema = (array) apply_filters')[0];
for (const name of Object.keys(settings))
	if (!schema.includes(`'${name}'`)) throw new Error(`Missing setting ${name}`);
writeFileSync(
	'src/data/theme-contract.json',
	JSON.stringify(
		{
			source: 'alcazaba-plugin/includes/desktop-themes',
			commit: execFileSync('git', ['rev-parse', 'HEAD'], {
				cwd: root,
				encoding: 'utf8',
			}).trim(),
			textures,
			icons,
			settings,
			limits: {
				tokens: 512,
				icons: 256,
				fonts: 16,
				fontSources: 4,
				wallpapers: 12,
				files: 256,
				fileBytes: 8388608,
				totalBytes: 33554432,
			},
		},
		null,
		2,
	) + '\n',
);
console.log(
	`Captured ${textures.length} texture slots, ${icons.length} icon slots and ${Object.keys(settings).length} recommendations.`,
);
