import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'static',
	publicDir: './.astro-public',
	outDir: './dist',
	compressHTML: false,
	devToolbar: { enabled: false },
	server: { host: '127.0.0.1', port: 4321 },
});
