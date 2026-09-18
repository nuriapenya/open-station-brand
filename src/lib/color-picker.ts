import {
	clamp,
	parseRGBA,
	toCSS,
	toHex,
	rgbToHSV,
	hsvToRGB,
	type RGBA,
	type HSV,
} from './color';
/** Resolve inherited and modern CSS colors in the same scope as the mock, retaining alpha. */
export function resolveColor(value: string, scope: HTMLElement): RGBA | null {
	const direct = parseRGBA(value);
	if (direct) return direct;
	if (!CSS.supports('color', value)) return null;
	const sample = document.createElement('span');
	sample.style.color = value;
	sample.hidden = true;
	scope.append(sample);
	sample.style.setProperty('--studio-color-probe', value);
	const styles = getComputedStyle(sample);
	const expanded = styles.getPropertyValue('--studio-color-probe').trim();
	if (
		value.includes('var(') &&
		(!expanded || !CSS.supports('color', expanded))
	) {
		sample.remove();
		return null;
	}
	const computed = styles.color;
	sample.remove();
	const parsed = parseRGBA(computed);
	if (parsed) return parsed;
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 1;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return null;
	ctx.clearRect(0, 0, 1, 1);
	ctx.fillStyle = computed;
	ctx.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
	return { r, g, b, a: a / 255 };
}
interface Options {
	label: string;
	getValue: () => string;
	onChange: (value: string) => void;
	scope: HTMLElement;
	onCommit?: () => void;
}
export type ColorButton = HTMLButtonElement & { refreshColor: () => void };
export function colorButton(options: Options): ColorButton {
	const button = document.createElement('button') as ColorButton;
	button.type = 'button';
	button.className = 'color-swatch';
	button.setAttribute('aria-label', options.label);
	button.setAttribute('aria-haspopup', 'dialog');
	const ink = document.createElement('span');
	button.append(ink);
	button.refreshColor = () => {
		const c = resolveColor(options.getValue(), options.scope);
		ink.style.background = c ? toCSS(c) : 'transparent';
		button.title = c
			? `${toHex(c)} · ${Number((c.a * 100).toFixed(2))}% opacity`
			: 'Choose a color';
	};
	button.refreshColor();
	button.addEventListener('click', () => {
		picker ??= new ColorPicker();
		picker.open(options, button);
	});
	return button;
}
let picker: ColorPicker | undefined;
class ColorPicker {
	private dialog: HTMLDialogElement;
	private options!: Options;
	private trigger!: ColorButton;
	private rgb: RGBA = { r: 236, g: 155, b: 255, a: 1 };
	private hsv: HSV = rgbToHSV(this.rgb);
	private initial = '';
	private area: HTMLElement;
	private marker: HTMLElement;
	private hue: HTMLInputElement;
	private alpha: HTMLInputElement;
	private saturation: HTMLInputElement;
	private brightness: HTMLInputElement;
	private hex: HTMLInputElement;
	private opacity: HTMLInputElement;
	private channels: HTMLInputElement[];
	private error: HTMLElement;
	constructor() {
		this.dialog = document.createElement('dialog');
		this.dialog.id = 'color-picker-dialog';
		this.dialog.className = 'color-picker-dialog';
		this.dialog.setAttribute('aria-labelledby', 'color-picker-title');
		this.dialog.innerHTML = `<header class="color-picker-heading"><div><span class="eyebrow">LIVE COLOR</span><h2 id="color-picker-title">Choose a color</h2></div><button type="button" class="icon-button" data-color-close aria-label="Close color picker">×</button></header><div class="color-sv" tabindex="0" role="group" aria-label="Saturation and brightness. Arrow keys adjust; Shift makes larger steps." aria-describedby="color-sv-help"><i></i></div><p id="color-sv-help" class="color-sv-help">Drag to choose a shade · arrow keys to fine-tune</p><div class="color-track-row"><label>Hue<input type="range" min="0" max="360" step="1" class="color-hue" aria-label="Color hue"/></label></div><div class="color-track-row"><label>Opacity <output data-alpha-output></output><input type="range" min="0" max="100" step="0.1" class="color-alpha" aria-label="Color opacity"/></label></div><div class="color-value-row"><label>Hex<input class="color-hex" aria-label="Color hex" spellcheck="false" maxlength="9"/></label><label>Opacity %<input class="color-opacity" type="number" min="0" max="100" step="0.1" aria-label="Color opacity percent"/></label></div><div class="color-rgb-row">${['Red', 'Green', 'Blue'].map((c) => `<label>${c}<input type="number" min="0" max="255" step="1" aria-label="Color ${c.toLowerCase()}"/></label>`).join('')}</div><details class="color-fine"><summary>Saturation &amp; brightness</summary><label>Saturation<input type="range" min="0" max="100" step="0.1" aria-label="Color saturation"/></label><label>Brightness<input type="range" min="0" max="100" step="0.1" aria-label="Color brightness"/></label></details><p class="field-error" role="alert"></p><footer class="color-picker-footer"><div class="color-comparison"><button type="button" data-color-original aria-label="Restore opening color" title="Restore opening color"><i></i></button><span data-color-current><i></i></span></div><small>Original / current<br/>Changes appear live</small><button type="button" class="export-button" data-color-close>Done</button></footer>`;
		document.body.append(this.dialog);
		const get = <T extends HTMLElement>(s: string) =>
			this.dialog.querySelector<T>(s)!;
		this.area = get('.color-sv');
		this.marker = get('.color-sv i');
		this.hue = get('.color-hue');
		this.alpha = get('.color-alpha');
		this.hex = get('.color-hex');
		this.opacity = get('.color-opacity');
		this.saturation = get('[aria-label="Color saturation"]');
		this.brightness = get('[aria-label="Color brightness"]');
		this.channels = ['red', 'green', 'blue'].map((c) =>
			get(`[aria-label="Color ${c}"]`),
		);
		this.error = get('.field-error');
		for (const b of this.dialog.querySelectorAll('[data-color-close]'))
			b.addEventListener('click', () => this.dialog.close());
		this.dialog.addEventListener('close', () => {
			this.options.onCommit?.();
			this.trigger.refreshColor();
		});
		const pointer = (e: PointerEvent) => {
			const rect = this.area.getBoundingClientRect();
			this.hsv.s = clamp((e.clientX - rect.left) / rect.width);
			this.hsv.v = 1 - clamp((e.clientY - rect.top) / rect.height);
			this.emitHSV();
		};
		this.area.addEventListener('pointerdown', (e) => {
			if (e.button !== 0) return;
			this.area.focus();
			this.area.setPointerCapture(e.pointerId);
			pointer(e);
		});
		this.area.addEventListener('pointermove', (e) => {
			if (this.area.hasPointerCapture(e.pointerId)) pointer(e);
		});
		this.area.addEventListener('pointerup', (e) => {
			if (this.area.hasPointerCapture(e.pointerId))
				this.area.releasePointerCapture(e.pointerId);
		});
		this.area.addEventListener('keydown', (e) => {
			if (!e.key.startsWith('Arrow')) return;
			e.preventDefault();
			const step = e.shiftKey ? 0.1 : 0.01;
			if (e.key === 'ArrowLeft') this.hsv.s = clamp(this.hsv.s - step);
			if (e.key === 'ArrowRight') this.hsv.s = clamp(this.hsv.s + step);
			if (e.key === 'ArrowUp') this.hsv.v = clamp(this.hsv.v + step);
			if (e.key === 'ArrowDown') this.hsv.v = clamp(this.hsv.v - step);
			this.emitHSV();
		});
		this.hue.addEventListener('input', () => {
			this.hsv.h = +this.hue.value;
			this.emitHSV();
		});
		this.saturation.addEventListener('input', () => {
			this.hsv.s = +this.saturation.value / 100;
			this.emitHSV();
		});
		this.brightness.addEventListener('input', () => {
			this.hsv.v = +this.brightness.value / 100;
			this.emitHSV();
		});
		this.alpha.addEventListener('input', () => {
			this.rgb.a = +this.alpha.value / 100;
			this.emit();
		});
		this.opacity.addEventListener('input', () => {
			if (!this.opacity.value || !this.opacity.validity.valid) return;
			this.rgb.a = +this.opacity.value / 100;
			this.emit();
		});
		this.channels.forEach((field, i) =>
			field.addEventListener('input', () => {
				if (!field.value || !field.validity.valid) return;
				this.rgb[(['r', 'g', 'b'] as const)[i]] = +field.value;
				this.hsv = rgbToHSV(this.rgb);
				this.emit();
			}),
		);
		this.hex.addEventListener('input', () => {
			const text = this.hex.value.startsWith('#')
				? this.hex.value
				: '#' + this.hex.value;
			const parsed = parseRGBA(text);
			const valid = /^#[\da-f]{6}([\da-f]{2})?$/i.test(text);
			this.hex.setAttribute('aria-invalid', String(!valid));
			this.error.textContent = valid
				? ''
				: 'Use six hex digits, or eight to include alpha.';
			if (valid && parsed) {
				if (text.length === 7) parsed.a = this.rgb.a;
				this.rgb = parsed;
				this.hsv = rgbToHSV(parsed);
				this.emit();
			}
		});
		get('[data-color-original]').addEventListener('click', () => {
			const c = resolveColor(this.initial, this.options.scope);
			if (c) {
				this.rgb = c;
				this.hsv = rgbToHSV(c);
				this.emit();
			}
		});
	}
	open(options: Options, trigger: ColorButton): void {
		this.options = options;
		this.trigger = trigger;
		this.initial = options.getValue();
		this.rgb = resolveColor(this.initial, options.scope) ?? {
			r: 236,
			g: 155,
			b: 255,
			a: 1,
		};
		this.hsv = rgbToHSV(this.rgb);
		this.error.textContent = '';
		this.hex.removeAttribute('aria-invalid');
		this.dialog.querySelector('h2')!.textContent = options.label
			.replace(/^Pick /, '')
			.replace(/ color$/, '');
		(
			this.dialog.querySelector('[data-color-original] i') as HTMLElement
		).style.background = toCSS(this.rgb);
		this.paint();
		this.dialog.showModal();
		this.area.focus();
	}
	private emitHSV(): void {
		this.rgb = hsvToRGB(this.hsv, this.rgb.a);
		this.emit();
	}
	private emit(): void {
		this.error.textContent = '';
		this.hex.setAttribute('aria-invalid', 'false');
		this.options.onChange(toCSS(this.rgb));
		this.trigger.refreshColor();
		this.paint();
	}
	private paint(): void {
		this.area.style.setProperty('--picker-hue', String(this.hsv.h));
		this.marker.style.left = this.hsv.s * 100 + '%';
		this.marker.style.top = (1 - this.hsv.v) * 100 + '%';
		this.area.setAttribute(
			'aria-description',
			`Saturation ${Math.round(this.hsv.s * 100)}%, brightness ${Math.round(this.hsv.v * 100)}%`,
		);
		this.hue.value = String(this.hsv.h);
		this.alpha.value = String(this.rgb.a * 100);
		this.saturation.value = String(this.hsv.s * 100);
		this.brightness.value = String(this.hsv.v * 100);
		this.alpha.style.setProperty('--alpha-solid', toHex(this.rgb, false));
		if (document.activeElement !== this.hex) this.hex.value = toHex(this.rgb);
		if (document.activeElement !== this.opacity)
			this.opacity.value = String(Number((this.rgb.a * 100).toFixed(3)));
		this.channels.forEach((f, i) => {
			if (document.activeElement !== f)
				f.value = String(this.rgb[(['r', 'g', 'b'] as const)[i]]);
		});
		this.dialog.querySelector('[data-alpha-output]')!.textContent =
			Number((this.rgb.a * 100).toFixed(1)) + '%';
		(
			this.dialog.querySelector('[data-color-current] i') as HTMLElement
		).style.background = toCSS(this.rgb);
	}
}
