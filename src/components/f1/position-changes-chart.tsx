import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Driver, LapRecord, ResultRow } from "@/lib/f1-data";
import { DriverChip } from "./primitives";
import { ChartTakeaway } from "./chart-takeaway";

interface PositionChangesChartProps {
  laps: LapRecord[];
  activeDrivers: Driver[];
  results?: ResultRow[];
}

export function PositionChangesChart({ laps, activeDrivers, results }: PositionChangesChartProps) {
  const [viewMode, setViewMode] = useState<"rows" | "chart">("rows");

  // Pivot lap data by lap number for position
  const { pivotData, driverStats, maxLaps } = useMemo(() => {
    const map = new Map<number, Record<string, number>>();
    const driverLapsMap = new Map<string, { lap: number; pos: number }[]>();
    let maxLap = 0;

    laps.forEach((l) => {
      if (l.position > 0) {
        if (!map.has(l.lap)) map.set(l.lap, { lap: l.lap });
        map.get(l.lap)![l.driver] = l.position;

        if (!driverLapsMap.has(l.driver)) driverLapsMap.set(l.driver, []);
        driverLapsMap.get(l.driver)!.push({ lap: l.lap, pos: l.position });

        if (l.lap > maxLap) maxLap = l.lap;
      }
    });

    const sortedPivot = Array.from(map.values()).sort((a, b) => a.lap - b.lap);

    // Compute stats per driver (start position, end position, net gain/loss)
    const stats = activeDrivers.map((d) => {
      const driverLaps = driverLapsMap.get(d.code) ?? [];
      const gridResult = results?.find((r) => r.driver.code === d.code);
      const startPos = gridResult?.grid || (driverLaps[0]?.pos ?? 0);
      const finishPos = gridResult?.position || (driverLaps[driverLaps.length - 1]?.pos ?? 0);
      const delta = startPos > 0 && finishPos > 0 ? startPos - finishPos : 0; // positive = gained places

      return {
        driver: d,
        startPos,
        finishPos,
        delta,
        laps: driverLaps,
      };
    });

    return { pivotData: sortedPivot, driverStats: stats, maxLaps: maxLap };
  }, [laps, activeDrivers, results]);

  // Dynamic plain-English headline
  const takeawayHeadline = useMemo(() => {
    if (!driverStats.length) return null;

    // Find driver with biggest gain
    const biggestGainer = [...driverStats].sort((a, b) => b.delta - a.delta)[0];
    const wireToWireLeader = driverStats.find(
      (s) => s.startPos === 1 && s.finishPos === 1 && s.delta === 0,
    );

    if (biggestGainer && biggestGainer.delta > 0) {
      const dName = biggestGainer.driver.name.split(" ").pop();
      return (
        <span>
          <strong>📈 Big Mover:</strong> {dName} ({biggestGainer.driver.code}) made the biggest
          charge through the field, gaining{" "}
          <span className="font-bold text-emerald-400">+{biggestGainer.delta} places</span> (P
          {biggestGainer.startPos} → P{biggestGainer.finishPos}).
        </span>
      );
    }

    if (wireToWireLeader) {
      return (
        <span>
          <strong>🏆 Dominant Drive:</strong> {wireToWireLeader.driver.name} led from pole position
          to victory without giving up P1.
        </span>
      );
    }

    return <span>Race position tracking across all completed laps.</span>;
  }, [driverStats]);

  return (
    <div className="space-y-4">
      {/* Plain-English Takeaway */}
      <ChartTakeaway headline={takeawayHeadline} />

      {/* View Switcher Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setViewMode("rows")}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              viewMode === "rows"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">Row View</span>
            <span className="hidden sm:inline">Driver Step Tracks (Row View)</span>
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              viewMode === "chart"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">Track View</span>
            <span className="hidden sm:inline">Combined Racetrack View</span>
          </button>
        </div>

        <div className="text-xs text-muted-foreground font-medium hidden sm:block">
          <span className="text-emerald-400">🏆 P1 = Race Leader (Top)</span> · P20 = Back of field
        </div>
      </div>

      {/* View 1: Driver Step Tracks (Row View) */}
      {viewMode === "rows" ? (
        <div className="space-y-3 pt-2">
          {driverStats.map(({ driver, startPos, finishPos, delta, laps: dLaps }) => {
            return (
              <div
                key={driver.code}
                className="group relative flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/15 hover:bg-white/[0.04]"
              >
                {/* Driver Info + Position badges */}
                <div className="flex items-center justify-between sm:w-64 shrink-0">
                  <DriverChip driver={driver} />
                  <div className="flex items-center gap-2 text-xs font-num">
                    <span className="text-muted-foreground">Grid P{startPos}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-bold text-foreground">P{finishPos}</span>
                    {delta !== 0 && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
                          delta > 0
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    )}
                  </div>
                </div>

                {/* SVG Mini Step Track for Driver */}
                <div className="relative h-10 flex-1 overflow-hidden rounded border border-white/5 bg-black/20 px-2 py-1">
                  <MiniDriverStepSvg dLaps={dLaps} maxLaps={maxLaps} color={driver.teamColor} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View 2: Combined Racetrack Chart */
        <div className="relative pt-2">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold text-emerald-400">🏆 P1 (LEADER)</span>
            <span>RACE LAP PROGRESSION</span>
            <span>P20 (FIELD)</span>
          </div>
          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={pivotData} margin={{ top: 15, right: 65, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="lap"
                stroke="rgba(255,255,255,0.4)"
                fontSize={11}
                tickLine={false}
                label={{
                  value: "Lap Number",
                  position: "insideBottom",
                  offset: -12,
                  fill: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                }}
              />
              <YAxis
                reversed
                domain={[1, 20]}
                stroke="rgba(255,255,255,0.4)"
                fontSize={11}
                tickFormatter={(v) => `P${v}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomPositionTooltip activeDrivers={activeDrivers} />} />
              {activeDrivers.map((d) => (
                <Line
                  key={d.code}
                  type="stepAfter"
                  dataKey={d.code}
                  stroke={d.teamColor}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, stroke: d.teamColor, strokeWidth: 2, fill: "#141418" }}
                  isAnimationActive
                  animationDuration={600}
                  label={
                    <PositionEndLabel
                      driverCode={d.code}
                      color={d.teamColor}
                      totalDataLength={pivotData.length}
                    />
                  }
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// Mini SVG step chart renderer inside each driver row
function MiniDriverStepSvg({
  dLaps,
  maxLaps,
  color,
}: {
  dLaps: { lap: number; pos: number }[];
  maxLaps: number;
  color: string;
}) {
  if (!dLaps.length || maxLaps <= 0) return null;

  // Build SVG path points string
  // Y range: position 1 -> y=4, position 20 -> y=32 (height=36)
  const width = 600;
  const height = 36;
  const getY = (pos: number) =>
    Math.min(Math.max(((pos - 1) / 19) * (height - 8) + 4, 4), height - 4);
  const getX = (lap: number) => (lap / maxLaps) * width;

  let pathD = "";
  dLaps.forEach((pt, i) => {
    const x = getX(pt.lap);
    const y = getY(pt.pos);
    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      const prevY = getY(dLaps[i - 1].pos);
      pathD += ` L ${x} ${prevY} L ${x} ${y}`;
    }
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full preserve-3d">
      {/* Background grid lines for P1 and P10 */}
      <line
        x1="0"
        y1="4"
        x2={width}
        y2="4"
        stroke="rgba(16, 185, 129, 0.2)"
        strokeDasharray="3 3"
      />
      <line
        x1="0"
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="rgba(255,255,255,0.08)"
        strokeDasharray="3 3"
      />

      {/* Step path */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

      {/* End point dot */}
      {dLaps.length > 0 && (
        <circle
          cx={getX(dLaps[dLaps.length - 1].lap)}
          cy={getY(dLaps[dLaps.length - 1].pos)}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
}

// End-of-Line label for combined racetrack chart
function PositionEndLabel(props: any) {
  const { x, y, index, value, driverCode, color, totalDataLength } = props;
  if (index !== totalDataLength - 1 || x == null || y == null || value == null) {
    return null;
  }

  return (
    <g transform={`translate(${x + 6}, ${y + 4})`}>
      <rect
        x={0}
        y={-11}
        width={driverCode.length * 8 + 26}
        height={16}
        rx={4}
        fill="#141418"
        stroke={color}
        strokeWidth={1}
      />
      <text x={4} y={1} fill={color} fontSize={10} fontWeight="bold" fontFamily="sans-serif">
        {driverCode} P{value}
      </text>
    </g>
  );
}

// Plain 2-3 Line Tooltip for position chart
function CustomPositionTooltip({ active, payload, label, activeDrivers }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#141418]/95 p-3 shadow-xl backdrop-blur-md">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 border-b border-white/5 pb-1">
        Lap {label} Positions
      </div>
      <div className="space-y-1">
        {payload.map((entry: any) => {
          const driver = activeDrivers.find((d: Driver) => d.code === entry.dataKey);
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="font-bold">{driver?.name ?? entry.dataKey}</span>
              </div>
              <span className="font-num font-bold text-emerald-400">P{entry.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
