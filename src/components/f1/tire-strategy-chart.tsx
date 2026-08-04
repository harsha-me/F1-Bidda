import { useMemo, useState } from "react";
import {
  COMPOUND_COLOR,
  type Compound,
  type Driver,
  type LapRecord,
  type PitStop,
  type Stint,
} from "@/lib/f1-data";
import { CompoundBadge, DriverChip } from "./primitives";
import { ChartTakeaway } from "./chart-takeaway";
import { formatLapTime } from "./lap-times-chart";

interface TireStrategyChartProps {
  stints: Stint[];
  activeDrivers: Driver[];
  laps?: LapRecord[];
  pitStops?: PitStop[];
  totalRaceLaps?: number;
}

export function TireStrategyChart({
  stints,
  activeDrivers,
  laps = [],
  pitStops = [],
  totalRaceLaps = 50,
}: TireStrategyChartProps) {
  const [hoveredStint, setHoveredStint] = useState<{
    driverCode: string;
    stintIndex: number;
  } | null>(null);

  // Compute total race laps from stints or race prop
  const calculatedTotalLaps = useMemo(() => {
    if (totalRaceLaps && totalRaceLaps > 0) return totalRaceLaps;
    const maxEndLap = Math.max(0, ...stints.map((s) => s.endLap));
    return maxEndLap > 0 ? maxEndLap : 50;
  }, [stints, totalRaceLaps]);

  // Dynamic plain-English headline
  const takeawayHeadline = useMemo(() => {
    if (!stints.length || !activeDrivers.length) return null;

    // Analyze driver stint counts
    const driverStintCounts = new Map<string, number>();
    stints.forEach((s) => {
      driverStintCounts.set(s.driver, (driverStintCounts.get(s.driver) || 0) + 1);
    });

    const counts = Array.from(driverStintCounts.values());
    const avgStops = counts.length
      ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) - 1
      : 1;

    // Find main starting compound
    const startCompounds = stints.filter((s) => s.startLap === 1);
    const softCount = startCompounds.filter((s) => s.compound === "SOFT").length;
    const medCount = startCompounds.filter((s) => s.compound === "MEDIUM").length;
    const hardCount = startCompounds.filter((s) => s.compound === "HARD").length;

    let popularStart = "MEDIUM";
    if (softCount > medCount && softCount > hardCount) popularStart = "SOFT";
    else if (hardCount > medCount && hardCount > softCount) popularStart = "HARD";

    // Winner's strategy
    const winnerCode = activeDrivers[0]?.code;
    const winnerStints = stints.filter((s) => s.driver === winnerCode);
    const winnerProgression = winnerStints.map((s) => s.compound).join(" → ");

    if (winnerCode && winnerStints.length > 0) {
      return (
        <span>
          <strong>🏎️ Race Strategy:</strong> {activeDrivers[0].name.split(" ").pop()} ({winnerCode}) ran a{" "}
          <span className="font-bold text-primary">
            {winnerStints.length - 1}-stop strategy ({winnerProgression})
          </span>
          . Most drivers started on <span className="font-semibold">{popularStart}</span> tires.
        </span>
      );
    }

    return (
      <span>
        Most drivers favored a {avgStops}-stop strategy starting on {popularStart} tires.
      </span>
    );
  }, [stints, activeDrivers]);

  return (
    <div className="space-y-4">
      {/* 1. Plain-English Takeaway Banner */}
      <ChartTakeaway headline={takeawayHeadline} />

      {/* 2. Stint Bar Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/5 pb-3">
        <div className="flex flex-wrap gap-4">
          {(["SOFT", "MEDIUM", "HARD", "INTER", "WET"] as const).map((c) => (
            <div key={c} className="flex items-center gap-1.5 font-semibold">
              <span
                className="h-3 w-3 rounded-full border border-black/40"
                style={{ backgroundColor: COMPOUND_COLOR[c] }}
              />
              <span className="text-muted-foreground uppercase tracking-wide text-[11px]">
                {c}
              </span>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground text-[11px]">
          ⛽ Pit stops marked on stint dividers · Hover stint bar for average pace
        </div>
      </div>

      {/* 3. Driver Horizontal Stacked Stint Bars */}
      <div className="space-y-3.5 pt-1">
        {activeDrivers.map((driver) => {
          const driverStints = stints.filter((s) => s.driver === driver.code);
          const driverPitStops = pitStops.filter((p) => p.driverCode === driver.code);

          if (!driverStints.length) {
            return (
              <div key={driver.code} className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="w-48 shrink-0">
                  <DriverChip driver={driver} />
                </div>
                <div>No stint data available</div>
              </div>
            );
          }

          return (
            <div key={driver.code} className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Driver Chip */}
              <div className="w-48 shrink-0">
                <DriverChip driver={driver} />
              </div>

              {/* Stacked Stint Bar */}
              <div className="relative flex h-10 flex-1 overflow-hidden rounded-lg bg-white/5 border border-white/10 shadow-inner">
                {driverStints.map((stint, idx) => {
                  const stintLaps = Math.max(1, stint.endLap - stint.startLap + 1);
                  const widthPercent = (stintLaps / calculatedTotalLaps) * 100;

                  // Compute average pace for this stint from laps
                  const stintLapRecords = laps.filter(
                    (l) =>
                      l.driver === driver.code &&
                      l.lap >= stint.startLap &&
                      l.lap <= stint.endLap &&
                      l.lapTime > 0 &&
                      !l.pit,
                  );

                  const avgPaceSecs = stintLapRecords.length
                    ? stintLapRecords.reduce((sum, l) => sum + l.lapTime, 0) / stintLapRecords.length
                    : 0;

                  // Pit stop info at end of stint
                  const endPit = driverPitStops.find((p) => p.lap === stint.endLap);
                  const isHovered =
                    hoveredStint?.driverCode === driver.code &&
                    hoveredStint?.stintIndex === idx;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() =>
                        setHoveredStint({ driverCode: driver.code, stintIndex: idx })
                      }
                      onMouseLeave={() => setHoveredStint(null)}
                      className="group relative flex items-center justify-between border-r border-black/40 px-2 transition-all hover:brightness-110 cursor-pointer"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: COMPOUND_COLOR[stint.compound],
                        color: stint.compound === "HARD" ? "#000" : "#fff",
                      }}
                    >
                      {/* Stint Badge & Laps */}
                      <div className="flex items-center gap-1.5 truncate">
                        <CompoundBadge compound={stint.compound} />
                        <span className="text-[11px] font-extrabold font-num">
                          {stintLaps} laps
                        </span>
                      </div>

                      {/* Pit stop marker pin at end of stint */}
                      {idx < driverStints.length - 1 && (
                        <div
                          className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-black/60 px-1 text-[10px] font-bold text-amber-400 border-l border-amber-400/50"
                          title={`Pit Stop on Lap ${stint.endLap}${endPit ? ` (${endPit.duration}s)` : ""}`}
                        >
                          ⛽ L{stint.endLap}
                        </div>
                      )}

                      {/* Plain-English Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 z-50 min-w-[200px] rounded-lg border border-white/20 bg-[#141418]/95 p-3 text-white shadow-2xl backdrop-blur-md">
                          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>
                              Stint {idx + 1}: {stint.compound} Tires
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              L{stint.startLap}–L{stint.endLap}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-foreground">
                            <div>
                              <span className="text-muted-foreground">Stint Length:</span>{" "}
                              <span className="font-bold">{stintLaps} Laps</span>
                            </div>
                            {avgPaceSecs > 0 && (
                              <div>
                                <span className="text-muted-foreground">Avg Pace:</span>{" "}
                                <span className="font-bold font-num text-emerald-400">
                                  {formatLapTime(avgPaceSecs)} / lap
                                </span>
                              </div>
                            )}
                            {endPit && (
                              <div className="text-amber-400 font-semibold">
                                ⛽ Pit Stop on Lap {endPit.lap} ({endPit.duration}s)
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
