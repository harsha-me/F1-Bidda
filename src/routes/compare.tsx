import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Area,
  AreaChart,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { EyebrowRed, GlassCard, SectionHeader } from "@/components/f1/primitives";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import { driverStandingsQuery, raceLapsQuery, seasonRacesQuery } from "@/lib/f1-queries";
import { CURRENT_SEASON, driverByCodeFrom, type Driver } from "@/lib/f1-data";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Driver Comparison · f1Bidda" },
      {
        name: "description",
        content:
          "Head-to-head F1 driver comparison across points, wins, position and lap-time delta — sourced live from Jolpica.",
      },
      { property: "og:title", content: "Driver Comparison · f1Bidda" },
      { property: "og:description", content: "Radar-chart driven driver head-to-head." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const standingsQ = useQuery(driverStandingsQuery(CURRENT_SEASON));
  const racesQ = useQuery(seasonRacesQuery(CURRENT_SEASON));

  const drivers: Driver[] = useMemo(
    () => (standingsQ.data ?? []).map((r) => r.driver),
    [standingsQ.data],
  );

  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");

  useEffect(() => {
    if (!a && drivers[0]) setA(drivers[0].code);
    if (!b && drivers[1]) setB(drivers[1].code);
  }, [drivers, a, b]);

  const lastCompletedRace = useMemo(
    () => (racesQ.data ?? []).filter((r) => r.completed).slice(-1)[0],
    [racesQ.data],
  );

  const lapsQ = useQuery({
    ...raceLapsQuery(lastCompletedRace?.id ?? ""),
    enabled: !!lastCompletedRace,
  });

  const dA = drivers.length ? driverByCodeFrom(drivers, a) : null;
  const dB = drivers.length ? driverByCodeFrom(drivers, b) : null;

  const rowA = (standingsQ.data ?? []).find((r) => r.driver.code === a);
  const rowB = (standingsQ.data ?? []).find((r) => r.driver.code === b);

  const maxPoints = Math.max(1, ...(standingsQ.data ?? []).map((r) => r.points));
  const maxWins = Math.max(1, ...(standingsQ.data ?? []).map((r) => r.wins));
  const posN = (standingsQ.data ?? []).length || 1;

  const stats = (row: typeof rowA) =>
    row
      ? {
          Points: Math.round((row.points / maxPoints) * 100),
          Wins: Math.round((row.wins / maxWins) * 100),
          Position: Math.round(((posN - row.position + 1) / posN) * 100),
        }
      : { Points: 0, Wins: 0, Position: 0 };

  const sA = stats(rowA);
  const sB = stats(rowB);

  const radarData = Object.keys(sA).map((k) => ({
    metric: k,
    [a]: sA[k as keyof typeof sA],
    [b]: sB[k as keyof typeof sB],
  }));

  const deltaData = useMemo(() => {
    const laps = lapsQ.data ?? [];
    const byLapA = new Map<number, number>();
    const byLapB = new Map<number, number>();
    laps.forEach((l) => {
      if (l.driver === a) byLapA.set(l.lap, l.lapTime);
      if (l.driver === b) byLapB.set(l.lap, l.lapTime);
    });
    const commonLaps = [...byLapA.keys()].filter((n) => byLapB.has(n)).sort((x, y) => x - y);
    let cum = 0;
    return commonLaps.map((lap) => {
      const d = (byLapB.get(lap) ?? 0) - (byLapA.get(lap) ?? 0);
      cum += d;
      return { lap, delta: +cum.toFixed(3) };
    });
  }, [lapsQ.data, a, b]);

  if (standingsQ.isLoading) {
    return (
      <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 sm:py-16 space-y-5">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (standingsQ.isError || drivers.length === 0) {
    return (
      <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 sm:py-16">
        <ErrorNote
          message="Couldn't load the driver roster from Jolpica."
          onRetry={() => standingsQ.refetch()}
        />
      </main>
    );
  }

  if (!dA || !dB) return null;

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 sm:py-16">
      <SectionHeader eyebrow="Compare" title="Head to Head" />

      {/* Driver selectors — overlapping panel style */}
      <div className="grid gap-3 sm:grid-cols-2">
        <DriverSelector
          value={a}
          onChange={setA}
          label="Driver A"
          drivers={drivers}
          accentColor={dA.teamColor}
        />
        <DriverSelector
          value={b}
          onChange={setB}
          label="Driver B"
          drivers={drivers}
          accentColor={dB.teamColor}
        />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Radar chart */}
        <div
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
          }}
        >
          <EyebrowRed className="mb-1.5">Season {CURRENT_SEASON}</EyebrowRed>
          <h3 className="mb-1 font-display font-black uppercase text-xl">Season Radar</h3>
          <p className="mb-4 text-xs" style={{ color: "oklch(0.52 0.010 255)" }}>
            Normalised to the leader in each category.
          </p>
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="oklch(1 0 0 / 7%)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "oklch(0.65 0.010 255)", fontSize: 11 }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fill: "oklch(1 0 0 / 25%)", fontSize: 10 }}
                stroke="oklch(1 0 0 / 5%)"
              />
              <Radar dataKey={a} stroke={dA.teamColor} fill={dA.teamColor} fillOpacity={0.2} />
              <Radar dataKey={b} stroke={dB.teamColor} fill={dB.teamColor} fillOpacity={0.2} />
              <Tooltip contentStyle={darkTooltip} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Side-by-side table with progress bars */}
        <div
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderRadius: "0.75rem",
            overflow: "hidden",
          }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid oklch(1 0 0 / 7%)" }}>
            <EyebrowRed>Season {CURRENT_SEASON}</EyebrowRed>
            <h3 className="mt-1 font-display font-black uppercase text-xl">Side by Side</h3>
          </div>

          {/* Driver label row */}
          <div
            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-5 py-3 text-xs font-display font-bold uppercase"
            style={{
              borderBottom: "1px solid oklch(1 0 0 / 6%)",
              letterSpacing: "0.08em",
              color: "oklch(0.50 0.010 255)",
            }}
          >
            <span>Metric</span>
            <span style={{ color: dA.teamColor }}>{dA.code}</span>
            <span style={{ color: dB.teamColor }}>{dB.code}</span>
          </div>

          {/* Stat rows with progress bars */}
          {[
            {
              label: "Position",
              a: rowA?.position ?? "—",
              b: rowB?.position ?? "—",
              lowerBetter: true,
              max: posN,
            },
            {
              label: "Points",
              a: rowA?.points ?? 0,
              b: rowB?.points ?? 0,
              lowerBetter: false,
              max: maxPoints,
            },
            {
              label: "Wins",
              a: rowA?.wins ?? 0,
              b: rowB?.wins ?? 0,
              lowerBetter: false,
              max: maxWins,
            },
          ].map((row) => {
            const na = typeof row.a === "number" ? row.a : Number(row.a);
            const nb = typeof row.b === "number" ? row.b : Number(row.b);
            const pctA = isNaN(na)
              ? 0
              : row.lowerBetter
                ? ((row.max - na + 1) / row.max) * 100
                : (na / row.max) * 100;
            const pctB = isNaN(nb)
              ? 0
              : row.lowerBetter
                ? ((row.max - nb + 1) / row.max) * 100
                : (nb / row.max) * 100;
            const aBetter = !isNaN(na) && !isNaN(nb) && (row.lowerBetter ? na <= nb : na >= nb);
            const bBetter = !isNaN(na) && !isNaN(nb) && (row.lowerBetter ? nb <= na : nb >= na);

            return (
              <div
                key={row.label}
                className="px-5 py-4"
                style={{ borderBottom: "1px solid oklch(1 0 0 / 5%)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: "oklch(0.55 0.012 255)" }}>
                    {row.label}
                  </span>
                  <div className="flex gap-4">
                    <span
                      className="font-num text-sm font-bold"
                      style={{ color: aBetter ? "oklch(0.94 0.003 255)" : "oklch(0.50 0.010 255)" }}
                    >
                      {row.a}
                    </span>
                    <span
                      className="font-num text-sm font-bold"
                      style={{ color: bBetter ? "oklch(0.94 0.003 255)" : "oklch(0.50 0.010 255)" }}
                    >
                      {row.b}
                    </span>
                  </div>
                </div>
                {/* Progress bars */}
                <div className="space-y-1">
                  <div
                    className="flex h-1.5 overflow-hidden rounded-full"
                    style={{ background: "oklch(1 0 0 / 5%)" }}
                  >
                    <div
                      className="rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, pctA)}%`,
                        background: dA.teamColor,
                        opacity: aBetter ? 1 : 0.5,
                      }}
                    />
                  </div>
                  <div
                    className="flex h-1.5 overflow-hidden rounded-full"
                    style={{ background: "oklch(1 0 0 / 5%)" }}
                  >
                    <div
                      className="rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, pctB)}%`,
                        background: dB.teamColor,
                        opacity: bBetter ? 1 : 0.5,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lap-time delta chart */}
      <div
        className="mt-5"
        style={{
          background: "oklch(0.155 0.006 255)",
          border: "1px solid oklch(1 0 0 / 7%)",
          borderRadius: "0.75rem",
          padding: "1.25rem",
        }}
      >
        <EyebrowRed className="mb-1">
          {lastCompletedRace ? lastCompletedRace.name : "Lap Delta"}
        </EyebrowRed>
        <h3 className="font-display font-black uppercase text-xl">Lap Time Delta</h3>
        <p className="mt-1 mb-4 text-xs" style={{ color: "oklch(0.52 0.010 255)" }}>
          Cumulative gap on the last completed race. Positive = {dB.code} slower cumulative time
          (i.e. {dA.code} ahead).
        </p>

        {!lastCompletedRace ? (
          <p className="text-sm" style={{ color: "oklch(0.52 0.010 255)" }}>
            No completed race yet this season.
          </p>
        ) : lapsQ.isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : lapsQ.isError ? (
          <ErrorNote message="Lap data unavailable." onRetry={() => lapsQ.refetch()} />
        ) : deltaData.length === 0 ? (
          <p className="text-sm" style={{ color: "oklch(0.52 0.010 255)" }}>
            No overlapping laps between these two drivers in that race.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={deltaData}>
              <defs>
                <linearGradient id="deltaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={dA.teamColor} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={dA.teamColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="oklch(1 0 0 / 5%)" />
              <XAxis dataKey="lap" stroke="oklch(1 0 0 / 30%)" fontSize={11} />
              <YAxis stroke="oklch(1 0 0 / 30%)" fontSize={11} />
              <ReferenceLine y={0} stroke="oklch(1 0 0 / 20%)" />
              <Tooltip contentStyle={darkTooltip} formatter={(v: number) => `${v.toFixed(2)}s`} />
              <Area
                type="monotone"
                dataKey="delta"
                stroke={dA.teamColor}
                fill="url(#deltaGrad)"
                strokeWidth={2}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </main>
  );
}

function DriverSelector({
  value,
  onChange,
  label,
  drivers,
  accentColor,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  drivers: Driver[];
  accentColor: string;
}) {
  const d = driverByCodeFrom(drivers, value);
  return (
    <div
      className="relative flex items-center gap-4 overflow-hidden"
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderTop: `3px solid ${accentColor}`,
        borderRadius: "0.5rem",
        padding: "1rem",
      }}
    >
      {/* Large code watermark */}
      <div
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-display font-black select-none"
        style={{ fontSize: "4.5rem", lineHeight: 1, color: accentColor, opacity: 0.08 }}
      >
        {d.code}
      </div>

      {/* Color swatch */}
      <div
        className="grid h-14 w-14 shrink-0 place-items-center font-display text-lg font-black text-black"
        style={{
          backgroundColor: accentColor,
          borderRadius: "0.375rem",
          clipPath: "polygon(0 0, 100% 0, 100% 80%, 88% 100%, 0 100%)",
        }}
      >
        {d.code}
      </div>

      <div className="relative min-w-0 flex-1">
        <EyebrowRed>{label}</EyebrowRed>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-0.5 w-full bg-transparent font-display text-xl font-black uppercase outline-none"
          style={{ letterSpacing: "0.03em" }}
        >
          {drivers.map((dr) => (
            <option key={dr.code} value={dr.code} className="bg-background">
              {dr.name}
            </option>
          ))}
        </select>
        <div className="mt-0.5 text-xs" style={{ color: "oklch(0.52 0.010 255)" }}>
          {d.team}
        </div>
      </div>
    </div>
  );
}

const darkTooltip = {
  backgroundColor: "oklch(0.135 0.005 255)",
  border: "1px solid oklch(1 0 0 / 10%)",
  borderRadius: 6,
  color: "oklch(0.94 0.003 255)",
  fontSize: 12,
  backdropFilter: "blur(12px)",
} as const;
