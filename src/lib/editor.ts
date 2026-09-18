import { colorButton, resolveColor, type ColorButton } from './color-picker';
import { helpFor } from './token-help';
import contract from '../data/theme-contract.json';
import { prepareStationFrame, stationOverrides } from './station-preview';
import { previewArtwork } from './preview-artwork';
import { tokenBinding } from './surfaces';
import catalog from '../data/alcazaba-tokens.json';
import { visualControls } from './visual-controls';
import {
	AssetLibrary,
	importArchive,
	packageTheme,
	loadProject,
	saveProject,
} from './theme-assets';
import { referencedAssets } from './manifest-fields';
import { Customization } from './customization';
import { SurfaceAtlas } from './surface-preview';
import { surfaces, surfaceForToken } from './surfaces';
import { emptyTheme, History, parseTheme, slugify, valueError } from './theme';
import type { Theme, Token } from './theme';

/**
 * The first sentence of a token explanation.
 *
 * Card descriptions carry the one line that says what the property does;
 * the rest of the copy (states, ranges, inherited behaviour) stays in the
 * ? help dialog, which still shows the full text. Splitting on a full stop
 * that is followed by a capital keeps decimals like `1.5rem` intact.
 */
function firstSentence(text: string): string {
	const trimmed = text.trim();
	const match = /^[\s\S]*?[.!?](?=\s+[A-Z"'(\u2018\u201c]|$)/.exec(trimmed);
	return match ? match[0] : trimmed;
}

async function startStudio(): Promise<void> {
	const assets = new AssetLibrary();
	const $ = <T extends HTMLElement>(selector: string): T => {
		const element = document.querySelector<T>(selector);
		if (!element) throw new Error(`Missing editor element: ${selector}`);
		return element;
	};
	const storageKey = 'openstation-theme-studio:v1';
	const tokenMap = new Map<string, Token>(
		catalog.tokens.map((t) => [t.name, t]),
	);
	const essentials = [
		'--os-ui-accent',
		'--os-ui-accent-dim',
		'--os-bg',
		'--os-window-bg',
		'--os-ui-fg',
		'--os-ui-fg-muted',
		'--os-titlebar-bg-focused',
		'--os-window-radius',
		'--os-dock-bg',
		'--os-ui-font',
	];
	const labels: Record<string, string> = {
		'--os-ui-accent': 'Accent',
		'--os-ui-accent-dim': 'Ambient accent',
		'--os-bg': 'Desktop background',
		'--os-window-bg': 'Window surface',
		'--os-ui-fg': 'Primary text',
		'--os-ui-fg-muted': 'Secondary text',
		'--os-titlebar-bg-focused': 'Active title bar',
		'--os-window-radius': 'Window corners',
		'--os-dock-bg': 'Dock surface',
		'--os-ui-font': 'Interface typeface',
	};
	const title = (t: Token) =>
		helpFor(t.name)?.title ||
		labels[t.name] ||
		t.name
			.replace(/^--os-(?:ui-)?/, '')
			.replace(/-/g, ' ')
			.replace(/\bfg\b/g, 'text')
			.replace(/\bbg\b/g, 'background')
			.replace(/^./, (s) => s.toUpperCase());
	let toastTimer: ReturnType<typeof setTimeout>;
	function notify(message: string): void {
		const toast = $('#toast');
		toast.textContent = message;
		toast.hidden = false;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toast.hidden = true;
		}, 6500);
	}
	let initial = emptyTheme();
	try {
		const saved = localStorage.getItem(storageKey);
		if (saved) initial = parseTheme(JSON.parse(saved));
	} catch {
		notify('Your saved draft could not be read. A fresh theme is ready.');
	}
	try {
		const saved = await loadProject();
		if (saved) {
			initial = parseTheme(saved.theme);
			assets.files = saved.assets;
		}
	} catch {
		notify(
			'Asset storage is unavailable. Export a ZIP to keep uploaded files.',
		);
	}
	for (const name of Object.keys(initial.tokens))
		if (!tokenMap.has(name))
			tokenMap.set(name, {
				name,
				default: '',
				legacy: '',
				group: 'Imported tokens',
				kind: 'value',
				property: '',
				sources: [],
			});
	const history = new History(initial);
	const list = $('#token-list');
	const preview = $('#preview');
	const search = $<HTMLInputElement>('#token-search');
	const group = $<HTMLSelectElement>('#token-group');
	const modified = $<HTMLInputElement>('#modified-only');
	let selected = '--os-ui-accent';
	let comparing = false;
	let limit = 40;
	let renderTimer: ReturnType<typeof setTimeout>;
	let draftTimer: ReturnType<typeof setTimeout>;
	let pendingTheme: Theme | null = null;

	for (const category of [
		...new Set([...tokenMap.values()].map((t) => t.group)),
	].sort())
		group.add(new Option(category, category));
	group.add(new Option(`All ${catalog.tokens.length} tokens`, 'All'));
	for (const surface of surfaces)
		group.add(new Option('Surface · ' + surface, 'surface:' + surface));
	const liveTheme = (): Theme => pendingTheme || history.current;
	const value = (name: string): string =>
		(!comparing ? liveTheme().tokens[name] : undefined) ??
		tokenMap.get(name)?.default ??
		'';
	// Constructed for its side effect: it builds the all-surfaces gallery.
	new SurfaceAtlas($('#surface-atlas'), selectSurface, (name) => {
		customization.open('tokens');
		selectToken(name, true);
	});
	const customization = new Customization({
		theme: liveTheme,
		comparing: () => comparing,
		assets,
		commit,
		notify,
		scene: showScene,
		token: (name) => selectToken(name, true),
	});
	function selectSurface(surface: string): void {
		customization.open('tokens');
		group.value = 'surface:' + surface;
		search.value = '';
		modified.checked = false;
		limit = 40;
		renderList();
	}
	function showScene(scene: string): void {
		for (const tab of document.querySelectorAll<HTMLElement>('[data-scene]'))
			tab.setAttribute('aria-pressed', String(tab.dataset.scene === scene));
		for (const [id, name] of [
			['mock-desktop', 'desktop'],
			['component-board', 'components'],
			['surface-atlas', 'atlas'],
			['asset-scene', 'assets'],
		])
			$('#' + id).hidden = scene !== name;
		document.body.dataset.scene = scene;
	}
	function paint(): void {
		stationOverrides(comparing ? {} : liveTheme().tokens);
		for (const token of tokenMap.values()) {
			const v = value(token.name);
			const paintValue = v;
			preview.style.setProperty(token.name, paintValue);
		}
		for (const [name, v] of Object.entries(liveTheme().tokens))
			if (!tokenMap.has(name) && !comparing) preview.style.setProperty(name, v);
		$('#override-count').textContent =
			`${Object.keys(liveTheme().tokens).length} / 512 overrides`;
		for (const frame of preview.querySelectorAll<HTMLElement>(
			'.desktop-component',
		))
			prepareStationFrame(frame);
		for (const frame of document.querySelectorAll<HTMLElement>(
			'.real-component',
		)) {
			prepareStationFrame(frame);
			const stage = frame.closest<HTMLElement>('[data-demo-token]')!;
			const token = tokenBinding(stage.dataset.demoToken!);
			if (token) previewArtwork(stage, frame, token);
		}
		customization.updatePreview(comparing);
	}

	let saveQueue = Promise.resolve();
	function persist(): void {
		const project = {
			theme: structuredClone(liveTheme()),
			assets: { ...assets.files },
		};
		$('#save-state').textContent = 'Saving…';
		try {
			localStorage.setItem(storageKey, JSON.stringify(project.theme));
		} catch {
			/* IndexedDB retains the complete project. */
		}
		saveQueue = saveQueue
			.catch(() => {})
			.then(() => saveProject(project))
			.then(() => {
				$('#save-state').textContent = 'Saved locally';
			})
			.catch(() => {
				$('#save-state').textContent = 'Not saved';
				notify(
					'Local storage is unavailable. Export a ZIP to keep your theme and files.',
				);
			});
	}

	function updateChrome(): void {
		$<HTMLButtonElement>('#undo').disabled =
			!history.past.length && !pendingTheme;
		$<HTMLButtonElement>('#redo').disabled = !history.future.length;
		$<HTMLInputElement>('#theme-name').value = liveTheme().name;
		for (const button of document.querySelectorAll<HTMLButtonElement>(
			'[data-preset]',
		)) {
			const active =
				JSON.stringify(liveTheme().tokens) ===
				JSON.stringify(presetTokens(button.dataset.preset!));
			button.classList.toggle('active', active);
			button.setAttribute('aria-pressed', String(active));
		}
	}
	function flush(): void {
		clearTimeout(draftTimer);
		if (pendingTheme) {
			history.commit(pendingTheme);
			pendingTheme = null;
			updateChrome();
			persist();
		}
	}
	function commit(next: Theme): void {
		flush();
		history.commit(next);
		paint();
		updateChrome();
		persist();
		renderList();
	}
	function editToken(name: string, nextValue: string): string | null {
		const problem = valueError(nextValue);
		if (problem) return problem;
		const token = tokenMap.get(name);
		if (
			token?.kind === 'color' &&
			!CSS.supports('color', nextValue) &&
			!CSS.supports('background', nextValue) &&
			!CSS.supports('border', nextValue)
		)
			return 'Use a valid color, such as #ec9bff or rgba(236, 155, 255, 0.5).';
		if (
			token?.kind === 'gradient' &&
			!CSS.supports('background-image', nextValue)
		)
			return 'Use a valid gradient or none.';
		const next = structuredClone(liveTheme());
		if (
			!Object.hasOwn(next.tokens, name) &&
			Object.keys(next.tokens).length >= 512
		)
			return 'This theme has 512 overrides. Reset one before adding another.';
		next.tokens[name] = nextValue.trim();
		pendingTheme = next;
		paint();
		persist();
		updateChrome();
		clearTimeout(draftTimer);
		draftTimer = setTimeout(flush, 450);
		return null;
	}
	function selectToken(name: string, navigate = false): void {
		selected = name;
		if (navigate) {
			group.value = 'All';
			search.value = name;
			modified.checked = false;
			limit = 40;
			renderList();
		}
		for (const el of list.querySelectorAll<HTMLElement>('.token-row'))
			el.classList.toggle('selected', el.dataset.token === name);
	}
	function renderList(): void {
		clearTimeout(renderTimer);
		const query = search.value.trim().toLowerCase();
		const all = [...tokenMap.values()];
		let matches = all.filter(
			(t) =>
				(query ||
					group.value === 'All' ||
					(group.value === 'Essentials'
						? essentials.includes(t.name)
						: group.value.startsWith('surface:')
							? surfaceForToken(t.name) === group.value.slice(8)
							: t.group === group.value)) &&
				(!modified.checked || Object.hasOwn(liveTheme().tokens, t.name)) &&
				(!query ||
					`${t.name} ${title(t)} ${t.group} ${helpFor(t.name)?.surface ?? ''} ${helpFor(t.name)?.description ?? ''} ${helpFor(t.name)?.state ?? ''}`
						.toLowerCase()
						.includes(query)),
		);
		if (group.value === 'Essentials' && !query)
			matches.sort(
				(a, b) => essentials.indexOf(a.name) - essentials.indexOf(b.name),
			);
		$('#token-count').textContent =
			`${matches.length} ${matches.length === 1 ? 'token' : 'tokens'}${query ? ' found' : ''}`;
		list.replaceChildren();
		if (!matches.length) {
			const empty = document.createElement('div');
			empty.className = 'empty-results';
			empty.textContent = modified.checked
				? 'No edited tokens in this view.'
				: 'No matching tokens. Try “dock”, “radius”, or “text”.';
			const clear = document.createElement('button');
			clear.textContent = 'Show all tokens';
			clear.addEventListener('click', () => {
				search.value = '';
				group.value = 'All';
				modified.checked = false;
				renderList();
			});
			empty.append(document.createElement('br'), clear);
			list.append(empty);
			return;
		}
		for (const t of matches.slice(0, limit)) {
			const row = document.createElement('div');
			row.className = 'token-row';
			row.classList.toggle('selected', selected === t.name);
			row.dataset.token = t.name;
			const label = document.createElement('div');
			label.className = 'token-label';
			const choose = document.createElement('button');
			choose.textContent = title(t);
			choose.addEventListener('click', () => selectToken(t.name));
			const reset = document.createElement('button');
			reset.className = 'token-reset';
			reset.textContent = '↺';
			reset.title = 'Reset to default';
			reset.setAttribute('aria-label', `Reset ${title(t)}`);
			reset.disabled = !Object.hasOwn(liveTheme().tokens, t.name);
			reset.addEventListener('click', () => {
				const next = structuredClone(liveTheme());
				delete next.tokens[t.name];
				commit(next);
			});
			const helpButton = document.createElement('button');
			helpButton.className = 'token-help-button';
			helpButton.type = 'button';
			helpButton.textContent = '?';
			helpButton.setAttribute('aria-label', 'About ' + title(t));
			helpButton.title = 'What does this change?';
			helpButton.addEventListener('click', () => showTokenHelp(t.name));
			label.append(choose, helpButton, reset);
			const edit = document.createElement('div');
			edit.className = 'token-edit';
			const input = document.createElement('input');
			input.type = 'text';
			input.value = liveTheme().tokens[t.name] ?? t.default;
			input.id = `field-${t.name}`;
			input.setAttribute('aria-label', title(t));
			input.spellcheck = false;
			const error = document.createElement('p');
			error.className = 'field-error';
			error.id = `error-${t.name}`;
			error.setAttribute('role', 'status');
			input.setAttribute('aria-describedby', error.id);
			let swatch: ColorButton | undefined;
			const apply = (v: string) => {
				const issue = editToken(t.name, v);
				error.textContent = issue || '';
				input.setAttribute('aria-invalid', String(!!issue));
				if (!issue) {
					reset.disabled = false;
					selectToken(t.name);
					swatch?.refreshColor();
				}
			};
			if (
				t.kind === 'color' ||
				([
					'color',
					'background',
					'background-color',
					'border-color',
					'fill',
					'stroke',
					'box-shadow',
				].includes(helpFor(t.name)?.property ?? '') &&
					resolveColor(value(t.name), preview))
			) {
				swatch = colorButton({
					label: `Pick ${title(t)} color`,
					getValue: () => input.value,
					scope: preview,
					onChange: (v) => {
						input.value = v;
						apply(v);
					},
					onCommit: flush,
				});
				edit.append(swatch);
			} else {
				const symbol = document.createElement('span');
				symbol.className = 'token-symbol';
				symbol.textContent =
					t.kind === 'font'
						? 'Aa'
						: t.kind === 'number'
							? '↔'
							: t.kind === 'shadow'
								? '◫'
								: '◈';
				edit.append(symbol);
			}
			input.addEventListener('focus', () => selectToken(t.name));
			input.addEventListener('input', () => apply(input.value));
			input.addEventListener('change', flush);
			edit.append(input);
			const textureSlot = [...contract.textures]
				.sort((a, b) => b.property.length - a.property.length)
				.find((slot) => t.name.startsWith(slot.property));
			if (textureSlot) {
				const chooseTexture = document.createElement('button');
				chooseTexture.type = 'button';
				chooseTexture.className = 'token-texture-button';
				chooseTexture.textContent = 'Choose or upload texture';
				chooseTexture.setAttribute(
					'aria-label',
					`Choose texture for ${title(t)}`,
				);
				chooseTexture.addEventListener('click', () =>
					customization.chooseTexture(textureSlot.id),
				);
				row.append(chooseTexture);
			}
			const code = document.createElement('code');
			code.className = 'token-name';
			code.textContent = t.name;
			code.title = `${t.name}\nReference: ${t.default}`;
			const description = document.createElement('p');
			description.className = 'token-description';
			description.textContent = firstSentence(
				helpFor(t.name)?.description ??
					'Imported custom token; its consuming component defines the effect.',
			);
			row.prepend(label, description, edit, code, error);
			const visual = visualControls(
				t,
				input.value,
				(v) => {
					input.value = v;
					apply(v);
				},
				preview,
				() => input.value,
			);
			if (visual) {
				const details = document.createElement('details');
				details.className = 'visual-details';
				const summary = document.createElement('summary');
				summary.textContent =
					t.kind === 'font'
						? 'Choose typeface'
						: t.kind === 'gradient'
							? 'Gradient controls'
							: t.kind === 'shadow'
								? 'Shape the shadow'
								: 'Quick palette';
				details.append(summary, visual);
				row.append(details);
			}

			const numeric = input.value.match(/^(-?[\d.]+)(px|rem|em|ms|s|%)?$/);
			if (numeric && t.kind === 'number') {
				const slider = document.createElement('input');
				slider.type = 'range';
				slider.className = 'token-range';
				const n = Number(numeric[1]);
				const unit = numeric[2] || '';
				slider.min = String(n < 0 ? Math.min(-100, n * 2) : 0);
				slider.max = String(
					unit === '%'
						? 100
						: unit === 'rem' || unit === 'em'
							? Math.max(5, n * 2)
							: unit === 's'
								? 10
								: Math.max(64, n * 2),
				);
				slider.step =
					unit === 'rem' || unit === 'em' || unit === 's' || n < 1
						? '0.05'
						: '1';
				slider.value = String(n);
				slider.setAttribute('aria-label', `Adjust ${title(t)}`);
				slider.addEventListener('input', () => {
					input.value = slider.value + unit;
					apply(input.value);
				});
				slider.addEventListener('change', flush);
				row.append(slider);
			}
			list.append(row);
		}
		if (matches.length > limit) {
			const more = document.createElement('button');
			more.className = 'load-more';
			more.textContent = `Show ${Math.min(40, matches.length - limit)} more`;
			more.addEventListener('click', () => {
				const top = list.scrollTop;
				limit += 40;
				renderList();
				list.scrollTop = top;
			});
			list.append(more);
		}
	}
	function presetTokens(id: string): Record<string, string> {
		if (id === 'light')
			return Object.fromEntries(
				catalog.tokens
					.filter((t) => t.legacy && !valueError(t.legacy))
					.map((t) => [t.name, t.legacy]),
			);
		if (id === 'ocean')
			return {
				'--os-ui-accent': '#78dfd4',
				'--os-ui-accent-dim': '#59b9b0',
				'--os-bg': 'linear-gradient(160deg, #06141c 0%, #122f40 100%)',
				'--os-window-bg': '#10232f',
				'--os-titlebar-bg-focused': '#152e3e',
				'--os-ui-surface': '#10232f',
				'--os-ui-surface-elevated': '#193747',
				'--os-dock-bg': 'rgba(8, 27, 39, 0.88)',
				'--os-ui-fg': '#e2f4f4',
				'--os-ui-fg-muted': '#99b7c1',
				'--os-ui-table-bg': '#10232f',
				'--os-ui-table-header-bg': '#193747',
			};
		return {};
	}
	for (const b of document.querySelectorAll<HTMLButtonElement>('[data-preset]'))
		b.addEventListener('click', () => {
			const next = structuredClone(liveTheme());
			next.tokens = presetTokens(b.dataset.preset!);
			commit(next);
			notify('Mood applied. Undo brings your previous edits back.');
		});
	search.addEventListener('input', () => {
		limit = 40;
		clearTimeout(renderTimer);
		renderTimer = setTimeout(renderList, 100);
	});
	group.addEventListener('change', () => {
		limit = 40;
		search.value = '';
		renderList();
	});
	modified.addEventListener('change', () => {
		limit = 40;
		renderList();
	});
	const resetDialog = $<HTMLDialogElement>('#reset-dialog');
	let resetScope: 'theme' | 'tokens' = 'theme';
	let resetOpener: HTMLElement | null = null;
	function confirmReset(scope: 'theme' | 'tokens'): void {
		resetScope = scope;
		resetOpener = document.activeElement as HTMLElement;
		$('#reset-title').textContent =
			scope === 'theme' ? 'Reset this theme?' : 'Reset all token edits?';
		$('#reset-description').textContent =
			scope === 'theme'
				? 'Start a fresh, untitled theme. This clears your token edits, textures, icons, fonts, wallpapers and layout settings.'
				: 'Return every edited property to its Station default. Your theme name, textures, icons, fonts, wallpapers and layout settings will stay as they are.';
		$('#reset-scope').textContent =
			scope === 'theme'
				? 'Original appearance · New untitled theme'
				: 'Original property values · All token edits';
		$('#reset-confirm').textContent =
			scope === 'theme' ? 'Reset theme' : 'Reset token edits';
		resetDialog.showModal();
		$('#reset-cancel').focus();
	}
	$('#reset-theme').addEventListener('click', () => confirmReset('theme'));
	$('#reset-all').addEventListener('click', () => confirmReset('tokens'));
	resetDialog.addEventListener('close', () => resetOpener?.focus());
	$('#reset-confirm').addEventListener('click', () => {
		const next =
			resetScope === 'theme' ? emptyTheme() : structuredClone(liveTheme());
		next.tokens = {};
		comparing = false;
		$('#compare').setAttribute('aria-pressed', 'false');
		$('#compare').querySelector('span')!.textContent = 'Compare original';
		commit(next);
		customization.render();
		resetDialog.close();
		notify(
			resetScope === 'theme'
				? 'Theme reset to Station. Undo brings your theme back.'
				: 'Token edits reset. You can undo this.',
		);
	});
	$<HTMLInputElement>('#theme-name').addEventListener('change', (e) => {
		const name =
			(e.target as HTMLInputElement).value.trim() || 'Untitled theme';
		const next = structuredClone(liveTheme());
		next.name = name;
		if (next.id.startsWith('my-studio/'))
			next.id = `my-studio/${slugify(name)}`;
		commit(next);
	});
	function moveHistory(direction: 'undo' | 'redo'): void {
		flush();
		history[direction]();
		paint();
		updateChrome();
		persist();
		renderList();
		customization.render();
	}
	$('#undo').addEventListener('click', () => moveHistory('undo'));
	$('#redo').addEventListener('click', () => moveHistory('redo'));
	document.addEventListener('keydown', (e) => {
		if (document.querySelector('dialog[open]')) return;
		const editing = (e.target as HTMLElement).matches(
			'input,textarea,select,[contenteditable]',
		);
		if (e.key === '/' && !editing && !document.querySelector('dialog[open]')) {
			e.preventDefault();
			search.focus();
		}
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !editing) {
			e.preventDefault();
			moveHistory(e.shiftKey ? 'redo' : 'undo');
		}
	});
	for (const b of document.querySelectorAll<HTMLButtonElement>('[data-scene]'))
		b.addEventListener('click', () => {
			if (b.dataset.scene === 'atlas') customization.open('tokens');
			showScene(b.dataset.scene!);
		});
	for (const b of preview.querySelectorAll<HTMLElement>('[data-pick]'))
		b.addEventListener('click', () => {
			selectSurface(surfaceForToken(b.dataset.pick!));
			selectToken(b.dataset.pick!);
		});
	for (const b of preview.querySelectorAll<HTMLButtonElement>('[role=switch]'))
		b.addEventListener('click', () =>
			b.setAttribute(
				'aria-checked',
				String(b.getAttribute('aria-checked') !== 'true'),
			),
		);
	$('#compare').addEventListener('click', () => {
		comparing = !comparing;
		$('#compare').setAttribute('aria-pressed', String(comparing));
		$('#compare').querySelector('span')!.textContent = comparing
			? 'Viewing original'
			: 'Compare original';
		paint();
	});
	$('#preview-focus').addEventListener('click', () => {
		const unfocused = preview.dataset.unfocused !== 'true';
		preview.dataset.unfocused = String(unfocused);
		$('#preview-focus').setAttribute('aria-pressed', String(!unfocused));
		$('#preview-focus').querySelector('span')!.textContent = unfocused
			? 'Unfocused'
			: 'Focused';
		customization.updatePreview(comparing);
	});
	$('#import-button').addEventListener('click', () =>
		$<HTMLInputElement>('#import-file').click(),
	);
	$<HTMLInputElement>('#import-file').addEventListener('change', async (e) => {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			if (file.size > 32 * 1024 * 1024)
				throw new Error('Choose a theme file smaller than 32 MB.');
			let theme: Theme;
			if (/\.zip$/i.test(file.name)) {
				const imported = importArchive(
					new Uint8Array(await file.arrayBuffer()),
				);
				theme = assets.merge(imported.theme, imported.assets);
			} else {
				if (file.size > 1024 * 1024)
					throw new Error('Choose a theme.json smaller than 1 MB.');
				theme = parseTheme(JSON.parse(await file.text()));
			}
			for (const name of Object.keys(theme.tokens))
				if (!tokenMap.has(name))
					tokenMap.set(name, {
						name,
						default: '',
						legacy: '',
						group: 'Imported tokens',
						kind: 'value',
						property: '',
						sources: [],
					});
			if (
				![...group.options].some((o) => o.value === 'Imported tokens') &&
				[...tokenMap.values()].some((t) => t.group === 'Imported tokens')
			)
				group.add(new Option('Imported tokens', 'Imported tokens'));
			commit(theme);
			customization.render();
			const missing = referencedAssets(theme).filter((p) => !assets.files[p]);
			if (missing.length) {
				input.value = '';
				customization.open('assets');
				notify(
					`Manifest imported. Add ${missing.length} missing asset files in Assets before ZIP export.`,
				);
				return;
			}
			notify(
				`Imported “${theme.name}”. Your previous theme is available with Undo.`,
			);
		} catch (error) {
			notify(
				error instanceof Error
					? error.message
					: 'This file could not be imported.',
			);
		}
		input.value = '';
	});
	function download(blob: Blob, name: string): void {
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = name;
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
	$('#export-button').addEventListener('click', () => {
		flush();
		const t = liveTheme();
		for (const key of [
			'name',
			'id',
			'version',
			'author',
			'description',
		] as const)
			$<HTMLInputElement>(`#export-${key}`).value = t[key];
		$('#export-error').textContent = '';
		$('#export-summary').textContent =
			`${Object.keys(t.tokens).length} edited tokens · ${referencedAssets(t).length} bundled assets · manifest v2. Install the ZIP in OpenStation Preferences → Themes.`;
		$<HTMLDialogElement>('#export-dialog').showModal();
	});
	$<HTMLFormElement>('#export-form').addEventListener('submit', (e) => {
		e.preventDefault();
		try {
			const next = structuredClone(liveTheme());
			for (const key of [
				'name',
				'id',
				'version',
				'author',
				'description',
			] as const)
				next[key] = $<HTMLInputElement>(`#export-${key}`).value.trim();
			const checked = parseTheme(next);
			commit(checked);
			const json = JSON.stringify(checked, null, 2) + '\n';
			const format = (e.submitter as HTMLButtonElement)?.value;
			if (format === 'zip') {
				const bytes = packageTheme(checked, assets.files);
				download(
					new Blob([new Uint8Array(bytes)], { type: 'application/zip' }),
					`${slugify(checked.name)}.zip`,
				);
			} else
				download(new Blob([json], { type: 'application/json' }), 'theme.json');
			$<HTMLDialogElement>('#export-dialog').close();
			notify('Theme exported. Your local draft is still here.');
		} catch (error) {
			$('#export-error').textContent =
				error instanceof Error
					? error.message
					: 'Export failed. Please check your values.';
		}
	});
	function showTokenHelp(name: string): void {
		const help = helpFor(name);
		const token = tokenMap.get(name);
		if (!token) return;
		$('#help-title').textContent = title(token);
		$('#help-token').textContent = name;
		$('#help-description').textContent =
			help?.description ??
			'This imported property is not in the checked-in snapshot. Its consuming component defines the effect.';
		$('#help-state').textContent = help?.state ?? '';
		$('#help-input').textContent =
			help?.inputHint ??
			'Use the direct CSS value expected by its consuming component.';
		$('#help-default').textContent =
			(token.default || 'No default in this snapshot') +
			(token.defaultSource
				? ` · ${token.defaultSource.kind === 'legacy' ? 'Legacy reference' : 'Station base'} (${token.defaultSource.selector})`
				: '');
		$('#help-inherits').textContent = help?.defaultDependencies.length
			? 'Default follows: ' + help.defaultDependencies.join(', ')
			: 'The reference default is a direct value.';
		$('#help-evidence').textContent = [
			...(token.defaultSource
				? [
						`Default: ${token.defaultSource.file} · ${token.defaultSource.selector} · ${token.defaultSource.kind}`,
					]
				: []),
			help?.evidence
				.map(
					(e) =>
						`${e.path}:${e.line} · ${e.property === 'definition' ? 'token definition' : e.property}`,
				)
				.join('\n') ??
				'No source reference is available for this imported token.',
		].join('\n');
		$<HTMLDialogElement>('#token-help-dialog').showModal();
	}
	for (const b of document.querySelectorAll<HTMLButtonElement>('[data-close]'))
		b.addEventListener('click', () => b.closest('dialog')?.close());
	$('#about-tokens').addEventListener('click', () => {
		$('#reference-summary').textContent =
			`${catalog.tokens.length} tokens, captured ${catalog.captured}. All can be searched and edited.`;
		$('#token-source').textContent =
			`${tokenMap.get(selected)?.sources.join('\n') || ''}\nSnapshot: ${catalog.commit}`;
		$<HTMLDialogElement>('#reference-dialog').showModal();
	});
	window.addEventListener('pagehide', flush);
	paint();
	updateChrome();
	renderList();

	// Fit the complete desktop into shorter laptop previews. Mobile has its own
	// compact scene; property controls stay at their normal readable scale.
	const desktopScene = $('#mock-desktop');
	new ResizeObserver(() => {
		const scale =
			window.innerWidth > 700 ? Math.min(1, preview.clientHeight / 580) : 1;
		desktopScene.style.setProperty('--scene-scale', String(scale));
	}).observe(preview);
}
void startStudio().catch((error) => {
	const toast = document.querySelector<HTMLElement>('#toast');
	if (toast) {
		toast.hidden = false;
		toast.textContent = 'The studio could not start: ' + String(error);
	}
});
