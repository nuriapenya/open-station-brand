export interface RGBA {
	r: number;
	g: number;
	b: number;
	a: number;
}
export interface HSV {
	h: number;
	s: number;
	v: number;
}
export const clamp = (v: number, min = 0, max = 1): number =>
	Math.min(max, Math.max(min, v));
/** Parse the lossless forms used by our controls before asking the browser to resolve CSS. */
export function parseRGBA(value: string): RGBA | null {
	const v = value.trim();
	if (v.toLowerCase() === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
	if (/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(v)) {
		let hex = v.slice(1);
		if (hex.length < 5) hex = [...hex].map((c) => c + c).join('');
		return {
			r: parseInt(hex.slice(0, 2), 16),
			g: parseInt(hex.slice(2, 4), 16),
			b: parseInt(hex.slice(4, 6), 16),
			a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
		};
	}
	const match = v.match(/^rgba?\(([^()]+)\)$/i);
	if (!match) return null;
	const parts = match[1].trim().split(/[\s,/]+/);
	if (
		parts.length < 3 ||
		parts.length > 4 ||
		parts.some((p) => !/^[-+]?(?:\d*\.)?\d+%?$/.test(p))
	)
		return null;
	const channel = (p: string) =>
		Math.round(
			clamp(
				p.endsWith('%') ? (parseFloat(p) * 255) / 100 : parseFloat(p),
				0,
				255,
			),
		);
	const a =
		parts[3] === undefined
			? 1
			: clamp(parseFloat(parts[3]) / (parts[3].endsWith('%') ? 100 : 1));
	return {
		r: channel(parts[0]),
		g: channel(parts[1]),
		b: channel(parts[2]),
		a,
	};
}
export function toHex(c: RGBA, alpha = c.a < 1): string {
	return (
		'#' +
		[c.r, c.g, c.b, ...(alpha ? [c.a * 255] : [])]
			.map((v) =>
				Math.round(clamp(v, 0, 255))
					.toString(16)
					.padStart(2, '0'),
			)
			.join('')
	);
}
export function toCSS(c: RGBA): string {
	return c.a >= 1
		? toHex(c, false)
		: `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${Number(c.a.toFixed(6))})`;
}
export function rgbToHSV(c: RGBA): HSV {
	const r = c.r / 255,
		g = c.g / 255,
		b = c.b / 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b),
		d = max - min;
	let h = 0;
	if (d)
		h =
			(max === r
				? (g - b) / d + (g < b ? 6 : 0)
				: max === g
					? (b - r) / d + 2
					: (r - g) / d + 4) * 60;
	return { h, s: max === 0 ? 0 : d / max, v: max };
}
export function hsvToRGB({ h, s, v }: HSV, a = 1): RGBA {
	const hue = (((h % 360) + 360) % 360) / 60;
	const c = v * s,
		x = c * (1 - Math.abs((hue % 2) - 1)),
		m = v - c;
	const [r, g, b] =
		hue < 1
			? [c, x, 0]
			: hue < 2
				? [x, c, 0]
				: hue < 3
					? [0, c, x]
					: hue < 4
						? [0, x, c]
						: hue < 5
							? [x, 0, c]
							: [c, 0, x];
	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255),
		a,
	};
}
/** Extract complete colors, including nested functions, without dropping alpha channels. */
export function colorValues(value: string): string[] {
	const result: string[] = [];
	const pattern =
		/#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\b|\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch|color-mix|color|var)\s*\(|\btransparent\b|\b[a-z]+\b(?=\s*(?:[-\d.]+%?\s*)?[,\)])/gi;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(value))) {
		let end = pattern.lastIndex;
		if (match[0].endsWith('(')) {
			let depth = 1;
			for (; end < value.length && depth; end++) {
				if (value[end] === '(') depth++;
				if (value[end] === ')') depth--;
			}
			if (depth) continue;
			pattern.lastIndex = end;
		}
		result.push(value.slice(match.index, end));
	}
	return result;
}
