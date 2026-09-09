import { test, expect } from '@playwright/test';

const inspect = async (page, surface) => {
	await page.goto('/theme-creator/');
	await page.locator('[data-scene=atlas]').click();
	await page.locator(`button.surface-card[data-surface="${surface}"]`).click();
};
const card = (page, name) =>
	page
		.locator('.property-card')
		.filter({ has: page.locator(`[data-inspect-token="${name}"]`) });
const edit = async (page, name, value) => {
	await page.locator(`[data-inspect-token="${name}"]`).click();
	await page.locator(`[data-token="${name}"] input[type=text]`).fill(value);
};
test('real steps distinguish circle size, connector length and space between steps', async ({
	page,
}) => {
	await inspect(page, 'Steps');
	const chip = card(page, '--os-ui-step-chip-size').locator('os-step').first();
	const connector = card(page, '--os-ui-step-connector-width')
		.locator('os-step')
		.first();
	await expect(chip.locator('.os-step__title')).toHaveText('Create');
	await edit(page, '--os-ui-step-chip-size', '40px');
	await expect
		.poll(() =>
			chip.evaluate((el) => parseFloat(getComputedStyle(el, '::before').width)),
		)
		.toBeCloseTo(40, 0);
	await expect
		.poll(() =>
			chip.evaluate((el) =>
				parseFloat(getComputedStyle(el, '::before').height),
			),
		)
		.toBeCloseTo(40, 0);
	await edit(page, '--os-ui-step-connector-width', '60px');
	await expect
		.poll(() =>
			connector.evaluate((el) =>
				parseFloat(getComputedStyle(el, '::after').inlineSize),
			),
		)
		.toBeCloseTo(60, 0);
	await expect
		.poll(() =>
			connector.evaluate((el) =>
				parseFloat(getComputedStyle(el, '::before').width),
			),
		)
		.toBeCloseTo(40, 0);
	await edit(page, '--os-ui-steps-gap', '28px');
	await expect(
		card(page, '--os-ui-steps-gap').locator('.os-steps__list'),
	).toHaveCSS('gap', /28px/);
	await expect(
		card(page, '--os-ui-step-chip-size').locator('.scene-caption'),
	).toHaveText('Numbered step chip');
	await expect(
		card(page, '--os-ui-step-connector-width').locator('.scene-caption'),
	).toHaveText('Rule between steps');
	await page.locator('.surface-atlas').evaluate((el) => (el.scrollTop = 0));
	await page.screenshot({ path: test.info().outputPath('studio-real-steps-final.png') });
});

test('component fixtures show useful content, open states, counts and colors', async ({
	page,
}) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await inspect(page, 'Repeater');
	await expect(
		page
			.locator('.property-grid os-repeater')
			.first()
			.locator('.os-repeater__row'),
	).toHaveCount(2);
	await inspect(page, 'Breadcrumbs');
	await expect(
		page.locator('.property-grid os-crumb-chain').first(),
	).toContainText('Projects');
	await inspect(page, 'Toast');
	await expect(page.locator('.property-grid os-toast').first()).toHaveCSS(
		'opacity',
		'1',
	);
	await inspect(page, 'Tag inputs');
	await expect(
		page.locator('.property-grid os-tag-input').first(),
	).toHaveAttribute('open', '');
	await page.getByRole('searchbox').fill('tag input');
	await expect(
		page.locator('.property-grid os-tag-input').first(),
	).toHaveAttribute('open', '');
	await expect(
		page.locator('.property-grid os-tag-input').first(),
	).toContainText('Design');
	await inspect(page, 'Swatches');
	await edit(page, '--os-ui-swatch-grid-cols', '2');
	const columns = await card(page, '--os-ui-swatch-grid-cols')
		.locator('os-swatch-grid')
		.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
	expect(columns.split(' ')).toHaveLength(2);
	await inspect(page, 'Progress');
	await edit(page, '--os-ui-progress-height', '18px');
	const track = card(page, '--os-ui-progress-height').locator('[part=track]');
	await expect
		.poll(() => track.evaluate((el) => parseFloat(getComputedStyle(el).height)))
		.toBeCloseTo(18, 0);
	expect(errors).toEqual([]);
});

test('all surfaces have semantic parts and the studio stays standalone', async ({
	page,
}) => {
	const remote: string[] = [];
	page.on('request', (r) => {
		if (!new URL(r.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/))
			remote.push(r.url());
	});
	await page.goto('/theme-creator/');
	await page.locator('[data-scene=atlas]').click();
	await expect(page.locator('.surface-card')).toHaveCount(70);
	await expect(page.locator('.demo-chip')).toHaveCount(0);
	await expect(page.locator('.surface-card .scene-caption')).toHaveCount(70);
	expect(await page.evaluate(() => typeof (window as any).wp)).toBe(
		'undefined',
	);
	expect(remote).toEqual([]);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator('button.surface-card[data-surface="Steps"]').click();
	await expect(
		card(page, '--os-ui-step-chip-size').locator('os-step').first(),
	).toBeVisible();
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
});

test('real component artwork replaces the labeled sample and removal restores it', async ({
	page,
}) => {
	await inspect(page, 'Button');
	await page.locator('[data-inspect-token="--os-ui-button-bg-image"]').click();
	const source = card(page, '--os-ui-button-bg-image').locator('os-button');
	await expect(source.locator('button')).toHaveCSS(
		'background-image',
		/textures\/graphite\.png/,
	);
	await page.locator('[data-editor-mode=textures]').click();
	await page
		.getByLabel('Texture surface', { exact: true })
		.selectOption('BUTTON');
	await page.getByLabel('Upload texture', { exact: true }).setInputFiles({
		name: 'pattern.svg',
		mimeType: 'image/svg+xml',
		buffer: Buffer.from(
			'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="#cc88dd"/></svg>',
		),
	});
	await page.locator('[data-editor-mode=tokens]').click();
	await page.locator('[data-scene=atlas]').click();
	await expect(source.locator('button')).toHaveCSS('background-image', /blob:/);
	await page.locator('[data-editor-mode=textures]').click();
	await page
		.getByRole('button', { name: 'Remove texture', exact: true })
		.click();
	await page.locator('[data-editor-mode=tokens]').click();
	await page.locator('[data-scene=atlas]').click();
	await expect(source.locator('button')).toHaveCSS(
		'background-image',
		/textures\/graphite\.png/,
	);
});

test('hover, completed and loading tokens are shown in their applicable states', async ({
	page,
}) => {
	await inspect(page, 'Button');
	await edit(page, '--os-ui-button-bg-hover', '#00ff00');
	await expect(
		card(page, '--os-ui-button-bg-hover').locator('os-button button'),
	).toHaveCSS('background-color', 'rgb(0, 255, 0)');
	await inspect(page, 'Steps');
	await edit(page, '--os-ui-step-chip-done-bg', '#00ff00');
	await expect
		.poll(() =>
			card(page, '--os-ui-step-chip-done-bg')
				.locator('os-step[done]')
				.evaluate((el) => getComputedStyle(el, '::before').backgroundColor),
		)
		.toBe('rgb(0, 255, 0)');
	await inspect(page, 'Table');
	await expect(
		card(page, '--os-ui-table-skeleton-color').locator('os-table'),
	).toHaveAttribute('loading', '');
});

test('shell corner specimens change the correct corner and keep square geometry', async ({
	page,
}) => {
	await inspect(page, 'Window corners');
	await page
		.locator('[data-inspect-token="--os-window-corner-ne-image"]')
		.click();
	await expect(
		card(page, '--os-window-corner-ne-image').locator(
			'[data-bound-token="--os-window-corner-ne-image"]',
		),
	).toHaveCount(1);
	await expect(
		card(page, '--os-window-corner-ne-image').locator(
			'[data-bound-token="--os-window-corner-ne-image"]',
		),
	).toHaveClass(/sk-corner-ne/);
	await edit(page, '--os-window-corner-size', '30px');
	const corners = card(page, '--os-window-corner-size').locator(
		'[data-bound-token]',
	);
	const dimensions = await corners.evaluateAll((nodes) =>
		nodes.map((el) => {
			const s = getComputedStyle(el);
			return [parseFloat(s.width), parseFloat(s.height)];
		}),
	);
	expect(dimensions).toHaveLength(4);
	for (const [w, h] of dimensions) {
		expect(w).toBeCloseTo(30, 0);
		expect(h).toBeCloseTo(30, 0);
	}
	await edit(page, '--os-window-corner-inset', '12px');
	const right = card(page, '--os-window-corner-inset').locator('.sk-corner-ne');
	await expect
		.poll(() =>
			right.evaluate((el) => parseFloat(getComputedStyle(el).insetInlineEnd)),
		)
		.toBeCloseTo(12, 0);
});
