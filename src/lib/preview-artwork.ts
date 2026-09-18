import contract from '../data/theme-contract.json';
import type { SurfaceToken } from './surfaces';
const sample = 'url("../assets/studio/textures/graphite.png")';
/** A labeled sample makes artwork placement editable before a file is uploaded. */
export function previewArtwork(
	stage: HTMLElement,
	frame: HTMLElement,
	t: SurfaceToken,
): void {
	if (
		!/background-(image|position|repeat|size)|border-image/.test(
			t.previewProperty,
		)
	)
		return;
	const slot = [...contract.textures]
		.sort((a, b) => b.property.length - a.property.length)
		.find((d) => t.name.startsWith(d.property));
	if (!slot) return;
	const source =
		slot.property + (slot.type === 'border-image' ? '-source' : '');
	const asset = `--studio-art${source}`;
	frame.style.setProperty(source, `var(${asset},${sample})`);
	if (t.name === source)
		stage.style.setProperty(
			'--studio-inspected-token',
			`var(${asset},${sample})`,
		);
	stage.style.setProperty(
		'--scene-art-caption',
		`var(--studio-art-label${source}," · sample artwork")`,
	);
	stage.dataset.artworkSource = source;
	for (const target of frame.querySelectorAll<HTMLElement>(
		'[data-bound-token]',
	)) {
		if (target.localName.startsWith('os-')) continue;
		target.style.setProperty(
			slot.type === 'border-image' ? 'border-image-source' : 'background-image',
			`var(${source})`,
		);
		if (slot.type === 'border-image') {
			target.style.borderStyle = 'solid';
			target.style.borderWidth = '5px';
			if (t.previewProperty !== 'border-image-slice')
				target.style.borderImageSlice = '12';
			if (t.previewProperty !== 'border-image-width')
				target.style.borderImageWidth = '5px';
		}
	}
}
