import { build } from 'esbuild';
await build({
	entryPoints: ['vendor/alcazaba-ui/entry.ts'],
	bundle: true,
	format: 'iife',
	target: 'es2022',
	outfile: 'assets/studio/components.js',
	minify: true,
	legalComments: 'eof',
});
