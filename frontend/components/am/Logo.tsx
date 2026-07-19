"use client";

interface LogoProps {
  size?: number;
  showTagline?: boolean;
  colored?: boolean;
}

export function Logo({ size = 28, showTagline = false, colored = false }: LogoProps) {
  const primary = colored ? "#5046e5" : "currentColor";
  const accent = colored ? "#22d3ee" : "currentColor";
  const dim = colored ? "#8b5cf6" : "currentColor";

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AdaptiveMind AI logo"
        role="img"
      >
        {/* Outer ring — knowledge sphere */}
        <circle cx="16" cy="16" r="14" stroke={primary} strokeWidth="1.2" opacity="0.2" />

        {/* Abstract A shape */}
        <path
          d="M16 4L4 28h8l2-4h4l2 4h8L16 4Z"
          stroke={primary}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill={primary}
          fillOpacity="0.08"
        />
        {/* A crossbar — knowledge connection */}
        <line x1="10" y1="20" x2="22" y2="20" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        {/* Growing path / adaptation line */}
        <path d="M16 8v14" stroke={dim} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" opacity={0.5} />
        {/* Nodes — learning dimensions */}
        <circle cx="16" cy="5" r="1.8" fill={accent} />
        <circle cx="5.5" cy="27" r="1.5" fill={primary} />
        <circle cx="26.5" cy="27" r="1.5" fill={dim} />
        {/* Progression dots */}
        <circle cx="14" cy="12" r="1" fill={accent} opacity={0.4} />
        <circle cx="18" cy="12" r="1" fill={accent} opacity={0.4} />
      </svg>
      <span className="flex flex-col leading-tight">
        <span className="font-semibold tracking-tight" style={{ fontSize: size * 0.75 }}>
          AdaptiveMind
        </span>
        {showTagline && (
          <span className="text-[0.6em] font-medium leading-tight opacity-50 uppercase tracking-wider">
            AI that adapts to you
          </span>
        )}
      </span>
    </span>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AdaptiveMind"
      role="img"
    >
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />
      <path d="M16 4L4 28h8l2-4h4l2 4h8L16 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <line x1="10" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="5" r="1.8" fill="currentColor" />
      <circle cx="5.5" cy="27" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="26.5" cy="27" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
