import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ExternalLink } from "lucide-react";
import { Eyebrow, GlassCard, SectionHeader } from "@/components/f1/primitives";
import { Skeleton } from "@/components/f1/skeleton";
import racesData from "@/data/craziestRaces.json";

type CrazyRace = {
  id: string;
  year: number;
  raceName: string;
  circuit: string;
  chaosRating: number;
  summary: string;
  youtubeQuery: string;
  youtubeUrl?: string;
};

const ALL_RACES = racesData as CrazyRace[];

async function loadRaces(): Promise<CrazyRace[]> {
  // Simulated async load to reuse the app's skeleton pattern.
  await new Promise((r) => setTimeout(r, 250));
  return ALL_RACES;
}

export const Route = createFileRoute("/races")({
  head: () => ({
    meta: [
      { title: "Top 50 Craziest Races · f1Bidda" },
      {
        name: "description",
        content:
          "Fifty of the wildest Formula 1 races ever — rain, red flags, safety cars and last-lap drama, curated with chaos ratings and video highlights.",
      },
      { property: "og:title", content: "Top 50 Craziest Races · f1Bidda" },
      {
        property: "og:description",
        content: "The 50 most chaotic Formula 1 races of all time, with video and chaos ratings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RacesPage,
});

type Decade = "all" | "1970s" | "1980s" | "1990s" | "2000s" | "2010s" | "2020s";
type SortKey = "chaos" | "year_desc" | "year_asc";

function decadeOf(year: number): Decade {
  if (year < 1980) return "1970s";
  if (year < 1990) return "1980s";
  if (year < 2000) return "1990s";
  if (year < 2010) return "2000s";
  if (year < 2020) return "2010s";
  return "2020s";
}

function RacesPage() {
  const racesQ = useQuery({
    queryKey: ["crazy-races"],
    queryFn: loadRaces,
    staleTime: Infinity,
  });

  const [query, setQuery] = useState("");
  const [decade, setDecade] = useState<Decade>("all");
  const [sort, setSort] = useState<SortKey>("chaos");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const list = (racesQ.data ?? []).filter((r) => {
      if (decade !== "all" && decadeOf(r.year) !== decade) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        r.raceName.toLowerCase().includes(q) ||
        r.circuit.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q)
      );
    });
    const sorted = [...list];
    if (sort === "chaos") sorted.sort((a, b) => b.chaosRating - a.chaosRating);
    if (sort === "year_desc") sorted.sort((a, b) => b.year - a.year);
    if (sort === "year_asc") sorted.sort((a, b) => a.year - b.year);
    return sorted;
  }, [racesQ.data, query, decade, sort]);

  const openRace = openId ? (ALL_RACES.find((r) => r.id === openId) ?? null) : null;

  useEffect(() => {
    if (!openRace) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openRace]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <SectionHeader eyebrow="Chaos Archive" title="Top 50 Craziest Races" />
      <p className="-mt-4 mb-2 max-w-2xl text-sm text-muted-foreground">
        Rain masterclasses, red-flag pileups, last-corner championship swings — the races that made
        Formula 1.
      </p>

      <FilterBar
        query={query}
        setQuery={setQuery}
        decade={decade}
        setDecade={setDecade}
        sort={sort}
        setSort={setSort}
      />

      {racesQ.isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <RaceCard key={r.id} race={r} onOpen={() => setOpenId(r.id)} />
          ))}
          {visible.length === 0 && (
            <GlassCard className="col-span-full text-center text-sm text-muted-foreground">
              No races match those filters.
            </GlassCard>
          )}
        </div>
      )}

      {openRace && <RaceModal race={openRace} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function FilterBar(props: {
  query: string;
  setQuery: (s: string) => void;
  decade: Decade;
  setDecade: (d: Decade) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
}) {
  const decades: Decade[] = ["all", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
  return (
    <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={props.query}
          onChange={(e) => props.setQuery(e.target.value)}
          placeholder="Search by circuit or driver..."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          {decades.map((d) => (
            <button
              key={d}
              onClick={() => props.setDecade(d)}
              className={
                "rounded-md px-3 py-1 text-xs font-display uppercase tracking-widest transition-colors " +
                (props.decade === d
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {d === "all" ? "All" : d}
            </button>
          ))}
        </div>
        <select
          value={props.sort}
          onChange={(e) => props.setSort(e.target.value as SortKey)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-display uppercase tracking-widest text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="chaos">Sort: Chaos</option>
          <option value="year_desc">Sort: Year ↓</option>
          <option value="year_asc">Sort: Year ↑</option>
        </select>
      </div>
    </div>
  );
}

function RaceCard({ race, onOpen }: { race: CrazyRace; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="glass-card glass-card-hover group flex flex-col overflow-hidden p-0 text-left"
    >
      <div
        className="relative aspect-video w-full overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(225,6,0,0.35), rgba(10,10,11,0.9)), radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), transparent 60%)",
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="font-num text-4xl font-black tracking-tight text-white/90">
              {race.year}
            </span>
            <ChaosBadge rating={race.chaosRating} />
          </div>
          <div className="font-display text-2xl font-bold uppercase leading-tight tracking-wide text-white">
            {race.raceName}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Eyebrow>{race.circuit}</Eyebrow>
        <p className="line-clamp-3 text-sm text-muted-foreground">{race.summary}</p>
        <div className="mt-auto pt-2 text-xs font-display uppercase tracking-widest text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Watch highlights →
        </div>
      </div>
    </button>
  );
}

function ChaosBadge({ rating }: { rating: number }) {
  return (
    <span className="rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 font-num text-xs font-semibold text-primary">
      CHAOS {rating}/10
    </span>
  );
}

function getVideoId(url: string): string | null {
  const m = url.match(/youtu\.be\/([^?&]+)/) ?? url.match(/[?&]v=([^&]+)/);
  return m ? m[1] : null;
}

function RaceModal({ race, onClose }: { race: CrazyRace; onClose: () => void }) {
  const videoId = race.youtubeUrl ? getVideoId(race.youtubeUrl) : null;
  const embedSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
    : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(race.youtubeQuery)}`;
  const openUrl = race.youtubeUrl ??
    `https://www.youtube.com/results?search_query=${encodeURIComponent(race.youtubeQuery)}`;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass-card relative w-full max-w-3xl overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-background/80 p-1.5 text-foreground hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="aspect-video w-full bg-black">
          <iframe
            src={embedSrc}
            title={`${race.year} ${race.raceName} highlights`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
        <div className="p-6">
          <Eyebrow>
            {race.circuit} · {race.year}
          </Eyebrow>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h3 className="font-display text-2xl font-bold uppercase tracking-wide">
              {race.raceName}
            </h3>
            <ChaosBadge rating={race.chaosRating} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{race.summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-display uppercase tracking-widest hover:bg-white/10"
            >
              ← Back to list
            </button>
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-display uppercase tracking-widest text-white hover:bg-primary/90"
            >
              Open on YouTube <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
