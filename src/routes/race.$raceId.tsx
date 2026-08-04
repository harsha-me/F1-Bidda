import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  CompoundBadge,
  DriverChip,
  Eyebrow,
  GlassCard,
  SectionHeader,
} from "@/components/f1/primitives";
import { CircuitMap } from "@/components/f1/circuit-map";
import { Skeleton, ErrorNote } from "@/components/f1/skeleton";
import { getCircuitImageUrl } from "@/lib/f1-assets";
import { COMPOUND_COLOR, type Driver, type LapRecord } from "@/lib/f1-data";
import {
  raceLapsQuery,
  raceQuery,
  raceResultsQuery,
  stintsQuery,
  qualifyingResultsQuery,
  pitStopsQuery,
} from "@/lib/f1-queries";
import { ChevronLeft } from "lucide-react";
import qualiHighlights from "@/data/qualiHighlights.json";
import { LapTimesChart } from "@/components/f1/lap-times-chart";
import { PositionChangesChart } from "@/components/f1/position-changes-chart";
import { TireStrategyChart } from "@/components/f1/tire-strategy-chart";

export const Route = createFileRoute("/race/$raceId")({
  loader: ({ params }) => {
    const parts = params.raceId.split("-").map(Number);
    if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) throw notFound();
    return { raceId: params.raceId };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Race not found" }] };
    return {
      meta: [
        { title: `Race ${loaderData.raceId} · f1Bidda` },
        {
          name: "description",
          content: `Race analysis: lap times, tire strategy and position changes.`,
        },
        { property: "og:title", content: `Race ${loaderData.raceId} · f1Bidda` },
        {
          property: "og:description",
          content: `Lap-by-lap analytics for round ${loaderData.raceId}.`,
        },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: RacePage,
  notFoundComponent: () => (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold uppercase">Race not found</h1>
      <Link to="/season" className="mt-4 inline-block text-primary underline">
        Back to season
      </Link>
    </main>
  ),
});

const TABS = ["Results", "Lap Times", "Tire Strategy", "Positions"] as const;
type Tab = (typeof TABS)[number];

function RacePage() {
  const { raceId } = Route.useLoaderData();
  const raceQ = useQuery(raceQuery(raceId));
  const resultsQ = useQuery(raceResultsQuery(raceId));
  const lapsQ = useQuery(raceLapsQuery(raceId));
  const stintsQ = useQuery(stintsQuery(raceId));
  const qualifyingQ = useQuery(qualifyingResultsQuery(raceId));

  const pitQ = useQuery(pitStopsQuery(raceId));

  const race = raceQ.data;
  const results = useMemo(() => resultsQ.data ?? [], [resultsQ.data]);
  const laps = lapsQ.data ?? [];
  const stints = stintsQ.data ?? [];
  const pitStops = pitQ.data ?? [];
  const qualifyingResults = useMemo(() => qualifyingQ.data ?? [], [qualifyingQ.data]);

  const [mainView, setMainView] = useState<"RACE" | "QUALIFYING">("RACE");

  // Top 8 drivers by finishing position get the interactive treatment.
  const activeDrivers: Driver[] = useMemo(
    () => results.slice(0, 8).map((r) => r.driver),
    [results],
  );

  const [tab, setTab] = useState<Tab>("Results");
  const [visible, setVisible] = useState<Set<string>>(new Set());
  // sync visible set when driver list arrives
  useMemo(() => {
    if (activeDrivers.length && visible.size === 0) {
      setVisible(new Set(activeDrivers.map((d) => d.code)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDrivers.length]);

  const toggle = (code: string) => {
    setVisible((v) => {
      const n = new Set(v);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });
  };

  const raceLoading = raceQ.isLoading || resultsQ.isLoading;

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 sm:py-14">
      <Link
        to="/season"
        className="mb-6 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" /> Season
      </Link>

      {/* HEADER */}
      <GlassCard className="relative overflow-hidden p-6 sm:p-10">
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-25">
          <CircuitMap className="h-full w-full" />
        </div>
        <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          {raceLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ) : raceQ.isError || !race ? (
            <ErrorNote message="Couldn't load this race." onRetry={() => raceQ.refetch()} />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{race.flag}</span>
                    <Eyebrow>
                      Round {race.round} · {race.season}
                    </Eyebrow>
                  </div>
                  <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-none sm:text-6xl">
                    {race.name}
                  </h1>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {race.circuit} · {race.country}
                  </div>
                </div>

                {race.circuitId && (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm transition-all hover:border-white/20">
                    <img
                      src={getCircuitImageUrl(race.circuitId) || `https://raw.githubusercontent.com/f1db/f1db/main/src/assets/circuits/white-outline/${getF1DBCircuitId(race.circuitId)}.svg`}
                      alt={`${race.circuit} layout`}
                      className="h-full w-full object-contain filter invert brightness-250 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] opacity-90 transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-6">
                <MiniStat
                  label="Date"
                  value={new Date(race.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                />
                <MiniStat label="Laps" value={race.laps ? String(race.laps) : "—"} />
                <MiniStat label="Status" value={race.completed ? "Complete" : "Upcoming"} />
              </div>
            </>
          )}
        </div>
      </GlassCard>

      {/* SESSION CHOOSE PILLS (RACE | QUALIFYING) */}
      <div className="mt-8 flex justify-center sm:justify-start">
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setMainView("RACE")}
            className={`rounded-md px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-widest transition-colors ${
              mainView === "RACE"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Race
          </button>
          <button
            onClick={() => setMainView("QUALIFYING")}
            className={`rounded-md px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-widest transition-colors ${
              mainView === "QUALIFYING"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Qualifying
          </button>
        </div>
      </div>

      {mainView === "RACE" ? (
        <>
          {/* TABS */}
          <div className="mt-8 flex flex-wrap gap-1 border-b border-white/5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-4 py-3 font-display text-sm font-semibold uppercase tracking-widest transition ${
                  tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
                {tab === t && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>

          {/* LEGEND */}
          {tab !== "Results" && activeDrivers.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {activeDrivers.map((d) => {
                const on = visible.has(d.code);
                return (
                  <button
                    key={d.code}
                    onClick={() => toggle(d.code)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      on
                        ? "border-white/20 bg-white/5 text-foreground"
                        : "border-white/5 text-muted-foreground opacity-50"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: d.teamColor }}
                    />
                    {d.code}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-6">
            {tab === "Results" && (
              <ResultsTab
                loading={resultsQ.isLoading}
                error={resultsQ.isError}
                onRetry={() => resultsQ.refetch()}
                results={results}
              />
            )}
            {tab === "Lap Times" && (
              <ChartCard title="Lap Times Pace Analysis">
                {lapsQ.isLoading ? (
                  <Skeleton className="h-[420px] w-full" />
                ) : lapsQ.isError ? (
                  <ErrorNote message="Lap timing unavailable." onRetry={() => lapsQ.refetch()} />
                ) : laps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lap data available yet.</p>
                ) : (
                  <LapTimesChart laps={laps} activeDrivers={activeDrivers} />
                )}
              </ChartCard>
            )}
            {tab === "Tire Strategy" && (
              <ChartCard title="Tire Strategy Breakdown">
                {stintsQ.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : stintsQ.isError ? (
                  <ErrorNote message="Stint data unavailable." onRetry={() => stintsQ.refetch()} />
                ) : stints.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tire compound data isn't available for this race from OpenF1.
                  </p>
                ) : (
                  <TireStrategyChart
                    stints={stints}
                    activeDrivers={activeDrivers}
                    laps={laps}
                    pitStops={pitStops}
                    totalRaceLaps={race?.laps}
                  />
                )}
              </ChartCard>
            )}
            {tab === "Positions" && (
              <ChartCard title="Position Changes Tracking">
                {lapsQ.isLoading ? (
                  <Skeleton className="h-[420px] w-full" />
                ) : lapsQ.isError ? (
                  <ErrorNote message="Position data unavailable." onRetry={() => lapsQ.refetch()} />
                ) : laps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lap data yet.</p>
                ) : (
                  <PositionChangesChart
                    laps={laps}
                    activeDrivers={activeDrivers}
                    results={results}
                  />
                )}
              </ChartCard>
            )}
          </div>
        </>
      ) : (
        <div className="mt-8 animate-fade-in">
          <QualifyingView
            loading={qualifyingQ.isLoading}
            error={qualifyingQ.isError}
            onRetry={() => qualifyingQ.refetch()}
            results={results}
            qualifyingResults={qualifyingResults}
            raceId={raceId}
          />
        </div>
      )}
    </main>
  );
}

interface QualifyingViewProps {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  results: {
    position: number;
    driver: Driver;
    grid: number;
  }[];
  qualifyingResults: {
    position: number;
    driver: Driver;
    q1?: string;
    q2?: string;
    q3?: string;
  }[];
  raceId: string;
}

function QualifyingView({
  loading,
  error,
  onRetry,
  results,
  qualifyingResults,
  raceId,
}: QualifyingViewProps) {
  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorNote message="Qualifying results unavailable." onRetry={onRetry} />;
  }

  const highlight = (
    qualiHighlights as Record<
      string,
      {
        youtubeUrl: string;
        summary: string;
        poleTime?: string;
        notableIncident?: string;
        surpriseResult?: string;
      }
    >
  )[raceId];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      {/* Qualifying Table */}
      {qualifyingResults.length === 0 ? (
        <GlassCard className="flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">
            No qualifying results yet — session is upcoming.
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <Eyebrow>Classification</Eyebrow>
            <h3 className="mt-1 font-display text-2xl font-bold uppercase">Qualifying Results</h3>
          </div>
          <div className="overflow-x-auto text-sm">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">Pos</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Q1</th>
                  <th className="px-4 py-3">Q2</th>
                  <th className="px-4 py-3">Q3</th>
                  <th className="px-4 py-3 text-right">Grid</th>
                </tr>
              </thead>
              <tbody>
                {qualifyingResults.map((r) => {
                  const finalGrid = results.find((res) => res.driver.code === r.driver.code)?.grid;
                  return (
                    <tr
                      key={r.driver.code}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 font-display text-lg font-bold">{r.position}</td>
                      <td className="px-4 py-3">
                        <DriverChip driver={r.driver} />
                      </td>
                      <td className="px-4 py-3 font-num text-muted-foreground">{r.q1 || "—"}</td>
                      <td className="px-4 py-3 font-num text-muted-foreground">{r.q2 || "—"}</td>
                      <td className="px-4 py-3 font-num text-muted-foreground">{r.q3 || "—"}</td>
                      <td className="px-4 py-3 text-right font-num text-muted-foreground">
                        {finalGrid !== undefined ? `P${finalGrid}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Qualifying Highlights */}
      <GlassCard className="flex flex-col gap-4">
        <div className="border-b border-white/5 pb-4">
          <Eyebrow>Highlights</Eyebrow>
          <h3 className="mt-1 font-display text-2xl font-bold uppercase">Qualifying Highlights</h3>
        </div>

        {highlight ? (
          <>
            {/* Video Embed */}
            {getYoutubeEmbedUrl(highlight.youtubeUrl) ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black">
                <iframe
                  src={getYoutubeEmbedUrl(highlight.youtubeUrl)!}
                  title="Qualifying Highlights"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-muted-foreground">
                Video unavailable
              </div>
            )}

            {/* Summary and Stats */}
            <div className="space-y-4 text-sm mt-2">
              <p className="text-foreground leading-relaxed">{highlight.summary}</p>

              <div className="grid gap-3 border-t border-white/5 pt-4 sm:grid-cols-2">
                {highlight.poleTime && (
                  <div>
                    <div className="label-eyebrow">Pole Position Time</div>
                    <div className="mt-1 font-num font-semibold text-primary">
                      {highlight.poleTime}
                    </div>
                  </div>
                )}
                {highlight.notableIncident && (
                  <div>
                    <div className="label-eyebrow">Notable Incident</div>
                    <div className="mt-1 text-xs text-muted-foreground leading-snug">
                      {highlight.notableIncident}
                    </div>
                  </div>
                )}
                {highlight.surpriseResult && (
                  <div className="col-span-full border-t border-white/5 pt-3">
                    <div className="label-eyebrow">Surprise Result</div>
                    <div className="mt-1 text-xs text-muted-foreground leading-snug">
                      {highlight.surpriseResult}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <p className="text-sm">No curated highlights available for this session yet.</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Curated video links are updated post-session.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

function getF1DBCircuitId(jolpicaId?: string): string {
  if (!jolpicaId) return "";
  const mapping: Record<string, string> = {
    albert_park: "albert-park",
    americas: "circuit-of-the-americas",
    bahrain: "bahrain-international-circuit",
    baku: "baku-city-circuit",
    catalunya: "circuit-de-barcelona-catalunya",
    hungaroring: "hungaroring",
    imola: "autodromo-enzo-e-dino-ferrari",
    interlagos: "autodromo-jose-carlos-pace",
    jeddah: "jeddah-corniche-circuit",
    losail: "lusail-international-circuit",
    marina_bay: "marina-bay-street-circuit",
    miami: "miami-international-autodrome",
    monaco: "circuit-de-monaco",
    monza: "autodromo-nazionale-monza",
    red_bull_ring: "red-bull-ring",
    rodriguez: "autodromo-hermanos-rodriguez",
    shanghai: "shanghai-international-circuit",
    silverstone: "silverstone-circuit",
    spa: "circuit-de-spa-francorchamps",
    suzuka: "suzuka-international-racing-course",
    vegas: "las-vegas-strip-circuit",
    villeneuve: "circuit-gilles-villeneuve",
    yas_marina: "yas-marina-circuit",
    zandvoort: "circuit-zandvoort",
  };
  return mapping[jolpicaId] || jolpicaId.replace(/_/g, "-");
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-eyebrow">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassCard>
      <SectionHeader title={title} />
      {children}
    </GlassCard>
  );
}

function pivotLaps(laps: LapRecord[], key: "lapTime" | "position"): Record<string, number>[] {
  const map = new Map<number, Record<string, number>>();
  laps.forEach((l) => {
    if (!map.has(l.lap)) map.set(l.lap, { lap: l.lap });
    map.get(l.lap)![l.driver] = l[key];
  });
  return Array.from(map.values()).sort((a, b) => a.lap - b.lap);
}

const darkTooltip = {
  backgroundColor: "rgba(20,20,24,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#F5F5F7",
  fontSize: 12,
  backdropFilter: "blur(12px)",
} as const;

function ResultsTab({
  loading,
  error,
  onRetry,
  results,
}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  results: {
    position: number;
    driver: Driver;
    grid: number;
    points: number;
    fastestLap: boolean;
    time?: string;
    status: string;
  }[];
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (error) return <ErrorNote message="Results unavailable." onRetry={onRetry} />;
  if (results.length === 0)
    return <p className="text-sm text-muted-foreground">No results yet — race is upcoming.</p>;
  return (
    <GlassCard className="p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Pos</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Grid</th>
              <th className="px-4 py-3 text-right">Pts</th>
              <th className="px-4 py-3 text-right">Time / Status</th>
              <th className="px-4 py-3 text-right">Fastest Lap</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.driver.code} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 font-display text-lg font-bold">{r.position}</td>
                <td className="px-4 py-3">
                  <DriverChip driver={r.driver} />
                </td>
                <td className="px-4 py-3 font-num text-muted-foreground">P{r.grid}</td>
                <td className="px-4 py-3 text-right font-num">{r.points}</td>
                <td className="px-4 py-3 text-right font-num text-muted-foreground">
                  {r.time ?? r.status}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.fastestLap && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      FL
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
