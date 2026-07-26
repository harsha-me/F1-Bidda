import React from "react";

export function F1LogoIcon({ className = "h-5 w-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="F1 Logo"
    >
      {/* Dynamic F1 speed graphic */}
      <g transform="skewX(-14)">
        {/* F Stem & Crossbars */}
        <path
          d="M4 6H18V10H9V14H16V18H9V26H4V6Z"
          fill={color}
        />
        {/* Red Speed Stripe 1 */}
        <path
          d="M20 6H25L20 26H15L20 6Z"
          fill={color}
        />
        {/* Speed Slash 2 */}
        <path
          d="M27 6H30L26 26H23L27 6Z"
          fill={color}
          opacity="0.8"
        />
      </g>
    </svg>
  );
}
