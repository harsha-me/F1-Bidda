import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import type { Driver, LapRecord } from "@/lib/f1-data";
import { ChartTakeaway } from "./chart-takeaway";

export function formatLapTime(seconds: number): string {
  if (!seconds || seconds <= 0 || !Number.isFinite(seconds)) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  const padSecs = seconds % 60 < 10 ? `0${secs}` : secs;
  return mins > 0 ? `${mins}:${padSecs}` : `${secs}s`;
}

function formatLapTimeTick(seconds: number): string {
  if (!seconds || seconds <= 0 || !Number.isFinite(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const padSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return mins > 0 ? `${mins}:${padSecs}` : `${secs}s`;
}

interface LapTimesChartProps {
  laps: LapRecord[];
  activeDrivers: Driver[];
}

export function LapTimesChart({ laps, activeDrivers }: LapTimesChartProps) {
  // Pivot lap data by lap number
  const { pivotData, maxLapNumber } = useMemo(() => {
    const map = new Map<number, Record<string, number>>();
    let maxLap = 0;
    laps.forEach((l) => {
      if (l.lapTime > 0) {
        if (!map.has(l.lap)) map.set(l.lap, { lap: l.lap });
        map.get(l.lap)![l.driver] = l.lapTime;
        if (l.lap > maxLap) maxLap = l.lap;
      }
    });
    const sorted = Array.from(map.values()).sort((a, b) => a.lap - b.lap);
    return { pivotData: sorted, maxLapNumber: maxLap };
  }, [laps]);

  // Default driver isolation selection (Head-to-head top 2 vs top 4 vs all)
  const [presetMode, setPresetMode] = useState<"top2" | "top4" | "all" | "custom">("top2");
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(() => {
    return new Set(activeDrivers.slice(0, 2).map((d) => d.code));
  });

  // Handle preset mode selection
  const handlePreset = (mode: "top2" | "top4" | "all") => {
    setPresetMode(mode);
    if (mode === "top2") {
      setSelectedDrivers(new Set(activeDrivers.slice(0, 2).map((d) => d.code)));
    } else if (mode === "top4") {
      setSelectedDrivers(new Set(activeDrivers.slice(0, 4).map((d) => d.code)));
    } else {
      setSelectedDrivers(new Set(activeDrivers.map((d) => d.code)));
    }
  };

  const toggleDriver = (code: string) => {
    setPresetMode("custom");
    setSelectedDrivers((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size > 1) next.delete(code); // keep at least 1 driver
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Find fastest lap in dataset
  const fastestLap = useMemo(() => {
    let best: { driver: string; lap: number; lapTime: number } | null = null;
    for (const l of laps) {
      if (l.lapTime > 0 && (!best || l.lapTime < best.lapTime)) {
        best = { driver: l.driver, lap: l.lap, lapTime: l.lapTime };
      }
    }
    return best;
  }, [laps]);

  // Compute headline takeaway
  const takeawayHeadline = useMemo(() => {
    if (!laps.length || !activeDrivers.length) return null;

    const flDriver = activeDrivers.find((d) => d.code === fastestLap?.driver);
    const flName = flDriver ? flDriver.name.split(" ").pop() : fastestLap?.driver;

    // Calculate average pace for top 2 active drivers
    const d1Code = activeDrivers[0]?.code;
    const d2Code = activeDrivers[1]?.code;

    const d1Laps = laps.filter((l) => l.driver === d1Code && l.lapTime > 0 && !l.pit);
    const d2Laps = laps.filter((l) => l.driver === d2Code && l.lapTime > 0 && !l.pit);

    const avg1 = d1Laps.length ? d1Laps.reduce((sum, l) => sum + l.lapTime, 0) / d1Laps.length : 0;
    const avg2 = d2Laps.length ? d2Laps.reduce((sum, l) => sum + l.lapTime, 0) / d2Laps.length : 0;

    let paceDiffText = "";
    if (avg1 > 0 && avg2 > 0) {
      const diff = Math.abs(avg1 - avg2).toFixed(3);
      const fasterDriver = avg1 < avg2 ? activeDrivers[0].code : activeDrivers[1].code;
      paceDiffText = ` · ${fasterDriver} averaged ${diff}s/lap faster in clean air.`;
    }

    if (fastestLap) {
      return (
        <span>
          <strong>⚡ Fastest Lap:</strong> {flName} ({fastestLap.driver}) set the quickest time of{" "}
          <span className="font-num font-bold text-primary">
            {formatLapTime(fastestLap.lapTime)}
          </span>{" "}
          on Lap {fastestLap.lap}
          {paceDiffText}
        </span>
      );
    }

    return <span>Showing lap time pace comparison across stints.</span>;
  }, [laps, activeDrivers, fastestLap]);

  // Calculate Y-axis domain dynamically based on visible data
  const yDomain = useMemo(() => {
    let minTime = Infinity;
    let maxTime = -Infinity;
    pivotData.forEach((row) => {
      selectedDrivers.forEach((code) => {
        const t = row[code];
        if (t && t > 0) {
          // exclude pit stop lap outliers (> 150s) from squishing the chart scale
          if (t < minTime) minTime = t;
          if (t < 150 && t > maxTime) maxTime = t;
        }
      });
    });
    if (!Number.isFinite(minTime) || !Number.isFinite(maxTime)) return ["auto", "auto"];
    return [Math.floor(minTime - 1), Math.ceil(maxTime + 1)];
  }, [pivotData, selectedDrivers]);

  return (
    <div className="space-y-4">
      {/* 1. Plain-English Takeaway Banner */}
      <ChartTakeaway headline={takeawayHeadline} />

      {/* 2. Controls & Driver Isolator */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Preset mode toggles */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => handlePreset("top2")}
            className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
              presetMode === "top2"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">Top 2</span>
            <span className="hidden sm:inline">Top 2 Battle</span>
          </button>
          <button
            onClick={() => handlePreset("top4")}
            className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
              presetMode === "top4"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">Top 4</span>
            <span className="hidden sm:inline">Top 4 Battle</span>
          </button>
          <button
            onClick={() => handlePreset("all")}
            className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
              presetMode === "all"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">All ({activeDrivers.length})</span>
            <span className="hidden sm:inline">All Drivers ({activeDrivers.length})</span>
          </button>
        </div>

        {/* Driver pill toggles */}
        <div className="flex flex-wrap gap-1.5">
          {activeDrivers.map((d) => {
            const isSelected = selectedDrivers.has(d.code);
            return (
              <button
                key={d.code}
                onClick={() => toggleDriver(d.code)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition ${
                  isSelected
                    ? "border-white/20 bg-white/10 text-foreground"
                    : "border-white/5 text-muted-foreground opacity-40 hover:opacity-75"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.teamColor }} />
                {d.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Recharts Line Chart */}
      <div className="relative pt-2">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={pivotData} margin={{ top: 20, right: 65, left: 10, bottom: 25 }}>
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
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
              domain={yDomain}
              tickFormatter={formatLapTimeTick}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomLapTooltip activeDrivers={activeDrivers} />} />

            {/* Render lines with end-of-line driver labels */}
            {activeDrivers
              .filter((d) => selectedDrivers.has(d.code))
              .map((d) => (
                <Line
                  key={d.code}
                  type="monotone"
                  dataKey={d.code}
                  stroke={d.teamColor}
                  strokeWidth={selectedDrivers.size <= 2 ? 3 : 2}
                  dot={false}
                  activeDot={{ r: 5, stroke: d.teamColor, strokeWidth: 2, fill: "#141418" }}
                  isAnimationActive
                  animationDuration={600}
                  label={
                    <CustomEndLabel
                      driverCode={d.code}
                      color={d.teamColor}
                      totalDataLength={pivotData.length}
                    />
                  }
                />
              ))}

            {/* Fastest Lap Marker */}
            {fastestLap && selectedDrivers.has(fastestLap.driver) && (
              <ReferenceDot
                x={fastestLap.lap}
                y={fastestLap.lapTime}
                r={7}
                fill="#A855F7"
                stroke="#FFFFFF"
                strokeWidth={2}
                label={{
                  value: `⚡ FL ${fastestLap.driver}`,
                  position: "top",
                  fill: "#A855F7",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Custom End-of-Line Driver Label
function CustomEndLabel(props: any) {
  const { x, y, index, value, driverCode, color, totalDataLength } = props;
  if (index !== totalDataLength - 1 || x == null || y == null || value == null) {
    return null;
  }

  return (
    <g transform={`translate(${x + 6}, ${y + 4})`}>
      <rect
        x={0}
        y={-11}
        width={driverCode.length * 8 + 8}
        height={16}
        rx={4}
        fill="#141418"
        stroke={color}
        strokeWidth={1}
      />
      <text x={4} y={1} fill={color} fontSize={10} fontWeight="bold" fontFamily="sans-serif">
        {driverCode}
      </text>
    </g>
  );
}

// Plain 2-3 Line Tooltip
function CustomLapTooltip({ active, payload, label, activeDrivers }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#141418]/95 p-3 shadow-xl backdrop-blur-md">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 border-b border-white/5 pb-1">
        Lap {label} Pace
      </div>
      <div className="space-y-1">
        {payload.map((entry: any) => {
          const driver = activeDrivers.find((d: Driver) => d.code === entry.dataKey);
          const timeFormatted = formatLapTime(entry.value);
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="font-bold">{driver?.name ?? entry.dataKey}</span>
              </div>
              <span className="font-num font-semibold text-primary">{timeFormatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
