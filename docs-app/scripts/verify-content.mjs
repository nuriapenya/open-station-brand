import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';

const root = process.cwd();
const contentRoot = join( root, 'src/content' );
const publicRoot = join( root, 'public' );
const failures = [];

function walk( directory ) {
	return readdirSync( directory, { withFileTypes: true } ).flatMap( ( entry ) => {
		const path = join( directory, entry.name );
		return entry.isDirectory() ? walk( path ) : [ path ];
	} );
}

function fail( message ) {
	failures.push( message );
}

const markdownFiles = walk( contentRoot ).filter( ( file ) => file.endsWith( '.md' ) );
const slugs = new Set( markdownFiles.map( ( file ) => relative( contentRoot, file ).replaceAll( '\\', '/' ).replace( /\.md$/, '' ) ) );

if ( markdownFiles.length < 90 ) fail( `Expected a broad documentation crawl; found only ${ markdownFiles.length } Markdown files.` );

for ( const file of markdownFiles ) {
	const source = readFileSync( file, 'utf8' );
	const currentSlug = relative( contentRoot, file ).replaceAll( '\\', '/' ).replace( /\.md$/, '' );
	if ( ! /^#\s+\S/m.test( source ) ) fail( `${ currentSlug } has no level-one heading.` );

	const links = source.matchAll( /!?\[[^\]]*\]\(([^)]+)\)/g );
	for ( const match of links ) {
		let href = match[ 1 ].trim().replace( /\s+["'][^"']*["']$/, '' ).replace( /^<|>$/g, '' );
		if ( ! href || /^(?:https?:|mailto:|tel:|data:|#)/.test( href ) ) continue;
		href = href.split( '#', 1 )[ 0 ];
		if ( href.endsWith( '.md' ) ) {
			let target = posix.normalize( posix.join( posix.dirname( currentSlug ), href.replace( /\.md$/, '' ) ) );
			if ( target.startsWith( 'repo/docs/' ) ) target = target.replace( 'repo/docs/', 'repo/' );
			if ( target.startsWith( 'docs/' ) ) target = target.replace( 'docs/', 'repo/' );
			if ( ! slugs.has( target ) ) fail( `${ currentSlug } links to missing Markdown page ${ href }.` );
		}
		if ( match[ 0 ].startsWith( '!' ) && ! /^(?:https?:|data:)/.test( href ) ) {
			const asset = href.startsWith( '/' ) ? join( publicRoot, href.slice( 1 ) ) : join( dirname( file ), href );
			if ( ! existsSync( asset ) ) fail( `${ currentSlug } references missing image ${ href }.` );
		}
	}
}

for ( const screenshot of [
	'openstation-dashboard.png',
	'openstation-multi-window.png',
	'openstation-preferences.png',
	'openstation-spaces-overview.png',
] ) {
	const path = join( publicRoot, 'screenshots', screenshot );
	if ( ! existsSync( path ) || statSync( path ).size < 10_000 ) fail( `Screenshot is missing or suspiciously small: ${ screenshot }.` );
}

// Response headers are not checked here: the landing bundle supplies them
// for the whole site from mockups/_headers.
for ( const required of [ 'dist/index.html', 'dist/assets' ] ) {
	if ( ! existsSync( join( root, required ) ) ) fail( `Production artifact is missing ${ required }.` );
}

if ( failures.length ) {
	console.error( `Verification failed with ${ failures.length } issue(s):` );
	for ( const failure of failures ) console.error( `- ${ failure }` );
	process.exit( 1 );
}

console.log( `Verified ${ markdownFiles.length } documentation pages, ${ slugs.size } routes, four product screenshots, and the production artifact.` );
