import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle, Heart, Trophy, MapPin, Calendar, Flag, User } from "lucide-react";
import { EyebrowRed, GlassCard, StatCard } from "@/components/f1/primitives";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import { driverStandingsQuery, sessionDriversQuery } from "@/lib/f1-queries";
import { CURRENT_SEASON } from "@/lib/f1-data";
import driverBios from "@/data/driverBios.json";
import { getHDDriverPhoto } from "@/lib/f1-assets";

type Controversy = { title: string; description: string };

type Bio = {
  nationality: string;
  flag: string;
  dateOfBirth: string;
  championships: number;
  firstSeason: number;
  personalLife?: string;
  relationships?: string;
  controversies?: Controversy[];
  roadToF1: { year: string; phase: string; description: string }[];
  milestones: string[];
};

const BIOS = driverBios as Record<string, Bio>;

const TABS = ["Overview", "Road to F1", "Controversies"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/drivers/$driverId")({
  head: ({ params }) => ({
    meta: [
      { title: `Driver · ${params.driverId} · f1Bidda` },
      {
        name: "description",
        content: `Biography, personal life, controversies and road to F1 for ${params.driverId}.`,
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DriverDetail,
});

function DriverDetail() {
  const { driverId } = Route.useParams();
  const standingsQ = useQuery(driverStandingsQuery(CURRENT_SEASON));
  const of1Q = useQuery(sessionDriversQuery("latest"));
  const [tab, setTab] = useState<Tab>("Overview");
  const [imgError, setImgError] = useState(false);

  const row = useMemo(
    () =>
      (standingsQ.data ?? []).find(
        (r) => r.driver.driverId === driverId || r.driver.code.toLowerCase() === driverId,
      ) ?? null,
    [standingsQ.data, driverId],
  );

  const of1 = useMemo(() => {
    if (!row) return null;
    return (of1Q.data ?? []).find((d) => d.name_acronym === row.driver.code) ?? null;
  }, [of1Q.data, row]);
  const headshotUrl = (of1 as unknown as { headshot_url?: string } | null)?.headshot_url;

  const bio = (() => {
    if (BIOS[driverId]) return BIOS[driverId];
    const entry = Object.entries(BIOS).find(([k]) => k.split("_").pop() === driverId);
    return entry?.[1] ?? null;
  })();

  if (standingsQ.isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
          <Skeleton className="aspect-[3/4]" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (standingsQ.isError) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        <ErrorNote message="Driver data unavailable." onRetry={() => standingsQ.refetch()} />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        <BackLink />
        <div
          className="py-16 text-center"
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderRadius: "0.75rem",
          }}
        >
          <p className="font-display text-2xl font-black uppercase" style={{ color: "oklch(0.55 0.012 255)" }}>
            Driver not found
          </p>
          <p className="mt-2 text-sm" style={{ color: "oklch(0.52 0.010 255)" }}>
            No data for <span className="font-num text-foreground">"{driverId}"</span> in the {CURRENT_SEASON} standings.
          </p>
        </div>
      </div>
    );
  }

  const teamColor = row.driver.teamColor;
  const hdPhoto = getHDDriverPhoto(row.driver.driverId || driverId || row.driver.code, headshotUrl);
  const displayPhoto = !imgError && hdPhoto ? hdPhoto : undefined;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <BackLink />

      {/* ─── HERO ─────────────────────────────────────── */}
      <div
        className="relative mb-8 overflow-hidden"
        style={{
          background: "oklch(0.145 0.005 255)",
          border: "1px solid oklch(1 0 0 / 8%)",
          borderRadius: "0.75rem",
          borderTop: `3px solid ${teamColor}`,
        }}
      >
        {/* Subtle gradient wash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 60% 80% at 30% 0%, ${teamColor}18, transparent 70%)` }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-[320px_1fr]">
          {/* Photo */}
          <div
            className="relative min-h-[320px] lg:min-h-[420px] overflow-hidden"
            style={{
              background: `linear-gradient(160deg, ${teamColor}35 0%, oklch(0.10 0.004 255) 70%)`,
            }}
          >
            {displayPhoto ? (
              <img
                src={displayPhoto}
                alt={row.driver.name}
                onError={() => setImgError(true)}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <span
                  className="font-display font-black select-none"
                  style={{ fontSize: "8rem", color: "oklch(1 0 0 / 0.15)", lineHeight: 1 }}
                >
                  {row.driver.code}
                </span>
              </div>
            )}

            {/* Car number */}
            <div
              className="absolute bottom-4 right-4 font-num text-2xl font-black px-3 py-1.5"
              style={{
                backgroundColor: `${teamColor}cc`,
                color: "white",
                borderRadius: "0.375rem",
                backdropFilter: "blur(8px)",
              }}
            >
              #{row.driver.number}
            </div>
          </div>

          {/* Info panel */}
          <div className="flex flex-col justify-between p-6 sm:p-10">
            <div>
              <EyebrowRed>{row.driver.team}</EyebrowRed>
              <h1
                className="mt-2 font-display font-black uppercase leading-none"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
              >
                {row.driver.name}
              </h1>

              {/* Meta row */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm" style={{ color: "oklch(0.56 0.012 255)" }}>
                {bio?.flag && bio?.nationality && (
                  <span className="inline-flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5" />
                    <span className="text-base">{bio.flag}</span>
                    {bio.nationality}
                  </span>
                )}
                {bio?.dateOfBirth && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Born {formatDob(bio.dateOfBirth)}
                  </span>
                )}
                {bio?.firstSeason && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    F1 Debut {bio.firstSeason}
                  </span>
                )}
              </div>

              {/* Stats grid */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Championships" value={bio?.championships ?? "—"} accent="red" />
                <StatCard label="Season Wins" value={row.wins} accent="amber" />
                <StatCard label="Season Points" value={row.points} accent="teal" />
                <StatCard label="F1 Debut" value={bio?.firstSeason ?? "—"} accent="blue" />
              </div>
            </div>

            {/* Championship badge + View Team link */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center font-display text-sm font-bold uppercase px-4 py-2"
                style={{
                  backgroundColor: `${teamColor}22`,
                  border: `1px solid ${teamColor}55`,
                  color: teamColor,
                  borderRadius: "0.375rem",
                  letterSpacing: "0.06em",
                }}
              >
                P{row.position} Championship
              </span>
              {row.driver.constructorId && (
                <Link
                  to="/teams/$teamId"
                  params={{ teamId: row.driver.constructorId }}
                  className="inline-flex items-center gap-1.5 font-display text-sm font-bold uppercase px-4 py-2 transition-all hover:brightness-110"
                  style={{
                    background: `${teamColor}15`,
                    border: `1px solid ${teamColor}40`,
                    color: teamColor,
                    borderRadius: "0.375rem",
                    letterSpacing: "0.06em",
                  }}
                >
                  {row.driver.team} →
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ─── TABS ──────────────────────────────────────── */}
      <div
        className="flex flex-wrap mb-8"
        style={{ borderBottom: "1px solid oklch(1 0 0 / 7%)" }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative px-5 py-3 font-display text-sm font-bold uppercase transition-colors"
            style={{
              color: tab === t ? "oklch(0.94 0.003 255)" : "oklch(0.50 0.010 255)",
              letterSpacing: "0.06em",
            }}
          >
            {t}
            {tab === t && (
              <span
                className="absolute bottom-0 inset-x-0 h-0.5"
                style={{ backgroundColor: teamColor }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB: OVERVIEW ─────────────────────────────── */}
      {tab === "Overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Personal Life */}
          <div
            style={{
              background: "oklch(0.155 0.006 255)",
              border: "1px solid oklch(1 0 0 / 7%)",
              borderRadius: "0.75rem",
              padding: "1.5rem",
            }}
          >
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4" style={{ color: teamColor }} />
              <EyebrowRed>Personal Life</EyebrowRed>
            </div>
            <h2 className="mb-3 font-display text-xl font-black uppercase">
              About {row.driver.name.split(" ")[0]}
            </h2>
            {bio?.personalLife ? (
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.58 0.012 255)" }}>
                {bio.personalLife}
              </p>
            ) : (
              <p className="text-sm italic" style={{ color: "oklch(0.52 0.010 255)" }}>
                Personal biography not yet available.
              </p>
            )}
          </div>

          {/* Relationships */}
          <div
            style={{
              background: "oklch(0.155 0.006 255)",
              border: "1px solid oklch(1 0 0 / 7%)",
              borderRadius: "0.75rem",
              padding: "1.5rem",
            }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-400" />
              <EyebrowRed>Relationships & Personal</EyebrowRed>
            </div>
            <h2 className="mb-3 font-display text-xl font-black uppercase">Dating History</h2>
            {bio?.relationships ? (
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.58 0.012 255)" }}>
                {bio.relationships}
              </p>
            ) : (
              <p className="text-sm italic" style={{ color: "oklch(0.52 0.010 255)" }}>
                No public relationship information available.
              </p>
            )}
          </div>

          {/* Milestones */}
          <div
            className="lg:col-span-2"
            style={{
              background: "oklch(0.155 0.006 255)",
              border: "1px solid oklch(1 0 0 / 7%)",
              borderRadius: "0.75rem",
              padding: "1.5rem",
            }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <EyebrowRed>Career Milestones</EyebrowRed>
            </div>
            <h2 className="mb-5 font-display text-xl font-black uppercase">Highlights</h2>
            {bio?.milestones?.length ? (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bio.milestones.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm transition-colors"
                    style={{
                      padding: "0.875rem 1rem",
                      background: "oklch(0.135 0.005 255)",
                      border: "1px solid oklch(1 0 0 / 6%)",
                      borderRadius: "0.5rem",
                      color: "oklch(0.65 0.010 255)",
                    }}
                  >
                    <span
                      className="mt-0.5 h-5 w-5 shrink-0 grid place-items-center text-center text-xs font-bold leading-none text-black font-display"
                      style={{ backgroundColor: teamColor, borderRadius: "0.25rem" }}
                    >
                      {i + 1}
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic" style={{ color: "oklch(0.52 0.010 255)" }}>Milestones coming soon.</p>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: ROAD TO F1 ───────────────────────────── */}
      {tab === "Road to F1" && (
        <div
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderRadius: "0.75rem",
            padding: "1.5rem 2rem",
          }}
        >
          <EyebrowRed className="mb-1">Career Journey</EyebrowRed>
          <h2 className="mb-8 font-display text-2xl font-black uppercase">
            From karting to the grid
          </h2>
          {bio?.roadToF1?.length ? (
            <ol
              className="relative space-y-0 pl-8"
              style={{ borderLeft: `2px solid ${teamColor}30` }}
            >
              {bio.roadToF1.map((step, i) => (
                <li key={i} className="relative pb-10 last:pb-0">
                  {/* Timeline dot */}
                  <span
                    className="absolute -left-[37px] top-1 flex h-5 w-5 items-center justify-center font-num text-[9px] font-black text-black"
                    style={{ backgroundColor: teamColor, borderRadius: "50%", border: "2px solid oklch(0.145 0.005 255)" }}
                  >
                    {i + 1}
                  </span>
                  <div
                    className="font-num text-xs font-bold uppercase mb-1"
                    style={{ color: teamColor, letterSpacing: "0.08em" }}
                  >
                    {step.year}
                  </div>
                  <div className="font-display text-lg font-black uppercase mb-2">{step.phase}</div>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.58 0.012 255)" }}>
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm italic" style={{ color: "oklch(0.52 0.010 255)" }}>
              Road to F1 data not yet available for this driver.
            </p>
          )}
        </div>
      )}

      {/* ─── TAB: CONTROVERSIES ────────────────────────── */}
      {tab === "Controversies" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div>
              <EyebrowRed>On & Off Track</EyebrowRed>
              <h2 className="font-display text-2xl font-black uppercase">
                Controversies & Incidents
              </h2>
            </div>
          </div>

          {bio?.controversies?.length ? (
            bio.controversies.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-4 transition-colors"
                style={{
                  padding: "1.25rem",
                  background: "oklch(0.16 0.010 75 / 0.12)",
                  border: "1px solid oklch(0.80 0.18 75 / 0.20)",
                  borderLeft: "3px solid oklch(0.80 0.18 75 / 0.60)",
                  borderRadius: "0.5rem",
                }}
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "oklch(0.80 0.18 75)" }}
                />
                <div>
                  <h3
                    className="font-display font-black uppercase text-base mb-2"
                    style={{ color: "oklch(0.90 0.10 75)" }}
                  >
                    {c.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.65 0.010 255)" }}>
                    {c.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div
              className="py-14 text-center"
              style={{
                background: "oklch(0.155 0.006 255)",
                border: "1px solid oklch(1 0 0 / 7%)",
                borderRadius: "0.75rem",
              }}
            >
              <p className="text-sm italic" style={{ color: "oklch(0.52 0.010 255)" }}>
                No notable controversies on record — a clean sheet!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/drivers"
      className="mb-6 inline-flex items-center gap-2 font-display text-xs font-bold uppercase transition-colors hover:text-foreground"
      style={{
        background: "oklch(1 0 0 / 5%)",
        border: "1px solid oklch(1 0 0 / 9%)",
        padding: "0.4rem 0.875rem",
        borderRadius: "0.375rem",
        color: "oklch(0.52 0.010 255)",
        letterSpacing: "0.08em",
      }}
    >
      <ArrowLeft className="h-3 w-3" /> Back to drivers
    </Link>
  );
}

function formatDob(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
