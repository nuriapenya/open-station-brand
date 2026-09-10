import { test, expect } from '@playwright/test';
const open = async (page, surface) => {
	await page.goto('/theme-creator/');
	await page.locator('[data-scene=atlas]').click();
	await page.locator(`.surface-card[data-surface="${surface}"]`).click();
};
const select = (page, name) =>
	page.locator(`[data-inspect-token="${name}"]`).click();
const edit = async (page, name, value) => {
	await select(page, name);
	await page.locator(`[data-token="${name}"] input[type=text]`).fill(value);
};
test('Station keeps base and variant defaults without exporting reference values', async ({
	page,
}) => {
	await open(page, 'Spinner');
	await expect(page.locator('.property-card')).toHaveCount(1);
	const spinner = page.locator('.property-grid os-spinner');
	await expect
		.poll(() =>
			spinner.evaluate((el) => parseFloat(getComputedStyle(el).width)),
		)
		.toBeCloseTo(48, 0);
	await select(page, '--os-ui-spinner-size');
	await expect(
		page.locator('[data-token="--os-ui-spinner-size"] input[type=text]'),
	).toHaveValue('48px');
	await expect(page.locator('#override-count')).toHaveText('0 / 512 overrides');
	await edit(page, '--os-ui-spinner-size', '64px');
	await expect
		.poll(() =>
			spinner.evaluate((el) => parseFloat(getComputedStyle(el).width)),
		)
		.toBeCloseTo(64, 0);
	await page
		.getByRole('button', { name: 'Reset Spinner size', exact: true })
		.click();
	await expect
		.poll(() =>
			spinner.evaluate((el) => parseFloat(getComputedStyle(el).width)),
		)
		.toBeCloseTo(48, 0);
	await open(page, 'Steps');
	await select(page, '--os-ui-step-connector-width');
	const connector = page
		.locator('.property-card')
		.filter({
			has: page.locator('[data-inspect-token="--os-ui-step-connector-width"]'),
		})
		.locator('os-step')
		.first();
	// Horizontal layout supplies 20px even though the vertical base fallback is zero.
	await expect
		.poll(() =>
			connector.evaluate((el) =>
				parseFloat(getComputedStyle(el, '::after').inlineSize),
			),
		)
		.toBeCloseTo(20, 0);
});
test('border and corner radius share a specimen and retain both live edits', async ({
	page,
}) => {
	await open(page, 'Code blocks');
	const card = page
		.locator('.property-card')
		.filter({
			has: page.locator('[data-inspect-token="--os-ui-code-border"]'),
		});
	await expect(
		card.locator('[data-inspect-token="--os-ui-code-border-radius"]'),
	).toHaveCount(1);
	await expect(page.locator('.property-card')).toHaveCount(3);
	await edit(page, '--os-ui-code-border', '3px solid #00ff00');
	await edit(page, '--os-ui-code-border-radius', '18px');
	await expect(card.locator('os-code code')).toHaveCSS(
		'border-top-color',
		'rgb(0, 255, 0)',
	);
	await expect(card.locator('os-code code')).toHaveCSS('border-radius', '18px');
	await page.screenshot({ path: test.info().outputPath('station-code-groups.png') });
});
test('dynamic admin bar reveals vertically at the source transition duration', async ({
	page,
}) => {
	await open(page, 'Desktop');
	await select(page, '--os-admin-bar-slide');
	const bar = page.locator('.property-card .adminbar-slide-demo');
	await expect(bar).toHaveCSS('transition-property', 'inset-block-start');
	await expect(bar).toHaveCSS('transition-duration', '0.18s');
	await expect(bar).toHaveCSS('transform', 'none');
	const frames = await bar.evaluate(async (el) => {
		const result: number[][] = [];
		for (let i = 0; i < 85; i++) {
			await new Promise(requestAnimationFrame);
			const r = el.getBoundingClientRect();
			result.push([r.x, r.y]);
		}
		return result;
	});
	expect(
		Math.max(...frames.map((f) => f[0])) - Math.min(...frames.map((f) => f[0])),
	).toBeLessThan(1);
	expect(
		Math.max(...frames.map((f) => f[1])) - Math.min(...frames.map((f) => f[1])),
	).toBeGreaterThan(8);
	await edit(page, '--os-admin-bar-slide', '600ms');
	await expect(bar).toHaveCSS('transition-duration', '0.6s');
});
test('the category trigger is centered in the all-surfaces gallery', async ({
	page,
}) => {
	await page.goto('/theme-creator/');
	await page.locator('[data-scene=atlas]').click();
	const card = page.locator('.surface-card[data-surface="Category tree"]');
	await card.scrollIntoViewIfNeeded();
	const picker = card.locator('os-category-picker');
	await expect(picker).not.toHaveAttribute('open');
	const positions = await card.evaluate((el) => {
		const viewport = el
			.querySelector('.scene-viewport')!
			.getBoundingClientRect();
		const picker = el
			.querySelector('os-category-picker')!
			.getBoundingClientRect();
		return {
			dx: Math.abs(
				picker.x + picker.width / 2 - viewport.x - viewport.width / 2,
			),
			dy: Math.abs(
				picker.y + picker.height / 2 - viewport.y - viewport.height / 2,
			),
		};
	});
	expect(positions.dx).toBeLessThan(2);
	expect(positions.dy).toBeLessThan(2);
	await page.screenshot({ path: test.info().outputPath('station-gallery-centered.png') });
});
