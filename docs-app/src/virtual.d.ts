// Modules produced by the plugin in vite.config.ts. See content-metadata.ts.

declare module 'virtual:doc-metadata' {
	const docs: import( './content-metadata' ).DocMeta[];
	export default docs;
}

declare module 'virtual:doc-search' {
	const index: Record< string, string >;
	export default index;
}
