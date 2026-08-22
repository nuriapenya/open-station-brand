import metadata from 'virtual:doc-metadata';
import { navigation, type DocMeta } from './content-metadata';

export type { DocMeta };

/** Every page, in navigation order. Built at compile time, see vite.config.ts. */
export const docs: DocMeta[] = metadata;
export const docBySlug = new Map( docs.map( ( doc ) => [ doc.slug, doc ] ) );

// One chunk per page, fetched the first time that page opens and kept.
const pages = import.meta.glob( './content/**/*.md', { query: '?raw', import: 'default' } ) as Record< string, () => Promise< string > >;
const loaded = new Map< string, Promise< string > >();

export function loadDoc( slug: string ): Promise< string > {
	const key = `./content/${ slug }.md`;
	const load = pages[ key ];
	if ( ! load ) return Promise.reject( new Error( `No page at ${ slug }` ) );
	if ( ! loaded.has( key ) ) loaded.set( key, load() );
	return loaded.get( key )!;
}

let searchIndex: Promise< Record< string, string > > | undefined;

/** The plain-text corpus, fetched once, the first time search opens. */
export function loadSearchIndex(): Promise< Record< string, string > > {
	searchIndex ??= import( 'virtual:doc-search' ).then( ( module ) => module.default );
	return searchIndex;
}

export function hrefFor( slug: string, anchor = '' ) {
	return `#/${ slug }${ anchor }`;
}

/**
 * Markdown links between pages are written as they are in the repository
 * (`../docs/api-index.md`), so they keep working on GitHub. This turns them
 * into routes here, and leaves anything it does not recognise alone.
 */
export function resolveMarkdownHref( currentSlug: string, href = '' ) {
	if ( ! href || /^(?:https?:|mailto:|tel:|data:)/.test( href ) ) return href;
	if ( href.startsWith( '#' ) ) return hrefFor( currentSlug, href );
	const [ rawPath, rawHash ] = href.split( '#', 2 );
	if ( ! rawPath.endsWith( '.md' ) ) return href;
	const parts = currentSlug.split( '/' );
	parts.pop();
	for ( const part of rawPath.replace( /\.md$/, '' ).split( '/' ) ) {
		if ( part === '.' || part === '' ) continue;
		if ( part === '..' ) parts.pop();
		else parts.push( part );
	}
	let resolved = parts.join( '/' );
	if ( resolved.startsWith( 'repo/docs/' ) ) resolved = resolved.replace( 'repo/docs/', 'repo/' );
	if ( resolved.startsWith( 'docs/' ) ) resolved = resolved.replace( 'docs/', 'repo/' );
	return docBySlug.has( resolved ) ? hrefFor( resolved, rawHash ? `#${ rawHash }` : '' ) : href;
}

export const navGroups = navigation.map( ( group ) => ( {
	...group,
	sections: group.sections
		.map( ( name ) => ( { name, docs: docs.filter( ( doc ) => doc.section === name ) } ) )
		.filter( ( section ) => section.docs.length ),
} ) );

/** The pages either side of `slug` in navigation order, within its audience. */
export function neighborsOf( slug: string ): { previous?: DocMeta; next?: DocMeta } {
	const index = docs.findIndex( ( doc ) => doc.slug === slug );
	if ( index === -1 ) return {};
	const sameAudience = ( doc?: DocMeta ) => ( doc && doc.audience === docs[ index ].audience ? doc : undefined );
	return { previous: sameAudience( docs[ index - 1 ] ), next: sameAudience( docs[ index + 1 ] ) };
}
