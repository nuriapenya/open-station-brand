import contract from '../data/theme-contract.json';
import type { Texture } from './manifest-fields';
import type { AssetLibrary } from './theme-assets';

export const texturePresets = [
	{
		id: 'graphite',
		name: 'Brushed graphite',
		description: 'Fine satin grain. Quiet, dark and precise.',
		light: false,
	},
	{
		id: 'linen',
		name: 'Midnight linen',
		description: 'Soft woven threads in deep indigo.',
		light: false,
	},
	{
		id: 'glass',
		name: 'Frosted glass',
		description: 'Cool etched grain with a soft blue haze.',
		light: false,
	},
	{
		id: 'paper',
		name: 'Warm paper',
		description: 'Cream fibers with a natural, tactile finish.',
		light: true,
	},
	{
		id: 'leather',
		name: 'Soft leather',
		description: 'Supple burgundy grain, warm and understated.',
		light: false,
	},
	{
		id: 'pearl',
		name: 'Pearlescent foil',
		description: 'Satin silver with lavender and teal reflections.',
		light: false,
	},
] as const;
type Preset = (typeof texturePresets)[number];
export const textureURL = (id: string) => `../assets/studio/textures/${id}.png`;
const element = <K extends keyof HTMLElementTagNameMap>(
	tag: K,
	cls = '',
	text = '',
) => {
	const el = document.createElement(tag);
	el.className = cls;
	el.textContent = text;
	return el;
};
export function presetTexture(path: string, slot: string): Texture {
	const definition = contract.textures.find((t) => t.id === slot)!;
	if (definition.type === 'border-image')
		return {
			type: 'border-image',
			path,
			slice: '128',
			width: '8px',
			repeat: 'stretch',
		};
	if (definition.sharedSize) return { type: 'image', path, size: '32px' };
	if (slot === 'TITLEBAR_FOCUSED') return { type: 'image', path };
	return {
		type: 'image',
		path,
		size: '256px 256px',
		repeat: 'repeat',
		position: 'center',
	};
}
/** A material preview only: opening or browsing never edits the user's theme. */
function windowSample(
	preset: Preset,
	slot: string,
	miniature = false,
): HTMLElement {
	const stage = element(
		'div',
		`texture-window-stage${miniature ? ' miniature' : ''}`,
	);
	stage.setAttribute('aria-hidden', 'true');
	stage.style.setProperty(
		'--chosen-material',
		`url("${textureURL(preset.id)}")`,
	);
	stage.style.setProperty(
		'--material-ink',
		preset.light ? '#302923' : '#fff8ff',
	);
	stage.innerHTML = `<div class="texture-window"><div class="texture-window-title"><span>My workspace</span><span class="texture-window-controls"><i>−</i><i>□</i><i>×</i></span></div><div class="texture-window-tabs">Appearance <span>Workspace</span></div><div class="texture-window-body"><strong>A space that feels like you.</strong><p>Small details. A different feeling.</p><div class="texture-window-panel">Your next idea starts here.</div><span class="texture-window-action">Save changes</span></div><i class="texture-ornament ne"></i><i class="texture-ornament nw"></i><i class="texture-ornament se"></i><i class="texture-ornament sw"></i></div><div class="texture-window-dock"><span>▧</span><span>▤</span><span>⚙</span></div>`;
	const selectors: Record<string, string> = {
		TITLEBAR: '.texture-window-title',
		TITLEBAR_FOCUSED: '.texture-window-title',
		TITLEBAR_BUTTON: '.texture-window-controls i',
		TITLEBAR_CONTROLS: '.texture-window-controls',
		TITLEBAR_META: '.texture-window-title > span:first-child',
		TABBAR: '.texture-window-tabs',
		DOCK: '.texture-window-dock',
		DOCK_ITEM: '.texture-window-dock span',
		ICON_TILE: '.texture-window-dock span',
		BUTTON: '.texture-window-action',
		WINDOW_BODY: '.texture-window-body',
		PANEL: '.texture-window-panel',
		WINDOW_CORNER_NE: '.texture-ornament.ne',
		WINDOW_CORNER_NW: '.texture-ornament.nw',
		WINDOW_CORNER_SE: '.texture-ornament.se',
		WINDOW_CORNER_SW: '.texture-ornament.sw',
		DESKTOP: '.texture-window-stage',
		SCRIM: '.texture-window-stage',
		TABLE_HEADER: '.texture-window-tabs',
		MENU: '.texture-window-panel',
		WIDGET: '.texture-window-panel',
		TOAST: '.texture-window-panel',
		DIALOG: '.texture-window-body',
	};
	if (contract.textures.find((t) => t.id === slot)?.type === 'border-image') {
		const frame = stage.querySelector<HTMLElement>('.texture-window')!;
		frame.classList.add('texture-frame-material');
	} else {
		const selector = selectors[slot] ?? '.texture-window-body';
		const targets = stage.matches(selector)
			? [stage]
			: [...stage.querySelectorAll<HTMLElement>(selector)];
		for (const target of targets) target.classList.add('texture-applied');
	}
	return stage;
}
export function openTextureLibrary(options: {
	slot: string;
	assets: AssetLibrary;
	apply: (texture: Texture, name: string) => void;
	upload: () => void;
}): void {
	const slotName = options.slot.replaceAll('_', ' ').toLowerCase();
	const opener = document.activeElement as HTMLElement | null;
	const dialog = element('dialog', 'texture-library');
	dialog.setAttribute('aria-labelledby', 'texture-library-title');
	const header = element('div', 'texture-library-header');
	const title = element('h2', '', 'Find your texture');
	title.id = 'texture-library-title';
	const close = element('button', 'icon-button', '×');
	close.type = 'button';
	close.setAttribute('aria-label', 'Close texture library');
	close.addEventListener('click', () => dialog.close());
	header.append(title, close);
	const intro = element(
		'p',
		'texture-library-intro',
		`Six materials, ready to use. Preview one on your ${slotName}, then apply it. You can also upload your own image.`,
	);
	const layout = element('div', 'texture-library-layout');
	const grid = element('div', 'texture-template-grid');
	grid.setAttribute('role', 'group');
	grid.setAttribute('aria-label', 'Texture templates');
	const preview = element('div', 'texture-library-preview');
	const previewName = element('h3');
	const previewNote = element('p');
	const previewImage = element('div');
	const viewControls = element('div', 'texture-preview-modes');
	const windowView = element('button', '', 'Window preview');
	windowView.type = 'button';
	const repeatView = element('button', '', 'Repeat preview');
	repeatView.type = 'button';
	viewControls.append(windowView, repeatView);
	let showRepeat = false;
	const paintPreview = (preset: Preset) => {
		windowView.setAttribute('aria-pressed', String(!showRepeat));
		repeatView.setAttribute('aria-pressed', String(showRepeat));
		if (showRepeat) {
			const repeat = element('div', 'texture-repeat-preview');
			repeat.style.backgroundImage = `url("${textureURL(preset.id)}")`;
			repeat.setAttribute('role', 'img');
			repeat.setAttribute(
				'aria-label',
				`${preset.name}, repeated in both directions`,
			);
			previewImage.replaceChildren(repeat);
		} else previewImage.replaceChildren(windowSample(preset, options.slot));
	};
	const targetNote = element(
		'small',
		'',
		`Preview on ${slotName} · text colors in this sample are for readability`,
	);
	preview.append(
		viewControls,
		previewImage,
		previewName,
		previewNote,
		targetNote,
	);
	let chosen: Preset = texturePresets[0];
	const select = (preset: Preset) => {
		chosen = preset;
		for (const button of grid.querySelectorAll<HTMLElement>(
			'[data-texture-preset]',
		))
			button.setAttribute(
				'aria-pressed',
				String(button.dataset.texturePreset === preset.id),
			);
		paintPreview(preset);
		previewName.textContent = preset.name;
		previewNote.textContent = preset.description;
	};
	for (const preset of texturePresets) {
		const button = element('button', 'texture-template');
		button.type = 'button';
		button.dataset.texturePreset = preset.id;
		button.setAttribute('aria-label', preset.name);
		button.append(
			windowSample(preset, options.slot, true),
			element('strong', '', preset.name),
			element('span', '', preset.description),
		);
		button.addEventListener('click', () => select(preset));
		grid.append(button);
	}
	windowView.addEventListener('click', () => {
		showRepeat = false;
		paintPreview(chosen);
	});
	repeatView.addEventListener('click', () => {
		showRepeat = true;
		paintPreview(chosen);
	});
	select(chosen);
	layout.append(grid, preview);
	const status = element('p', 'field-error');
	status.setAttribute('role', 'alert');
	const footer = element('div', 'texture-library-footer');
	const upload = element('button', 'quiet-button', 'Upload my own image');
	upload.type = 'button';
	upload.addEventListener('click', () => {
		dialog.close();
		options.upload();
	});
	const cancel = element('button', 'quiet-button', 'Cancel');
	cancel.type = 'button';
	cancel.addEventListener('click', () => dialog.close());
	const apply = element('button', 'upload-button', `Apply to ${slotName}`);
	apply.type = 'button';
	const controller = new AbortController();
	apply.addEventListener('click', async () => {
		apply.disabled = true;
		status.textContent = '';
		const preset = chosen;
		apply.textContent = 'Adding texture…';
		try {
			const response = await fetch(textureURL(preset.id), {
				signal: controller.signal,
			});
			if (!response.ok)
				throw new Error('This texture could not be loaded. Please try again.');
			const file = new File([await response.blob()], `${preset.id}.png`, {
				type: 'image/png',
			});
			const path = await options.assets.add(file, 'textures');
			if (!dialog.open) return;
			options.apply(presetTexture(path, options.slot), preset.name);
			dialog.close();
		} catch (error) {
			if (dialog.open)
				status.textContent =
					error instanceof Error ? error.message : String(error);
		} finally {
			apply.disabled = false;
			apply.textContent = `Apply to ${slotName}`;
		}
	});
	footer.append(upload, cancel, apply);
	dialog.append(header, intro, layout, status, footer);
	dialog.addEventListener(
		'close',
		() => {
			controller.abort();
			dialog.remove();
			if (opener?.isConnected && opener !== document.body) opener.focus();
			else
				document
					.querySelector<HTMLButtonElement>('[data-texture-library]')
					?.focus();
		},
		{ once: true },
	);
	document.body.append(dialog);
	dialog.showModal();
}
