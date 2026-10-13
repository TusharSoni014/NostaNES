import type { SVGProps } from "react"

export const NesControllerIcon = ({
  className,
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 120 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Controller Body (Classic NES light gray) */}
    <rect
      x="1"
      y="1"
      width="118"
      height="48"
      rx="4"
      fill="#D1D5DB"
      stroke="#9CA3AF"
      strokeWidth="2"
    />

    {/* Center Black Recessed Inset */}
    <rect x="10" y="6" width="100" height="38" rx="2" fill="#18181B" />

    {/* Classic NES Red Accent Stripes */}
    <rect x="36" y="8" width="48" height="2" fill="#EF4444" />
    <rect x="36" y="12" width="48" height="2" fill="#EF4444" />

    {/* D-Pad (Left) */}
    <rect x="18" y="15" width="8" height="20" rx="1" fill="#27272A" />
    <rect x="12" y="21" width="20" height="8" rx="1" fill="#27272A" />
    <circle cx="22" cy="25" r="2" fill="#18181B" />

    {/* Select & Start Buttons (Center Pills) */}
    <rect
      x="44"
      y="26"
      width="12"
      height="4"
      rx="2"
      transform="rotate(-25 44 26)"
      fill="#52525B"
    />
    <rect
      x="62"
      y="26"
      width="12"
      height="4"
      rx="2"
      transform="rotate(-25 62 26)"
      fill="#52525B"
    />
    <text x="40" y="38" fill="#71717A" fontSize="4" fontFamily="monospace" fontWeight="bold">
      SELECT
    </text>
    <text x="60" y="38" fill="#71717A" fontSize="4" fontFamily="monospace" fontWeight="bold">
      START
    </text>

    {/* Action Buttons B and A (Right Red Circles) */}
    <rect x="80" y="16" width="26" height="18" rx="2" fill="#27272A" />
    <circle cx="87" cy="25" r="4.5" fill="#EF4444" />
    <circle cx="99" cy="25" r="4.5" fill="#EF4444" />
    <text x="85" y="38" fill="#EF4444" fontSize="5" fontFamily="monospace" fontWeight="bold">
      B
    </text>
    <text x="97" y="38" fill="#EF4444" fontSize="5" fontFamily="monospace" fontWeight="bold">
      A
    </text>
  </svg>
)
