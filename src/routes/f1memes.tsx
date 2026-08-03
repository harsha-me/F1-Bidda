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
  Star,
  ChevronDown,
  ExternalLink,
  Youtube,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Instagram,
  Check,
  Copy,
  Maximize2,
  Sparkle,
  Image as ImageIcon,
  Tv,
} from "lucide-react";
import { SectionHeader } from "@/components/f1/primitives";
import memesData from "@/data/f1MemesData.json";

/* ─── Types ─────────────────────────────────────────────────────────── */
type MemeStyle = {
  headerBg?: string;
  accentColor?: string;
  subtitle?: string;
};

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
  handle?: string;
  likesCount?: string;
  commentsCount?: string;
  instagramUrl?: string;
  caption?: string;
  imageStyle?: MemeStyle;
};

const MEMES = memesData as Meme[];

/* ─── Route Definition ─────────────────────────────────────────────── */
export const Route = createFileRoute("/f1memes")({
  head: () => ({
    meta: [
      { title: "F1 Memes & @f1memesig Non-Video Memes · f1Bidda" },
      {
        name: "description",
        content:
          "The ultimate Formula 1 meme hub featuring non-video Instagram memes from @f1memesig, legendary team radio moments, and viral video clips.",
      },
      { property: "og:title", content: "F1 Memes & @f1memesig Collection · f1Bidda" },
      {
        property: "og:description",
        content: "Discover non-video Instagram memes, legendary team radio quotes, and viral videos from Formula 1 history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: F1MemesPage,
});

/* ─── Category config ───────────────────────────────────────────────── */
const CATEGORIES = [
  { label: "All Categories", value: "All", icon: Sparkles },
  { label: "Team Radio", value: "Team Radio", icon: Radio },
  { label: "Interview", value: "Interview", icon: Mic2 },
  { label: "Fan Meme", value: "Fan Meme", icon: Users },
  { label: "Celebration", value: "Celebration", icon: Trophy },
  { label: "Team Principal", value: "Team Principal", icon: Volume2 },
] as const;

/* ─── Helpers ───────────────────────────────────────────────────────── */
function ViralStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`Viral rating: ${rating}/10`}>
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
    case "Team Radio":
      return "oklch(0.60 0.245 27)";
    case "Interview":
      return "oklch(0.70 0.18 280)";
    case "Fan Meme":
      return "oklch(0.73 0.18 155)";
    case "Celebration":
      return "oklch(0.80 0.18 75)";
    case "Team Principal":
      return "oklch(0.62 0.20 250)";
    default:
      return "oklch(0.60 0.245 27)";
  }
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
function F1MemesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"all" | "non-video" | "videos">("non-video");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxMeme, setLightboxMeme] = useState<Meme | null>(null);
  const [sortBy, setSortBy] = useState<"viral" | "year">("viral");
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});

  const toggleLike = useCallback((id: string) => {
    setLikedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSavedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Filter non-video and video datasets separately
  const nonVideoMemes = useMemo(() => {
    let list = MEMES.filter((m) => m.type === "meme");
    if (category !== "All") {
      list = list.filter((m) => m.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.driver.toLowerCase().includes(q) ||
          m.quote.toLowerCase().includes(q) ||
          m.tags.some((t) => t.includes(q))
      );
    }
    if (sortBy === "viral") {
      list = [...list].sort((a, b) => b.viralRating - a.viralRating);
    } else {
      list = [...list].sort((a, b) => b.year - a.year);
    }
    return list;
  }, [search, category, sortBy]);

  const videoMemes = useMemo(() => {
    let list = MEMES.filter((m) => m.type === "video");
    if (category !== "All") {
      list = list.filter((m) => m.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.driver.toLowerCase().includes(q) ||
          m.quote.toLowerCase().includes(q) ||
          m.tags.some((t) => t.includes(q))
      );
    }
    if (sortBy === "viral") {
      list = [...list].sort((a, b) => b.viralRating - a.viralRating);
    } else {
      list = [...list].sort((a, b) => b.year - a.year);
    }
    return list;
  }, [search, category, sortBy]);

  const totalMemesCount = MEMES.filter((m) => m.type === "meme").length;
  const totalVideosCount = MEMES.filter((m) => m.type === "video").length;

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8" style={{ minHeight: "100vh" }}>
      {/* ── Page Header ── */}
      <SectionHeader
        eyebrow="Hall of Fame & @f1memesig"
        title="F1 Memes Vault"
        right={
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/f1memesig/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-white transition-transform hover:scale-105"
              style={{
                background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                boxShadow: "0 4px 15px rgba(220, 39, 67, 0.35)",
              }}
            >
              <Instagram className="h-4 w-4" />
              <span>@f1memesig</span>
              <ExternalLink className="h-3 w-3 opacity-80" />
            </a>
            <div className="hidden sm:flex items-center gap-2">
              <Flame className="h-5 w-5" style={{ color: "oklch(0.60 0.245 27)" }} />
              <span className="font-num text-sm font-semibold" style={{ color: "oklch(0.55 0.012 255)" }}>
                {MEMES.length} Viral Posts
              </span>
            </div>
          </div>
        }
      />

      {/* ── Subtitle / Intro ── */}
      <p className="mb-6 max-w-3xl text-sm leading-relaxed" style={{ color: "oklch(0.65 0.012 255)" }}>
        Welcome to the ultimate F1 memes hub! Featuring a dedicated section for non-video memes directly inspired by the popular{" "}
        <a
          href="https://www.instagram.com/f1memesig/?hl=en"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline decoration-pink-500 hover:text-pink-400"
        >
          @f1memesig Instagram page
        </a>
        , as well as viral video highlights and radio moments.
      </p>

      {/* ── View Switcher Navigation Bar ── */}
      <div
        className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-2 sm:p-3"
        style={{
          background: "oklch(0.14 0.005 255)",
          border: "1px solid oklch(1 0 0 / 8%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Section Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("non-video")}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all sm:text-sm"
            style={{
              letterSpacing: "0.05em",
              background:
                activeTab === "non-video"
                  ? "linear-gradient(135deg, #f09433 0%, #dc2743 50%, #bc1888 100%)"
                  : "transparent",
              color: activeTab === "non-video" ? "#ffffff" : "oklch(0.60 0.012 255)",
              boxShadow: activeTab === "non-video" ? "0 4px 20px rgba(220, 39, 67, 0.4)" : "none",
            }}
          >
            <ImageIcon className="h-4 w-4" />
            <span>📸 Non-Video Memes ({totalMemesCount})</span>
            <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px]">@f1memesig</span>
          </button>

          <button
            onClick={() => setActiveTab("videos")}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all sm:text-sm"
            style={{
              letterSpacing: "0.05em",
              background: activeTab === "videos" ? "oklch(0.60 0.245 27)" : "transparent",
              color: activeTab === "videos" ? "#ffffff" : "oklch(0.60 0.012 255)",
              boxShadow: activeTab === "videos" ? "0 4px 20px oklch(0.60 0.245 27 / 0.4)" : "none",
            }}
          >
            <Tv className="h-4 w-4" />
            <span>🎬 Video Highlights ({totalVideosCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all sm:text-sm"
            style={{
              letterSpacing: "0.05em",
              background: activeTab === "all" ? "oklch(0.25 0.01 255)" : "transparent",
              color: activeTab === "all" ? "#ffffff" : "oklch(0.60 0.012 255)",
            }}
          >
            <Sparkle className="h-4 w-4" />
            <span>🔥 All ({MEMES.length})</span>
          </button>
        </div>

        {/* Sort option */}
        <div className="flex items-center gap-2">
          {(["viral", "year"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-all"
              style={{
                letterSpacing: "0.05em",
                background: sortBy === s ? "oklch(0.22 0.01 255)" : "transparent",
                color: sortBy === s ? "oklch(0.94 0.003 255)" : "oklch(0.50 0.012 255)",
                border: `1px solid ${sortBy === s ? "oklch(1 0 0 / 15%)" : "transparent"}`,
              }}
            >
              {s === "viral" ? "🔥 Viral" : "📅 Latest"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search & Filter Controls Bar ── */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "oklch(0.45 0.012 255)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search @f1memesig, drivers, quotes..."
            className="w-full rounded-xl py-2.5 pl-10 pr-10 text-sm font-medium outline-none transition-all focus:ring-1"
            style={{
              background: "oklch(0.155 0.006 255)",
              border: "1px solid oklch(1 0 0 / 10%)",
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

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase transition-all"
                style={{
                  letterSpacing: "0.05em",
                  background: active ? "oklch(0.60 0.245 27 / 0.15)" : "oklch(0.155 0.006 255)",
                  color: active ? "oklch(0.60 0.245 27)" : "oklch(0.55 0.012 255)",
                  border: `1px solid ${active ? "oklch(0.60 0.245 27 / 0.3)" : "oklch(1 0 0 / 7%)"}`,
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 1: NON-VIDEO MEMES (@f1memesig) ── */}
      {(activeTab === "non-video" || activeTab === "all") && (
        <section className="mb-16">
          {/* Section Banner Header */}
          <div
            className="mb-8 flex flex-col gap-4 overflow-hidden rounded-2xl p-6 md:flex-row md:items-center md:justify-between"
            style={{
              background:
                "linear-gradient(135deg, rgba(240, 148, 51, 0.12) 0%, rgba(220, 39, 67, 0.18) 50%, rgba(188, 24, 136, 0.12) 100%)",
              border: "1px solid rgba(220, 39, 67, 0.25)",
              boxShadow: "0 10px 40px -10px rgba(220, 39, 67, 0.15)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl p-0.5"
                style={{
                  background:
                    "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                }}
              >
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-black">
                  <Instagram className="h-7 w-7 text-pink-500" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                    Non-Video Memes (@f1memesig)
                  </h2>
                  <span className="rounded-full bg-pink-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-pink-400">
                    Instagram Collection
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-300 sm:text-sm">
                  Image memes, graphic strategy decision trees, and legendary driver quotes styled after posts on{" "}
                  <a
                    href="https://www.instagram.com/f1memesig/?hl=en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-pink-400 underline hover:text-pink-300"
                  >
                    @f1memesig
                  </a>
                  . Double-tap any card to hit like!
                </p>
              </div>
            </div>

            <a
              href="https://www.instagram.com/f1memesig/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-transform hover:scale-105 md:self-center"
              style={{
                background:
                  "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                boxShadow: "0 4px 20px rgba(220, 39, 67, 0.4)",
              }}
            >
              <Instagram className="h-4 w-4" />
              <span>Visit Instagram Page</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
          </div>

          {/* Grid of Non-Video Instagram Meme Cards */}
          {nonVideoMemes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-400">
              <ImageIcon className="h-10 w-10 opacity-30" />
              <p className="text-sm font-semibold">No non-video memes found matching criteria</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {nonVideoMemes.map((meme, idx) => (
                <InstagramMemeCard
                  key={meme.id}
                  meme={meme}
                  isLiked={!!likedPosts[meme.id]}
                  isSaved={!!savedPosts[meme.id]}
                  onToggleLike={() => toggleLike(meme.id)}
                  onToggleSave={() => toggleSave(meme.id)}
                  onOpenLightbox={() => setLightboxMeme(meme)}
                  isExpanded={expandedId === meme.id}
                  onToggleExpand={() => setExpandedId((p) => (p === meme.id ? null : meme.id))}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── SECTION 2: VIDEO HIGHLIGHTS ── */}
      {(activeTab === "videos" || activeTab === "all") && (
        <section className="mb-16">
          {/* Section Header */}
          <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 text-red-500">
                <Youtube className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
                  🎬 Viral Video & Radio Clips
                </h2>
                <p className="text-xs text-gray-400">
                  Iconic team radio rants, song anthems, and YouTube video clips from Formula 1 history
                </p>
              </div>
            </div>
            <span className="font-num text-xs font-bold text-red-400">
              {videoMemes.length} Videos
            </span>
          </div>

          {videoMemes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-400">
              <Tv className="h-10 w-10 opacity-30" />
              <p className="text-sm font-semibold">No video clips found matching criteria</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videoMemes.map((meme, idx) => (
                <VideoLinkCard
                  key={meme.id}
                  meme={meme}
                  isExpanded={expandedId === meme.id}
                  onToggleExpand={() => setExpandedId((p) => (p === meme.id ? null : meme.id))}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Lightbox Modal ── */}
      {lightboxMeme && (
        <MemeLightboxModal
          meme={lightboxMeme}
          isLiked={!!likedPosts[lightboxMeme.id]}
          onToggleLike={() => toggleLike(lightboxMeme.id)}
          onClose={() => setLightboxMeme(null)}
        />
      )}

      {/* ── Footer Banner ── */}
      <div
        className="mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl p-8 text-center md:flex-row md:text-left"
        style={{
          background: "linear-gradient(135deg, oklch(0.18 0.02 27 / 0.6), oklch(0.12 0.004 255))",
          border: "1px solid oklch(0.60 0.245 27 / 0.2)",
        }}
      >
        <div className="max-w-xl">
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <Flame className="h-6 w-6 text-red-500" />
            <h3 className="font-display text-xl font-bold uppercase tracking-wider text-white">
              Got an epic F1 meme or @f1memesig post?
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-400 sm:text-sm">
            We continuously add legendary non-video memes, team radio quotes, and fan edits to the hall of fame. Check out{" "}
            <a
              href="https://www.instagram.com/f1memesig/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-pink-400 underline"
            >
              @f1memesig on Instagram
            </a>{" "}
            for daily fresh memes!
          </p>
        </div>

        <a
          href="https://www.instagram.com/f1memesig/?hl=en"
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-2.5 rounded-xl px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition-transform hover:scale-105"
          style={{
            background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            boxShadow: "0 6px 25px rgba(220, 39, 67, 0.4)",
          }}
        >
          <Instagram className="h-5 w-5" />
          <span>Follow @f1memesig</span>
          <ExternalLink className="h-3.5 w-3.5 opacity-80" />
        </a>
      </div>
    </main>
  );
}

/* ─── INSTAGRAM NON-VIDEO MEME CARD ─────────────────────────────────── */
function InstagramMemeCard({
  meme,
  isLiked,
  isSaved,
  onToggleLike,
  onToggleSave,
  onOpenLightbox,
  isExpanded,
  onToggleExpand,
}: {
  meme: Meme;
  isLiked: boolean;
  isSaved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onOpenLightbox: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const catColor = getCategoryColor(meme.category);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDoubleTap = () => {
    if (!isLiked) {
      onToggleLike();
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`"${meme.quote}" — ${meme.driver} (${meme.year})\nVia @f1memesig: ${meme.instagramUrl || "https://www.instagram.com/f1memesig/?hl=en"}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handle = meme.handle || "@f1memesig";
  const likesDisplay = isLiked
    ? "185.3K"
    : meme.likesCount || "148.2K";

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: "oklch(0.145 0.006 255)",
        border: "1px solid oklch(1 0 0 / 9%)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
      }}
    >
      {/* ── Top Bar (Instagram User Header) ── */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar with IG gradient ring */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full p-0.5"
            style={{
              background:
                "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-[13px] font-black text-pink-400">
              🏎️
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              <a
                href={meme.instagramUrl || "https://www.instagram.com/f1memesig/?hl=en"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-white transition-colors hover:text-pink-400"
              >
                {handle}
              </a>
              {/* Verified Blue Badge */}
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
                ✓
              </div>
            </div>
            <p className="text-[10px] text-gray-400">{meme.race} · {meme.year}</p>
          </div>
        </div>

        {/* Category Pill + IG Link */}
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
            style={{
              background: `${catColor}20`,
              color: catColor,
              border: `1px solid ${catColor}40`,
            }}
          >
            {meme.category}
          </span>
          <button
            onClick={onOpenLightbox}
            title="Expand Lightbox"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Graphic Image / Content Frame (Double Tapable) ── */}
      <div
        onDoubleClick={handleDoubleTap}
        className="relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center select-none overflow-hidden px-6 py-8 text-center transition-all"
        style={{ background: meme.bgGradient }}
      >
        {/* Subtle noise/radial overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Emoji Badge */}
        <span className="relative z-10 mb-3 text-4xl drop-shadow-xl transition-transform duration-300 group-hover:scale-110">
          {meme.emoji}
        </span>

        {/* Subtitle tag if provided */}
        {meme.imageStyle?.subtitle && (
          <div
            className="relative z-10 mb-3 rounded-md px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white uppercase shadow-md"
            style={{
              background: meme.imageStyle.headerBg || "rgba(0,0,0,0.6)",
              border: `1px solid ${meme.imageStyle.accentColor || "#ff0000"}`,
            }}
          >
            {meme.imageStyle.subtitle}
          </div>
        )}

        {/* Main Quote */}
        <p
          className="relative z-10 max-w-[90%] font-display text-lg font-black uppercase leading-tight tracking-wide text-white sm:text-xl drop-shadow-md"
        >
          "{meme.quote}"
        </p>

        {/* Driver attribution */}
        <p
          className="relative z-10 mt-3 text-xs font-extrabold uppercase tracking-widest text-white/70"
        >
          — {meme.driver} ({meme.driverCode})
        </p>

        {/* Double-tap Heart Animation */}
        {showHeartAnim && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <Heart className="animate-heart-pulse h-24 w-24 fill-red-500 text-red-500 drop-shadow-2xl" />
          </div>
        )}

        {/* Double-tap instruction tag */}
        <div className="absolute bottom-2 right-2.5 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white/60 backdrop-blur-sm">
          Double-tap to ❤️
        </div>
      </div>

      {/* ── Action Bar (Instagram Icons) ── */}
      <div className="flex items-center justify-between border-t border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={onToggleLike}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 transition-transform active:scale-125 hover:text-red-500"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isLiked ? "fill-red-500 text-red-500" : "text-gray-300"
              }`}
            />
            <span className="font-num text-xs font-bold text-white">{likesDisplay}</span>
          </button>

          {/* Comment */}
          <button
            onClick={onOpenLightbox}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 transition-colors hover:text-white"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-num text-xs text-gray-400">{meme.commentsCount || "2.1K"}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            title="Copy meme text"
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 transition-colors hover:text-white"
          >
            {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Share2 className="h-5 w-5" />}
          </button>
        </div>

        {/* Bookmark */}
        <button
          onClick={onToggleSave}
          className="text-gray-300 transition-colors hover:text-white"
        >
          <Bookmark className={`h-5 w-5 ${isSaved ? "fill-white text-white" : ""}`} />
        </button>
      </div>

      {/* ── Instagram Caption & Description ── */}
      <div className="flex flex-1 flex-col gap-2 p-4 pt-1">
        {/* Caption */}
        <p className="text-xs leading-relaxed text-gray-300">
          <span className="font-bold text-white mr-1.5">{handle}</span>
          {meme.caption || meme.description}
        </p>

        {/* Description expander */}
        {meme.description && meme.caption && (
          <div className="mt-1">
            <p
              className="text-xs leading-relaxed text-gray-400"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: isExpanded ? 999 : 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {meme.description}
            </p>
            <button
              onClick={onToggleExpand}
              className="mt-1 flex items-center gap-1 text-[11px] font-bold text-pink-400 transition-colors hover:text-pink-300"
            >
              {isExpanded ? "Show less" : "More details"}
              <ChevronDown
                className="h-3 w-3 transition-transform"
                style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
              />
            </button>
          </div>
        )}

        {/* Viral Stars & Tag list */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
          <ViralStars rating={meme.viralRating} />

          <a
            href={meme.instagramUrl || "https://www.instagram.com/f1memesig/?hl=en"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-pink-400 hover:underline"
          >
            <span>Instagram</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── VIDEO LINK CARD ───────────────────────────────────────────────── */
function VideoLinkCard({
  meme,
  isExpanded,
  onToggleExpand,
}: {
  meme: Meme;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const catColor = getCategoryColor(meme.category);
  const ytUrl = `https://www.youtube.com/watch?v=${meme.youtubeId}`;

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: "oklch(0.145 0.006 255)",
        border: "1px solid oklch(1 0 0 / 9%)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
      }}
    >
      {/* ── Video Hero Area ── */}
      <a
        href={ytUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex min-h-[220px] flex-col items-center justify-center px-6 py-8 text-center no-underline"
        style={{ background: meme.bgGradient }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(225,6,0,0.12) 0%, transparent 70%)",
          }}
        />

        {/* YouTube Play Icon Button */}
        <div
          className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
          style={{
            background: "oklch(0.60 0.245 27)",
            boxShadow: "0 6px 30px oklch(0.60 0.245 27 / 0.5)",
          }}
        >
          <Play className="ml-1 h-7 w-7 text-white" />
        </div>

        {/* Quote preview */}
        <p className="relative z-10 max-w-[90%] font-display text-base font-black uppercase leading-tight tracking-wide text-white sm:text-lg drop-shadow-md">
          "{meme.quote}"
        </p>

        {/* Tap to watch badge */}
        <div
          className="relative z-10 mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-white"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
        >
          <Youtube className="h-3.5 w-3.5 text-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Watch Clip on YouTube</span>
          <ExternalLink className="h-3 w-3 opacity-70" />
        </div>

        {/* Category badge */}
        <div
          className="absolute right-3 top-3 rounded-full px-2.5 py-1"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${catColor}40`,
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: catColor }}>
            {meme.category}
          </span>
        </div>
      </a>

      {/* ── Content Details ── */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-base font-bold uppercase leading-tight text-white">
          {meme.emoji} {meme.title}
        </h3>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold" style={{ color: catColor }}>
            {meme.driver}
          </span>
          <span className="text-gray-600">·</span>
          <span className="font-num text-gray-400">
            {meme.year} · {meme.race}
          </span>
        </div>

        <p
          className="text-xs leading-relaxed text-gray-400"
          style={{
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
            className="flex items-center gap-1 text-xs font-bold text-red-400 transition-colors hover:text-red-300"
          >
            {isExpanded ? "Show less" : "Read more"}
            <ChevronDown
              className="h-3 w-3 transition-transform"
              style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
            />
          </button>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
          <ViralStars rating={meme.viralRating} />
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-red-500"
          >
            <Youtube className="h-3.5 w-3.5" />
            <span>Play</span>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── LIGHTBOX MODAL FOR NON-VIDEO MEMES ───────────────────────────── */
function MemeLightboxModal({
  meme,
  isLiked,
  onToggleLike,
  onClose,
}: {
  meme: Meme;
  isLiked: boolean;
  onToggleLike: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${meme.quote}" — ${meme.driver}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl"
        style={{ background: "oklch(0.14 0.005 255)" }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero Graphic Frame */}
        <div
          className="relative flex min-h-[300px] flex-col items-center justify-center p-8 text-center"
          style={{ background: meme.bgGradient }}
        >
          <span className="mb-4 text-6xl drop-shadow-2xl">{meme.emoji}</span>
          <p className="font-display text-2xl font-black uppercase leading-tight tracking-wide text-white drop-shadow-lg">
            "{meme.quote}"
          </p>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-white/70">
            — {meme.driver} ({meme.race}, {meme.year})
          </p>
        </div>

        {/* Content details */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{meme.handle || "@f1memesig"}</span>
              <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-bold text-pink-400">
                {meme.category}
              </span>
            </div>
            <ViralStars rating={meme.viralRating} />
          </div>

          <p className="text-sm leading-relaxed text-gray-300 mb-6">{meme.description}</p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleLike}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                <span>{isLiked ? "Liked" : "Like"}</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Copied!" : "Copy Quote"}</span>
              </button>
            </div>

            <a
              href={meme.instagramUrl || "https://www.instagram.com/f1memesig/?hl=en"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white transition-transform hover:scale-105"
              style={{
                background:
                  "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
              }}
            >
              <Instagram className="h-4 w-4" />
              <span>View on Instagram</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
