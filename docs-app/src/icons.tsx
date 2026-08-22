import type { ReactNode } from 'react';

/**
 * The brand's own UI icons (branding/icons/ui), inlined so the site ships no
 * icon library. Same rules as the source set: 24 grid, 1.5 stroke, round caps,
 * currentColor. The drawings are copied verbatim from the SVG files; when one
 * changes there, change it here.
 */
type IconProps = { size?: number; className?: string };

function Icon( { size = 16, className, children }: IconProps & { children: ReactNode } ) {
	return (
		<svg className={ className } viewBox="0 0 24 24" width={ size } height={ size } fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
			{ children }
		</svg>
	);
}

export const SearchIcon = ( props: IconProps ) => <Icon { ...props }><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 20.5 20.5"/></Icon>;
export const CloseIcon = ( props: IconProps ) => <Icon { ...props }><path d="M6.75 6.75 17.25 17.25"/><path d="M17.25 6.75 6.75 17.25"/></Icon>;
export const ChevronRightIcon = ( props: IconProps ) => <Icon { ...props }><path d="M9.75 5.5 16.25 12l-6.5 6.5"/></Icon>;
export const ChevronDownIcon = ( props: IconProps ) => <Icon { ...props }><path d="M5.5 9.75 12 16.25l6.5-6.5"/></Icon>;
export const ArrowUpRightIcon = ( props: IconProps ) => <Icon { ...props }><path d="M7 17 17 7"/><path d="M8.75 7H17v8.25"/></Icon>;
export const CheckIcon = ( props: IconProps ) => <Icon { ...props }><path d="M5 12.5 9.75 17.25 19 6.75"/></Icon>;
export const CommandIcon = ( props: IconProps ) => <Icon { ...props }><path d="M14.625 6.75v10.5a2.625 2.625 0 1 0 2.625-2.625H6.75a2.625 2.625 0 1 0 2.625 2.625V6.75a2.625 2.625 0 1 0-2.625 2.625h10.5a2.625 2.625 0 1 0-2.625-2.625"/></Icon>;
export const WindowIcon = ( props: IconProps ) => <Icon { ...props }><rect x="4.125" y="5.4375" width="15.75" height="13.125" rx="1.75"/><path d="M4.125 9.8125h15.75"/><circle cx="7.275" cy="7.625" r="0.7438" fill="currentColor" stroke="none"/></Icon>;
export const InfoIcon = ( props: IconProps ) => <Icon { ...props }><circle cx="12" cy="12" r="9"/><path d="M12 11.25v5"/><circle cx="12" cy="7.9" r="0.9" fill="currentColor" stroke="none"/></Icon>;

/** The landing page's menu glyph, so the two headers open the same way. */
export const MenuIcon = ( props: IconProps ) => <Icon { ...props }><path d="M3 6.5h18M3 12h18M3 17.5h18"/></Icon>;

/** The logomark, from the landing page lockup. */
export function Logo( { size = 26, className }: IconProps ) {
	return (
		<svg className={ className } viewBox="0 0 80 80" width={ size } height={ size } fill="currentColor" aria-hidden="true" focusable="false">
			<path d="M38.792 0.0186131C60.8846 -0.649069 79.3313 16.7291 79.9824 38.8223C80.6326 60.8921 63.2773 79.3149 41.208 79.9815C19.1385 80.6488 0.702853 63.3074 0.0195305 41.2383C-0.66441 19.1462 16.6995 0.686396 38.792 0.0186131ZM38.71 9.36236C35.8339 7.89166 32.7628 8.23954 29.8555 9.28033C12.6582 14.7114 3.37017 33.8997 9.45508 50.8067C11.0384 55.2047 13.565 59.4989 16.9609 62.7842C21.6294 67.5336 27.6536 70.7223 34.2061 71.9112C37.0214 72.4165 41.0083 73.0707 43.2295 70.7891C46.4143 67.5174 44.115 64.4383 43.1133 60.8419C42.137 57.2757 41.6165 53.6009 41.5635 49.9044C41.5398 46.776 42.201 42.473 42.8252 39.3565C44.2979 32.0039 46.892 24.7246 44.5537 17.2452C43.5137 14.0551 41.8086 10.9469 38.71 9.36236Z"/>
		</svg>
	);
}
