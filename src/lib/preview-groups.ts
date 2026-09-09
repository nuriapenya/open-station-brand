import { tokensForSurface } from './surfaces.ts';
import type { SurfaceToken } from './surfaces.ts';
import { tokenScene } from './token-scenes.ts';

/** Parts reviewed per surface. Each entry is one shared, editable specimen. */
const parts: Record<string, string[][]> = {
	Avatar: [
		['Portrait', 'avatar', 'glare'],
		['Presence', 'dot'],
	],
	Badge: [['Badge', 'chip', 'dot']],
	Breadcrumbs: [['Breadcrumb trail', 'chip']],
	Button: [['Button', 'action']],
	Card: [['Card', 'surface']],
	'Category groups': [['Category chip', 'count', 'chip']],
	'Category tree': [
		[
			'Category list',
			'popover',
			'divider',
			'footer',
			'tree-muted',
			'tree-row',
			'check',
			'delete',
			'guide',
		],
		['Uncategorized', 'uncat'],
		['Legacy trigger', 'trigger'],
		['Legacy tree map', 'edge', 'svg-label', 'svg-muted', 'tree-label'],
	],
	Chips: [['Chip', 'chip', 'chip-label']],
	'Code blocks': [
		['Code block', 'code', 'code-block'],
		['Copy button', 'copy'],
	],
	'Confirmation dialogs': [['Confirmation dialog', 'dialog', 'title', 'muted']],
	Constellation: [
		['Panel', 'constellation', 'divider', 'title', 'muted', 'legend'],
		['App row', 'app-row'],
		['Light beam', 'beam'],
	],
	'Context Menu': [['Context menu', 'menu', 'muted', 'separator']],
	Desktop: [
		['Wallpaper', 'desktop'],
		['Admin bar', 'adminbar'],
		['Work area', 'work-area'],
		['Icon grid', 'desktop-grid'],
		['Selection', 'marquee'],
		['Settings navigation', 'nav'],
		['Resize handle', 'resize'],
		['Surface', 'surface', 'title', 'muted'],
		['App tile', 'app'],
		['Action', 'action'],
		['Input', 'input'],
	],
	'Desktop icons': [
		['Desktop icon', 'app', 'app-label'],
		['Shortcut badge', 'shortcut'],
	],
	Dialog: [['Dialog artwork', 'dialog']],
	Display: [['Display', 'surface']],
	Dock: [
		['Dock', 'dock', 'divider'],
		['Notification badge', 'badge'],
		['Dock item', 'dock-item', 'icon'],
		['Running indicator', 'indicator'],
		['Exit button', 'exit'],
	],
	Empty: [['Empty state', 'empty', 'icon']],
	Field: [['Field', 'input', 'field-row', 'field-label']],
	'File explorer': [
		['Explorer', 'surface'],
		['File card', 'file-card', 'muted', 'lock', 'thumb'],
	],
	Flyouts: [['Flyout', 'menu', 'backdrop']],
	Grids: [['Grid layout', 'grid']],
	'Holographic Surfaces': [['Holographic surface', 'holo']],
	'Icon badges': [
		['Notification badge', 'badge'],
		['App icon', 'icon'],
	],
	'Inline groups': [['Inline layout', 'layout']],
	Input: [['Input', 'input']],
	Keycaps: [['Keyboard key', 'key']],
	Layering: [['Layer stack', 'layer']],
	Logs: [
		['Log panel', 'log'],
		['Log row', 'log-row'],
	],
	Menu: [['Menu artwork', 'menu']],
	Mobile: [
		['App card', 'mobile-card', 'mobile-label'],
		['Phone background', 'phone', 'top-scrim'],
		['Bottom sheet', 'mobile-sheet'],
		['App tile', 'mobile-tile'],
	],
	Modal: [
		['Dialog', 'dialog', 'title', 'muted'],
		['Dialog controls', 'action', 'input'],
	],
	'Motion & timing': [['Motion', 'moving']],
	Notice: [['Notice', 'notice', 'link']],
	'Palette & accents': [
		['Surfaces', 'surface', 'body'],
		['Text', 'title', 'muted'],
		['Actions', 'action'],
		['Inputs', 'input'],
		['Backdrop', 'desktop'],
		['Icon', 'icon'],
	],
	Panels: [['Panel', 'surface', 'body']],
	Progress: [
		['Progress meter', 'track', 'fill'],
		['Progress label', 'label', 'progress-label'],
	],
	'Range controls': [['Range readout', 'readout']],
	Rating: [
		['Rating summary', 'surface', 'label', 'muted', 'stars', 'empty-stars'],
		['Rating distribution', 'track', 'fill'],
	],
	'Recycle bin': [['Recycle badge', 'badge']],
	Repeater: [['Repeated fields', 'list', 'repeat-row']],
	Ribbons: [['Ribbon', 'ribbon']],
	Rows: [['Row layout', 'layout']],
	'Save Status': [['Save indicator', 'status', 'pill']],
	Scrim: [['Overlay artwork', 'backdrop']],
	'Segmented controls': [['Segmented control', 'segments', 'selected']],
	'Spacing & shape': [['Corners', 'surface']],
	Spinner: [['Loading spinner', 'status']],
	Stacks: [['Stack layout', 'layout']],
	Stat: [['Statistic', 'surface', 'stat-label', 'value']],
	Steps: [
		['Numbered step chip', 'number'],
		['Completed step', 'done'],
		['Rule between steps', 'connector'],
		['Step title', 'step-title'],
		['Step spacing', 'step', 'steps'],
	],
	Swatches: [['Swatch grid', 'grid']],
	Switch: [['Switch knob', 'knob']],
	Tab: [['Tab', 'crown', 'rail', 'tab']],
	Table: [
		['Table', 'table', 'table-scroll', 'cell', 'stripe', 'sticky'],
		['Table header', 'header'],
		['Hovered row', 'hover'],
		['Loading rows', 'skeleton'],
	],
	'Tag inputs': [
		['Tag field', 'surface', 'add', 'input'],
		['Suggestions', 'popover', 'divider', 'pop-label', 'pop-muted', 'create'],
	],
	Term: [['Terminal progress', 'terminal-progress']],
	'Title bar': [['Title bar', 'titlebar', 'controls']],
	Toast: [['Toast', 'notice']],
	'Token Field': [['Token field', 'surface', 'chip']],
	Tooltip: [['Tooltip', 'tooltip']],
	Typography: [['Typography', 'surface']],
	Widgets: [['Widget artwork', 'surface']],
	'Window Controls': [
		['Window button', 'control', 'control-icon'],
		['Controls tray', 'controls'],
		['Window metadata', 'meta'],
	],
	'Window activity': [['Activity indicator', 'activity']],
	'Window corners': [['Window corners', 'corner']],
	'Window frame': [
		['Window frame', 'window'],
		['Window body', 'body'],
	],
	'Window links': [['Window connection', 'link', 'anchor']],
	'Window reveal': [['Reveal edge', 'reveal-edge', 'reveal']],
	'Window tabs': [
		['Tab strip', 'tabs'],
		['Tab', 'tab', 'tab-muted', 'inactive', 'rail', 'crown'],
	],
};
export interface PreviewGroup {
	id: string;
	title: string;
	state: string;
	tokens: SurfaceToken[];
}
export function previewGroups(surface: string): PreviewGroup[] {
	const groups = new Map<string, PreviewGroup>();
	for (const token of tokensForSurface(surface)) {
		const scene = tokenScene(token);
		const spec = parts[surface]?.find((entry) =>
			entry.slice(1).includes(scene.part),
		);
		if (!spec)
			throw new Error(`Ungrouped preview: ${token.name} (${scene.part})`);
		// Keep variants whose DOM or interpretation differs separately visible.
		const variant = token.name.match(
			/(?:neutral|accent|info|danger|error|success|warning)(?=-|$)/,
		)?.[0];
		const tone = ['Badge', 'Notice', 'Ribbons'].includes(surface)
			? variant
			: undefined;
		const modifier = token.name.includes('compact')
			? 'Compact'
			: surface === 'Dock' && token.name.includes('floating')
				? 'Floating'
				: surface === 'Dock' && token.name.includes('recycle')
					? 'Recycle bin'
					: surface === 'Desktop icons' && token.name.endsWith('-large')
						? 'Large'
						: surface === 'Ribbons' && token.name.includes('banner')
							? 'Banner'
							: '';
		const state =
			[modifier, tone, token.state === 'Default' ? '' : token.state]
				.filter(Boolean)
				.join(' · ') || 'Default';
		const id = `${surface}/${spec[0]}/${state}`;
		const group = groups.get(id) ?? { id, title: spec[0], state, tokens: [] };
		group.tokens.push(token);
		groups.set(id, group);
	}
	return [...groups.values()];
}
