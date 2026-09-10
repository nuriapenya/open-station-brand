import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { readFileSync } from 'node:fs';

for (const width of [1440, 390])
	test(`Astro landing matches the original design at ${width}px`, async ({
		browser,
	}) => {
		const context = await browser.newContext({
			javaScriptEnabled: false,
			viewport: { width, height: 1000 },
			deviceScaleFactor: 1,
			reducedMotion: 'reduce',
		});
		const page = await context.newPage();
		// Keep the original design as the reference, plus the approved studio CTA.
		await page.route('**/mockups/landing_v1.html', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: readFileSync('mockups/landing_v1.html', 'utf8').replace(
					'<a class="btn outline" href="https://github.com/WordPress/openstation">Read the source</a>',
					'<a class="btn outline" href="https://github.com/WordPress/openstation">Read the source</a>\n      <a class="btn outline" href="/theme-creator/">Theme Creator</a>'
				),
			})
		);
		const capture = async (path: string) => {
			const response = await page.goto(`http://127.0.0.1:4321${path}`, {
				waitUntil: 'networkidle',
			});
			expect(response?.status()).toBe(200);
			await page.evaluate(() => document.fonts.ready);
			await page.reload({ waitUntil: 'networkidle' });
			return PNG.sync.read(
				await page.screenshot({ fullPage: true, animations: 'disabled' })
			);
		};
		const original = await capture('/mockups/landing_v1.html');
		const astro = await capture('/');
		expect([astro.width, astro.height]).toEqual([
			original.width,
			original.height,
		]);
		const diff = new PNG({ width: astro.width, height: astro.height });
		const pixels = pixelmatch(
			original.data,
			astro.data,
			diff.data,
			astro.width,
			astro.height,
			{ threshold: 0.1 }
		);
		expect(pixels).toBe(0);
		await context.close();
	});
test('landing scripts preserve mobile menu and progressive enhancement', async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.route('https://api.wordpress.org/**', (route) => route.abort());
	await page.goto('/');
	const toggle = page.locator('[aria-controls]').first();
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('Escape');
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(page.locator('h1')).toContainText('One tab.');
});

test('existing supporting pages remain available as unchanged documents', async ({
	page,
}) => {
	for (const [path, title] of [
		['/press/', 'Press · OpenStation'],
		['/contribute/', 'Contribute · OpenStation'],
		['/docs/', 'OpenStation Docs'],
	]) {
		const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle(title);
	}
});
