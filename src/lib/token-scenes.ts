import type { SurfaceToken } from './surfaces';

/** Independent, inert sketches. Parts follow Alcazaba's CSS consumers, not its runtime. */
export interface TokenScene {
	family: string;
	html: string;
	part: string;
	label: string;
	also?: string[];
}
const part = (name: string, text = '', cls = '', tag = 'div') =>
	`<${tag} data-part="${name}" class="sk-${cls || name}">${text}</${tag}>`;
const row = (content: string, name = 'row') => part(name, content, 'row');
const text = (value: string, name = 'label') =>
	part(name, value, 'text', 'span');
const muted = (value: string, name = 'muted') =>
	part(name, value, 'muted', 'span');
const icon = (value = '▧', name = 'icon') => part(name, value, 'icon', 'span');
const action = (value = 'Save changes', name = 'action') =>
	part(name, value, 'action', 'span');
const field = (value = 'My workspace', name = 'input') =>
	part(name, value, 'input');
const panel = (content: string, name = 'surface') =>
	part(name, content, 'panel');
const chip = (value = 'Design', name = 'chip') =>
	part(name, value, 'chip', 'span');
const titlebar = () =>
	row(
		text('Appearance', 'title') +
			part(
				'controls',
				['−', '□', '×']
					.map((v) => part('control', v, 'control', 'span'))
					.join(''),
				'controls',
			),
		'titlebar',
	);
const windowBody = () =>
	part(
		'body',
		text('Your workspace') +
			muted('A place for your next idea') +
			field() +
			action(),
		'body',
	);
const window = () => part('window', titlebar() + windowBody(), 'window');
const tabs = () =>
	part(
		'tabs',
		part('tab', 'Overview' + part('rail') + part('crown'), 'tab') +
			part('inactive', 'Settings', 'tab') +
			part('tab-muted', '3', 'muted'),
		'tabs',
	);
const badge = (value = '3', name = 'badge') =>
	part(name, value, 'badge', 'span');
const app = (name = 'app') =>
	part(name, icon() + text('Media', 'app-label') + badge(), 'app');
const menu = () =>
	part(
		'menu',
		row(icon('▧') + text('Open file') + muted('⌘O')) +
			row(text('Rename') + muted('⌘R')) +
			part('separator') +
			row(text('Move to trash', 'danger')) +
			part('footer', muted('3 items selected'), 'footer'),
		'menu',
	);
const card = () =>
	panel(
		icon('▧', 'thumb') +
			text('Project notes', 'title') +
			muted('Updated a moment ago') +
			action('Open project'),
	);
const progress = () =>
	part(
		'progress',
		row(
			text('Uploading photos', 'label') + muted('65%', 'value'),
			'progress-label',
		) + part('track', part('fill'), 'track'),
		'progress',
	);
const inputGroup = () =>
	panel(
		text('Tags') +
			row(chip('Design', 'chip') + chip('Notes', 'chip')) +
			field('Find or create a tag…') +
			action('+ Add tag', 'add') +
			part(
				'popover',
				text('Suggested tags', 'pop-label') +
					muted('3 matches', 'pop-muted') +
					part('divider') +
					text('Create “Ideas”', 'create'),
				'popover',
			),
	);
const grid = () =>
	part(
		'grid',
		['Notes', 'Media', 'Pages', 'Posts', 'Team', 'Files']
			.map((v) => part('cell', icon('▧') + text(v), 'cell'))
			.join(''),
		'grid',
	);
const notice = () =>
	part(
		'notice',
		icon('✓', 'status-icon') +
			part(
				'notice-body',
				text('Changes saved', 'label') +
					muted('Your workspace is up to date.') +
					text('View details →', 'link'),
				'column',
			),
		'notice',
	);
const table = () =>
	part(
		'table-scroll',
		`<table data-part="table" class="sk-table"><thead data-part="header"><tr><th>Page</th><th>Status</th></tr></thead><tbody><tr data-part="stripe"><td data-part="cell">Home</td><td>Published</td></tr><tr data-part="hover"><td data-part="cell">About</td><td>Draft</td></tr><tr data-part="sticky"><td data-part="cell">Contact</td><td>Draft</td></tr><tr><td data-part="skeleton">Loading…</td><td>…</td></tr></tbody></table>`,
		'table-scroll',
	);
const labels: Record<string, string> = {
	surface: 'Component surface',
	label: 'Text label',
	muted: 'Secondary text',
	chip: 'Label chip',
	number: 'Numbered step chip',
	connector: 'Rule between steps',
	'step-title': 'Step title',
	steps: 'Space between complete steps',
	step: 'Space between chip, title and connector',
	control: 'Window control button',
	controls: 'Window control group',
	titlebar: 'Window title bar',
	title: 'Title text',
	input: 'Text entry area',
	'field-label': 'Field label column',
	'field-row': 'Label and input row',
	track: 'Unfilled track',
	fill: 'Filled track',
	knob: 'Switch knob',
	readout: 'Numeric readout',
	dot: 'Status dot',
	badge: 'Notification count badge',
	icon: 'Icon',
	window: 'Window frame',
	body: 'Window content area',
	grid: 'Grid of items',
	row: 'Row of content',
	copy: 'Copy button',
	code: 'Code text',
	log: 'Log viewer',
	corner: 'Corner artwork',
	rail: 'Tab edge indicator',
	crown: 'Active tab highlight',
};

export function tokenScene(t: SurfaceToken): TokenScene {
	const n = t.name,
		s = t.surface;
	let html = '',
		target = 'surface',
		family = s.toLowerCase().replace(/[^a-z]+/g, '-');
	const choose = (rules: [RegExp, string][], fallback: string) =>
		rules.find(([r]) => r.test(n))?.[1] ?? fallback;
	if (s === 'Steps') {
		html = part(
			'steps',
			[1, 2]
				.map((v) =>
					part(
						'step',
						part(
							v === 1 && n.includes('done') ? 'done' : 'number',
							v === 1 && n.includes('done') ? '✓' : String(v),
							'step-number',
							'span',
						) +
							text(v === 1 ? 'Create' : 'Publish', 'step-title') +
							(v === 1 ? part('connector', '', 'step-connector', 'span') : ''),
						'step',
					),
				)
				.join(''),
			'steps',
		);
		target = choose(
			[
				[/chip-done/, 'done'],
				[/chip/, 'number'],
				[/connector/, 'connector'],
				[/title/, 'step-title'],
				[/steps-gap/, 'steps'],
			],
			'step',
		);
	} else if (
		[
			'Title bar',
			'Window Controls',
			'Window activity',
			'Window frame',
			'Window corners',
			'Window reveal',
		].includes(s)
	) {
		html = window();
		if (s === 'Title bar') target = /divider/.test(n) ? 'controls' : 'titlebar';
		if (s === 'Window Controls')
			target = choose(
				[
					[/meta/, 'meta'],
					[/controls/, 'controls'],
					[/icon-color/, 'control-icon'],
				],
				'control',
			);
		if (s === 'Window activity') target = 'activity';
		if (s === 'Window frame') target = /body/.test(n) ? 'body' : 'window';
		if (s === 'Window corners') target = 'corner';
		if (s === 'Window reveal')
			target = /edge/.test(n) ? 'reveal-edge' : 'reveal';
		html = html.replace(
			'Appearance</span>',
			'Appearance</span>' +
				part('meta', part('activity', '✓', 'activity'), 'meta'),
		);
		html = html.replaceAll(
			'class="sk-control">',
			'class="sk-control"><i data-part="control-icon"></i>',
		);
		html = html.replace(
			'<div data-part="body"',
			(s === 'Window corners'
				? ['nw', 'ne', 'sw', 'se']
						.map((c) => part('corner', '⌜', `corner sk-corner-${c}`))
						.join('')
				: '') + '<div data-part="body"',
		);
		if (s === 'Window reveal')
			html += part(
				'reveal',
				text('Opening window…') + part('reveal-edge'),
				'reveal',
			);
	} else if (s === 'Window tabs' || s === 'Tab') {
		html = part('window', titlebar() + tabs() + windowBody(), 'window');
		target = choose(
			[
				[/rail|ui-tab-edge/, 'rail'],
				[/crown-opacity|crown|bloom/, 'crown'],
				[/frost|active-bg|wash/, 'tab'],
				[/color-muted/, 'tab-muted'],
				[/active-color/, 'tab'],
				[/tabs-color/, 'inactive'],
				[/radius|slide/, 'tab'],
			],
			'tabs',
		);
	} else if (s === 'Button' || s === 'Keycaps') {
		html = row(
			s === 'Button'
				? action('Save changes') + muted('Primary action')
				: part('key', '⌘', 'key', 'kbd') +
						part('key', 'K', 'key', 'kbd') +
						muted('Search'),
		);
		target = s === 'Button' ? 'action' : 'key';
	} else if (s === 'Avatar') {
		html = row(
			part('avatar', 'JD' + part('glare') + part('dot'), 'avatar') +
				part('name', text('Jamie Davis') + muted('Online'), 'column'),
		);
		target = choose(
			[
				[/dot/, 'dot'],
				[/glare/, 'glare'],
			],
			'avatar',
		);
	} else if (s === 'Badge' || s === 'Chips' || s === 'Category groups') {
		const name =
			s === 'Badge' ? 'Published' : s === 'Chips' ? 'Design notes' : 'Design';
		html = row(
			part(
				'chip',
				part('dot') +
					text(name, 'chip-label') +
					(s === 'Category groups' ? badge('12', 'count') : ''),
				'chip',
			) + muted(s === 'Badge' ? 'Status' : 'Category'),
		);
		target = choose(
			[
				[/dot-size/, 'dot'],
				[/label-max/, 'chip-label'],
				[/count/, 'count'],
			],
			'chip',
		);
	} else if (s === 'Breadcrumbs') {
		html = row(
			text('Files') +
				muted('›') +
				chip('Projects') +
				muted('›') +
				text('Notes'),
		);
		target = 'chip';
	} else if (s === 'Card' || s === 'Spacing & shape') {
		html = card();
	} else if (s === 'Code blocks') {
		html = part(
			'code-block',
			part(
				'code',
				'const theme = {\n  name: "My workspace",\n  accent: "#ec9bff"\n};',
				'code',
				'pre',
			) + part('copy', '⧉', 'copy', 'span'),
			'code-block',
		);
		target = choose(
			[
				[/copy-inset/, 'code'],
				[/copy-gap/, 'code-block'],
				[/copy/, 'copy'],
				[/block-max|block-padding/, 'code-block'],
			],
			'code',
		);
	} else if (s === 'Logs') {
		html = part(
			'log',
			[
				'10:24  Saved theme',
				'10:25  Uploaded texture.png',
				'10:26  Export ready',
			]
				.map((v) => part('log-row', v, 'log-row'))
				.join(''),
			'log',
		);
		target = /row/.test(n) ? 'log-row' : 'log';
	} else if (
		[
			'Context Menu',
			'Menu',
			'Flyouts',
			'Category tree',
			'Tag inputs',
			'Token Field',
		].includes(s)
	) {
		if (s === 'Tag inputs' || s === 'Token Field') {
			html = inputGroup();
			target = choose(
				[
					[/chip/, 'chip'],
					[/add/, 'add'],
					[/create/, 'create'],
					[/pop-divider/, 'divider'],
					[/pop-muted/, 'pop-muted'],
					[/pop-fg/, 'pop-label'],
					[/pop/, 'popover'],
					[/input-(bg|border|fg)$/, 'input'],
				],
				'surface',
			);
		} else if (s === 'Category tree') {
			html = panel(
				action('Choose categories ▾', 'trigger') +
					part(
						'popover',
						row(
							part('check', '✓', 'check', 'span') +
								text('Projects', 'tree-label') +
								icon('×', 'delete'),
						) +
							part(
								'guide',
								row(text('Design', 'tree-muted'), 'tree-row') +
									row(text('Notes', 'tree-label'), 'tree-row'),
								'guide',
							) +
							part('divider') +
							part('footer', chip('Uncategorized', 'uncat'), 'footer'),
						'popover',
					) +
					`<svg class="sk-tree-map" viewBox="0 0 240 50"><path data-part="edge" d="M30 5V25H170V45" fill="none" stroke="#9683a4"/><text data-part="svg-label" x="38" y="18" fill="#eee">Projects</text><text data-part="svg-muted" x="178" y="44" fill="#aaa">Notes</text></svg>`,
			);
			target = choose(
				[
					[/check/, 'check'],
					[/delete/, 'delete'],
					[/edge/, 'edge'],
					[/label-muted/, 'svg-muted'],
					[/label-fg/, 'svg-label'],
					[/node-glow/, 'tree-label'],
					[/guide/, 'guide'],
					[/row-indent/, 'tree-row'],
					[/trigger/, 'trigger'],
					[/uncat/, 'uncat'],
					[/footer/, 'footer'],
					[/divider/, 'divider'],
					[/pop-muted/, 'tree-muted'],
				],
				'popover',
			);
		} else {
			html = menu();
			target = choose(
				[
					[/separator/, 'separator'],
					[/muted/, 'muted'],
					[/backdrop/, 'backdrop'],
				],
				'menu',
			);
			if (target === 'backdrop') html = part('backdrop', html, 'backdrop');
		}
	} else if (['Dialog', 'Modal', 'Confirmation dialogs', 'Scrim'].includes(s)) {
		html = part(
			'backdrop',
			part(
				'dialog',
				text('Remove this item?', 'title') +
					muted('You can restore it from the trash.') +
					field('Optional note') +
					row(
						action('Cancel', 'cancel') + action('Remove', 'action'),
						'footer',
					),
				'dialog',
			),
			'backdrop',
		);
		target = choose(
			[
				[/scrim/, 'backdrop'],
				[/muted/, 'muted'],
				[/text$|fg$/, 'title'],
				[/surface-elevated|hover/, 'input'],
				[/border-strong/, 'action'],
			],
			'dialog',
		);
	} else if (['Field', 'Input', 'Range controls'].includes(s)) {
		html = part(
			'field-row',
			text('Workspace name', 'field-label') + field(),
			'field-row',
		);
		if (s === 'Range controls')
			html = row(
				text('Volume') +
					part('range', part('range-fill') + part('thumb'), 'range') +
					part('readout', '75', 'readout', 'span'),
			);
		target =
			s === 'Range controls'
				? 'readout'
				: choose(
						[
							[/label-width/, 'field-label'],
							[/row-gap/, 'field-row'],
						],
						'input',
					);
	} else if (
		[
			'Grids',
			'Swatches',
			'Rows',
			'Inline groups',
			'Stacks',
			'Repeater',
		].includes(s)
	) {
		if (s === 'Grids' || s === 'Swatches') {
			html = grid();
			target = 'grid';
			if (s === 'Swatches')
				html = part(
					'grid',
					[
						'#ec9bff',
						'#c2f1f1',
						'#93f0c6',
						'#f8f2b6',
						'#fa8794',
						'#aa67ff',
						'#4d3b60',
						'#fffbff',
					]
						.map(
							(c) =>
								`<span data-part="cell" class="sk-color" style="background:${c}"></span>`,
						)
						.join(''),
					'swatch-grid',
				);
		} else if (s === 'Repeater') {
			html = part(
				'list',
				['Home', 'About', 'Contact']
					.map((v) => row(icon('⠿') + field(v) + text('×'), 'repeat-row'))
					.join(''),
				'column',
			);
			target = /row/.test(n) ? 'repeat-row' : 'list';
		} else {
			html = part(
				'layout',
				action('Save changes') + chip('Draft') + muted('Updated just now'),
				s === 'Stacks' ? 'column' : s === 'Rows' ? 'wrap' : 'row',
			);
			target = 'layout';
		}
	} else if (['Progress', 'Term', 'Rating'].includes(s)) {
		html = progress();
		if (s === 'Rating')
			html = panel(
				row(
					part('stars', '★★★★', 'stars', 'span') +
						part('empty-stars', '★', 'stars', 'span'),
				) +
					row(text('4.0', 'label') + muted('24 reviews')) +
					part('track', part('fill'), 'track'),
			);
		if (s === 'Term')
			html = panel(
				text('Deploying…', 'terminal-label') +
					part('terminal-progress', '', 'terminal-progress'),
			);
		target =
			s === 'Term'
				? 'terminal-progress'
				: choose(
						[
							[/label-gap/, 'progress-label'],
							[/label/, 'label'],
							[/star-empty/, 'empty-stars'],
							[/star$/, 'stars'],
							[/fg-muted/, 'muted'],
							[/fg$/, 'label'],
							[/height|radius|track/, 'track'],
							[/fill/, 'fill'],
						],
						'surface',
					);
		if (s === 'Progress' && target === 'surface') target = 'progress';
	} else if (['Spinner', 'Save Status', 'Window activity'].includes(s)) {
		html = row(
			part(
				'status',
				n.includes('saved') ? '✓' : n.includes('failed') ? '!' : '',
				'status',
			) +
				part(
					'pill',
					text(
						n.includes('failed')
							? 'Save failed'
							: n.includes('saved')
								? 'Saved just now'
								: 'Saving changes…',
					),
					'pill',
				),
		);
		target = /pill|font-size|fg$/.test(n) ? 'pill' : 'status';
	} else if (s === 'Switch') {
		html = row(part('switch', part('knob'), 'switch') + text('Focus mode'));
		target = 'knob';
	} else if (s === 'Stat' || s === 'Display' || s === 'Widgets') {
		html = panel(
			muted(s === 'Widgets' ? 'SITE ACTIVITY' : 'TOTAL VIEWS', 'stat-label') +
				part('value', '2,480', 'value') +
				text('↑ 12% this week', 'trend'),
		);
		target = choose(
			[
				[/label/, 'stat-label'],
				[/value/, 'value'],
			],
			'surface',
		);
	} else if (s === 'Notice' || s === 'Toast') {
		html = notice();
		target = /link/.test(n) ? 'link' : 'notice';
	} else if (s === 'Table') {
		html = table();
		target = choose(
			[
				[/header-height/, 'sticky'],
				[/header/, 'header'],
				[/cell-padding|column-border/, 'cell'],
				[/stripe/, 'stripe'],
				[/row-hover/, 'hover'],
				[/skeleton/, 'skeleton'],
				[/max-height/, 'table-scroll'],
				[/sticky-edge/, 'cell'],
			],
			'table',
		);
	} else if (s === 'Segmented controls') {
		html = part(
			'segments',
			part('selected', 'List view', 'segment') +
				part('segment', 'Grid view', 'segment'),
			'segments',
		);
		target = /selected/.test(n) ? 'selected' : 'segments';
	} else if (s === 'Ribbons') {
		html = panel(
			text('Featured project') +
				muted('A new collection of ideas') +
				part('ribbon', 'NEW', 'ribbon'),
		);
		target = 'ribbon';
	} else if (s === 'Tooltip') {
		html = part('tooltip', 'Open media library', 'tooltip') + icon('▧');
		target = 'tooltip';
	} else if (s === 'Empty') {
		html = part(
			'empty',
			icon('▧') +
				text('No files here yet') +
				muted('Drop an image to get started.'),
			'empty',
		);
		target = /icon/.test(n) ? 'icon' : 'empty';
	} else if (
		['Desktop icons', 'Icon badges', 'Recycle bin', 'Dock'].includes(s)
	) {
		if (s === 'Dock') {
			html = part(
				'dock',
				part('dock-item', icon('▦') + badge(), 'dock-item') +
					part('divider') +
					part('dock-item', icon('▧'), 'dock-item') +
					part('exit', '⏻', 'dock-item') +
					part('indicator'),
				'dock',
			);
			target = choose(
				[
					[/badge/, 'badge'],
					[/indicator/, 'indicator'],
					[/divider/, 'divider'],
					[/exit/, 'exit'],
					[/item/, 'dock-item'],
					[/icon/, 'icon'],
				],
				'dock',
			);
		} else {
			html = app();
			if (s === 'Recycle bin')
				html = html.replace('▧', '♲').replace('Media', 'Trash');
			html += part('shortcut', '↗', 'shortcut');
			target =
				s === 'Recycle bin'
					? 'badge'
					: choose(
							[
								[/badge/, 'badge'],
								[/icon-image-size/, 'icon'],
								[/shortcut/, 'shortcut'],
								[/label|fg/, 'app-label'],
							],
							'app',
						);
		}
	} else if (s === 'File explorer') {
		html = panel(
			row(icon('▱') + text('My WordPress', 'title')) +
				part(
					'file-card',
					icon('▧', 'thumb') +
						text('Design notes') +
						muted('Updated today') +
						badge('⌑', 'lock'),
					'file-card',
				),
		);
		target = choose(
			[
				[/lock/, 'lock'],
				[/thumb/, 'thumb'],
				[/muted/, 'muted'],
				[/card/, 'file-card'],
			],
			'surface',
		);
	} else if (s === 'Mobile') {
		html = part(
			'phone',
			part('top-scrim', '9:41', 'top-scrim') +
				part(
					'mobile-card',
					row(icon('‹') + text('Media')) +
						part(
							'mobile-tile',
							icon('▧') + text('Photos', 'mobile-label'),
							'mobile-tile',
						) +
						part('mobile-sheet', 'Share photo', 'mobile-sheet'),
					'mobile-card',
				),
			'phone',
		);
		target = choose(
			[
				[/top-scrim/, 'top-scrim'],
				[/scrim/, 'phone'],
				[/sheet/, 'mobile-sheet'],
				[/tile/, 'mobile-tile'],
				[/label/, 'mobile-label'],
			],
			'mobile-card',
		);
	} else if (s === 'Window links') {
		html = `<svg class="sk-links" viewBox="0 0 300 140"><rect x="12" y="20" width="100" height="70" rx="7" fill="#33283d" stroke="#74617f"/><rect x="190" y="50" width="95" height="70" rx="7" fill="#33283d" stroke="#74617f"/><text x="25" y="48" fill="#eee">Media</text><text x="202" y="78" fill="#eee">Post</text><path data-part="link" d="M110 55C165 55 130 85 190 85" fill="none" stroke="#ec9bff" stroke-width="2"/><circle data-part="anchor" cx="190" cy="85" r="6" fill="#ec9bff"/></svg>`;
		target = /active/.test(n) ? 'anchor' : 'link';
	} else if (s === 'Layering') {
		html = part(
			'layers',
			part('rear', 'Desktop', 'layer sk-layer-back') +
				part('layer', n.replace('--os-z-', '') + ' layer', 'layer') +
				part('front', 'Window', 'layer sk-layer-front'),
			'layers',
		);
		target = 'layer';
	} else if (s === 'Motion & timing') {
		html = part(
			'motion-track',
			part('moving', 'Open panel →', 'moving'),
			'motion-track',
		);
		target = 'moving';
	} else if (s === 'Typography') {
		html = panel(
			text('Make room for ideas', 'type-title') +
				text('Your next chapter starts here.', 'type-copy') +
				muted('0123456789 · Aa Bb Cc'),
		);
	} else if (s === 'Holographic Surfaces') {
		html = part('holo', icon('✦') + text('Your next great idea'), 'holo');
		target = 'holo';
	} else if (s === 'Constellation') {
		html = part(
			'constellation',
			text('Your applications', 'title') +
				part('divider') +
				part(
					'app-row',
					icon('▧') + text('Media library') + muted('12 items'),
					'row',
				) +
				part('beam') +
				muted('Click an app to open', 'legend'),
			'constellation',
		);
		target = choose(
			[
				[/beam/, 'beam'],
				[/divider/, 'divider'],
				[/row/, 'app-row'],
				[/legend/, 'legend'],
				[/muted/, 'muted'],
				[/fg$/, 'title'],
			],
			'constellation',
		);
	} else if (s === 'Desktop' || s === 'Palette & accents' || s === 'Panels') {
		html = part(
			'desktop',
			part('adminbar', 'W · My workspace', 'adminbar') +
				part(
					'work-area',
					part(
						'settings',
						part('nav', text('General') + text('Appearance'), 'nav') +
							part(
								'surface',
								text('My workspace', 'title') +
									muted('Your creative space') +
									part('body', field() + action(), 'column'),
								'panel',
							),
						'settings',
					) +
						part('desktop-grid', app() + app(), 'desktop-grid') +
						part('marquee') +
						part('resize', '◢', 'resize'),
					'work-area',
				),
			'desktop',
		);
		target = choose(
			[
				[/admin-bar/, 'adminbar'],
				[/settings-nav/, 'nav'],
				[/grid-snap/, 'desktop-grid'],
				[/grid-gap|grid-padding/, 'desktop-grid'],
				[/work-area|area-inset/, 'work-area'],
				[/resize/, 'resize'],
				[/selection-marquee|drop-preview/, 'marquee'],
				[/tile|app-tone/, 'app'],
				[/label|fg-muted|color-text-subtle/, 'muted'],
				[/fg$|color-text$|workspace-accent/, 'title'],
				[/icon-size/, 'icon'],
				[/focus-ring-field/, 'input'],
				[
					/accent|danger|success|warning|info|focus-ring|link|selection|search-highlight/,
					'action',
				],
				[/body|section-gap/, 'body'],
				[/panel-header/, 'title'],
				[/border/, 'surface'],
				[/surface|panel|ui-bg|ui-shadow/, 'surface'],
				[/hover|selected/, 'input'],
			],
			'desktop',
		);
		if (s === 'Panels') target = /gap|padding/.test(n) ? 'body' : 'surface';
	} else {
		throw new Error(`No component preview registered for ${s}`);
	}
	return {
		family,
		html,
		part: target,
		label:
			(labels[target] ?? target.replaceAll('-', ' ')) +
			(/^--os-ui-cat-(?:edge|label|node-glow|trigger)/.test(n)
				? ' · legacy reference'
				: ''),
	};
}
