import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, X, Flag, MapPin, Zap, Award } from "lucide-react";
import { EyebrowRed, SectionHeader } from "@/components/f1/primitives";
import { ErrorNote } from "@/components/f1/skeleton";
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

      {/* Description + search row */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-relaxed" style={{ color: "oklch(0.56 0.012 255)" }}>
          Track layouts, iconic high-speed corners, elevation changes and tactical profiles
          for every venue on the global calendar.
        </p>

        {/* Search */}
        <div className="relative w-full max-w-sm shrink-0">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: "oklch(0.50 0.010 255)" }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search circuit, corner…"
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

      {/* Results count */}
      {query && (
        <div className="mb-4 text-xs" style={{ color: "oklch(0.50 0.010 255)" }}>
          {filtered.length} circuit{filtered.length !== 1 ? "s" : ""} matching &ldquo;{query}&rdquo;
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CircuitCard key={c.id} circuit={c} onOpen={() => setSelectedId(c.id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <ErrorNote message={`No circuits match your search for "${query}".`} />
      )}

      {selectedCircuit && (
        <CircuitModal circuit={selectedCircuit} onClose={() => setSelectedId(null)} />
      )}
    </main>
  );
}

function CircuitCard({ circuit, onOpen }: { circuit: CircuitInfo; onOpen: () => void }) {
  const mapSvg = getCircuitImageUrl(circuit.id);

  return (
    <button
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden text-left transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderRadius: "0.5rem",
        cursor: "pointer",
      }}
    >
      {/* Left accent stripe (country color — using red as default) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: "oklch(0.60 0.245 27)" }}
      />

      {/* Track layout image — right side offset */}
      {mapSvg && (
        <div className="absolute right-0 top-0 bottom-0 w-40 overflow-hidden pointer-events-none">
          <img
            src={mapSvg}
            alt=""
            aria-hidden
            className="absolute right-0 top-1/2 -translate-y-1/2 h-32 w-32 object-contain transition-all duration-500 group-hover:scale-110 group-hover:opacity-25"
            style={{
              filter: "invert(1) brightness(3)",
              opacity: 0.12,
            }}
          />
        </div>
      )}

      <div className="relative flex flex-1 flex-col gap-3 p-5 pl-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{circuit.flag}</span>
            <div>
              <EyebrowRed>{circuit.country}</EyebrowRed>
            </div>
          </div>
          <span
            className="shrink-0 font-num text-[10px] font-bold px-2 py-0.5 rounded"
            style={{
              background: "oklch(1 0 0 / 5%)",
              border: "1px solid oklch(1 0 0 / 8%)",
              color: "oklch(0.55 0.012 255)",
              letterSpacing: "0.06em",
            }}
          >
            {circuit.turns}T
          </span>
        </div>

        {/* Circuit name */}
        <div>
          <h3
            className="font-display font-bold uppercase leading-tight transition-colors group-hover:text-primary"
            style={{ fontSize: "1.1rem", letterSpacing: "0.03em" }}
          >
            {circuit.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.52 0.010 255)" }}>
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{circuit.location}</span>
          </div>
        </div>

        {/* Specs */}
        <div
          className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-num py-3"
          style={{
            borderTop: "1px solid oklch(1 0 0 / 5%)",
            borderBottom: "1px solid oklch(1 0 0 / 5%)",
          }}
        >
          <div>
            <span className="block text-[10px] uppercase tracking-wider" style={{ color: "oklch(0.50 0.010 255)" }}>
              Length
            </span>
            <span className="font-bold text-foreground">{circuit.lengthKm} km</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider" style={{ color: "oklch(0.50 0.010 255)" }}>
              First GP
            </span>
            <span className="font-bold text-foreground">{circuit.firstGrandPrix}</span>
          </div>
        </div>

        {/* Fast corners */}
        <div>
          <div
            className="flex items-center gap-1.5 text-xs font-display font-bold uppercase"
            style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.06em" }}
          >
            <Zap className="h-3 w-3" /> Fast Corners
          </div>
          <ul className="mt-1.5 space-y-0.5">
            {circuit.fastCorners.slice(0, 2).map((corner, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "oklch(0.56 0.012 255)" }}>
                <span
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                  style={{ background: "oklch(0.60 0.245 27)" }}
                />
                <span className="line-clamp-1">{corner}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Why special — blockquote style */}
        <blockquote
          className="text-xs italic leading-relaxed line-clamp-2"
          style={{
            borderLeft: "2px solid oklch(1 0 0 / 10%)",
            paddingLeft: "0.75rem",
            color: "oklch(0.52 0.010 255)",
          }}
        >
          {circuit.whySpecial}
        </blockquote>

        {/* Footer row */}
        <div
          className="flex items-center justify-between pt-1 text-xs font-display font-bold uppercase"
          style={{ color: "oklch(0.45 0.008 255)", letterSpacing: "0.06em" }}
        >
          <span className="group-hover:text-primary transition-colors">View Track Guide →</span>
          <span className="font-num font-normal text-[10px]">{circuit.lapRecord.split(" ")[0]}</span>
        </div>
      </div>
    </button>
  );
}

function CircuitModal({ circuit, onClose }: { circuit: CircuitInfo; onClose: () => void }) {
  const mapSvg = getCircuitImageUrl(circuit.id);

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
        {/* Top red bar */}
        <div
          className="h-[3px] w-full rounded-t-[0.75rem]"
          style={{ background: "linear-gradient(90deg, oklch(0.60 0.245 27), oklch(0.60 0.245 27 / 0))" }}
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

          {/* Header */}
          <div className="flex items-center gap-4">
            <span className="text-5xl leading-none">{circuit.flag}</span>
            <div>
              <EyebrowRed>{circuit.country} · Since {circuit.firstGrandPrix}</EyebrowRed>
              <h2
                className="mt-1.5 font-display font-black uppercase"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", lineHeight: 1.05 }}
              >
                {circuit.name}
              </h2>
              <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.52 0.010 255)" }}>
                <MapPin className="h-3 w-3" /> {circuit.location}
              </div>
            </div>
          </div>

          {/* Circuit diagram */}
          {mapSvg && (
            <div
              className="my-6 flex h-52 items-center justify-center overflow-hidden"
              style={{
                background: "oklch(0.12 0.004 255)",
                border: "1px solid oklch(1 0 0 / 8%)",
                borderRadius: "0.5rem",
              }}
            >
              <img
                src={mapSvg}
                alt={`${circuit.name} layout`}
                className="h-full max-h-44 w-full object-contain"
                style={{ filter: "invert(1) brightness(3) drop-shadow(0 0 16px rgba(255,255,255,0.2))" }}
              />
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Track Length", value: `${circuit.lengthKm} km` },
              { label: "Turns", value: circuit.turns },
              { label: "Lap Record", value: circuit.lapRecord.split(" ")[0] },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-1 p-3 text-center"
                style={{
                  background: "oklch(0.135 0.005 255)",
                  border: "1px solid oklch(1 0 0 / 6%)",
                  borderRadius: "0.5rem",
                }}
              >
                <span className="label-eyebrow">{s.label}</span>
                <span className="font-num text-base font-bold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Fast corners */}
          <div className="mt-6">
            <h4
              className="flex items-center gap-2 font-display text-sm font-bold uppercase"
              style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.06em" }}
            >
              <Zap className="h-4 w-4" /> Fast & Legendary Corners
            </h4>
            <ul className="mt-3 space-y-2">
              {circuit.fastCorners.map((corner, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm"
                  style={{
                    padding: "0.625rem 0.875rem",
                    background: "oklch(0.13 0.005 255)",
                    border: "1px solid oklch(1 0 0 / 6%)",
                    borderRadius: "0.375rem",
                  }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded font-num text-xs font-bold"
                    style={{
                      background: "oklch(0.60 0.245 27 / 0.18)",
                      color: "oklch(0.60 0.245 27)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>{corner}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Why special */}
          <blockquote
            className="mt-6 text-sm leading-relaxed"
            style={{
              borderLeft: "3px solid oklch(0.60 0.245 27)",
              paddingLeft: "1rem",
              color: "oklch(0.70 0.010 255)",
              fontStyle: "italic",
            }}
          >
            <div
              className="mb-1.5 flex items-center gap-1.5 font-display text-xs font-bold uppercase not-italic"
              style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.08em" }}
            >
              <Award className="h-3.5 w-3.5" /> Why This Track Is Special
            </div>
            {circuit.whySpecial}
          </blockquote>

          <div className="mt-7 flex justify-end">
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
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
