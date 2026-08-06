import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Calendar, Flag, Trophy, ChevronRight } from "lucide-react";
import { EyebrowRed, StatCard } from "@/components/f1/primitives";
import { teamColor as teamColorFor } from "@/lib/f1-constants";

export interface LegendDriver {
  code: string;
  name: string;
  constructorId: string;
  teamName: string;
  number: number;
  nationality: string;
  flag: string;
  championships: number;
  firstSeason: number;
  lastSeason: number;
  wins: number;
  poles: number;
  podiums: number;
  photo: string;
  tagline: string;
  about: string;
}

/**
 * Profile page for retired drivers. They never appear in the live Jolpica
 * standings the current-grid page reads from, so their career figures come
 * from the static legendDrivers.json dataset instead.
 */
export function LegendProfile({ legend }: { legend: LegendDriver }) {
  const [imgError, setImgError] = useState(false);
  const color = teamColorFor(legend.constructorId);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <Link
        to="/drivers"
        className="mb-6 inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase transition-opacity hover:opacity-70"
        style={{ color: "oklch(0.55 0.012 255)", letterSpacing: "0.06em" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All Drivers
      </Link>

      <div
        className="relative mb-8 overflow-hidden"
        style={{
          background: "oklch(0.145 0.005 255)",
          border: "1px solid oklch(1 0 0 / 8%)",
          borderRadius: "0.75rem",
          borderTop: `3px solid ${color}`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 30% 0%, ${color}18, transparent 70%)`,
          }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-[320px_1fr]">
          <div
            className="relative min-h-[320px] lg:min-h-[420px] overflow-hidden"
            style={{
              background: `linear-gradient(160deg, ${color}35 0%, oklch(0.10 0.004 255) 70%)`,
            }}
          >
            {!imgError ? (
              <img
                src={legend.photo}
                alt={legend.name}
                onError={() => setImgError(true)}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <span
                  className="font-display font-black select-none"
                  style={{ fontSize: "8rem", color: "oklch(1 0 0 / 0.15)", lineHeight: 1 }}
                >
                  {legend.code}
                </span>
              </div>
            )}

            <div
              className="absolute bottom-4 right-4 font-num text-2xl font-black px-3 py-1.5"
              style={{
                backgroundColor: `${color}cc`,
                color: "white",
                borderRadius: "0.375rem",
                backdropFilter: "blur(8px)",
              }}
            >
              #{legend.number}
            </div>

            <div
              className="absolute top-4 left-4 font-display text-[10px] font-bold uppercase px-2 py-1"
              style={{
                background: "oklch(0.80 0.18 75 / 0.15)",
                border: "1px solid oklch(0.80 0.18 75 / 0.4)",
                color: "oklch(0.80 0.18 75)",
                borderRadius: "0.25rem",
                letterSpacing: "0.08em",
                backdropFilter: "blur(8px)",
              }}
            >
              Legend
            </div>
          </div>

          <div className="flex flex-col justify-between p-6 sm:p-10">
            <div>
              <EyebrowRed>{legend.teamName}</EyebrowRed>
              <h1
                className="mt-2 font-display font-black uppercase leading-none"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
              >
                {legend.name}
              </h1>
              <p
                className="mt-2 font-display text-sm font-semibold uppercase italic"
                style={{ color, letterSpacing: "0.04em" }}
              >
                “{legend.tagline}”
              </p>

              <div
                className="mt-4 flex flex-wrap gap-4 text-sm"
                style={{ color: "oklch(0.56 0.012 255)" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5" />
                  <span className="text-base">{legend.flag}</span>
                  {legend.nationality}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {legend.firstSeason}–{legend.lastSeason}
                </span>
                {legend.championships > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5" />
                    {legend.championships}× World Champion
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Championships" value={legend.championships} accent="red" />
                <StatCard label="Career Wins" value={legend.wins} accent="amber" />
                <StatCard label="Pole Positions" value={legend.poles} accent="teal" />
                <StatCard label="Podiums" value={legend.podiums} accent="blue" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/teams/$teamId"
                params={{ teamId: legend.constructorId }}
                className="inline-flex items-center gap-1.5 font-display text-sm font-bold uppercase px-4 py-2 transition-all hover:brightness-110"
                style={{
                  background: `${color}15`,
                  border: `1px solid ${color}40`,
                  color,
                  borderRadius: "0.375rem",
                  letterSpacing: "0.06em",
                }}
              >
                {legend.teamName} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "oklch(0.155 0.006 255)",
          border: "1px solid oklch(1 0 0 / 7%)",
          borderLeft: `3px solid ${color}`,
          borderRadius: "0.75rem",
          padding: "1.5rem",
        }}
      >
        <EyebrowRed className="mb-3">Career</EyebrowRed>
        <p className="text-sm leading-relaxed" style={{ color: "oklch(0.72 0.008 255)" }}>
          {legend.about}
        </p>
      </div>
    </div>
  );
}
