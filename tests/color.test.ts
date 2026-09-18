import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	parseRGBA,
	toCSS,
	toHex,
	rgbToHSV,
	hsvToRGB,
	colorValues,
} from '../src/lib/color.ts';
test('hex, RGB and transparent values retain alpha without rounding it to opaque', () => {
	assert.equal(parseRGBA('#1234')?.a, 68 / 255);
	assert.equal(toHex(parseRGBA('#abcdef80')!), '#abcdef80');
	assert.deepEqual(parseRGBA('rgb(100% 0% 50% / 37.5%)'), {
		r: 255,
		g: 0,
		b: 128,
		a: 0.375,
	});
	assert.equal(parseRGBA('rgba(10, 20, 30, 0)')?.a, 0);
	assert.equal(parseRGBA('transparent')?.a, 0);
	assert.equal(
		toCSS({ r: 10, g: 20, b: 30, a: 0.375 }),
		'rgba(10, 20, 30, 0.375)',
	);
	for (const value of ['rgba(1,2)', 'rgb(foo 0 0)', 'red;display:none', '#12'])
		assert.equal(parseRGBA(value), null);
});
test('HSV conversion keeps opacity at zero, fractional and full values', () => {
	for (const a of [0, 0.125, 0.5, 1])
		for (const [r, g, b] of [
			[0, 0, 0],
			[255, 255, 255],
			[13, 80, 221],
			[250, 0, 21],
		]) {
			const input = { r, g, b, a };
			assert.deepEqual(hsvToRGB(rgbToHSV(input), a), input);
		}
});
test('gradient and shadow extraction keeps full alpha-bearing color functions', () => {
	assert.deepEqual(
		colorValues(
			'linear-gradient(45deg, rgba(10, 20, 30, .2) 0%, #abcdef80 100%)',
		),
		['rgba(10, 20, 30, .2)', '#abcdef80'],
	);
	assert.deepEqual(
		colorValues('0 2px 8px color-mix(in srgb, rgba(0,0,0,.3), transparent)'),
		['color-mix(in srgb, rgba(0,0,0,.3), transparent)'],
	);
	assert.deepEqual(
		colorValues('linear-gradient(90deg, red 0%, transparent 100%)'),
		['red', 'transparent'],
	);
});
