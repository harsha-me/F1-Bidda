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
  Volume2,
  Quote,
  Star,
  ChevronDown,
  ExternalLink,
  Youtube,
} from "lucide-react";
import { SectionHeader } from "@/components/f1/primitives";
import memesData from "@/data/f1MemesData.json";

/* ─── Types ─────────────────────────────────────────────────────────── */
type Meme = {
  id: string;
  type: "meme" | "video";
  title: string;
  driver: string;
  driverCode: string;
  year: number;
  race: string;
  category: string;
  quote: string;
  description: string;
  youtubeId: string;
  emoji: string;
  bgGradient: string;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"viral" | "year">("viral");
  const [typeFilter, setTypeFilter] = useState<"all" | "meme" | "video">("all");

  const filtered = useMemo(() => {
    let result = MEMES;
    if (category !== "All") {
      result = result.filter((m) => m.category === category);
    }
    if (typeFilter !== "all") {
      result = result.filter((m) => m.type === typeFilter);
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
  }, [search, category, sortBy, typeFilter]);

  const memeCount = MEMES.filter((m) => m.type === "meme").length;
  const videoCount = MEMES.filter((m) => m.type === "video").length;

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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5" style={{ color: "oklch(0.60 0.245 27)" }} />
              <span className="font-num text-sm font-semibold" style={{ color: "oklch(0.55 0.012 255)" }}>
                {MEMES.length} Legendary Moments
              </span>
            </div>
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
        Master🅱️lan — relive the chaos that makes F1 the greatest sport on earth.
      </p>

      {/* ── Controls Bar ── */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
            className="w-full rounded-lg py-2.5 pl-10 pr-10 text-sm font-medium outline-none transition-all focus:ring-1"
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

        {/* Type + Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type filter pills */}
          <div className="flex items-center gap-1.5 rounded-lg p-1" style={{ background: "oklch(0.13 0.004 255)", border: "1px solid oklch(1 0 0 / 5%)" }}>
            {([
              { val: "all" as const, label: `All (${MEMES.length})`, icon: "🎯" },
              { val: "meme" as const, label: `Memes (${memeCount})`, icon: "😂" },
              { val: "video" as const, label: `Videos (${videoCount})`, icon: "🎬" },
            ]).map((t) => (
              <button
                key={t.val}
                onClick={() => setTypeFilter(t.val)}
                className="rounded-md px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: typeFilter === t.val ? "oklch(0.60 0.245 27 / 0.15)" : "transparent",
                  color: typeFilter === t.val ? "oklch(0.60 0.245 27)" : "oklch(0.50 0.012 255)",
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
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

      {/* ── Results ── */}
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
            Showing {filtered.length} legendary moment{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* ── Grid ── */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((meme, index) =>
              meme.type === "meme" ? (
                <MemeQuoteCard
                  key={meme.id}
                  meme={meme}
                  isExpanded={expandedId === meme.id}
                  onToggleExpand={() => setExpandedId((p) => (p === meme.id ? null : meme.id))}
                  index={index}
                />
              ) : (
                <VideoLinkCard
                  key={meme.id}
                  meme={meme}
                  isExpanded={expandedId === meme.id}
                  onToggleExpand={() => setExpandedId((p) => (p === meme.id ? null : meme.id))}
                  index={index}
                />
              )
            )}
          </div>
        </>
      )}

      {/* ── Footer ── */}
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
          Got a legendary F1 meme we missed?
        </h3>
        <p
          className="mx-auto mt-2 max-w-md text-sm"
          style={{ color: "oklch(0.55 0.012 255)" }}
        >
          This collection celebrates the greatest moments that made F1 fans laugh, cry, and
          smash their keyboards. More memes added regularly!
        </p>
      </div>
    </main>
  );
}

/* ─── Meme Quote Card (styled quote with gradient bg, no external image) ── */
function MemeQuoteCard({
  meme,
  isExpanded,
  onToggleExpand,
  index,
}: {
  meme: Meme;
  isExpanded: boolean;
  onToggleExpand: () => void;
  index: number;
}) {
  const catColor = getCategoryColor(meme.category);

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: "oklch(0.145 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
      }}
    >
      {/* ── Hero Quote Area ── */}
      <div
        className="relative flex min-h-[220px] flex-col items-center justify-center px-6 py-8 text-center"
        style={{ background: meme.bgGradient }}
      >
        {/* Noise overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.05) 0%, transparent 60%)",
          }}
        />

        {/* Emoji */}
        <span className="mb-3 text-4xl drop-shadow-lg" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }}>
          {meme.emoji}
        </span>

        {/* Giant Quote */}
        <p
          className="relative z-10 font-display text-lg font-black uppercase leading-tight tracking-wide sm:text-xl"
          style={{
            color: "#fff",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            maxWidth: "90%",
          }}
        >
          "{meme.quote}"
        </p>

        {/* Driver attribution */}
        <p
          className="relative z-10 mt-3 text-xs font-semibold uppercase"
          style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}
        >
          — {meme.driver}, {meme.year}
        </p>

        {/* Legendary badge */}
        {meme.viralRating >= 9 && (
          <div
            className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1"
            style={{ background: "oklch(0.60 0.245 27 / 0.85)", backdropFilter: "blur(8px)" }}
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
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${catColor}40`,
          }}
        >
          <span className="text-[10px] font-bold uppercase" style={{ color: catColor, letterSpacing: "0.05em" }}>
            {meme.category}
          </span>
        </div>

        {/* Meme type badge */}
        <div
          className="absolute bottom-3 left-3 rounded-full px-2 py-0.5"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
        >
          <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            😂 MEME
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Title */}
        <h3
          className="font-display text-base font-bold uppercase leading-tight"
          style={{ letterSpacing: "0.03em", color: "oklch(0.94 0.003 255)" }}
        >
          {meme.title}
        </h3>

        {/* Driver + race */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: catColor }}>
            {meme.driver}
          </span>
          <span style={{ color: "oklch(0.35 0.005 255)" }}>·</span>
          <span className="font-num text-xs" style={{ color: "oklch(0.45 0.012 255)" }}>
            {meme.year} · {meme.race}
          </span>
        </div>

        {/* Description */}
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
        {meme.description.length > 120 && (
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-xs font-semibold transition-colors"
            style={{ color: "oklch(0.60 0.245 27)" }}
          >
            {isExpanded ? "Show less" : "Read more"}
            <ChevronDown
              className="h-3 w-3 transition-transform"
              style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
            />
          </button>
        )}

        {/* Bottom */}
        <div className="mt-auto flex items-center justify-between pt-3" style={{ borderTop: "1px solid oklch(1 0 0 / 5%)" }}>
          <ViralStars rating={meme.viralRating} />
          <a
            href={`https://www.youtube.com/watch?v=${meme.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold uppercase transition-all hover:brightness-125"
            style={{
              background: "oklch(0.60 0.245 27 / 0.12)",
              color: "oklch(0.60 0.245 27)",
              border: "1px solid oklch(0.60 0.245 27 / 0.2)",
              letterSpacing: "0.05em",
            }}
          >
            <Youtube className="h-3.5 w-3.5" />
            Watch
          </a>
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

/* ─── Video Link Card (opens YouTube in new tab, no embed) ─────────── */
function VideoLinkCard({
  meme,
  isExpanded,
  onToggleExpand,
  index,
}: {
  meme: Meme;
  isExpanded: boolean;
  onToggleExpand: () => void;
  index: number;
}) {
  const catColor = getCategoryColor(meme.category);
  const ytUrl = `https://www.youtube.com/watch?v=${meme.youtubeId}`;

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: "oklch(0.145 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
      }}
    >
      {/* ── Video Hero Area ── */}
      <a
        href={ytUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex min-h-[220px] flex-col items-center justify-center px-6 py-8 text-center"
        style={{ background: meme.bgGradient, textDecoration: "none" }}
      >
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(225,6,0,0.08) 0%, transparent 60%)",
          }}
        />

        {/* Big YouTube play icon */}
        <div
          className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl"
          style={{
            background: "oklch(0.60 0.245 27)",
            boxShadow: "0 6px 30px oklch(0.60 0.245 27 / 0.4)",
          }}
        >
          <Play className="h-7 w-7 text-white" style={{ marginLeft: "3px" }} />
        </div>

        {/* Quote preview */}
        <p
          className="relative z-10 font-display text-base font-bold uppercase leading-tight tracking-wide sm:text-lg"
          style={{
            color: "#fff",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            maxWidth: "90%",
          }}
        >
          "{meme.quote}"
        </p>

        {/* Tap to watch */}
        <div
          className="relative z-10 mt-3 flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
        >
          <Youtube className="h-3 w-3" style={{ color: "#ff0000" }} />
          <span className="text-[10px] font-bold uppercase text-white" style={{ letterSpacing: "0.06em" }}>
            Watch on YouTube
          </span>
          <ExternalLink className="h-2.5 w-2.5 text-white opacity-60" />
        </div>

        {/* Legendary badge */}
        {meme.viralRating >= 9 && (
          <div
            className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1"
            style={{ background: "oklch(0.60 0.245 27 / 0.85)", backdropFilter: "blur(8px)" }}
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
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${catColor}40`,
          }}
        >
          <span className="text-[10px] font-bold uppercase" style={{ color: catColor, letterSpacing: "0.05em" }}>
            {meme.category}
          </span>
        </div>

        {/* Video type badge */}
        <div
          className="absolute bottom-3 left-3 rounded-full px-2 py-0.5"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
        >
          <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            🎬 VIDEO
          </span>
        </div>
      </a>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Title */}
        <h3
          className="font-display text-base font-bold uppercase leading-tight"
          style={{ letterSpacing: "0.03em", color: "oklch(0.94 0.003 255)" }}
        >
          {meme.emoji} {meme.title}
        </h3>

        {/* Driver + race */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: catColor }}>
            {meme.driver}
          </span>
          <span style={{ color: "oklch(0.35 0.005 255)" }}>·</span>
          <span className="font-num text-xs" style={{ color: "oklch(0.45 0.012 255)" }}>
            {meme.year} · {meme.race}
          </span>
        </div>

        {/* Description */}
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
        {meme.description.length > 120 && (
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-xs font-semibold transition-colors"
            style={{ color: "oklch(0.60 0.245 27)" }}
          >
            {isExpanded ? "Show less" : "Read more"}
            <ChevronDown
              className="h-3 w-3 transition-transform"
              style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
            />
          </button>
        )}

        {/* Bottom */}
        <div className="mt-auto flex items-center justify-between pt-3" style={{ borderTop: "1px solid oklch(1 0 0 / 5%)" }}>
          <ViralStars rating={meme.viralRating} />
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold uppercase transition-all hover:brightness-125"
            style={{
              background: "#ff0000",
              color: "#fff",
              letterSpacing: "0.05em",
              boxShadow: "0 2px 8px rgba(255,0,0,0.2)",
            }}
          >
            <Youtube className="h-3.5 w-3.5" />
            YouTube
            <ExternalLink className="h-3 w-3" />
          </a>
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
