type Variant = "full" | "horizontal" | "mark";

/**
 * BrandLogo — vector ricostruito del marchio THE ROOM.
 * Usa `currentColor` per stroke e fill, quindi colora via `text-*`.
 *
 *  - full        : versione completa quadrata (welcome / login)
 *  - horizontal  : lockup orizzontale compatto (navbar)
 *  - mark        : solo monogramma quadrato
 */
export function BrandLogo({
  className = "",
  variant = "full",
  title = "THE ROOM — Private Hair Studio",
}: {
  className?: string;
  variant?: Variant;
  title?: string;
}) {
  if (variant === "horizontal") {
    return (
      <svg
        viewBox="0 0 240 48"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
        className={`select-none ${className}`}
        fill="none"
      >
        <title>{title}</title>
        {/* clean editorial wordmark, single column */}
        <g fill="currentColor">
          <text
            x="120"
            y="22"
            textAnchor="middle"
            fontFamily="'Josefin Sans', system-ui, sans-serif"
            fontWeight="400"
            fontSize="16"
            letterSpacing="7"
          >
            THE ROOM
          </text>
          <text
            x="120"
            y="40"
            textAnchor="middle"
            fontFamily="'Josefin Sans', system-ui, sans-serif"
            fontWeight="300"
            fontSize="5"
            letterSpacing="4"
            opacity="0.7"
          >
            PRIVATE HAIR STUDIO
          </text>
        </g>
        {/* subtle separators */}
        <g stroke="currentColor" strokeWidth="0.6" opacity="0.5">
          <line x1="20" y1="30" x2="58" y2="30" />
          <line x1="182" y1="30" x2="220" y2="30" />
        </g>
      </svg>
    );
  }

  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
        className={`select-none ${className}`}
        fill="none"
      >
        <title>{title}</title>
        <rect x="6" y="6" width="88" height="88" stroke="currentColor" strokeWidth="1" />
        <g fill="currentColor">
          <text x="50" y="42" textAnchor="middle" fontFamily="'Josefin Sans', system-ui, sans-serif" fontWeight="300" fontSize="9" letterSpacing="3">THE</text>
          <text x="50" y="62" textAnchor="middle" fontFamily="'Josefin Sans', system-ui, sans-serif" fontWeight="300" fontSize="17" letterSpacing="2.2">ROOM</text>
        </g>
        <g stroke="currentColor" strokeWidth="1.1" fill="none">
          <line x1="45" y1="72" x2="55" y2="84" />
          <line x1="55" y1="72" x2="45" y2="84" />
          <circle cx="44" cy="84.5" r="2" />
          <circle cx="56" cy="84.5" r="2" />
        </g>
      </svg>
    );
  }

  // full
  return (
    <svg
      viewBox="0 0 100 130"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={`select-none ${className}`}
      fill="none"
    >
      <title>{title}</title>
      <rect x="6" y="6" width="88" height="88" stroke="currentColor" strokeWidth="0.8" />
      <g fill="currentColor">
        <text x="50" y="42" textAnchor="middle" fontFamily="'Josefin Sans', system-ui, sans-serif" fontWeight="300" fontSize="9" letterSpacing="3">THE</text>
        <text x="50" y="62" textAnchor="middle" fontFamily="'Josefin Sans', system-ui, sans-serif" fontWeight="300" fontSize="17" letterSpacing="2.2">ROOM</text>
      </g>
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <line x1="45" y1="72" x2="55" y2="84" />
        <line x1="55" y1="72" x2="45" y2="84" />
        <circle cx="44" cy="84.5" r="2" />
        <circle cx="56" cy="84.5" r="2" />
      </g>
      <g fill="currentColor">
        <text x="50" y="112" textAnchor="middle" fontFamily="'Josefin Sans', system-ui, sans-serif" fontWeight="300" fontSize="5.2" letterSpacing="3.5">PRIVATE HAIR STUDIO</text>
        <text x="50" y="124" textAnchor="middle" fontFamily="'Josefin Sans', system-ui, sans-serif" fontWeight="300" fontSize="3.6" letterSpacing="2.6" opacity="0.7">BY APPOINTMENT ONLY</text>
      </g>
    </svg>
  );
}