import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users, ChevronRight } from "lucide-react";
import { SectionHeader, EyebrowRed } from "@/components/f1/primitives";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import { constructorStandingsQuery, driverStandingsQuery } from "@/lib/f1-queries";
import { CURRENT_SEASON } from "@/lib/f1-data";
import { getHDDriverPhoto } from "@/lib/f1-assets";
import { teamNameToConstructorId } from "@/lib/f1-constants";
import teamHistoryRaw from "@/data/teamHistory.json";

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamHistoryEntry = {
  constructorId: string;
  fullName: string;
  shortName: string;
  base: string;
  teamPrincipal: string;
  powerUnit: string;
  firstSeason: number;
  championships: number[];
  nationality: string;
  flag: string;
  about: string;
};

const TEAM_HISTORY = teamHistoryRaw as Record<string, TeamHistoryEntry>;

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Teams · f1Bidda" },
      {
        name: "description",
        content:
          "All Formula 1 constructors — live championship standings, driver lineups, and team histories sourced from Jolpica.",
      },
      { property: "og:title", content: "F1 Teams · f1Bidda" },
      {
        property: "og:description",
        content: "Constructor standings, driver lineups and championship history for every F1 team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamsLayout,
});

function TeamsLayout() {
  const matches = useRouterState({ select: (s) => s.matches });
  const isIndex = matches[matches.length - 1]?.routeId === "/teams";
  if (isIndex) return <TeamsPage />;
  return <Outlet />;
}

// ─── Teams Page ───────────────────────────────────────────────────────────────

function TeamsPage() {
  const consQ = useQuery(constructorStandingsQuery(CURRENT_SEASON));
  const driversQ = useQuery(driverStandingsQuery(CURRENT_SEASON));

  // Map constructorId → drivers from live standings
  const driversByConstructorId = useMemo(() => {
    const map = new Map<string, typeof driversQ.data>();
    (driversQ.data ?? []).forEach((row) => {
      const cid = row.driver.constructorId ?? "";
      if (!cid) return;
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid)!.push(row);
    });
    return map;
  }, [driversQ.data]);

  const constructors = consQ.data ?? [];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <SectionHeader eyebrow="Constructors" title={`${CURRENT_SEASON} Teams`} />

      {/* Live badge + count */}
      <div className="mb-8 flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-display font-bold uppercase"
          style={{
            background: "oklch(0.60 0.245 27 / 0.12)",
            border: "1px solid oklch(0.60 0.245 27 / 0.3)",
            color: "oklch(0.60 0.245 27)",
            letterSpacing: "0.06em",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "oklch(0.60 0.245 27)",
              boxShadow: "0 0 6px oklch(0.60 0.245 27)",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
          Live Standings · {constructors.length > 0 ? `${constructors.length} Teams` : "Loading…"}
        </div>
        <span className="text-xs" style={{ color: "oklch(0.50 0.010 255)" }}>
          Sorted by current championship position
        </span>
      </div>

      {/* Loading skeleton */}
      {consQ.isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      )}

      {/* Error state */}
      {consQ.isError && !consQ.isLoading && (
        <ErrorNote
          message="Constructor standings could not be loaded. Check your connection and try again."
          onRetry={() => consQ.refetch()}
        />
      )}

      {/* Grid */}
      {!consQ.isLoading && !consQ.isError && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {constructors.map((c) => {
            const constructorId = c.constructorId || teamNameToConstructorId(c.team);
            const history = TEAM_HISTORY[constructorId];
            const teamDrivers = driversByConstructorId.get(constructorId) ?? [];

            return (
              <TeamCard
                key={c.team}
                constructorId={constructorId}
                name={c.team}
                fullName={history?.fullName ?? c.team}
                color={c.color}
                position={c.position}
                points={c.points}
                wins={c.wins}
                championships={history?.championships?.length ?? 0}
                teamPrincipal={history?.teamPrincipal}
                flag={history?.flag}
                drivers={teamDrivers}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────

type DriverInfo = {
  driver: { code: string; name: string; driverId?: string; number: number; constructorId?: string };
};

function TeamCard({
  constructorId,
  name,
  fullName,
  color,
  position,
  points,
  wins,
  championships,
  teamPrincipal,
  flag,
  drivers,
}: {
  constructorId: string;
  name: string;
  fullName: string;
  color: string;
  position: number;
  points: number;
  wins: number;
  championships: number;
  teamPrincipal?: string;
  flag?: string;
  drivers: DriverInfo[];
}) {
  return (
    <Link
      to="/teams/$teamId"
      params={{ teamId: constructorId }}
      className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none"
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderRadius: "0.75rem",
      }}
    >
      {/* Glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[0.75rem]"
        style={{ boxShadow: `0 0 0 1px ${color}55, 0 8px 32px -8px ${color}55` }}
      />

      {/* Top accent bar */}
      <div
        className="h-1 w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}66, transparent)` }}
      />

      {/* Position badge + flag */}
      <div className="flex items-start justify-between px-5 pt-4 pb-2">
        <div
          className="flex items-center justify-center font-num font-black text-2xl leading-none"
          style={{
            width: "2.5rem",
            height: "2.5rem",
            background: position === 1 ? `${color}33` : "oklch(1 0 0 / 5%)",
            border: `1px solid ${position === 1 ? color + "55" : "oklch(1 0 0 / 8%)"}`,
            borderRadius: "0.5rem",
            color: position === 1 ? color : "oklch(0.55 0.012 255)",
          }}
        >
          {position}
        </div>
        <div className="flex items-center gap-2">
          {flag && <span className="text-xl">{flag}</span>}
          {championships > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded font-display text-[10px] font-bold uppercase"
              style={{
                background: "oklch(0.80 0.18 75 / 0.12)",
                border: "1px solid oklch(0.80 0.18 75 / 0.3)",
                color: "oklch(0.80 0.18 75)",
                letterSpacing: "0.06em",
              }}
            >
              <Trophy className="h-2.5 w-2.5" />
              {championships}×
            </div>
          )}
        </div>
      </div>

      {/* Team name */}
      <div className="px-5 pb-4">
        <div
          className="font-display font-black uppercase leading-none"
          style={{
            fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
            color: color,
            letterSpacing: "-0.01em",
            textShadow: `0 0 40px ${color}66`,
          }}
        >
          {name}
        </div>
        {teamPrincipal && (
          <div className="mt-1 text-xs" style={{ color: "oklch(0.50 0.010 255)" }}>
            TP: {teamPrincipal}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5" style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }} />

      {/* Driver lineup */}
      <div className="flex items-center gap-3 px-5 py-4">
        <Users className="h-3.5 w-3.5 shrink-0" style={{ color: "oklch(0.50 0.010 255)" }} />
        {drivers.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {drivers.slice(0, 2).map(({ driver }) => (
              <DriverPill key={driver.code} driver={driver} color={color} />
            ))}
          </div>
        ) : (
          <span className="text-xs" style={{ color: "oklch(0.45 0.008 255)" }}>
            Driver data loading…
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5" style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }} />

      {/* Stats footer */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-6">
          {/* Points */}
          <div>
            <div className="font-num text-2xl font-black" style={{ color }}>
              {points}
            </div>
            <div
              className="label-eyebrow text-[9px] mt-0.5"
              style={{ color: "oklch(0.50 0.010 255)" }}
            >
              PTS
            </div>
          </div>
          {/* Wins */}
          <div>
            <div className="font-num text-2xl font-black" style={{ color: "oklch(0.94 0.003 255)" }}>
              {wins}
            </div>
            <div
              className="label-eyebrow text-[9px] mt-0.5"
              style={{ color: "oklch(0.50 0.010 255)" }}
            >
              WINS
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className="flex items-center gap-1 font-display text-[11px] font-bold uppercase opacity-0 transition-all duration-200 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
          style={{ color, letterSpacing: "0.06em" }}
        >
          View Team <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}

// ─── Driver Pill ──────────────────────────────────────────────────────────────

function DriverPill({
  driver,
  color,
}: {
  driver: { code: string; name: string; driverId?: string; number: number };
  color: string;
}) {
  const photo = getHDDriverPhoto(driver.driverId || driver.code);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {/* Avatar */}
      <div
        className="shrink-0 overflow-hidden"
        style={{
          width: "2rem",
          height: "2rem",
          borderRadius: "50%",
          background: `${color}33`,
          border: `1px solid ${color}55`,
        }}
      >
        {photo && !imgError ? (
          <img
            src={photo}
            alt={driver.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full grid place-items-center font-display font-black text-[9px]"
            style={{ color }}
          >
            {driver.code}
          </div>
        )}
      </div>
      {/* Name */}
      <div className="min-w-0">
        <div
          className="font-display font-bold text-xs truncate"
          style={{ color: "oklch(0.85 0.005 255)" }}
        >
          {driver.name.split(" ").pop()}
        </div>
        <div
          className="font-num text-[9px]"
          style={{ color: "oklch(0.50 0.010 255)" }}
        >
          #{driver.number}
        </div>
      </div>
    </div>
  );
}
