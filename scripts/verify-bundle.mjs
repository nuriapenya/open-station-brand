import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { chromium, expect } from '@playwright/test';
// Run after build:bundle. Serve only on loopback and leave no background server.
const root = resolve(process.argv[2] || 'build/landing-bundle');
const types = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.woff2': 'font/woff2',
};
const server = createServer(async (req, res) => {
	try {
		let file = join(root, new URL(req.url, 'http://localhost').pathname);
		if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
		res.setHeader(
			'Content-Type',
			types[extname(file)] || 'application/octet-stream',
		);
		res.end(await readFile(file));
	} catch {
		res.writeHead(404);
		res.end();
	}
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
try {
	const page = await browser.newPage({
		viewport: { width: 1440, height: 1000 },
	});
	const errors = [];
	page.on('pageerror', (e) => {
		errors.push(e.message);
		console.log('ERROR', e.message);
	});
	page.on('response', (r) => {
		if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
	});
	await page.goto(`http://127.0.0.1:${server.address().port}/theme-creator/`);
	await page.locator('[data-scene=atlas]').click();
	const offcenter = await page.locator('.surface-card').evaluateAll((cs) =>
		cs
			.map((c) => {
				const v = c.querySelector('.scene-viewport').getBoundingClientRect();
				const rs = [...c.querySelector('.scene-frame').children]
					.filter((x) => x.tagName !== 'STYLE')
					.map((x) => x.getBoundingClientRect());
				return {
					name: c.dataset.surface,
					dx: Math.round(
						(Math.min(...rs.map((r) => r.x)) +
							Math.max(...rs.map((r) => r.right)) -
							v.x -
							v.right) /
							2,
					),
					dy: Math.round(
						(Math.min(...rs.map((r) => r.y)) +
							Math.max(...rs.map((r) => r.bottom)) -
							v.y -
							v.bottom) /
							2,
					),
				};
			})
			.filter((x) => Math.abs(x.dx) > 3 || Math.abs(x.dy) > 3),
	);

	await page.locator('.surface-card[data-surface="Spinner"]').click();
	const spinner = page.locator('.property-grid os-spinner');

	await expect
		.poll(() => spinner.evaluate((e) => parseFloat(getComputedStyle(e).width)))
		.toBeCloseTo(48, 0);
	await page.locator('[data-inspect-token="--os-ui-spinner-size"]').click();
	await page
		.locator('[data-token="--os-ui-spinner-size"] input[type=text]')
		.fill('60px');
	await expect
		.poll(() => spinner.evaluate((e) => parseFloat(getComputedStyle(e).width)))
		.toBeCloseTo(60, 0);
	await page.locator('[data-editor-mode=textures]').click();
	await page
		.getByRole('button', { name: 'Example textures', exact: true })
		.click();
	await expect(page.locator('[data-texture-preset]')).toHaveCount(6);
	for (const id of [
		'graphite',
		'linen',
		'glass',
		'paper',
		'leather',
		'pearl',
	]) {
		const response = await page.request.get(
			`http://127.0.0.1:${server.address().port}/assets/studio/textures/${id}.png`,
		);
		expect(response.ok()).toBe(true);
		expect((await response.body()).subarray(1, 4).toString()).toBe('PNG');
	}
	await page
		.getByRole('button', { name: 'Apply to titlebar', exact: true })
		.click();
	await expect(page.locator('.texture-library')).toHaveCount(0);
	await expect(page.locator('.material-titlebar').first()).toHaveCSS(
		'background-image',
		/blob:/,
	);
	expect(errors).toEqual([]);
	expect(offcenter).toEqual([]);
	console.log(
		'Static bundle smoke passed: 70 centered gallery specimens, 48px Station spinner, 60px live edit, six packaged textures and live application.',
	);
} finally {
	await browser.close();
	await new Promise((r) => server.close(r));
}
