import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { parseTheme } from './theme.ts';
import type { Theme } from './theme.ts';
import { assetPath, referencedAssets } from './manifest-fields.ts';
export type AssetMap = Record<string, Uint8Array>;
export const LIMITS = {
	files: 256,
	file: 8 * 1024 * 1024,
	total: 32 * 1024 * 1024,
};
export function validateAssetBytes(path: string, data: Uint8Array): void {
	assetPath(path);
	if (data.length > LIMITS.file)
		throw new Error(`${path} exceeds the 8 MB file limit.`);
	const ext = path.split('.').at(-1)!.toLowerCase();
	if (ext === 'svg') {
		const svg = strFromU8(data);
		// SVG stays an image, never markup injected into the studio. Refuse active
		// content and external dependencies so export cannot smuggle either along.
		if (
			!/<svg[\s>]/i.test(svg) ||
			/<!DOCTYPE|<!ENTITY|<(?:script|foreignObject|iframe|object|embed|audio|video)\b|\bon[a-z]+\s*=|javascript\s*:|@import|url\(\s*['"]?(?!#)|(?:href|src)\s*=\s*['"](?!#)/i.test(
				svg,
			)
		)
			throw new Error(
				`${path}: use a self-contained SVG without scripts or external references.`,
			);
	}
	if (
		ext === 'png' &&
		![137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => data[i] === v)
	)
		throw new Error(`${path} is not a PNG image.`);
	if (['jpg', 'jpeg'].includes(ext) && !(data[0] === 255 && data[1] === 216))
		throw new Error(`${path} is not a JPEG image.`);
	if (ext === 'gif' && !/^GIF8[79]a/.test(strFromU8(data.slice(0, 6))))
		throw new Error(`${path} is not a GIF image.`);
	if (
		ext === 'webp' &&
		(strFromU8(data.slice(0, 4)) !== 'RIFF' ||
			strFromU8(data.slice(8, 12)) !== 'WEBP')
	)
		throw new Error(`${path} is not a WebP image.`);
	if (['woff', 'woff2', 'otf', 'ttf'].includes(ext)) {
		const sig = strFromU8(data.slice(0, 4));
		if (
			!['wOFF', 'wOF2', 'OTTO', 'true', 'ttcf'].includes(sig) &&
			!(data[0] === 0 && data[1] === 1 && data[2] === 0 && data[3] === 0)
		)
			throw new Error(`${path} is not a supported font file.`);
	}
}
export function packageTheme(theme: Theme, assets: AssetMap): Uint8Array {
	const clean = parseTheme(theme);
	const missing = referencedAssets(clean).filter((p) => !assets[p]);
	if (missing.length)
		throw new Error(
			`Add the missing files before exporting: ${missing.join(', ')}`,
		);
	const files: AssetMap = {
		'theme.json': strToU8(JSON.stringify(clean, null, 2) + '\n'),
	};
	// Keep license/readme documents from imported archives alongside referenced art.
	for (const path of [
		...referencedAssets(clean),
		...Object.keys(assets).filter((p) => /\.(txt|md)$/i.test(p)),
	]) {
		validateAssetBytes(path, assets[path]);
		files[path] = assets[path];
	}
	if (Object.keys(files).length > LIMITS.files)
		throw new Error('The archive exceeds 256 files.');
	if (Object.values(files).reduce((sum, b) => sum + b.length, 0) > LIMITS.total)
		throw new Error('The archive exceeds 32 MB uncompressed.');
	return zipSync(files, { level: 6 });
}
export function importArchive(bytes: Uint8Array): {
	theme: Theme;
	assets: AssetMap;
} {
	if (bytes.length > LIMITS.total)
		throw new Error('Choose a ZIP smaller than 32 MB.');
	let count = 0,
		total = 0;
	const seen = new Set<string>();
	const files = unzipSync(bytes, {
		filter(file) {
			if (file.name.endsWith('/')) return false;
			if (
				file.name.includes('\\') ||
				file.name.startsWith('/') ||
				file.name.split('/').includes('..')
			)
				throw new Error('Archive paths must stay inside the theme folder.');
			if (
				file.name.startsWith('__MACOSX/') ||
				file.name.split('/').some((x) => x.startsWith('.'))
			)
				return false;
			assetPath(file.name);
			if (seen.has(file.name))
				throw new Error(`Duplicate archive file: ${file.name}`);
			seen.add(file.name);
			count++;
			total += file.originalSize;
			if (
				count > LIMITS.files ||
				file.originalSize > LIMITS.file ||
				total > LIMITS.total
			)
				throw new Error(
					'Archive exceeds the file count or uncompressed size limits.',
				);
			return true;
		},
	});
	const manifests = Object.keys(files).filter(
		(p) => p.split('/').at(-1) === 'theme.json',
	);
	if (manifests.length !== 1 || manifests[0].split('/').length > 2)
		throw new Error(
			'A ZIP needs exactly one theme.json at its root or one folder deep.',
		);
	const manifest = manifests[0],
		prefix = manifest.slice(0, -'theme.json'.length);
	const theme = parseTheme(JSON.parse(strFromU8(files[manifest])));
	const assets: AssetMap = {};
	for (const [path, data] of Object.entries(files)) {
		if (path === manifest) continue;
		if (prefix && !path.startsWith(prefix))
			throw new Error('All assets must be inside the theme folder.');
		const relative = path.slice(prefix.length);
		validateAssetBytes(relative, data);
		assets[relative] = data;
	}
	const missing = referencedAssets(theme).filter((p) => !assets[p]);
	if (missing.length)
		throw new Error(`Archive is missing: ${missing.join(', ')}`);
	return { theme, assets };
}
const mime = (path: string): string =>
	({
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		svg: 'image/svg+xml',
		webp: 'image/webp',
		avif: 'image/avif',
		gif: 'image/gif',
		woff2: 'font/woff2',
		woff: 'font/woff',
		ttf: 'font/ttf',
		otf: 'font/otf',
	})[path.split('.').at(-1)!.toLowerCase()] || 'application/octet-stream';
export class AssetLibrary {
	files: AssetMap = {};
	private urls = new Map<string, string>();
	url(path: string): string {
		if (!this.files[path]) return '';
		if (!this.urls.has(path))
			this.urls.set(
				path,
				URL.createObjectURL(
					new Blob([new Uint8Array(this.files[path])], { type: mime(path) }),
				),
			);
		return this.urls.get(path)!;
	}
	async add(
		file: File,
		folder = 'textures',
		exactPath?: string,
	): Promise<string> {
		const bytes = new Uint8Array(await file.arrayBuffer());
		const ext = file.name.split('.').at(-1)!.toLowerCase();
		const digest = await crypto.subtle.digest('SHA-256', bytes);
		const hash = [...new Uint8Array(digest)]
			.slice(0, 5)
			.map((x) => x.toString(16).padStart(2, '0'))
			.join('');
		const basename =
			file.name
				.replace(/\.[^.]+$/, '')
				.toLowerCase()
				.replace(/[^a-z0-9_-]+/g, '-')
				.slice(0, 55) || 'asset';
		const path = exactPath || `${folder}/${basename}-${hash}.${ext}`;
		validateAssetBytes(path, bytes);
		this.files[path] = bytes;
		this.clearURL(path);
		return path;
	}
	merge(theme: Theme, files: AssetMap): Theme {
		const next = structuredClone(theme);
		const remap = new Map<string, string>();
		for (const [original, bytes] of Object.entries(files)) {
			let path = original;
			if (
				this.files[path] &&
				(!this.files[path].every((b, i) => bytes[i] === b) ||
					this.files[path].length !== bytes.length)
			) {
				let suffix = 1;
				while (this.files[path])
					path = original.replace(/(\.[^.]+)$/, `-import-${suffix++}$1`);
			}
			this.files[path] = bytes;
			remap.set(original, path);
		}
		if (next.preview) next.preview = remap.get(next.preview) ?? next.preview;
		for (const t of Object.values(next.textures ?? {}))
			t.path = remap.get(t.path) ?? t.path;
		for (const i of Object.values(next.icons ?? {}))
			if (i.path) i.path = remap.get(i.path) ?? i.path;
		for (const f of next.fonts ?? [])
			f.src = f.src.map((p) => remap.get(p) ?? p);
		for (const w of next.wallpapers ?? []) w.path = remap.get(w.path) ?? w.path;
		return next;
	}
	private clearURL(path: string): void {
		const old = this.urls.get(path);
		if (old) URL.revokeObjectURL(old);
		this.urls.delete(path);
	}
}
export interface SavedProject {
	theme: Theme;
	assets: AssetMap;
}
async function database(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open('theme-studio', 1);
		req.onupgradeneeded = () => req.result.createObjectStore('projects');
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
export async function saveProject(project: SavedProject): Promise<void> {
	const db = await database();
	try {
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction('projects', 'readwrite');
			tx.objectStore('projects').put(project, 'current');
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
			tx.onabort = () => reject(tx.error);
		});
	} finally {
		db.close();
	}
}
export async function loadProject(): Promise<SavedProject | null> {
	const db = await database();
	try {
		return await new Promise((resolve, reject) => {
			const req = db
				.transaction('projects')
				.objectStore('projects')
				.get('current');
			req.onsuccess = () => resolve(req.result ?? null);
			req.onerror = () => reject(req.error);
		});
	} finally {
		db.close();
	}
}
