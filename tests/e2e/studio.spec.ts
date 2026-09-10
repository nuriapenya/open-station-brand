import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';

const accent = (page: import('@playwright/test').Page) =>
	page.getByRole('textbox', { name: 'Accent', exact: true });
const open = async (page: import('@playwright/test').Page) => {
	await page.goto('/theme-creator/');
	await expect(accent(page)).toBeVisible();
};

test('live edits paint independently, survive reload, and undo/redo/reset', async ({
	page,
}) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await open(page);
	await accent(page).fill('#00aa88');
	await accent(page).press('Tab');
	await expect(page.locator('.mock-window os-switch button').first()).toHaveCSS(
		'background-color',
		'rgb(0, 170, 136)',
	);
	// The chrome is Obsidian and must not follow the theme being edited.
	await expect(page.locator('.studio-header')).toHaveCSS(
		'background-color',
		'rgb(26, 23, 33)',
	);
	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(accent(page)).toHaveValue('#f252fc');
	await page.getByRole('button', { name: 'Redo', exact: true }).click();
	await expect(accent(page)).toHaveValue('#00aa88');
	await page.reload();
	await expect(accent(page)).toHaveValue('#00aa88');
	await page.getByRole('button', { name: 'Reset Accent', exact: true }).click();
	await expect(accent(page)).toHaveValue('#f252fc');
	expect(errors).toEqual([]);
});
test('invalid values stay out of preview and exported draft', async ({
	page,
}) => {
	await open(page);
	await accent(page).fill('red; display:none');
	await expect(accent(page)).toHaveAttribute('aria-invalid', 'true');
	await expect(page.locator('.mock-window os-switch button').first()).toHaveCSS(
		'background-color',
		'rgb(242, 82, 252)',
	);
	await expect(page.locator('#override-count')).toHaveText('0 / 512 overrides');
});
test('surface selection, search, visual gradients, sliders and typefaces work', async ({
	page,
}) => {
	await open(page);
	await page.getByRole('button', { name: 'Save changes', exact: true }).click();
	await expect(
		page.getByRole('combobox', { name: 'Token category' }),
	).toHaveValue('surface:Button');
	await page.getByRole('searchbox').fill('window-radius');
	const radius = page.getByRole('textbox', {
		name: 'Window corners',
		exact: true,
	});
	await expect(radius).toBeVisible();
	await radius.fill('28px');
	await expect(page.locator('.mock-window')).toHaveCSS('border-radius', '28px');
	await page.getByRole('searchbox').fill('--os-bg');
	await page.getByText('Gradient controls', { exact: true }).click();
	await page
		.getByRole('slider', { name: 'Angle for --os-bg', exact: true })
		.fill('45');
	await expect(page.locator('.mock-desktop')).toHaveCSS(
		'background-image',
		/45deg/,
	);
	await page.getByRole('searchbox').fill('--os-ui-font');
	await page
		.locator('[data-token="--os-ui-font"]')
		.getByText('Choose typeface', { exact: true })
		.click();
	await page
		.getByRole('combobox', {
			name: 'Choose --os-ui-font typeface',
			exact: true,
		})
		.selectOption('Georgia, serif');
	await expect(page.locator('.mock-desktop')).toHaveCSS(
		'font-family',
		'Georgia, serif',
	);
});
test('presets, comparison, scene switching and real mock toggles', async ({
	page,
}) => {
	await open(page);
	await page.getByRole('button', { name: 'After hours', exact: true }).click();
	await expect(accent(page)).toHaveValue('#78dfd4');
	await page.getByRole('button', { name: 'Compare original' }).click();
	await expect(page.locator('.mock-window os-switch button').first()).toHaveCSS(
		'background-color',
		'rgb(242, 82, 252)',
	);
	await page.getByRole('button', { name: 'Viewing original' }).click();
	await expect(page.locator('.mock-window os-switch button').first()).toHaveCSS(
		'background-color',
		'rgb(120, 223, 212)',
	);
	await page.locator('[data-scene=components]').click();
	await expect(page.locator('#component-board')).toBeVisible();
	await expect(page.locator('#mock-desktop')).toBeHidden();
	await page.getByRole('switch', { name: 'Preview component toggle' }).click();
	await expect(
		page.getByRole('switch', { name: 'Preview component toggle' }),
	).toHaveAttribute('aria-checked', 'false');
	await page.getByRole('button', { name: 'Daylight', exact: true }).click();
	await expect(page.locator('#preview')).toHaveCSS('--os-window-bg', '#fff');
});
test('ZIP export contains a valid data-only manifest and JSON round-trips', async ({
	page,
}) => {
	await open(page);
	await accent(page).fill('#abcdef');
	await accent(page).press('Tab');
	await page.getByRole('button', { name: 'Export theme' }).click();
	await page.locator('#export-name').fill('Studio test');
	await page.locator('#export-id').fill('tests/studio');
	await page.locator('#export-author').fill('Theme designer');
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Download ZIP' }).click();
	const download = await downloadPromise;
	const zip = unzipSync(readFileSync((await download.path())!));
	expect(Object.keys(zip)).toEqual(['theme.json']);
	const manifest = JSON.parse(strFromU8(zip['theme.json']));
	expect(manifest.tokens).toEqual({ '--os-ui-accent': '#abcdef' });
	expect(manifest.id).toBe('tests/studio');
	await page.getByRole('button', { name: 'Reset edits' }).click();
	await page
		.getByRole('button', { name: 'Reset token edits', exact: true })
		.click();
	await page.locator('#import-file').setInputFiles({
		name: 'theme.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(manifest)),
	});
	await expect(accent(page)).toHaveValue('#abcdef');
	await page.getByRole('button', { name: 'Export theme' }).click();
	const jsonPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Download JSON' }).click();
	const json = await jsonPromise;
	expect(JSON.parse(readFileSync((await json.path())!, 'utf8'))).toEqual(
		manifest,
	);
});
test('unsupported manifests fail without discarding the working draft', async ({
	page,
}) => {
	await open(page);
	await accent(page).fill('#abcdef');
	await accent(page).press('Tab');
	await page.locator('#import-file').setInputFiles({
		name: 'theme.json',
		mimeType: 'application/json',
		buffer: Buffer.from(
			JSON.stringify({
				manifestVersion: 2,
				id: 'x',
				name: 'Asset theme',
				tokens: {},
				unsupportedField: [],
			}),
		),
	});
	await expect(page.locator('#toast')).toContainText(
		'Unsupported manifest field',
	);
	await expect(accent(page)).toHaveValue('#abcdef');
});
test('all tokens searchable, empty state recoverable, import limit enforced', async ({
	page,
}) => {
	await open(page);
	await page
		.getByRole('combobox', { name: 'Token category' })
		.selectOption('All');
	await expect(page.locator('#token-count')).toHaveText('712 tokens');
	await page.getByRole('searchbox').fill('no-such-token');
	await expect(
		page.getByText('No matching tokens.', { exact: false }),
	).toBeVisible();
	await page.getByRole('button', { name: 'Show all tokens' }).click();
	const tokens = Object.fromEntries(
		Array.from({ length: 513 }, (_, i) => [`--os-test-${i}`, '1px']),
	);
	await page.locator('#import-file').setInputFiles({
		name: 'theme.json',
		mimeType: 'application/json',
		buffer: Buffer.from(
			JSON.stringify({
				manifestVersion: 2,
				id: 'test',
				name: 'Too many',
				tokens,
			}),
		),
	});
	await expect(page.locator('#toast')).toContainText('512 overrides');
});
test('mobile keeps live preview on screen while editing without horizontal overflow', async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await open(page);
	await accent(page).scrollIntoViewIfNeeded();
	await accent(page).fill('#123456');
	await expect(page.locator('#preview')).toBeInViewport();
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
	await page.getByRole('button', { name: 'Export theme' }).click();
	await expect(page.locator('#export-dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.locator('#export-dialog')).not.toBeVisible();
});
