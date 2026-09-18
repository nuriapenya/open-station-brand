import data from '../data/token-help.json' with { type: 'json' };
export interface TokenHelp {
	title: string;
	description: string;
	state: string;
	inputHint: string;
	surface: string;
	property: string;
	evidence: { path: string; line: number; property: string }[];
	defaultDependencies: string[];
}
export const tokenHelp: Record<string, TokenHelp> = data.tokens;
export function helpFor(name: string): TokenHelp | undefined {
	return tokenHelp[name];
}
