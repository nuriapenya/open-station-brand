/** Independent animation sketches for the built-in reveal names. */
export function replayReveal(
	sheet: HTMLElement,
	mode: string,
	duration: number,
): void {
	sheet.getAnimations({ subtree: true }).forEach((a) => a.cancel());
	sheet.replaceChildren();
	sheet.style.opacity = '1';
	sheet.style.clipPath = 'none';
	sheet.style.background = 'none';
	sheet.dataset.reveal = mode;
	if (
		mode === 'none' ||
		matchMedia('(prefers-reduced-motion: reduce)').matches
	) {
		sheet.style.opacity = '0';
		return;
	}
	const paths: Record<string, [string, string]> = {
		iris: ['circle(150% at 50% 50%)', 'circle(0% at 50% 50%)'],
		diamond: [
			'polygon(50% -50%,150% 50%,50% 150%,-50% 50%)',
			'polygon(50% 50%,50% 50%,50% 50%,50% 50%)',
		],
		diagonal: ['polygon(0 0,200% 0,0 200%)', 'polygon(0 0,0 0,0 0)'],
		rise: ['inset(0 0 0 0)', 'inset(0 0 100% 0)'],
		curtain: ['inset(0 0 0 0)', 'inset(0 50% 0 50%)'],
		sweep: ['inset(0 0 0 0)', 'inset(0 0 0 100%)'],
	};
	if (paths[mode]) {
		sheet.style.background = 'var(--os-ui-accent,#ec9bff)';
		sheet.animate(
			paths[mode].map((clipPath) => ({ clipPath })),
			{ duration, fill: 'forwards', easing: 'ease-in-out' },
		);
		return;
	}
	if (mode === 'radar') {
		sheet.style.background = 'var(--os-ui-accent,#ec9bff)';
		const frames: Keyframe[] = [];
		for (let step = 0; step <= 36; step++) {
			const points = ['50% 50%'];
			for (let a = step * 10; a <= 360; a += 10) {
				const r = ((a - 90) * Math.PI) / 180;
				points.push(`${50 + 150 * Math.cos(r)}% ${50 + 150 * Math.sin(r)}%`);
			}
			points.push('50% 50%');
			frames.push({ clipPath: `polygon(${points.join(',')})` });
		}
		sheet.animate(frames, { duration, fill: 'forwards' });
		return;
	}
	if (!['shutter', 'blinds', 'slats', 'mosaic', 'obturator'].includes(mode)) {
		sheet.style.opacity = '0';
		return;
	}
	const count =
		mode === 'mosaic'
			? 24
			: mode === 'obturator'
				? 8
				: mode === 'shutter'
					? 2
					: 10;
	for (let i = 0; i < count; i++) {
		const cell = document.createElement('i');
		cell.style.position = 'absolute';
		cell.style.background = 'var(--os-ui-accent,#ec9bff)';
		cell.style.inset = '0';
		let end: Keyframe = { transform: 'scaleY(0)' };
		let delay = 0;
		if (mode === 'mosaic') {
			Object.assign(cell.style, {
				inset: 'auto',
				left: `${((i % 6) * 100) / 6}%`,
				top: `${Math.floor(i / 6) * 25}%`,
				width: '17%',
				height: '26%',
			});
			end = { transform: 'scale(0)', opacity: 0 };
			delay = ((i % 6) + Math.floor(i / 6)) * duration * 0.035;
		} else if (mode === 'slats') {
			Object.assign(cell.style, {
				inset: 'auto',
				left: `${i * 10}%`,
				top: '0',
				width: '10.1%',
				height: '100%',
				transformOrigin: 'left',
			});
			end = { transform: 'scaleX(0)' };
			delay = i * duration * 0.025;
		} else if (mode === 'blinds') {
			Object.assign(cell.style, {
				inset: 'auto',
				left: '0',
				top: `${i * 10}%`,
				width: '100%',
				height: '10.1%',
				transformOrigin: 'top',
			});
		} else if (mode === 'shutter') {
			Object.assign(cell.style, {
				inset: 'auto',
				left: '0',
				top: `${i * 50}%`,
				width: '100%',
				height: '50%',
				transformOrigin: i ? 'bottom' : 'top',
			});
		} else {
			cell.style.clipPath = 'polygon(50% 50%,-50% -150%,150% -150%)';
			cell.style.transformOrigin = '50% 50%';
			cell.style.transform = `rotate(${i * 45}deg)`;
			end = { transform: `rotate(${i * 45 + 65}deg) scale(0)`, opacity: 0 };
		}
		sheet.append(cell);
		cell.animate([{ transform: cell.style.transform || 'none' }, end], {
			duration: duration - delay,
			delay,
			fill: 'forwards',
			easing: 'ease-in-out',
		});
	}
}
