import contract from '../data/theme-contract.json' with { type: 'json' };
export interface ImagePlacement {
	path: string;
	size?: string;
	repeat?: string;
	position?: string;
}
export interface Texture extends ImagePlacement {
	type: 'image' | 'border-image';
	slice?: string;
	width?: string;
}
export interface Icon {
	type: 'image' | 'dashicon';
	path?: string;
	name?: string;
	color?: string;
}
export interface FontFaceDescriptor {
	family: string;
	src: string[];
	weight?: string;
	style?: string;
	display?: string;
	stretch?: string;
	unicodeRange?: string;
}
export interface Wallpaper extends ImagePlacement {
	id: string;
	label?: string;
	description?: string;
}
export interface ThemeFields {
	textures?: Record<string, Texture>;
	icons?: Record<string, Icon>;
	iconColor?: string;
	fonts?: FontFaceDescriptor[];
	wallpapers?: Wallpaper[];
	recommendedOsSettings?: Record<string, string | number>;
	preview?: string;
}
export const imageExtensions = [
	'png',
	'jpg',
	'jpeg',
	'gif',
	'webp',
	'avif',
	'svg',
];
export const fontExtensions = ['woff2', 'woff', 'ttf', 'otf'];
export function assetPath(
	raw: unknown,
	kind: 'image' | 'font' | 'any' = 'any',
): string {
	if (
		typeof raw !== 'string' ||
		!raw ||
		raw.length > 240 ||
		raw.includes('\\') ||
		raw.includes('\0') ||
		raw.startsWith('/') ||
		raw.split('/').some((p) => !p || p === '.' || p === '..') ||
		/[:?#%<>"\x00-\x1f]/.test(raw)
	)
		throw new Error('Use a relative asset path inside the theme folder.');
	const ext = raw.split('.').at(-1)!.toLowerCase();
	const allowed =
		kind === 'image'
			? imageExtensions
			: kind === 'font'
				? fontExtensions
				: [...imageExtensions, ...fontExtensions, 'txt', 'md', 'json'];
	if (!allowed.includes(ext))
		throw new Error(`Unsupported ${kind} file: ${raw}`);
	return raw;
}
const record = (v: unknown): Record<string, unknown> => {
	if (!v || typeof v !== 'object' || Array.isArray(v))
		throw new Error('Expected an object.');
	return v as Record<string, unknown>;
};
function keys(
	v: Record<string, unknown>,
	allowed: string[],
	label: string,
): void {
	for (const k of Object.keys(v))
		if (!allowed.includes(k))
			throw new Error(
				`${label}: unsupported field “${k}”. Nothing was discarded.`,
			);
}
function string(v: unknown, label: string, max = 256): string {
	if (typeof v !== 'string' || v.length > max)
		throw new Error(`${label} must be text (up to ${max} characters).`);
	return v.trim();
}
export function sizeValue(v: string): boolean {
	return (
		v.length <= 64 &&
		(/^(auto|cover|contain)$/.test(v) ||
			(v.split(/\s+/).length <= 2 &&
				v
					.split(/\s+/)
					.every((p) => /^(auto|\d+(\.\d+)?(px|%|rem|em))$/.test(p))))
	);
}
export function positionValue(v: string): boolean {
	return (
		!!v &&
		v.length <= 64 &&
		v.split(/\s+/).length <= 2 &&
		v
			.split(/\s+/)
			.every((p) =>
				/^(left|right|top|bottom|center|-?(0|\d+(\.\d+)?(px|%|rem|em)))$/.test(
					p,
				),
			)
	);
}
export function colorValue(v: string, none = false): boolean {
	return (
		(none && v === 'none') ||
		(v.length <= 64 &&
			/^(currentColor|#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|[a-z]{3,24}|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\([0-9a-z%.,/ +\-]+\))$/i.test(
				v,
			))
	);
}
function placement(v: Record<string, unknown>): ImagePlacement {
	const out: ImagePlacement = { path: assetPath(v.path, 'image') };
	if (v.size !== undefined) {
		const x = string(v.size, 'Image size');
		if (!sizeValue(x))
			throw new Error(
				'Image size: use cover, contain, auto, or one/two lengths.',
			);
		out.size = x;
	}
	if (v.position !== undefined) {
		const x = string(v.position, 'Image position');
		if (!positionValue(x))
			throw new Error(
				'Image position: use one/two positions, such as left top or 50% 50%.',
			);
		out.position = x;
	}
	if (v.repeat !== undefined) {
		const x = string(v.repeat, 'Image repeat');
		if (
			![
				'repeat',
				'repeat-x',
				'repeat-y',
				'no-repeat',
				'space',
				'round',
			].includes(x)
		)
			throw new Error('Choose a supported image repeat mode.');
		out.repeat = x;
	}
	return out;
}
/** Validate the complete built-in data contract without silently stripping fields. */
export function parseFields(t: Record<string, unknown>): ThemeFields {
	const out: ThemeFields = {};
	if (t.preview !== undefined && t.preview !== '')
		out.preview = assetPath(t.preview, 'image');
	if (t.iconColor !== undefined && t.iconColor !== '') {
		const c = string(t.iconColor, 'Icon color', 64);
		if (!colorValue(c)) throw new Error('Invalid global icon color.');
		out.iconColor = c;
	}
	if (t.textures !== undefined) {
		out.textures = {};
		for (const [slot, raw] of Object.entries(record(t.textures))) {
			const definition = contract.textures.find((x) => x.id === slot);
			if (!definition)
				throw new Error(
					`Unknown texture slot ${slot}; it is not in the built-in contract.`,
				);
			const v = record(raw);
			const type = v.type ?? definition.type;
			if (type !== definition.type)
				throw new Error(`${slot} needs ${definition.type}.`);
			keys(
				v,
				type === 'image'
					? ['type', 'path', 'repeat', 'size', 'position']
					: ['type', 'path', 'slice', 'width', 'repeat'],
				slot,
			);
			if (type === 'image') out.textures[slot] = { type, ...placement(v) };
			else {
				const tx: Texture = {
					type: 'border-image',
					path: assetPath(v.path, 'image'),
				};
				if (v.slice !== undefined) {
					const x = string(v.slice, 'Frame slice');
					if (!/^\d+( \d+){0,3}( fill)?$/.test(x))
						throw new Error(
							'Frame slices need 1–4 whole numbers and optional fill.',
						);
					tx.slice = x;
				}
				if (v.width !== undefined) {
					const x = string(v.width, 'Frame width');
					if (
						!x ||
						x.split(/\s+/).length > 4 ||
						!x.split(/\s+/).every((p) => /^\d+(\.\d+)?(px|%|rem|em)?$/.test(p))
					)
						throw new Error('Frame widths need 1–4 non-negative lengths.');
					tx.width = x;
				}
				if (v.repeat !== undefined) {
					const x = string(v.repeat, 'Frame repeat');
					if (
						!/^(stretch|repeat|round|space)( (stretch|repeat|round|space))?$/.test(
							x,
						)
					)
						throw new Error('Invalid frame repeat.');
					tx.repeat = x;
				}
				out.textures[slot] = tx;
			}
		}
	}
	if (t.icons !== undefined) {
		out.icons = {};
		const icons = Object.entries(record(t.icons));
		if (icons.length > 256)
			throw new Error('A theme can have at most 256 icons.');
		for (const [slot, raw] of icons) {
			if (!contract.icons.includes(slot) && !/^APP:[a-z0-9_-]+$/.test(slot))
				throw new Error(`Unsupported icon slot ${slot}.`);
			const v = record(raw);
			keys(
				v,
				v.type === 'image'
					? ['type', 'path', 'color']
					: ['type', 'name', 'color'],
				slot,
			);
			let icon: Icon;
			if (v.type === 'image')
				icon = { type: 'image', path: assetPath(v.path, 'image') };
			else if (
				v.type === 'dashicon' &&
				typeof v.name === 'string' &&
				/^dashicons-[a-z0-9-]+$/.test(v.name)
			)
				icon = { type: 'dashicon', name: v.name };
			else throw new Error(`${slot}: choose an image or a dashicons name.`);
			if (v.color !== undefined) {
				const c = string(v.color, 'Icon color', 64);
				if (!colorValue(c, true))
					throw new Error(`${slot}: invalid icon color.`);
				icon.color = c;
			}
			out.icons[slot] = icon;
		}
	}
	if (t.fonts !== undefined) {
		if (!Array.isArray(t.fonts) || t.fonts.length > 16)
			throw new Error('A theme can bundle up to 16 font faces.');
		out.fonts = t.fonts.map((raw) => {
			const v = record(raw);
			keys(
				v,
				[
					'family',
					'src',
					'weight',
					'style',
					'display',
					'stretch',
					'unicodeRange',
				],
				'Font',
			);
			const family = string(v.family, 'Font family', 64);
			if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{0,63}$/.test(family))
				throw new Error(
					'Font family: use letters, numbers, spaces, underscores or hyphens.',
				);
			const source = typeof v.src === 'string' ? [v.src] : v.src;
			if (!Array.isArray(source) || !source.length || source.length > 4)
				throw new Error('Each font needs 1–4 source files.');
			const face: FontFaceDescriptor = {
				family,
				src: source.map((x) =>
					assetPath(typeof x === 'object' && x ? record(x).path : x, 'font'),
				),
			};
			for (const field of [
				'weight',
				'style',
				'display',
				'stretch',
				'unicodeRange',
			] as const)
				if (v[field] !== undefined) {
					const x =
						typeof v[field] === 'number' && field === 'weight'
							? String(v[field])
							: string(
									v[field],
									`Font ${field}`,
									field === 'unicodeRange' ? 512 : 256,
								);
					let valid = true;
					if (field === 'weight')
						valid =
							x.split(' ').length <= 2 &&
							x
								.split(' ')
								.every(
									(p) =>
										['normal', 'bold'].includes(p) ||
										(/^\d{1,4}$/.test(p) && +p >= 1 && +p <= 1000),
								);
					if (field === 'style')
						valid = ['normal', 'italic', 'oblique'].includes(x);
					if (field === 'display')
						valid = ['auto', 'block', 'swap', 'fallback', 'optional'].includes(
							x,
						);
					if (field === 'stretch')
						valid =
							x.split(' ').length <= 2 &&
							x
								.split(' ')
								.every((p) =>
									/^(ultra-condensed|extra-condensed|condensed|semi-condensed|normal|semi-expanded|expanded|extra-expanded|ultra-expanded|\d{1,3}(\.\d+)?%)$/.test(
										p,
									),
								);
					if (field === 'unicodeRange')
						valid =
							/^U\+[0-9A-F?]{1,6}(-[0-9A-F]{1,6})?( ?, ?U\+[0-9A-F?]{1,6}(-[0-9A-F]{1,6})?){0,31}$/i.test(
								x,
							);
					if (!valid) throw new Error(`Invalid font ${field}.`);
					face[field] = x;
				}
			return face;
		});
	}
	const wallpapers = t.wallpapers ?? t.wallpaper;
	if (wallpapers !== undefined) {
		const raw =
			typeof wallpapers === 'string'
				? [wallpapers]
				: Array.isArray(wallpapers)
					? wallpapers
					: record(wallpapers).path
						? [wallpapers]
						: Object.entries(record(wallpapers)).map(([id, w]) =>
								typeof w === 'string' ? { id, path: w } : { id, ...record(w) },
							);
		if (raw.length > 12)
			throw new Error('A theme can bundle up to 12 wallpapers.');
		const seen = new Set<string>();
		out.wallpapers = raw.map((entry: unknown) => {
			const v = typeof entry === 'string' ? { path: entry } : record(entry);
			keys(
				v,
				['id', 'path', 'label', 'description', 'size', 'repeat', 'position'],
				'Wallpaper',
			);
			const image = placement(v);
			const id = string(
				v.id ??
					v.label ??
					image.path
						.split('/')
						.at(-1)!
						.replace(/\.[^.]+$/, ''),
				'Wallpaper ID',
				120,
			)
				.toLowerCase()
				.replace(/[^a-z0-9_-]+/g, '-')
				.replace(/^-|-$/g, '');
			if (!id || seen.has(id))
				throw new Error('Wallpaper IDs must be unique and non-empty.');
			seen.add(id);
			const w: Wallpaper = { ...image, id };
			if (v.label !== undefined)
				w.label = string(v.label, 'Wallpaper label', 80);
			if (v.description !== undefined)
				w.description = string(v.description, 'Wallpaper description', 500);
			return w;
		});
	}
	if (t.recommendedOsSettings !== undefined) {
		out.recommendedOsSettings = {};
		for (const [key, raw] of Object.entries(record(t.recommendedOsSettings))) {
			const rule = contract.settings[key as keyof typeof contract.settings];
			if (!rule) throw new Error(`Unsupported recommendation ${key}.`);
			if ('min' in rule) {
				if (
					typeof raw !== 'number' ||
					!Number.isInteger(raw) ||
					raw < rule.min ||
					raw > rule.max
				)
					throw new Error(
						`${key}: choose ${rule.min}–${rule.max} milliseconds.`,
					);
				out.recommendedOsSettings[key] = raw;
			} else {
				const x = string(raw, key, 120);
				if (
					'custom' in rule ? !/^[a-z0-9_-]+$/.test(x) : !rule.values.includes(x)
				)
					throw new Error(`Invalid recommendation ${key}.`);
				out.recommendedOsSettings[key] = x;
			}
		}
	}
	return out;
}
export function referencedAssets(t: ThemeFields): string[] {
	return [
		...new Set(
			[
				t.preview,
				...Object.values(t.textures ?? {}).map((x) => x.path),
				...Object.values(t.icons ?? {})
					.filter((x) => x.type === 'image')
					.map((x) => x.path),
				...(t.fonts ?? []).flatMap((x) => x.src),
				...(t.wallpapers ?? []).map((x) => x.path),
			].filter((p): p is string => !!p),
		),
	];
}
