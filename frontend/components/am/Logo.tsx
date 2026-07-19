/* AdaptiveMind AI Logo — abstract A with connected knowledge nodes and growing path */

interface LogoProps {
  size?: number;
  showTagline?: boolean;
  colored?: boolean;
}

export function Logo({ size = 32, showTagline = false, colored = false }: LogoProps) {
  const primary = colored ? "#5046e5" : "currentColor";
  const accent = colored ? "#22d3ee" : "currentColor";
  const dim = colored ? "#8b5cf6" : "currentColor";

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AdaptiveMind AI logo"
        role="img"
      >
        {/* Abstract A shape — left leg */}
        <path
          d="M16 4L4 28h8l2-4h4l2 4h8L16 4Z"
          stroke={primary}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="none"
        />
        {/* A crossbar — knowledge connection */}
        <line
          x1="10"
          y1="20"
          x2="22"
          y2="20"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Growing path / adaptation line */}
        <path
          d="M16 8v14"
          stroke={dim}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2 2"
          opacity={0.6}
        />
        {/* Node — top */}
        <circle cx="16" cy="5" r="1.8" fill={accent} />
        {/* Node — left endpoint */}
        <circle cx="5.5" cy="27" r="1.5" fill={primary} />
        {/* Node — right endpoint */}
        <circle cx="26.5" cy="27" r="1.5" fill={dim} />
        {/* Small progression dots */}
        <circle cx="14" cy="12" r="1" fill={accent} opacity={0.5} />
        <circle cx="18" cy="12" r="1" fill={accent} opacity={0.5} />
      </svg>
      <span className="flex flex-col">
        <span className="text-sm font-semibold tracking-tight leading-tight">
          AdaptiveMind
        </span>
        {showTagline && (
          <span className="text-[10px] font-medium leading-tight opacity-60">
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
      aria-hidden="true"
    >
      <path
        d="M16 4L4 28h8l2-4h4l2 4h8L16 4Z"
        stroke="#5046e5"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="10" y1="20" x2="22" y2="20" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="5" r="1.8" fill="#22d3ee" />
      <circle cx="5.5" cy="27" r="1.5" fill="#5046e5" />
      <circle cx="26.5" cy="27" r="1.5" fill="#8b5cf6" />
    </svg>
  );
}
