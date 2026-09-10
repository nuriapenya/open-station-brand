import catalog from '../data/alcazaba-tokens.json';

// Station declares its palette on the shell. Component fallbacks and variant
// declarations stay inside the real components instead of becoming global overrides.
const localTokens = catalog.tokens.filter(
	(t) =>
		!t.name.includes('image') &&
		!(
			t.defaultSource.file === 'assets/css/variables.css' &&
			t.defaultSource.selector === 'body.os-active' &&
			t.defaultSource.kind === 'declaration'
		),
);
let overrides: Record<string, string> = {};
const applied = new WeakMap<HTMLElement, Set<string>>();
export function stationOverrides(values: Record<string, string>): void {
	overrides = values;
}
export function applyComponentOverrides(el: HTMLElement): void {
	for (const name of applied.get(el) ?? [])
		if (!(name in overrides)) el.style.removeProperty(name);
	for (const [name, value] of Object.entries(overrides))
		el.style.setProperty(name, value);
	applied.set(el, new Set(Object.keys(overrides)));
}
export function prepareStationFrame(frame: HTMLElement): void {
	for (const token of localTokens)
		frame.style.setProperty(token.name, overrides[token.name] ?? 'initial');
	function walk(root: ParentNode) {
		for (const el of root.querySelectorAll<HTMLElement>('*'))
			if (el.localName.startsWith('os-')) {
				applyComponentOverrides(el);
				if (el.shadowRoot) walk(el.shadowRoot);
			}
	}
	walk(frame);
}
