import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpDown } from "lucide-react";
import {
  DriverChip,
  Eyebrow,
  DeltaChip,
  GlassCard,
  SectionHeader,
} from "@/components/f1/primitives";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import {
  constructorStandingsQuery,
  driverStandingsQuery,
  seasonRacesQuery,
} from "@/lib/f1-queries";
import { SEASONS } from "@/lib/f1-data";
import { getCircuitImageUrl } from "@/lib/f1-assets";

export const Route = createFileRoute("/season")({
  head: () => ({
    meta: [
      { title: "Season Overview · f1Bidda" },
      {
        name: "description",
        content:
          "Every race, driver and constructor standing for the selected F1 season, sourced live from Jolpica.",
      },
      { property: "og:title", content: "Season Overview · f1Bidda" },
      {
        property: "og:description",
        content: "Schedule, driver standings and constructor standings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SeasonPage,
});

type SortKey = "position" | "points" | "wins";

function SeasonPage() {
  const [season, setSeason] = useState<number>(SEASONS[0]);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "position",
    dir: 1,
  });

  const racesQ = useQuery(seasonRacesQuery(season));
  const driversQ = useQuery(driverStandingsQuery(season));
  const consQ = useQuery(constructorStandingsQuery(season));

  const races = racesQ.data ?? [];
  const rawStandings = driversQ.data ?? [];
  const constructors = consQ.data ?? [];

  const standings = useMemo(() => {
    return [...rawStandings].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir;
    });
  }, [rawStandings, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      {/* SEASON SELECTOR & HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader eyebrow="Overview" title={`${season} Season`} />

        <div className="flex items-center gap-2">
          <label htmlFor="season-select" className="text-xs font-display uppercase tracking-widest text-muted-foreground">
            Season
          </label>
          <select
            id="season-select"
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-num text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {SEASONS.map((s) => (
              <option key={s} value={s} className="bg-background">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RACES CAROUSEL / GRID */}
      <div className="mt-8">
        <Eyebrow>Race Schedule ({races.length} Rounds)</Eyebrow>
      </div>

      {racesQ.isLoading ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : racesQ.isError ? (
        <div className="mt-4">
          <ErrorNote
            message="Couldn't load schedule."
            onRetry={() => racesQ.refetch()}
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {races.map((r) => {
            const circuitImg = getCircuitImageUrl(r.circuitId);

            return (
              <Link key={r.id} to="/race/$raceId" params={{ raceId: r.id }} className="group">
                <GlassCard hover className="relative flex h-full flex-col justify-between overflow-hidden p-4">
                  {circuitImg && (
                    <img
                      src={circuitImg}
                      alt={`${r.circuit} map`}
                      className="pointer-events-none absolute -right-3 -bottom-3 h-24 w-24 object-contain opacity-20 filter invert brightness-200 transition-opacity group-hover:opacity-40"
                    />
                  )}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="text-2xl">{r.flag}</div>
                      <div className="mt-1 font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        R{String(r.round).padStart(2, "0")}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                        r.completed
                          ? "bg-white/5 text-muted-foreground"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      {r.completed ? "Done" : "Upcoming"}
                    </span>
                  </div>
                  <div className="my-2">
                    <div className="font-display text-lg font-bold uppercase leading-tight">
                      {r.name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{r.circuit}</div>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="text-xs text-muted-foreground font-num">
                      {new Date(r.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      )}

      {/* STANDINGS */}
      <div className="mt-16 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard className="p-0">
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <div>
              <Eyebrow>Drivers</Eyebrow>
              <h3 className="mt-1 font-display text-2xl font-bold uppercase">Driver Standings</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            {driversQ.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : driversQ.isError ? (
              <div className="p-4">
                <ErrorNote
                  message="Driver standings unavailable."
                  onRetry={() => driversQ.refetch()}
                />
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <SortHead onClick={() => toggleSort("position")}>Pos</SortHead>
                    <th className="px-4 py-3 font-semibold">Driver</th>
                    <SortHead onClick={() => toggleSort("points")} align="right">
                      Pts
                    </SortHead>
                    <SortHead onClick={() => toggleSort("wins")} align="right">
                      Wins
                    </SortHead>
                    <th className="px-4 py-3 text-right font-semibold">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr
                      key={row.driver.code}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 font-display text-lg font-bold">{row.position}</td>
                      <td className="px-4 py-3">
                        <DriverChip driver={row.driver} />
                      </td>
                      <td className="px-4 py-3 text-right font-num text-base">{row.points}</td>
                      <td className="px-4 py-3 text-right font-num text-muted-foreground">
                        {row.wins}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DeltaChip delta={row.delta} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-0">
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <div>
              <Eyebrow>Constructors</Eyebrow>
              <h3 className="mt-1 font-display text-2xl font-bold uppercase">Teams</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            {consQ.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : consQ.isError ? (
              <div className="p-4">
                <ErrorNote
                  message="Constructor standings unavailable."
                  onRetry={() => consQ.refetch()}
                />
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Pos</th>
                    <th className="px-4 py-3 font-semibold">Team</th>
                    <th className="px-4 py-3 text-right font-semibold">Pts</th>
                    <th className="px-4 py-3 text-right font-semibold">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {constructors.map((c) => (
                    <tr
                      key={c.team}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 font-display text-lg font-bold">{c.position}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-6 w-1.5 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="font-medium">{c.team}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-num">{c.points}</td>
                      <td className="px-4 py-3 text-right">
                        <DeltaChip delta={c.delta} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          to="/compare"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-3 font-display text-sm font-semibold uppercase tracking-widest hover:bg-white/10"
        >
          Compare Drivers <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}

function SortHead({
  children,
  onClick,
  align = "left",
}: {
  children: React.ReactNode;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th className={`px-4 py-3 ${align === "right" ? "text-right" : ""}`}>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 font-semibold uppercase tracking-widest hover:text-foreground"
      >
        {children} <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}
