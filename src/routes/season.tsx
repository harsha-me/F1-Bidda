import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpDown } from "lucide-react";
import {
  DriverChip,
  EyebrowRed,
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader eyebrow="Overview" title={`${season} Season`} />

        <div
          className="mb-7 flex items-center gap-3 px-3 py-2"
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 8%)",
            borderRadius: "0.375rem",
          }}
        >
          <span className="label-eyebrow">Season</span>
          <select
            id="season-select"
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="bg-transparent font-display font-bold uppercase outline-none text-sm"
            style={{ letterSpacing: "0.06em" }}
          >
            {SEASONS.map((s) => (
              <option key={s} value={s} className="bg-background">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Race schedule */}
      <div className="mb-3">
        <EyebrowRed>Race Schedule ({races.length} Rounds)</EyebrowRed>
      </div>

      {racesQ.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : racesQ.isError ? (
        <ErrorNote message="Couldn't load schedule." onRetry={() => racesQ.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {races.map((r) => {
            const circuitImg = getCircuitImageUrl(r.circuitId);
            return (
              <Link key={r.id} to="/race/$raceId" params={{ raceId: r.id }} className="group">
                <div
                  className="relative flex h-full flex-col justify-between overflow-hidden transition-all duration-150 hover:-translate-y-0.5"
                  style={{
                    background: "oklch(0.155 0.006 255)",
                    border: "1px solid oklch(1 0 0 / 7%)",
                    borderRadius: "0.5rem",
                    padding: "0.875rem 1rem",
                    borderTop: r.completed
                      ? "2px solid oklch(1 0 0 / 10%)"
                      : "2px solid oklch(0.60 0.245 27)",
                  }}
                >
                  {circuitImg && (
                    <img
                      src={circuitImg}
                      alt=""
                      aria-hidden
                      className="pointer-events-none absolute -right-2 bottom-0 h-20 w-20 object-contain transition-opacity group-hover:opacity-40"
                      style={{ filter: "invert(1) brightness(3)", opacity: 0.15 }}
                    />
                  )}

                  <div className="relative flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xl leading-none">{r.flag}</div>
                      <div
                        className="mt-1.5 font-num text-xs font-bold"
                        style={{ color: "oklch(0.50 0.010 255)" }}
                      >
                        R{String(r.round).padStart(2, "0")}
                      </div>
                    </div>
                    <span
                      className="shrink-0 px-2 py-0.5 font-display text-[10px] font-bold uppercase"
                      style={{
                        background: r.completed
                          ? "oklch(1 0 0 / 4%)"
                          : "oklch(0.60 0.245 27 / 0.12)",
                        color: r.completed ? "oklch(0.50 0.010 255)" : "oklch(0.60 0.245 27)",
                        borderRadius: "0.2rem",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {r.completed ? "FIN" : "NEXT"}
                    </span>
                  </div>

                  <div className="relative mt-2">
                    <div
                      className="font-display font-bold uppercase leading-tight"
                      style={{ fontSize: "0.95rem" }}
                    >
                      {r.name}
                    </div>
                    <div className="mt-0.5 text-xs" style={{ color: "oklch(0.50 0.010 255)" }}>
                      {r.circuit}
                    </div>
                    <div
                      className="mt-2 font-num text-xs"
                      style={{ color: "oklch(0.48 0.008 255)" }}
                    >
                      {new Date(r.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Standings tables */}
      <div className="mt-14 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Driver standings */}
        <div
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderRadius: "0.75rem",
            overflow: "hidden",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid oklch(1 0 0 / 7%)" }}
          >
            <div>
              <EyebrowRed>Drivers</EyebrowRed>
              <h3 className="mt-1.5 font-display font-black uppercase text-xl">Driver Standings</h3>
            </div>
          </div>

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
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-[10px] uppercase"
                    style={{
                      borderBottom: "1px solid oklch(1 0 0 / 6%)",
                      color: "oklch(0.50 0.010 255)",
                      letterSpacing: "0.08em",
                    }}
                  >
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
                  {standings.map((row, idx) => (
                    <tr
                      key={row.driver.code}
                      className="last:border-0"
                      style={{
                        borderBottom: "1px solid oklch(1 0 0 / 5%)",
                        background: idx % 2 === 0 ? "transparent" : "oklch(1 0 0 / 1.5%)",
                      }}
                    >
                      <td
                        className="px-4 py-2.5 font-display font-bold text-base"
                        style={{ color: "oklch(0.55 0.012 255)" }}
                      >
                        {row.position}
                      </td>
                      <td className="px-4 py-2.5">
                        <DriverChip driver={row.driver} />
                      </td>
                      <td className="px-4 py-2.5 text-right font-num font-semibold">
                        {row.points}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right font-num"
                        style={{ color: "oklch(0.55 0.012 255)" }}
                      >
                        {row.wins}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <DeltaChip delta={row.delta} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Constructor standings */}
        <div
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderRadius: "0.75rem",
            overflow: "hidden",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid oklch(1 0 0 / 7%)" }}
          >
            <div>
              <EyebrowRed>Constructors</EyebrowRed>
              <h3 className="mt-1.5 font-display font-black uppercase text-xl">Teams</h3>
            </div>
          </div>

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
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-[10px] uppercase"
                    style={{
                      borderBottom: "1px solid oklch(1 0 0 / 6%)",
                      color: "oklch(0.50 0.010 255)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    <th className="px-4 py-3 font-semibold">Pos</th>
                    <th className="px-4 py-3 font-semibold">Team</th>
                    <th className="px-4 py-3 text-right font-semibold">Pts</th>
                    <th className="px-4 py-3 text-right font-semibold">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {constructors.map((c, idx) => (
                    <tr
                      key={c.team}
                      className="last:border-0"
                      style={{
                        borderBottom: "1px solid oklch(1 0 0 / 5%)",
                        background: idx % 2 === 0 ? "transparent" : "oklch(1 0 0 / 1.5%)",
                      }}
                    >
                      <td
                        className="px-4 py-2.5 font-display font-bold text-base"
                        style={{ color: "oklch(0.55 0.012 255)" }}
                      >
                        {c.position}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-5 w-1 shrink-0 rounded-sm"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="font-medium">{c.team}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-num font-semibold">{c.points}</td>
                      <td className="px-4 py-2.5 text-right">
                        <DeltaChip delta={c.delta} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          to="/compare"
          className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase transition-opacity hover:opacity-80"
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 10%)",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.375rem",
            letterSpacing: "0.08em",
          }}
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
        className="-mx-4 -my-3 inline-flex items-center gap-1 px-4 py-3 font-semibold uppercase tracking-widest transition-colors hover:text-foreground"
      >
        {children} <ArrowUpDown className="h-2.5 w-2.5 opacity-60" />
      </button>
    </th>
  );
}
