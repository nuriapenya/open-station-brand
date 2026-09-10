import { dev } from 'astro';

// A foreground server gives Playwright ownership of startup and teardown,
// including when Astro's CLI detects an agent and defaults to a background job.
const server = await dev({ server: { host: '127.0.0.1', port: 4321 } });
for (const signal of ['SIGINT', 'SIGTERM']) {
	process.once(signal, async () => {
		await server.stop();
		process.exit(0);
	});
}
