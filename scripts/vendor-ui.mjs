import ts from 'typescript';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, relative, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = resolve(process.argv[2] || '../alcazaba-plugin');
const dest = resolve('vendor/alcazaba-ui');
const names = [
	'steps',
	'button',
	'swatch',
	'swatch-grid',
	'segmented',
	'range-field',
	'text-field',
	'checkbox',
	'switch',
	'toast',
	'tabs',
	'window-button',
	'menu',
	'context-menu',
	'confirm-dialog',
	'modal',
	'flyout',
	'tab-chip',
	'stack',
	'cluster',
	'icon',
	'body',
	'panel',
	'row',
	'grid',
	'display',
	'empty-state',
	'key',
	'code',
	'badge',
	'ribbon',
	'log',
	'table',
	'spinner',
	'stat',
	'avatar',
	'chip',
	'tag-input',
	'save-status',
	'category-picker',
	'crumb-chain',
	'card',
	'rating-summary',
	'notice',
	'progress-bar',
	'field-row',
	'repeater',
	'token-field',
];
const queue = names.map((n) => `src/ui/components/os-${n}/os-${n}.ts`);
const records = [];
const seen = new Set();
while (queue.length) {
	const file = queue.shift();
	if (seen.has(file)) continue;
	seen.add(file);
	const source = readFileSync(join(root, file), 'utf8');
	const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
	for (const statement of ast.statements) {
		if (
			!(
				ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)
			) ||
			!statement.moduleSpecifier
		)
			continue;
		const spec = statement.moduleSpecifier.text;
		if (!spec.startsWith('.'))
			throw Error(`External dependency ${file}: ${spec}`);
		const base = resolve(root, dirname(file), spec);
		const target = [base, base + '.ts', join(base, 'index.ts')].find(
			(p) => existsSync(p) && p.endsWith('.ts'),
		);
		if (!target) throw Error(`Unresolved dependency ${file}: ${spec}`);
		const rel = relative(root, target);
		if (
			!rel.startsWith('src/ui/') &&
			!['src/i18n.ts', 'src/mode/stamp.ts'].includes(rel)
		)
			throw Error(`Shell dependency ${rel}`);
		queue.push(rel);
	}
	mkdirSync(join(dest, dirname(file)), { recursive: true });
	writeFileSync(join(dest, file), source);
	records.push({
		path: file,
		sha256: createHash('sha256').update(source).digest('hex'),
	});
}
writeFileSync(
	join(dest, 'entry.ts'),
	names.map((n) => `import './src/ui/components/os-${n}/os-${n}';`).join('\n') +
		'\n',
);
writeFileSync(
	join(dest, 'snapshot.json'),
	JSON.stringify(
		{
			repository: execFileSync('git', ['remote', 'get-url', 'origin'], {
				cwd: root,
				encoding: 'utf8',
			}).trim(),
			commit: execFileSync('git', ['rev-parse', 'HEAD'], {
				cwd: root,
				encoding: 'utf8',
			}).trim(),
			note: 'Snapshot of local working tree; hashes identify exact source bytes, including uncommitted upstream edits.',
			files: records,
		},
		null,
		2,
	) + '\n',
);
const license = ['LICENSE', 'LICENSE.txt', 'license.txt'].find((p) =>
	existsSync(join(root, p)),
);
if (license)
	writeFileSync(join(dest, 'LICENSE'), readFileSync(join(root, license)));
console.log(
	`Copied ${records.length} source files for ${names.length} components.`,
);
