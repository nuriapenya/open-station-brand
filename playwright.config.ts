import { defineConfig } from '@playwright/test';
export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	workers: 3,
	use: {
		baseURL: 'http://127.0.0.1:4321',
		viewport: { width: 1440, height: 1000 },
		trace: 'retain-on-failure',
	},
	webServer: {
		command: 'node scripts/prepare-public.mjs && node scripts/test-server.mjs',
		url: 'http://127.0.0.1:4321',
		reuseExistingServer: true,
	},
});
