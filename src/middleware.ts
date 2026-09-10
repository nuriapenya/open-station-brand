import { defineMiddleware } from 'astro:middleware';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Astro dev resolves HTML navigations as routes. Serve the existing supporting
// documents verbatim, just as a flat host does in production. They are not ports.
const existingPages: Record<string, string> = {
	'/press': 'press/index.html',
	'/press/': 'press/index.html',
	'/contribute': 'contribute/index.html',
	'/contribute/': 'contribute/index.html',
	'/docs': 'docs/index.html',
	'/docs/': 'docs/index.html',
};

export const onRequest = defineMiddleware(async ({ url }, next) => {
	const file = existingPages[url.pathname];
	if (import.meta.env.DEV && file) {
		try {
			const html = await readFile(resolve('.astro-public', file), 'utf8');
			return new Response(html, {
				headers: { 'Content-Type': 'text/html; charset=utf-8' },
			});
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
	}
	return next();
});
