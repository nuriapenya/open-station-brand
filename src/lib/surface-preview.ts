import { helpFor } from './token-help';
import { previewGroups } from './preview-groups';
import { prepareStationFrame } from './station-preview';
import {
	surfaces,
	surfaceTokens,
	tokensForSurface,
} from './surfaces';
import type { SurfaceToken } from './surfaces';
import { previewArtwork } from './preview-artwork';
import { tokenScene } from './token-scenes';
import {
	componentScene,
	populateComponents,
	prepareComponentState,
} from './component-scenes';
const el = (tag: string, cls: string, text?: string) => {
	const e = document.createElement(tag);
	e.className = cls;
	if (text) e.textContent = text;
	return e;
};
/** Every property is shown on a named component part, never a generic CSS box. */
export function createTokenDemo(
	t: SurfaceToken,
	related: SurfaceToken[] = [t],
	overview = false,
): HTMLElement {
	const recipe = tokenScene(t);
	const component = componentScene(t);
	const stage = el('div', 'token-demo semantic-demo');
	stage.dataset.demoToken = t.name;
	stage.classList.toggle('overview-demo', overview);
	stage.dataset.property = t.previewProperty;
	stage.dataset.previewSource = component ? 'component' : 'shell-sketch';
	stage.style.setProperty('--studio-inspected-token', `var(${t.name})`);
	const viewport = el('div', 'scene-viewport');
	const frame = el('div', 'scene-frame');
	frame.dataset.family = recipe.family;
	frame.inert = true;
	frame.setAttribute('aria-hidden', 'true');
	frame.innerHTML = component ?? recipe.html;
	if (component) {
		frame.classList.add('real-component');
		if (overview)
			frame.querySelector('os-category-picker')?.removeAttribute('open');
		populateComponents(frame, t);
		for (const node of frame.querySelectorAll<HTMLElement>('*')) {
			if (!node.localName.startsWith('os-')) continue;
			node.dataset.boundToken = t.name;
		}
		prepareStationFrame(frame);
		// Components render on microtasks. Apply state fixtures after that render.
		queueMicrotask(() => prepareComponentState(frame, t));
		// Nested custom elements can render once more after their parent connects.
		requestAnimationFrame(() => {
			if (frame.isConnected) prepareComponentState(frame, t);
		});
	} else {
		const primary = t;
		for (const t of [
			...related.filter((other) => other.name !== primary.name),
			primary,
		]) {
			const recipe = tokenScene(t);
			const targets = frame.querySelectorAll<HTMLElement>(
				`[data-part="${recipe.part}"]`,
			);
			if (!targets.length && t.name === primary.name)
				throw new Error(`Missing preview part ${recipe.part} for ${t.name}`);
			for (const target of targets) {
				const cornerSide = t.name.match(
					/--os-window-corner-(ne|nw|se|sw)-image/,
				)?.[1];
				if (cornerSide && !target.classList.contains(`sk-corner-${cornerSide}`))
					continue;
				target.dataset.boundToken = t.name;
				if (t.name.startsWith('--os-admin-bar-')) continue;
				target.style.setProperty(t.previewProperty, t.previewValue);
				if (t.name === '--os-window-corner-inset') {
					target.style.removeProperty(t.previewProperty);
					const end = /sk-corner-(ne|se)/.test(target.className);
					const bottom = /sk-corner-(sw|se)/.test(target.className);
					target.style.setProperty(
						end ? 'inset-inline-end' : 'inset-inline-start',
						t.previewValue,
					);
					target.style.setProperty(
						bottom ? 'inset-block-end' : 'inset-block-start',
						t.previewValue,
					);
				}
				if (
					t.name === '--os-window-corner-size' ||
					t.name === '--os-icon-image-size'
				)
					target.style.height = t.previewValue;
				if (t.name.startsWith('--os-dock-indicator-')) {
					const dock = frame.querySelector<HTMLElement>('.sk-dock')!;
					dock.style.cssText =
						'flex-direction:row;width:280px;height:56px;justify-content:center';
					Object.assign(target.style, {
						inset: 'auto auto -5px 10px',
						width: '180px',
						height: '5px',
					});
					target.style.setProperty(t.previewProperty, t.previewValue);
				}

				if (/(?:animation|transition)/.test(t.previewProperty)) {
					if (t.name === '--os-admin-bar-slide') {
						target.style.animation = 'none';
						target.classList.add('adminbar-slide-demo');
						target.style.transition =
							'inset-block-start var(--os-admin-bar-slide, 180ms) ease';
						continue;
					}
					target.style.animationName = 'studio-scene-enter';
					if (!/duration/.test(t.previewProperty))
						target.style.animationDuration = '1.2s';
					target.style.animationIterationCount = 'infinite';
					target.style.animationDirection = 'alternate';
				}
			}
		}
	}
	if (t.name.startsWith('--os-admin-bar-')) {
		const target = frame.querySelector<HTMLElement>('.sk-adminbar')!;
		target.classList.add('adminbar-slide-demo');
		frame.classList.toggle(
			'show-reveal-zone',
			t.name === '--os-admin-bar-reveal-zone',
		);
		target.style.transition =
			'inset-block-start var(--os-admin-bar-slide, 180ms) ease';
		let last = 0;
		const animate = (time: number) => {
			if (!stage.isConnected) return;
			const period = Math.max(
				1100,
				parseFloat(getComputedStyle(target).transitionDuration) * 1000 + 650,
			);
			if (time - last > period) {
				target.classList.toggle('is-revealed');
				last = time;
			}
			requestAnimationFrame(animate);
		};
		requestAnimationFrame(animate);
	}
	previewArtwork(stage, frame, t);
	viewport.append(frame);
	const caption = el(
		'div',
		'scene-caption',
		overview
			? t.surface
			: recipe.label === recipe.part
				? (helpFor(t.name)?.title ?? recipe.label)
				: recipe.label,
	);
	caption.title = component
		? 'Local copy of the real web component'
		: 'Independent desktop shell sketch';
	stage.append(viewport, caption);
	return stage;
}
export class SurfaceAtlas {
	private current: string | null = null;
	constructor(
		private host: HTMLElement,
		private selectSurface: (surface: string) => void,
		private selectToken: (name: string) => void,
	) {
		this.showAll();
	}
	showAll(): void {
		this.current = null;
		this.host.replaceChildren();
		const heading = el('header', 'atlas-heading');
		heading.append(
			el('span', 'eyebrow', 'EVERY SURFACE'),
			el('h2', '', 'Explore your whole theme'),
			el(
				'p',
				'',
				`${surfaceTokens.length} properties across ${surfaces.length} visual inspectors. Choose a surface, then a detail or state.`,
			),
		);
		this.host.append(heading);
		const grid = el('div', 'surface-grid');
		for (const name of surfaces) {
			const tokens = tokensForSurface(name);
			const button = document.createElement('button');
			button.className = 'surface-card';
			button.dataset.surface = name;
			button.setAttribute(
				'aria-label',
				`Inspect ${name}, ${tokens.length} properties`,
			);
			const representative =
				tokens.find((t) => t.previewKind === 'surface') ?? tokens[0];
			button.append(
				createTokenDemo(representative, [representative], true),
				el('strong', '', name),
				el(
					'span',
					'',
					`${tokens.length} properties · ${new Set(tokens.map((t) => t.state)).size} states`,
				),
			);
			button.addEventListener('click', () => {
				this.selectSurface(name);
				this.showSurface(name);
			});
			grid.append(button);
		}
		this.host.append(grid);
	}
	showSurface(name: string): void {
		this.current = name;
		this.host.replaceChildren();
		const heading = el('header', 'atlas-heading');
		const back = el('button', 'text-button', '← All surfaces');
		back.addEventListener('click', () => this.showAll());
		heading.append(
			back,
			el('h2', '', name),
			el(
				'p',
				'',
				'Related properties share one live preview. Choose a property below it to edit; distinct states stay visible.',
			),
		);
		this.host.append(heading);
		const grid = el('div', 'property-grid');
		for (const group of previewGroups(name)) {
			const card = el('section', 'property-card');
			card.dataset.previewGroup = group.id;
			const demo = el('button', 'group-demo-button') as HTMLButtonElement;
			let active = group.tokens[0];
			demo.setAttribute('aria-label', `Edit ${group.title}, ${group.state}`);
			demo.append(createTokenDemo(active, group.tokens));
			demo.addEventListener('click', () => this.selectToken(active.name));
			const description = el(
				'p',
				'group-description',
				helpFor(active.name)?.description,
			);
			const controls = el('div', 'group-properties');
			for (const token of group.tokens) {
				const button = el(
					'button',
					'group-property',
					helpFor(token.name)?.title ?? token.name,
				) as HTMLButtonElement;
				button.dataset.inspectToken = token.name;
				button.setAttribute('aria-label', `Edit ${token.name}`);
				button.setAttribute('aria-pressed', String(token === active));
				button.title = helpFor(token.name)?.description ?? token.name;
				button.addEventListener('click', () => {
					active = token;
					for (const sibling of controls.children)
						sibling.setAttribute('aria-pressed', String(sibling === button));
					demo.replaceChildren(createTokenDemo(token, group.tokens));
					description.textContent = helpFor(token.name)?.description ?? '';
					this.selectToken(token.name);
				});
				controls.append(button);
			}
			card.append(
				demo,
				el('strong', '', group.title),
				el(
					'span',
					'property-state',
					`${group.state} · ${group.tokens.length} properties`,
				),
				controls,
				description,
			);
			grid.append(card);
		}
		this.host.append(grid);
	}
	selectedSurface(): string | null {
		return this.current;
	}
}
