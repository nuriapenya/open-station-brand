import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { surfaceTokens } from '../src/lib/surfaces.ts';
const root = resolve(process.argv[2] || '../alcazaba-plugin');
const usage = new Map();
const files = [
	...new Set(
		surfaceTokens.flatMap((t) => t.sources).filter((f) => !f.endsWith('.json')),
	),
];
for (const file of files) {
	let source;
	try {
		source = readFileSync(join(root, file), 'utf8');
	} catch {
		continue;
	}
	const masked = source.replace(/\/\*[\s\S]*?\*\//g, (s) =>
		s.replace(/[^\n]/g, ' '),
	);
	for (const match of masked.matchAll(
		/(?:^|[;{}\n])\s*([a-z-]+)\s*:\s*([^;{}]+)[;\n}]/g,
	)) {
		if (match[1].startsWith('--')) continue;
		for (const token of match[2].matchAll(
			/var\(\s*(--(?:os-[a-z0-9-]+|wp-admin-theme-color))/g,
		)) {
			const line = source
				.slice(0, match.index + match[0].indexOf(token[1]))
				.split('\n').length;
			const entries = usage.get(token[1]) ?? [];
			if (!entries.some((e) => e.path === file && e.line === line))
				entries.push({ path: file, line, property: match[1] });
			usage.set(token[1], entries);
		}
	}
}
const subjects = {
	Avatar: 'the avatar',
	Badge: 'the status badge',
	Button: 'the action button',
	Card: 'the content card',
	Constellation: 'the dock’s expanded app panel',
	'Context Menu': 'the right-click menu',
	Desktop: 'the desktop',
	'Desktop icons': 'the desktop shortcut',
	Dialog: 'the dialog',
	Dock: 'the dock',
	Empty: 'the empty-state message',
	Field: 'the labeled form field',
	'File explorer': 'the My WordPress file browser',
	'Holographic Surfaces': 'the holographic surface',
	'Icon badges': 'the icon badge',
	Input: 'the text input',
	Layering: 'the desktop layers',
	Menu: 'the menu',
	Mobile: 'the mobile workspace',
	Modal: 'the modal',
	Notice: 'the notice',
	'Palette & accents': 'the shared interface palette',
	Progress: 'the progress indicator',
	Rating: 'the rating control',
	'Recycle bin': 'the recycle-bin badge',
	Repeater: 'the repeated form rows',
	'Save Status': 'the save-status indicator',
	Scrim: 'the overlay behind a dialog',
	'Spacing & shape': 'shared interface shapes',
	Spinner: 'the loading spinner',
	Stat: 'the statistic card',
	Switch: 'the toggle switch',
	Tab: 'the tab',
	Table: 'the data table',
	Term: 'the terminal indicator',
	'Title bar': 'the window’s title bar',
	Toast: 'the notification toast',
	'Token Field': 'the token-entry field',
	Tooltip: 'the tooltip',
	Typography: 'interface text',
	Widgets: 'the desktop widget',
	'Window Controls': 'the title-bar controls',
	'Window activity': 'the title-bar activity indicator',
	'Window corners': 'the window corner artwork',
	'Window frame': 'the window frame',
	'Window links': 'the connection between windows',
	'Window reveal': 'the window reveal overlay',
	'Window tabs': 'the tabs inside a window',
	'Category tree': 'the category tree',
	'Category groups': 'the grouped category chips',
	Chips: 'the compact label chip',
	'Inline groups': 'the inline group',
	'Code blocks': 'the code block',
	'Confirmation dialogs': 'the confirmation dialog',
	Breadcrumbs: 'the breadcrumb trail',
	Display: 'the display element',
	Flyouts: 'the flyout',
	Grids: 'the grid',
	Keycaps: 'the keyboard-key label',
	Logs: 'the log viewer',
	Panels: 'the panel',
	'Range controls': 'the range control',
	Ribbons: 'the corner ribbon',
	Rows: 'the row layout',
	'Segmented controls': 'the segmented selector',
	Stacks: 'the vertical stack',
	Steps: 'the step indicator',
	Swatches: 'the color-swatch grid',
	'Tag inputs': 'the tag input',
};
const replacements = {
	bg: 'background',
	fg: 'text',
	h: 'height',
	w: 'width',
	x: 'horizontal',
	y: 'vertical',
	btn: 'window button',
	cn: 'app panel',
	cat: 'category tree',
	cg: 'category group',
	cols: 'columns',
	uncat: 'uncategorized',
	pop: 'popover',
	ink: 'text color',
	fill: 'fill',
};
const special = {
	'--os-ui-step-chip-size': [
		'Step chip size',
		'Sets both the width and height of the numbered circular marker, including its border. The title and connector keep their own sizes.',
	],
	'--os-ui-step-connector-width': [
		'Step connector length',
		'Sets the length of the thin horizontal rule between steps. Increasing it separates the steps without enlarging their number chips. A value of 0 hides the connector. Station’s vertical base is 0; the horizontal layout shown here supplies a 20px connector.',
	],
	'--os-ui-step-gap': [
		'Space inside each step',
		'Sets the horizontal space between a step’s number chip, its title and its connecting rule. It does not change the size of the chip or the length of the rule.',
	],
	'--os-ui-steps-gap': [
		'Space between steps',
		'Sets the gap between complete steps: horizontally in a wizard trail, vertically in a step list. The chip, title and connector within each step stay together.',
	],
	'--os-accent': [
		'Desktop accent',
		'Sets the shell’s accent color for desktop highlights that use the desktop palette. Shared UI components can use the separate interface accent.',
	],
	'--os-border': [
		'Desktop border color',
		'Sets the base border color for desktop surfaces that inherit the shell palette.',
	],
	'--os-danger': [
		'Desktop danger color',
		'Colors destructive actions and danger feedback in the desktop shell.',
	],
	'--os-fg': [
		'Desktop text',
		'Sets the main foreground color for the desktop shell.',
	],
	'--os-fg-muted': [
		'Desktop secondary text',
		'Sets the quieter foreground color for secondary information in the desktop shell.',
	],
	'--os-hover': [
		'Desktop hover fill',
		'Sets the background highlight shown when the pointer enters desktop items that inherit this value.',
	],
	'--os-surface': [
		'Desktop surface fill',
		'Sets the base raised-surface color in the desktop shell.',
	],
	'--os-ui-border': [
		'Shared component border',
		'Sets the default border color inherited by UI components.',
	],
	'--os-ui-danger': [
		'Shared danger color',
		'Colors destructive actions and error feedback in components using the shared UI palette.',
	],
	'--os-ui-hover': [
		'Shared hover fill',
		'Sets the background highlight for components that inherit the shared hover color.',
	],
	'--os-ui-surface': [
		'Shared surface fill',
		'Sets the common surface color inherited by UI components.',
	],
	'--os-ui-text-muted': [
		'Muted text utility',
		'Sets the muted color for text elements using the shared text utility.',
	],
	'--os-ui-modal-fg': [
		'Modal foreground',
		'Sets the default foreground inherited by content inside a modal.',
	],
	'--os-ui-modal-text': [
		'Modal body text',
		'Sets the main body-text color inside modal content.',
	],

	'--os-ui-accent': [
		'Accent',
		'Sets the shared highlight color used by buttons, links, focus states and other interface accents.',
	],
	'--os-ui-accent-dim': [
		'Ambient accent',
		'Sets the quieter companion to the main accent, used for glows, washes and low-emphasis highlights.',
	],
	'--os-bg': [
		'Desktop background',
		'Paints the desktop behind windows, shortcuts and the dock. It accepts a flat color or a CSS gradient; uploaded wallpaper and desktop textures can cover it.',
	],
	'--os-window-bg': [
		'Window surface',
		'Sets the background inside a window. Transparent window-body textures let this color show through.',
	],
	'--os-ui-fg': [
		'Primary text',
		'Sets the main readable text color for components that inherit the shared foreground.',
	],
	'--os-ui-fg-muted': [
		'Secondary text',
		'Sets the quieter text color used for supporting labels, captions and less prominent information.',
	],
	'--os-titlebar-bg-focused': [
		'Active title bar',
		'Paints the title bar of the focused window. Compare Focused and Unfocused to distinguish the active window from its neighbors.',
	],
	'--os-titlebar-bg': [
		'Inactive title bar',
		'Paints the base title-bar background. The focused background replaces it when a window becomes active.',
	],
	'--os-window-radius': [
		'Window corners',
		'Rounds the outer window corners. A larger radius also clips more of corner artwork; sharp or round layout recommendations can override this radius.',
	],
	'--os-dock-bg': [
		'Dock surface',
		'Paints the dock behind its app icons. A transparent dock texture reveals this background underneath.',
	],
	'--os-ui-font': [
		'Interface typeface',
		'Sets the font family inherited by UI components. Choose a system family, or bundle a font in Fonts and apply its family here.',
	],
	'--os-font': [
		'Desktop typeface',
		'Sets the base font family for the desktop shell and components that inherit its typography.',
	],
	'--os-window-corner-inset': [
		'Corner artwork inset',
		'Moves all four corner ornaments inward from the window edges. Increase it to keep artwork clear of rounded corners.',
	],
	'--os-window-corner-size': [
		'Corner artwork size',
		'Sets the width and height of the four corner ornaments. A size supplied in Textures takes precedence; the first size in NE, NW, SE, SW order is shared.',
	],
	'--os-titlebar-image-focused': [
		'Focused title-bar artwork',
		'Provides the focused title-bar image layer. Add artwork through Textures → Titlebar Focused; it shares tiling, position and size with the base title-bar image.',
	],
	'--os-cn-hue': [
		'App-panel spotlight hue',
		'Changes the hue of the pointer spotlight in the dock’s expanded app panel. Values follow the hue wheel: 0 is red, 120 green, 240 blue.',
	],
	'--os-cn-row-hue': [
		'App-panel row hue',
		'Changes the hue used for a row’s accent mark in the expanded app panel. The live shell can derive it from the app identity.',
	],
	'--os-cn-x': [
		'Spotlight horizontal position',
		'Moves the app-panel spotlight left or right. Use a percentage: 0% is the left edge and 100% the right edge.',
	],
	'--os-cn-y': [
		'Spotlight vertical position',
		'Moves the app-panel spotlight up or down. Use a percentage: 0% is the top and 100% the bottom.',
	],
	'--os-cn-shift': [
		'App-panel horizontal adjustment',
		'Shifts the expanded app panel sideways to keep it inside the viewport. This is normally calculated by the shell, so a fixed theme override may be replaced.',
	],
	'--os-cn-beam-x': [
		'App-panel connector offset',
		'Moves the connector beam sideways so it still points to its dock icon when the panel is shifted. The shell normally updates this position.',
	],
	'--os-cn-row': [
		'App-panel row stagger',
		'Sets the row index used to stagger the app panel’s entrance timing. Larger values delay the row; this is a per-row runtime value rather than a general color or spacing choice.',
	],
	'--os-ui-avatar-glare-x': [
		'Avatar reflection: horizontal position',
		'Moves the avatar’s reflection left or right. A value of 50% centers it horizontally; pointer movement can update this in the live component.',
	],
	'--os-ui-avatar-glare-y': [
		'Avatar reflection: vertical position',
		'Moves the avatar’s reflection up or down. A value of 50% centers it vertically; pointer movement can update this in the live component.',
	],
	'--os-ui-avatar-hover': [
		'Avatar hover intensity',
		'Controls the amount of lift, scale and reflective emphasis on the avatar. The component normally switches this from 0 to 1 on pointer entry.',
	],
	'--os-ui-avatar-tilt-x': [
		'Avatar vertical tilt',
		'Rotates the avatar around its horizontal axis, making its top or bottom edge tilt toward you. Use an angle such as 8deg.',
	],
	'--os-ui-avatar-tilt-y': [
		'Avatar horizontal tilt',
		'Rotates the avatar around its vertical axis, making its left or right edge tilt toward you. Use an angle such as 8deg.',
	],
	'--os-mobile-back-progress': [
		'Mobile back-gesture progress',
		'Controls the small horizontal shift of the mobile top bar during a back gesture. The gesture handler normally writes a progress value; a fixed theme value cannot reproduce the gesture.',
	],
	'--os-mobile-card-dir': [
		'Mobile app-card exit direction',
		'Chooses the direction used when a mobile app-switcher card slides away. Positive and negative values send the card in opposite directions; the switcher normally writes this.',
	],
	'--os-grid-snap-cols': [
		'Snap-grid columns',
		'Sets how many columns divide the snap-grid guide. Higher numbers create more, narrower guide cells; this does not register new window layouts.',
	],
	'--os-grid-snap-rows': [
		'Snap-grid rows',
		'Sets how many rows divide the snap-grid guide. Higher numbers create more, shorter guide cells.',
	],
	'--os-grid-snap-line': [
		'Snap-grid guide color',
		'Colors the thin lines that show the desktop snap grid. Adjust contrast so the guides are visible over the wallpaper.',
	],
	'--os-ui-swatch-grid-cols': [
		'Swatch-grid columns',
		'Sets how many color swatches fit in each grid row. Increase it for a denser palette, or reduce it for fewer columns.',
	],
	'--os-tabs-slide': [
		'Tab highlight movement',
		'Sets the duration and easing of the sliding tab highlight together. For example, 340ms ease-out moves quickly at first and settles gently.',
	],
	'--os-ui-focus-ring': [
		'Shared keyboard-focus ring',
		'Draws the layered focus ring around keyboard-focused controls. It accepts a box-shadow value, including multiple comma-separated rings.',
	],
	'--os-ui-spinner-size': [
		'Spinner size',
		'Sets both the width and height of the loading spinner. Station’s base spinner is 48px; the inline preset uses 16px beside text. This preview shows the base spinner.',
	],
	'--os-ui-spinner-accent': [
		'Spinner mark color',
		'Colors the WordPress mark drawn over the spinner disc. Station follows the on-accent foreground, so the mark remains readable against the colored disc.',
	],
	'--os-ui-spinner-color': [
		'Spinner disc color',
		'Colors the spinner disc and primary strokes. Station follows the WordPress admin accent; the inline preset instead inherits the surrounding text color.',
	],
	'--os-admin-bar-slide': [
		'Admin bar slide duration',
		'Sets how long the dynamic admin bar takes to slide down from its parked strip at the top edge, and back up. Station uses 180ms with ease timing. The preview pauses between reveals so you can see the motion.',
	],
	'--os-ui-term-bar': [
		'Terminal indicator fill',
		'Sets the percentage stop of the terminal indicator’s fill. Higher percentages extend the colored portion farther across its track. This token is retained from Legacy; Station has no current CSS consumer for it.',
	],
	'--os-ui-badge-accent': [
		'Accent badge text',
		'Colors the text of the accent badge variant. Station follows the holographic ink token, which keeps the text dark enough to read over the bright mesh fill.',
	],
	'--os-ui-badge-accent-bg': [
		'Accent badge fill',
		'Paints the accent badge variant with Station’s holographic fill. This follows the shared holographic fill token until you supply a different value.',
	],
	'--wp-admin-theme-color': [
		'WordPress admin accent',
		'Supplies the WordPress admin accent color used by compatible controls. The live shell’s user accent settings can overwrite this value.',
	],
	'--os-ui-btn-color': [
		'Window-button text',
		'Sets the foreground of the compact window-style button. Station inherits the surrounding text color by default; title bars can supply a different value in their focused or hovered states.',
	],
	'--os-ui-notice-font': [
		'Notice typography',
		'Sets the complete font shorthand for notice text, including size, line height and family. For example, 13px/1.5 system-ui.',
	],
};
function title(t) {
	let n = t.name
		.replace(/^--os-(?:ui-)?/, '')
		.replace(/^--wp-admin-/, 'WordPress admin ')
		.replace(/^my-wordpress-/, 'My WordPress ')
		.replace(/titlebar/g, 'title bar')
		.replace(/^fx-/, 'background effect ')
		.replace(/^z-/, 'layer ')
		.replace(/^dock-floating-/, 'floating-dock-')
		.replace(/window-border-image/, 'window frame')
		.replace(/bg-image|image-source|image/g, 'texture');
	const modifiers = [];
	let hover = false;
	n = n.replace(
		/(?:^|[- ])(unfocused|focused|hover|compact|large|pressed|selected|active)(?=[- ]|$)/g,
		(_, m) => {
			if (m === 'hover') hover = true;
			else modifiers.push(m === 'unfocused' ? 'inactive' : m);
			return ' ';
		},
	);
	n = n
		.split(/[- ]+/)
		.filter(Boolean)
		.map(
			(w) =>
				replacements[w] ??
				{
					ne: 'top-right',
					nw: 'top-left',
					se: 'bottom-right',
					sw: 'bottom-left',
					lg: 'large',
					md: 'medium',
					sm: 'small',
				}[w] ??
				w,
		)
		.join(' ')
		.replace(/\bborder radius\b/g, 'corner radius')
		.replace(/\bfont family\b/g, 'typeface')
		.replace(/\bfont weight\b/g, 'text weight');
	n = [...modifiers, n].join(' ') + (hover ? ' on hover' : '');
	return n[0].toUpperCase() + n.slice(1);
}
function subject(t) {
	const parts = [
		['--os-dock-recycle-badge', 'the recycle-bin counter in the dock'],
		['--os-dock-badge', 'the notification badge on a dock icon'],
		['--os-dock-indicator', 'the dock’s running-app indicator'],
		['--os-dock-exit', 'the dock’s exit control'],
		['--os-dock-floating', 'the floating dock rail'],
		['--os-dock-icon', 'the dock’s app icons'],
		['--os-dock-item', 'an individual dock item'],
		['--os-tile-shortcut', 'the shortcut mark on a desktop icon'],
		['--os-tile-label', 'the label beneath a desktop icon'],
		['--os-titlebar-meta', 'the title bar’s metadata capsule'],
		['--os-titlebar-controls', 'the group of title-bar controls'],
		['--os-titlebar-btn', 'an individual title-bar button'],
		['--os-ui-table-header', 'the table header'],
		['--os-ui-table-cell', 'the table cells'],
		['--os-ui-table-row', 'the table rows'],
		['--os-ui-table-skeleton', 'the table’s loading placeholder'],
		['--os-ui-cat-guide', 'the category tree’s guide lines'],
		['--os-ui-cat-pop', 'the category picker’s popover'],
		['--os-ui-cat-trigger', 'the category picker’s trigger'],
		['--os-ui-tag-input-pop', 'the tag suggestion popover'],
		['--os-ui-tag-input-add', 'the add-tag control'],
		['--os-ui-code-copy', 'the code block’s copy button'],
		['--os-ui-log-row', 'an individual log row'],
		['--os-ui-step-title', 'the step title'],
		['--os-ui-step-chip', 'the numbered step marker'],
		['--os-ui-progress-label', 'the progress label'],
		['--os-ui-badge-dot', 'the dot inside a status badge'],
		['--os-ui-avatar-dot', 'the avatar’s status dot'],
		['--os-ui-switch-knob', 'the toggle switch’s movable knob'],
		['--os-ui-stat-label', 'the statistic’s label'],
		['--os-ui-stat-value', 'the statistic’s value'],
	];
	return (
		parts.find(([prefix]) => t.name.startsWith(prefix))?.[1] ??
		subjects[t.surface] ??
		t.surface.toLowerCase()
	);
}
function effect(t) {
	const n = t.name,
		p = t.previewProperty;
	if (/border-image.*slice/.test(n))
		return 'Sets where the frame artwork is cut into its center, edges and corners. Use the nine-slice guides in Textures to see those cuts; optional fill also paints the center.';
	if (/border-image.*width/.test(n))
		return 'Sets how wide the frame artwork is painted around the window. A larger value makes the decorative frame thicker; it does not change the artwork’s slice positions.';
	if (/border-image.*repeat/.test(n))
		return 'Chooses how the frame edges fit between the corners: stretch, repeat, round or space. Two values can control horizontal and vertical edges separately.';
	if (/(?:image|image-source)$/.test(n))
		return (
			'Supplies the artwork layer for ' +
			subjects[t.surface] +
			'. Use the Textures editor to upload PNG, SVG or another supported image; URL values cannot be stored directly in token overrides.'
		);
	if (p === 'background-size')
		return (
			'Sets the scale of the artwork on ' +
			subjects[t.surface] +
			'. Use auto for its natural size, cover to fill the surface, contain to fit it, or one/two explicit lengths.'
		);
	if (p === 'background-position')
		return (
			'Places the artwork within ' +
			subjects[t.surface] +
			'. For example, left top pins it to a corner, while center keeps it centered.'
		);
	if (p === 'background-repeat')
		return (
			'Chooses how artwork repeats on ' +
			subjects[t.surface] +
			'. Use repeat for a tiled texture, repeat-x or repeat-y for one axis, or no-repeat for a single image.'
		);
	if (n.startsWith('--os-fx-') && p === 'filter') {
		const op = n.split('-').at(-1);
		return op === 'blur'
			? 'Blurs the affected backdrop. A larger pixel length softens more detail; 0px keeps it sharp.'
			: op === 'amount'
				? 'Controls how much color is removed by the grayscale backdrop effect. Use 0 for full color and 1 for grayscale.'
				: op === 'saturate'
					? 'Adjusts color intensity in this backdrop effect. Use 1 for unchanged saturation, less than 1 for muted colors and more than 1 for stronger colors.'
					: 'Adjusts brightness in this backdrop effect. Use 1 for unchanged brightness, less than 1 to darken and more than 1 to brighten.';
	}
	const where = subject(t);
	const part = title(t)
		.replace(/ on hover| while focused| while inactive/g, '')
		.toLowerCase();
	if (p === 'color' || p === 'fill' || p === 'stroke')
		return `Sets the ${/muted|faint|subtle/.test(n) ? 'quieter ' : ''}foreground color for ${where}. ${p === 'stroke' ? 'This colors the drawn outline.' : p === 'fill' ? 'This colors the filled shape.' : 'Text and foreground marks use this value.'}`;
	if (
		p === 'background' ||
		p === 'background-color' ||
		p === 'background-image'
	)
		return `Paints the background of ${where}. Transparent colors and gradients let the surface underneath show through.`;
	if (p === 'box-shadow' || p === 'text-shadow')
		return `Changes the ${p === 'text-shadow' ? 'text shadow' : 'shadow or ring'} on ${where}. ${t.previewValue.startsWith('0 ') ? 'This token supplies the shadow or ring color; its geometry comes from the component.' : 'Use offsets, blur and color to control how the ' + (p === 'text-shadow' ? 'text' : 'surface') + ' separates from its background.'}`;
	if (p.includes('radius'))
		return `Rounds the corners of ${where}. Use 0 for square corners; larger lengths make the rounding more pronounced.`;
	if (p === 'font-family')
		return `Sets the typeface for ${where}. Enter a font-family stack; upload custom font files in Fonts before using their family name.`;
	if (p === 'font')
		return `Sets the complete typography of ${where}: weight, size, line height and family can be supplied together as a CSS font shorthand.`;
	if (p === 'font-size')
		return `Sets the text size in ${where}. Larger values increase emphasis and can require more room in the layout.`;
	if (p === 'font-weight')
		return `Sets the text weight in ${where}. A higher number usually appears bolder; the available weights depend on the chosen font.`;
	if (p === 'line-height')
		return `Sets the distance between text baselines in ${where}. Unitless values scale with the font size; larger values give lines more breathing room.`;
	if (p === 'letter-spacing')
		return `Adjusts the spacing between letters in ${where}. Positive values spread letters apart, while negative values tighten them.`;
	if (p === 'text-transform')
		return `Changes the displayed letter case in ${where}, such as uppercase, lowercase or none. The underlying text stays the same.`;
	if (p === 'white-space')
		return `Controls how spaces and line breaks are displayed in ${where}. For example, nowrap keeps content on one line and pre-wrap preserves breaks while allowing wrapping.`;
	if (p === '-webkit-font-smoothing')
		return `Chooses the browser’s font-smoothing treatment for ${where}. Its visible effect depends on the browser and display.`;
	if (p === 'opacity')
		return `Sets the transparency of ${where}. Use 0 for invisible and 1 for fully opaque.`;
	if (p === 'z-index')
		return `Sets the stacking priority of ${part}. Higher numbers appear above lower numbers within the same stacking context; this does not change size or position.`;
	if (p === 'animation-duration')
		return `Sets how long ${part} takes in ${where}. Shorter durations feel quicker; longer durations make the motion more gradual. The specimen isolates the timing with a moving marker.`;
	if (p === 'animation-delay')
		return `Sets the wait before ${part} starts in ${where}. Positive time values postpone the animation; negative values start partway through it.`;
	if (p === 'animation-timing-function')
		return `Shapes the pace of ${part}. Easing changes acceleration and settling without changing the overall duration.`;
	if (/gap/.test(p))
		return `Sets the space between neighboring items in ${where}. Larger lengths spread the items apart; 0 removes this gap.`;
	if (/padding/.test(p))
		return `Sets the inner space in ${where}. Padding separates content from its container’s edges; increasing it makes the layout roomier.`;
	if (/grid-template/.test(p))
		return `Defines the ${p.endsWith('columns') ? 'column' : 'row'} tracks in ${where}. Use valid CSS grid track values to choose their number and relative sizes.`;
	if (/align|justify/.test(p))
		return `Places items within the available space in ${where}. Start, center and end move the group; supported distribution values can spread items across the container.`;
	if (/height|block-size/.test(p))
		return `${p.startsWith('max') ? 'Limits the maximum' : p.startsWith('min') ? 'Sets the minimum' : 'Sets the'} height of ${where}. Larger lengths give the element more vertical room.`;
	if (/width|inline-size/.test(p))
		return `${p.startsWith('max') ? 'Limits the maximum' : p.startsWith('min') ? 'Sets the minimum' : 'Sets the'} width of ${where}. Larger lengths give the element more horizontal room.`;
	if (/inset|top|bottom|left|right/.test(p) && !p.includes('border'))
		return `Offsets ${part} within ${where}. Positive and negative lengths move it in opposite directions along the indicated edge or axis.`;
	if (/border|outline/.test(p))
		return `Defines ${part} around ${where}. ${p.endsWith('color') ? 'Choose a color; width and style are controlled separately.' : 'Use the color, width and style accepted by this border or outline property.'}`;
	if (p === 'filter')
		return `Applies the visual filter for ${part} in ${where}. The specimen isolates the filter so its effect can be seen without altering the editor.`;
	if (p === 'transform')
		return `Transforms ${part} in ${where}. The specimen shows the value’s geometric effect independently of the live component’s motion.`;
	return `Changes ${part} in ${where}. The adjacent specimen applies it through the ${p} CSS property.`;
}
function stateNote(t) {
	const n = t.name;
	const notes = [];
	if (n.includes('unfocused')) notes.push('Used while the window is inactive.');
	else if (n.includes('focused'))
		notes.push('Used while the window is focused.');
	if (n.includes('hover'))
		notes.push('Used when the pointer is over the control.');
	if (/pressed|bg-active/.test(n))
		notes.push('Used during the pressed/active interaction state.');
	else if (n.includes('selected')) notes.push('Used for the selected item.');
	if (n.includes('compact'))
		notes.push('Applies to the compact density variant.');
	if (n.endsWith('-large')) notes.push('Applies to the large variant.');
	if (/danger|failed|error/.test(n))
		notes.push('Used for destructive actions or failure feedback.');
	if (n.includes('warning'))
		notes.push('Used for warning or caution feedback.');
	if (n.includes('success') || n.includes('saved'))
		notes.push('Used for successful or saved feedback.');
	return notes.join(' ');
}
function hint(t) {
	const v = t.default;
	if (t.previewProperty === 'border-image-slice')
		return 'Use 1–4 whole-number slice offsets, optionally followed by fill. The Textures editor provides image guides.';
	if (t.previewProperty === 'border-image-width')
		return 'Use 1–4 frame widths, such as 12px or 8px 12px.';
	if (t.previewKind === 'image')
		return /repeat/.test(t.previewProperty)
			? 'Choose a repeat keyword; frame edges use stretch / repeat / round / space.'
			: /source|image$/.test(t.previewProperty)
				? 'Upload image files in Textures; token values cannot contain URLs.'
				: 'Use CSS size/position values appropriate to the artwork.';
	if (
		/^#|^(rgb|hsl|color-mix)/.test(v) ||
		t.kind === 'color' ||
		['color', 'fill', 'stroke', 'border-color'].includes(t.previewProperty)
	)
		return 'Try a hex color such as #ec9bff, or rgba() for transparency.';
	if (t.previewProperty === 'font') return 'Example: 500 13px/1.5 system-ui.';
	if (t.previewProperty === 'font-family')
		return 'Example: "My Studio Font", system-ui, sans-serif.';
	if (t.previewKind === 'motion')
		return t.previewProperty.includes('timing')
			? 'Use an easing keyword or cubic-bezier().'
			: 'Use ms or s for time values, unless this is a documented runtime index.';
	if (t.kind === 'shadow')
		return 'Use the value field for exact shadows; the visual shadow control replaces complex shadows with one layer.';
	if (t.kind === 'number')
		return /(?:px|rem|em|%)$/.test(v)
			? 'Use a CSS length or percentage. Keep the unit unless the property accepts a bare number.'
			: 'Use a numeric value; keep any required unit shown by the default.';
	return 'Use a direct CSS value. Unchanged defaults are inherited and do not count toward the 512-override limit.';
}
const tokens = Object.fromEntries(
	surfaceTokens.map((t) => {
		const sources = usage.get(t.name) ?? [];
		const selected = [...sources]
			.sort(
				(a, b) =>
					Number(b.property === t.previewProperty) -
					Number(a.property === t.previewProperty),
			)
			.slice(0, 3);
		if (!selected.length) {
			const path = t.sources[0];
			const src = readFileSync(join(root, path), 'utf8');
			selected.push({
				path,
				line: src.slice(0, src.indexOf(t.name)).split('\n').length,
				property: 'definition',
			});
		}
		return [
			t.name,
			{
				title: special[t.name]?.[0] ?? title(t),
				description: /^--os-ui-cat-(?:edge|label|node-glow|trigger)/.test(
					t.name,
				)
					? 'Retained category-map or trigger styling. The current category picker no longer renders this part; the studio shows its CSS on a reference sketch. ' +
						effect(t)
					: (special[t.name]?.[1] ?? effect(t)),
				state: stateNote(t),
				inputHint: hint(t),
				surface: t.surface,
				property: t.previewProperty,
				evidence: selected,
				defaultDependencies: [
					...t.default.matchAll(/var\(\s*(--[a-z0-9-]+)/g),
				].map((m) => m[1]),
			},
		];
	}),
);
writeFileSync(
	'src/data/token-help.json',
	JSON.stringify(
		{
			source:
				'Alcazaba CSS consumers and token definitions; independent explanatory copy.',
			tokens,
		},
		null,
		2,
	) + '\n',
);
console.log(
	`Wrote ${Object.keys(tokens).length} titles and descriptions; ${[...usage.keys()].filter((k) => tokens[k]).length} have direct CSS-consumer evidence.`,
);
