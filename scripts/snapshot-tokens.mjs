import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { defaultCandidates } from './station-defaults.mjs';

// Explicit maintenance command only. The site never reads or imports the plugin.
const root = resolve(process.argv[2] || '../alcazaba-plugin');
const legacy = JSON.parse(
	readFileSync(join(root, 'assets/desktop-themes/legacy/theme.json'), 'utf8'),
).tokens;
const walk = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
	);
const files = [
	...walk(join(root, 'assets/css')),
	...walk(join(root, 'src')),
	...walk(join(root, 'apps')),
].filter((f) => /\.css$|\.styles\.ts$/.test(f));
const palette = join(root, 'assets/css/variables.css');
files.sort((a, b) =>
	a === palette ? -1 : b === palette ? 1 : a.localeCompare(b),
);
const tokens = new Map();
const candidates = new Map();
const allowed = /^(--os-[a-z0-9-]+|--wp-admin-theme-color)$/;
function add(name, value, file, property) {
	if (!allowed.test(name)) return;
	let token = tokens.get(name);
	if (!token) {
		token = {
			name,
			default: '',
			legacy: legacy[name] || '',
			sources: [],
			property: '',
		};
		tokens.set(name, token);
	}
	if (file && !token.sources.includes(file)) token.sources.push(file);
	if (!token.default && value && !/[{};$]/.test(value))
		token.default = value.trim();
	if (property && !token.property) token.property = property;
}
for (const file of files) {
	for (const candidate of defaultCandidates(
		readFileSync(file, 'utf8'),
		relative(root, file),
	)) {
		const prior = candidates.get(candidate.name);
		if (!prior || candidate.priority > prior.priority)
			candidates.set(candidate.name, candidate);
	}
	const source = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
	const path = relative(root, file);
	for (const m of source.matchAll(
		/(?:^|[;{\n])\s*(--[a-z0-9-]+)\s*:\s*([^;{}]+);/g,
	))
		add(m[1], m[2].replace(/\s+/g, ' '), path);
	for (const m of source.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
		let end = m.index + m[0].length,
			depth = 1;
		for (; end < source.length && depth; end++) {
			if (source[end] === '(') depth++;
			if (source[end] === ')') depth--;
		}
		const tail = source.slice(m.index + m[0].length, end - 1).trim();
		const prefix = source.slice(
			Math.max(0, source.lastIndexOf(';', m.index) + 1),
			m.index,
		);
		const property = prefix.match(/(?:^|[\n{])\s*([a-z-]+)\s*:\s*[^:;]*$/)?.[1];
		add(
			m[1],
			tail.startsWith(',') ? tail.slice(1).trim().replace(/\s+/g, ' ') : '',
			path,
			property,
		);
	}
}
for (const [name, value] of Object.entries(legacy))
	add(name, value, 'assets/desktop-themes/legacy/theme.json');
for (const token of tokens.values()) {
	const candidate = candidates.get(token.name);
	if (candidate) {
		token.default = candidate.value
			.replace(/var\(\s*--_holo-ink\s*\)/g, 'var(--os-ui-holo-ink, #0c0b0f)')
			.replace(/var\(\s*--_holo-fill\s*\)/g, 'var(--os-ui-holo-fill)');
		token.defaultSource = {
			file: candidate.file,
			selector: candidate.selector,
			kind: candidate.kind,
		};
	} else {
		token.defaultSource = {
			file: 'assets/desktop-themes/legacy/theme.json',
			selector: 'Legacy only',
			kind: 'legacy',
		};
	}
}
function group(name) {
	if (/^--os-ui-/.test(name)) {
		const rest = name.slice(8);
		const component = [
			'button',
			'input',
			'select',
			'textarea',
			'checkbox',
			'radio',
			'switch',
			'slider',
			'badge',
			'card',
			'table',
			'modal',
			'toast',
			'tooltip',
			'tabs',
			'tab',
			'menu',
			'popover',
			'progress',
			'spinner',
			'skeleton',
			'avatar',
			'rating',
			'accordion',
			'separator',
			'color',
			'tree',
			'command',
			'empty',
			'kbd',
		].find((p) => rest.startsWith(p + '-'));
		return component
			? 'Components / ' + component[0].toUpperCase() + component.slice(1)
			: /font|line-height|letter-spacing/.test(rest)
				? 'Typography'
				: /radius|space|gap|size/.test(rest)
					? 'Spacing & shape'
					: 'Palette';
	}
	if (/font|line-height|letter-spacing/.test(name)) return 'Typography';
	if (/titlebar|window|tabs|resize|snap/.test(name)) return 'Windows';
	if (/dock|tile|icon/.test(name)) return 'Dock & icons';
	if (/taskbar|notch/.test(name)) return 'Taskbar';
	if (/widget/.test(name)) return 'Widgets';
	return 'Desktop & surfaces';
}
function kind(t) {
	const v = t.default;
	if (
		/border$/.test(t.name) &&
		(/\b(solid|dashed|dotted|double)\b/.test(v) || /^(0|none)$/.test(v))
	)
		return 'value';
	if (/shadow/.test(t.name)) return 'shadow';
	if (/font/.test(t.name) && !/size|weight/.test(t.name)) return 'font';
	if (/gradient/.test(v)) return 'gradient';
	if (
		/^#[\da-f]{3,8}$|^(?:rgba?|hsla?|hwb|oklch|color-mix)\(/i.test(v) ||
		(/(?:bg|fg|color|accent|surface|border)$/.test(t.name) &&
			!/width|radius/.test(t.name))
	)
		return 'color';
	if (/^-?[\d.]+(?:px|rem|em|ms|s|%)?$/.test(v)) return 'number';
	return 'value';
}
const result = [...tokens.values()]
	.sort((a, b) => a.name.localeCompare(b.name))
	.map((t) => ({ ...t, group: group(t.name), kind: kind(t) }));
writeFileSync(
	'src/data/alcazaba-tokens.json',
	JSON.stringify(
		{
			source: 'alcazaba-plugin',
			commit: execFileSync('git', ['rev-parse', 'HEAD'], {
				cwd: root,
				encoding: 'utf8',
			}).trim(),
			captured: '2026-09-09',
			tokens: result,
		},
		null,
		2,
	) + '\n',
);
console.log(
	`Captured ${result.length} tokens; ${result.filter((t) => t.default).length} with reference defaults. No plugin code copied.`,
);
