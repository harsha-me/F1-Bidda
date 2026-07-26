import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, X, Flag, MapPin, Zap, Info, ShieldAlert, Award } from "lucide-react";
import { Eyebrow, GlassCard, SectionHeader } from "@/components/f1/primitives";
import circuitsData from "@/data/circuitsData.json";
import { getCircuitImageUrl } from "@/lib/f1-assets";

type CircuitInfo = {
  id: string;
  name: string;
  location: string;
  country: string;
  flag: string;
  lengthKm: number;
  turns: number;
  lapRecord: string;
  firstGrandPrix: number;
  fastCorners: string[];
  whySpecial: string;
};

const ALL_CIRCUITS = circuitsData as CircuitInfo[];

export const Route = createFileRoute("/circuits")({
  head: () => ({
    meta: [
      { title: "Circuits · Fast Corners & Track Guides · f1Bidda" },
      {
        name: "description",
        content:
          "Explore every Formula 1 circuit: fast corners, lap records, track characteristics, elevation changes and why each venue is special.",
      },
      { property: "og:title", content: "Circuits · Fast Corners & Track Guides · f1Bidda" },
      {
        property: "og:description",
        content: "Track layouts, iconic fast corners, and tactical guides for every F1 venue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CircuitsPage,
});

function CircuitsPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_CIRCUITS;
    const q = query.toLowerCase();
    return ALL_CIRCUITS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.fastCorners.some((fc) => fc.toLowerCase().includes(q)) ||
        c.whySpecial.toLowerCase().includes(q)
    );
  }, [query]);

  const selectedCircuit = selectedId
    ? ALL_CIRCUITS.find((c) => c.id === selectedId) ?? null
    : null;

  useEffect(() => {
    if (!selectedCircuit) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCircuit]);

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <SectionHeader
        eyebrow="World Championship Venues"
        title="Formula 1 Circuits"
      />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-muted-foreground">
        Track layouts, iconic high-speed corners, elevation changes and tactical profiles for every venue on the global calendar.
      </p>

      {/* SEARCH BAR */}
      <div className="mb-8 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search circuit, fast corners (e.g. Eau Rouge, 130R)..."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* CIRCUITS GRID */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CircuitCard key={c.id} circuit={c} onOpen={() => setSelectedId(c.id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <GlassCard className="py-12 text-center text-sm text-muted-foreground">
          No circuits match your search for "{query}".
        </GlassCard>
      )}

      {/* DETAIL MODAL */}
      {selectedCircuit && (
        <CircuitModal circuit={selectedCircuit} onClose={() => setSelectedId(null)} />
      )}
    </main>
  );
}

function CircuitCard({ circuit, onOpen }: { circuit: CircuitInfo; onOpen: () => void }) {
  const mapSvg = getCircuitImageUrl(circuit.id);

  return (
    <GlassCard
      hover
      className="group relative flex flex-col justify-between overflow-hidden p-6 cursor-pointer"
      onClick={onOpen}
    >
      {/* Background track layout silhouette */}
      {mapSvg && (
        <img
          src={mapSvg}
          alt={`${circuit.name} outline`}
          className="pointer-events-none absolute -right-6 -bottom-6 h-40 w-40 object-contain opacity-15 filter invert brightness-200 transition-all duration-300 group-hover:scale-110 group-hover:opacity-30"
        />
      )}

      <div>
        {/* Header meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{circuit.flag}</span>
            <Eyebrow>{circuit.country}</Eyebrow>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-num text-xs font-semibold text-muted-foreground">
            {circuit.turns} TURNS
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-3 font-display text-xl font-bold uppercase leading-snug tracking-wide text-foreground group-hover:text-primary transition-colors">
          {circuit.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span>{circuit.location}</span>
        </div>

        {/* Track Specs Pill */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs font-num">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Length</span>
            <span className="font-bold text-foreground">{circuit.lengthKm} km</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">First GP</span>
            <span className="font-bold text-foreground">{circuit.firstGrandPrix}</span>
          </div>
        </div>

        {/* Fast Corners Section */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-display font-semibold uppercase tracking-wider text-primary">
            <Zap className="h-3.5 w-3.5" /> Fast & Iconic Corners
          </div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {circuit.fastCorners.slice(0, 2).map((corner, i) => (
              <li key={i} className="line-clamp-1 flex items-start gap-1.5">
                <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                <span>{corner}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Why Special Highlight */}
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
          <div className="flex items-center gap-1 font-display font-bold uppercase text-primary">
            <Info className="h-3.5 w-3.5 shrink-0" /> Why It's Special
          </div>
          <p className="mt-1 line-clamp-2 text-muted-foreground leading-relaxed">
            {circuit.whySpecial}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3 text-xs font-display uppercase tracking-widest text-primary">
        <span>Explore Track Guide →</span>
        <span className="font-num text-[10px] text-muted-foreground">{circuit.lapRecord.split(" ")[0]}</span>
      </div>
    </GlassCard>
  );
}

function CircuitModal({ circuit, onClose }: { circuit: CircuitInfo; onClose: () => void }) {
  const mapSvg = getCircuitImageUrl(circuit.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass-card relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-background/80 p-2 text-foreground hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="text-4xl">{circuit.flag}</span>
          <div>
            <Eyebrow>{circuit.country} · Since {circuit.firstGrandPrix}</Eyebrow>
            <h2 className="mt-1 font-display text-2xl font-bold uppercase sm:text-3xl">
              {circuit.name}
            </h2>
          </div>
        </div>

        {/* Track Vector Layout Hero */}
        {mapSvg && (
          <div className="my-6 flex h-48 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <img
              src={mapSvg}
              alt={`${circuit.name} vector outline`}
              className="h-full max-h-40 w-full object-contain filter invert brightness-250 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
            />
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Track Length</div>
            <div className="mt-1 font-num text-lg font-bold">{circuit.lengthKm} km</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Turns</div>
            <div className="mt-1 font-num text-lg font-bold">{circuit.turns}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Lap Record</div>
            <div className="mt-1 font-num text-xs font-bold leading-tight">{circuit.lapRecord}</div>
          </div>
        </div>

        {/* Fast Corners */}
        <div className="mt-6">
          <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-primary">
            <Zap className="h-4 w-4" /> Fast & Legendary Corners
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-foreground">
            {circuit.fastCorners.map((corner, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 font-num text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span>{corner}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Why Special Deep Dive */}
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-5">
          <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-primary">
            <Award className="h-4 w-4" /> Why This Track Is Special
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {circuit.whySpecial}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 px-4 py-2 font-display text-xs font-semibold uppercase tracking-widest hover:bg-white/20"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
