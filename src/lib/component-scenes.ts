import type { SurfaceToken } from './surfaces';
import { applyComponentOverrides } from './station-preview';

/** Sample content only; styling and token consumption come from the vendored components. */
export function componentScene(t: SurfaceToken): string | null {
	const n = t.name;
	// Retained category-map/trigger CSS has no live element in the current picker.
	if (/^--os-ui-cat-(?:edge|label|node-glow|trigger)/.test(n)) return null;
	// These are light-DOM shell styles, not consumers in the corresponding custom element.
	if (
		[
			'--os-ui-context-menu-separator-color',
			'--os-ui-field-font-size-compact',
			'--os-ui-input-bg',
		].includes(n)
	)
		return null;
	const tone =
		n.match(/(?:accent|danger|error|info|neutral|success|warning)/)?.[0] ??
		'neutral';
	const value =
		tone === 'danger' || tone === 'error'
			? 'Needs attention'
			: tone === 'warning'
				? 'Pending review'
				: 'Published';
	const cases: Record<string, string> = {
		Steps: `<os-steps horizontal><os-step title="Create" ${n.includes('done') ? 'done' : ''}></os-step><os-step title="Publish"></os-step></os-steps>`,
		Button: '<os-button>Save changes</os-button>',
		Badge: `<os-badge tone="${tone}">${value}</os-badge>`,
		Chips: '<os-chip removable>Design notes and project ideas</os-chip>',
		Breadcrumbs: '<os-crumb-chain></os-crumb-chain>',
		Card: `<os-card ${n.includes('selected') ? 'selected' : ''} ${n.includes('compact') ? 'compact' : ''}><strong>Project notes</strong><p>Your next great idea starts here.</p><os-button>Open project</os-button></os-card>`,
		'Code blocks': ['--os-ui-code-padding', '--os-ui-code-copy-gap'].includes(n)
			? '<os-code copy>theme.accent</os-code>'
			: '<os-code block copy>const theme = {\n  name: "My workspace",\n  accent: "#ec9bff"\n};</os-code>',
		Logs: '<os-log></os-log>',
		Field: `<os-field-row layout="inline" label="Workspace name" hint="A name for your space"><os-text-field value="My workspace" ${n.includes('compact') ? 'compact' : ''}></os-text-field></os-field-row>`,
		Input:
			'<os-text-field label="Workspace name" value="My workspace"></os-text-field>',
		'Range controls':
			'<os-range-field label="Volume" min="0" max="100" value="75"></os-range-field>',
		Grids:
			'<os-grid>' +
			['Notes', 'Media', 'Pages', 'Posts', 'Team', 'Files']
				.map((v) => `<os-card><os-icon name="page"></os-icon> ${v}</os-card>`)
				.join('') +
			'</os-grid>',
		Swatches:
			'<os-swatch-grid>' +
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
					(v) =>
						`<os-swatch value="${v}" preview="${v}" label="${v}"></os-swatch>`,
				)
				.join('') +
			'</os-swatch-grid>',
		'Inline groups':
			'<os-cluster><os-button>Save changes</os-button><os-chip>Draft</os-chip><small>Updated just now</small></os-cluster>',
		Rows: '<os-row><os-button>Save changes</os-button><os-chip>Draft</os-chip><small>Updated just now</small></os-row>',
		Stacks:
			'<os-stack><strong>Project settings</strong><os-text-field value="Design notes"></os-text-field><os-button>Save changes</os-button></os-stack>',
		Panels:
			'<os-panel><strong>Project settings</strong><os-text-field value="Design notes"></os-text-field><os-button>Save changes</os-button></os-panel>',
		Repeater:
			'<os-repeater reorderable><os-text-field slot="row-home" value="Home"></os-text-field><os-text-field slot="row-about" value="About"></os-text-field></os-repeater>',
		Progress:
			'<os-progress-bar value="65" label="Uploading photos" show-percent></os-progress-bar>',
		Rating: '<os-rating-summary rating="84" total="24"></os-rating-summary>',
		Spinner: '<os-spinner></os-spinner><span>Loading your workspace…</span>',
		'Save Status': `<os-save-status phase="${n.includes('failed') ? 'failed' : n.includes('saved') ? 'saved' : n.includes('ring-color') ? 'saving' : 'idle'}" mode="pill" auto-clear-saved-ms="0" auto-clear-failed-ms="0" ${n.includes('ring-color') ? 'variant="ring"' : ''}></os-save-status>`,
		Switch: '<os-switch checked>Focus mode</os-switch>',
		Stat: '<os-stat label="Total views" value="2,480" caption="↑ 12% this week"></os-stat>',
		Display: '<os-display>2,480 views</os-display>',
		Notice: `<os-notice tone="${tone === 'danger' ? 'error' : tone}" not-dismissible>Changes saved. <a href="#">View details</a></os-notice>`,
		Toast:
			'<os-toast state="in">Your theme was saved.<small slot="description">Ready for your next idea.</small></os-toast>',
		Table: `<os-table striped sticky-header sticky-columns="1" ${n.includes('skeleton') ? 'loading loading-rows="3"' : ''}></os-table>`,
		'Segmented controls':
			'<os-segmented value="list"><os-segment value="list">List view</os-segment><os-segment value="grid">Grid view</os-segment></os-segmented>',
		Ribbons: `<os-card style="position:relative;width:260px;min-height:110px"><os-ribbon tone="${tone}" ${n.includes('banner') ? 'placement="banner"' : ''}>NEW</os-ribbon><strong>Featured project</strong><p>A new collection of ideas.</p></os-card>`,
		Empty:
			'<os-empty-state icon="format-image" heading="No files here yet" description="Drop an image to get started."></os-empty-state>',
		Avatar:
			'<os-avatar name="Jamie Davis" presence="online"></os-avatar><span>Jamie Davis<br/><small>Online</small></span>',
		Keycaps: '<os-key>⌘</os-key><os-key>K</os-key><small>Search</small>',
		'Token Field':
			'<os-token-field label="Welcome message" value="Hello {{name}}" hint="Personalize your message"></os-token-field>',
		'Tag inputs':
			'<os-tag-input open min-query="0" creatable placeholder="Find or create a tag"></os-tag-input>',
		'Category tree': '<os-category-picker open></os-category-picker>',
		Menu: '<os-menu><os-menu-item icon="page">Open file</os-menu-item><os-menu-item>Rename</os-menu-item><hr/><os-menu-item>Move to trash</os-menu-item></os-menu>',
		'Context Menu':
			'<os-context-menu open><os-context-menu-option>Open file</os-context-menu-option><os-context-menu-option>Rename</os-context-menu-option><hr/><os-context-menu-option>Move to trash</os-context-menu-option></os-context-menu>',
		Flyouts:
			'<os-flyout open><strong>Project settings</strong><p>Choose how to organize your files.</p><os-button>Save changes</os-button></os-flyout>',
		Modal:
			'<os-modal open title="Project settings"><p>Your workspace, your way.</p><os-text-field value="Design notes"></os-text-field><os-button slot="footer">Save changes</os-button></os-modal>',
		Dialog:
			'<os-confirm-dialog open title="Remove this item?" message="You can restore it from the trash." confirm-label="Remove"></os-confirm-dialog>',
		'Confirmation dialogs':
			'<os-confirm-dialog open title="Remove this item?" message="You can restore it from the trash." confirm-label="Remove"></os-confirm-dialog>',
		Scrim:
			'<os-modal open title="Project settings"><p>The overlay sits behind this dialog.</p><os-button slot="footer">Done</os-button></os-modal>',
	};
	if (t.surface === 'Window Controls' && n.startsWith('--os-ui-btn'))
		return '<os-window-button icon="minimize"></os-window-button><os-window-button icon="maximize"></os-window-button><os-window-button icon="close" danger></os-window-button>';
	return cases[t.surface] ?? null;
}

type SampleElement = HTMLElement & Record<string, unknown>;
/** Populate public data properties before elements connect; no services or requests. */
export function populateComponents(root: HTMLElement, t: SurfaceToken): void {
	const set = (selector: string, values: Record<string, unknown>) =>
		root
			.querySelectorAll<SampleElement>(selector)
			.forEach((el) => Object.assign(el, values));
	set('os-table', {
		columns: [
			{ key: 'title', label: 'Page', filter: 'text' },
			{ key: 'status', label: 'Status' },
		],
		data: [
			{ title: 'Home', status: 'Published' },
			{ title: 'About', status: 'Draft' },
			{ title: 'Contact', status: 'Draft' },
		],
	});
	set('os-log', {
		entries: [
			'10:24  Saved theme',
			'10:25  Uploaded texture.png',
			'10:26  Export ready',
		],
	});
	set('os-crumb-chain', {
		segments: [
			{ id: 'files', name: 'Files' },
			{ id: 'projects', name: 'Projects' },
			{ id: 'notes', name: 'Notes' },
		],
	});
	set('os-rating-summary', { ratings: { 5: 14, 4: 6, 3: 2, 2: 1, 1: 1 } });
	set('os-category-picker', {
		items: [
			{ id: 1, name: 'Projects', parent: 0 },
			{ id: 2, name: 'Design', parent: 1 },
			{ id: 3, name: 'Notes', parent: 1 },
		],
		value: t.name.includes('uncat') ? [] : [1, 2],
	});
	set('os-tag-input', {
		value: [{ id: 1, label: 'Design' }],
		suggestions: [
			{ id: 2, label: 'Ideas' },
			{ id: 3, label: 'Research' },
		],
	});
	set('os-token-field', {
		value: 'Hello {{name}}',
		tokens: [{ key: 'name', label: 'Name', sample: 'Jamie' }],
	});
	set('os-repeater', { keys: ['home', 'about'] });
}

const stateSheets = new WeakMap<object, CSSStyleSheet>();
/** Show pseudo-states without interaction. Original styles and geometry remain intact. */
export function prepareComponentState(
	root: HTMLElement,
	t: SurfaceToken,
): void {
	const walk = (container: ParentNode) => {
		for (const el of container.querySelectorAll<HTMLElement>('*')) {
			if (!el.localName.startsWith('os-') || !el.shadowRoot) continue;
			applyComponentOverrides(el);
			const shadow = el.shadowRoot;
			if (
				el.localName === 'os-category-picker' &&
				!shadow.querySelector('[data-preview-placement]')
			) {
				const placement = document.createElement('style');
				placement.dataset.previewPlacement = '';
				placement.textContent =
					'.os-cat__popover{position:absolute!important;inset:0 auto auto 0!important;max-height:220px;}';
				shadow.append(placement);
			}

			if (el.localName === 'os-avatar' && /glare|halo|tilt/.test(t.name))
				el.style.setProperty('--os-ui-avatar-hover', '1');

			// Inspector specimens are inert. Release document-level keyboard and
			// outside-click listeners, while retaining their rendered open state.
			// Otherwise a hidden sample popover can consume the editor's Escape.
			if (
				['os-category-picker', 'os-tag-input', 'os-flyout'].includes(
					el.localName,
				)
			) {
				(
					el as HTMLElement & { disconnectedCallback(): void }
				).disconnectedCallback();
			}

			const ctor = el.constructor as typeof HTMLElement & {
				styles?: { cssText: string }[];
			};
			if (/hover|focus|active|selected|pressed/.test(t.name)) {
				for (const sheet of ctor.styles ?? []) {
					let derived = stateSheets.get(sheet);
					if (!derived) {
						derived = new CSSStyleSheet();
						derived.replaceSync(
							sheet.cssText
								.replace(/:hover/g, '[data-studio-hover]')
								.replace(
									/:focus-visible|:focus-within|:focus(?!-)/g,
									'[data-studio-focus]',
								)
								.replace(/:active/g, '[data-studio-active]'),
						);
						stateSheets.set(sheet, derived);
					}
					if (!shadow.adoptedStyleSheets.includes(derived))
						shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, derived];
				}
				for (const node of [el, ...shadow.querySelectorAll<HTMLElement>('*')]) {
					if (nMatches(t, 'hover')) node.setAttribute('data-studio-hover', '');
					if (nMatches(t, 'focus')) node.setAttribute('data-studio-focus', '');
					if (nMatches(t, 'active|pressed'))
						node.setAttribute('data-studio-active', '');
				}
			}
			walk(shadow);
		}
	};
	walk(root);
}
const nMatches = (t: SurfaceToken, pattern: string) =>
	new RegExp(pattern).test(t.name);
