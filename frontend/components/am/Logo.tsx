"use client";

interface LogoProps {
  size?: number;
  showTagline?: boolean;
  colored?: boolean;
  compact?: boolean;
}

export function Logo({ size = 28, showTagline = false, colored = false, compact = false }: LogoProps) {
  const primary = colored ? "#1751EF" : "currentColor";
  const accent = colored ? "#0891B2" : "currentColor";
  const warm = colored ? "#A1543C" : "currentColor";

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        width={compact ? size * 1.2 : size}
        height={size}
        viewBox="0 0 36 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AdaptiveMind AI logo"
        role="img"
      >
        {/* Abstract A - central tower */}
        <path
          d="M18 2L3 30h7l2.5-5.5h11L26 30h7L18 2Z"
          stroke={primary}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill={primary}
          fillOpacity="0.06"
        />
        {/* A crossbar — knowledge bridge */}
        <line x1="11.5" y1="20.5" x2="24.5" y2="20.5" stroke={primary} strokeWidth="1.5" strokeLinecap="round" />

        {/* Adaptive path — flowing through the A */}
        <path
          d="M18 2v7.5M18 9.5l-3 5M18 9.5l3 5M15 14.5l-4 6M21 14.5l4 6"
          stroke={accent}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity={0.7}
        />

        {/* Learning nodes — five dots for DNA dimensions */}
        {/* Visual - top */}
        <circle cx="18" cy="3.5" r="2.2" fill={primary} />
        <circle cx="18" cy="3.5" r="4.5" stroke={primary} strokeWidth="0.6" opacity={0.2} />
        {/* Examples - left mid */}
        <circle cx="12.5" cy="15" r="1.8" fill={accent} opacity={0.7} />
        {/* Analogies - right mid */}
        <circle cx="23.5" cy="15" r="1.8" fill={warm} opacity={0.7} />
        {/* Stories - lower left */}
        <circle cx="8.5" cy="25" r="1.5" fill={accent} opacity={0.5} />
        {/* Challenges - lower right */}
        <circle cx="27.5" cy="25" r="1.5" fill={warm} opacity={0.5} />

        {/* Connecting arcs between nodes */}
        <path
          d="M18 8c-3 0-6 2.5-6.5 7"
          stroke={primary}
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity={0.25}
          strokeDasharray="2 2"
        />
        <path
          d="M18 8c3 0 6 2.5 6.5 7"
          stroke={primary}
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity={0.25}
          strokeDasharray="2 2"
        />

        {/* Growth arc bottom */}
        <path
          d="M4 30c3-2 7-3.5 14-3.5s11 1.5 14 3.5"
          stroke={accent}
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity={0.2}
        />
      </svg>

      {!compact && (
        <span className="flex flex-col leading-tight">
          <span
            className="font-[var(--font-editorial)] font-bold tracking-normal"
            style={{ fontSize: size * 0.7 }}
          >
            AdaptiveMind
          </span>
          {showTagline && (
            <span className="text-[0.55em] font-medium leading-tight opacity-50 uppercase tracking-widest font-[var(--font-sans)]">
              AI that adapts to you
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export function LogoMark({ size = 28, colored = false }: { size?: number; colored?: boolean }) {
  const primary = colored ? "#1751EF" : "currentColor";
  return (
    <svg
      width={size}
      height={size * 0.9}
      viewBox="0 0 36 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AdaptiveMind"
      role="img"
    >
      <path
        d="M18 2L3 30h7l2.5-5.5h11L26 30h7L18 2Z"
        stroke={primary}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={primary}
        fillOpacity="0.06"
      />
      <line x1="11.5" y1="20.5" x2="24.5" y2="20.5" stroke={primary} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18" cy="3.5" r="2.2" fill={primary} />
      <circle cx="18" cy="3.5" r="4.5" stroke={primary} strokeWidth="0.6" opacity={0.2} />
      <path
        d="M18 2v7.5M18 9.5l-3 5M18 9.5l3 5"
        stroke={primary}
        strokeWidth="1"
        strokeLinecap="round"
        opacity={0.5}
      />
    </svg>
  );
}
