import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Trophy,
  MapPin,
  Calendar,
  Zap,
  Users,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EyebrowRed, StatCard, SectionHeader } from "@/components/f1/primitives";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import {
  constructorStandingsQuery,
  driverStandingsQuery,
  teamPointsProgressionQuery,
} from "@/lib/f1-queries";
import { CURRENT_SEASON } from "@/lib/f1-data";
import { getHDDriverPhoto } from "@/lib/f1-assets";
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

export const Route = createFileRoute("/teams/$teamId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.teamId} · Teams · f1Bidda` },
      {
        name: "description",
        content: `Constructor standings, driver lineup, points progression, and championship history for ${params.teamId}.`,
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamDetail,
});

// ─── Team Detail Page ─────────────────────────────────────────────────────────

function TeamDetail() {
  const { teamId } = Route.useParams();

  const consQ = useQuery(constructorStandingsQuery(CURRENT_SEASON));
  const driversQ = useQuery(driverStandingsQuery(CURRENT_SEASON));
  const progressionQ = useQuery(teamPointsProgressionQuery(CURRENT_SEASON, teamId));

  const history = TEAM_HISTORY[teamId] ?? null;

  // Find this team in live standings
  const standing = useMemo(
    () => (consQ.data ?? []).find((c) => c.constructorId === teamId) ?? null,
    [consQ.data, teamId],
  );

  // Get this team's drivers from live driver standings
  const teamDrivers = useMemo(
    () => (driversQ.data ?? []).filter((r) => r.driver.constructorId === teamId),
    [driversQ.data, teamId],
  );

  const color = standing?.color ?? (history ? "#8A8A8A" : "#8A8A8A");
  const displayName = history?.shortName ?? standing?.team ?? teamId;
  const fullName = history?.fullName ?? standing?.team ?? teamId;

  // Loading state
  if (consQ.isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="space-y-5">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (consQ.isError) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        <ErrorNote message="Team data unavailable." onRetry={() => consQ.refetch()} />
      </div>
    );
  }

  if (!history && !standing) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        <BackLink />
        <div
          className="py-20 text-center"
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderRadius: "0.75rem",
          }}
        >
          <p
            className="font-display text-2xl font-black uppercase"
            style={{ color: "oklch(0.55 0.012 255)" }}
          >
            Team not found
          </p>
          <p className="mt-2 text-sm" style={{ color: "oklch(0.52 0.010 255)" }}>
            No data for <span className="font-num text-foreground">"{teamId}"</span>.
          </p>
          <Link
            to="/teams"
            className="mt-6 inline-flex items-center gap-2 font-display text-sm font-bold uppercase"
            style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.06em" }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <BackLink />

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <div
        className="relative mb-8 overflow-hidden"
        style={{
          background: "oklch(0.145 0.005 255)",
          border: "1px solid oklch(1 0 0 / 8%)",
          borderRadius: "0.75rem",
          borderTop: `3px solid ${color}`,
        }}
      >
        {/* Radial gradient wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 0% 0%, ${color}22, transparent 65%)`,
          }}
        />
        {/* Decorative giant team name watermark */}
        <div
          className="absolute right-0 bottom-0 select-none pointer-events-none overflow-hidden"
          style={{ lineHeight: 0.85 }}
          aria-hidden
        >
          <span
            className="font-display font-black uppercase"
            style={{
              fontSize: "clamp(5rem, 14vw, 11rem)",
              color: `${color}0d`,
              letterSpacing: "-0.04em",
            }}
          >
            {displayName}
          </span>
        </div>

        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          {/* Top row: name + position */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              {history?.flag && (
                <span className="text-3xl mr-3">{history.flag}</span>
              )}
              <EyebrowRed>
                {history?.nationality ?? ""} · {CURRENT_SEASON} Constructor
              </EyebrowRed>
              <h1
                className="mt-2 font-display font-black uppercase leading-none"
                style={{
                  fontSize: "clamp(2.4rem, 6vw, 4rem)",
                  color,
                  letterSpacing: "-0.02em",
                  textShadow: `0 0 60px ${color}55`,
                }}
              >
                {displayName}
              </h1>
              <p
                className="mt-1 font-display text-sm font-semibold uppercase"
                style={{ color: "oklch(0.55 0.012 255)", letterSpacing: "0.04em" }}
              >
                {fullName}
              </p>
            </div>

            {standing && (
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div
                  className="font-num text-5xl font-black leading-none"
                  style={{ color }}
                >
                  P{standing.position}
                </div>
                <div
                  className="font-display text-xs font-bold uppercase"
                  style={{ color: "oklch(0.50 0.010 255)", letterSpacing: "0.08em" }}
                >
                  Championship
                </div>
              </div>
            )}
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Season Points"
              value={standing?.points ?? "—"}
              accent="red"
            />
            <StatCard label="Season Wins" value={standing?.wins ?? "—"} accent="amber" />
            <StatCard
              label="Championships"
              value={history?.championships?.length ?? "—"}
              accent="teal"
            />
            <StatCard
              label="First Season"
              value={history?.firstSeason ?? "—"}
              accent="blue"
            />
          </div>
        </div>
      </div>

      {/* ─── INFO GRID ─────────────────────────────────────────────────────── */}
      {history && (
        <div
          className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <InfoTile icon={<Users className="h-4 w-4" />} label="Team Principal" value={history.teamPrincipal} color={color} />
          <InfoTile icon={<MapPin className="h-4 w-4" />} label="Base / HQ" value={history.base} color={color} />
          <InfoTile icon={<Zap className="h-4 w-4" />} label="Power Unit" value={history.powerUnit} color={color} />
          <InfoTile icon={<Calendar className="h-4 w-4" />} label="First F1 Season" value={String(history.firstSeason)} color={color} />
        </div>
      )}

      {/* ─── DRIVER LINEUP ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <EyebrowRed className="mb-4">Driver Lineup</EyebrowRed>
        {driversQ.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-52 w-full" />
          </div>
        ) : teamDrivers.length === 0 ? (
          <div
            className="py-8 text-center text-sm"
            style={{ color: "oklch(0.50 0.010 255)" }}
          >
            No driver data available for this team yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamDrivers.map(({ driver, points, wins, position }) => (
              <DriverCard
                key={driver.code}
                driver={driver}
                points={points}
                wins={wins}
                position={position}
                teamColor={color}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── POINTS PROGRESSION CHART ──────────────────────────────────────── */}
      <div
        className="mb-8 overflow-hidden"
        style={{
          background: "oklch(0.155 0.006 255)",
          border: "1px solid oklch(1 0 0 / 7%)",
          borderRadius: "0.75rem",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid oklch(1 0 0 / 7%)" }}
        >
          <div>
            <EyebrowRed>Season {CURRENT_SEASON}</EyebrowRed>
            <h3 className="mt-1.5 font-display font-black uppercase text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color }} />
              Points Progression
            </h3>
          </div>
          {progressionQ.data && progressionQ.data.length > 0 && (
            <div className="text-right">
              <div className="font-num text-2xl font-black" style={{ color }}>
                {progressionQ.data[progressionQ.data.length - 1].cumulative}
              </div>
              <div className="text-xs" style={{ color: "oklch(0.50 0.010 255)" }}>
                Total PTS
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          {progressionQ.isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : progressionQ.isError || !progressionQ.data?.length ? (
            <div
              className="h-56 flex flex-col items-center justify-center gap-2 text-sm"
              style={{ color: "oklch(0.50 0.010 255)" }}
            >
              {progressionQ.isError ? (
                <ErrorNote
                  message="Points progression data unavailable."
                  onRetry={() => progressionQ.refetch()}
                />
              ) : (
                <p>No race results yet for this season.</p>
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <AreaChart
                data={progressionQ.data}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`teamGrad-${teamId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(1 0 0 / 5%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="raceName"
                  tick={{ fontSize: 9, fill: "oklch(0.48 0.008 255)", fontFamily: "JetBrains Mono" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "oklch(0.48 0.008 255)", fontFamily: "JetBrains Mono" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.16 0.006 255)",
                    border: `1px solid ${color}55`,
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    color: "oklch(0.9 0.005 255)",
                    fontFamily: "JetBrains Mono",
                  }}
                  labelStyle={{ color: "oklch(0.70 0.008 255)", marginBottom: "4px" }}
                  formatter={(val: number, key: string) => [
                    val,
                    key === "cumulative" ? "Total Pts" : "Race Pts",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#teamGrad-${teamId})`}
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: "oklch(0.12 0.004 255)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── CHAMPIONSHIP HISTORY ──────────────────────────────────────────── */}
      {history && (
        <div
          className="mb-8 overflow-hidden"
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderRadius: "0.75rem",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid oklch(1 0 0 / 7%)" }}
          >
            <div>
              <EyebrowRed>All-Time</EyebrowRed>
              <h3 className="mt-1.5 font-display font-black uppercase text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5" style={{ color }} />
                Championships
              </h3>
            </div>
            <div
              className="font-num text-4xl font-black"
              style={{ color }}
            >
              {history.championships.length}
            </div>
          </div>

          <div className="p-5">
            {history.championships.length === 0 ? (
              <p className="text-sm" style={{ color: "oklch(0.50 0.010 255)" }}>
                No Constructors' Championships yet.
              </p>
            ) : (
              <>
                <p className="mb-4 text-xs" style={{ color: "oklch(0.52 0.010 255)" }}>
                  Constructors' Championship titles won
                </p>
                <div className="flex flex-wrap gap-2">
                  {history.championships.map((year) => (
                    <div
                      key={year}
                      className="flex items-center gap-1.5 font-num font-bold text-sm px-3 py-1.5 rounded"
                      style={{
                        background: `${color}18`,
                        border: `1px solid ${color}44`,
                        color,
                      }}
                    >
                      <Trophy className="h-3 w-3" />
                      {year}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── ABOUT ─────────────────────────────────────────────────────────── */}
      {history?.about && (
        <div
          className="mb-8"
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderLeft: `3px solid ${color}`,
            borderRadius: "0.75rem",
            padding: "1.5rem",
          }}
        >
          <EyebrowRed className="mb-3">About</EyebrowRed>
          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.68 0.008 255)" }}>
            {history.about}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BackLink() {
  return (
    <Link
      to="/teams"
      className="mb-6 inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase transition-opacity hover:opacity-70"
      style={{ color: "oklch(0.55 0.012 255)", letterSpacing: "0.06em" }}
    >
      <ArrowLeft className="h-3.5 w-3.5" /> All Teams
    </Link>
  );
}

function InfoTile({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderRadius: "0.5rem",
        padding: "1rem",
      }}
    >
      <div
        className="flex items-center gap-1.5 mb-2"
        style={{ color: "oklch(0.50 0.010 255)" }}
      >
        {icon}
        <span className="label-eyebrow text-[9px]">{label}</span>
      </div>
      <div
        className="font-display font-bold text-sm leading-snug"
        style={{ color: "oklch(0.90 0.005 255)" }}
      >
        {value}
      </div>
    </div>
  );
}

function DriverCard({
  driver,
  points,
  wins,
  position,
  teamColor,
}: {
  driver: {
    code: string;
    name: string;
    driverId?: string;
    number: number;
    team: string;
  };
  points: number;
  wins: number;
  position: number;
  teamColor: string;
}) {
  const [imgError, setImgError] = useState(false);
  const photo = getHDDriverPhoto(driver.driverId || driver.code);
  const displayPhoto = !imgError && photo ? photo : undefined;
  const driverId = driver.driverId ?? driver.code.toLowerCase();

  return (
    <Link
      to="/drivers/$driverId"
      params={{ driverId }}
      className="group relative flex overflow-hidden transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none"
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderRadius: "0.5rem",
        borderLeft: `3px solid ${teamColor}`,
      }}
    >
      {/* Photo */}
      <div
        className="shrink-0 w-28 sm:w-36 relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${teamColor}35 0%, oklch(0.10 0.004 255) 70%)`,
        }}
      >
        {displayPhoto ? (
          <img
            src={displayPhoto}
            alt={driver.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover object-top"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span
              className="font-display font-black select-none"
              style={{ fontSize: "3rem", color: "oklch(1 0 0 / 0.15)", lineHeight: 1 }}
            >
              {driver.code}
            </span>
          </div>
        )}
        {/* Car number overlay */}
        <div
          className="absolute bottom-2 right-2 font-num text-sm font-black px-1.5 py-0.5"
          style={{
            background: `${teamColor}cc`,
            color: "white",
            borderRadius: "0.25rem",
            backdropFilter: "blur(6px)",
          }}
        >
          #{driver.number}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div
            className="label-eyebrow-red text-[9px] mb-1"
            style={{ color: teamColor }}
          >
            P{position} Championship
          </div>
          <div
            className="font-display font-bold uppercase leading-tight"
            style={{ fontSize: "1.05rem" }}
          >
            {driver.name}
          </div>
          <div
            className="mt-0.5 font-num text-xs"
            style={{ color: "oklch(0.50 0.010 255)" }}
          >
            {driver.code}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <div
              className="font-num font-black text-lg leading-none"
              style={{ color: teamColor }}
            >
              {points}
            </div>
            <div className="label-eyebrow text-[9px] mt-0.5" style={{ color: "oklch(0.50 0.010 255)" }}>
              PTS
            </div>
          </div>
          <div>
            <div className="font-num font-black text-lg leading-none">{wins}</div>
            <div className="label-eyebrow text-[9px] mt-0.5" style={{ color: "oklch(0.50 0.010 255)" }}>
              WINS
            </div>
          </div>
          <div
            className="ml-auto flex items-center gap-1 font-display text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: teamColor, letterSpacing: "0.06em" }}
          >
            Profile <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}
