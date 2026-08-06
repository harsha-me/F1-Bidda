import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  X,
  Filter,
  ChevronRight,
  Tag,
  RefreshCw,
  ExternalLink,
  Radio,
  Rss,
  AlertCircle,
  Newspaper,
  Zap,
  Settings,
  Users,
  Shield,
  Mic2,
} from "lucide-react";
import { SectionHeader } from "@/components/f1/primitives";
import { ErrorNote, Skeleton } from "@/components/f1/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NewsCategory =
  | "All"
  | "Driver Quotes"
  | "Team Radio & Press"
  | "Technical Upgrades"
  | "Paddock News"
  | "Stewards & Regulations";

export type RealNewsItem = {
  id: string;
  title: string;
  excerpt: string; // 2-3 sentence plain-text excerpt, no invented quotes
  category: Exclude<NewsCategory, "All">;
  date: string; // "YYYY-MM-DD"
  sourceName: string; // e.g. "Autosport"
  sourceUrl: string; // outlet homepage
  articleUrl: string; // direct link to article
  imageUrl?: string;
  tags: string[];
  teamColor?: string; // accent color if a team is identified
  featured?: boolean;
};

// ---------------------------------------------------------------------------
// Category / team keyword mapping (NO fabricated content — purely from title/excerpt)
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<Exclude<NewsCategory, "All">, RegExp> = {
  "Driver Quotes":
    /\b(says|reveals|admits|explains|responds|interview|statement|quote|speaks|reacts|confident|believes|thinks|feels|claims|insists|denies|confirms)\b/i,
  "Team Radio & Press":
    /\b(radio|press conference|debrief|team principal|paddock|briefing|media|journalist|post-race|pre-race|toto|horner|vasseur|vowles|stella|szafnauer)\b/i,
  "Technical Upgrades":
    /\b(upgrade|update|aero|floor|wing|technical|development|package|cfd|wind tunnel|suspension|diffuser|sidepod|overhaul|spec|b-spec|new part)\b/i,
  "Stewards & Regulations":
    /\b(penalty|steward|investigation|regulation|fia|rule|protest|decision|reprimand|grid drop|drive-through|safety car|vsc|disqualif|appeal|review)\b/i,
  "Paddock News": /./, // catch-all — always matches
};

const TEAM_PATTERNS: Array<{ re: RegExp; color: string; team: string }> = [
  { re: /\b(norris|piastri|mclaren)\b/i, color: "#FF8000", team: "McLaren" },
  { re: /\b(verstappen|lawson|lindblad|red bull)\b/i, color: "#3671C6", team: "Red Bull" },
  { re: /\b(leclerc|hamilton|ferrari|maranello)\b/i, color: "#E80020", team: "Ferrari" },
  { re: /\b(russell|antonelli|mercedes|brackley)\b/i, color: "#27F4D2", team: "Mercedes" },
  { re: /\b(alonso|stroll|aston martin)\b/i, color: "#229971", team: "Aston Martin" },
  { re: /\b(albon|sainz|williams)\b/i, color: "#64C4FF", team: "Williams" },
  { re: /\b(hulkenberg|bortoleto|sauber|kick)\b/i, color: "#00E701", team: "Sauber" },
  { re: /\b(gasly|doohan|alpine)\b/i, color: "#FF69B4", team: "Alpine" },
  { re: /\b(tsunoda|hadjar|racing bulls|vcarb)\b/i, color: "#6692FF", team: "Racing Bulls" },
  { re: /\b(bearman|ocon|haas)\b/i, color: "#B6BABD", team: "Haas" },
];

function detectTeamColor(text: string): { color: string; team: string } | null {
  for (const { re, color, team } of TEAM_PATTERNS) {
    if (re.test(text)) return { color, team };
  }
  return null;
}

function classifyCategory(text: string): Exclude<NewsCategory, "All"> {
  const order: Array<Exclude<NewsCategory, "All">> = [
    "Stewards & Regulations",
    "Technical Upgrades",
    "Team Radio & Press",
    "Driver Quotes",
    "Paddock News",
  ];
  for (const cat of order) {
    if (CATEGORY_KEYWORDS[cat].test(text)) return cat;
  }
  return "Paddock News";
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>?/gm, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "")
    .trim();
}

function truncateExcerpt(text: string, maxLen = 280): string {
  const clean = cleanHtml(text);
  if (clean.length <= maxLen) return clean;
  const cut = clean.lastIndexOf(" ", maxLen);
  return clean.slice(0, cut > 0 ? cut : maxLen) + "…";
}

// ---------------------------------------------------------------------------
// RSS Sources
// ---------------------------------------------------------------------------

type RssSource = {
  name: string;
  url: string; // homepage
  feedUrl: string; // RSS feed URL (will be proxied via rss2json)
  color: string; // brand accent
};

const RSS_SOURCES: RssSource[] = [
  {
    name: "Autosport",
    url: "https://www.autosport.com",
    feedUrl: "https://www.autosport.com/rss/f1/news/",
    color: "#e63229",
  },
  {
    name: "Motorsport.com",
    url: "https://www.motorsport.com",
    feedUrl: "https://www.motorsport.com/rss/f1/news/",
    color: "#e40808",
  },
  {
    name: "Sky Sports F1",
    url: "https://www.skysports.com/f1",
    feedUrl: "https://www.skysports.com/rss/12433",
    color: "#0072CE",
  },
  {
    name: "BBC Sport F1",
    url: "https://www.bbc.com/sport/formula1",
    feedUrl: "https://feeds.bbci.co.uk/sport/formula1/rss.xml",
    color: "#cc0000",
  },
];

const RSS2JSON_BASE = "https://api.rss2json.com/v1/api.json?rss_url=";

async function fetchRssSource(source: RssSource): Promise<RealNewsItem[]> {
  const url = `${RSS2JSON_BASE}${encodeURIComponent(source.feedUrl)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "ok" || !Array.isArray(data.items)) throw new Error("Bad feed response");

  return data.items.map((item: Record<string, unknown>, idx: number) => {
    const title = String(item.title || "F1 News");
    const rawDesc = String(item.description || item.content || item.summary || "");
    const excerpt = truncateExcerpt(rawDesc);
    const articleUrl = String(item.link || item.guid || "#");
    const pubDate = (() => {
      const raw = String(item.pubDate || "");
      if (!raw) return new Date().toISOString().split("T")[0];
      const d = new Date(raw);
      return isNaN(d.getTime())
        ? new Date().toISOString().split("T")[0]
        : d.toISOString().split("T")[0];
    })();
    const imageUrl: string | undefined =
      ((item.enclosure as Record<string, unknown> | undefined)?.link as string | undefined) ||
      (item.thumbnail as string | undefined) ||
      (item.image as string | undefined) ||
      undefined;

    const combined = `${title} ${excerpt}`;
    const category = classifyCategory(combined);
    const team = detectTeamColor(combined);

    const tags: string[] = [];
    if (team) tags.push(team.team);
    tags.push(source.name);
    // Add up to 2 keyword tags from title
    const words = title
      .split(/\s+/)
      .filter((w) => w.length > 5)
      .slice(0, 2);
    tags.push(...words);

    return {
      id: `${source.name.toLowerCase().replace(/\W/g, "-")}-${idx}-${String(item.guid || idx).slice(-8)}`,
      title,
      excerpt: excerpt || title,
      category,
      date: pubDate,
      sourceName: source.name,
      sourceUrl: source.url,
      articleUrl,
      imageUrl: imageUrl && imageUrl.startsWith("http") ? imageUrl : undefined,
      tags: [...new Set(tags)],
      teamColor: team?.color,
      featured: idx === 0,
    } satisfies RealNewsItem;
  });
}

export async function fetchAllF1News(): Promise<RealNewsItem[]> {
  const results = await Promise.allSettled(RSS_SOURCES.map(fetchRssSource));

  const seen = new Set<string>();
  const all: RealNewsItem[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const item of result.value) {
      // Deduplicate by normalised title (first 60 chars lowercase)
      const key = item.title.toLowerCase().replace(/\W/g, " ").slice(0, 60).trim();
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(item);
    }
  }

  // Sort newest first
  all.sort((a, b) => (a.date < b.date ? 1 : -1));

  // Mark first as featured
  if (all.length > 0) all[0].featured = true;

  return all;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "F1 News Feed · f1Bidda" },
      {
        name: "description",
        content:
          "Real-time Formula 1 news aggregated from Autosport, Motorsport.com, Sky Sports F1 and BBC Sport.",
      },
      { property: "og:title", content: "F1 News Feed · f1Bidda" },
      {
        property: "og:description",
        content: "Current Formula 1 headlines sourced directly from leading motorsport outlets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsPage,
});

// ---------------------------------------------------------------------------
// Category tab config
// ---------------------------------------------------------------------------

const CATEGORIES: NewsCategory[] = [
  "All",
  "Driver Quotes",
  "Team Radio & Press",
  "Technical Upgrades",
  "Paddock News",
  "Stewards & Regulations",
];

const CATEGORY_ICONS: Record<NewsCategory, React.ElementType> = {
  All: Newspaper,
  "Driver Quotes": Mic2,
  "Team Radio & Press": Radio,
  "Technical Upgrades": Settings,
  "Paddock News": Users,
  "Stewards & Regulations": Shield,
};

// ---------------------------------------------------------------------------
// NewsPage
// ---------------------------------------------------------------------------

function NewsPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    data: newsItems = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["real-f1-news"],
    queryFn: fetchAllF1News,
    staleTime: 15 * 60_000,
    retry: 2,
  });

  const filteredNews = useMemo(() => {
    let result = newsItems;
    if (selectedCategory !== "All") {
      result = result.filter((n) => n.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.excerpt.toLowerCase().includes(q) ||
          n.sourceName.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [newsItems, query, selectedCategory]);

  const featuredNews = useMemo(
    () =>
      selectedCategory === "All" && !query
        ? (newsItems.find((n) => n.featured) ?? newsItems[0])
        : null,
    [newsItems, selectedCategory, query],
  );

  const activeModal = selectedId ? (newsItems.find((n) => n.id === selectedId) ?? null) : null;

  useEffect(() => {
    if (!activeModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeModal]);

  // Unique outlets that actually returned articles
  const activeOutlets = [...new Set(newsItems.map((n) => n.sourceName))];

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <SectionHeader
        eyebrow="Live News Aggregator"
        title="F1 News Feed"
        right={
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded transition-colors hover:bg-white/10 text-muted-foreground hover:text-foreground"
            title="Refresh news feed"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin text-primary" : ""}`} />
          </button>
        }
      />

      {/* Sub-header: description + live badge */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed" style={{ color: "oklch(0.56 0.012 255)" }}>
          Real-time Formula 1 headlines aggregated from leading motorsport outlets. All articles
          link directly to their original source — no invented content.
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{
              background: "oklch(0.60 0.245 27 / 0.12)",
              border: "1px solid oklch(0.60 0.245 27 / 0.3)",
            }}
          >
            <Rss className="h-3.5 w-3.5 animate-pulse" style={{ color: "oklch(0.60 0.245 27)" }} />
            <span className="font-num text-xs font-bold uppercase tracking-wider text-foreground">
              {isFetching
                ? "Fetching…"
                : newsItems.length > 0
                  ? `${newsItems.length} Articles · LIVE`
                  : "RSS FEED"}
            </span>
          </div>
        </div>
      </div>

      {/* Sources attribution */}
      {activeOutlets.length > 0 && (
        <div
          className="mb-6 flex flex-wrap items-center gap-2 px-3 py-2 rounded text-xs"
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 7%)",
            color: "oklch(0.55 0.01 255)",
          }}
        >
          <span
            className="font-display font-bold uppercase tracking-wide"
            style={{ color: "oklch(0.60 0.245 27)" }}
          >
            Sources:
          </span>
          {activeOutlets.map((name) => {
            const src = RSS_SOURCES.find((s) => s.name === name);
            return (
              <a
                key={name}
                href={src?.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${src?.url ?? ""}&sz=16`}
                  alt=""
                  className="h-3.5 w-3.5 rounded-sm"
                  loading="lazy"
                />
                {name}
              </a>
            );
          })}
          <span className="ml-auto text-[10px] font-num opacity-60">
            Third-party aggregated content · Updated every 15 min
          </span>
        </div>
      )}

      {/* Featured hero */}
      {featuredNews && !isLoading && (
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
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, ${featuredNews.teamColor || "oklch(0.60 0.245 27)"}, transparent)`,
              }}
            />

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center gap-1.5 text-[11px] font-bold font-display uppercase tracking-wider px-2.5 py-1 rounded"
                    style={{
                      background: "oklch(0.60 0.245 27 / 0.2)",
                      color: "oklch(0.60 0.245 27)",
                      border: "1px solid oklch(0.60 0.245 27 / 0.4)",
                    }}
                  >
                    <Zap className="h-3 w-3" /> Top Story
                  </span>
                  <CategoryBadge category={featuredNews.category} />
                </div>
                <div className="flex items-center gap-3">
                  <SourceBadge item={featuredNews} />
                  <span className="font-num text-xs text-muted-foreground">
                    {featuredNews.date}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-4">
                  <h2 className="font-display font-black text-xl sm:text-2xl lg:text-3xl uppercase leading-tight text-foreground">
                    {featuredNews.title}
                  </h2>
                  <p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: "oklch(0.72 0.008 255)" }}
                  >
                    {featuredNews.excerpt}
                  </p>
                  <a
                    href={featuredNews.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase px-4 py-2.5 rounded transition-all hover:brightness-125"
                    style={{
                      background: "oklch(0.60 0.245 27)",
                      color: "#ffffff",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Read Full Article <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {featuredNews.imageUrl && (
                  <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l pt-5 lg:pt-0 lg:pl-6 border-white/5">
                    <img
                      src={featuredNews.imageUrl}
                      alt={featuredNews.title}
                      className="w-full h-48 object-cover rounded-lg"
                      style={{
                        border: `1px solid ${featuredNews.teamColor || "oklch(1 0 0 / 10%)"}`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters + Search */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <span className="text-xs font-display font-bold uppercase mr-1 flex items-center gap-1 text-muted-foreground shrink-0">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded px-3 py-1.5 font-display text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  }`}
                  style={{ letterSpacing: "0.05em" }}
                >
                  <Icon className="h-3 w-3" />
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="relative w-full max-w-xs shrink-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              style={{ color: "oklch(0.50 0.010 255)" }}
            />
            <input
              id="news-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search headline, team, source…"
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
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex items-center px-3 transition-opacity hover:opacity-70"
                style={{ color: "oklch(0.50 0.010 255)" }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {query && (
          <div className="text-xs text-muted-foreground">
            {filteredNews.length} result{filteredNews.length !== 1 ? "s" : ""} for &ldquo;{query}
            &rdquo;
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden"
              style={{
                background: "oklch(0.155 0.006 255)",
                border: "1px solid oklch(1 0 0 / 7%)",
                borderRadius: "0.5rem",
              }}
            >
              <Skeleton className="h-40 w-full" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-3 w-32 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="max-w-lg mx-auto mt-8">
          <ErrorNote
            message="Unable to load the news feed. All RSS sources failed to respond. Check your connection and try again — no placeholder content will be shown."
            onRetry={() => refetch()}
          />
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            Sources attempted: {RSS_SOURCES.map((s) => s.name).join(", ")}
          </div>
        </div>
      )}

      {/* News grid */}
      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((news) => (
              <NewsCard key={news.id} news={news} onOpen={() => setSelectedId(news.id)} />
            ))}
          </div>

          {filteredNews.length === 0 && newsItems.length > 0 && (
            <div className="max-w-md mx-auto mt-8">
              <ErrorNote
                message={
                  query
                    ? `No articles found matching "${query}".`
                    : `No articles in the "${selectedCategory}" category yet. Try refreshing or selecting a different filter.`
                }
              />
            </div>
          )}

          {newsItems.length === 0 && !isError && (
            <div className="max-w-md mx-auto mt-8">
              <ErrorNote
                message="The feed returned no articles. Try refreshing."
                onRetry={() => refetch()}
              />
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {activeModal && <NewsModal news={activeModal} onClose={() => setSelectedId(null)} />}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Helpers: CategoryBadge, SourceBadge
// ---------------------------------------------------------------------------

function CategoryBadge({ category }: { category: Exclude<NewsCategory, "All"> }) {
  return (
    <span
      className="text-[10px] font-display font-bold uppercase px-2.5 py-1 rounded"
      style={{
        background: "oklch(1 0 0 / 5%)",
        border: "1px solid oklch(1 0 0 / 8%)",
        color: "oklch(0.60 0.245 27)",
      }}
    >
      {category}
    </span>
  );
}

function SourceBadge({ item }: { item: RealNewsItem }) {
  const src = RSS_SOURCES.find((s) => s.name === item.sourceName);
  return (
    <a
      href={src?.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 text-[10px] font-num font-semibold uppercase tracking-wide px-2 py-0.5 rounded transition-colors hover:bg-white/10"
      style={{
        background: "oklch(1 0 0 / 4%)",
        border: "1px solid oklch(1 0 0 / 7%)",
        color: "oklch(0.60 0.01 255)",
      }}
      title={`View on ${item.sourceName}`}
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${src?.url ?? ""}&sz=16`}
        alt=""
        className="h-3 w-3 rounded-sm"
        loading="lazy"
      />
      {item.sourceName}
    </a>
  );
}

// ---------------------------------------------------------------------------
// NewsCard
// ---------------------------------------------------------------------------

function NewsCard({ news, onOpen }: { news: RealNewsItem; onOpen: () => void }) {
  return (
    <article
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden text-left transition-all duration-200 hover:-translate-y-1 cursor-pointer"
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderRadius: "0.5rem",
      }}
    >
      {/* Left team-color accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: news.teamColor || "oklch(0.60 0.245 27)" }}
      />

      {/* Article image */}
      {news.imageUrl && (
        <div className="h-40 w-full overflow-hidden bg-black/40 relative shrink-0">
          <img
            src={news.imageUrl}
            alt={news.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          {/* Source badge overlaid on image */}
          <div className="absolute bottom-2 right-2">
            <SourceBadge item={news} />
          </div>
        </div>
      )}

      <div className="p-5 pl-6 flex flex-1 flex-col justify-between space-y-4">
        <div>
          {/* Category + date row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <CategoryBadge category={news.category} />
            <div className="flex items-center gap-2">
              {!news.imageUrl && <SourceBadge item={news} />}
              <span className="font-num text-[11px]" style={{ color: "oklch(0.50 0.01 255)" }}>
                {news.date}
              </span>
            </div>
          </div>

          {/* Headline */}
          <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug mb-3">
            {news.title}
          </h3>

          {/* Excerpt — plain text, no fabricated quotes */}
          <p
            className="text-xs leading-relaxed line-clamp-4"
            style={{ color: "oklch(0.68 0.008 255)" }}
          >
            {news.excerpt}
          </p>
        </div>

        {/* Footer */}
        <div className="space-y-3 pt-2">
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

          {/* CTA */}
          <div
            className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-display font-bold uppercase"
            style={{ color: "oklch(0.60 0.245 27)" }}
          >
            <span className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" /> Read Full Article
            </span>
            <ExternalLink className="h-3 w-3 opacity-50" />
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// NewsModal
// ---------------------------------------------------------------------------

function NewsModal({ news, onClose }: { news: RealNewsItem; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={news.title}
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
          style={{
            background: `linear-gradient(90deg, ${news.teamColor || "oklch(0.60 0.245 27)"}, transparent)`,
          }}
        />

        <div className="p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute right-4 top-6 rounded p-1.5 transition-colors hover:bg-white/10"
            style={{ border: "1px solid oklch(1 0 0 / 10%)" }}
            aria-label="Close article preview"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Article image */}
          {news.imageUrl && (
            <div className="mb-6 overflow-hidden rounded-lg">
              <img src={news.imageUrl} alt={news.title} className="w-full h-52 object-cover" />
            </div>
          )}

          {/* Header */}
          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <CategoryBadge category={news.category} />
              <SourceBadge item={news} />
              <span className="text-xs text-muted-foreground font-num">· {news.date}</span>
            </div>

            <h2 className="font-display font-black text-xl sm:text-2xl uppercase leading-tight text-foreground">
              {news.title}
            </h2>
          </div>

          {/* Excerpt */}
          <div
            className="p-5 rounded-lg border my-6"
            style={{
              background: "oklch(0.125 0.004 255)",
              borderColor: news.teamColor ? `${news.teamColor}40` : "oklch(1 0 0 / 8%)",
            }}
          >
            <div className="text-xs font-display uppercase tracking-wider font-bold text-primary mb-3 flex items-center gap-1.5">
              <Newspaper className="h-3.5 w-3.5" /> Article Summary
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "oklch(0.82 0.005 255)" }}>
              {news.excerpt}
            </p>
            <p className="mt-3 text-xs text-muted-foreground italic">
              This is an automatically generated excerpt. Read the full article for complete
              coverage.
            </p>
          </div>

          {/* External link — primary CTA */}
          <a
            href={news.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 font-display text-sm font-bold uppercase px-6 py-3 rounded transition-all hover:brightness-125 mb-6"
            style={{
              background: "oklch(0.60 0.245 27)",
              color: "#ffffff",
              letterSpacing: "0.08em",
            }}
          >
            Read Full Article on {news.sourceName} <ExternalLink className="h-4 w-4" />
          </a>

          {/* Tags */}
          <div className="pt-4 border-t border-white/5 flex flex-wrap items-center gap-2">
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

          {/* Attribution notice */}
          <div
            className="mt-5 flex items-start gap-2 p-3 rounded text-xs"
            style={{
              background: "oklch(1 0 0 / 3%)",
              border: "1px solid oklch(1 0 0 / 6%)",
              color: "oklch(0.50 0.01 255)",
            }}
          >
            <Rss className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Content sourced from{" "}
              <strong style={{ color: "oklch(0.65 0.01 255)" }}>{news.sourceName}</strong>. This app
              aggregates third-party RSS feeds and does not produce original reporting. All rights
              belong to the respective publishers.
            </span>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="font-display text-xs font-bold uppercase px-5 py-2.5 rounded transition-colors hover:bg-white/10"
              style={{
                background: "oklch(1 0 0 / 6%)",
                border: "1px solid oklch(1 0 0 / 10%)",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
