import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin, type ViteDevServer, type PreviewServer } from 'vite';
import react from '@vitejs/plugin-react';
import { buildMetadata, buildSearchIndex } from './src/content-metadata';

const appRoot = fileURLToPath( new URL( '.', import.meta.url ) );
const contentRoot = join( appRoot, 'src/content' );

// The brand guide one level up. The site borrows its fonts, favicons and
// social card from there instead of carrying copies: in the published bundle
// they sit at the root, next to /docs/.
const repoRoot = resolve( appRoot, '..' );

function walk( directory: string ): string[] {
	return readdirSync( directory, { withFileTypes: true } ).flatMap( ( entry ) => {
		const path = join( directory, entry.name );
		return entry.isDirectory() ? walk( path ) : [ path ];
	} );
}

function readContent(): Record< string, string > {
	return Object.fromEntries(
		walk( contentRoot )
			.filter( ( file ) => file.endsWith( '.md' ) )
			.map( ( file ) => [ relative( contentRoot, file ).replaceAll( '\\', '/' ).replace( /\.md$/, '' ), readFileSync( file, 'utf8' ) ] ),
	);
}

/**
 * Two virtual modules built from src/content at build time:
 *
 *   virtual:doc-metadata   titles, blurbs, sections and headings for every page
 *   virtual:doc-search     the plain-text corpus the search palette scans
 *
 * The first is tiny and loads with the app. The second is most of the
 * documentation's weight and only loads the first time someone opens search.
 * The Markdown itself is split one chunk per page by import.meta.glob in
 * content.ts, so a page download is that page and nothing else.
 */
function docContent(): Plugin {
	const modules: Record< string, () => string > = {
		'virtual:doc-metadata': () => `export default ${ JSON.stringify( buildMetadata( readContent() ) ) };`,
		'virtual:doc-search': () => `export default ${ JSON.stringify( buildSearchIndex( readContent() ) ) };`,
	};
	const resolvedId = ( id: string ) => `\0${ id }`;

	return {
		name: 'openstation-doc-content',
		resolveId( source ) {
			return source in modules ? resolvedId( source ) : undefined;
		},
		load( id ) {
			for ( const [ name, build ] of Object.entries( modules ) ) {
				if ( id !== resolvedId( name ) ) continue;
				for ( const file of walk( contentRoot ) ) this.addWatchFile( file );
				return build();
			}
			return undefined;
		},
		handleHotUpdate( { file, server } ) {
			if ( ! file.startsWith( contentRoot ) || ! file.endsWith( '.md' ) ) return undefined;
			const stale = Object.keys( modules )
				.map( ( name ) => server.moduleGraph.getModuleById( resolvedId( name ) ) )
				.filter( ( module ): module is NonNullable< typeof module > => Boolean( module ) );
			stale.forEach( ( module ) => server.moduleGraph.invalidateModule( module ) );
			return stale;
		},
	};
}

/**
 * The head tags that point at the shared assets. They are injected after
 * Vite's own asset pass on purpose: written into index.html directly, Vite
 * would try to bundle /fonts/Geist-Variable.woff2 and fail, because the file
 * is not part of this app. Here they are plain strings Vite leaves alone.
 */
function sharedHead(): Plugin {
	return {
		name: 'openstation-shared-head',
		transformIndexHtml: {
			order: 'post',
			handler: () => [
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: '/assets/logomark-app-circle.svg' }, injectTo: 'head' },
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '180x180', href: '/assets/favicon.png' }, injectTo: 'head' },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/assets/favicon.png' }, injectTo: 'head' },
				{ tag: 'link', attrs: { rel: 'preload', href: '/fonts/Geist-Variable.woff2', as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head' },
				{ tag: 'link', attrs: { rel: 'preload', href: '/fonts/GeistMono-Variable.woff2', as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head' },
			],
		},
	};
}

/**
 * In `npm run dev` and `npm run preview` there is no bundle root to serve
 * /fonts and /assets from, so this answers those two paths from the brand
 * guide directly. Production never runs this code.
 */
function sharedAssets(): Plugin {
	const types: Record< string, string > = { '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain' };
	const serve = ( server: ViteDevServer | PreviewServer ) => {
		server.middlewares.use( ( request, response, next ) => {
			const url = ( request.url ?? '' ).split( '?' )[ 0 ];
			if ( ! /^\/(fonts|assets)\//.test( url ) ) return next();
			const file = join( repoRoot, url );
			if ( ! file.startsWith( repoRoot ) || ! existsSync( file ) || ! statSync( file ).isFile() ) return next();
			response.setHeader( 'Content-Type', types[ extname( file ) ] ?? 'application/octet-stream' );
			createReadStream( file ).pipe( response );
		} );
	};
	return { name: 'openstation-shared-assets', configureServer: serve, configurePreviewServer: serve };
}

export default defineConfig( {
	// Relative, so the same build works at /docs/ on openstation.me and at the
	// root of a preview space.
	base: './',
	plugins: [ react(), docContent(), sharedHead(), sharedAssets() ],
	build: {
		outDir: 'dist',
		sourcemap: true,
		// React, react-markdown and the app are one chunk; the pages and the
		// search corpus are split out by the plugin above, which is what the
		// default 500 kB warning was really about.
		chunkSizeWarningLimit: 600,
	},
} );
