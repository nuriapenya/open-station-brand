import catalog from '../data/alcazaba-tokens.json' with { type: 'json' };
import type { Token } from './theme.ts';
export interface SurfaceToken extends Token {
	surface: string;
	previewProperty: string;
	previewKind:
		| 'surface'
		| 'type'
		| 'layout'
		| 'motion'
		| 'image'
		| 'stack'
		| 'svg';
	state: string;
	previewValue: string;
}
const byName = new Map(catalog.tokens.map((t) => [t.name, t]));
const label = (v: string) =>
	v
		.split('-')
		.map((x) => x[0]?.toUpperCase() + x.slice(1))
		.join(' ');
function surface(t: Token): string {
	const n = t.name;
	if (n === '--wp-admin-theme-color') return 'Palette & accents';
	if (n.startsWith('--os-ui-')) {
		const rest = n.slice(8);
		const componentNames: Record<string, string> = {
			'confirm-dialog': 'Confirmation dialogs',
			'tag-input': 'Tag inputs',
			'save-status': 'Save Status',
			'token-field': 'Token Field',
			'context-menu': 'Context Menu',
			cat: 'Category tree',
			cg: 'Category groups',
			chip: 'Chips',
			cluster: 'Inline groups',
			code: 'Code blocks',
			crumb: 'Breadcrumbs',
			display: 'Display',
			flyout: 'Flyouts',
			grid: 'Grids',
			key: 'Keycaps',
			log: 'Logs',
			panel: 'Panels',
			range: 'Range controls',
			ribbon: 'Ribbons',
			row: 'Rows',
			segmented: 'Segmented controls',
			stack: 'Stacks',
			steps: 'Steps',
			step: 'Steps',
			swatch: 'Swatches',
		};
		for (const [prefix, name] of Object.entries(componentNames))
			if (rest.startsWith(prefix + '-')) return name;

		for (const prefix of [
			'context-menu',
			'token-field',
			'color-picker',
			'save-status',
			'progress',
			'rating',
			'spinner',
			'repeater',
			'stat',
			'field',
			'button',
			'btn',
			'card',
			'table',
			'modal',
			'dialog',
			'scrim',
			'toast',
			'tooltip',
			'menu',
			'popover',
			'tab',
			'avatar',
			'badge',
			'notice',
			'input',
			'switch',
			'separator',
			'slider',
			'checkbox',
			'radio',
			'select',
			'skeleton',
			'empty',
			'terminal',
			'term',
			'tree',
			'command',
			'holo',
		])
			if (rest.startsWith(prefix + '-'))
				return label(
					prefix === 'btn'
						? 'window-controls'
						: prefix === 'holo'
							? 'holographic-surfaces'
							: prefix,
				);
		if (/^(font|text-|line-|letter-)/.test(rest)) return 'Typography';
		if (/^(motion|duration|ease|transition)/.test(rest))
			return 'Motion & timing';
		if (/^(space|gap|radius|size)/.test(rest)) return 'Spacing & shape';
		return 'Palette & accents';
	}
	for (const [prefix, name] of [
		['--os-titlebar-activity', 'Window activity'],
		['--os-titlebar-controls', 'Window Controls'],
		['--os-titlebar-btn', 'Window Controls'],
		['--os-titlebar-meta', 'Window Controls'],
		['--os-titlebar', 'Title bar'],
		['--os-window-corner', 'Window corners'],
		['--os-window-reveal', 'Window reveal'],
		['--os-window-link', 'Window links'],
		['--os-window', 'Window frame'],
		['--os-dock', 'Dock'],
		['--os-icon', 'Icon badges'],
		['--os-tile', 'Desktop icons'],
		['--os-tabs', 'Window tabs'],
		['--os-tooltip', 'Tooltip'],
		['--os-mobile', 'Mobile'],
		['--os-widget', 'Widgets'],
		['--os-cn', 'Constellation'],
		['--os-my-wordpress', 'File explorer'],
		['--os-mesh', 'Holographic Surfaces'],
		['--os-z-', 'Layering'],
		['--os-font', 'Typography'],
		['--os-recycle', 'Recycle bin'],
	])
		if (n.startsWith(prefix)) return name;
	return 'Desktop';
}
function property(t: Token, seen = new Set<string>()): string {
	if (seen.has(t.name)) return infer(t);
	seen.add(t.name);
	if (t.property.startsWith('--')) {
		const alias = byName.get(t.property);
		return alias ? property(alias, seen) : infer(t);
	}
	if (t.property && !['animation', 'transition'].includes(t.property))
		return t.property;
	return infer(t);
}
function infer(t: Token): string {
	const n = t.name,
		v = t.default;
	if (/(?:^--os-z-|z-index)/.test(n)) return 'z-index';
	if (/font-size|label-size|value-size/.test(n)) return 'font-size';
	if (/font-weight/.test(n)) return 'font-weight';
	if (/font|typeface/.test(n)) return 'font-family';
	if (/line-height/.test(n)) return 'line-height';
	if (/letter-spacing/.test(n)) return 'letter-spacing';
	if (/image-repeat/.test(n)) return 'background-repeat';
	if (/image-position/.test(n)) return 'background-position';
	if (/image-size/.test(n)) return 'background-size';
	if (/border-image-slice/.test(n)) return 'border-image-slice';
	if (/border-image-width/.test(n)) return 'border-image-width';
	if (/border-image-repeat/.test(n)) return 'border-image-repeat';
	if (/image$|image-source/.test(n)) return 'background-image';
	if (/shadow|glow|bloom/.test(n) && !v.includes('gradient'))
		return /label|text/.test(n) ? 'text-shadow' : 'box-shadow';
	if (/radius/.test(n)) return 'border-radius';
	if (/inset|offset/.test(n)) return 'inset-inline-start';
	if (/padding/.test(n)) return 'padding';
	if (/gap|space/.test(n)) return 'gap';
	if (/duration|motion|transition|speed|delay/.test(n) || /^\d+(ms|s)$/.test(v))
		return /delay/.test(n) ? 'animation-delay' : 'animation-duration';
	if (/easing|ease/.test(n)) return 'animation-timing-function';
	if (/height/.test(n)) return 'height';
	if (/size|width|length|thickness|rail-width/.test(n)) return 'width';
	if (/border|edge|divider|separator/.test(n) && !v.includes('gradient'))
		return /^\d.*(?:solid|dashed|dotted)/.test(v) ? 'border' : 'border-color';
	if (/fg|color|ink|text|star/.test(n)) return 'color';
	if (/opacity/.test(n)) return 'opacity';
	return 'background';
}
/** Some tokens are arguments inside a CSS function, not entire declarations. */
function demoValue(t: Token, p: string): string {
	const n = t.name;
	const fallback =
		p === 'font-family'
			? 'system-ui'
			: p === 'background'
				? 'transparent'
				: p === 'color'
					? 'currentColor'
					: 'initial';
	const v = `var(${n},${fallback})`;
	if (
		/^(?:border(?:-(?:top|bottom|left|right|inline-start|inline-end|block-start|block-end))?|outline)$/.test(
			p,
		) &&
		!/^(?:0|none)$|\b(?:solid|dashed|dotted|double)\b/.test(t.default)
	)
		return `1px solid ${v}`;
	if (n === '--os-dock-floating-highlight') return `inset 0 1px 0 ${v}`;
	if (/--os-cn-(row-)?hue$/.test(n)) return `hsl(${v} 80% 70%)`;
	if (/--os-cn-(beam-x|shift)$/.test(n)) return `translateX(${v})`;
	if (n === '--os-cn-row') return `calc(${v} * 40ms)`;
	if (n === '--os-cn-x' || n === '--os-ui-avatar-glare-x')
		return `radial-gradient(circle at ${v} 50%,#ec9bff,transparent 70%)`;
	if (n === '--os-cn-y' || n === '--os-ui-avatar-glare-y')
		return `radial-gradient(circle at 50% ${v},#ec9bff,transparent 70%)`;
	if (n === '--os-ui-term-bar')
		return `linear-gradient(to right,#ec9bff ${v},#392a45 ${v})`;
	if (n === '--os-mobile-back-progress') return `translateX(calc(${v} * 14px))`;
	if (n === '--os-mobile-card-dir') return `translateX(calc(${v} * 30px))`;
	if (n === '--os-ui-avatar-hover') return `scale(calc(1 + ${v} * .07))`;
	if (n === '--os-ui-avatar-tilt-x') return `perspective(400px) rotateX(${v})`;
	if (n === '--os-ui-avatar-tilt-y') return `perspective(400px) rotateY(${v})`;
	if (n.startsWith('--os-fx-') && p === 'filter')
		return `${n.includes('grayscale-amount') ? 'grayscale' : n.split('-').at(-1) === 'saturate' ? 'saturate' : n.endsWith('blur') ? 'blur' : 'brightness'}(${v})`;
	if (n === '--os-grid-snap-cols') return `calc(100% / ${v}) 20px`;
	if (n === '--os-grid-snap-rows') return `20px calc(100% / ${v})`;
	if (n === '--os-grid-snap-line')
		return `linear-gradient(to right,${v} 2px,transparent 2px)`;
	if (n === '--os-ui-swatch-grid-cols') return `repeat(${v},1fr)`;
	if (n === '--os-ui-cat-node-glow') return `drop-shadow(0 2px 5px ${v})`;
	if (
		p === 'box-shadow' &&
		(t.kind === 'color' ||
			[
				'--os-dock-exit-ring',
				'--os-dock-exit-ring-hover',
				'--os-dock-floating-shadow',
				'--os-tile-focus-ring',
			].includes(n))
	)
		return n.includes('floating-shadow') ? `0 8px 18px ${v}` : `0 0 0 2px ${v}`;
	return v;
}
export const surfaceTokens: SurfaceToken[] = catalog.tokens.map((t) => {
	let p = property(t);
	if (t.name === '--os-font') p = 'font-family';
	if (t.name === '--os-ui-table-max-height') p = 'max-height';
	if (t.name === '--os-admin-bar-height') p = 'height';
	if (
		[
			'--os-ui-step-chip-size',
			'--os-ui-step-connector-width',
			'--os-settings-nav-width',
		].includes(t.name)
	)
		p = 'width';
	if (t.name === '--os-grid-gap-x') p = 'column-gap';
	if (t.name === '--os-grid-gap-y') p = 'row-gap';
	if (['--os-mesh-star', '--os-ui-badge-accent-bg'].includes(t.name))
		p = 'background';
	if (t.name === '--os-ui-focus-ring') p = 'box-shadow';
	if (t.name === '--os-tabs-slide') p = 'transition';
	if (t.name === '--os-cn-row') p = 'animation-delay';
	const v = demoValue(t, p);

	return {
		...t,
		surface: surface(t),
		previewProperty: p,
		previewValue: v,
		previewKind: /^(fill|stroke|stroke-width)$/.test(p)
			? 'svg'
			: /z-index/.test(p)
				? 'stack'
				: /animation|transition/.test(p)
					? 'motion'
					: /font|line-height|letter-spacing|text-transform|white-space/.test(p)
						? 'type'
						: /background-(image|position|repeat|size)|border-image/.test(p)
							? 'image'
							: /width|height|size|padding|gap|inset|top|left|right|bottom|grid|align|justify|transform/.test(
										p,
								  )
								? 'layout'
								: 'surface',
		state: /unfocused/.test(t.name)
			? 'Unfocused'
			: /focused|focus|outline/.test(t.name)
				? 'Focus'
				: /hover/.test(t.name)
					? 'Hover'
					: /active|pressed|selected/.test(t.name)
						? 'Active'
						: /disabled/.test(t.name)
							? 'Disabled'
							: /danger|failed/.test(t.name)
								? 'Danger'
								: /success|saved/.test(t.name)
									? 'Success'
									: /warning/.test(t.name)
										? 'Warning'
										: 'Default',
	};
});
export const surfaces = [
	...new Set(surfaceTokens.map((t) => t.surface)),
].sort();
export function tokensForSurface(name: string): SurfaceToken[] {
	return surfaceTokens.filter((t) => t.surface === name);
}
export function surfaceForToken(name: string): string {
	return surfaceTokens.find((t) => t.name === name)?.surface ?? 'Custom tokens';
}
export function tokenBinding(name: string): SurfaceToken | undefined {
	return surfaceTokens.find((t) => t.name === name);
}
