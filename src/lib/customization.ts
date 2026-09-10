import { colorButton } from './color-picker';
import { openTextureLibrary } from './texture-library';
import { materialContext } from './material-preview';
import dashicons from '../data/dashicons.json';
import { replayReveal } from './reveal-preview';
import contract from '../data/theme-contract.json';
import type { Theme } from './theme';
import { parseTheme, slugify } from './theme';
import { referencedAssets } from './manifest-fields';
import type { Texture, Wallpaper, FontFaceDescriptor } from './manifest-fields';
import type { AssetLibrary } from './theme-assets';
import { applyThemeMedia } from './media-preview';
export interface StudioAPI {
	theme: () => Theme;
	assets: AssetLibrary;
	commit: (theme: Theme) => void;
	notify: (message: string) => void;
	scene: (scene: string) => void;
	token: (name: string) => void;
	comparing: () => boolean;
}
const element = <K extends keyof HTMLElementTagNameMap>(
	tag: K,
	cls = '',
	text = '',
): HTMLElementTagNameMap[K] => {
	const e = document.createElement(tag);
	e.className = cls;
	if (text) e.textContent = text;
	return e;
};
const names = (v: string) =>
	v
		.replace(/^WINDOW_CONTROL_/, '')
		.replaceAll('_', ' ')
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());
export class Customization {
	mode = 'tokens';
	selectedTexture = 'TITLEBAR';
	selectedIcon = 'OS_SETTINGS';
	selectedWallpaper = 0;
	selectedFont = 0;
	private host: HTMLElement;
	private preview: HTMLElement;
	private error: HTMLElement;
	private canvas: HTMLElement;
	private textureDrafts = new Map<string, Texture>();
	constructor(private api: StudioAPI) {
		this.host = document.querySelector('#custom-controls')!;
		this.preview = document.querySelector('#preview')!;
		this.canvas = document.querySelector('#asset-scene')!;
		this.error = element('p', 'field-error');
		this.error.setAttribute('role', 'alert');
		for (const button of document.querySelectorAll<HTMLButtonElement>(
			'[data-editor-mode]',
		))
			button.addEventListener('click', () =>
				this.open(button.dataset.editorMode!),
			);
	}
	open(mode: string): void {
		this.mode = mode;
		document.body.dataset.editorMode = mode;
		for (const b of document.querySelectorAll('[data-editor-mode]'))
			b.setAttribute(
				'aria-pressed',
				String((b as HTMLElement).dataset.editorMode === mode),
			);
		this.host.hidden = mode === 'tokens';
		for (const node of document.querySelectorAll<HTMLElement>(
			'.token-navigation,#token-list',
		))
			node.hidden = mode !== 'tokens';
		this.render();
		if (mode !== 'tokens') this.api.scene('assets');
		else if (!this.canvas.hidden) this.api.scene('desktop');
	}
	inspectTexture(slot: string): void {
		this.selectedTexture = slot;
		this.open('textures');
	}
	chooseTexture(slot = this.selectedTexture): void {
		this.inspectTexture(slot);
		openTextureLibrary({
			slot,
			assets: this.api.assets,
			apply: (texture, name) => {
				const next = structuredClone(this.api.theme());
				next.textures ??= {};
				next.textures[slot] = texture;
				this.api.commit(parseTheme(next));
				this.render();
				this.api.notify(`${name} applied to ${names(slot)}.`);
			},
			upload: () =>
				this.host
					.querySelector<HTMLInputElement>('input[aria-label="Upload texture"]')
					?.click(),
		});
	}

	render(): void {
		if (this.mode === 'tokens') return;
		this.host.replaceChildren();
		this.error.textContent = '';
		const heading = element('div', 'custom-heading');
		const title = {
			textures: 'Materials & textures',
			icons: 'Icons, your way',
			fonts: 'Your type collection',
			wallpapers: 'A different horizon',
			layout: 'Arrange the workspace',
			assets: 'Theme assets',
		}[this.mode];
		heading.append(
			element('h2', '', title ?? 'Customize'),
			element(
				'p',
				'',
				this.mode === 'textures'
					? 'Choose a surface, then pick a ready-made texture or upload an image. No theme ZIP needed.'
					: this.mode === 'icons'
						? 'Select a slot to replace its glyph or artwork.'
						: this.mode === 'fonts'
							? 'Bundle a typeface and use it across your theme.'
							: this.mode === 'wallpapers'
								? 'Offer wallpapers for people to choose from.'
								: this.mode === 'layout'
									? 'A starting arrangement, applied once on activation.'
									: 'Preview artwork, license files, and missing references.',
			),
		);
		this.host.append(heading, this.error);
		if (this.mode === 'textures') this.textureEditor();
		if (this.mode === 'icons') this.iconEditor();
		if (this.mode === 'fonts') this.fontEditor();
		if (this.mode === 'wallpapers') this.wallpaperEditor();
		if (this.mode === 'layout') this.layoutEditor();
		if (this.mode === 'assets') this.assetEditor();
		this.renderCanvas();
		this.updatePreview();
	}
	private change(mutator: (theme: Theme) => void, rerender = false): void {
		try {
			const next = structuredClone(this.api.theme());
			mutator(next);
			const clean = parseTheme(next);
			this.error.textContent = '';
			this.api.commit(clean);
			if (rerender) this.render();
			else this.updatePreview();
		} catch (e) {
			this.error.textContent = e instanceof Error ? e.message : String(e);
		}
	}
	private button(
		label: string,
		fn: () => void,
		cls = 'quiet-button',
	): HTMLButtonElement {
		const b = element('button', cls, label);
		b.type = 'button';
		b.addEventListener('click', fn);
		return b;
	}
	private field(
		parent: HTMLElement,
		label: string,
		value: string,
		fn: (v: string) => void,
		options?: string[],
		placeholder = '',
	): HTMLInputElement | HTMLSelectElement {
		const wrap = element('label', 'custom-field');
		wrap.append(element('span', '', label));
		const input = options ? element('select') : element('input');
		input.setAttribute('aria-label', label);
		if (input instanceof HTMLSelectElement) {
			for (const option of options!)
				input.add(new Option(option || 'Keep default', option));
			if (value && !options!.includes(value))
				input.add(new Option(value, value));
		} else {
			input.type = 'text';
			input.placeholder = placeholder;
		}
		input.value = value;
		input.addEventListener('change', () => fn(input.value));
		if (['Default icon tint', 'Custom icon color'].includes(label)) {
			const row = element('div', 'custom-color-field');
			const picker = colorButton({
				label: `Pick ${label.toLowerCase()} color`,
				getValue: () => input.value || 'currentColor',
				scope: this.preview,
				onChange: (v) => {
					input.value = v;
					fn(v);
				},
			});
			input.addEventListener('change', () => picker.refreshColor());
			row.append(picker, input);
			wrap.append(row);
		} else wrap.append(input);
		parent.append(wrap);
		return input;
	}
	private upload(
		parent: HTMLElement,
		label: string,
		accept: string,
		folder: string,
		onUpload: (path: string) => void,
		path?: string,
		multiple = false,
	): void {
		const area = element('div', 'upload-area');
		const input = element('input');
		input.type = 'file';
		input.accept = accept;
		input.multiple = multiple;
		input.setAttribute('aria-label', label);
		input.hidden = true;
		const button = this.button(
			label === 'Upload texture'
				? path
					? 'Upload a different texture'
					: 'Upload texture'
				: path
					? 'Replace file'
					: label,
			() => input.click(),
			'upload-button',
		);
		if (
			path &&
			this.api.assets.url(path) &&
			/\.(png|jpg|jpeg|svg|webp|gif|avif)$/i.test(path)
		) {
			const img = element('img');
			img.src = this.api.assets.url(path);
			img.alt = 'Uploaded artwork';
			area.append(img);
		}
		const read = async (files: FileList | null) => {
			if (!files?.length) return;
			button.disabled = true;
			this.error.textContent = '';
			try {
				for (const file of multiple ? [...files] : [files[0]])
					onUpload(await this.api.assets.add(file, folder));
				if (!this.error.textContent) this.render();
			} catch (e) {
				this.error.textContent = e instanceof Error ? e.message : String(e);
			} finally {
				button.disabled = false;
				input.value = '';
			}
		};
		input.addEventListener('change', () => void read(input.files));
		area.addEventListener('dragover', (e) => {
			e.preventDefault();
			area.classList.add('drag-over');
		});
		area.addEventListener('dragleave', () =>
			area.classList.remove('drag-over'),
		);
		area.addEventListener('drop', (e) => {
			e.preventDefault();
			area.classList.remove('drag-over');
			void read(e.dataTransfer?.files ?? null);
		});
		area.append(
			button,
			input,
			element('small', '', path ? path : 'or drop a file here'),
		);
		parent.append(area);
	}
	private textureEditor(): void {
		const select = element('select');
		select.setAttribute('aria-label', 'Texture surface');
		for (const slot of contract.textures)
			select.add(new Option(names(slot.id), slot.id));
		select.value = this.selectedTexture;
		select.addEventListener('change', () => {
			this.selectedTexture = select.value;
			this.render();
		});
		this.host.append(select);
		const library = this.button(
			'Example textures',
			() => this.chooseTexture(),
			'texture-library-launch',
		);
		library.dataset.textureLibrary = '';
		this.host.append(
			library,
			element(
				'p',
				'control-note',
				'Six ready-made materials. Or use Upload texture below to add a PNG, JPG, WebP or SVG from your computer.',
			),
		);
		const definition = contract.textures.find(
			(x) => x.id === this.selectedTexture,
		)!;
		const current = this.api.theme().textures?.[definition.id];
		let draft: Texture = current
			? structuredClone(current)
			: (this.textureDrafts.get(definition.id) ?? {
					type: definition.type as Texture['type'],
					path: '',
					...(definition.type === 'border-image'
						? { slice: '12', width: '12px' }
						: {}),
				});
		this.textureDrafts.set(definition.id, draft);
		const apply = (key: keyof Texture, v: string) => {
			if (v) (draft as unknown as Record<string, string>)[key] = v;
			else delete (draft as unknown as Record<string, string>)[key];
			if (draft.path)
				this.change((t) => {
					t.textures ??= {};
					t.textures[definition.id] = structuredClone(draft);
				});
		};
		this.upload(
			this.host,
			'Upload texture',
			'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml',
			'textures',
			(path) => {
				draft.path = path;
				this.change((t) => {
					t.textures ??= {};
					t.textures[definition.id] = draft;
				});
			},
			current?.path,
		);
		if (definition.type === 'border-image') {
			this.host.append(
				element(
					'p',
					'control-note',
					'Nine-slice frames preserve their corners while the edges resize. Drag the guide sliders to set cuts.',
				),
			);
			const values = (draft.slice ?? '12')
				.replace(' fill', '')
				.split(' ')
				.map(Number);
			const expanded =
				values.length === 1
					? [values[0], values[0], values[0], values[0]]
					: values.length === 2
						? [values[0], values[1], values[0], values[1]]
						: values.length === 3
							? [values[0], values[1], values[2], values[1]]
							: values;
			const fill = element('input');
			fill.type = 'checkbox';
			fill.checked = (current?.slice ?? '').endsWith(' fill');
			fill.setAttribute('aria-label', 'Fill frame center');
			for (const [i, side] of ['Top', 'Right', 'Bottom', 'Left'].entries()) {
				const wrapper = element('label', 'custom-field');
				wrapper.append(element('span', '', `${side} slice`));
				const range = element('input');
				range.type = 'range';
				range.min = '0';
				range.max = '256';
				range.value = String(expanded[i]);
				range.setAttribute('aria-label', `${side} frame slice`);
				const output = element('output', '', range.value);
				range.addEventListener('input', () => {
					expanded[i] = Number(range.value);
					output.textContent = range.value;
					apply('slice', expanded.join(' ') + (fill.checked ? ' fill' : ''));
					this.updateSliceGuides(expanded);
				});
				wrapper.append(range, output);
				this.host.append(wrapper);
			}
			const fillLabel = element('label', 'custom-check');
			fillLabel.append(fill, document.createTextNode('Fill frame center'));
			fill.addEventListener('change', () =>
				apply('slice', expanded.join(' ') + (fill.checked ? ' fill' : '')),
			);
			this.host.append(fillLabel);
			this.field(
				this.host,
				'Frame slice values',
				current?.slice ?? '',
				(v) => apply('slice', v),
				undefined,
				'12 12 12 12',
			);
			this.field(
				this.host,
				'Frame width',
				current?.width ?? '',
				(v) => apply('width', v),
				undefined,
				'12px',
			);
			this.field(
				this.host,
				'Frame repeat',
				current?.repeat ?? '',
				(v) => apply('repeat', v),
				[
					'',
					'stretch',
					'repeat',
					'round',
					'space',
					...['stretch', 'repeat', 'round', 'space'].flatMap((a) =>
						['stretch', 'repeat', 'round', 'space'].map((b) => a + ' ' + b),
					),
				],
			);
		} else {
			if (definition.id === 'TITLEBAR_FOCUSED')
				this.host.append(
					element(
						'p',
						'control-note',
						'The focused title bar shares size, tiling and position with Titlebar. Its image can be different.',
					),
				);
			else if (definition.sharedSize) {
				this.field(
					this.host,
					'Corner ornament size',
					current?.size ?? '',
					(v) => apply('size', v),
					undefined,
					'32px',
				);
				this.host.append(
					element(
						'p',
						'control-note',
						'All corners share one size. The first size in NE, NW, SE, SW order wins.',
					),
				);
				this.host.append(
					this.button('Adjust corner inset', () => {
						this.open('tokens');
						this.api.token('--os-window-corner-inset');
					}),
				);
			} else
				this.placementControls(this.host, draft, (key, v) => apply(key, v));
		}
		if (current)
			this.host.append(
				this.button('Remove texture', () =>
					this.change((t) => {
						delete t.textures?.[definition.id];
					}, true),
				),
			);
		this.host.append(
			element(
				'p',
				'control-note',
				`${contract.textures.length} texture surfaces are available in the preview gallery. Color tokens remain underneath transparent artwork.`,
			),
		);
	}
	private placementControls(
		parent: HTMLElement,
		descriptor: Texture | Wallpaper,
		apply: (key: 'size' | 'position' | 'repeat', value: string) => void,
	): void {
		const modes = element('div', 'placement-modes');
		for (const [label, size, repeat, position] of [
			['Tile', 'auto', 'repeat', 'left top'],
			['Stretch', '100% 100%', 'no-repeat', 'center'],
			['Cover', 'cover', 'no-repeat', 'center'],
			['Place', '64px', 'no-repeat', 'center'],
		])
			modes.append(
				this.button(label, () => {
					apply('size', size);
					apply('repeat', repeat);
					apply('position', position);
					this.render();
				}),
			);
		parent.append(modes);
		this.field(
			parent,
			'Image size',
			descriptor.size ?? '',
			(v) => apply('size', v),
			undefined,
			'auto, cover, or 100% 100%',
		);
		this.field(
			parent,
			'Repeat',
			descriptor.repeat ?? '',
			(v) => apply('repeat', v),
			['', 'repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round'],
		);
		this.field(
			parent,
			'Position',
			descriptor.position ?? '',
			(v) => apply('position', v),
			undefined,
			'left top',
		);
		const grid = element('div', 'position-grid');
		for (const y of ['top', 'center', 'bottom'])
			for (const x of ['left', 'center', 'right']) {
				const button = this.button(
					'·',
					() => {
						apply('position', `${x} ${y}`);
						this.render();
					},
					'position-point',
				);
				button.setAttribute('aria-label', `Place image ${x} ${y}`);
				grid.append(button);
			}
		parent.append(grid);
	}
	private updateSliceGuides(values: number[]): void {
		const image =
			this.canvas.querySelector<HTMLImageElement>('[data-slice-image]');
		for (const [i, side] of ['top', 'right', 'bottom', 'left'].entries()) {
			const dimension = i % 2 ? image?.naturalWidth : image?.naturalHeight;
			this.canvas.style.setProperty(
				`--slice-${side}`,
				dimension ? `${(values[i] / dimension) * 100}%` : `${values[i]}px`,
			);
			const range = this.host.querySelector<HTMLInputElement>(
				`[aria-label="${side[0].toUpperCase() + side.slice(1)} frame slice"]`,
			);
			if (range && dimension) range.max = String(dimension);
		}
	}
	private iconEditor(): void {
		this.field(
			this.host,
			'Default icon tint',
			this.api.theme().iconColor ?? '',
			(v) =>
				this.change((t) => {
					if (v) t.iconColor = v;
					else delete t.iconColor;
				}),
			undefined,
			'#ec9bff or currentColor',
		);
		const picker = element('select');
		picker.setAttribute('aria-label', 'Icon slot');
		const slots = [
			...new Set([
				...contract.icons,
				...Object.keys(this.api.theme().icons ?? {}),
			]),
		];
		for (const slot of slots) picker.add(new Option(names(slot), slot));
		picker.value = this.selectedIcon;
		picker.addEventListener('change', () => {
			this.selectedIcon = picker.value;
			this.render();
		});
		this.host.append(picker);
		const app = element('div', 'custom-inline');
		const id = element('input');
		id.placeholder = 'my-app-slug';
		id.setAttribute('aria-label', 'App icon slug');
		app.append(
			id,
			this.button('Add app', () => {
				if (!/^[a-z0-9_-]+$/.test(id.value)) {
					this.error.textContent =
						'Use a lowercase app slug, such as edit-php.';
					return;
				}
				this.selectedIcon = `APP:${id.value}`;
				this.change((t) => {
					t.icons ??= {};
					t.icons[this.selectedIcon] = {
						type: 'dashicon',
						name: 'dashicons-admin-generic',
					};
				}, true);
			}),
		);
		this.host.append(app);
		const current = this.api.theme().icons?.[this.selectedIcon];
		this.upload(
			this.host,
			'Upload icon',
			'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml',
			'icons',
			(path) =>
				this.change((t) => {
					t.icons ??= {};
					t.icons[this.selectedIcon] = {
						type: 'image',
						path,
						...(current?.color ? { color: current.color } : {}),
					};
				}),
			current?.path,
		);
		this.field(
			this.host,
			'Dashicon name',
			current?.type === 'dashicon' ? (current.name ?? '') : '',
			(v) => {
				if (v)
					this.change((t) => {
						t.icons ??= {};
						t.icons[this.selectedIcon] = {
							type: 'dashicon',
							name: v,
							...(current?.color ? { color: current.color } : {}),
						};
					});
			},
			undefined,
			'dashicons-admin-generic',
		);
		const glyphs = element('div', 'dashicon-picker');
		for (const name of [
			'admin-generic',
			'admin-home',
			'admin-post',
			'admin-media',
			'admin-page',
			'admin-appearance',
			'admin-users',
			'admin-settings',
			'format-image',
			'portfolio',
			'star-filled',
			'heart',
			'menu',
			'search',
			'plus',
			'no-alt',
			'minus',
			'editor-expand',
			'fullscreen-exit-alt',
			'update',
			'external',
			'trash',
			'undo',
			'download',
		]) {
			const b = this.button(
				'',
				() =>
					this.change((t) => {
						t.icons ??= {};
						t.icons[this.selectedIcon] = {
							type: 'dashicon',
							name: `dashicons-${name}`,
						};
					}, true),
				'glyph-choice',
			);
			b.setAttribute('aria-label', `Use dashicons-${name}`);
			const icon = element('span', `dashicons dashicons-${name}`);
			b.append(icon);
			glyphs.append(b);
		}
		this.host.append(glyphs);
		const browse = element('details', 'glyph-browser');
		browse.append(
			element('summary', '', `Browse all ${dashicons.length} Dashicons`),
		);
		const search = element('input');
		search.type = 'search';
		search.placeholder = 'Search glyphs…';
		search.setAttribute('aria-label', 'Search Dashicons');
		const gallery = element('div', 'dashicon-picker full-glyphs');
		const renderGlyphs = () => {
			gallery.replaceChildren();
			for (const name of dashicons.filter((n) =>
				n.includes(search.value.toLowerCase()),
			)) {
				const b = this.button(
					'',
					() =>
						this.change((t) => {
							t.icons ??= {};
							t.icons[this.selectedIcon] = {
								type: 'dashicon',
								name: 'dashicons-' + name,
							};
						}, true),
					'glyph-choice',
				);
				b.setAttribute('aria-label', 'Use dashicons-' + name);
				b.title = name;
				b.append(element('span', 'dashicons dashicons-' + name));
				gallery.append(b);
			}
		};
		search.addEventListener('input', renderGlyphs);
		browse.addEventListener('toggle', () => {
			if (browse.open) renderGlyphs();
		});
		browse.append(search, gallery);
		this.host.append(browse);
		this.field(
			this.host,
			'This icon tint',
			current?.color ?? '',
			(v) => {
				if (!current) {
					this.error.textContent = 'Choose an icon first.';
					return;
				}
				this.change((t) => {
					const icon = t.icons![this.selectedIcon];
					if (v) icon.color = v;
					else delete icon.color;
				});
			},
			['', 'currentColor', 'none', '#fffbff', '#0c0b0f'],
		);
		this.field(
			this.host,
			'Custom icon color',
			current?.color && !['none', 'currentColor'].includes(current.color)
				? current.color
				: '',
			(v) => {
				if (current)
					this.change((t) => {
						if (v) t.icons![this.selectedIcon].color = v;
						else delete t.icons![this.selectedIcon].color;
					});
			},
			undefined,
			'#ec9bff',
		);
		if (current)
			this.host.append(
				this.button('Restore default icon', () =>
					this.change((t) => {
						delete t.icons?.[this.selectedIcon];
					}, true),
				),
			);
		this.host.append(
			element(
				'p',
				'control-note',
				'“none” keeps artwork colors. “currentColor” uses its alpha as a mask. Window controls and recycle actions are always monochrome masks unless given an explicit tint.',
			),
		);
	}
	private fontEditor(): void {
		const fonts = this.api.theme().fonts ?? [];
		if (fonts.length) {
			this.selectedFont = Math.min(this.selectedFont, fonts.length - 1);
			const select = element('select');
			select.setAttribute('aria-label', 'Font face');
			fonts.forEach((f, i) =>
				select.add(
					new Option(
						`${f.family} · ${f.weight ?? 'normal'} ${f.style ?? ''}`,
						String(i),
					),
				),
			);
			select.value = String(this.selectedFont);
			select.addEventListener('change', () => {
				this.selectedFont = +select.value;
				this.render();
			});
			this.host.append(select);
		}
		this.upload(
			this.host,
			'Add font face',
			'.woff2,.woff,.ttf,.otf',
			'fonts',
			(path) => {
				this.change((t) => {
					t.fonts ??= [];
					t.fonts.push({
						family: 'My Typeface ' + (t.fonts.length + 1),
						src: [path],
						weight: '100 900',
						style: 'normal',
						display: 'swap',
					});
					this.selectedFont = t.fonts.length - 1;
				});
			},
		);
		const face = fonts[this.selectedFont];
		if (!face) return;
		const set = (key: keyof FontFaceDescriptor, v: string) =>
			this.change((t) => {
				const f = t.fonts![this.selectedFont];
				if (v) (f as unknown as Record<string, unknown>)[key] = v;
				else delete (f as unknown as Record<string, unknown>)[key];
			});
		this.field(this.host, 'Font family', face.family, (v) => set('family', v));
		this.field(
			this.host,
			'Font weight',
			face.weight ?? '',
			(v) => set('weight', v),
			undefined,
			'400 or 100 900',
		);
		this.field(
			this.host,
			'Font style',
			face.style ?? '',
			(v) => set('style', v),
			['', 'normal', 'italic', 'oblique'],
		);
		this.field(
			this.host,
			'Font loading',
			face.display ?? '',
			(v) => set('display', v),
			['', 'auto', 'block', 'swap', 'fallback', 'optional'],
		);
		this.field(
			this.host,
			'Font stretch',
			face.stretch ?? '',
			(v) => set('stretch', v),
			undefined,
			'normal or 75% 125%',
		);
		this.field(
			this.host,
			'Unicode range',
			face.unicodeRange ?? '',
			(v) => set('unicodeRange', v),
			undefined,
			'U+0000-00FF',
		);
		const sources = element('div', 'font-sources');
		face.src.forEach((path, i) => {
			const row = element('div', 'asset-row');
			row.append(
				element('span', '', path),
				this.button('↑', () =>
					this.change((t) => {
						const files = t.fonts![this.selectedFont].src;
						if (i > 0) [files[i - 1], files[i]] = [files[i], files[i - 1]];
					}, true),
				),
				this.button('×', () =>
					this.change((t) => {
						t.fonts![this.selectedFont].src.splice(i, 1);
					}, true),
				),
			);
			sources.append(row);
		});
		this.host.append(sources);
		this.upload(
			this.host,
			'Add fallback source',
			'.woff2,.woff,.ttf,.otf',
			'fonts',
			(path) =>
				this.change((t) => {
					t.fonts![this.selectedFont].src.push(path);
				}),
		);
		this.host.append(
			this.button(
				'Use for interface',
				() =>
					this.change((t) => {
						for (const token of [
							'--os-ui-font',
							'--os-font',
							'--os-titlebar-font',
						])
							t.tokens[token] =
								`"${t.fonts![this.selectedFont].family}", system-ui, sans-serif`;
					}, true),
				'export-button',
			),
			this.button('Remove font face', () =>
				this.change((t) => {
					t.fonts!.splice(this.selectedFont, 1);
				}, true),
			),
		);
		this.host.append(
			element(
				'p',
				'control-note',
				'Up to 16 faces, each with four sources. Keep the font license in Assets. Applying a family creates explicit typography overrides.',
			),
		);
	}
	private wallpaperEditor(): void {
		const wallpapers = this.api.theme().wallpapers ?? [];
		if (wallpapers.length) {
			this.selectedWallpaper = Math.min(
				this.selectedWallpaper,
				wallpapers.length - 1,
			);
			const select = element('select');
			select.setAttribute('aria-label', 'Wallpaper');
			wallpapers.forEach((w, i) =>
				select.add(new Option(w.label || w.id, String(i))),
			);
			select.value = String(this.selectedWallpaper);
			select.addEventListener('change', () => {
				this.selectedWallpaper = +select.value;
				this.render();
			});
			this.host.append(select);
		}
		this.upload(
			this.host,
			'Add wallpaper',
			'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml',
			'wallpapers',
			(path) =>
				this.change((t) => {
					t.wallpapers ??= [];
					const id = slugify(
						path
							.split('/')
							.at(-1)!
							.replace(/\.[^.]+$/, ''),
					);
					t.wallpapers.push({
						id,
						label: `Wallpaper ${t.wallpapers.length + 1}`,
						path,
						size: 'cover',
						repeat: 'no-repeat',
						position: 'center',
					});
					this.selectedWallpaper = t.wallpapers.length - 1;
				}),
		);
		const wallpaper = wallpapers[this.selectedWallpaper];
		if (!wallpaper) return;
		const set = (key: keyof Wallpaper, v: string) =>
			this.change((t) => {
				const w = t.wallpapers![this.selectedWallpaper];
				if (v) (w as unknown as Record<string, string>)[key] = v;
				else delete (w as unknown as Record<string, string>)[key];
			});
		this.field(this.host, 'Wallpaper name', wallpaper.label ?? '', (v) =>
			set('label', v),
		);
		this.field(this.host, 'Wallpaper ID', wallpaper.id, (v) => set('id', v));
		this.field(
			this.host,
			'Wallpaper description',
			wallpaper.description ?? '',
			(v) => set('description', v),
		);
		this.placementControls(this.host, wallpaper, (k, v) => set(k, v));
		this.upload(
			this.host,
			'Replace wallpaper',
			'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml',
			'wallpapers',
			(path) => set('path', path),
			wallpaper.path,
		);
		this.host.append(
			this.button('Remove wallpaper', () =>
				this.change((t) => {
					t.wallpapers!.splice(this.selectedWallpaper, 1);
				}, true),
			),
			element(
				'p',
				'control-note',
				'Wallpapers are offered as choices; a theme does not force a user to replace their chosen wallpaper. Keep IDs stable when updating.',
			),
		);
	}
	private layoutEditor(): void {
		for (const [key, rule] of Object.entries(contract.settings)) {
			const current = this.api.theme().recommendedOsSettings?.[key];
			const set = (v: string) =>
				this.change((t) => {
					t.recommendedOsSettings ??= {};
					if (v) t.recommendedOsSettings[key] = 'min' in rule ? Number(v) : v;
					else delete t.recommendedOsSettings[key];
				});
			if ('min' in rule) {
				const input = this.field(
					this.host,
					rule.label,
					current === undefined ? '' : String(current),
					set,
				);
				input.setAttribute('type', 'number');
				input.setAttribute('min', String(rule.min));
				input.setAttribute('max', String(rule.max));
			} else {
				this.field(
					this.host,
					rule.label,
					current === undefined ? '' : String(current),
					set,
					['', ...rule.values],
				);
				if ('custom' in rule)
					this.field(
						this.host,
						`Custom ${rule.label.toLowerCase()} ID`,
						current && !rule.values.includes(String(current))
							? String(current)
							: '',
						set,
						undefined,
						'registered-id',
					);
			}
		}
		this.host.append(
			this.button('Replay window reveal', () => this.replay()),
			this.button('Clear recommendations', () =>
				this.change((t) => {
					delete t.recommendedOsSettings;
				}, true),
			),
			element(
				'p',
				'control-note',
				'Registry IDs must exist on the target site. Custom renderers, reveals and accent IDs are retained in export; their implementation belongs to that site.',
			),
		);
	}
	private assetEditor(): void {
		this.upload(
			this.host,
			'Add theme preview',
			'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml',
			'preview',
			(path) =>
				this.change((t) => {
					t.preview = path;
				}),
			this.api.theme().preview,
		);
		if (this.api.theme().preview)
			this.host.append(
				this.button('Remove theme preview', () =>
					this.change((t) => {
						delete t.preview;
					}, true),
				),
			);
		this.upload(
			this.host,
			'Add license or readme',
			'.txt,.md',
			'licenses',
			() => {
				this.api.commit(structuredClone(this.api.theme()));
				this.api.notify('License file added to the theme archive.');
			},
		);
		const required = referencedAssets(this.api.theme());
		for (const path of required) {
			const bytes = this.api.assets.files[path];
			const row = element('div', 'asset-row');
			row.append(
				element('span', '', path),
				element(
					'small',
					'',
					bytes ? `${Math.ceil(bytes.length / 1024)} KB` : 'Missing file',
				),
			);
			if (!bytes) {
				const file = element('input');
				file.type = 'file';
				file.setAttribute('aria-label', `Resolve ${path}`);
				file.addEventListener('change', async () => {
					if (!file.files?.[0]) return;
					try {
						await this.api.assets.add(file.files[0], '', path);
						this.api.commit(structuredClone(this.api.theme()));
						this.render();
					} catch (e) {
						this.error.textContent = String(e);
					}
				});
				row.append(file);
			}
			this.host.append(row);
		}
		for (const path of Object.keys(this.api.assets.files).filter((p) =>
			/\.(txt|md)$/i.test(p),
		))
			this.host.append(element('div', 'asset-row', path));
		this.host.append(
			element(
				'p',
				'control-note',
				'ZIP export includes referenced images/fonts and license files. JSON carries the manifest only. Missing assets must be supplied before a ZIP can be exported.',
			),
		);
	}
	renderCanvas(): void {
		this.canvas.replaceChildren();
		const heading = element('header', 'atlas-heading');
		heading.append(
			element('span', 'eyebrow', 'LIVE MATERIAL LIBRARY'),
			element(
				'h2',
				'',
				this.mode === 'textures'
					? names(this.selectedTexture)
					: this.mode === 'icons'
						? names(this.selectedIcon)
						: this.mode === 'fonts'
							? 'Type specimen'
							: this.mode === 'wallpapers'
								? 'Wallpaper collection'
								: this.mode === 'layout'
									? 'Layout & effects'
									: 'Your theme package',
			),
		);
		this.canvas.append(heading);
		if (this.mode === 'textures') {
			const definition = contract.textures.find(
				(x) => x.id === this.selectedTexture,
			)!;
			const demo = element('div', 'material-demo');
			demo.dataset.textureSlot = definition.id;
			const frame = element('div', 'material-window');
			frame.append(
				element('div', 'material-titlebar', 'Untitled window'),
				element('div', 'material-body', 'Your artwork, at its real size.'),
			);
			for (const side of ['NE', 'NW', 'SE', 'SW']) {
				const corner = element(
					'div',
					`material-corner corner-${side.toLowerCase()}`,
				);
				corner.dataset.textureSlot = `WINDOW_CORNER_${side}`;
				frame.append(corner);
			}
			if (definition.type === 'border-image') {
				frame.dataset.textureSlot = definition.id;
				frame.classList.add('frame-slice-demo');
			} else if (definition.id.startsWith('WINDOW_CORNER_'))
				frame.classList.add('corner-demo');
			else if (definition.id.startsWith('TITLEBAR'))
				(frame.firstElementChild as HTMLElement).dataset.textureSlot =
					definition.id;
			else
				(frame.children[1] as HTMLElement).dataset.textureSlot = definition.id;
			demo.removeAttribute('data-texture-slot');
			const context = materialContext(definition.id);
			if (context) demo.append(context);
			else demo.append(frame);
			if (['TITLEBAR_BUTTON', 'TITLEBAR_CONTROLS'].includes(definition.id)) {
				const title = frame.firstElementChild as HTMLElement;
				title.removeAttribute('data-texture-slot');
				const controls = element('span', 'sample-window-controls');
				for (const text of ['−', '□', '×']) {
					const b = element('button', '', text);
					if (definition.id === 'TITLEBAR_BUTTON')
						b.dataset.textureSlot = definition.id;
					controls.append(b);
				}
				if (definition.id === 'TITLEBAR_CONTROLS')
					controls.dataset.textureSlot = definition.id;
				title.append(controls);
			}
			this.canvas.append(demo);
			if (definition.type === 'border-image') {
				const source = element('div', 'slice-source');
				const image = element('img');
				image.alt = 'Source image with nine-slice guides';
				image.dataset.sliceImage = 'true';
				source.append(image);
				for (const side of ['top', 'right', 'bottom', 'left'])
					source.append(element('i', `slice-guide slice-${side}`));
				this.canvas.append(source);
			}
			const grid = element('div', 'material-grid');
			for (const slot of contract.textures) {
				const b = this.button(
					'',
					() => {
						this.selectedTexture = slot.id;
						this.render();
					},
					'material-card',
				);
				b.dataset.inspectTexture = slot.id;
				const sample = element('div', 'material-swatch');
				sample.dataset.textureSlot = slot.id;
				sample.textContent = slot.type === 'border-image' ? 'Frame' : 'Aa';
				b.append(sample, element('span', '', names(slot.id)));
				grid.append(b);
			}
			this.canvas.append(grid);
		} else if (this.mode === 'icons') {
			const large = element('div', 'icon-stage');
			for (const tone of ['dark', 'light', 'accent']) {
				const box = element('div', `icon-tone ${tone}`);
				const icon = element('span', 'themed-icon');
				icon.dataset.iconSlot = this.selectedIcon;
				box.append(icon, element('small', '', tone));
				large.append(box);
			}
			this.canvas.append(large);
			const grid = element('div', 'material-grid icon-grid');
			for (const slot of [
				...new Set([
					...contract.icons,
					...Object.keys(this.api.theme().icons ?? {}),
				]),
			]) {
				const b = this.button(
					'',
					() => {
						this.selectedIcon = slot;
						this.render();
					},
					'material-card',
				);
				b.dataset.inspectIcon = slot;
				const glyph = element('span', 'themed-icon');
				glyph.dataset.iconSlot = slot;
				b.append(glyph, element('span', '', names(slot)));
				grid.append(b);
			}
			this.canvas.append(grid);
		} else if (this.mode === 'fonts') {
			const sample = element('div', 'font-specimen');
			sample.dataset.fontSample = 'true';
			sample.append(
				element('div', 'font-hero', 'Aa'),
				element('h2', '', 'Make room for your next idea.'),
				element(
					'p',
					'',
					'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789 @#$%&!?',
				),
				element(
					'p',
					'font-paragraph',
					'A quiet workspace. A clear thought. A little more room to create something that matters.',
				),
			);
			this.canvas.append(sample);
		} else if (this.mode === 'wallpapers') {
			const large = element('div', 'wallpaper-large');
			large.dataset.wallpaperIndex = String(this.selectedWallpaper);
			large.append(
				element('div', 'wallpaper-clock', '10:24'),
				element('span', '', 'Your workspace'),
			);
			this.canvas.append(large);
			const grid = element('div', 'material-grid');
			(this.api.theme().wallpapers ?? []).forEach((w, i) => {
				const card = this.button(
					'',
					() => {
						this.selectedWallpaper = i;
						this.render();
					},
					'material-card',
				);
				const art = element('div', 'wallpaper-thumbnail');
				art.dataset.wallpaperIndex = String(i);
				card.append(art, element('span', '', w.label || w.id));
				grid.append(card);
			});
			this.canvas.append(grid);
		} else if (this.mode === 'layout') {
			const board = element('div', 'layout-board');
			board.dataset.layoutBoard = 'true';
			const bar = element('div', 'layout-adminbar', 'WordPress · Your site');
			const window = element('div', 'layout-window');
			window.append(
				element('header', '', 'My workspace'),
				element('p', '', 'Your layout, your pace.'),
				element('div', 'reveal-sheet'),
			);
			const dock = element('div', 'layout-dock');
			for (const glyph of ['▦', '▧', '▤', '⚙'])
				dock.append(element('span', '', glyph));
			board.append(bar, window, dock);
			this.canvas.append(
				board,
				this.button('Replay transition', () => this.replay(), 'quiet-button'),
				element(
					'p',
					'control-note',
					'Built-in reveals are independent motion sketches. Custom registry IDs are exportable; their visuals require the target site. Hover the workspace to reveal a dynamic admin bar.',
				),
			);
		} else {
			const card = element('div', 'theme-package-card');
			const art = element('img');
			art.dataset.themePreview = 'true';
			art.alt = 'Theme preview';
			card.append(
				art,
				element('h2', '', this.api.theme().name),
				element(
					'p',
					'',
					this.api.theme().description ||
						'Your installable theme, with its artwork and typefaces.',
				),
			);
			this.canvas.append(card);
		}
	}
	replay(): void {
		const sheet = this.canvas.querySelector<HTMLElement>('.reveal-sheet');
		if (sheet)
			replayReveal(
				sheet,
				String(this.api.theme().recommendedOsSettings?.windowReveal ?? 'sweep'),
				Number(
					this.api.theme().recommendedOsSettings?.windowRevealDuration ?? 500,
				),
			);
	}

	updatePreview(comparing = this.api.comparing()): void {
		applyThemeMedia(
			comparing
				? {
						...this.api.theme(),
						textures: {},
						icons: {},
						fonts: [],
						wallpapers: [],
						recommendedOsSettings: {},
						preview: undefined,
						iconColor: undefined,
					}
				: this.api.theme(),
			this.api.assets,
			this.preview,
			this.selectedWallpaper,
			this.selectedFont,
			this.selectedTexture,
		);
		const image =
			this.canvas.querySelector<HTMLImageElement>('[data-slice-image]');
		if (image) {
			const draw = () => {
				const parts = (
					this.api.theme().textures?.[this.selectedTexture]?.slice ?? '12'
				)
					.replace(' fill', '')
					.split(' ')
					.map(Number);
				const v =
					parts.length === 1
						? [parts[0], parts[0], parts[0], parts[0]]
						: parts.length === 2
							? [parts[0], parts[1], parts[0], parts[1]]
							: parts.length === 3
								? [parts[0], parts[1], parts[2], parts[1]]
								: parts;
				this.updateSliceGuides(v);
			};
			image.onload = draw;
			if (image.complete) draw();
		}
	}
}
