// Lightweight animated CSS/SVG backdrop shared by the quiz screens.
// No canvas/video — just flowing dashed track lines + a soft glow, both of
// which retint smoothly as `accentColor` changes (real-time trait feedback).

export function QuizTrackBackground({ accentColor }: { accentColor: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="grid-tex absolute inset-0 opacity-20" />

      {/* Soft glow that retints with the leading trait / matched team */}
      <div
        className="absolute -top-1/4 left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background: accentColor,
          opacity: 0.16,
          transition: "background 700ms ease, opacity 700ms ease",
        }}
      />

      <svg
        viewBox="0 0 800 600"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-50,120 C150,40 250,220 450,140 C650,60 750,200 900,150"
          fill="none"
          stroke={accentColor}
          strokeWidth={2}
          strokeDasharray="10 16"
          strokeLinecap="round"
          style={{
            opacity: 0.35,
            transition: "stroke 700ms ease",
            animation: "trackFlow 16s linear infinite",
          }}
        />
        <path
          d="M-50,320 C120,380 280,260 460,340 C640,420 720,300 900,360"
          fill="none"
          stroke={accentColor}
          strokeWidth={1.5}
          strokeDasharray="6 20"
          strokeLinecap="round"
          style={{
            opacity: 0.25,
            transition: "stroke 700ms ease",
            animation: "trackFlow 22s linear infinite reverse",
          }}
        />
        <path
          d="M-50,500 C180,440 320,560 520,480 C680,420 760,520 900,470"
          fill="none"
          stroke={accentColor}
          strokeWidth={1.5}
          strokeDasharray="4 14"
          strokeLinecap="round"
          style={{
            opacity: 0.2,
            transition: "stroke 700ms ease",
            animation: "trackFlow 19s linear infinite",
          }}
        />
      </svg>

      {/* Diagonal hard-edge divider echoing the site's existing hero treatment */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, oklch(0.10 0.004 255) 55%, oklch(0.145 0.006 255) 55%)",
          opacity: 0.9,
        }}
      />
    </div>
  );
}
