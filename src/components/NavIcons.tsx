/**
 * The handful of glyphs the shell needs. Drawn on the same 20×20 grid, 1.6–1.8
 * stroke, round joins — close enough to SoundCloud's icon set.
 */

type IconProps = { size?: number; className?: string };

export function HomeIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M3.2 9.3 10 3.2l6.8 6.1M4.9 8.2v7.3c0 .5.4.9.9.9h2.9v-4.2h2.6v4.2h2.9c.5 0 .9-.4.9-.9V8.2"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="8.6" cy="8.6" r="5.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="m12.8 12.8 3.9 3.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** SoundCloud's library glyph: three bars of different heights. */
export function LibraryIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="3.2" y="6.2" width="2.6" height="10" rx="1" fill="currentColor" />
      <rect x="8.7" y="3.2" width="2.6" height="13" rx="1" fill="currentColor" />
      <rect x="14.2" y="8.6" width="2.6" height="7.6" rx="1" fill="currentColor" />
    </svg>
  );
}

export function HeartIcon({ size = 20, className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M10 17s-7.1-4.6-8.4-9.1C.7 4.4 3.4 1.9 6 1.9c1.8 0 3.3 1 4 2.4.7-1.4 2.2-2.4 4-2.4 2.6 0 5.3 2.5 4.4 6-1.3 4.5-8.4 9.1-8.4 9.1Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlaylistIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M3.3 5.4h9.4M3.3 9h6.6M3.3 12.6h6.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="14.4" cy="12.9" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M17 12.9V5.6c0-.6.4-1 .9-1.1l.4-.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="m7.6 4.6 5.4 5.4-5.4 5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GearIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="2.7" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 2.4c.5 0 .9.3 1 .8l.2 1.2 1.5.6 1-.7c.4-.3 1-.3 1.3.1l.9.9c.4.3.4.9.1 1.3l-.7 1 .6 1.5 1.2.2c.5.1.8.5.8 1v1.3c0 .5-.3.9-.8 1l-1.2.2-.6 1.5.7 1c.3.4.3 1-.1 1.3l-.9.9c-.3.4-.9.4-1.3.1l-1-.7-1.5.6-.2 1.2c-.1.5-.5.8-1 .8h-1.3c-.5 0-.9-.3-1-.8l-.2-1.2-1.5-.6-1 .7c-.4.3-1 .3-1.3-.1l-.9-.9c-.3-.3-.4-.9-.1-1.3l.7-1-.6-1.5-1.2-.2c-.5-.1-.8-.5-.8-1v-1.3c0-.5.3-.9.8-1l1.2-.2.6-1.5-.7-1c-.3-.4-.2-1 .1-1.3l.9-.9c.3-.4.9-.4 1.3-.1l1 .7 1.5-.6.2-1.2c.1-.5.5-.8 1-.8H10Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
