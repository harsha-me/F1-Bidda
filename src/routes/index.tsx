import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Gauge, LineChart, Timer, Users, Activity, TrendingUp } from "lucide-react";
import { CountdownTimer } from "@/components/f1/countdown";
import { CircuitMap } from "@/components/f1/circuit-map";
import { DriverChip, Eyebrow, EyebrowRed, GlassCard } from "@/components/f1/primitives";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import { driverStandingsQuery, latestWeatherQuery, nextRaceQuery } from "@/lib/f1-queries";
import { CURRENT_SEASON } from "@/lib/f1-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "f1Bidda — F1 Race Strategy & Telemetry" },
      {
        name: "description",
        content:
          "Broadcast-grade Formula 1 analytics powered by live Jolpica and OpenF1 data: strategy simulator, telemetry replay, driver comparison, tire analysis.",
      },
      { property: "og:title", content: "f1Bidda — F1 Race Strategy & Telemetry" },
      {
        property: "og:description",
        content:
          "Interactive F1 race strategy, tire degradation and telemetry analytics built for analysts and fans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const features = [
  {
    to: "/strategy" as const,
    icon: Gauge,
    title: "Strategy Simulator",
    desc: "What-if pit windows, undercut vs. overcut, tire cliff prediction.",
    color: "oklch(0.60 0.245 27)",
    tag: "SIMULATOR",
  },
  {
    to: "/races" as const,
    icon: Activity,
    title: "Craziest Races",
    desc: "Fifty of the wildest Grands Prix ever, rated for chaos.",
    color: "oklch(0.76 0.14 190)",
    tag: "ARCHIVE",
  },
  {
    to: "/compare" as const,
    icon: Users,
    title: "Driver Comparison",
    desc: "Head-to-head radar, pace deltas, tire management, consistency.",
    color: "oklch(0.70 0.18 350)",
    tag: "HEAD-TO-HEAD",
  },
  {
    to: "/season" as const,
    icon: LineChart,
    title: "Tire Analysis",
    desc: "Stint length, compound degradation curves and pit-loss economics.",
    color: "oklch(0.80 0.18 75)",
    tag: "ANALYSIS",
  },
];

function Home() {
  const nextRace = useQuery(nextRaceQuery());
  const standings = useQuery(driverStandingsQuery(CURRENT_SEASON));
  const weather = useQuery(latestWeatherQuery());

  const next = nextRace.data;
  const top5 = standings.data?.slice(0, 5) ?? [];
  const weatherLabel = weather.data
    ? weather.data.rainfall > 0
      ? "🌧 Rain"
      : `${Math.round(weather.data.air_temperature)}°C`
    : "—";

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: "min(90vh, 700px)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Grid texture */}
        <div className="absolute inset-0 grid-tex opacity-30" aria-hidden />

        {/* Diagonal divider — hard edge, not gradient blob */}
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "linear-gradient(105deg, oklch(0.10 0.004 255) 55%, oklch(0.155 0.006 255) 55%)",
          }}
        />

        {/* Red top bar accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          aria-hidden
          style={{
            background:
              "linear-gradient(90deg, oklch(0.60 0.245 27), oklch(0.60 0.245 27 / 0))",
          }}
        />

        <div className="relative mx-auto grid w-full max-w-[1400px] gap-10 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.3fr_1fr] lg:py-28 xl:py-36">
          {/* Left: headline */}
          <div className="min-w-0 flex flex-col justify-center">
            {/* Status pill */}
            <div
              className="mb-6 inline-flex w-fit items-center gap-2 px-3 py-1"
              style={{
                background: "oklch(0.60 0.245 27 / 0.08)",
                border: "1px solid oklch(0.60 0.245 27 / 0.3)",
                borderRadius: "0.25rem",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: "oklch(0.60 0.245 27)",
                  boxShadow: "0 0 6px oklch(0.60 0.245 27)",
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              <span
                className="font-num text-[11px] font-semibold"
                style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.1em" }}
              >
                SEASON {CURRENT_SEASON} · LIVE DATA
              </span>
            </div>

            {/* Main headline */}
            <h1
              className="font-display font-black uppercase"
              style={{
                fontSize: "clamp(3rem, 9vw, 6.5rem)",
                lineHeight: 0.9,
                letterSpacing: "-0.02em",
              }}
            >
              <span style={{ display: "block", color: "oklch(0.94 0.003 255)" }}>Race</span>
              <span
                style={{
                  display: "block",
                  color: "oklch(0.60 0.245 27)",
                  WebkitTextStroke: "1px oklch(0.60 0.245 27)",
                }}
              >
                Strategy
              </span>
              <span
                style={{
                  display: "block",
                  color: "transparent",
                  WebkitTextStroke: "1px oklch(0.94 0.003 255 / 0.3)",
                }}
              >
                Analytics.
              </span>
            </h1>

            <p
              className="mt-6 max-w-lg text-base leading-relaxed"
              style={{ color: "oklch(0.58 0.012 255)" }}
            >
              Broadcast-grade strategy, tire degradation and telemetry analytics —
              engineered for people who read the graph, not the headline.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/season"
                className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase transition-all hover:brightness-110"
                style={{
                  background: "oklch(0.60 0.245 27)",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.25rem",
                  letterSpacing: "0.06em",
                  clipPath: "polygon(0 0, 100% 0, 95% 100%, 0 100%)",
                }}
              >
                Explore Season <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/drivers"
                className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase transition-all hover:bg-white/10"
                style={{
                  background: "oklch(1 0 0 / 5%)",
                  border: "1px solid oklch(1 0 0 / 12%)",
                  color: "oklch(0.85 0.005 255)",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.25rem",
                  letterSpacing: "0.06em",
                }}
              >
                Meet the Drivers
              </Link>
            </div>

            {/* Stat strip */}
            <div className="mt-10 flex gap-6">
              {[
                { label: "Teams", value: "10" },
                { label: "Drivers", value: "20" },
                { label: "Rounds", value: "24" },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    className="font-display font-black"
                    style={{ fontSize: "1.75rem", lineHeight: 1, color: "oklch(0.94 0.003 255)" }}
                  >
                    {s.value}
                  </div>
                  <div className="label-eyebrow mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Next Race card */}
          <div
            className="relative flex flex-col overflow-hidden"
            style={{
              background: "oklch(0.155 0.006 255 / 0.9)",
              border: "1px solid oklch(1 0 0 / 8%)",
              borderRadius: "0.75rem",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Top accent bar */}
            <div
              className="h-1 w-full shrink-0"
              style={{ background: "linear-gradient(90deg, oklch(0.60 0.245 27), oklch(0.76 0.14 190 / 0))" }}
            />

            {/* Circuit map watermark */}
            <div className="absolute -right-8 -bottom-8 h-48 w-48 opacity-10 pointer-events-none">
              <CircuitMap className="h-full w-full" />
            </div>

            <div className="relative flex-1 p-6">
              <EyebrowRed>Next Race</EyebrowRed>
              {nextRace.isLoading ? (
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : nextRace.isError || !next ? (
                <ErrorNote
                  message="Couldn't load the next race from Jolpica."
                  onRetry={() => nextRace.refetch()}
                />
              ) : (
                <>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-4xl leading-none">{next.flag}</span>
                    <h2
                      className="font-display font-black uppercase"
                      style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", lineHeight: 1.1 }}
                    >
                      {next.name}
                    </h2>
                  </div>
                  <div className="mt-1.5 text-sm" style={{ color: "oklch(0.55 0.012 255)" }}>
                    {next.circuit} · Round {next.round} ·{" "}
                    {new Date(next.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="mt-6">
                    <CountdownTimer target={next.date} />
                  </div>

                  {/* Info grid */}
                  <div
                    className="mt-6 grid grid-cols-2 gap-px overflow-hidden"
                    style={{
                      background: "oklch(1 0 0 / 5%)",
                      border: "1px solid oklch(1 0 0 / 6%)",
                      borderRadius: "0.5rem",
                    }}
                  >
                    {[
                      { label: "Weather", value: weatherLabel },
                      { label: "Country", value: next.country },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex flex-col gap-1 p-3"
                        style={{ background: "oklch(0.14 0.005 255)" }}
                      >
                        <span className="label-eyebrow">{item.label}</span>
                        <span className="font-num text-sm font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section
        className="relative"
        style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }}
      >
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-8 sm:py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <EyebrowRed className="mb-2.5">Modules</EyebrowRed>
              <h2
                className="font-display font-black uppercase"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", lineHeight: 1.05 }}
              >
                Four Ways to Read a Race.
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <Link key={f.to} to={f.to} className="group block">
                <div
                  className="relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background: "oklch(0.155 0.006 255)",
                    border: "1px solid oklch(1 0 0 / 7%)",
                    borderBottom: `3px solid ${f.color}`,
                    borderRadius: "0.5rem",
                    padding: "1.25rem",
                  }}
                >
                  {/* Large faded index number as background */}
                  <div
                    className="absolute -right-2 -top-4 font-display font-black select-none pointer-events-none"
                    style={{
                      fontSize: "6rem",
                      lineHeight: 1,
                      color: f.color,
                      opacity: 0.07,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  {/* Tag */}
                  <div
                    className="mb-4 inline-flex w-fit items-center px-2 py-0.5 font-display text-[10px] font-bold uppercase"
                    style={{
                      background: `${f.color}18`,
                      color: f.color,
                      borderRadius: "0.2rem",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {f.tag}
                  </div>

                  {/* Icon */}
                  <div
                    className="mb-3 grid h-10 w-10 place-items-center"
                    style={{
                      background: `${f.color}20`,
                      borderRadius: "0.375rem",
                    }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: f.color }} strokeWidth={2} />
                  </div>

                  {/* Text */}
                  <h3
                    className="font-display font-bold uppercase"
                    style={{ fontSize: "1.1rem", letterSpacing: "0.03em" }}
                  >
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "oklch(0.58 0.012 255)" }}>
                    {f.desc}
                  </p>

                  {/* CTA */}
                  <div
                    className="mt-auto pt-4 flex items-center gap-1 font-display text-xs font-bold uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{ color: f.color, letterSpacing: "0.08em" }}
                  >
                    Open <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHAMPIONSHIP STANDINGS ──────────────────────── */}
      <section
        style={{
          borderTop: "1px solid oklch(1 0 0 / 6%)",
          background: "oklch(0.115 0.004 255)",
        }}
      >
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-8 sm:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <EyebrowRed className="mb-2.5">Season {CURRENT_SEASON} · Top 5</EyebrowRed>
              <h2
                className="font-display font-black uppercase"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", lineHeight: 1.05 }}
              >
                Championship Order
              </h2>
            </div>
            <Link
              to="/season"
              className="hidden items-center gap-1.5 font-display text-xs font-bold uppercase transition-opacity hover:opacity-80 sm:inline-flex"
              style={{ color: "oklch(0.55 0.012 255)", letterSpacing: "0.08em" }}
            >
              Full standings <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {standings.isLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-40 min-w-[220px] flex-1" />
              ))}
            </div>
          ) : standings.isError ? (
            <ErrorNote
              message="Couldn't load driver standings from Jolpica."
              onRetry={() => standings.refetch()}
            />
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
              {top5.map((row, idx) => (
                <div
                  key={row.driver.code}
                  className="min-w-[210px] flex-1 relative overflow-hidden"
                  style={{
                    background: "oklch(0.155 0.006 255)",
                    border: "1px solid oklch(1 0 0 / 7%)",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                  }}
                >
                  {/* Position watermark */}
                  <div
                    className="absolute right-0 bottom-0 font-display font-black select-none pointer-events-none"
                    style={{
                      fontSize: "7rem",
                      lineHeight: 0.85,
                      color: "oklch(1 0 0 / 0.04)",
                    }}
                  >
                    {row.position}
                  </div>

                  {/* Team color stripe */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: row.driver.teamColor }}
                  />

                  <div className="relative">
                    <div
                      className="font-display font-black"
                      style={{ fontSize: "0.9rem", color: "oklch(0.55 0.012 255)" }}
                    >
                      P{row.position}
                    </div>

                    <div className="mt-3">
                      <DriverChip driver={row.driver} />
                    </div>

                    <div className="mt-4 flex items-baseline justify-between">
                      <div>
                        <div className="stat-value" style={{ fontSize: "1.75rem" }}>
                          {row.points}
                        </div>
                        <div className="label-eyebrow mt-0.5">Points</div>
                      </div>
                      <div className="text-right">
                        <div
                          className="font-num font-bold"
                          style={{ fontSize: "1.1rem", color: "oklch(0.94 0.003 255)" }}
                        >
                          {row.wins}
                        </div>
                        <div className="label-eyebrow mt-0.5">Wins</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid oklch(1 0 0 / 6%)",
          background: "oklch(0.10 0.003 255)",
        }}
      >
        <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {/* Brand */}
            <div>
              <div
                className="font-display font-black uppercase"
                style={{ fontSize: "1.25rem", letterSpacing: "0.08em" }}
              >
                f1<span style={{ color: "oklch(0.60 0.245 27)" }}>Bidda</span>
              </div>
              <p className="mt-2 max-w-xs text-xs" style={{ color: "oklch(0.50 0.010 255)", lineHeight: 1.6 }}>
                Broadcast-grade F1 analytics. Data via Jolpica-F1 &amp; OpenF1.
                Not affiliated with Formula 1.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12">
              {[
                { label: "Data", links: [{ to: "/season", label: "Season" }, { to: "/races", label: "Races" }] },
                {
                  label: "Tools",
                  links: [
                    { to: "/strategy", label: "Strategy" },
                    { to: "/compare", label: "Compare" },
                    { to: "/drivers", label: "Drivers" },
                    { to: "/circuits", label: "Circuits" },
                  ],
                },
              ].map((col) => (
                <div key={col.label}>
                  <div className="label-eyebrow mb-3">{col.label}</div>
                  <ul className="flex flex-col gap-2">
                    {col.links.map((l) => (
                      <li key={l.to}>
                        <Link
                          to={l.to}
                          className="font-display text-sm font-semibold uppercase transition-colors hover:text-foreground"
                          style={{ color: "oklch(0.50 0.010 255)", letterSpacing: "0.06em" }}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div
            className="mt-8 pt-6 text-xs"
            style={{
              borderTop: "1px solid oklch(1 0 0 / 5%)",
              color: "oklch(0.40 0.008 255)",
            }}
          >
            © {new Date().getFullYear()} f1Bidda · All race data is provided for entertainment purposes only.
          </div>
        </div>
      </footer>
    </main>
  );
}
