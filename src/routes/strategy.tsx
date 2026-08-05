import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import {
  DriverChip,
  EyebrowRed,
  GlassCard,
  SectionHeader,
  StatCard,
} from "@/components/f1/primitives";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import { COMPOUND_COLOR, CURRENT_SEASON, driverByCodeFrom, type Driver } from "@/lib/f1-data";
import { ChartTakeaway } from "@/components/f1/chart-takeaway";
import {
  driverStandingsQuery,
  pitStopsQuery,
  raceLapsQuery,
  seasonRacesQuery,
} from "@/lib/f1-queries";

export const Route = createFileRoute("/strategy")({
  head: () => ({
    meta: [
      { title: "Strategy Simulator · f1Bidda" },
      {
        name: "description",
        content:
          "F1 pit strategy what-if simulator with tire degradation cliff prediction, built from real Jolpica lap data.",
      },
      { property: "og:title", content: "Strategy Simulator · f1Bidda" },
      { property: "og:description", content: "Undercut, overcut and tire cliff analysis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StrategyPage,
});

function degradation(base: number, rate: number, cliff: number) {
  const arr: { age: number; time: number; cliff: boolean }[] = [];
  for (let age = 0; age <= 45; age++) {
    const cliffPenalty = age > cliff ? (age - cliff) * 0.25 : 0;
    arr.push({
      age,
      time: +(base + age * rate + cliffPenalty).toFixed(3),
      cliff: age === cliff,
    });
  }
  return { data: arr, cliff };
}

function StrategyPage() {
  const racesQ = useQuery(seasonRacesQuery(CURRENT_SEASON));
  const standingsQ = useQuery(driverStandingsQuery(CURRENT_SEASON));

  const completedRaces = useMemo(
    () => (racesQ.data ?? []).filter((r) => r.completed),
    [racesQ.data],
  );
  const drivers: Driver[] = useMemo(
    () => (standingsQ.data ?? []).map((r) => r.driver),
    [standingsQ.data],
  );

  const [raceId, setRaceId] = useState<string>("");
  const [driverCode, setDriverCode] = useState<string>("");

  useEffect(() => {
    if (!raceId && completedRaces[0]) setRaceId(completedRaces[completedRaces.length - 1].id);
  }, [completedRaces, raceId]);
  useEffect(() => {
    if (!driverCode && drivers[0]) setDriverCode(drivers[0].code);
  }, [drivers, driverCode]);

  const race = completedRaces.find((r) => r.id === raceId);
  const lapsQ = useQuery({ ...raceLapsQuery(raceId), enabled: !!raceId });
  const pitQ = useQuery({ ...pitStopsQuery(raceId), enabled: !!raceId });

  const baseLap = useMemo(() => {
    const laps = (lapsQ.data ?? []).filter(
      (l) => l.driver === driverCode && l.lapTime > 0 && !l.pit,
    );
    if (!laps.length) return 82.0;
    const times = laps.map((l) => l.lapTime).sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)];
  }, [lapsQ.data, driverCode]);

  const compoundCurves = useMemo(
    () => ({
      SOFT: degradation(baseLap - 0.6, 0.09, 18),
      MEDIUM: degradation(baseLap, 0.05, 28),
      HARD: degradation(baseLap + 0.6, 0.03, 40),
    }),
    [baseLap],
  );

  const actualPit = useMemo(() => {
    const stops = (pitQ.data ?? []).filter((s) => s.driverCode === driverCode);
    return stops.length ? stops[0].lap : null;
  }, [pitQ.data, driverCode]);

  const [pitLap, setPitLap] = useState<number>(20);
  useEffect(() => {
    if (actualPit !== null) setPitLap(actualPit);
    else setPitLap(20);
  }, [actualPit]);

  const maxLaps = Math.max(45, race?.laps ?? 45);
  useEffect(() => {
    setPitLap((prev) => Math.min(prev, maxLaps));
  }, [maxLaps]);

  const positionGain = actualPit ? (pitLap < actualPit ? +2 : pitLap > actualPit ? -1 : 0) : 0;
  const timeGain = actualPit ? ((actualPit - pitLap) * 0.35).toFixed(2) : "0.00";
  const d = drivers.length ? driverByCodeFrom(drivers, driverCode) : null;
  const bootLoading = racesQ.isLoading || standingsQ.isLoading;

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 sm:py-16">
      {/* Header + controls row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader eyebrow="Simulator" title="Strategy What-If" />

        {/* Selectors */}
        {!bootLoading && (
          <div className="mb-7 flex flex-wrap gap-2">
            {/* Race selector */}
            <div
              className="px-3 py-2"
              style={{
                background: "oklch(0.155 0.006 255)",
                border: "1px solid oklch(1 0 0 / 8%)",
                borderRadius: "0.375rem",
              }}
            >
              <div className="label-eyebrow mb-1">Race</div>
              <select
                value={raceId}
                onChange={(e) => setRaceId(e.target.value)}
                className="bg-transparent font-display text-sm font-bold uppercase outline-none"
                style={{ letterSpacing: "0.05em" }}
              >
                {completedRaces.map((r) => (
                  <option key={r.id} value={r.id} className="bg-background">
                    {r.flag} {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver selector */}
            <div
              className="px-3 py-2"
              style={{
                background: "oklch(0.155 0.006 255)",
                border: "1px solid oklch(1 0 0 / 8%)",
                borderRadius: "0.375rem",
              }}
            >
              <div className="label-eyebrow mb-1">Driver</div>
              <select
                value={driverCode}
                onChange={(e) => setDriverCode(e.target.value)}
                className="bg-transparent font-display text-sm font-bold uppercase outline-none"
                style={{ letterSpacing: "0.05em" }}
              >
                {drivers.map((dr) => (
                  <option key={dr.code} value={dr.code} className="bg-background">
                    {dr.code} · {dr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {bootLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : racesQ.isError || standingsQ.isError ? (
        <ErrorNote
          message="Couldn't load season data."
          onRetry={() => {
            racesQ.refetch();
            standingsQ.refetch();
          }}
        />
      ) : (
        <>
          {/* Headline Takeaway */}
          <ChartTakeaway
            headline={
              <span>
                <strong>💡 Pit Strategy Insight:</strong> Pitting on{" "}
                <span className="font-bold text-primary">Lap {pitLap}</span>{" "}
                {positionGain > 0
                  ? `gains +${positionGain} positions by taking fresh Hard tires in the undercut window.`
                  : positionGain < 0
                    ? `loses ${positionGain} position due to pitting into track traffic on older rubber.`
                    : `maintains current track position while resetting tire wear.`}
              </span>
            }
          />

          {/* Stat cards row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Actual Pit Lap"
              value={actualPit ?? "—"}
              suffix={`/ ${race?.laps ?? "?"}`}
            />
            <StatCard label="Simulated Pit" value={pitLap} accent="teal" />
            <StatCard
              label="Position Δ"
              value={positionGain > 0 ? `+${positionGain}` : String(positionGain)}
              accent={positionGain > 0 ? "teal" : positionGain < 0 ? "red" : undefined}
            />
            <StatCard
              label="Time Δ"
              value={timeGain}
              suffix="s"
              accent={+timeGain > 0 ? "teal" : "red"}
            />
          </div>

          {/* Pit lap slider card */}
          <div
            className="mt-5"
            style={{
              background: "oklch(0.155 0.006 255)",
              border: "1px solid oklch(1 0 0 / 8%)",
              borderRadius: "0.5rem",
              padding: "1.25rem",
            }}
          >
            <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <EyebrowRed>Simulated pit lap</EyebrowRed>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="stat-value" style={{ fontSize: "2rem" }}>
                    Lap {pitLap}
                  </span>
                  <span className="text-sm" style={{ color: "oklch(0.55 0.012 255)" }}>
                    {actualPit ? `(actual: L${actualPit})` : "(no pit data)"}
                  </span>
                </div>
              </div>

              {/* Strategy window advice badge */}
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    pitLap >= 16 && pitLap <= 24
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : pitLap < 16
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {pitLap >= 16 && pitLap <= 24
                    ? "🟢 Optimal Undercut Window (Fresh Tires Beat Rivals)"
                    : pitLap < 16
                      ? "🟡 Early Pit (Risks Long Second Stint)"
                      : "🔴 Late Pit (Suffers Severe Tire Degradation)"}
                </span>
                {d && <DriverChip driver={d} />}
              </div>
            </div>

            {/* Styled range */}
            <div
              className="relative py-1"
              style={{
                background: "oklch(0.135 0.005 255)",
                borderRadius: "0.375rem",
                padding: "1rem",
              }}
            >
              <input
                type="range"
                min={5}
                max={maxLaps}
                value={pitLap}
                onChange={(e) => setPitLap(Number(e.target.value))}
                className="w-full"
              />
              <div
                className="mt-2 flex justify-between font-display text-[10px] font-bold uppercase"
                style={{ color: "oklch(0.48 0.008 255)", letterSpacing: "0.08em" }}
              >
                <span>Lap 5 (Early)</span>
                <span className="text-emerald-400">Undercut Window (L16–L24)</span>
                <span className="text-amber-400">Overcut Window (L25–L32)</span>
                <span>Lap {maxLaps} (End)</span>
              </div>
            </div>
          </div>

          {/* Degradation chart */}
          <div
            className="mt-5"
            style={{
              background: "oklch(0.155 0.006 255)",
              border: "1px solid oklch(1 0 0 / 8%)",
              borderRadius: "0.5rem",
              padding: "1.25rem",
            }}
          >
            <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <EyebrowRed className="mb-2">Tire Degradation & Cliff Model</EyebrowRed>
                <h3 className="font-display font-black uppercase text-xl">
                  Compound Pace vs Tire Age
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Shows how lap times slow down as rubber wears. Dots mark the{" "}
                  <strong>tire cliff</strong> (sudden drop in pace).
                </p>
              </div>
              <div className="flex gap-4 text-xs">
                {(["SOFT", "MEDIUM", "HARD"] as const).map((c) => (
                  <div key={c} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-5 rounded-sm"
                      style={{ backgroundColor: COMPOUND_COLOR[c] }}
                    />
                    <span
                      className="font-display font-semibold uppercase"
                      style={{ letterSpacing: "0.05em", color: "oklch(0.65 0.010 255)" }}
                    >
                      {c} (Cliff: L{compoundCurves[c].cliff})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={360}>
              <LineChart>
                <CartesianGrid strokeDasharray="2 4" stroke="oklch(1 0 0 / 5%)" />
                <XAxis
                  type="number"
                  dataKey="age"
                  stroke="oklch(1 0 0 / 30%)"
                  fontSize={11}
                  label={{
                    value: "Tire Age (Number of Laps Run)",
                    position: "insideBottom",
                    offset: -5,
                    fill: "oklch(1 0 0 / 35%)",
                    fontSize: 11,
                  }}
                  domain={[0, 45]}
                />
                <YAxis
                  stroke="oklch(1 0 0 / 30%)"
                  fontSize={11}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `${v.toFixed(1)}s`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="rounded-lg border border-white/10 bg-[#141418]/95 p-3 shadow-xl backdrop-blur-md">
                        <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                          Tire Age: {label} Laps
                        </div>
                        <div className="space-y-1 text-xs">
                          {payload.map((entry: any) => (
                            <div
                              key={entry.name}
                              className="flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: entry.stroke }}
                                />
                                <span className="font-bold">{entry.name}</span>
                              </div>
                              <span className="font-num font-semibold text-primary">
                                {entry.value}s/lap
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
                {(["SOFT", "MEDIUM", "HARD"] as const).map((c) => (
                  <Line
                    key={c}
                    data={compoundCurves[c].data}
                    type="monotone"
                    dataKey="time"
                    stroke={COMPOUND_COLOR[c]}
                    strokeWidth={2.5}
                    dot={false}
                    name={c}
                    isAnimationActive
                  />
                ))}
                {(["SOFT", "MEDIUM", "HARD"] as const).map((c) => (
                  <ReferenceDot
                    key={`cliff-${c}`}
                    x={compoundCurves[c].cliff}
                    y={compoundCurves[c].data[compoundCurves[c].cliff].time}
                    r={6}
                    fill={COMPOUND_COLOR[c]}
                    stroke="oklch(0.12 0.004 255)"
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-3 text-xs" style={{ color: "oklch(0.52 0.010 255)" }}>
              Curves are anchored to the driver's real median lap time ({baseLap.toFixed(3)}s) from
              Jolpica for this race. Cliff points are model estimates.
            </p>
          </div>
        </>
      )}
    </main>
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
