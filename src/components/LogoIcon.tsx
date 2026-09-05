/**
 * The AcompanhaAí mark: a location pin over a phone, tracking a route.
 * Inline SVG (not an external asset) so it never depends on a CDN path
 * and can be sized/recolored via normal SVG props wherever it's used.
 */
export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="AcompanhaAí"
    >
      <g transform="rotate(-22 48 58)">
        <rect x="12" y="34" width="66" height="46" rx="9" fill="#0B1512" />
        <rect x="16.5" y="38.5" width="57" height="37" rx="5" fill="#FFFFFF" />
        <rect x="80" y="42" width="3.2" height="7" rx="1.4" fill="#0B1512" />
        <rect x="80" y="53" width="3.2" height="10" rx="1.4" fill="#0B1512" />
        <circle cx="45" cy="37.5" r="1.6" fill="#0B1512" />
        <path
          d="M23 62 q9 -9 18 -2 q9 7 18 -3 q6 -7 12 -3"
          fill="none"
          stroke="#C4C9C6"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="0.5 6"
        />
        <rect x="21" y="66.5" width="17" height="7.5" rx="3.75" fill="#8FF06B" />
      </g>

      <path
        d="M42 30 C42 18.8 49.6 10 60 10 C70.4 10 78 18.8 78 30 C78 42 60 64 60 64 C60 64 42 42 42 30 Z"
        fill="#0E3B2E"
      />
      <path
        d="M32 34 C32 22.8 39.9 14 50.5 14 C61.1 14 69 22.8 69 34 C69 46 50.5 68 50.5 68 C50.5 68 32 46 32 34 Z"
        fill="#8FF06B"
      />
      <circle cx="50.5" cy="33" r="9.5" fill="#0E3B2E" />
    </svg>
  );
}
