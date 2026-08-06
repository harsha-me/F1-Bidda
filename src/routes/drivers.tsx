import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { EyebrowRed, SectionHeader } from "@/components/f1/primitives";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import { driverStandingsQuery, sessionDriversQuery } from "@/lib/f1-queries";
import { CURRENT_SEASON, type Driver } from "@/lib/f1-data";
import { getHDDriverPhoto } from "@/lib/f1-assets";
import { teamColor as teamColorFor } from "@/lib/f1-constants";
import legendDrivers from "@/data/legendDrivers.json";
import type { LegendDriver } from "@/components/f1/legend-profile";

const LEGENDS = legendDrivers as Record<string, LegendDriver>;

export const Route = createFileRoute("/drivers")({
  head: () => ({
    meta: [
      { title: "Drivers · f1Bidda" },
      {
        name: "description",
        content:
          "Every driver on the current Formula 1 grid — cars, numbers, teams and their road from karting to F1.",
      },
      { property: "og:title", content: "Drivers · f1Bidda" },
      {
        property: "og:description",
        content: "Grid, bios and the road to F1 for every current driver.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DriversLayout,
});

function DriversLayout() {
  const matches = useRouterState({ select: (s) => s.matches });
  const isIndex = matches[matches.length - 1]?.routeId === "/drivers";
  if (isIndex) return <DriversPage />;
  return <Outlet />;
}

function DriversPage() {
  const standingsQ = useQuery(driverStandingsQuery(CURRENT_SEASON));
  const of1Q = useQuery(sessionDriversQuery("latest"));

  const drivers = useMemo(() => standingsQ.data?.map((r) => r.driver) ?? [], [standingsQ.data]);

  const headshotByCode = useMemo(() => {
    const m = new Map<string, string>();
    (of1Q.data ?? []).forEach((d: any) => {
      if (d.name_acronym && d.headshot_url) m.set(d.name_acronym, d.headshot_url as string);
    });
    return m;
  }, [of1Q.data]);

  // Group drivers by team
  const byTeam = useMemo(() => {
    const map = new Map<string, { color: string; drivers: Driver[] }>();
    drivers.forEach((d) => {
      if (!map.has(d.team)) map.set(d.team, { color: d.teamColor, drivers: [] });
      map.get(d.team)!.drivers.push(d);
    });
    return [...map.entries()];
  }, [drivers]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <SectionHeader eyebrow="Grid" title={`${CURRENT_SEASON} Drivers`} />

      {standingsQ.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : standingsQ.isError ? (
        <ErrorNote
          message="Driver list is temporarily unavailable."
          onRetry={() => standingsQ.refetch()}
        />
      ) : (
        <div className="space-y-10">
          {byTeam.map(([teamName, { color, drivers: teamDrivers }]) => (
            <div key={teamName}>
              {/* Team header */}
              <div
                className="mb-4 flex items-center gap-3 pb-3"
                style={{ borderBottom: `2px solid ${color}20` }}
              >
                <div className="h-4 w-1 rounded-full shrink-0" style={{ background: color }} />
                <span
                  className="font-display font-bold uppercase text-sm"
                  style={{ color, letterSpacing: "0.06em" }}
                >
                  {teamName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {teamDrivers.map((d) => (
                  <DriverCard
                    key={d.code}
                    driver={d}
                    photo={getHDDriverPhoto(d.driverId || d.code, headshotByCode.get(d.code))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── LEGENDS ──────────────────────────────────────────────────── */}
      <div className="mt-16">
        <SectionHeader eyebrow="Hall of Fame" title="Legends of the Sport" />
        <p className="-mt-4 mb-6 max-w-xl text-sm" style={{ color: "oklch(0.56 0.012 255)" }}>
          Retired greats, kept here for the record — and for the driver-match quiz on the home page.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(LEGENDS).map(([id, legend]) => (
            <LegendCard key={id} id={id} legend={legend} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LegendCard({ id, legend }: { id: string; legend: LegendDriver }) {
  const [imgError, setImgError] = useState(false);
  const color = teamColorFor(legend.constructorId);

  return (
    <Link
      to="/drivers/$driverId"
      params={{ driverId: id }}
      className="group relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderRadius: "0.5rem",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "4/5",
          background: `linear-gradient(160deg, ${color}40 0%, oklch(0.12 0.004 255) 70%)`,
        }}
      >
        {!imgError ? (
          <img
            src={legend.photo}
            alt={legend.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span
              className="font-display font-black"
              style={{ fontSize: "3.5rem", color: "oklch(1 0 0 / 0.5)", lineHeight: 1 }}
            >
              {legend.code}
            </span>
          </div>
        )}

        {legend.championships > 0 && (
          <div
            className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 font-num text-[10px] font-bold px-1.5 py-0.5"
            style={{
              background: "oklch(0.12 0.004 255 / 0.85)",
              border: "1px solid oklch(0.80 0.18 75 / 0.4)",
              color: "oklch(0.80 0.18 75)",
              borderRadius: "0.25rem",
              backdropFilter: "blur(8px)",
            }}
          >
            <Trophy className="h-2.5 w-2.5" />
            {legend.championships}×
          </div>
        )}

        <div
          className="absolute top-2.5 right-2.5 font-num text-xs font-bold px-2 py-0.5"
          style={{
            background: "oklch(0.12 0.004 255 / 0.85)",
            border: "1px solid oklch(1 0 0 / 12%)",
            borderRadius: "0.25rem",
            backdropFilter: "blur(8px)",
          }}
        >
          #{legend.number}
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="label-eyebrow-red text-[9px]" style={{ color }}>
          {legend.teamName} · {legend.firstSeason}–{legend.lastSeason}
        </div>
        <div
          className="mt-1 font-display font-bold uppercase leading-tight"
          style={{ fontSize: "0.95rem", letterSpacing: "0.03em" }}
        >
          {legend.name}
        </div>
        <div
          className="mt-2 font-display text-[10px] font-bold uppercase opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.08em" }}
        >
          View Profile →
        </div>
      </div>
    </Link>
  );
}

function DriverCard({ driver, photo }: { driver: Driver; photo?: string }) {
  const id = driver.driverId ?? driver.code.toLowerCase();
  const [imgError, setImgError] = useState(false);
  const displayPhoto = !imgError ? photo : undefined;

  return (
    <Link
      to="/drivers/$driverId"
      params={{ driverId: id }}
      className="group relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderRadius: "0.5rem",
        borderLeft: `3px solid ${driver.teamColor}`,
      }}
    >
      {/* Photo area */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "4/5",
          background: `linear-gradient(160deg, ${driver.teamColor}40 0%, oklch(0.12 0.004 255) 70%)`,
        }}
      >
        {displayPhoto ? (
          <img
            src={displayPhoto}
            alt={driver.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span
              className="font-display font-black"
              style={{ fontSize: "3.5rem", color: "oklch(1 0 0 / 0.5)", lineHeight: 1 }}
            >
              {driver.code}
            </span>
          </div>
        )}

        {/* Number badge */}
        <div
          className="absolute top-2.5 right-2.5 font-num text-xs font-bold px-2 py-0.5"
          style={{
            background: "oklch(0.12 0.004 255 / 0.85)",
            border: "1px solid oklch(1 0 0 / 12%)",
            borderRadius: "0.25rem",
            backdropFilter: "blur(8px)",
          }}
        >
          #{driver.number}
        </div>
      </div>

      {/* Info strip */}
      <div className="px-4 py-3">
        <div className="label-eyebrow-red text-[9px]" style={{ color: driver.teamColor }}>
          {driver.team}
        </div>
        <div
          className="mt-1 font-display font-bold uppercase leading-tight"
          style={{ fontSize: "0.95rem", letterSpacing: "0.03em" }}
        >
          {driver.name}
        </div>
        <div
          className="mt-2 font-display text-[10px] font-bold uppercase opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.08em" }}
        >
          View Profile →
        </div>
      </div>
    </Link>
  );
}
