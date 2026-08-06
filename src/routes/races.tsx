import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ExternalLink } from "lucide-react";
import { EyebrowRed, SectionHeader } from "@/components/f1/primitives";
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

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <SectionHeader eyebrow="Chaos Archive" title="Top 50 Craziest Races" />
      <p
        className="-mt-4 mb-6 max-w-xl text-sm leading-relaxed"
        style={{ color: "oklch(0.56 0.012 255)" }}
      >
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
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <RaceCard key={r.id} race={r} onOpen={() => setOpenId(r.id)} />
          ))}
          {visible.length === 0 && (
            <div
              className="col-span-full py-12 text-center text-sm"
              style={{ color: "oklch(0.52 0.010 255)" }}
            >
              No races match those filters.
            </div>
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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
          style={{ color: "oklch(0.50 0.010 255)" }}
        />
        <input
          value={props.query}
          onChange={(e) => props.setQuery(e.target.value)}
          placeholder="Search by race or circuit..."
          className="w-full py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 8%)",
            borderRadius: "0.375rem",
          }}
        />
        {props.query && (
          <button
            onClick={() => props.setQuery("")}
            aria-label="Clear search"
            className="absolute inset-y-0 right-0 flex items-center px-3 transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.50 0.010 255)" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Decade + sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Decade tabs */}
        <div
          className="flex flex-wrap gap-0.5 p-0.5"
          style={{
            background: "oklch(0.14 0.005 255)",
            border: "1px solid oklch(1 0 0 / 8%)",
            borderRadius: "0.375rem",
          }}
        >
          {decades.map((d) => (
            <button
              key={d}
              onClick={() => props.setDecade(d)}
              className="px-3 py-1 font-display text-xs font-bold uppercase transition-colors"
              style={{
                background: props.decade === d ? "oklch(0.60 0.245 27)" : "transparent",
                color: props.decade === d ? "white" : "oklch(0.52 0.010 255)",
                borderRadius: "0.25rem",
                letterSpacing: "0.06em",
              }}
            >
              {d === "all" ? "All" : d}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={props.sort}
          onChange={(e) => props.setSort(e.target.value as SortKey)}
          className="py-1.5 px-3 text-xs font-display font-bold uppercase text-foreground focus:outline-none"
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 8%)",
            borderRadius: "0.375rem",
            letterSpacing: "0.06em",
          }}
        >
          <option value="chaos">Sort: Chaos ↓</option>
          <option value="year_desc">Sort: Newest</option>
          <option value="year_asc">Sort: Oldest</option>
        </select>
      </div>
    </div>
  );
}

function RaceCard({ race, onOpen }: { race: CrazyRace; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden text-left transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderRadius: "0.5rem",
      }}
    >
      {/* Hero area — year watermark + race name */}
      <div
        className="relative flex flex-col justify-between overflow-hidden p-5"
        style={{
          minHeight: "9rem",
          background: `linear-gradient(140deg, oklch(0.10 0.004 255) 0%, oklch(0.18 0.006 255) 100%)`,
          borderBottom: "1px solid oklch(1 0 0 / 6%)",
        }}
      >
        {/* Giant year watermark */}
        <div
          className="pointer-events-none absolute -right-3 -bottom-5 font-display font-black select-none leading-none"
          style={{
            fontSize: "7rem",
            color: "oklch(1 0 0 / 0.05)",
          }}
        >
          {race.year}
        </div>

        {/* Chaos badge — diagonal tag style */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="font-num text-3xl font-black leading-none"
            style={{ color: "oklch(0.94 0.003 255)" }}
          >
            {race.year}
          </span>
          <ChaosBar rating={race.chaosRating} />
        </div>

        {/* Race name */}
        <div
          className="relative mt-4 font-display font-black uppercase leading-tight"
          style={{ fontSize: "1.25rem" }}
        >
          {race.raceName}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <EyebrowRed>{race.circuit}</EyebrowRed>
        <p
          className="line-clamp-3 text-sm leading-relaxed"
          style={{ color: "oklch(0.56 0.012 255)" }}
        >
          {race.summary}
        </p>
        <div
          className="mt-auto pt-1 font-display text-xs font-bold uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.08em" }}
        >
          Watch highlights →
        </div>
      </div>
    </button>
  );
}

function ChaosBar({ rating }: { rating: number }) {
  const filled = rating;
  const segments = 10;
  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="font-num text-xs font-bold"
        style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.06em" }}
      >
        CHAOS {rating}/10
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="h-1 w-2.5 rounded-sm"
            style={{
              background: i < filled ? "oklch(0.60 0.245 27)" : "oklch(1 0 0 / 0.08)",
            }}
          />
        ))}
      </div>
    </div>
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
  const openUrl =
    race.youtubeUrl ??
    `https://www.youtube.com/results?search_query=${encodeURIComponent(race.youtubeQuery)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "oklch(0.08 0.003 255 / 0.88)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden"
        style={{
          background: "oklch(0.155 0.006 255)",
          border: "1px solid oklch(1 0 0 / 10%)",
          borderRadius: "0.75rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top red bar */}
        <div
          className="h-[3px]"
          style={{ background: "linear-gradient(90deg, oklch(0.60 0.245 27), transparent)" }}
        />

        <button
          onClick={onClose}
          className="absolute right-3 top-5 z-10 rounded p-1.5 transition-colors hover:bg-white/10"
          style={{ border: "1px solid oklch(1 0 0 / 10%)" }}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Video embed */}
        <div className="aspect-video w-full bg-black">
          <iframe
            src={embedSrc}
            title={`${race.year} ${race.raceName} highlights`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <EyebrowRed>
                {race.circuit} · {race.year}
              </EyebrowRed>
              <h3
                className="mt-1.5 font-display font-black uppercase"
                style={{ fontSize: "1.5rem", lineHeight: 1.1 }}
              >
                {race.raceName}
              </h3>
            </div>
            <ChaosBar rating={race.chaosRating} />
          </div>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "oklch(0.58 0.012 255)" }}>
            {race.summary}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onClose}
              className="font-display text-xs font-bold uppercase px-4 py-2 transition-colors hover:bg-white/10"
              style={{
                background: "oklch(1 0 0 / 6%)",
                border: "1px solid oklch(1 0 0 / 10%)",
                borderRadius: "0.375rem",
                letterSpacing: "0.08em",
              }}
            >
              ← Back
            </button>
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase px-4 py-2 text-white transition-all hover:brightness-110"
              style={{
                background: "oklch(0.60 0.245 27)",
                borderRadius: "0.375rem",
                letterSpacing: "0.08em",
              }}
            >
              Open on YouTube <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
