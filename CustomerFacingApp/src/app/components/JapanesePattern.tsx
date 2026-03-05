// Japanese wave pattern (Seigaiha) SVG component
export function SeigaihaPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="seigaiha" x="0" y="0" width="100" height="50" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M0 25 Q 12.5 12.5, 25 25 T 50 25 T 75 25 T 100 25" />
            <path d="M0 25 Q 12.5 37.5, 25 25 T 50 25 T 75 25 T 100 25" />
            <path d="M-25 50 Q -12.5 37.5, 0 50 T 25 50 T 50 50 T 75 50 T 100 50" />
            <path d="M-25 0 Q -12.5 12.5, 0 0 T 25 0 T 50 0 T 75 0 T 100 0" />
          </g>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#seigaiha)" />
    </svg>
  );
}

// Cherry blossom decoration
export function CherryBlossom({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g>
        {/* Five petals */}
        <ellipse cx="12" cy="8" rx="3" ry="5" fill="#FFB7C5" transform="rotate(0 12 12)" />
        <ellipse cx="12" cy="8" rx="3" ry="5" fill="#FFC9D5" transform="rotate(72 12 12)" />
        <ellipse cx="12" cy="8" rx="3" ry="5" fill="#FFB7C5" transform="rotate(144 12 12)" />
        <ellipse cx="12" cy="8" rx="3" ry="5" fill="#FFC9D5" transform="rotate(216 12 12)" />
        <ellipse cx="12" cy="8" rx="3" ry="5" fill="#FFB7C5" transform="rotate(288 12 12)" />
        {/* Center */}
        <circle cx="12" cy="12" r="2.5" fill="#FFE5EC" />
        <circle cx="12" cy="12" r="1.5" fill="#FFF0F5" />
        {/* Stamens */}
        <circle cx="12" cy="11" r="0.5" fill="#D4AF37" />
        <circle cx="13" cy="12" r="0.5" fill="#D4AF37" />
        <circle cx="11" cy="12" r="0.5" fill="#D4AF37" />
      </g>
    </svg>
  );
}

// Japanese fan decoration
export function JapaneseFan({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M50 90 L10 30 Q50 20, 90 30 Z"
        fill="#C41E3A"
        opacity="0.8"
      />
      <path
        d="M50 90 L20 35 Q50 25, 80 35 Z"
        fill="#DC143C"
        opacity="0.6"
      />
      <path
        d="M50 90 L30 40 Q50 30, 70 40 Z"
        fill="#FF6B6B"
        opacity="0.4"
      />
    </svg>
  );
}
