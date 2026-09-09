import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parseRGBA } from '../../src/lib/color';
const open = async (p: Page) => {
	await p.goto('/theme-creator/');
	await p.locator('.token-row').first().waitFor();
};
const done = async (p: Page) =>
	p
		.locator('#color-picker-dialog')
		.getByRole('button', { name: 'Done', exact: true })
		.click();
const accent = (p: Page) =>
	p.getByRole('textbox', { name: 'Accent', exact: true });
test('custom picker preserves imported alpha, edits live, and survives undo, JSON and reload', async ({
	page,
}) => {
	await open(page);
	await accent(page).fill('rgba(10, 20, 30, 0.375)');
	await accent(page).press('Tab');
	await page
		.getByRole('button', { name: 'Pick Accent color', exact: true })
		.click();
	await expect(
		page.getByRole('slider', { name: 'Color opacity', exact: true }),
	).toHaveValue('37.5');
	await expect(accent(page)).toHaveValue('rgba(10, 20, 30, 0.375)');
	await page
		.getByRole('slider', { name: 'Color hue', exact: true })
		.fill('120');
	expect(parseRGBA(await accent(page).inputValue())?.a).toBe(0.375);
	await page
		.getByRole('slider', { name: 'Color opacity', exact: true })
		.fill('25');
	await expect(page.locator('.mock-window os-switch button').first()).toHaveCSS(
		'background-color',
		/rgba\(.+, 0.25\)/,
	);
	await page.screenshot({ path: test.info().outputPath('studio-alpha-picker.png') });
	await done(page);
	const value = await accent(page).inputValue();
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	expect(await accent(page).inputValue()).not.toBe(value);
	await page.getByRole('button', { name: 'Redo', exact: true }).click();
	await expect(accent(page)).toHaveValue(value);
	await expect(page.locator('#save-state')).toHaveText('Saved locally');
	await page.reload();
	await expect(accent(page)).toHaveValue(value);
	await page.locator('#export-button').click();
	const download = page.waitForEvent('download');
	await page
		.getByRole('button', { name: 'Download JSON', exact: true })
		.click();
	const json = JSON.parse(
		readFileSync((await (await download).path())!, 'utf8'),
	);
	expect(json.tokens['--os-ui-accent']).toBe(value);
});
test('zero alpha, eight-digit hex, precise numbers and keyboard shades work without mutating on open', async ({
	page,
}) => {
	await open(page);
	await page
		.getByRole('button', { name: 'Pick Accent color', exact: true })
		.click();
	await expect(page.locator('#override-count')).toHaveText('0 / 512 overrides');
	await page
		.getByRole('textbox', { name: 'Color hex', exact: true })
		.fill('#ff008080');
	expect(parseRGBA(await accent(page).inputValue())?.a).toBeCloseTo(
		128 / 255,
		5,
	);
	await page
		.getByRole('spinbutton', { name: 'Color opacity percent', exact: true })
		.fill('0');
	await page
		.getByRole('slider', { name: 'Color hue', exact: true })
		.fill('200');
	expect(parseRGBA(await accent(page).inputValue())?.a).toBe(0);
	await page
		.getByRole('spinbutton', { name: 'Color opacity percent', exact: true })
		.fill('12.5');
	await page
		.getByRole('textbox', { name: 'Color hex', exact: true })
		.fill('#123456');
	expect(parseRGBA(await accent(page).inputValue())).toEqual({
		r: 18,
		g: 52,
		b: 86,
		a: 0.125,
	});
	const before = await accent(page).inputValue();
	await page.locator('.color-sv').focus();
	await page.keyboard.press('ArrowLeft');
	expect(await accent(page).inputValue()).not.toBe(before);
	expect(parseRGBA(await accent(page).inputValue())?.a).toBe(0.125);
	const valid = await accent(page).inputValue();
	await page
		.getByRole('textbox', { name: 'Color hex', exact: true })
		.fill('#oops');
	await expect(
		page.getByRole('textbox', { name: 'Color hex', exact: true }),
	).toHaveAttribute('aria-invalid', 'true');
	await expect(accent(page)).toHaveValue(valid);
	await page.keyboard.press('Escape');
	await expect(page.locator('#color-picker-dialog')).toBeHidden();
	await expect(page.locator('input[type=color]')).toHaveCount(0);
});
test('gradient stops, shadow colors, geometry edits and quick palettes preserve transparency', async ({
	page,
}) => {
	await open(page);
	await page.getByRole('searchbox').fill('--os-bg');
	await expect(page.locator('#token-count')).toHaveText('1 token found');
	const field = page.locator('[data-token="--os-bg"] input[type=text]');
	await field.fill(
		'linear-gradient(90deg, rgba(10,20,30,.2) 0%, rgba(40,50,60,.6) 100%)',
	);
	await field.press('Tab');
	await page.getByText('Gradient controls', { exact: true }).click();
	await page
		.getByRole('button', { name: 'Start color for --os-bg', exact: true })
		.click();
	await expect(
		page.getByRole('slider', { name: 'Color opacity', exact: true }),
	).toHaveValue('20');
	await page
		.getByRole('slider', { name: 'Color hue', exact: true })
		.fill('300');
	await done(page);
	await expect(field).toHaveValue(/0\.2\).*0\.6\)/);
	await page
		.getByRole('slider', { name: 'Angle for --os-bg', exact: true })
		.fill('45');
	await expect(field).toHaveValue(/45deg.*0\.2\).*0\.6\)/);
	await page
		.getByRole('button', { name: 'End color for --os-bg', exact: true })
		.click();
	await page
		.getByRole('slider', { name: 'Color opacity', exact: true })
		.fill('0');
	await done(page);
	await expect(field).toHaveValue(/, 0\) 100%/);
	await page.getByRole('searchbox').fill('--os-window-shadow');
	const row = page.locator('[data-token="--os-window-shadow"]');
	await row
		.locator('input[type=text]')
		.fill('0px 8px 32px 0px rgba(0,0,0,.15)');
	await row.getByText('Shape the shadow', { exact: true }).click();
	await page
		.getByRole('button', {
			name: 'Shadow color for --os-window-shadow',
			exact: true,
		})
		.click();
	await expect(
		page.getByRole('slider', { name: 'Color opacity', exact: true }),
	).toHaveValue('15');
	await page
		.getByRole('slider', { name: 'Color opacity', exact: true })
		.fill('35');
	await done(page);
	await page
		.getByRole('slider', { name: 'Blur for --os-window-shadow', exact: true })
		.fill('40');
	await expect(row.locator('input[type=text]')).toHaveValue(
		/40px 0px rgba\(0, 0, 0, 0.35\)/,
	);
	await page.getByRole('searchbox').fill('--os-ui-accent');
	await accent(page).fill('rgba(10,20,30,.4)');
	await page
		.locator('[data-token="--os-ui-accent"]')
		.getByText('Quick palette', { exact: true })
		.first()
		.click();
	await page
		.getByRole('button', {
			name: 'Use #ec9bff for --os-ui-accent',
			exact: true,
		})
		.click();
	expect(parseRGBA(await accent(page).inputValue())?.a).toBe(0.4);
});
test('icon tints use the alpha picker, which fits a phone and supports pointer dragging', async ({
	page,
}) => {
	await open(page);
	await page.locator('[data-editor-mode=icons]').click();
	await page
		.getByRole('button', { name: 'Pick default icon tint color', exact: true })
		.click();
	await page
		.getByRole('slider', { name: 'Color opacity', exact: true })
		.fill('50');
	await done(page);
	await expect(
		page.getByLabel('Default icon tint', { exact: true }),
	).toHaveValue(/0\.5\)/);
	await page.setViewportSize({ width: 390, height: 844 });
	await page
		.getByRole('button', { name: 'Pick default icon tint color', exact: true })
		.click();
	await expect(page.locator('#color-picker-dialog')).toBeInViewport({
		ratio: 1,
	});
	const box = await page.locator('.color-sv').boundingBox();
	await page.mouse.move(box!.x + 10, box!.y + 10);
	await page.mouse.down();
	await page.mouse.move(box!.x + box!.width * 0.7, box!.y + box!.height * 0.5);
	await page.mouse.up();
	await expect(
		page.getByRole('slider', { name: 'Color opacity', exact: true }),
	).toHaveValue('50');
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
	await page.screenshot({ path: test.info().outputPath('studio-alpha-mobile.png') });
});

test('touch can choose a shade without losing opacity', async ({ browser }) => {
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 },
		hasTouch: true,
		isMobile: true,
	});
	const page = await context.newPage();
	await page.goto('http://127.0.0.1:4321/theme-creator/');
	await accent(page).fill('rgba(20, 80, 140, .25)');
	await page
		.getByRole('button', { name: 'Pick Accent color', exact: true })
		.tap();
	const box = await page.locator('.color-sv').boundingBox();
	await page.touchscreen.tap(
		box!.x + box!.width * 0.8,
		box!.y + box!.height * 0.2,
	);
	expect(parseRGBA(await accent(page).inputValue())?.a).toBe(0.25);
	expect(await accent(page).inputValue()).not.toBe('rgba(20, 80, 140, .25)');
	await context.close();
});
