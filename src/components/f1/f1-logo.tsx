import React from "react";

/**
 * Official-style F1 logo icon – the iconic "F1" wordmark with the
 * red speed stripe negative-space "1" between the F and the red bar.
 * Based on the official Formula 1 logotype geometry.
 */
export function F1LogoIcon({
  className = "h-5 w-5",
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="F1 Logo"
    >
      {/* Official F1 logo path – F letterform with the negative-space "1" speed stripe */}
      <path
        d="M2 0h38.7L37.3 8.4H13.6l-3.5 8.2h21l-3.4 8.2H6.7L0 40h-0L2 0Z
           M40 0h14.4L42 40H28L40 0Z
           M56 0h14l-4.4 10.6h10.8L73 0h14L75 40h-14l5.2-12.8H55.6L50 40H36L56 0Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
}

/**
 * Full-size F1 logo with the iconic red branding for hero / splash usage.
 * Renders the recognisable white-on-red F1 speed mark.
 */
export function F1LogoFull({
  className = "h-8",
  redColor = "#E10600",
  whiteColor = "#FFFFFF",
}: {
  className?: string;
  redColor?: string;
  whiteColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 80 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Formula 1 Logo"
    >
      {/* Red background pill */}
      <rect width="80" height="40" rx="4" fill={redColor} />
      {/* White F1 wordmark */}
      <g transform="translate(8, 4) scale(0.8)">
        {/* F letter */}
        <path d="M0 40L7 0H32L30.4 6H13L10.6 16H26L24.4 22H8.6L4 40H0Z" fill={whiteColor} />
        {/* 1 letter (as speed stripe) */}
        <path d="M34 40L41 0H57L51 40H34Z" fill={whiteColor} />
        {/* Speed line accent */}
        <path d="M62 0L56 40H60L66 0H62Z" fill={whiteColor} opacity="0.7" />
        {/* Small speed line */}
        <path d="M69 0L63 40H66L72 0H69Z" fill={whiteColor} opacity="0.4" />
      </g>
    </svg>
  );
}
