import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Repeat, Share2, Sparkles } from "lucide-react";
import { getHDDriverPhoto } from "@/lib/f1-assets";
import { teamColor } from "@/lib/f1-constants";
import { TRAITS, TRAIT_COPY, TRAIT_LABEL, type MatchResult } from "@/lib/quiz-match";
import teamHistoryRaw from "@/data/teamHistory.json";
import { QuizTrackBackground } from "./quiz-track-background";

type TeamHistoryEntry = { shortName: string };
const TEAM_HISTORY = teamHistoryRaw as Record<string, TeamHistoryEntry>;

export function QuizReveal({
  result,
  teamAffinity,
  onRetake,
}: {
  result: MatchResult;
  teamAffinity: string | null;
  onRetake: () => void;
}) {
  const { driverId, driver, normalizedUser, topTraits } = result;
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  const color = teamColor(driver.constructorId);
  const photo = getHDDriverPhoto(driverId, undefined);
  const teamName = TEAM_HISTORY[driver.constructorId]?.shortName ?? driver.constructorId;
  const matchedFavoriteTeam = teamAffinity && teamAffinity === driver.constructorId;

  async function handleShare() {
    const text = `I'm built like ${driver.name} 🏎️ — I found my F1 driver match on f1Bidda. Take the quiz:`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Find Your F1 Driver", text, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Share sheet dismissed or clipboard blocked — no-op.
    }
  }

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden px-4 py-16 sm:px-8"
      style={{ minHeight: "calc(100dvh - 3.5rem)" }}
    >
      <QuizTrackBackground accentColor={color} />

      <div className="relative mx-auto w-full max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-4 inline-flex items-center gap-2 px-3 py-1 animate-in fade-in duration-500"
            style={{
              background: `${color}18`,
              border: `1px solid ${color}44`,
              borderRadius: "0.25rem",
            }}
          >
            <Sparkles className="h-3 w-3" style={{ color }} />
            <span
              className="font-num text-[11px] font-semibold"
              style={{ color, letterSpacing: "0.1em" }}
            >
              YOUR MATCH
            </span>
          </div>

          {/* Photo with team-color accent burst */}
          <div className="relative mb-6 h-40 w-40 sm:h-48 sm:w-48">
            <div
              className="absolute inset-0 rounded-full animate-heart-pulse"
              style={{ background: color, opacity: 0.35 }}
            />
            <div
              className="absolute inset-0 overflow-hidden rounded-full animate-in fade-in zoom-in-90 duration-500"
              style={{ border: `3px solid ${color}`, boxShadow: `0 0 50px -10px ${color}99` }}
            >
              {photo && !imgError ? (
                <img
                  src={photo}
                  alt={driver.name}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div
                  className="grid h-full w-full place-items-center"
                  style={{ background: `${color}33` }}
                >
                  <span className="font-display text-3xl font-black" style={{ color }}>
                    {driver.code}
                  </span>
                </div>
              )}
            </div>
            <div
              className="absolute -bottom-1 -right-1 font-num text-xs font-black px-2 py-1"
              style={{
                background: color,
                color: "white",
                borderRadius: "0.375rem",
              }}
            >
              #{driver.number}
            </div>
          </div>

          <p
            className="font-display text-sm font-bold uppercase animate-in fade-in duration-500"
            style={{ color: "oklch(0.55 0.012 255)", letterSpacing: "0.08em" }}
          >
            You're built like
          </p>
          <h1
            className="mt-1 font-display font-black uppercase leading-none animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{
              fontSize: "clamp(2.25rem, 7vw, 4rem)",
              color,
              letterSpacing: "-0.02em",
              textShadow: `0 0 50px ${color}55`,
            }}
          >
            {driver.name}
          </h1>
          <p
            className="mt-2 font-display text-sm font-semibold uppercase"
            style={{ color: "oklch(0.55 0.012 255)", letterSpacing: "0.04em" }}
          >
            {teamName}
          </p>

          {matchedFavoriteTeam && (
            <p className="mt-2 text-xs" style={{ color: "oklch(0.50 0.010 255)" }}>
              Bonus: this also happens to be your favorite garage.
            </p>
          )}
        </div>

        {/* Reasons */}
        {topTraits.length > 0 && (
          <ul className="mx-auto mt-8 flex max-w-lg flex-col gap-3">
            {topTraits.map((t) => (
              <li
                key={t}
                className="flex items-start gap-3 px-4 py-3"
                style={{
                  background: "oklch(0.155 0.006 255)",
                  border: "1px solid oklch(1 0 0 / 7%)",
                  borderLeft: `3px solid ${color}`,
                  borderRadius: "0.5rem",
                }}
              >
                <span
                  className="mt-0.5 shrink-0 font-display text-[10px] font-bold uppercase px-1.5 py-0.5"
                  style={{ background: `${color}22`, color, borderRadius: "0.2rem" }}
                >
                  {TRAIT_LABEL[t]}
                </span>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: "oklch(0.75 0.008 255)" }}
                >
                  {TRAIT_COPY[t]}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Trait comparison */}
        <div
          className="mx-auto mt-8 max-w-lg overflow-hidden"
          style={{
            background: "oklch(0.155 0.006 255)",
            border: "1px solid oklch(1 0 0 / 7%)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
          }}
        >
          <div className="mb-4 label-eyebrow">You vs. {driver.name.split(" ").pop()}</div>
          <div className="flex flex-col gap-3">
            {TRAITS.map((t) => (
              <div key={t} className="flex items-center gap-3">
                <span
                  className="w-24 shrink-0 text-right text-[10px] font-semibold uppercase"
                  style={{ color: "oklch(0.52 0.010 255)", letterSpacing: "0.04em" }}
                >
                  {TRAIT_LABEL[t]}
                </span>
                <div
                  className="relative h-2 flex-1 overflow-hidden rounded-full"
                  style={{ background: "oklch(1 0 0 / 8%)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, normalizedUser[t] * 10)}%`,
                      background: color,
                      opacity: 0.85,
                    }}
                  />
                  <div
                    className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2"
                    style={{
                      left: `${Math.min(100, driver.traits[t] * 10)}%`,
                      background: "oklch(0.94 0.003 255)",
                    }}
                    title={`${driver.name}: ${driver.traits[t]}/10`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div
            className="mt-3 flex items-center gap-4 text-[10px]"
            style={{ color: "oklch(0.50 0.010 255)" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-3 rounded-full"
                style={{ background: color, opacity: 0.85 }}
              />
              You
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-0.5" style={{ background: "oklch(0.94 0.003 255)" }} />
              {driver.name.split(" ").pop()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/drivers/$driverId"
            params={{ driverId }}
            className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase transition-all hover:brightness-110"
            style={{
              background: color,
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.25rem",
              letterSpacing: "0.06em",
            }}
          >
            View Full Profile <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase transition-all hover:bg-white/10"
            style={{
              background: "oklch(1 0 0 / 5%)",
              border: "1px solid oklch(1 0 0 / 12%)",
              color: "oklch(0.85 0.005 255)",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.25rem",
              letterSpacing: "0.06em",
            }}
          >
            <Share2 className="h-4 w-4" /> {copied ? "Copied!" : "Share My Result"}
          </button>
          <button
            onClick={onRetake}
            className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase transition-opacity hover:opacity-70"
            style={{
              color: "oklch(0.55 0.012 255)",
              padding: "0.75rem 1.5rem",
              letterSpacing: "0.06em",
            }}
          >
            <Repeat className="h-4 w-4" /> Retake Quiz
          </button>
        </div>

        <p className="mt-10 text-center text-xs" style={{ color: "oklch(0.40 0.008 255)" }}>
          f1<span style={{ color: "oklch(0.60 0.245 27)" }}>Bidda</span> · matched from the current
          grid via trait similarity, for entertainment only.
        </p>
      </div>
    </section>
  );
}
