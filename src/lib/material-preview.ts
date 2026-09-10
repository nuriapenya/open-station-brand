/** Purpose-built, inert mocks for the non-window texture slots. */
export function materialContext(slot: string): HTMLElement | null {
	const samples: Record<string, string> = {
		DOCK: '<nav class="sample-dock" data-slot-target><span>▦</span><span>▧</span><span>▤</span><span>⚙</span></nav>',
		DOCK_ITEM:
			'<nav class="sample-dock"><span data-slot-target>▦</span><span>▧</span><span>⚙</span></nav>',
		ICON_TILE:
			'<div class="sample-icon" data-slot-target>▧<small>My workspace</small></div>',
		TABBAR:
			'<nav class="sample-tabs" data-slot-target><b>Appearance</b><span>Applications</span><span>Workspace</span></nav>',
		WIDGET:
			'<section class="sample-widget" data-slot-target><small>WEDNESDAY, SEPTEMBER 9</small><strong>10:24</strong><span>A little room to focus.</span></section>',
		MENU: '<div class="sample-menu" data-slot-target><span>▦ &nbsp; New window <small>⌘N</small></span><span>▧ &nbsp; Open files… <small>⌘O</small></span><hr/><span>⚙ &nbsp; Preferences</span></div>',
		DIALOG:
			'<section class="sample-dialog" data-slot-target><strong>A fresh start?</strong><p>Your workspace is ready for your next idea.</p><div><button>Keep editing</button><button class="sample-action">Save theme</button></div></section>',
		SCRIM:
			'<div class="sample-scrim-stage"><span>Workspace behind the overlay</span><div class="sample-scrim" data-slot-target></div><section class="sample-dialog"><strong>Make it yours.</strong><p>A dialog above your scrim.</p></section></div>',
		PANEL:
			'<aside class="sample-panel" data-slot-target><strong>Appearance</strong><span>◈ &nbsp; Colors</span><span>▧ &nbsp; Textures</span><span>Aa &nbsp; Typography</span><span>▦ &nbsp; Layout</span></aside>',
		TOAST:
			'<div class="sample-toast" data-slot-target><b>✓</b><div><strong>Looking good!</strong><p>Your workspace is saved.</p></div><small>now</small></div>',
		TABLE_HEADER:
			'<table class="sample-table"><thead data-slot-target><tr><th>Project</th><th>Status</th></tr></thead><tbody><tr><td>A new beginning</td><td>Published</td></tr><tr><td>Notes from the studio</td><td>Draft</td></tr></tbody></table>',
		BUTTON:
			'<div class="sample-actions"><button data-slot-target>Create something →</button><button data-slot-target>Save changes</button></div>',
		DESKTOP:
			'<div class="sample-desktop" data-slot-target><div class="sample-icon">▧<small>My files</small></div><strong>10:24</strong><small>Your next idea starts here.</small></div>',
	};
	if (!samples[slot]) return null;
	const host = document.createElement('div');
	host.className = 'material-context';
	host.innerHTML = samples[slot];
	for (const target of host.querySelectorAll<HTMLElement>('[data-slot-target]'))
		target.dataset.textureSlot = slot;
	return host;
}
