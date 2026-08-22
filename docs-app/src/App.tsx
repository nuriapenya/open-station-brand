import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { docBySlug, docs, hrefFor, loadDoc, loadSearchIndex, navGroups, neighborsOf, resolveMarkdownHref, type DocMeta } from './content';
import type { DocHeading } from './content-metadata';
import { site } from './site';
import { ArrowUpRightIcon, CheckIcon, ChevronRightIcon, CloseIcon, CommandIcon, Logo, MenuIcon, SearchIcon, WindowIcon } from './icons';

type Route = { page: 'home' } | { page: 'doc'; slug: string; anchor?: string };

function getRoute(): Route {
	// Routes read `#/guides/welcome` and `#/repo/api-index`. The prototype
	// used `#/docs/...`; links to it still resolve.
	const hash = window.location.hash.replace( /^#\/?/, '' ).replace( /^docs\//, '' );
	if ( ! hash ) return { page: 'home' };
	const [ slug, anchor ] = hash.split( '#', 2 );
	return { page: 'doc', slug, anchor };
}

const audienceLabel = ( audience: DocMeta[ 'audience' ] ) => ( audience === 'user' ? 'Use OpenStation' : 'Build for OpenStation' );

function sourceUrlFor( doc: DocMeta ) {
	// The guides are written here; everything under repo/ mirrors the plugin.
	if ( doc.kind === 'guide' ) return `${ site.sourceBlob }/src/content/${ doc.slug }.md`;
	const path = doc.slug.replace( /^repo\//, '' );
	if ( path === 'project-readme' ) return `${ site.plugin }/blob/trunk/README.md`;
	if ( path === 'wordpress-readme' ) return `${ site.plugin }/blob/trunk/readme.txt`;
	if ( path === 'editor-preview-regression' ) return `${ site.plugin }/blob/trunk/tests/e2e/editor-preview/README.md`;
	return `${ site.plugin }/blob/trunk/docs/${ path }.md`;
}

function ExternalLink( { href, className, children }: { href: string; className?: string; children: ReactNode } ) {
	return <a className={ className } href={ href } target="_blank" rel="noreferrer">{ children }</a>;
}

/* ---------------------------------------------------------------- Chrome */

function SiteHeader( { onSearch, navOpen, onToggleNav }: { onSearch: () => void; navOpen: boolean; onToggleNav: () => void } ) {
	return (
		<header className="site-header">
			<div className="lockup">
				<a className="lockup-home" href="/" aria-label="OpenStation home"><Logo/></a>
				<svg className="lockup-slash" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3.5 8.5 20.5"/></svg>
				<a className="lockup-docs" href="#/">Docs</a>
			</div>
			<button type="button" className="search-trigger" onClick={ onSearch }>
				<SearchIcon/>
				<span>Search docs</span>
				<kbd aria-hidden="true">⌘K</kbd>
			</button>
			<nav className="site-nav" aria-label="Site">
				{ site.nav.map( ( item ) => <a key={ item.href } href={ item.href }>{ item.label }{ item.external && <ArrowUpRightIcon className="ext" size={ 12 }/> }</a> ) }
			</nav>
			<a className="btn sm solid install" href={ site.install }>Install</a>
			<button type="button" className="nav-toggle" aria-expanded={ navOpen } aria-controls="docs-sidebar" onClick={ onToggleNav }>
				<span className="sr-only">{ navOpen ? 'Close menu' : 'Menu' }</span>
				{ navOpen ? <CloseIcon size={ 22 }/> : <MenuIcon size={ 22 }/> }
			</button>
		</header>
	);
}

function Sidebar( { current, open, onClose }: { current?: string; open: boolean; onClose: () => void } ) {
	const closeRef = useRef< HTMLButtonElement >( null );
	useEffect( () => {
		if ( open ) closeRef.current?.focus();
	}, [ open ] );

	return (
		<aside id="docs-sidebar" className={ `sidebar${ open ? ' is-open' : '' }` }>
			<div className="sidebar-head">
				<span>Docs</span>
				<button ref={ closeRef } type="button" onClick={ onClose } aria-label="Close navigation"><CloseIcon size={ 18 }/></button>
			</div>
			<nav aria-label="Documentation">
				<a className={ `nav-home${ ! current ? ' active' : '' }` } aria-current={ ! current ? 'page' : undefined } href="#/" onClick={ onClose }>Documentation home</a>
				{ /* The two audiences are separated by a rule, not a heading: the
				     section names say enough on their own. */ }
				{ navGroups.map( ( group ) => (
					<div className="nav-group" key={ group.audience }>
						{ group.sections.map( ( section, index ) => (
							<details key={ section.name } open={ section.docs.some( ( doc ) => doc.slug === current ) || index === 0 }>
								<summary><ChevronRightIcon size={ 14 }/>{ section.name }</summary>
								<div className="nav-list">
									{ section.docs.map( ( doc ) => (
										<a key={ doc.slug } className={ doc.slug === current ? 'active' : '' } aria-current={ doc.slug === current ? 'page' : undefined } href={ hrefFor( doc.slug ) } onClick={ onClose }>{ doc.title }</a>
									) ) }
								</div>
							</details>
						) ) }
					</div>
				) ) }
			</nav>
			<nav className="sidebar-site" aria-label="Site">
				<span>OpenStation</span>
				{ site.nav.map( ( item ) => <a key={ item.href } href={ item.href }>{ item.label }{ item.external && <ArrowUpRightIcon className="ext" size={ 12 }/> }</a> ) }
				<a href={ site.install }>Install</a>
			</nav>
		</aside>
	);
}

function SiteFooter() {
	return (
		<footer className="site-footer">
			<a href="https://wordpress.org/plugins/desktop-mode/">wordpress.org</a>
			<a href={ site.plugin }>GitHub</a>
			<a href="https://openstation.blog">Blog</a>
			<a href={ site.source }>Improve these docs</a>
			<span className="credit mono">Built by Automattic · <a href="https://spacefast.com">Hosted on Spacefast</a></span>
		</footer>
	);
}

/* ------------------------------------------------------------------ Home */

function Home() {
	const guide = ( slug: string ) => hrefFor( `guides/${ slug }` );
	useEffect( () => {
		document.title = site.name;
		window.scrollTo( 0, 0 );
	}, [] );

	return (
		<main id="main" className="home" tabIndex={ -1 }>
			<section className="hero grid-section">
				<h1>Docs for the people who use OpenStation <span>and the people who build for it.</span></h1>
				<p>If you use OpenStation day to day, start with the product guides. If you are making something for it, the builder docs lead to setup, APIs, examples and project internals.</p>
				<div className="hero-actions">
					<a className="btn solid" href={ guide( 'welcome' ) }>Use OpenStation</a>
					<a className="btn outline" href={ guide( 'system-overview' ) }>Build for OpenStation</a>
				</div>
			</section>

			<section className="home-section audience-paths">
				<div className="section-intro"><span>Choose a path</span><h2>What are you here to do?</h2><p>Start with the product guides if you run OpenStation. Choose the builder docs if you make plugins, themes, integrations or contributions.</p></div>
				<div className="path-grid">
					<article className="path-card user">
						<div className="path-card-title"><WindowIcon size={ 24 }/><div><span>Product guides</span><h3>Use OpenStation</h3><p>Install it, learn the desktop, arrange your work, personalise it, and find help when something feels off.</p></div></div>
						<nav className="path-links" aria-label="Use OpenStation shortcuts">
							<a href={ guide( 'welcome' ) }>Start here <ChevronRightIcon size={ 14 }/></a>
							<a href={ guide( 'install-and-first-run' ) }>Install and first run</a>
							<a href={ guide( 'product-tour' ) }>Take the product tour</a>
							<a href={ guide( 'windows-and-spaces' ) }>Work with windows and Spaces</a>
							<a href={ guide( 'troubleshooting' ) }>Troubleshoot a problem</a>
						</nav>
					</article>
					<article className="path-card builder">
						<div className="path-card-title"><CommandIcon size={ 24 }/><div><span>Builder docs</span><h3>Build for OpenStation</h3><p>Set up the repository, understand the architecture, register extensions, and work from tested examples.</p></div></div>
						<nav className="path-links" aria-label="Build for OpenStation shortcuts">
							<a href={ guide( 'system-overview' ) }>Builder overview <ChevronRightIcon size={ 14 }/></a>
							<a href={ hrefFor( 'repo/getting-started' ) }>Set up a development copy</a>
							<a href={ hrefFor( 'repo/api-index' ) }>Browse the API index</a>
							<a href={ hrefFor( 'repo/examples/README' ) }>Use an example</a>
							<a href={ guide( 'contributing' ) }>Contribute to the project</a>
						</nav>
					</article>
				</div>
			</section>

			<section className="home-section tour-strip">
				<div className="section-intro"><span>For people using OpenStation</span><h2>See how it changes wp-admin</h2><p>These screenshots come from the live WordPress Playground demo and show the product running with normal WordPress screens.</p></div>
				<div className="screenshot-grid">
					<figure className="shot shot-wide"><img src="./screenshots/openstation-multi-window.png" alt="Dashboard, Posts and Media open as overlapping OpenStation windows" loading="lazy"/><figcaption><strong>WordPress screens in movable windows</strong><span>Dashboard, Posts and Media keep their familiar WordPress behaviour.</span></figcaption></figure>
					<figure className="shot"><img src="./screenshots/openstation-spaces-overview.png" alt="OpenStation Spaces overview showing three windows" loading="lazy"/><figcaption><strong>Windows and Spaces at a glance</strong><span>See what is open and switch between virtual desktops.</span></figcaption></figure>
					<figure className="shot"><img src="./screenshots/openstation-preferences.png" alt="OpenStation Preferences appearance panel" loading="lazy"/><figcaption><strong>Preferences in one place</strong><span>Manage appearance, themes, windows, apps, features and components.</span></figcaption></figure>
				</div>
				<a className="text-link" href={ guide( 'product-tour' ) }>Take the product tour <ChevronRightIcon size={ 14 }/></a>
			</section>

			<section className="home-section builder-shortcuts">
				<div className="section-intro"><span>For people building with OpenStation</span><h2>Get to the technical details quickly</h2><p>Begin with the system overview, then move into the reference or a working example.</p></div>
				<div className="feature-cards">
					<Feature label="Guide" title="Architecture" copy="How the shell, iframe and native windows, registries, bridges, persistence and lifecycle fit together." href={ guide( 'system-overview' ) }/>
					<Feature label="Reference" title="APIs and hooks" copy="The JavaScript API, PHP hooks, components, bridge messages, window lifecycle and extension points." href={ hrefFor( 'repo/api-index' ) }/>
					<Feature label="Recipes" title="Examples" copy="Focused examples for windows, dock items, files, actions, settings, themes, widgets and integrations." href={ hrefFor( 'repo/examples/README' ) }/>
					<Feature label="Guide" title="Testing" copy="Vitest, WordPress PHPUnit, PHPCS, TypeScript checks, production builds and the browser regression flow." href={ guide( 'testing' ) }/>
					<Feature label="Guide" title="Contributing" copy="Set up the project, work with generated assets, follow repository conventions and prepare a pull request." href={ guide( 'contributing' ) }/>
					<Feature label="Reference" title="JavaScript reference" copy="The typed wp.os surface, window methods, registries, events and compatibility details." href={ hrefFor( 'repo/javascript-reference' ) }/>
				</div>
			</section>

			<section className="home-section status-panel">
				<div>
					<span className="eyebrow">Documentation checks</span>
					<h2>How these docs were verified</h2>
					<p>They cover repository commit <code>{ site.checked.commit }</code>, reviewed { site.checked.date }. We inspected the source and tests, ran the build pipeline, and worked through the live product in WordPress Playground.</p>
				</div>
				<ul>
					{ site.audit.map( ( line ) => <li key={ line }><CheckIcon size={ 16 }/>{ line }</li> ) }
				</ul>
			</section>

			<section className="final-cta grid-section">
				<Logo size={ 42 }/>
				<h2>Ready to get started?</h2>
				<p>Open the product guide or head to the builder docs.</p>
				<div>
					<a className="btn solid" href={ guide( 'welcome' ) }>Use OpenStation</a>
					<a className="btn outline" href={ guide( 'system-overview' ) }>Build for OpenStation</a>
				</div>
			</section>
		</main>
	);
}

function Feature( { label, title, copy, href }: { label: string; title: string; copy: string; href: string } ) {
	return (
		<a className="feature-card" href={ href }>
			<span className="feature-label">{ label }</span>
			<h3>{ title }</h3>
			<p>{ copy }</p>
			<span className="feature-more">Read more <ChevronRightIcon size={ 14 }/></span>
		</a>
	);
}

/* ------------------------------------------------------------- Doc pages */

/**
 * The heading currently at the top of the viewport, for the "On this page"
 * rail. Scroll-driven rather than IntersectionObserver so the answer is the
 * same whichever direction the reader came from.
 */
function useActiveHeading( headings: DocHeading[], ready: boolean ) {
	const [ active, setActive ] = useState< string >();
	useEffect( () => {
		if ( ! ready ) return undefined;
		const update = () => {
			let current: string | undefined;
			for ( const heading of headings ) {
				const element = document.getElementById( heading.id );
				if ( ! element ) continue;
				if ( element.getBoundingClientRect().top > 96 ) break;
				current = heading.id;
			}
			setActive( current );
		};
		update();
		window.addEventListener( 'scroll', update, { passive: true } );
		return () => window.removeEventListener( 'scroll', update );
	}, [ headings, ready ] );
	return active;
}

function DocPage( { doc, anchor }: { doc: DocMeta; anchor?: string } ) {
	const [ content, setContent ] = useState< string | null >( null );
	const [ failed, setFailed ] = useState( false );
	const { previous, next } = neighborsOf( doc.slug );
	const activeHeading = useActiveHeading( doc.headings, content !== null );

	useEffect( () => {
		let cancelled = false;
		document.title = `${ doc.title } · ${ site.name }`;
		window.scrollTo( 0, 0 );
		loadDoc( doc.slug ).then(
			( text ) => { if ( ! cancelled ) setContent( text ); },
			() => { if ( ! cancelled ) setFailed( true ); },
		);
		return () => { cancelled = true; };
	}, [ doc ] );

	// An anchor has nothing to scroll to until the body is in the page.
	useEffect( () => {
		if ( content === null || ! anchor ) return;
		window.requestAnimationFrame( () => document.getElementById( decodeURIComponent( anchor ) )?.scrollIntoView() );
	}, [ content, anchor ] );

	// The title is already on the page from the metadata, so the Markdown
	// renders without its level-one heading.
	const body = useMemo( () => content?.replace( /^\s*#\s[^\n]*\n?/, '' ) ?? '', [ content ] );

	return (
		<main id="main" className="doc-shell" tabIndex={ -1 }>
			<article className="doc-article">
				<nav className="breadcrumb" aria-label="Breadcrumb">
					<a href="#/">Docs</a>
					<ChevronRightIcon size={ 12 }/>
					<span>{ doc.section }</span>
				</nav>
				<h1>{ doc.title }</h1>
				{ failed && <p className="doc-notice">This page could not be loaded. <ExternalLink href={ sourceUrlFor( doc ) }>Read it on GitHub</ExternalLink>.</p> }
				{ content === null && ! failed && <div className="doc-skeleton" aria-busy="true" aria-label="Loading the page"><span/><span/><span/><span/><span/></div> }
				{ content !== null && (
					<ReactMarkdown
						remarkPlugins={ [ remarkGfm ] }
						rehypePlugins={ [ rehypeSlug, [ rehypeAutolinkHeadings, { behavior: 'wrap' } ] ] }
						components={ {
							a: ( { href, children, ...props } ) => {
								const resolved = resolveMarkdownHref( doc.slug, href );
								const external = Boolean( resolved?.startsWith( 'http' ) );
								return <a href={ resolved } target={ external ? '_blank' : undefined } rel={ external ? 'noreferrer' : undefined } { ...props }>{ children }{ external && <ArrowUpRightIcon className="inline-icon" size={ 12 }/> }</a>;
							},
							// Page images are written root-relative; the site lives at /docs/.
							img: ( { src, alt, ...props } ) => <img src={ typeof src === 'string' && src.startsWith( '/' ) ? `.${ src }` : src } alt={ alt ?? '' } loading="lazy" { ...props }/>,
							pre: ( { children } ) => <CodeBlock>{ children }</CodeBlock>,
						} }
					>{ body }</ReactMarkdown>
				) }
				<footer className="doc-foot">
					<ExternalLink className="doc-source" href={ sourceUrlFor( doc ) }>{ doc.kind === 'guide' ? 'Edit this page on GitHub' : 'View the source on GitHub' } <ArrowUpRightIcon size={ 13 }/></ExternalLink>
					<nav className="pagination" aria-label="Previous and next page">
						{ previous ? <a className="previous" href={ hrefFor( previous.slug ) }><span>Previous</span><strong>{ previous.title }</strong></a> : <span/> }
						{ next ? <a className="next" href={ hrefFor( next.slug ) }><span>Next</span><strong>{ next.title }</strong></a> : <span/> }
					</nav>
				</footer>
			</article>
			{ doc.headings.length > 1 && (
				<nav className="toc" aria-label="On this page">
					<strong>On this page</strong>
					{ doc.headings.slice( 0, 24 ).map( ( heading ) => (
						<a
							key={ heading.id }
							className={ `${ heading.depth === 3 ? 'nested' : '' }${ heading.id === activeHeading ? ' active' : '' }` }
							aria-current={ heading.id === activeHeading ? 'location' : undefined }
							href={ hrefFor( doc.slug, `#${ heading.id }` ) }
						>{ heading.text }</a>
					) ) }
				</nav>
			) }
		</main>
	);
}

function CodeBlock( { children }: { children: ReactNode } ) {
	const ref = useRef< HTMLPreElement >( null );
	const [ copied, setCopied ] = useState( false );
	const copy = async () => {
		await navigator.clipboard.writeText( ref.current?.innerText ?? '' );
		setCopied( true );
		window.setTimeout( () => setCopied( false ), 1500 );
	};
	return (
		<div className="code-wrap">
			<button type="button" className={ copied ? 'is-copied' : '' } onClick={ copy } aria-live="polite">{ copied ? <><CheckIcon size={ 13 }/>Copied</> : 'Copy' }</button>
			<pre ref={ ref }>{ children }</pre>
		</div>
	);
}

function NotFound() {
	return (
		<main id="main" className="not-found" tabIndex={ -1 }>
			<span>404</span>
			<h1>We could not find that page.</h1>
			<p>It may have moved, or the address may be incomplete.</p>
			<a className="btn solid" href="#/">Go to the documentation home</a>
		</main>
	);
}

/* ---------------------------------------------------------------- Search */

function SearchPalette( { open, onClose }: { open: boolean; onClose: () => void } ) {
	const [ query, setQuery ] = useState( '' );
	const [ index, setIndex ] = useState< Record< string, string > | null >( null );
	const [ cursor, setCursor ] = useState( 0 );
	const inputRef = useRef< HTMLInputElement >( null );
	const closeRef = useRef< HTMLButtonElement >( null );
	const listRef = useRef< HTMLUListElement >( null );

	useEffect( () => {
		if ( ! open ) { setQuery( '' ); return; }
		loadSearchIndex().then( setIndex ).catch( () => setIndex( {} ) );
		window.setTimeout( () => inputRef.current?.focus(), 0 );
	}, [ open ] );

	const results = useMemo( () => {
		const needle = query.trim().toLocaleLowerCase();
		if ( ! needle ) return docs.slice( 0, 10 );
		return docs.map( ( doc ) => {
			const titleScore = doc.title.toLocaleLowerCase().includes( needle ) ? 50 : 0;
			const hits = index?.[ doc.slug ] ? index[ doc.slug ].split( needle ).length - 1 : 0;
			return { doc, score: titleScore + Math.min( hits, 20 ) };
		} ).filter( ( item ) => item.score > 0 ).sort( ( a, b ) => b.score - a.score ).slice( 0, 12 ).map( ( item ) => item.doc );
	}, [ query, index ] );

	useEffect( () => setCursor( 0 ), [ results ] );
	useEffect( () => {
		listRef.current?.children[ cursor ]?.scrollIntoView( { block: 'nearest' } );
	}, [ cursor ] );

	const go = ( doc?: DocMeta ) => {
		if ( ! doc ) return;
		window.location.hash = hrefFor( doc.slug );
		onClose();
	};

	const onKeyDown = ( event: ReactKeyboardEvent ) => {
		if ( event.key === 'ArrowDown' ) { event.preventDefault(); setCursor( ( value ) => Math.min( value + 1, results.length - 1 ) ); }
		else if ( event.key === 'ArrowUp' ) { event.preventDefault(); setCursor( ( value ) => Math.max( value - 1, 0 ) ); }
		else if ( event.key === 'Enter' ) { event.preventDefault(); go( results[ cursor ] ); }
		else if ( event.key === 'Tab' ) {
			// The dialog has two stops, the field and the close button. Keep
			// Tab inside them rather than letting it wander behind the sheet.
			const target = event.shiftKey ? ( event.target === inputRef.current ? closeRef.current : null ) : ( event.target === closeRef.current ? inputRef.current : null );
			if ( target ) { event.preventDefault(); target.focus(); }
		}
	};

	if ( ! open ) return null;
	return (
		<div className="search-backdrop" onMouseDown={ onClose }>
			<section className="search-palette" role="dialog" aria-modal="true" aria-label="Search the documentation" onMouseDown={ ( event ) => event.stopPropagation() } onKeyDown={ onKeyDown }>
				<div className="search-input">
					<SearchIcon size={ 18 }/>
					<input
						ref={ inputRef }
						type="search"
						role="combobox"
						aria-expanded="true"
						aria-controls="search-results"
						aria-activedescendant={ results[ cursor ] ? `search-result-${ cursor }` : undefined }
						aria-autocomplete="list"
						autoComplete="off"
						spellCheck={ false }
						value={ query }
						onChange={ ( event ) => setQuery( event.target.value ) }
						placeholder="Search windows, themes, APIs, troubleshooting"
					/>
					<button ref={ closeRef } type="button" onClick={ onClose } aria-label="Close search"><CloseIcon size={ 18 }/></button>
				</div>
				{ results.length ? (
					<ul id="search-results" className="search-results" role="listbox" ref={ listRef }>
						{ results.map( ( doc, position ) => (
							<li
								key={ doc.slug }
								id={ `search-result-${ position }` }
								role="option"
								aria-selected={ position === cursor }
								className={ position === cursor ? 'is-active' : '' }
								onMouseEnter={ () => setCursor( position ) }
								onMouseDown={ ( event ) => event.preventDefault() }
								onClick={ () => go( doc ) }
							>
								<a href={ hrefFor( doc.slug ) } tabIndex={ -1 } onClick={ ( event ) => event.preventDefault() }>
									<span>{ audienceLabel( doc.audience ) } · { doc.section }</span>
									<strong>{ doc.title }</strong>
									<p>{ doc.description }</p>
								</a>
							</li>
						) ) }
					</ul>
				) : (
					<div className="no-results"><strong>No results for “{ query.trim() }”</strong><span>Try a shorter or more general search.</span></div>
				) }
				<div className="search-hints">
					<span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
					<span><kbd>↵</kbd> open</span>
					<span><kbd>esc</kbd> close</span>
					<span className="search-status">{ index ? `${ docs.length } pages` : 'Indexing…' }</span>
				</div>
			</section>
		</div>
	);
}

/* ------------------------------------------------------------------- App */

export function App() {
	const [ route, setRoute ] = useState< Route >( getRoute );
	const [ searchOpen, setSearchOpen ] = useState( false );
	const [ navOpen, setNavOpen ] = useState( false );

	useEffect( () => {
		const update = () => { setRoute( getRoute() ); setNavOpen( false ); };
		const keys = ( event: KeyboardEvent ) => {
			if ( ( event.metaKey || event.ctrlKey ) && event.key.toLocaleLowerCase() === 'k' ) { event.preventDefault(); setSearchOpen( true ); }
			if ( event.key === 'Escape' ) { setSearchOpen( false ); setNavOpen( false ); }
		};
		// Widening past the breakpoint docks the sidebar again; the drawer
		// state has to come off with it or the scroll lock stays behind.
		const docked = window.matchMedia( '(min-width: 861px)' );
		const onDock = ( event: MediaQueryListEvent ) => { if ( event.matches ) setNavOpen( false ); };
		window.addEventListener( 'hashchange', update );
		window.addEventListener( 'keydown', keys );
		docked.addEventListener( 'change', onDock );
		return () => {
			window.removeEventListener( 'hashchange', update );
			window.removeEventListener( 'keydown', keys );
			docked.removeEventListener( 'change', onDock );
		};
	}, [] );

	useEffect( () => {
		document.documentElement.classList.toggle( 'nav-locked', navOpen );
	}, [ navOpen ] );

	const doc = route.page === 'doc' ? docBySlug.get( route.slug ) : undefined;

	return (
		<>
			<a className="skip-link" href="#/" onClick={ ( event ) => { event.preventDefault(); document.getElementById( 'main' )?.focus(); } }>Skip to content</a>
			<SiteHeader onSearch={ () => setSearchOpen( true ) } navOpen={ navOpen } onToggleNav={ () => setNavOpen( ( value ) => ! value ) }/>
			<div className="app-layout">
				{ navOpen && <div className="sidebar-backdrop" onClick={ () => setNavOpen( false ) }/> }
				<Sidebar current={ doc?.slug } open={ navOpen } onClose={ () => setNavOpen( false ) }/>
				<div className="content-area">
					{ route.page === 'home' ? <Home/> : doc ? <DocPage key={ doc.slug } doc={ doc } anchor={ route.anchor }/> : <NotFound/> }
					<SiteFooter/>
				</div>
			</div>
			<SearchPalette open={ searchOpen } onClose={ () => setSearchOpen( false ) }/>
		</>
	);
}
