import GithubSlugger from 'github-slugger';

/**
 * Everything the site knows about a page without its body: title, blurb,
 * where it sits in the navigation, and its headings. The Vite plugin in
 * vite.config.ts runs buildMetadata() over src/content at build time and
 * ships the result as `virtual:doc-metadata`, so the browser can draw the
 * navigation and the home page without downloading a single Markdown file.
 *
 * Nothing in here may touch the DOM: this module runs in Node during the
 * build and in the browser at runtime.
 */

export type DocKind = 'guide' | 'reference' | 'recipe' | 'migration' | 'internal';
export type DocAudience = 'user' | 'builder';

export type DocHeading = { depth: number; text: string; id: string };

export type DocMeta = {
	slug: string;
	title: string;
	description: string;
	kind: DocKind;
	audience: DocAudience;
	section: string;
	headings: DocHeading[];
};

const guideOrder = [
	'welcome',
	'install-and-first-run',
	'product-tour',
	'windows-and-spaces',
	'personalize',
	'files-and-collaboration',
	'optional-ai',
	'extensions',
	'system-overview',
	'ai-and-agents',
	'caveats',
	'troubleshooting',
	'testing',
	'contributing',
];

const userGuideSections = new Map( [
	[ 'welcome', 'Getting started' ],
	[ 'install-and-first-run', 'Getting started' ],
	[ 'product-tour', 'Getting started' ],
	[ 'windows-and-spaces', 'Everyday use' ],
	[ 'personalize', 'Everyday use' ],
	[ 'files-and-collaboration', 'Everyday use' ],
	[ 'optional-ai', 'Everyday use' ],
	[ 'caveats', 'Help and troubleshooting' ],
	[ 'troubleshooting', 'Help and troubleshooting' ],
] );

const pinnedReferenceOrder = [
	'getting-started',
	'architecture',
	'api-index',
	'javascript-reference',
	'hooks-reference',
	'components-reference',
	'bridge-protocol',
	'event-driven-framework',
	'desktop-themes',
	'files-on-desktop',
	'folder-sharing',
	'pwa',
	'agents-security',
	'DEVELOPMENT',
	'RELEASE',
];

export const sectionOrder = [
	'Getting started',
	'Everyday use',
	'Help and troubleshooting',
	'Builder guide',
	'API and reference',
	'Recipes',
	'Migration notes',
	'Project internals',
];

export const navigation = [
	{
		audience: 'user' as const,
		name: 'Use OpenStation',
		description: 'Setup, daily work and help',
		sections: [ 'Getting started', 'Everyday use', 'Help and troubleshooting' ],
	},
	{
		audience: 'builder' as const,
		name: 'Build for OpenStation',
		description: 'Development, APIs and examples',
		sections: [ 'Builder guide', 'API and reference', 'Recipes', 'Migration notes', 'Project internals' ],
	},
];

export function stripMarkdown( value: string ): string {
	return value
		.replace( /```[\s\S]*?```/g, ' ' )
		.replace( /`([^`]+)`/g, '$1' )
		.replace( /!\[[^\]]*\]\([^)]*\)/g, ' ' )
		.replace( /\[([^\]]+)\]\([^)]*\)/g, '$1' )
		.replace( /[#>*_|~-]/g, ' ' )
		.replace( /\s+/g, ' ' )
		.trim();
}

/** The page's level-one heading. The page body is rendered without it. */
export function titleFrom( content: string, slug: string ): string {
	const match = content.match( /^#\s+(.+)$/m );
	return match?.[ 1 ]
		.replace( /[`*_]/g, '' )
		.trim() ?? slug.split( '/' ).pop()!.replaceAll( '-', ' ' );
}

export function descriptionFrom( content: string ): string {
	const withoutTitle = content.replace( /^#\s+.+$/m, '' );
	const paragraphs = withoutTitle.split( /\n\s*\n/ );
	for ( const paragraph of paragraphs ) {
		const clean = stripMarkdown( paragraph );
		if ( clean.length > 45 && ! clean.startsWith( 'Status:' ) ) {
			return clean.length > 190 ? `${ clean.slice( 0, 187 ) }…` : clean;
		}
	}
	return 'OpenStation documentation, checked against the current repository.';
}

export function headingsFrom( content: string ): DocHeading[] {
	const slugger = new GithubSlugger();
	return content
		.split( '\n' )
		.map( ( line ) => line.match( /^(#{2,3})\s+(.+)$/ ) )
		.filter( Boolean )
		.map( ( match ) => {
			const text = match![ 2 ].replace( /[`*_]/g, '' ).replace( /\[(.*?)\]\(.*?\)/g, '$1' );
			return { depth: match![ 1 ].length, text, id: slugger.slug( text ) };
		} );
}

function classify( slug: string ): Pick< DocMeta, 'kind' | 'audience' | 'section' > {
	if ( slug.startsWith( 'guides/' ) ) {
		const guideSlug = slug.replace( 'guides/', '' );
		const userSection = userGuideSections.get( guideSlug );
		return userSection
			? { kind: 'guide', audience: 'user', section: userSection }
			: { kind: 'guide', audience: 'builder', section: 'Builder guide' };
	}
	if ( slug.startsWith( 'repo/examples/' ) ) return { kind: 'recipe', audience: 'builder', section: 'Recipes' };
	if ( slug.startsWith( 'repo/plans/' ) ) return { kind: 'internal', audience: 'builder', section: 'Project internals' };
	if ( slug.includes( '/migration-' ) ) return { kind: 'migration', audience: 'builder', section: 'Migration notes' };
	return { kind: 'reference', audience: 'builder', section: 'API and reference' };
}

function compare( a: DocMeta, b: DocMeta ): number {
	const sectionDifference = sectionOrder.indexOf( a.section ) - sectionOrder.indexOf( b.section );
	if ( sectionDifference ) return sectionDifference;
	if ( a.kind === 'guide' && b.kind === 'guide' ) {
		return guideOrder.indexOf( a.slug.replace( 'guides/', '' ) ) - guideOrder.indexOf( b.slug.replace( 'guides/', '' ) );
	}
	if ( a.kind === 'reference' && b.kind === 'reference' ) {
		const aIndex = pinnedReferenceOrder.indexOf( a.slug.replace( 'repo/', '' ) );
		const bIndex = pinnedReferenceOrder.indexOf( b.slug.replace( 'repo/', '' ) );
		if ( aIndex !== -1 || bIndex !== -1 ) return ( aIndex === -1 ? 999 : aIndex ) - ( bIndex === -1 ? 999 : bIndex );
	}
	return a.title.localeCompare( b.title );
}

/** `files` maps a slug such as `guides/welcome` to the page's Markdown. */
export function buildMetadata( files: Record< string, string > ): DocMeta[] {
	return Object.entries( files )
		.map( ( [ slug, content ] ) => ( {
			slug,
			title: titleFrom( content, slug ),
			description: descriptionFrom( content ),
			...classify( slug ),
			headings: headingsFrom( content ),
		} ) )
		.sort( compare );
}

/** Lower-cased plain text per slug, the corpus the search palette scans. */
export function buildSearchIndex( files: Record< string, string > ): Record< string, string > {
	return Object.fromEntries(
		Object.entries( files ).map( ( [ slug, content ] ) => [ slug, stripMarkdown( content ).toLocaleLowerCase() ] ),
	);
}
