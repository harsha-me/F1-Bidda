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
  Eyebrow,
  GlassCard,
  SectionHeader,
  StatCard,
} from "@/components/f1/primitives";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import { COMPOUND_COLOR, CURRENT_SEASON, driverByCodeFrom, type Driver } from "@/lib/f1-data";
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

  // Derive base lap time (median for chosen driver) to anchor degradation curves in reality
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

  // Actual pit lap: first pitstop for the chosen driver in this race
  const actualPit = useMemo(() => {
    const stops = (pitQ.data ?? []).filter((s) => s.driverCode === driverCode);
    return stops.length ? stops[0].lap : null;
  }, [pitQ.data, driverCode]);

  const [pitLap, setPitLap] = useState<number>(20);
  useEffect(() => {
    if (actualPit !== null) {
      setPitLap(actualPit);
    } else {
      setPitLap(20);
    }
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
      <SectionHeader
        eyebrow="Simulator"
        title="Strategy What-If"
        right={
          <div className="flex flex-wrap gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="label-eyebrow">Race</div>
              <select
                value={raceId}
                onChange={(e) => setRaceId(e.target.value)}
                className="bg-transparent font-display font-bold uppercase outline-none"
              >
                {completedRaces.map((r) => (
                  <option key={r.id} value={r.id} className="bg-background">
                    {r.flag} {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="label-eyebrow">Driver</div>
              <select
                value={driverCode}
                onChange={(e) => setDriverCode(e.target.value)}
                className="bg-transparent font-display font-bold uppercase outline-none"
              >
                {drivers.map((dr) => (
                  <option key={dr.code} value={dr.code} className="bg-background">
                    {dr.code} · {dr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      />

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <GlassCard className="mt-6 p-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <Eyebrow>Simulated pit lap</Eyebrow>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="stat-value">L{pitLap}</span>
                  <span className="text-sm text-muted-foreground">
                    {actualPit ? `(actual: L${actualPit})` : "(no pit data)"}
                  </span>
                </div>
              </div>
              {d && <DriverChip driver={d} />}
            </div>
            <input
              type="range"
              min={5}
              max={maxLaps}
              value={pitLap}
              onChange={(e) => setPitLap(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span>Lap 5</span>
              <span>Undercut Window</span>
              <span>Overcut Window</span>
              <span>Lap {maxLaps}</span>
            </div>
          </GlassCard>

          <GlassCard className="mt-6">
            <SectionHeader
              title="Tire Degradation Curve"
              right={
                <div className="flex gap-3 text-xs">
                  {(["SOFT", "MEDIUM", "HARD"] as const).map((c) => (
                    <div key={c} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-4 rounded"
                        style={{ backgroundColor: COMPOUND_COLOR[c] }}
                      />
                      {c}
                    </div>
                  ))}
                </div>
              }
            />
            <ResponsiveContainer width="100%" height={380}>
              <LineChart>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  type="number"
                  dataKey="age"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  label={{
                    value: "Tire Age (laps)",
                    position: "insideBottom",
                    offset: -5,
                    fill: "rgba(255,255,255,0.4)",
                    fontSize: 11,
                  }}
                  domain={[0, 45]}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => v.toFixed(1)}
                />
                <Tooltip contentStyle={darkTooltip} formatter={(v: number) => `${v.toFixed(3)}s`} />
                {(["SOFT", "MEDIUM", "HARD"] as const).map((c) => (
                  <Line
                    key={c}
                    data={compoundCurves[c].data}
                    type="monotone"
                    dataKey="time"
                    stroke={COMPOUND_COLOR[c]}
                    strokeWidth={2}
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
                    stroke="#0A0A0B"
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-4 text-xs text-muted-foreground">
              Curves are anchored to the driver's real median lap time ({baseLap.toFixed(3)}s) from
              Jolpica for this race. Cliff points are model estimates.
            </p>
          </GlassCard>
        </>
      )}
    </main>
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
