import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  X,
  MessageSquareQuote,
  Volume2,
  Radio,
  Sparkles,
  Filter,
  ChevronRight,
  Tag,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { EyebrowRed, SectionHeader } from "@/components/f1/primitives";
import { ErrorNote } from "@/components/f1/skeleton";
import f1NewsData from "@/data/f1NewsData.json";
import { getHDDriverPhoto } from "@/lib/f1-assets";

export type NewsItem = {
  id: string;
  title: string;
  subtitle: string;
  category: "Driver Quotes" | "Team Radio & Press" | "Technical Upgrades" | "Paddock News" | "Stewards & Regulations";
  date: string;
  speaker: string;
  speakerCode?: string;
  speakerRole: string;
  speakerTeam: string;
  teamColor?: string;
  quote: string;
  quoteContext: string;
  summary: string;
  fullArticle: string;
  tags: string[];
  sentiment?: string;
  featured?: boolean;
  externalUrl?: string;
  imageUrl?: string;
};

const STATIC_NEWS = f1NewsData as NewsItem[];

const CATEGORIES = [
  "All",
  "Driver Quotes",
  "Team Radio & Press",
  "Technical Upgrades",
  "Paddock News",
  "Stewards & Regulations",
] as const;

// Live RSS Fetcher — Updates daily automatically
async function fetchLiveF1News(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.skysports.com%2Frss%2F12433"
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== "ok" || !Array.isArray(data.items)) return [];

    return data.items.map((item: any, idx: number) => {
      const title = item.title || "F1 News Update";
      const pubDate = item.pubDate ? item.pubDate.split(" ")[0] : new Date().toISOString().split("T")[0];
      const desc = (item.description || item.content || "").replace(/<[^>]*>?/gm, "").trim();
      const link = item.link || "#";
      const image = item.enclosure?.link || item.thumbnail || "";

      let speaker = "F1 Media Wire";
      let speakerCode = "";
      let speakerTeam = "Formula 1";
      let teamColor = "oklch(0.60 0.245 27)";

      if (/norris/i.test(title + desc)) {
        speaker = "Lando Norris";
        speakerCode = "norris";
        speakerTeam = "McLaren";
        teamColor = "#FF8000";
      } else if (/verstappen/i.test(title + desc)) {
        speaker = "Max Verstappen";
        speakerCode = "verstappen";
        speakerTeam = "Red Bull";
        teamColor = "#3671C6";
      } else if (/hamilton/i.test(title + desc)) {
        speaker = "Lewis Hamilton";
        speakerCode = "hamilton";
        speakerTeam = "Ferrari";
        teamColor = "#E80020";
      } else if (/russell/i.test(title + desc)) {
        speaker = "George Russell";
        speakerCode = "russell";
        speakerTeam = "Mercedes";
        teamColor = "#27F4D2";
      } else if (/leclerc/i.test(title + desc)) {
        speaker = "Charles Leclerc";
        speakerCode = "leclerc";
        speakerTeam = "Ferrari";
        teamColor = "#E80020";
      } else if (/piastri/i.test(title + desc)) {
        speaker = "Oscar Piastri";
        speakerCode = "piastri";
        speakerTeam = "McLaren";
        teamColor = "#FF8000";
      } else if (/alonso/i.test(title + desc)) {
        speaker = "Fernando Alonso";
        speakerCode = "alonso";
        speakerTeam = "Aston Martin";
        teamColor = "#229971";
      } else if (/antonelli/i.test(title + desc)) {
        speaker = "Kimi Antonelli";
        speakerCode = "antonelli";
        speakerTeam = "Mercedes";
        teamColor = "#27F4D2";
      }

      return {
        id: `rss-${idx}-${item.guid || idx}`,
        title: title,
        subtitle: desc.slice(0, 160) + (desc.length > 160 ? "..." : ""),
        category: "Paddock News",
        date: pubDate,
        speaker: speaker,
        speakerCode: speakerCode,
        speakerRole: `${speakerTeam} Daily Press Wire`,
        speakerTeam: speakerTeam,
        teamColor: teamColor,
        quote: desc.length > 20 ? desc.slice(0, 220) + "..." : title,
        quoteContext: `Sky Sports F1 Live Wire · ${pubDate}`,
        summary: desc,
        fullArticle: desc,
        tags: ["Live News", "Daily Update", speakerTeam],
        sentiment: "Breaking",
        featured: idx === 0,
        externalUrl: link,
        imageUrl: image,
      };
    });
  } catch (err) {
    console.error("Live RSS fetch failed, falling back to static quotes", err);
    return [];
  }
}

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "F1 News Highlights & Live Driver Quotes · f1Bidda" },
      {
        name: "description",
        content:
          "Live auto-updating Formula 1 news highlights, daily driver quotes, radio transcripts, and team principal statements.",
      },
      { property: "og:title", content: "F1 News Highlights & Live Driver Quotes · f1Bidda" },
      {
        property: "og:description",
        content: "What they spoke in the paddock: radio transcripts, press conference quotes and daily F1 news.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  // TanStack Query with automatic 15-minute stale-time (auto updates daily)
  const { data: liveNews = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["live-f1-news"],
    queryFn: fetchLiveF1News,
    staleTime: 15 * 60_000,
  });

  // Combine live news with curated paddock quotes
  const allNewsItems = useMemo(() => {
    if (liveNews.length > 0) {
      // Merge live daily news at top, followed by curated quote highlights
      const liveIds = new Set(liveNews.map((n) => n.id));
      const filteredCurated = STATIC_NEWS.filter((n) => !liveIds.has(n.id));
      return [...liveNews, ...filteredCurated];
    }
    return STATIC_NEWS;
  }, [liveNews]);

  const featuredNews = useMemo(() => {
    return allNewsItems.find((n) => n.featured) || allNewsItems[0];
  }, [allNewsItems]);

  const filteredNews = useMemo(() => {
    let result = allNewsItems;

    if (selectedCategory !== "All") {
      result = result.filter((n) => n.category === selectedCategory);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.speaker.toLowerCase().includes(q) ||
          n.speakerTeam.toLowerCase().includes(q) ||
          n.quote.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allNewsItems, query, selectedCategory]);

  const activeModalNews = selectedNewsId
    ? allNewsItems.find((n) => n.id === selectedNewsId) ?? null
    : null;

  useEffect(() => {
    if (!activeModalNews) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNewsId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeModalNews]);

  const toggleAudioSimulation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingAudio === id) {
      setIsPlayingAudio(null);
    } else {
      setIsPlayingAudio(id);
    }
  };

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <SectionHeader
        eyebrow="Paddock Intel & Driver Transcripts"
        title="F1 News & Driver Quotes"
      />

      {/* Intro header note & Live Sync Indicator */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "oklch(0.56 0.012 255)" }}>
          Live daily news wire, post-race press conference highlights, team radio transcripts, and official
          statements from Formula 1 drivers and team principals.
        </p>

        {/* Live Auto-Update Badge */}
        <div className="flex items-center gap-2 self-start shrink-0">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{
              background: "oklch(0.60 0.245 27 / 0.12)",
              border: "1px solid oklch(0.60 0.245 27 / 0.3)",
            }}
          >
            <Radio className="h-4 w-4 animate-pulse" style={{ color: "oklch(0.60 0.245 27)" }} />
            <span className="font-num text-xs font-bold uppercase tracking-wider text-foreground">
              {liveNews.length > 0 ? "LIVE RSS · AUTO-UPDATED DAILY" : "PADDOCK QUOTES WIRE"}
            </span>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded transition-colors hover:bg-white/10 text-muted-foreground hover:text-foreground"
            title="Refresh news feed"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* Featured Breaking News Hero Card */}
      {featuredNews && !query && selectedCategory === "All" && (
        <div className="mb-10">
          <div
            className="group relative overflow-hidden transition-all duration-300 hover:border-red-500/30"
            style={{
              background: "linear-gradient(135deg, oklch(0.16 0.008 255), oklch(0.12 0.005 255))",
              border: "1px solid oklch(0.60 0.245 27 / 0.3)",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
            }}
          >
            {/* Top accent gradient bar */}
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, ${featuredNews.teamColor || "oklch(0.60 0.245 27)"}, transparent)`,
              }}
            />

            <div className="p-6 sm:p-8">
              {/* Header tags */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center gap-1.5 text-[11px] font-bold font-display uppercase tracking-wider px-2.5 py-1 rounded"
                    style={{
                      background: "oklch(0.60 0.245 27 / 0.2)",
                      color: "oklch(0.60 0.245 27)",
                      border: "1px solid oklch(0.60 0.245 27 / 0.4)",
                    }}
                  >
                    <Sparkles className="h-3 w-3" /> Top Headline
                  </span>
                  <span
                    className="text-xs font-display uppercase font-semibold px-2.5 py-1 rounded"
                    style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.65 0.01 255)" }}
                  >
                    {featuredNews.category}
                  </span>
                </div>
                <span className="font-num text-xs text-muted-foreground">{featuredNews.date}</span>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <h2 className="font-display font-black text-xl sm:text-2xl lg:text-3xl uppercase leading-tight text-foreground">
                    {featuredNews.title}
                  </h2>

                  {/* Quote block */}
                  <div
                    className="relative p-4 sm:p-5 rounded-lg border my-2"
                    style={{
                      background: "oklch(0.10 0.003 255 / 0.6)",
                      borderColor: "oklch(1 0 0 / 8%)",
                    }}
                  >
                    <MessageSquareQuote
                      className="absolute right-3 top-3 h-8 w-8 opacity-10 pointer-events-none"
                      style={{ color: featuredNews.teamColor || "oklch(0.60 0.245 27)" }}
                    />
                    <p className="text-sm sm:text-base italic font-medium leading-relaxed text-foreground/90">
                      &ldquo;{featuredNews.quote}&rdquo;
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs font-num" style={{ color: "oklch(0.55 0.01 255)" }}>
                      <span>📍 {featuredNews.quoteContext}</span>
                      {featuredNews.sentiment && (
                        <span className="font-semibold text-primary">Tone: {featuredNews.sentiment}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "oklch(0.60 0.01 255)" }}>
                    {featuredNews.subtitle}
                  </p>
                </div>

                {/* Speaker profile column */}
                <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center text-center lg:text-right border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-6 border-white/5">
                  <div className="relative mb-3">
                    {featuredNews.imageUrl ? (
                      <img
                        src={featuredNews.imageUrl}
                        alt=""
                        className="h-28 w-44 object-cover rounded-md border"
                        style={{ borderColor: featuredNews.teamColor || "oklch(0.60 0.245 27)" }}
                      />
                    ) : featuredNews.speakerCode && getHDDriverPhoto(featuredNews.speakerCode) ? (
                      <img
                        src={getHDDriverPhoto(featuredNews.speakerCode)}
                        alt={featuredNews.speaker}
                        className="h-24 w-24 object-contain rounded-full border-2 p-1"
                        style={{
                          borderColor: featuredNews.teamColor || "oklch(0.60 0.245 27)",
                          background: "oklch(0.12 0.004 255)",
                        }}
                      />
                    ) : (
                      <div
                        className="h-20 w-20 rounded-full flex items-center justify-center font-display font-bold text-xl uppercase border-2"
                        style={{
                          borderColor: featuredNews.teamColor || "oklch(0.60 0.245 27)",
                          background: "oklch(0.20 0.01 255)",
                        }}
                      >
                        {featuredNews.speaker.substring(0, 2)}
                      </div>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-base uppercase text-foreground">
                    {featuredNews.speaker}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{featuredNews.speakerRole}</p>

                  <button
                    onClick={() => setSelectedNewsId(featuredNews.id)}
                    className="mt-4 inline-flex items-center gap-2 font-display text-xs font-bold uppercase px-4 py-2.5 rounded transition-all hover:brightness-125"
                    style={{
                      background: "oklch(0.60 0.245 27)",
                      color: "#ffffff",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Full Statement &amp; Article <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <span className="text-xs font-display font-bold uppercase mr-1 flex items-center gap-1 text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded px-3 py-1.5 font-display text-xs font-bold uppercase transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
                style={{ letterSpacing: "0.05em" }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full max-w-xs shrink-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              style={{ color: "oklch(0.50 0.010 255)" }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search driver, quote, topic…"
              className="w-full py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{
                background: "oklch(0.155 0.006 255)",
                border: "1px solid oklch(1 0 0 / 8%)",
                borderRadius: "0.375rem",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: "oklch(0.50 0.010 255)" }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {query && (
          <div className="text-xs text-muted-foreground">
            Found {filteredNews.length} news entry matching &ldquo;{query}&rdquo;
          </div>
        )}
      </div>

      {/* News Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.map((news) => (
          <NewsCard
            key={news.id}
            news={news}
            isPlaying={isPlayingAudio === news.id}
            onToggleAudio={(e) => toggleAudioSimulation(news.id, e)}
            onOpen={() => setSelectedNewsId(news.id)}
          />
        ))}
      </div>

      {filteredNews.length === 0 && (
        <ErrorNote message={`No news or driver quotes found matching "${query}".`} />
      )}

      {/* News Detail Modal */}
      {activeModalNews && (
        <NewsModal news={activeModalNews} onClose={() => setSelectedNewsId(null)} />
      )}
    </main>
  );
}

function NewsCard({
  news,
  isPlaying,
  onToggleAudio,
  onOpen,
}: {
  news: NewsItem;
  isPlaying: boolean;
  onToggleAudio: (e: React.MouseEvent) => void;
  onOpen: () => void;
}) {
  const driverPhoto = news.speakerCode ? getHDDriverPhoto(news.speakerCode) : "";

  return (
    <div
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden text-left transition-all duration-200 hover:-translate-y-1 cursor-pointer"
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderRadius: "0.5rem",
      }}
    >
      {/* Left accent team color stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: news.teamColor || "oklch(0.60 0.245 27)" }}
      />

      {news.imageUrl && (
        <div className="h-40 w-full overflow-hidden bg-black/40 relative">
          <img
            src={news.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
      )}

      <div className="p-5 pl-6 flex flex-1 flex-col justify-between space-y-4">
        {/* Card Header */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className="text-[10px] font-display font-bold uppercase px-2 py-0.5 rounded"
              style={{
                background: "oklch(1 0 0 / 5%)",
                border: "1px solid oklch(1 0 0 / 8%)",
                color: "oklch(0.60 0.245 27)",
              }}
            >
              {news.category}
            </span>
            <span className="font-num text-[11px]" style={{ color: "oklch(0.50 0.01 255)" }}>
              {news.date}
            </span>
          </div>

          {/* Speaker info */}
          <div className="flex items-center gap-3 mb-3">
            {driverPhoto ? (
              <img
                src={driverPhoto}
                alt=""
                aria-hidden
                className="h-10 w-10 object-contain rounded-full border"
                style={{
                  borderColor: news.teamColor || "oklch(0.60 0.245 27)",
                  background: "oklch(0.12 0.004 255)",
                }}
              />
            ) : (
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center font-display font-bold text-xs uppercase"
                style={{
                  background: "oklch(0.20 0.01 255)",
                  color: news.teamColor || "#ffffff",
                }}
              >
                {news.speaker.substring(0, 2)}
              </div>
            )}
            <div>
              <h4 className="font-display font-bold text-sm text-foreground uppercase leading-tight">
                {news.speaker}
              </h4>
              <p className="text-[11px] line-clamp-1" style={{ color: "oklch(0.52 0.01 255)" }}>
                {news.speakerRole}
              </p>
            </div>
          </div>

          {/* Article Title */}
          <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug mb-3">
            {news.title}
          </h3>

          {/* Quote Speech Bubble */}
          <div
            className="p-3 rounded text-xs italic leading-relaxed border relative"
            style={{
              background: "oklch(0.125 0.004 255)",
              borderColor: "oklch(1 0 0 / 5%)",
              color: "oklch(0.80 0.005 255)",
            }}
          >
            &ldquo;{news.quote}&rdquo;
          </div>
        </div>

        {/* Audio simulator bar & tags */}
        <div className="space-y-3 pt-2">
          {/* Simulated Audio Bar */}
          <div
            onClick={onToggleAudio}
            className="flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors hover:bg-white/10"
            style={{
              background: "oklch(0.12 0.004 255)",
              border: "1px solid oklch(1 0 0 / 6%)",
            }}
          >
            <div className="flex items-center gap-2">
              <Volume2
                className={`h-3.5 w-3.5 ${isPlaying ? "text-primary animate-pulse" : "text-muted-foreground"}`}
              />
              <span className="font-num text-[11px] uppercase tracking-wide">
                {isPlaying ? "Playing Radio Clip..." : "Radio Audio Clip"}
              </span>
            </div>

            {/* Soundwave bars */}
            <div className="flex items-center gap-0.5">
              {[40, 70, 30, 90, 50, 80, 40].map((h, idx) => (
                <span
                  key={idx}
                  className="w-0.5 bg-primary rounded-full transition-all duration-300"
                  style={{
                    height: isPlaying ? `${Math.floor(Math.random() * 12) + 4}px` : `${h * 0.12}px`,
                    opacity: isPlaying ? 1 : 0.4,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {news.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-num px-2 py-0.5 rounded"
                style={{
                  background: "oklch(1 0 0 / 4%)",
                  color: "oklch(0.55 0.01 255)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Card footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-display font-bold uppercase text-primary">
            <span>Read Full Statement →</span>
            <span className="font-num text-[10px] font-normal text-muted-foreground">{news.quoteContext.split("·")[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsModal({ news, onClose }: { news: NewsItem; onClose: () => void }) {
  const driverPhoto = news.speakerCode ? getHDDriverPhoto(news.speakerCode) : "";
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "oklch(0.08 0.003 255 / 0.88)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto"
        style={{
          background: "oklch(0.155 0.006 255)",
          border: "1px solid oklch(1 0 0 / 10%)",
          borderRadius: "0.75rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div
          className="h-[3px] w-full rounded-t-[0.75rem]"
          style={{ background: `linear-gradient(90deg, ${news.teamColor || "oklch(0.60 0.245 27)"}, transparent)` }}
        />

        <div className="p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute right-4 top-6 rounded p-1.5 transition-colors hover:bg-white/10"
            style={{ border: "1px solid oklch(1 0 0 / 10%)" }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-start gap-4 mb-5">
            {driverPhoto ? (
              <img
                src={driverPhoto}
                alt=""
                className="h-16 w-16 object-contain rounded-full border-2 shrink-0"
                style={{
                  borderColor: news.teamColor || "oklch(0.60 0.245 27)",
                  background: "oklch(0.12 0.004 255)",
                }}
              />
            ) : (
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center font-display font-bold text-xl uppercase border-2 shrink-0"
                style={{
                  borderColor: news.teamColor || "oklch(0.60 0.245 27)",
                  background: "oklch(0.20 0.01 255)",
                }}
              >
                {news.speaker.substring(0, 2)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                <EyebrowRed>{news.speakerTeam}</EyebrowRed>
                <span className="text-xs text-muted-foreground">· {news.date}</span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl uppercase leading-tight text-foreground">
                {news.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">{news.speaker} — {news.speakerRole}</p>
            </div>
          </div>

          {/* Quote Callout Box */}
          <div
            className="p-5 rounded-lg border my-6 relative overflow-hidden"
            style={{
              background: "oklch(0.125 0.004 255)",
              borderColor: news.teamColor || "oklch(0.60 0.245 27 / 0.4)",
            }}
          >
            <MessageSquareQuote
              className="absolute right-4 top-4 h-12 w-12 opacity-10 pointer-events-none text-primary"
            />
            <div className="text-xs font-display uppercase tracking-wider font-bold text-primary mb-2 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5" /> What They Spoke
            </div>
            <p className="text-base sm:text-lg italic font-medium leading-relaxed text-foreground">
              &ldquo;{news.quote}&rdquo;
            </p>

            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-xs font-num text-muted-foreground gap-2">
              <span>📍 {news.quoteContext}</span>

              {/* Audio Playback Controls */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-3 py-1 rounded transition-colors"
                style={{
                  background: isPlaying ? "oklch(0.60 0.245 27)" : "oklch(1 0 0 / 6%)",
                  color: isPlaying ? "#ffffff" : "oklch(0.90 0.005 255)",
                }}
              >
                <Volume2 className={`h-3.5 w-3.5 ${isPlaying ? "animate-bounce" : ""}`} />
                <span className="font-bold uppercase text-[10px]">
                  {isPlaying ? "Pause Audio" : "Listen to Radio Clip"}
                </span>
              </button>
            </div>
          </div>

          {/* Full Article Text */}
          <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
            <h4 className="font-display font-bold uppercase text-xs tracking-wider text-muted-foreground">
              Paddock Breakdown &amp; Context
            </h4>
            {news.fullArticle.split("\n\n").map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          {/* External Article Link */}
          {news.externalUrl && news.externalUrl !== "#" && (
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Sourced from Sky Sports F1
              </span>
              <a
                href={news.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase text-primary hover:underline"
              >
                Read Source Article <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Tags */}
          <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-display font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" /> Tags:
            </span>
            {news.tags.map((t) => (
              <span
                key={t}
                className="text-xs font-num px-2.5 py-1 rounded"
                style={{
                  background: "oklch(1 0 0 / 5%)",
                  border: "1px solid oklch(1 0 0 / 8%)",
                  color: "oklch(0.75 0.01 255)",
                }}
              >
                #{t}
              </span>
            ))}
          </div>

          {/* Close Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="font-display text-xs font-bold uppercase px-5 py-2.5 rounded transition-colors hover:bg-white/10"
              style={{
                background: "oklch(1 0 0 / 6%)",
                border: "1px solid oklch(1 0 0 / 10%)",
              }}
            >
              Close Statement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
