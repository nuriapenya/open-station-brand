import contract from '../data/theme-contract.json';
import type { Theme } from './theme';
import type { AssetLibrary } from './theme-assets';
const imageProperties = [
	'background-image',
	'background-size',
	'background-repeat',
	'background-position',
];
const borderProperties = [
	'border-image-source',
	'border-image-slice',
	'border-image-width',
	'border-image-repeat',
];
const glyphs: Record<string, string> = {
	WINDOW_CONTROL_MINIMIZE: 'minus',
	WINDOW_CONTROL_MAXIMIZE: 'editor-expand',
	WINDOW_CONTROL_FULLSCREEN: 'editor-expand',
	WINDOW_CONTROL_FULLSCREEN_EXIT: 'fullscreen-exit-alt',
	WINDOW_CONTROL_CLOSE: 'no-alt',
	WINDOW_CONTROL_MENU: 'menu',
	WINDOW_CONTROL_RELOAD: 'update',
	WINDOW_CONTROL_DETACH: 'external',
	OS_SETTINGS: 'admin-generic',
	RECYCLE_BIN: 'trash',
	BUG_REPORT: 'flag',
	EXIT_OPENSTATION: 'exit',
	PWA_INSTALL: 'download',
	DEFAULT_APP_ICON: 'admin-generic',
	FOLDER: 'category',
	FILE_SHORTCUT: 'external',
	FILE_POST: 'admin-post',
	FILE_ATTACHMENT: 'admin-media',
	FILE_UPLOAD: 'upload',
	FILE_USER: 'admin-users',
	FILE_TERM: 'tag',
	FILE_COMMENT: 'admin-comments',
	FILE_BOOKMARK: 'admin-links',
	FILE_LINK: 'admin-links',
	FILE_EMBED: 'embed-generic',
	RECYCLE_RESTORE: 'undo',
	RECYCLE_DELETE: 'trash',
};
let fontKey = '';
let activeFonts: FontFace[] = [];
const url = (assets: AssetLibrary, path?: string) =>
	path && assets.url(path) ? `url("${assets.url(path)}")` : 'none';
const mediaVariables = new WeakMap<
	HTMLElement,
	Map<string, { previous: string; applied: string }>
>();
/** Apply manifest artwork to both copied components and independent shell sketches. */
export function applyThemeMedia(
	theme: Theme,
	assets: AssetLibrary,
	root: HTMLElement,
	wallpaperIndex = 0,
	fontIndex = 0,
	selectedTexture = 'TITLEBAR',
): void {
	const focused = root.dataset.unfocused !== 'true';
	const textures = theme.textures ?? {};
	// Exported texture slots become CSS variables in the real components. Keep a
	// reversible DOM overlay so removing artwork restores the current token draft.
	const scopes = [root];
	for (const scope of scopes) {
		for (const [name, value] of mediaVariables.get(scope) ?? []) {
			if (scope.style.getPropertyValue(name) === value.applied) {
				if (value.previous) scope.style.setProperty(name, value.previous);
				else scope.style.removeProperty(name);
			}
		}
		const changes = new Map<string, { previous: string; applied: string }>();
		const paint = (name: string, applied: string) => {
			changes.set(name, {
				previous: scope.style.getPropertyValue(name),
				applied,
			});
			scope.style.setProperty(name, applied);
		};
		for (const definition of contract.textures) {
			const tx = definition.base
				? { ...textures[definition.base], ...textures[definition.id] }
				: textures[definition.id];
			if (!tx?.path || !assets.url(tx.path)) continue;
			const sourceName =
				definition.property +
				(definition.type === 'border-image' ? '-source' : '');
			paint(`--studio-art${sourceName}`, url(assets, tx.path));
			paint(`--studio-art-label${sourceName}`, '""');
			paint(
				definition.property +
					(definition.type === 'border-image' ? '-source' : ''),
				url(assets, tx.path),
			);
			const placementPrefix =
				definition.id === 'TITLEBAR_FOCUSED'
					? '--os-titlebar-image'
					: definition.property;
			const placement =
				definition.id === 'TITLEBAR_FOCUSED' ? textures.TITLEBAR : tx;
			for (const key of definition.type === 'border-image'
				? ['slice', 'width', 'repeat']
				: ['size', 'position', 'repeat']) {
				const value = placement?.[key as keyof typeof placement];
				if (typeof value === 'string')
					paint(`${placementPrefix}-${key}`, value);
			}
		}
		mediaVariables.set(scope, changes);
	}

	const sharedSize =
		['NE', 'NW', 'SE', 'SW']
			.map((side) => textures[`WINDOW_CORNER_${side}`]?.size)
			.find(Boolean) || 'var(--os-window-corner-size,16px)';
	const bindings: Record<string, string> = {
		'.mock-titlebar': focused ? 'TITLEBAR_FOCUSED' : 'TITLEBAR',
		'.mock-window': focused ? 'WINDOW_FRAME_FOCUSED' : 'WINDOW_FRAME',
		'.window-controls': 'TITLEBAR_CONTROLS',
		'.window-controls button': 'TITLEBAR_BUTTON',
		'.mock-window-body': 'WINDOW_BODY',
		'.mock-dock': 'DOCK',
		'.mock-dock button': 'DOCK_ITEM',
		'.desktop-shortcuts button': 'ICON_TILE',
		'.mock-notification': 'TOAST',
		'.mock-table th': 'TABLE_HEADER',
		'button.mock-primary,button.mock-secondary': 'BUTTON',
		'.mock-tabs': 'TABBAR',
	};
	for (const [selector, slot] of Object.entries(bindings))
		for (const node of root.querySelectorAll<HTMLElement>(selector))
			node.dataset.textureSlot = slot;
	for (const definition of contract.textures) {
		const tx =
			definition.base && (textures[definition.id] || textures[definition.base])
				? { ...textures[definition.base], ...textures[definition.id] }
				: textures[definition.id];
		const placementPrefix =
			definition.id === 'TITLEBAR_FOCUSED'
				? '--os-titlebar-image'
				: definition.property;
		const placement =
			definition.id === 'TITLEBAR_FOCUSED'
				? (textures.TITLEBAR ?? {})
				: (tx ?? {});
		for (const node of root.querySelectorAll<HTMLElement>(
			`[data-texture-slot="${definition.id}"]`,
		)) {
			for (const p of [...imageProperties, ...borderProperties])
				node.style.removeProperty(p);
			node.style.removeProperty('--studio-window-frame-source');
			node.dataset.hasTexture = String(!!tx && !!assets.files[tx.path]);
			if (!tx) continue;
			if (definition.type === 'border-image') {
				node.style.borderImageSource = url(assets, tx.path);
				node.style.borderImageSlice =
					tx.slice ||
					`var(${definition.property}-slice,var(--os-window-border-image-slice,100%))`;
				node.style.borderImageWidth =
					tx.width ||
					`var(${definition.property}-width,var(--os-window-border-image-width,1))`;
				node.style.borderImageRepeat =
					tx.repeat ||
					`var(${definition.property}-repeat,var(--os-window-border-image-repeat,stretch))`;
				// Border images can extend inward past the physical 1px border.
				// Paint the desktop frame once, above its opaque child surfaces,
				// so the title bar and sidebar cannot cover its top/left edges.
				if (node.matches('.mock-window')) {
					node.style.setProperty(
						'--studio-window-frame-source',
						url(assets, tx.path),
					);
					node.style.borderImageSource = 'none';
				}
			} else {
				node.style.backgroundImage = url(assets, tx.path);
				node.style.backgroundSize = definition.sharedSize
					? '100% 100%'
					: placement.size || `var(${placementPrefix}-size,auto)`;
				node.style.backgroundRepeat = definition.sharedSize
					? 'no-repeat'
					: placement.repeat || `var(${placementPrefix}-repeat,repeat)`;
				node.style.backgroundPosition = definition.sharedSize
					? 'center'
					: placement.position || `var(${placementPrefix}-position,left top)`;
			}
		}
	}
	for (const corner of root.querySelectorAll<HTMLElement>('.material-corner')) {
		corner.style.width = sharedSize;
		corner.style.height = sharedSize;
		corner.style.setProperty(
			'--corner-inset',
			'var(--os-window-corner-inset,0px)',
		);
	}
	const desk = root.querySelector<HTMLElement>('.mock-desktop');
	if (desk) {
		let layer = desk.querySelector<HTMLElement>('.desktop-art');
		if (!layer) {
			layer = document.createElement('div');
			layer.className = 'desktop-art';
			desk.prepend(layer);
		}
		const w = theme.wallpapers?.[wallpaperIndex];
		const tx = textures.DESKTOP;
		layer.style.backgroundImage = [
			url(assets, tx?.path),
			url(assets, w?.path),
		].join(',');
		layer.style.backgroundSize = [tx?.size || 'auto', w?.size || 'cover'].join(
			',',
		);
		layer.style.backgroundRepeat = [
			tx?.repeat || 'repeat',
			w?.repeat || 'no-repeat',
		].join(',');
		layer.style.backgroundPosition = [
			tx?.position || 'left top',
			w?.position || 'center',
		].join(',');
	}
	for (const node of root.querySelectorAll<HTMLElement>(
		'[data-wallpaper-index]',
	)) {
		const w = theme.wallpapers?.[Number(node.dataset.wallpaperIndex)];
		node.style.backgroundImage = url(assets, w?.path);
		node.style.backgroundSize = w?.size || 'cover';
		node.style.backgroundRepeat = w?.repeat || 'no-repeat';
		node.style.backgroundPosition = w?.position || 'center';
	}
	for (const node of root.querySelectorAll<HTMLImageElement>(
		'[data-slice-image],[data-theme-preview]',
	)) {
		const path = node.hasAttribute('data-slice-image')
			? textures[selectedTexture]?.path
			: theme.preview;
		const src = path ? assets.url(path) : '';
		node.hidden = !src;
		if (src && node.src !== src) node.src = src;
		else if (!src) node.removeAttribute('src');
	}
	for (const node of root.querySelectorAll<HTMLElement>('[data-icon-slot]')) {
		const slot = node.dataset.iconSlot!;
		const icon = theme.icons?.[slot];
		const forced =
			slot.startsWith('WINDOW_CONTROL_') ||
			['RECYCLE_RESTORE', 'RECYCLE_DELETE'].includes(slot);
		const tint =
			icon?.color === 'none'
				? forced
					? 'currentColor'
					: undefined
				: (icon?.color ??
					theme.iconColor ??
					(forced ? 'currentColor' : undefined));
		node.replaceChildren();
		node.style.color = tint || '';
		if (icon?.type === 'image' && icon.path && assets.url(icon.path)) {
			const art = document.createElement(tint ? 'span' : 'img');
			art.className = 'icon-art';
			if (art instanceof HTMLImageElement) {
				art.src = assets.url(icon.path);
				art.alt = '';
			} else {
				art.style.maskImage = url(assets, icon.path);
				art.style.backgroundColor = tint!;
			}
			node.append(art);
		} else if (!icon && node.dataset.dockDefault) {
			const art = document.createElement('span');
			art.className = 'dock-glyph';
			art.style.setProperty(
				'--dock-glyph',
				`url("../assets/studio/dock/${node.dataset.dockDefault}.svg")`,
			);
			node.append(art);
		} else {
			const span = document.createElement('span');
			span.className = `dashicons ${icon?.name ?? 'dashicons-' + (glyphs[slot] ?? 'admin-generic')}`;
			span.setAttribute('aria-hidden', 'true');
			node.append(span);
		}
	}
	const key = JSON.stringify(
		(theme.fonts ?? []).map((f) => ({
			...f,
			src: f.src.map((p) => assets.url(p)),
		})),
	);
	if (key !== fontKey) {
		fontKey = key;
		activeFonts.forEach((f) => document.fonts.delete(f));
		activeFonts = [];
		for (const f of theme.fonts ?? []) {
			const sources = f.src
				.filter((p) => assets.files[p])
				.map((p) => url(assets, p))
				.join(',');
			if (!sources) continue;
			const { family, src, ...descriptors } = f;
			try {
				const face = new FontFace(
					family,
					sources,
					descriptors as FontFaceDescriptors,
				);
				activeFonts.push(face);
				document.fonts.add(face);
				void face.load().catch(() => {
					root.dataset.fontError = `Could not decode ${family}`;
				});
			} catch {
				root.dataset.fontError = `Could not load ${family}`;
			}
		}
	}
	const face = theme.fonts?.[fontIndex];
	for (const node of root.querySelectorAll<HTMLElement>('[data-font-sample]')) {
		node.style.fontFamily = face ? `"${face.family}",system-ui` : '';
		node.style.fontWeight = face?.weight?.split(' ')[0] || '';
		node.style.fontStyle = face?.style || '';
		node.style.fontStretch = face?.stretch?.split(' ')[0] || '';
	}
	const settings = theme.recommendedOsSettings ?? {};
	const accents: Record<string, string> = {
		pulse: '#f252fc',
		nebula: '#ec9bff',
		sirius: '#9af2ff',
		lagoon: '#9f98ff',
		'wp-blue': '#2271b1',
		indigo: '#3858e9',
		teal: '#04a4cc',
		emerald: '#059669',
		amber: '#d97706',
		rose: '#e11d48',
	};
	for (const node of root.querySelectorAll<HTMLElement>(
		'[data-layout-board]',
	)) {
		const c = accents[String(settings.accent)];
		if (c) node.style.setProperty('--os-ui-accent', c);
		else node.style.removeProperty('--os-ui-accent');
	}
	for (const node of root.querySelectorAll<HTMLElement>(
		'[data-layout-board],.mock-desktop',
	)) {
		node.dataset.layout = String(settings.desktopLayout ?? 'unified');
		node.dataset.dockPosition =
			settings.desktopLayout === 'classic'
				? 'left'
				: String(settings.dockPlacement ?? 'bottom');
		node.dataset.dockSize = String(settings.dockSize ?? 'default');
		node.dataset.adminbar = String(settings.adminBarMode ?? 'static');
		node.dataset.radius = String(settings.windowRadius ?? 'default');
	}
}
