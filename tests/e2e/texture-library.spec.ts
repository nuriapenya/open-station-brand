import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
import contract from '../../src/data/theme-contract.json' with { type: 'json' };
const readTheme = (page) =>
	page.evaluate(() =>
		JSON.parse(localStorage.getItem('openstation-theme-studio:v1') || 'null'),
	);
const open = async (page) => {
	await page.goto('/theme-creator/');
	await page.locator('[data-editor-mode=textures]').click();
};
const choose = (page) =>
	page.getByRole('button', { name: 'Example textures', exact: true }).click();
test('six texture templates preview without changes, with a repeat view and keyboard cancellation', async ({
	page,
}) => {
	await open(page);
	const before = await readTheme(page);
	await choose(page);
	await expect(
		page.getByRole('dialog', { name: 'Find your texture' }),
	).toBeVisible();
	await expect(page.locator('[data-texture-preset]')).toHaveCount(6);
	await page.getByRole('button', { name: 'Warm paper', exact: true }).click();
	await expect(page.locator('.texture-library-preview h3')).toHaveText(
		'Warm paper',
	);
	await page
		.getByRole('button', { name: 'Repeat preview', exact: true })
		.click();
	await expect(
		page.getByRole('img', { name: 'Warm paper, repeated in both directions' }),
	).toHaveCSS('background-repeat', 'repeat');
	await page.keyboard.press('Escape');
	await expect(page.locator('.texture-library')).toHaveCount(0);
	expect(await readTheme(page)).toEqual(before);
	await expect(page.locator('[data-texture-library]')).toBeFocused();
});
test('all six texture images apply, undo and survive ZIP export and reload', async ({
	page,
}) => {
	test.setTimeout(90000);
	await open(page);
	let previous;
	for (const id of [
		'graphite',
		'linen',
		'glass',
		'paper',
		'leather',
		'pearl',
	]) {
		await choose(page);
		await page.locator(`[data-texture-preset="${id}"]`).click();
		await page
			.getByRole('button', { name: 'Apply to titlebar', exact: true })
			.click();
		await expect(page.locator('.texture-library')).toHaveCount(0);
		const theme = await readTheme(page);
		const tx = theme.textures.TITLEBAR;
		expect(tx.path).toMatch(new RegExp(`textures/${id}-.*\\.png$`));
		expect(tx.repeat).toBe('repeat');
		await expect(page.locator('.material-titlebar').first()).toHaveCSS(
			'background-image',
			/blob:/,
		);
		if (previous) {
			await page.getByRole('button', { name: 'Undo', exact: true }).click();
			expect((await readTheme(page)).textures.TITLEBAR.path).toBe(previous);
			await page.getByRole('button', { name: 'Redo', exact: true }).click();
		}
		previous = tx.path;
	}
	await page.locator('#export-button').click();
	const download = page.waitForEvent('download');
	await page.getByRole('button', { name: /^Download ZIP/ }).click();
	const files = unzipSync(readFileSync((await (await download).path())!));
	const theme = JSON.parse(strFromU8(files['theme.json']));
	expect(Buffer.from(files[theme.textures.TITLEBAR.path])).toEqual(
		readFileSync('assets/studio/textures/pearl.png'),
	);
	await page.reload();
	await page.locator('[data-editor-mode=textures]').click();
	expect((await readTheme(page)).textures.TITLEBAR.path).toBe(previous);
	await expect(page.locator('.upload-area img')).toHaveAttribute(
		'src',
		/blob:/,
	);
});
test('the chooser reaches frame and corner slots and exposes the native upload picker', async ({
	page,
}) => {
	await open(page);
	const border = contract.textures.find((t) => t.type === 'border-image')!;
	await page
		.getByLabel('Texture surface', { exact: true })
		.selectOption(border.id);
	await choose(page);
	await page
		.getByRole('button', {
			name: `Apply to ${border.id.replaceAll('_', ' ').toLowerCase()}`,
			exact: true,
		})
		.click();
	await expect(page.locator('.texture-library')).toHaveCount(0);
	expect((await readTheme(page)).textures[border.id]).toMatchObject({
		type: 'border-image',
		slice: '128',
		width: '8px',
	});
	await page
		.getByLabel('Texture surface', { exact: true })
		.selectOption('WINDOW_CORNER_NE');
	await choose(page);
	await page
		.getByRole('button', { name: 'Apply to window corner ne', exact: true })
		.click();
	await expect(page.locator('.texture-library')).toHaveCount(0);
	expect((await readTheme(page)).textures.WINDOW_CORNER_NE).toMatchObject({
		type: 'image',
		size: '32px',
	});
	await choose(page);
	const picking = page.waitForEvent('filechooser');
	await page
		.getByRole('button', { name: 'Upload my own image', exact: true })
		.click();
	await (
		await picking
	).setFiles({
		name: 'my-own-texture.png',
		mimeType: 'image/png',
		buffer: readFileSync('assets/studio/textures/paper.png'),
	});
	await expect
		.poll(async () => (await readTheme(page)).textures.WINDOW_CORNER_NE.path)
		.toContain('my-own-texture');
});
test('image properties link directly to the chooser and its controls fit a phone', async ({
	page,
}) => {
	await page.goto('/theme-creator/');
	await page.getByRole('searchbox').fill('--os-ui-button-bg-image');
	await page
		.locator('[data-token="--os-ui-button-bg-image"] .token-texture-button')
		.click();
	await expect(
		page.getByRole('button', { name: 'Apply to button', exact: true }),
	).toBeVisible();
	await page.setViewportSize({ width: 390, height: 844 });
	const rect = await page.locator('.texture-library').boundingBox();
	expect(rect!.width).toBeLessThanOrEqual(390);
	expect(rect!.x).toBeGreaterThanOrEqual(0);
	await page
		.getByRole('button', { name: 'Apply to button', exact: true })
		.click();
	await expect(page.locator('.texture-library')).toHaveCount(0);
	expect((await readTheme(page)).textures.BUTTON.path).toContain('graphite');
});
