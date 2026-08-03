import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import {
  Search,
  X,
  Play,
  Flame,
  Radio,
  Mic2,
  Users,
  Trophy,
  Sparkles,
  Filter,
  Volume2,
  Quote,
  Star,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { SectionHeader } from "@/components/f1/primitives";
import memesData from "@/data/f1MemesData.json";

/* ─── Types ─────────────────────────────────────────────────────────── */
type Meme = {
  id: string;
  title: string;
  driver: string;
  driverCode: string;
  year: number;
  race: string;
  category: string;
  quote: string;
  description: string;
  youtubeId: string;
  tags: string[];
  viralRating: number;
};

const MEMES = memesData as Meme[];

/* ─── Route ─────────────────────────────────────────────────────────── */
export const Route = createFileRoute("/f1memes")({
  head: () => ({
    meta: [
      { title: "F1 Memes · Legendary Moments & Viral Videos · f1Bidda" },
      {
        name: "description",
        content:
          "The greatest F1 memes, legendary team radio moments, and viral videos from Formula 1 history. Kimi's Bwoah, GP2 Engine, Super Max, and more.",
      },
      { property: "og:title", content: "F1 Memes · f1Bidda" },
      {
        property: "og:description",
        content: "Legendary F1 memes, iconic radio moments, and the funniest videos in Formula 1 history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: F1MemesPage,
});

/* ─── Category config ───────────────────────────────────────────────── */
const CATEGORIES = [
  { label: "All", value: "All", icon: Sparkles },
  { label: "Team Radio", value: "Team Radio", icon: Radio },
  { label: "Interview", value: "Interview", icon: Mic2 },
  { label: "Fan Meme", value: "Fan Meme", icon: Users },
  { label: "Celebration", value: "Celebration", icon: Trophy },
  { label: "Team Principal", value: "Team Principal", icon: Volume2 },
] as const;

/* ─── Helpers ───────────────────────────────────────────────────────── */
function getYouTubeThumbnail(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

function ViralStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Star
          key={i}
          className="h-3 w-3"
          style={{
            color: i < rating ? "oklch(0.80 0.18 75)" : "oklch(0.25 0.005 255)",
            fill: i < rating ? "oklch(0.80 0.18 75)" : "none",
          }}
        />
      ))}
    </div>
  );
}

function getCategoryColor(cat: string) {
  switch (cat) {
    case "Team Radio": return "oklch(0.60 0.245 27)";
    case "Interview": return "oklch(0.70 0.18 280)";
    case "Fan Meme": return "oklch(0.73 0.18 155)";
    case "Celebration": return "oklch(0.80 0.18 75)";
    case "Team Principal": return "oklch(0.62 0.20 250)";
    default: return "oklch(0.60 0.245 27)";
  }
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
function F1MemesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"viral" | "year">("viral");

  const filtered = useMemo(() => {
    let result = MEMES;
    if (category !== "All") {
      result = result.filter((m) => m.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.driver.toLowerCase().includes(q) ||
          m.quote.toLowerCase().includes(q) ||
          m.tags.some((t) => t.includes(q))
      );
    }
    if (sortBy === "viral") {
      result = [...result].sort((a, b) => b.viralRating - a.viralRating);
    } else {
      result = [...result].sort((a, b) => b.year - a.year);
    }
    return result;
  }, [search, category, sortBy]);

  const togglePlay = useCallback((id: string) => {
    setPlayingId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <main
      className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8"
      style={{ minHeight: "100vh" }}
    >
      {/* ── Header ── */}
      <SectionHeader
        eyebrow="Hall of Fame"
        title="F1 Memes"
        right={
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5" style={{ color: "oklch(0.60 0.245 27)" }} />
            <span
              className="font-num text-sm font-semibold"
              style={{ color: "oklch(0.55 0.012 255)" }}
            >
              {MEMES.length} Legendary Moments
            </span>
          </div>
        }
      />

      {/* ── Subtitle ── */}
      <p
        className="mb-8 max-w-2xl text-sm leading-relaxed"
        style={{ color: "oklch(0.55 0.012 255)" }}
      >
        The greatest memes, most legendary team radio moments, and funniest viral
        videos from Formula 1 history. From Kimi's BWOAH to the Ferrari
        Master🅱️lan — click play and relive the chaos.
      </p>

      {/* ── Controls ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "oklch(0.45 0.012 255)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memes, drivers, quotes..."
            className="w-full rounded-lg py-2.5 pl-10 pr-10 text-sm font-medium outline-none transition-all"
            style={{
              background: "oklch(0.155 0.006 255)",
              border: "1px solid oklch(1 0 0 / 7%)",
              color: "oklch(0.94 0.003 255)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors hover:bg-white/10"
            >
              <X className="h-4 w-4" style={{ color: "oklch(0.45 0.012 255)" }} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase" style={{ color: "oklch(0.45 0.012 255)", letterSpacing: "0.08em" }}>
            Sort
          </span>
          {(["viral", "year"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="rounded-md px-3 py-1.5 text-xs font-semibold uppercase transition-all"
              style={{
                letterSpacing: "0.06em",
                background: sortBy === s ? "oklch(0.60 0.245 27 / 0.15)" : "oklch(0.155 0.006 255)",
                color: sortBy === s ? "oklch(0.60 0.245 27)" : "oklch(0.55 0.012 255)",
                border: `1px solid ${sortBy === s ? "oklch(0.60 0.245 27 / 0.3)" : "oklch(1 0 0 / 7%)"}`,
              }}
            >
              {s === "viral" ? "🔥 Most Viral" : "📅 Latest"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Category Pills ── */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = category === cat.value;
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase transition-all"
              style={{
                letterSpacing: "0.06em",
                background: active ? "oklch(0.60 0.245 27 / 0.15)" : "oklch(0.155 0.006 255)",
                color: active ? "oklch(0.60 0.245 27)" : "oklch(0.55 0.012 255)",
                border: `1px solid ${active ? "oklch(0.60 0.245 27 / 0.3)" : "oklch(1 0 0 / 7%)"}`,
                boxShadow: active ? "0 0 12px oklch(0.60 0.245 27 / 0.1)" : "none",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Results count ── */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-4 py-20"
          style={{ color: "oklch(0.45 0.012 255)" }}
        >
          <Search className="h-12 w-12 opacity-40" />
          <p className="text-lg font-semibold">No memes found</p>
          <p className="text-sm">Try a different search or category</p>
        </div>
      ) : (
        <>
          <p
            className="mb-6 text-xs font-semibold uppercase"
            style={{ color: "oklch(0.45 0.012 255)", letterSpacing: "0.08em" }}
          >
            Showing {filtered.length} meme{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* ── Grid ── */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((meme, index) => (
              <MemeCard
                key={meme.id}
                meme={meme}
                isPlaying={playingId === meme.id}
                isExpanded={expandedId === meme.id}
                onTogglePlay={() => togglePlay(meme.id)}
                onToggleExpand={() => setExpandedId((prev) => (prev === meme.id ? null : meme.id))}
                index={index}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Footer Banner ── */}
      <div
        className="mt-16 rounded-xl p-8 text-center"
        style={{
          background: "linear-gradient(135deg, oklch(0.18 0.02 27 / 0.6), oklch(0.12 0.004 255))",
          border: "1px solid oklch(0.60 0.245 27 / 0.15)",
        }}
      >
        <Flame className="mx-auto mb-3 h-8 w-8" style={{ color: "oklch(0.60 0.245 27)" }} />
        <h3
          className="font-display text-xl font-bold uppercase"
          style={{ letterSpacing: "0.06em" }}
        >
          Got a legendary F1 meme we're missing?
        </h3>
        <p
          className="mx-auto mt-2 max-w-md text-sm"
          style={{ color: "oklch(0.55 0.012 255)" }}
        >
          This collection celebrates the greatest moments that made F1 fans laugh, cry, and
          smash their keyboards. More memes are added regularly!
        </p>
      </div>
    </main>
  );
}

/* ─── Meme Card ─────────────────────────────────────────────────────── */
function MemeCard({
  meme,
  isPlaying,
  isExpanded,
  onTogglePlay,
  onToggleExpand,
  index,
}: {
  meme: Meme;
  isPlaying: boolean;
  isExpanded: boolean;
  onTogglePlay: () => void;
  onToggleExpand: () => void;
  index: number;
}) {
  const catColor = getCategoryColor(meme.category);

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl transition-all duration-300"
      style={{
        background: "oklch(0.145 0.006 255)",
        border: `1px solid ${isPlaying ? "oklch(0.60 0.245 27 / 0.4)" : "oklch(1 0 0 / 7%)"}`,
        boxShadow: isPlaying ? "0 0 24px oklch(0.60 0.245 27 / 0.08)" : "none",
        animationDelay: `${index * 40}ms`,
      }}
    >
      {/* Thumbnail / Video Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {isPlaying ? (
          <iframe
            src={`https://www.youtube.com/embed/${meme.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={meme.title}
            className="absolute inset-0 h-full w-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={onTogglePlay}
            className="relative block h-full w-full"
            aria-label={`Play: ${meme.title}`}
          >
            <img
              src={getYouTubeThumbnail(meme.youtubeId)}
              alt={meme.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Dark overlay */}
            <div
              className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-60"
              style={{
                background: "linear-gradient(to top, oklch(0.08 0.004 255 / 0.9), oklch(0.08 0.004 255 / 0.2))",
                opacity: 0.7,
              }}
            />
            {/* Play button */}
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110"
                style={{
                  background: "oklch(0.60 0.245 27)",
                  boxShadow: "0 4px 20px oklch(0.60 0.245 27 / 0.4)",
                }}
              >
                <Play className="h-6 w-6 text-white" style={{ marginLeft: "2px" }} />
              </div>
            </div>
            {/* Viral badge */}
            {meme.viralRating >= 9 && (
              <div
                className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1"
                style={{
                  background: "oklch(0.60 0.245 27 / 0.9)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Flame className="h-3 w-3 text-white" />
                <span className="text-[10px] font-bold uppercase text-white" style={{ letterSpacing: "0.05em" }}>
                  Legendary
                </span>
              </div>
            )}
            {/* Category badge */}
            <div
              className="absolute right-3 top-3 rounded-full px-2.5 py-1"
              style={{
                background: "oklch(0.12 0.004 255 / 0.8)",
                backdropFilter: "blur(8px)",
                border: `1px solid ${catColor}40`,
              }}
            >
              <span className="text-[10px] font-bold uppercase" style={{ color: catColor, letterSpacing: "0.05em" }}>
                {meme.category}
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Title + year */}
        <div>
          <h3
            className="font-display text-base font-bold uppercase leading-tight"
            style={{ letterSpacing: "0.03em", color: "oklch(0.94 0.003 255)" }}
          >
            {meme.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="text-xs font-semibold"
              style={{ color: catColor }}
            >
              {meme.driver}
            </span>
            <span style={{ color: "oklch(0.35 0.005 255)" }}>·</span>
            <span
              className="font-num text-xs"
              style={{ color: "oklch(0.45 0.012 255)" }}
            >
              {meme.year} · {meme.race}
            </span>
          </div>
        </div>

        {/* Quote */}
        <div
          className="rounded-lg px-4 py-3"
          style={{
            background: "oklch(0.12 0.004 255)",
            borderLeft: `3px solid ${catColor}`,
          }}
        >
          <div className="flex items-start gap-2">
            <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: catColor }} />
            <p
              className="text-sm font-semibold italic leading-relaxed"
              style={{ color: "oklch(0.85 0.01 255)" }}
            >
              "{meme.quote}"
            </p>
          </div>
        </div>

        {/* Description (expandable) */}
        <div>
          <p
            className="text-xs leading-relaxed"
            style={{
              color: "oklch(0.55 0.012 255)",
              display: "-webkit-box",
              WebkitLineClamp: isExpanded ? 999 : 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {meme.description}
          </p>
          {meme.description.length > 150 && (
            <button
              onClick={onToggleExpand}
              className="mt-1 flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: "oklch(0.60 0.245 27)" }}
            >
              {isExpanded ? "Show less" : "Read more"}
              <ChevronDown
                className="h-3 w-3 transition-transform"
                style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
              />
            </button>
          )}
        </div>

        {/* Bottom row */}
        <div className="mt-auto flex items-center justify-between pt-2" style={{ borderTop: "1px solid oklch(1 0 0 / 5%)" }}>
          <ViralStars rating={meme.viralRating} />
          <div className="flex items-center gap-2">
            {!isPlaying && (
              <button
                onClick={onTogglePlay}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold uppercase transition-all hover:brightness-110"
                style={{
                  background: "oklch(0.60 0.245 27 / 0.15)",
                  color: "oklch(0.60 0.245 27)",
                  border: "1px solid oklch(0.60 0.245 27 / 0.25)",
                  letterSpacing: "0.05em",
                }}
              >
                <Play className="h-3 w-3" />
                Play
              </button>
            )}
            {isPlaying && (
              <button
                onClick={onTogglePlay}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold uppercase transition-all"
                style={{
                  background: "oklch(0.25 0.005 255)",
                  color: "oklch(0.65 0.012 255)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                  letterSpacing: "0.05em",
                }}
              >
                <X className="h-3 w-3" />
                Close
              </button>
            )}
            <a
              href={`https://www.youtube.com/watch?v=${meme.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-1.5 transition-colors hover:bg-white/5"
              title="Open on YouTube"
            >
              <ExternalLink className="h-3.5 w-3.5" style={{ color: "oklch(0.45 0.012 255)" }} />
            </a>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {meme.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
              style={{
                background: "oklch(0.18 0.008 255)",
                color: "oklch(0.50 0.012 255)",
                letterSpacing: "0.04em",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
