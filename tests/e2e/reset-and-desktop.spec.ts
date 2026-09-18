import { test, expect, type Page } from '@playwright/test';
import { zipSync, strToU8 } from 'fflate';
import { PNG } from 'pngjs';
import { emptyTheme } from '../../src/lib/theme';

const theme = {
	...emptyTheme(),
	name: 'My custom theme',
	id: 'test/custom',
	tokens: { '--os-ui-accent': '#12ab34', '--os-ui-switch-knob': '#ff00ff' },
	textures: {
		WINDOW_FRAME: {
			type: 'border-image',
			path: 'frame.svg',
			slice: '8',
			width: '8px',
			repeat: 'stretch',
		},
	},
	icons: { OS_SETTINGS: { type: 'image', path: 'frame.svg' } },
	wallpapers: [{ id: 'custom', label: 'Custom', path: 'frame.svg' }],
	recommendedOsSettings: { dockPlacement: 'left' },
};
const art = strToU8(
	'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path fill="#ff0000" d="M0 0h40v40H0z"/></svg>',
);
const readTheme = (page: Page) =>
	page.evaluate(() =>
		JSON.parse(localStorage.getItem('openstation-theme-studio:v1') || 'null'),
	);
async function importTheme(page: Page) {
	await page.goto('/theme-creator/');
	await page.locator('.token-row').first().waitFor();
	await page.locator('#import-file').setInputFiles({
		name: 'custom.zip',
		mimeType: 'application/zip',
		buffer: Buffer.from(
			zipSync({
				'theme.json': strToU8(JSON.stringify(theme)),
				'frame.svg': art,
			}),
		),
	});
	await expect.poll(async () => (await readTheme(page))?.name).toBe(theme.name);
}

test('reset is a styled modal; cancel, close and Escape preserve the complete draft and keyboard focus', async ({
	page,
}) => {
	await importTheme(page);
	const before = await readTheme(page);
	let nativeDialogs = 0;
	page.on('dialog', async (dialog) => {
		nativeDialogs++;
		await dialog.dismiss();
	});
	for (const action of ['cancel', 'close', 'escape']) {
		await page.locator('#reset-theme').click();
		await expect(
			page.getByRole('dialog', { name: 'Reset this theme?' }),
		).toBeVisible();
		await expect(
			page.getByRole('button', { name: 'Keep editing' }),
		).toBeFocused();
		await page.keyboard.press('Control+z');
		expect(await readTheme(page)).toEqual(before);
		if (action === 'escape') await page.keyboard.press('Escape');
		else
			await page
				.getByRole('button', {
					name:
						action === 'cancel' ? 'Keep editing' : 'Close reset confirmation',
				})
				.click();
		await expect(page.locator('#reset-dialog')).toBeHidden();
		await expect(page.locator('#reset-theme')).toBeFocused();
		expect(await readTheme(page)).toEqual(before);
	}
	expect(nativeDialogs).toBe(0);
});

test('full reset restores Station, supports one-step Undo with artwork, and persists on reload', async ({
	page,
}) => {
	await importTheme(page);
	const before = await readTheme(page);
	await page.locator('#reset-theme').click();
	await page.locator('#reset-confirm').click();
	expect(await readTheme(page)).toEqual(emptyTheme());
	await expect(page.locator('[data-preset=brand]')).toHaveAttribute(
		'aria-pressed',
		'true',
	);
	await expect(page.locator('#theme-name')).toHaveValue('Untitled theme');
	await expect(page.locator('.mock-window')).toHaveAttribute(
		'data-has-texture',
		'false',
	);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	expect(await readTheme(page)).toEqual(before);
	await expect(page.locator('.mock-window')).toHaveAttribute(
		'data-has-texture',
		'true',
	);
	await page.getByRole('button', { name: 'Redo', exact: true }).click();
	await expect(page.locator('#save-state')).toHaveText('Saved locally');
	await page.reload();
	await expect(page.locator('#theme-name')).toHaveValue('Untitled theme');
	expect(await readTheme(page)).toEqual(emptyTheme());
});

test('token reset confirms its narrower scope and the full reset dialog fits a phone', async ({
	page,
}) => {
	await importTheme(page);
	const before = await readTheme(page);
	await page.getByRole('button', { name: 'Properties', exact: true }).click();
	await page.getByRole('button', { name: 'Reset edits', exact: true }).click();
	await page
		.getByRole('button', { name: 'Reset token edits', exact: true })
		.click();
	expect(await readTheme(page)).toEqual({ ...before, tokens: {} });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator('#reset-theme').click();
	const box = await page.locator('#reset-dialog').boundingBox();
	expect(box!.x).toBeGreaterThanOrEqual(0);
	expect(box!.x + box!.width).toBeLessThanOrEqual(390);
	await expect(page.locator('#reset-confirm')).toBeInViewport();
	await page.screenshot({ path: test.info().outputPath('studio-reset-mobile.png') });
});

test('desktop frame paints equal visible edges and the real switch updates live in both states', async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1100 });
	await importTheme(page);
	await page.locator('[data-scene=desktop]').click();
	const win = page.locator('.mock-window');
	const shot = PNG.sync.read(await win.screenshot());
	const redAt = (x: number, y: number) => [
		...shot.data.subarray(
			(y * shot.width + x) * 4,
			(y * shot.width + x) * 4 + 3,
		),
	];
	for (const [x, y] of [
		[Math.floor(shot.width / 2), 4],
		[Math.floor(shot.width / 2), shot.height - 5],
		[4, Math.floor(shot.height / 2)],
		[shot.width - 5, Math.floor(shot.height / 2)],
	])
		expect(redAt(x, y)).toEqual([255, 0, 0]);
	const control = page.locator('.desktop-component os-switch');
	const knob = control.locator('.os-switch__knob');
	const toggle = control.getByRole('switch', { name: 'Make room for focus' });
	const labelBounds = await control.locator('.os-switch__text').boundingBox();
	const switchBounds = await toggle.boundingBox();
	expect(labelBounds!.x + labelBounds!.width).toBeLessThan(switchBounds!.x);
	await expect(knob).toHaveCSS('background-color', 'rgb(255, 0, 255)');
	await expect(toggle).toHaveCSS('background-color', 'rgb(18, 171, 52)');
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-checked', 'false');
	await expect(page.locator('#token-group')).toHaveValue('surface:Switch');
	const field = page.locator(
		'[data-token="--os-ui-switch-knob"] input[type=text]',
	);
	await field.fill('#00ffff');
	await expect(knob).toHaveCSS('background-color', 'rgb(0, 255, 255)');
	await toggle.press('Space');
	await expect(toggle).toHaveAttribute('aria-checked', 'true');
	await expect(knob).toHaveCSS('background-color', 'rgb(0, 255, 255)');
	await page.screenshot({ path: test.info().outputPath('studio-desktop-frame-switch.png') });
});

test('desktop controls consume the real field, button, card, badge and avatar tokens', async ({
	page,
}) => {
	await page.goto('/theme-creator/');
	const edit = async (name: string, value: string) => {
		await page.getByRole('searchbox').fill(name);
		await page.locator(`[data-token="${name}"] input[type=text]`).fill(value);
	};
	const body = page.locator('.mock-window-body');
	await expect(body.locator('os-text-field')).toHaveCount(1);
	await expect(body.locator('os-card')).toHaveCount(1);
	await expect(body.locator('os-badge')).toHaveCount(1);
	await expect(body.locator('os-avatar')).toHaveCount(1);
	const field = body.locator('os-text-field input');
	await field.click();
	await expect(
		page.locator('[data-token="--os-ui-field-radius"]'),
	).toBeVisible();
	await edit('--os-ui-field-radius', '17px');
	await expect(field).toHaveCSS('border-radius', '17px');
	await edit('--os-ui-field-font-size', '19px');
	await expect(field).toHaveCSS('font-size', '19px');
	await edit('--os-ui-button-bg', '#0066ff');
	await edit('--os-ui-button-border-radius', '18px');
	const save = body.locator('.mock-primary button');
	await expect(save).toHaveCSS('background-color', 'rgb(0, 102, 255)');
	await expect(save).toHaveCSS('border-radius', '18px');
	await edit('--os-ui-card-padding', '24px');
	await edit('--os-ui-card-gap', '28px');
	await expect(body.locator('os-card')).toHaveCSS('padding', '24px');
	await expect(body.locator('os-card')).toHaveCSS('gap', '28px');
	await edit('--os-ui-badge-success-bg', '#8800ff');
	await expect(body.locator('os-badge')).toHaveCSS(
		'background-color',
		'rgb(136, 0, 255)',
	);
	await edit('--os-ui-avatar-size', '44px');
	await expect(body.locator('os-avatar')).toHaveCSS('width', '44px');
	await page.screenshot({ path: test.info().outputPath('studio-real-window-controls.png') });
});

test('dock uses the reference icon order, source artwork and theme-controlled tint', async ({
	page,
}) => {
	await page.goto('/theme-creator/');
	await expect(page.locator('.mock-dock > button')).toHaveCount(5);
	expect(
		await page
			.locator('.mock-dock > button')
			.evaluateAll((nodes) =>
				nodes.map((node) => node.getAttribute('aria-label')),
			),
	).toEqual([
		'Edit dock: Mio',
		'Edit dock: Overview',
		'Edit dock: Trash',
		'Edit dock: System',
		'Edit dock: Exit OpenStation',
	]);
	for (const name of ['mio', 'overview', 'trash', 'system']) {
		const asset = await page.request.get(`/assets/studio/dock/${name}.svg`);
		expect(asset.ok()).toBe(true);
		expect(await asset.text()).toContain(
			'<svg xmlns="http://www.w3.org/2000/svg"',
		);
	}
	await page.getByRole('searchbox').fill('--os-dock-icon-color');
	await page
		.locator('[data-token="--os-dock-icon-color"] input[type=text]')
		.fill('#0066ff');
	for (const glyph of await page.locator('.mock-dock .dock-glyph').all())
		await expect(glyph).toHaveCSS('background-color', 'rgb(0, 102, 255)');
	await expect(page.locator('.mock-dock .dashicons-exit')).toHaveCount(1);
	await page
		.locator('.mock-dock')
		.screenshot({ path: test.info().outputPath('studio-dock-reference.png') });
});
