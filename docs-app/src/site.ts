/**
 * The facts that appear on more than one page. A release bumps this file and
 * nothing else: the version, the commit the content was checked against, and
 * the audit figures quoted on the home page all live here.
 */
export const site = {
	name: 'OpenStation Docs',
	url: 'https://openstation.me/docs/',
	version: '1.1.0',
	checked: {
		commit: 'a24da7c',
		commitFull: 'a24da7c0b0d7be0d26ff29b8d525a05dd97dc77a',
		date: 'August 15, 2026',
	},
	plugin: 'https://github.com/WordPress/openstation',
	install: 'https://get.openstation.me/',
	source: 'https://github.com/nuriapenya/open-station-brand/tree/main/docs-app',
	sourceBlob: 'https://github.com/nuriapenya/open-station-brand/blob/main/docs-app',
	// The landing page's nav, minus Docs (the lockup already says where we are).
	// `external` marks the one link that leaves the site, which gets an arrow.
	nav: [
		{ label: 'Blog', href: 'https://openstation.blog' },
		{ label: 'Contribute', href: '/contribute/' },
		{ label: 'Press', href: '/press/' },
		{ label: 'GitHub', href: 'https://github.com/WordPress/openstation', external: true },
	],
	audit: [
		'346 Vitest files, 4,319 tests passed',
		'2,196 PHPUnit tests, 6,955 assertions passed',
		'PHP coding standards passed across 208 files',
		'TypeScript, ESLint and every production bundle passed',
		'Dashboard, multi-window, Spaces and Preferences flows observed in Playground',
	],
};
