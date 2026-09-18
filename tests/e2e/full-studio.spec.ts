import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { unzipSync, strFromU8, zipSync, strToU8 } from 'fflate';
import contract from '../../src/data/theme-contract.json' with { type: 'json' };
import { surfaceTokens } from '../../src/lib/surfaces';
const png = new PNG({ width: 40, height: 40 });
for (let i = 0; i < png.data.length; i += 4) {
	png.data[i] = 200;
	png.data[i + 1] = 80;
	png.data[i + 2] = 230;
	png.data[i + 3] = i % 12 ? 255 : 0;
}
const art = PNG.sync.write(png);
const upload = { name: 'texture.png', mimeType: 'image/png', buffer: art };
const open = async (page: Page) => {
	await page.goto('/theme-creator/');
	await page.locator('.token-row').first().waitFor();
};
const mode = async (page: Page, key: string) =>
	page.locator(`[data-editor-mode="${key}"]`).click();
const change = async (page: Page, label: string, value: string) => {
	const field = page.getByLabel(label, { exact: true });
	await field.fill(value);
	await field.press('Tab');
};
const exportZip = async (page: Page) => {
	await page.locator('#export-button').click();
	const promise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Download ZIP' }).click();
	return unzipSync(readFileSync((await (await promise).path())!));
};
test('all 712 properties are reachable by clicking their surface specimens', async ({
	page,
}) => {
	test.setTimeout(90000);
	await open(page);
	await expect(page.locator('#detail-preview, #specimen')).toHaveCount(0);
	await page.locator('[data-scene=atlas]').click();
	const names = await page
		.locator('[data-surface]')
		.evaluateAll((nodes) =>
			nodes
				.filter((n) => n.matches('button'))
				.map((n) => (n as HTMLElement).dataset.surface!),
		);
	const seen: string[] = [];
	for (const name of names) {
		await page
			.locator('button[data-surface]')
			.filter({
				has: page.locator('strong', {
					hasText: new RegExp(
						'^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$',
					),
				}),
			})
			.click();
		const result = await page
			.locator('[data-inspect-token]')
			.evaluateAll((nodes) =>
				nodes.map((n) => {
					(n as HTMLButtonElement).click();
					const name = (n as HTMLElement).dataset.inspectToken!;
					(
						document.querySelector(
							`[data-token="${name}"] .token-help-button`,
						) as HTMLButtonElement
					).click();
					const hasHelp =
						document.querySelector('#help-token')?.textContent === name &&
						(document.querySelector('#help-description')?.textContent?.length ??
							0) > 45;
					(
						document.querySelector(
							'#token-help-dialog [data-close]',
						) as HTMLButtonElement
					).click();
					return {
						hasHelp,
						name,
						selected: document.querySelector<HTMLElement>('.token-row.selected')?.dataset.token,
						editable: !!document.querySelector(
							`[data-token="${name}"] input[type=text]`,
						),
						bound: !!n.closest('.property-card')?.querySelector(
							`[data-bound-token="${name}"]`,
						),
					};
				}),
			);
		for (const r of result) {
			expect(r.selected).toBe(r.name);
			expect(r.editable, r.name).toBe(true);
			expect(r.bound, r.name).toBe(true);
			expect(r.hasHelp, r.name).toBe(true);
			seen.push(r.name);
		}
		await page
			.getByRole('button', { name: '← All surfaces', exact: true })
			.click();
	}
	expect([...new Set(seen)].sort()).toEqual(
		surfaceTokens.map((t) => t.name).sort(),
	);
	// Resolve the declaration template with the actual browser's cascaded values.
	const invalid = await page.evaluate((tokens) => {
		const styles = getComputedStyle(document.querySelector('#preview')!);
		return tokens.flatMap((t) => {
			const expression = t.previewValue.replace(
				/var\((--[a-z0-9-]+),([^()]+)\)/g,
				(_, name, fallback) => styles.getPropertyValue(name).trim() || fallback,
			);
			return CSS.supports(t.previewProperty, expression)
				? []
				: [{ name: t.name, property: t.previewProperty, value: expression }];
		});
	}, surfaceTokens);
	expect(invalid).toEqual([]);
});
test('all texture and icon slots, fonts, wallpapers and settings retain assets through export and reload', async ({
	page,
}) => {
	test.setTimeout(90000);
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await open(page);
	await mode(page, 'textures');
	for (const slot of contract.textures) {
		await page
			.getByLabel('Texture surface', { exact: true })
			.selectOption(slot.id);
		await page
			.getByLabel('Upload texture', { exact: true })
			.setInputFiles(upload);
		await expect(
			page.locator(`[data-inspect-texture="${slot.id}"] [data-texture-slot]`),
		).toHaveAttribute('data-has-texture', 'true');
	}
	await page
		.getByLabel('Texture surface', { exact: true })
		.selectOption('TITLEBAR');
	await page.getByRole('button', { name: 'Tile', exact: true }).click();
	await change(page, 'Image size', '20px 20px');
	await page
		.getByLabel('Texture surface', { exact: true })
		.selectOption('WINDOW_CORNER_NE');
	await change(page, 'Corner ornament size', '38px');
	await expect(page.locator('.material-window .corner-ne')).toHaveCSS(
		'width',
		'38px',
	);
	await page
		.getByLabel('Texture surface', { exact: true })
		.selectOption('WINDOW_FRAME');
	await change(page, 'Frame slice values', '8 8 8 8 fill');
	await change(page, 'Frame width', '12px');
	await expect(page.locator('.frame-slice-demo')).toHaveCSS(
		'border-image-slice',
		'8 fill',
	);
	await mode(page, 'icons');
	for (const slot of contract.icons) {
		await page.getByLabel('Icon slot', { exact: true }).selectOption(slot);
		await page.getByLabel('Upload icon', { exact: true }).setInputFiles(upload);
		await expect(
			page.locator(`[data-inspect-icon="${slot}"] .icon-art`),
		).toHaveCount(1);
	}
	await change(page, 'Default icon tint', '#00ff88');
	await page.getByLabel('App icon slug', { exact: true }).fill('my-app');
	await page.getByRole('button', { name: 'Add app', exact: true }).click();
	await expect(page.locator('[data-inspect-icon="APP:my-app"]')).toBeVisible();
	await mode(page, 'fonts');
	await page
		.getByLabel('Add font face', { exact: true })
		.setInputFiles('fonts/Geist-Variable.woff2');
	await change(page, 'Font family', 'My Studio Font');
	await page
		.getByRole('button', { name: 'Use for interface', exact: true })
		.click();
	await expect(page.locator('[data-font-sample]')).toHaveCSS(
		'font-family',
		'"My Studio Font", system-ui',
	);
	await expect
		.poll(() =>
			page.evaluate(() => document.fonts.check('16px "My Studio Font"')),
		)
		.toBe(true);
	await mode(page, 'wallpapers');
	await page.getByLabel('Add wallpaper', { exact: true }).setInputFiles(upload);
	await change(page, 'Wallpaper name', 'My horizon');
	await expect(page.locator('.wallpaper-large')).toHaveCSS(
		'background-image',
		/blob:/,
	);
	await mode(page, 'layout');
	await page
		.getByLabel('Desktop layout', { exact: true })
		.selectOption('unified');
	await page.getByLabel('Dock position', { exact: true }).selectOption('right');
	await page.getByLabel('Dock size', { exact: true }).selectOption('large');
	await page
		.locator('#custom-controls')
		.getByLabel('Window corners', { exact: true })
		.selectOption('round');
	await page.getByLabel('Admin bar', { exact: true }).selectOption('hidden');
	await page
		.getByLabel('Dock renderer', { exact: true })
		.selectOption('default');
	await page
		.getByLabel('Accent swatch', { exact: true })
		.selectOption('emerald');
	await page
		.getByLabel('Window reveal', { exact: true })
		.selectOption('mosaic');
	await change(page, 'Reveal duration', '800');
	await expect(page.locator('.layout-window')).toHaveCSS(
		'border-radius',
		'24px',
	);
	await expect(page.locator('.layout-adminbar')).toHaveCSS(
		'visibility',
		'hidden',
	);
	await expect(page.locator('.layout-board')).toHaveAttribute(
		'data-dock-position',
		'right',
	);
	await mode(page, 'assets');
	await page
		.getByLabel('Add theme preview', { exact: true })
		.setInputFiles(upload);
	await page
		.getByLabel('Add license or readme', { exact: true })
		.setInputFiles({
			name: 'LICENSE.txt',
			mimeType: 'text/plain',
			buffer: Buffer.from('A license for the artwork'),
		});
	await expect(page.locator('#save-state')).toHaveText('Saved locally');
	const files = await exportZip(page);
	const theme = JSON.parse(strFromU8(files['theme.json']));
	expect(Object.keys(theme.textures)).toHaveLength(24);
	expect(Object.keys(theme.icons)).toHaveLength(28);
	expect(theme.fonts[0].family).toBe('My Studio Font');
	expect(theme.wallpapers[0].label).toBe('My horizon');
	expect(Object.keys(theme.recommendedOsSettings)).toHaveLength(9);
	for (const [path, bytes] of Object.entries(files))
		if (path.endsWith('.png')) expect(Buffer.from(bytes)).toEqual(art);
	await page.reload();
	await page.locator('.token-row').first().waitFor();
	const again = await exportZip(page);
	expect(again).toEqual(files);
	await page.locator('#import-file').setInputFiles({
		name: 'all.zip',
		mimeType: 'application/zip',
		buffer: Buffer.from(zipSync(files)),
	});
	await expect(page.locator('#toast')).toContainText('Imported');
	expect(await exportZip(page)).toEqual(files);
	expect(errors).toEqual([]);
});
test('focus inheritance, transparent icons, frame companions, undo and missing JSON assets', async ({
	page,
}) => {
	await open(page);
	const theme = {
		manifestVersion: 2,
		id: 'test',
		name: 'Inheritance',
		tokens: {},
		textures: {
			TITLEBAR: {
				type: 'image',
				path: 'image.png',
				size: '18px',
				repeat: 'repeat-x',
			},
			WINDOW_FRAME: {
				type: 'border-image',
				path: 'image.png',
				slice: '8',
				width: '9px',
			},
			WINDOW_FRAME_FOCUSED: { type: 'border-image', path: 'image.png' },
		},
		icons: {
			OS_SETTINGS: { type: 'image', path: 'image.png', color: 'none' },
			WINDOW_CONTROL_CLOSE: { type: 'image', path: 'image.png', color: 'none' },
		},
		iconColor: '#ff0000',
	};
	await page.locator('#import-file').setInputFiles({
		name: 'theme.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(theme)),
	});
	await expect(page.locator('#toast')).toContainText('missing');
	await page
		.getByLabel('Resolve image.png', { exact: true })
		.setInputFiles(upload);
	await page.locator('[data-scene=desktop]').click();
	await expect(page.locator('.mock-titlebar')).toHaveCSS(
		'background-size',
		'18px auto',
	);
	await expect(page.locator('.mock-window')).toHaveCSS(
		'border-image-width',
		'9px',
	);
	await expect(
		page.locator('[data-icon-slot=WINDOW_CONTROL_CLOSE] .icon-art'),
	).toHaveCSS('mask-image', /blob:/);
	await mode(page, 'icons');
	await expect(page.locator('[data-inspect-icon=OS_SETTINGS] img')).toHaveCount(
		1,
	);
	await page
		.getByLabel('Icon slot', { exact: true })
		.selectOption('OS_SETTINGS');
	await page
		.getByRole('button', { name: 'Restore default icon', exact: true })
		.click();
	await expect(page.locator('[data-inspect-icon=OS_SETTINGS] img')).toHaveCount(
		0,
	);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.locator('[data-inspect-icon=OS_SETTINGS] img')).toHaveCount(
		1,
	);
});
test('every built-in reveal has its own preview and mobile asset controls stay usable', async ({
	page,
}) => {
	await open(page);
	await mode(page, 'layout');
	for (const reveal of contract.settings.windowReveal.values) {
		await page
			.getByLabel('Window reveal', { exact: true })
			.selectOption(reveal);
		await page
			.getByRole('button', { name: 'Replay window reveal', exact: true })
			.click();
		await expect(page.locator('.reveal-sheet')).toHaveAttribute(
			'data-reveal',
			reveal,
		);
		if (reveal !== 'none')
			expect(
				await page
					.locator('.reveal-sheet')
					.evaluate((el) => el.getAnimations({ subtree: true }).length),
			).toBeGreaterThan(0);
	}
	await page.setViewportSize({ width: 390, height: 844 });
	await mode(page, 'textures');
	await page
		.getByLabel('Upload texture', { exact: true })
		.setInputFiles(upload);
	await page.getByLabel('Image size', { exact: true }).scrollIntoViewIfNeeded();
	await change(page, 'Image size', '24px');
	await expect(page.locator('#preview')).toBeInViewport();
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
	await page.screenshot({ path: test.info().outputPath('studio-mobile-material.png') });
});

test('token explanations are searchable and every visible token opens complete help', async ({
	page,
}) => {
	await open(page);
	await page.getByRole('searchbox').fill('reflection left or right');
	await expect(
		page.locator('[data-token="--os-ui-avatar-glare-x"]'),
	).toBeVisible();
	await page
		.locator('[data-token="--os-ui-avatar-glare-x"] .token-help-button')
		.click();
	await expect(page.locator('#token-help-dialog')).toBeVisible();
	await expect(page.locator('#help-title')).toHaveText(
		'Avatar reflection: horizontal position',
	);
	await expect(page.locator('#help-description')).toContainText('50%');
	await page.getByText('Default & source reference', { exact: true }).click();
	await expect(page.locator('#help-evidence')).toContainText(
		'os-avatar.styles.ts:',
	);
	await page.screenshot({ path: test.info().outputPath('studio-token-help.png') });
	await page
		.getByRole('button', { name: 'Close token help', exact: true })
		.click();
	await page
		.getByRole('searchbox')
		.fill('--os-window-border-image-focused-slice');
	await expect(
		page.locator('[data-token="--os-window-border-image-focused-slice"]'),
	).toBeVisible();
	await page.locator('.token-help-button').click();
	await expect(page.locator('#help-state')).toContainText('focused');
	await expect(page.locator('#help-input')).toContainText('slice offsets');
	await page.keyboard.press('Escape');
	await page.locator('[data-scene=atlas]').click();
	await page.getByRole('button', { name: /Inspect Avatar,/ }).click();
	await page.locator('[data-inspect-token="--os-ui-avatar-glare-x"]').click();
	await expect(
		page
			.locator('.property-card')
			.filter({
				has: page.locator('[data-inspect-token="--os-ui-avatar-glare-x"]'),
			})
			.locator('.group-description'),
	).toContainText('reflection left or right');
});
