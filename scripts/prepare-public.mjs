import './build-ui.mjs';
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Build the unchanged supporting docs once on a fresh checkout. It remains a
// separate app; no docs or plugin module is imported into the theme editor.
if (!existsSync('docs-app/dist/index.html')) {
	if (!existsSync('docs-app/node_modules'))
		execFileSync(
			'npm',
			['ci', '--prefix', 'docs-app', '--no-audit', '--no-fund'],
			{ stdio: 'inherit' }
		);
	execFileSync('npm', ['run', '--prefix', 'docs-app', 'build'], {
		stdio: 'inherit',
	});
}

// Keep every existing public URL. Never use the repository root as publicDir:
// doing so would expose source, dependencies and Git metadata in development.
await rm('.astro-public', { recursive: true, force: true });
await mkdir('.astro-public', { recursive: true });
for (const path of [
	'assets',
	'fonts',
	'vendor',
	'icons',
	'mockups',
	'brand.json',
	'llms.txt',
	'.nojekyll',
]) {
	await cp(path, `.astro-public/${path}`, { recursive: true });
}

// Supporting pages remain plain HTML; only the landing is ported to Astro.
for (const [name, source] of [
	['press', 'press_v1.html'],
	['contribute', 'contribute_v1.html'],
]) {
	await mkdir(`.astro-public/${name}`, { recursive: true });
	await cp(`mockups/${source}`, `.astro-public/${name}/index.html`);
}
await cp('mockups/_headers', '.astro-public/_headers');
// The existing docs app keeps its own build and dependencies.
try {
	await cp('docs-app/dist', '.astro-public/docs', { recursive: true });
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}
