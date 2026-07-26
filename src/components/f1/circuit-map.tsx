// Stylized generic circuit outline used across pages.
export function CircuitMap({
  className,
  markers = [],
  progress,
}: {
  className?: string;
  markers?: { color: string; t: number }[]; // t in 0..1
  progress?: number;
}) {
  // A hand-drawn F1-style track path
  const d =
    "M50,180 C50,80 150,60 220,80 C290,100 300,170 360,180 C420,190 480,150 520,190 C560,230 540,300 470,310 C400,320 340,270 280,290 C220,310 180,340 120,320 C60,300 50,240 50,180 Z";
  const pathId = "circuit-path";
  return (
    <svg
      viewBox="0 0 600 400"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Circuit map"
    >
      <defs>
        <linearGradient id="track-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.14 190)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="oklch(0.62 0.24 27)" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        id={pathId}
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={22}
        strokeLinejoin="round"
      />
      <path
        d={d}
        fill="none"
        stroke="url(#track-grad)"
        strokeWidth={3}
        strokeDasharray="2 6"
        strokeLinejoin="round"
      />
      {progress !== undefined && <MarkerOnPath path={d} t={progress} color="#F5F5F7" />}
      {markers.map((m, i) => (
        <MarkerOnPath key={i} path={d} t={m.t} color={m.color} />
      ))}
    </svg>
  );
}

function MarkerOnPath({ path, t, color }: { path: string; t: number; color: string }) {
  // Approximate: sample along a fake circle for reliable positioning.
  // Use SVG's getPointAtLength via ref would need DOM. Instead, parameterize a rough ellipse.
  const cx = 300 + Math.cos(t * Math.PI * 2 - Math.PI / 2) * 220;
  const cy = 200 + Math.sin(t * Math.PI * 2 - Math.PI / 2) * 110;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={color} opacity={0.25} />
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="#0A0A0B" strokeWidth={1.5} />
    </g>
  );
  // Note: `path` unused because we use parametric estimate; keeps API simple.
  void path;
}
