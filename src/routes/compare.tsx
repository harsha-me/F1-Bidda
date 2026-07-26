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
import { DriverChip, Eyebrow, GlassCard, SectionHeader } from "@/components/f1/primitives";
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

  // Real lap-time delta from Jolpica laps on last completed race
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
      <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 sm:py-16 space-y-6">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <DriverSelector value={a} onChange={setA} label="Driver A" drivers={drivers} />
        <DriverSelector value={b} onChange={setB} label="Driver B" drivers={drivers} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <GlassCard>
          <SectionHeader title="Season Radar" />
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                stroke="rgba(255,255,255,0.05)"
              />
              <Radar dataKey={a} stroke={dA.teamColor} fill={dA.teamColor} fillOpacity={0.25} />
              <Radar dataKey={b} stroke={dB.teamColor} fill={dB.teamColor} fillOpacity={0.25} />
              <Tooltip contentStyle={darkTooltip} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-muted-foreground">
            Normalised to the leader in each category for {CURRENT_SEASON}.
          </p>
        </GlassCard>

        <GlassCard className="p-0">
          <div className="border-b border-white/5 p-5">
            <Eyebrow>Season {CURRENT_SEASON}</Eyebrow>
            <h3 className="mt-1 font-display text-2xl font-bold uppercase">Side by Side</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 text-left">Metric</th>
                <th className="px-4 py-3 text-right" style={{ color: dA.teamColor }}>
                  {dA.code}
                </th>
                <th className="px-4 py-3 text-right" style={{ color: dB.teamColor }}>
                  {dB.code}
                </th>
              </tr>
            </thead>
            <tbody>
              <StatRow
                label="Position"
                a={rowA?.position ?? "—"}
                b={rowB?.position ?? "—"}
                lowerBetter
              />
              <StatRow label="Points" a={rowA?.points ?? 0} b={rowB?.points ?? 0} />
              <StatRow label="Wins" a={rowA?.wins ?? 0} b={rowB?.wins ?? 0} />
            </tbody>
          </table>
        </GlassCard>
      </div>

      <GlassCard className="mt-6">
        <SectionHeader
          title={`Lap Time Delta${lastCompletedRace ? ` · ${lastCompletedRace.name}` : ""}`}
        />
        <p className="mb-3 text-xs text-muted-foreground">
          Cumulative gap on the last completed race. Positive = {dB.code} slower cumulative time
          (i.e. {dA.code} ahead).
        </p>
        {!lastCompletedRace ? (
          <p className="text-sm text-muted-foreground">No completed race yet this season.</p>
        ) : lapsQ.isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : lapsQ.isError ? (
          <ErrorNote message="Lap data unavailable." onRetry={() => lapsQ.refetch()} />
        ) : deltaData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No overlapping laps between these two drivers in that race.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={deltaData}>
              <defs>
                <linearGradient id="pos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={dA.teamColor} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={dA.teamColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="lap" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
              <Tooltip contentStyle={darkTooltip} formatter={(v: number) => `${v.toFixed(2)}s`} />
              <Area
                type="monotone"
                dataKey="delta"
                stroke={dA.teamColor}
                fill="url(#pos)"
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </GlassCard>
    </main>
  );
}

function StatRow({
  label,
  a,
  b,
  lowerBetter,
}: {
  label: string;
  a: number | string;
  b: number | string;
  lowerBetter?: boolean;
}) {
  const na = typeof a === "number" ? a : Number(a);
  const nb = typeof b === "number" ? b : Number(b);
  const hasA = !isNaN(na);
  const hasB = !isNaN(nb);
  const aBetter = hasA && (!hasB || (lowerBetter ? na <= nb : na >= nb));
  const bBetter = hasB && (!hasA || (lowerBetter ? nb <= na : nb >= na));
  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="px-4 py-3 text-muted-foreground">{label}</td>
      <td
        className={`px-4 py-3 text-right font-num ${
          aBetter ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {a}
      </td>
      <td
        className={`px-4 py-3 text-right font-num ${
          bBetter ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {b}
      </td>
    </tr>
  );
}

function DriverSelector({
  value,
  onChange,
  label,
  drivers,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  drivers: Driver[];
}) {
  const d = driverByCodeFrom(drivers, value);
  return (
    <GlassCard className="flex items-center gap-4">
      <div
        className="grid h-14 w-14 shrink-0 place-items-center rounded-xl font-display text-lg font-bold text-black"
        style={{ backgroundColor: d.teamColor }}
      >
        {d.code}
      </div>
      <div className="min-w-0 flex-1">
        <Eyebrow>{label}</Eyebrow>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full bg-transparent font-display text-xl font-bold uppercase outline-none"
        >
          {drivers.map((dr) => (
            <option key={dr.code} value={dr.code} className="bg-background">
              {dr.name}
            </option>
          ))}
        </select>
        <div className="text-xs text-muted-foreground">{d.team}</div>
      </div>
    </GlassCard>
  );
}

const darkTooltip = {
  backgroundColor: "rgba(20,20,24,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#F5F5F7",
  fontSize: 12,
  backdropFilter: "blur(12px)",
} as const;
