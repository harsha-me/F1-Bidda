import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Gauge, LineChart, Timer, Users, Activity } from "lucide-react";
import { CountdownTimer } from "@/components/f1/countdown";
import { CircuitMap } from "@/components/f1/circuit-map";
import { DriverChip, Eyebrow, GlassCard } from "@/components/f1/primitives";
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
    accent: "gradient-red",
  },
  {
    to: "/races" as const,
    icon: Activity,
    title: "Craziest Races",
    desc: "Fifty of the wildest Grands Prix ever, rated for chaos and linked to highlights.",
    accent: "gradient-teal",
  },
  {
    to: "/compare" as const,
    icon: Users,
    title: "Driver Comparison",
    desc: "Head-to-head radar, pace deltas, tire management, consistency.",
    accent: "gradient-pink",
  },
  {
    to: "/season" as const,
    icon: LineChart,
    title: "Tire Analysis",
    desc: "Stint length, compound degradation curves and pit-loss economics.",
    accent: "gradient-red",
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
      ? "Rain"
      : `${Math.round(weather.data.air_temperature)}°C`
    : "TBD";

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-tex opacity-40" aria-hidden />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at 70% 20%, oklch(0.62 0.24 27 / 0.25), transparent 55%), radial-gradient(ellipse at 20% 80%, oklch(0.78 0.14 190 / 0.15), transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:py-32">
          <div className="min-w-0">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="font-num uppercase tracking-widest text-muted-foreground">
                Live · Season {CURRENT_SEASON}
                {next ? ` · Round ${Math.max(1, next.round - 1)}` : ""}
              </span>
            </div>
            <h1 className="font-display text-5xl font-bold uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
              f1
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-amber bg-clip-text text-transparent">
                Bidda.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg">
              Broadcast-grade race strategy, tire degradation and telemetry analytics — engineered
              for people who read the graph, not the headline.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/season"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground transition hover:brightness-110"
              >
                Explore Season <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/drivers"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-foreground transition hover:bg-white/10"
              >
                Meet the Drivers
              </Link>
            </div>
          </div>

          {/* Countdown card */}
          <GlassCard className="relative overflow-hidden p-6 lg:p-8">
            <div className="absolute -right-16 -top-16 h-64 w-64 opacity-30">
              <CircuitMap className="h-full w-full" />
            </div>
            <div className="relative">
              <Eyebrow>Next Race</Eyebrow>
              {nextRace.isLoading ? (
                <div className="mt-3 space-y-3">
                  <Skeleton className="h-8 w-2/3" />
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
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-3xl">{next.flag}</span>
                    <h2 className="font-display text-2xl font-bold uppercase sm:text-3xl">
                      {next.name}
                    </h2>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
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
                  <div className="mt-6 flex items-center justify-between text-xs">
                    <span className="label-eyebrow">Weather</span>
                    <span className="text-foreground">{weatherLabel}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="label-eyebrow">Country</span>
                    <span className="font-num text-foreground">{next.country}</span>
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-8 sm:py-20">
        <Eyebrow className="mb-3">Modules</Eyebrow>
        <h2 className="mb-10 font-display text-3xl font-bold uppercase sm:text-5xl">
          Four ways to read a race.
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link key={f.to} to={f.to} className="group">
              <GlassCard hover className="flex h-full flex-col gap-4">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${f.accent}`}>
                  <f.icon className="h-5 w-5 text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </div>
                <div className="mt-auto flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-primary opacity-0 transition group-hover:opacity-100">
                  Open <ArrowRight className="h-3 w-3" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      {/* STANDINGS PREVIEW */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-8 sm:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Season {CURRENT_SEASON} · Top 5</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase sm:text-4xl">
              Championship Order
            </h2>
          </div>
          <Link
            to="/season"
            className="hidden items-center gap-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            Full standings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {standings.isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-44 min-w-[240px] flex-1" />
            ))}
          </div>
        ) : standings.isError ? (
          <ErrorNote
            message="Couldn't load driver standings from Jolpica."
            onRetry={() => standings.refetch()}
          />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
            {top5.map((row) => (
              <GlassCard key={row.driver.code} hover className="min-w-[240px] flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-bold text-muted-foreground">
                    #{row.position}
                  </span>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-4">
                  <DriverChip driver={row.driver} size="lg" />
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="stat-value">{row.points}</span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Points
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Wins</span>
                  <span className="font-num text-foreground">{row.wins}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          f1Bidda · Data via Jolpica-F1 & OpenF1 · Not affiliated with F1
        </div>
      </footer>
    </main>
  );
}
