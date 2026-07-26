import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle, Heart, Trophy, MapPin, Calendar, Flag, User } from "lucide-react";
import { Eyebrow, GlassCard, StatCard } from "@/components/f1/primitives";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import { driverStandingsQuery, sessionDriversQuery } from "@/lib/f1-queries";
import { CURRENT_SEASON } from "@/lib/f1-data";
import driverBios from "@/data/driverBios.json";

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

  const bio = BIOS[driverId] ?? null;
  const isLoading = standingsQ.isLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
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
        <Link
          to="/drivers"
          className="mb-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-display uppercase tracking-widest hover:bg-white/10"
        >
          <ArrowLeft className="h-3 w-3" /> Back to drivers
        </Link>
        <GlassCard className="p-10 text-center">
          <p className="text-2xl font-display font-bold uppercase text-muted-foreground">Driver not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No data for <span className="font-num text-foreground">"{driverId}"</span> in the {CURRENT_SEASON} standings.
          </p>
        </GlassCard>
      </div>
    );
  }

  const teamColor = row.driver.teamColor;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      {/* Back link */}
      <Link
        to="/drivers"
        className="mb-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-display uppercase tracking-widest hover:bg-white/10 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" /> Back to drivers
      </Link>

      {/* ─── HERO ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 mb-8">
        {/* background gradient */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 60% 0%, ${teamColor}, transparent 70%)`,
          }}
        />
        {/* team color top strip */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: teamColor }} />

        <div className="relative grid grid-cols-1 gap-0 lg:grid-cols-[340px_1fr]">
          {/* Photo */}
          <div
            className="relative min-h-[360px] lg:min-h-[460px] overflow-hidden"
            style={{
              background: `linear-gradient(160deg, ${teamColor}44, rgba(10,10,11,0.95))`,
            }}
          >
            {headshotUrl ? (
              <img
                src={headshotUrl}
                alt={row.driver.name}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <span className="font-display text-9xl font-black text-white/20 select-none">
                  {row.driver.code}
                </span>
              </div>
            )}
            {/* Car number badge */}
            <div
              className="absolute bottom-4 right-4 rounded-xl px-3 py-1.5 font-num text-2xl font-black backdrop-blur-md"
              style={{ backgroundColor: `${teamColor}CC`, color: "#fff" }}
            >
              #{row.driver.number}
            </div>
          </div>

          {/* Info panel */}
          <div className="flex flex-col justify-between p-6 sm:p-10">
            <div>
              <Eyebrow>{row.driver.team}</Eyebrow>
              <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-6xl">
                {row.driver.name}
              </h1>

              {/* Meta row */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
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

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Championships" value={bio?.championships ?? "—"} accent="red" />
                <StatCard label="Season Wins" value={row.wins} accent="amber" />
                <StatCard label="Season Points" value={row.points} accent="teal" />
                <StatCard label="F1 Debut" value={bio?.firstSeason ?? "—"} accent="blue" />
              </div>
            </div>

            {/* Championship position badge */}
            <div className="mt-6 flex items-center gap-3">
              <div
                className="rounded-lg px-4 py-2 text-sm font-display font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${teamColor}33`, border: `1px solid ${teamColor}66`, color: teamColor }}
              >
                P{row.position} Championship
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="flex flex-wrap gap-1 border-b border-white/5 mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-5 py-3 font-display text-sm font-semibold uppercase tracking-widest transition ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-2 bottom-0 h-0.5" style={{ backgroundColor: teamColor }} />}
          </button>
        ))}
      </div>

      {/* ─── TAB: OVERVIEW ─── */}
      {tab === "Overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in">
          {/* Personal Life */}
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4" style={{ color: teamColor }} />
              <Eyebrow>Personal Life</Eyebrow>
            </div>
            <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-wide">About {row.driver.name.split(" ")[0]}</h2>
            {bio?.personalLife ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{bio.personalLife}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Personal biography not yet available.</p>
            )}
          </GlassCard>

          {/* Relationships */}
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-400" />
              <Eyebrow>Relationships & Personal</Eyebrow>
            </div>
            <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-wide">Dating History</h2>
            {bio?.relationships ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{bio.relationships}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No public relationship information available.</p>
            )}
          </GlassCard>

          {/* Career Milestones */}
          <GlassCard className="p-6 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <Eyebrow>Career Milestones</Eyebrow>
            </div>
            <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wide">Highlights</h2>
            {bio?.milestones?.length ? (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bio.milestones.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-muted-foreground transition hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <span
                      className="mt-0.5 h-5 w-5 shrink-0 rounded-full text-center text-xs font-bold leading-5 text-black"
                      style={{ backgroundColor: teamColor }}
                    >
                      {i + 1}
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">Milestones coming soon.</p>
            )}
          </GlassCard>
        </div>
      )}

      {/* ─── TAB: ROAD TO F1 ─── */}
      {tab === "Road to F1" && (
        <div className="animate-fade-in">
          <GlassCard className="p-6 sm:p-10">
            <Eyebrow>Career Journey</Eyebrow>
            <h2 className="mt-1 mb-8 font-display text-2xl font-bold uppercase tracking-wide">
              From karting to the grid
            </h2>
            {bio?.roadToF1?.length ? (
              <ol className="relative space-y-0 border-l-2 border-white/10 pl-8">
                {bio.roadToF1.map((step, i) => (
                  <li key={i} className="relative pb-10 last:pb-0">
                    {/* Timeline dot */}
                    <span
                      className="absolute -left-[37px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background text-[9px] font-black"
                      style={{ backgroundColor: teamColor }}
                    >
                      {i + 1}
                    </span>
                    <div className="font-num text-xs uppercase tracking-widest mb-1" style={{ color: teamColor }}>
                      {step.year}
                    </div>
                    <div className="font-display text-lg font-bold uppercase mb-2">{step.phase}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Road to F1 data not yet available for this driver.
              </p>
            )}
          </GlassCard>
        </div>
      )}

      {/* ─── TAB: CONTROVERSIES ─── */}
      {tab === "Controversies" && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div>
              <Eyebrow>On & Off Track</Eyebrow>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide">
                Controversies & Incidents
              </h2>
            </div>
          </div>

          {bio?.controversies?.length ? (
            bio.controversies.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 transition hover:border-amber-500/40 hover:bg-amber-500/10"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <h3 className="font-display text-base font-bold uppercase tracking-wide mb-2 text-amber-200">
                      {c.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <GlassCard className="p-8 text-center">
              <p className="text-sm text-muted-foreground italic">
                No notable controversies on record — a clean sheet!
              </p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}

function formatDob(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
