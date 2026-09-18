import { parseFields } from './manifest-fields.ts';
import type { ThemeFields } from './manifest-fields.ts';
export interface Token {
	name: string;
	default: string;
	defaultSource?: { file: string; selector: string; kind: string };
	legacy: string;
	group: string;
	kind: string;
	property: string;
	sources: string[];
}
export interface Theme extends ThemeFields {
	manifestVersion: 2;
	id: string;
	name: string;
	version: string;
	author: string;
	description: string;
	tokens: Record<string, string>;
}
export const emptyTheme = (): Theme => ({
	manifestVersion: 2,
	id: 'my-studio/untitled',
	name: 'Untitled theme',
	version: '1.0.0',
	author: '',
	description: '',
	tokens: {},
});

/** Match the plugin's data-only value grammar before preview or export. */
export function valueError(value: unknown): string | null {
	if (typeof value !== 'string' || !value.trim())
		return 'Enter a value, or reset to the default.';
	if (new TextEncoder().encode(value.trim()).length > 256)
		return 'Use 256 bytes or fewer.';
	if (!/^[A-Za-z0-9\s#%.,()/*+\-_'\"]+$/.test(value))
		return 'Use a CSS value without semicolons, braces, or markup.';
	if (
		/\/\*|\*\/|url\(|image-set\(|element\(|attr\(|var\(|expression|javascript/i.test(
			value,
		)
	)
		return 'Use a direct value. Theme files cannot contain variables, URLs, or code.';
	let depth = 0;
	for (const char of value) {
		if (char === '(') depth++;
		if (char === ')' && --depth < 0)
			return 'Check the opening and closing parentheses.';
	}
	return depth ? 'Check the opening and closing parentheses.' : null;
}

/** Import atomically: never silently drop fields from somebody's theme. */
export function parseTheme(raw: unknown): Theme {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw))
		throw new Error('Choose a theme.json object.');
	const t = raw as Record<string, unknown>;
	if (t.manifestVersion !== 1 && t.manifestVersion !== 2)
		throw new Error('The manifest version must be 1 or 2.');
	if (
		typeof t.id !== 'string' ||
		t.id.length > 64 ||
		!/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)?$/.test(t.id)
	)
		throw new Error('Use an ID like my-studio/my-theme (up to 64 characters).');
	if (typeof t.name !== 'string' || !t.name.trim() || t.name.length > 120)
		throw new Error('Give your theme a name of up to 120 characters.');
	const fields = [
		'manifestVersion',
		'id',
		'name',
		'version',
		'author',
		'description',
		'tokens',
		'textures',
		'icons',
		'iconColor',
		'fonts',
		'wallpaper',
		'wallpapers',
		'preview',
		'recommendedOsSettings',
	];
	for (const key of Object.keys(t))
		if (!fields.includes(key))
			throw new Error(
				`Unsupported manifest field “${key}”. Nothing was discarded.`,
			);
	if (
		t.tokens !== undefined &&
		(!t.tokens || typeof t.tokens !== 'object' || Array.isArray(t.tokens))
	)
		throw new Error('The theme needs a tokens object.');
	const entries = Object.entries(t.tokens ?? {});
	if (entries.length > 512)
		throw new Error(
			'Alcazaba accepts up to 512 overrides per theme. Remove some before importing.',
		);
	const tokens: Record<string, string> = {};
	for (const [key, value] of entries) {
		if (!/^--os-[a-z0-9-]+$/.test(key) && key !== '--wp-admin-theme-color')
			throw new Error(`Unsupported token: ${key}`);
		const error = valueError(value);
		if (error) throw new Error(`${key}: ${error}`);
		tokens[key] = (value as string).trim();
	}
	for (const [key, limit] of [
		['version', 32],
		['author', 120],
		['description', 500],
	] as const) {
		if (
			t[key] !== undefined &&
			(typeof t[key] !== 'string' || t[key].length > limit)
		)
			throw new Error(`${key} must be text, up to ${limit} characters.`);
	}
	const { wallpaper, ...base } = t;
	return {
		...emptyTheme(),
		...base,
		...parseFields(t),
		manifestVersion: 2,
		tokens,
	} as Theme;
}

export function slugify(name: string): string {
	return (
		name
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 48) || 'untitled'
	);
}

/** Bounded, immutable snapshots keep edits undoable, including presets and imports. */
export class History {
	past: Theme[] = [];
	future: Theme[] = [];
	current: Theme;
	constructor(theme: Theme) {
		this.current = structuredClone(theme);
	}
	commit(theme: Theme): void {
		if (JSON.stringify(theme) === JSON.stringify(this.current)) return;
		this.past.push(structuredClone(this.current));
		if (this.past.length > 100) this.past.shift();
		this.current = structuredClone(theme);
		this.future = [];
	}
	undo(): void {
		const t = this.past.pop();
		if (t) {
			this.future.push(this.current);
			this.current = t;
		}
	}
	redo(): void {
		const t = this.future.pop();
		if (t) {
			this.past.push(this.current);
			this.current = t;
		}
	}
}
