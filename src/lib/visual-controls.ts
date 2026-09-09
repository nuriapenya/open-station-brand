import { colorButton, resolveColor } from './color-picker';
import { colorValues, toCSS } from './color';
import type { Token } from './theme';

/** Small visual editors emit plain CSS values; the shared validator owns acceptance. */
export function visualControls(
	token: Token,
	current: string,
	onChange: (value: string) => void,
	scope: HTMLElement,
	getCurrent: () => string = () => current,
): HTMLElement | null {
	const colorsOf = (value: string) =>
		colorValues(value).flatMap((c) => {
			const resolved = resolveColor(c, scope);
			return resolved ? [toCSS(resolved)] : [];
		});
	const panel = document.createElement('div');
	panel.className = 'visual-controls';
	const label = (text: string, control: HTMLElement) => {
		const wrapper = document.createElement('label');
		wrapper.append(document.createTextNode(text), control);
		panel.append(wrapper);
	};
	const range = (
		name: string,
		min: number,
		max: number,
		value: number,
		step: string,
		onInput: (value: number) => void,
	) => {
		const wrapper = document.createElement('div');
		wrapper.className = 'visual-range';
		const input = document.createElement('input');
		input.type = 'range';
		input.min = String(min);
		input.max = String(max);
		input.step = step;
		input.value = String(value);
		input.setAttribute('aria-label', `${name} for ${token.name}`);
		const output = document.createElement('output');
		output.textContent = String(value);
		input.addEventListener('input', () => {
			output.textContent = input.value;
			onInput(Number(input.value));
		});
		wrapper.append(input, output);
		label(name, wrapper);
	};
	if (token.kind === 'font') {
		const select = document.createElement('select');
		select.setAttribute('aria-label', `Choose ${token.name} typeface`);
		const fonts = [
			['Geist', "'Geist', system-ui, sans-serif"],
			['Geist Mono', "'Geist Mono', ui-monospace, monospace"],
			['System sans', 'system-ui, sans-serif'],
			['Classic serif', 'Georgia, serif'],
			['Monospace', 'ui-monospace, monospace'],
		];
		for (const [name, v] of fonts)
			select.add(
				new Option(
					name,
					token.property === 'font' && token.name !== '--os-font'
						? '13px/1.5 ' + v
						: v,
				),
			);
		select.value = current;
		if (!select.value) {
			select.add(new Option('Custom typeface', current));
			select.value = current;
		}
		select.addEventListener('change', () => onChange(select.value));
		label('Typeface', select);
		return panel;
	}
	if (token.kind === 'gradient') {
		// Preserve complex existing gradients until the user chooses a visual change.
		const colors = colorsOf(current);
		let first = colors[0] ?? '#0c0b0f',
			last = colors.at(-1) ?? '#ec9bff';
		let angle = Number(current.match(/gradient\(\s*([\d.]+)deg/)?.[1] || 160);
		const emit = () =>
			onChange(`linear-gradient(${angle}deg, ${first} 0%, ${last} 100%)`);
		const stops = document.createElement('div');
		stops.className = 'gradient-stops';
		for (const i of [0, 1]) {
			const picker = colorButton({
				label: `${i ? 'End' : 'Start'} color for ${token.name}`,
				getValue: () => {
					const values = colorsOf(getCurrent());
					return values.length
						? i
							? values.at(-1)!
							: values[0]
						: i
							? last
							: first;
				},
				scope,
				onChange: (value) => {
					const values = colorsOf(getCurrent());
					if (values.length) {
						first = values[0];
						last = values.at(-1)!;
					}
					if (i) last = value;
					else first = value;
					emit();
				},
			});
			stops.append(picker);
		}
		label('Two-color gradient', stops);
		range('Angle', 0, 360, angle, '1', (v) => {
			const colors = colorsOf(getCurrent());
			if (colors.length) {
				first = colors[0];
				last = colors.at(-1)!;
			}
			angle = v;
			emit();
		});
		const hint = document.createElement('small');
		hint.textContent =
			'Changing these controls creates a two-color gradient. The value field supports more stops.';
		panel.append(hint);
		return panel;
	}
	if (token.kind === 'shadow') {
		const geometry = () => {
			const value = getCurrent();
			const withoutColors = colorValues(value).reduce(
				(text, c) => text.replace(c, ''),
				value,
			);
			const lengths = [
				...withoutColors
					.split(',')[0]
					.matchAll(/(?:^|\s)(-?(?:\d*\.)?\d+(?:px)?)(?=\s|$)/g),
			].map((m) => parseFloat(m[1]));
			return [
				lengths[0] ?? 0,
				lengths[1] ?? 8,
				lengths[2] ?? 32,
				lengths[3] ?? 0,
			];
		};
		let color = colorsOf(current)[0] ?? '#000000';
		const emit = (preserveColor = true, index?: number, value?: number) => {
			if (preserveColor) color = colorsOf(getCurrent())[0] ?? color;
			const lengths = geometry();
			if (index !== undefined) lengths[index] = value!;
			onChange(`${lengths.map((n) => n + 'px').join(' ')} ${color}`);
		};
		const initial = geometry();
		range('Horizontal', -40, 40, initial[0], '1', (v) => emit(true, 0, v));
		range('Vertical', -40, 40, initial[1], '1', (v) => emit(true, 1, v));
		range('Blur', 0, 100, initial[2], '1', (v) => emit(true, 2, v));
		range('Spread', -20, 40, initial[3], '1', (v) => emit(true, 3, v));
		const picker = colorButton({
			label: `Shadow color for ${token.name}`,
			getValue: () => colorsOf(getCurrent())[0] ?? color,
			scope,
			onChange: (v) => {
				const value = getCurrent();
				const existing = colorValues(value).find((c) => resolveColor(c, scope));
				color = v;
				// A color edit preserves the current geometry, inset and other layers.
				if (existing) onChange(value.replace(existing, v));
				else emit(false);
			},
		});
		label('Shadow color', picker);
		const hint = document.createElement('small');
		hint.textContent =
			'These controls create one shadow. Use the value field for layered shadows.';
		panel.append(hint);
		return panel;
	}
	if (token.kind === 'color') {
		const swatches = document.createElement('div');
		swatches.className = 'quick-colors';
		for (const c of [
			'#f252fc',
			'#ec9bff',
			'#c2f1f1',
			'#93f0c6',
			'#fffbff',
			'#1a1721',
			'#0c0b0f',
		]) {
			const b = document.createElement('button');
			b.type = 'button';
			b.style.background = c;
			b.title = c;
			b.setAttribute('aria-label', `Use ${c} for ${token.name}`);
			b.addEventListener('click', () => {
				const next = resolveColor(c, scope)!;
				next.a = resolveColor(getCurrent(), scope)?.a ?? 1;
				onChange(toCSS(next));
			});
			swatches.append(b);
		}
		label('Quick palette', swatches);
		return panel;
	}
	return null;
}
