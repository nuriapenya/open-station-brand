import postcss from 'postcss';
import ts from 'typescript';

/** Extract static CSS without importing or executing any plugin module. */
export function staticStyles(source, filename) {
	if (!filename.endsWith('.ts')) return source;
	const file = ts.createSourceFile(
		filename,
		source,
		ts.ScriptTarget.Latest,
		true,
	);
	const chunks = [];
	function visit(node) {
		if (
			ts.isTaggedTemplateExpression(node) &&
			node.tag.getText(file) === 'css'
		) {
			const template = node.template;
			chunks.push(
				ts.isNoSubstitutionTemplateLiteral(template)
					? template.text
					: template.head.text +
							template.templateSpans.map((span) => span.literal.text).join(''),
			);
		}
		ts.forEachChild(node, visit);
	}
	visit(file);
	return chunks.join('\n');
}

/** Keep scope and provenance: variant declarations must not become base defaults. */
export function defaultCandidates(source, filename) {
	const candidates = [];
	const css = postcss.parse(staticStyles(source, filename));
	css.walkDecls((decl) => {
		const selector = decl.parent.selector || '@' + (decl.parent.name || '');
		let conditional = false;
		for (let parent = decl.parent; parent; parent = parent.parent)
			if (
				parent.type === 'atrule' &&
				/media|container|keyframes/.test(parent.name)
			)
				conditional = true;
		const base =
			!conditional && /^(?::host|:root|body\.os-active)$/.test(selector.trim());
		const palette = filename === 'assets/css/variables.css';
		const put = (name, value, kind) => {
			if (
				!/^(--os-[a-z0-9-]+|--wp-admin-theme-color)$/.test(name) ||
				!value ||
				/[{};$]/.test(value)
			)
				return;
			const component = filename.match(/\/components\/(os-[^/]+)\//)?.[1];
			const own =
				component &&
				(name.startsWith('--os-ui-' + component.slice(3) + '-') ||
					(component === 'os-steps' && name.startsWith('--os-ui-step-')) ||
					(component === 'os-window-button' &&
						name.startsWith('--os-ui-btn-')));
			const priority =
				kind === 'declaration'
					? palette && base
						? 100
						: base && (!component || own)
							? 80
							: 10
					: own
						? 60
						: 40;
			candidates.push({
				name,
				value: value.trim().replace(/\s+/g, ' '),
				file: filename,
				selector,
				kind,
				priority,
			});
		};
		if (decl.prop.startsWith('--')) put(decl.prop, decl.value, 'declaration');
		for (const match of decl.value.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
			let end = match.index + match[0].length,
				depth = 1;
			for (; end < decl.value.length && depth; end++) {
				if (decl.value[end] === '(') depth++;
				if (decl.value[end] === ')') depth--;
			}
			const tail = decl.value
				.slice(match.index + match[0].length, end - 1)
				.trim();
			if (tail.startsWith(',')) put(match[1], tail.slice(1).trim(), 'fallback');
		}
	});
	return candidates;
}
