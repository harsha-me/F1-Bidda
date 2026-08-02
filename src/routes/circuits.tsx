import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, X, Flag, MapPin, Zap, Award } from "lucide-react";
import { EyebrowRed, SectionHeader } from "@/components/f1/primitives";
import { ErrorNote } from "@/components/f1/skeleton";
import circuitsData from "@/data/circuitsData.json";
import { getCircuitImageUrl } from "@/lib/f1-assets";

type CornerDetail = {
  name: string;
  turns: string;
  speed: string;
  gForce: string;
  gear: string;
  whyFamous: string;
};

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
  cornerDetails?: CornerDetail[];
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
        c.cornerDetails?.some(
          (cd) =>
            cd.name.toLowerCase().includes(q) ||
            cd.whyFamous.toLowerCase().includes(q) ||
            cd.turns.toLowerCase().includes(q)
        ) ||
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
          Track layouts, iconic high-speed corners, telemetry metrics, elevation changes and tactical profiles
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
  const photoUrl = getCircuitImageUrl(circuit.id);

  return (
    <button
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden text-left transition-all duration-200 hover:-translate-y-1"
      style={{
        background: "oklch(0.155 0.006 255)",
        border: "1px solid oklch(1 0 0 / 8%)",
        borderRadius: "0.5rem",
        cursor: "pointer",
      }}
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] z-10"
        style={{ background: "oklch(0.60 0.245 27)" }}
      />

      {/* Top Banner Image with Gradient */}
      <div className="relative h-44 w-full overflow-hidden bg-black/50">
        <img
          src={photoUrl}
          alt={circuit.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.155_0.006_255)] via-[oklch(0.155_0.006_255)/40] to-transparent" />

        {/* Top Badges Overlaid */}
        <div className="absolute top-3 left-4 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md border border-white/10">
            <span className="text-base leading-none">{circuit.flag}</span>
            <span className="font-display text-xs font-bold uppercase text-white tracking-wider">
              {circuit.country}
            </span>
          </div>

          <span
            className="font-num text-[11px] font-bold px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10"
            style={{ color: "oklch(0.60 0.245 27)" }}
          >
            {circuit.turns} TURNS
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-3 p-5 pt-2">
        {/* Circuit name */}
        <div>
          <h3
            className="font-display font-black uppercase leading-tight transition-colors group-hover:text-primary"
            style={{ fontSize: "1.15rem", letterSpacing: "0.03em" }}
          >
            {circuit.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.55 0.010 255)" }}>
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{circuit.location}</span>
          </div>
        </div>

        {/* Specs */}
        <div
          className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-num py-2.5"
          style={{
            borderTop: "1px solid oklch(1 0 0 / 6%)",
            borderBottom: "1px solid oklch(1 0 0 / 6%)",
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
              <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "oklch(0.58 0.012 255)" }}>
                <span
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                  style={{ background: "oklch(0.60 0.245 27)" }}
                />
                <span className="line-clamp-1">{corner}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Why special */}
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
  const photoUrl = getCircuitImageUrl(circuit.id);

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

        {/* Hero Circuit Photo Header */}
        <div className="relative h-56 w-full overflow-hidden">
          <img
            src={photoUrl}
            alt={circuit.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.155_0.006_255)] via-[oklch(0.155_0.006_255)/60] to-transparent" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded p-1.5 z-20 transition-colors bg-black/60 text-white border border-white/20 hover:bg-black/80"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 z-10">
            <div className="flex items-center gap-3">
              <span className="text-4xl leading-none">{circuit.flag}</span>
              <div>
                <EyebrowRed>{circuit.country} · Debut {circuit.firstGrandPrix}</EyebrowRed>
                <h2
                  className="mt-1 font-display font-black uppercase text-white"
                  style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", lineHeight: 1.05 }}
                >
                  {circuit.name}
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-white/80">
                  <MapPin className="h-3 w-3" /> {circuit.location}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-4">
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

          {/* Fast corners & Telemetry Breakdown */}
          {circuit.cornerDetails && circuit.cornerDetails.length > 0 ? (
            <div className="mt-6">
              <h4
                className="flex items-center gap-2 font-display text-sm font-bold uppercase"
                style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.06em" }}
              >
                <Zap className="h-4 w-4" /> Key Corner Breakdown &amp; Telemetry
              </h4>
              <div className="mt-3 space-y-3">
                {circuit.cornerDetails.map((cd, i) => (
                  <div
                    key={i}
                    className="p-4"
                    style={{
                      background: "oklch(0.135 0.005 255)",
                      border: "1px solid oklch(1 0 0 / 7%)",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-num text-xs font-bold px-2 py-0.5 rounded"
                          style={{
                            background: "oklch(0.60 0.245 27 / 0.18)",
                            color: "oklch(0.60 0.245 27)",
                            border: "1px solid oklch(0.60 0.245 27 / 0.3)",
                          }}
                        >
                          {cd.turns}
                        </span>
                        <h5 className="font-display font-bold text-sm text-foreground uppercase tracking-wide">
                          {cd.name}
                        </h5>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 font-num text-[11px]">
                        {cd.speed && (
                          <span
                            className="px-2 py-0.5 rounded font-semibold"
                            style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.85 0.15 85)" }}
                          >
                            ⚡ {cd.speed}
                          </span>
                        )}
                        {cd.gForce && (
                          <span
                            className="px-2 py-0.5 rounded font-semibold"
                            style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.75 0.15 140)" }}
                          >
                            🎯 {cd.gForce}
                          </span>
                        )}
                        {cd.gear && (
                          <span
                            className="px-2 py-0.5 rounded font-semibold"
                            style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.70 0.01 255)" }}
                          >
                            ⚙️ {cd.gear}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed" style={{ color: "oklch(0.65 0.01 255)" }}>
                      {cd.whyFamous}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <h4
                className="flex items-center gap-2 font-display text-sm font-bold uppercase"
                style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.06em" }}
              >
                <Zap className="h-4 w-4" /> Fast &amp; Legendary Corners
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
          )}

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

