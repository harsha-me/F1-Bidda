import { Link } from "@tanstack/react-router";
import { ArrowRight, Flag } from "lucide-react";
import { QuizTrackBackground } from "./quiz-track-background";

export function QuizLanding({ onStart }: { onStart: () => void }) {
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden px-4 py-16 sm:px-8"
      style={{ minHeight: "calc(100dvh - 3.5rem)" }}
    >
      <QuizTrackBackground accentColor="oklch(0.60 0.245 27)" />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <div
          className="mb-6 inline-flex items-center gap-2 px-3 py-1 animate-in fade-in duration-700"
          style={{
            background: "oklch(0.60 0.245 27 / 0.08)",
            border: "1px solid oklch(0.60 0.245 27 / 0.3)",
            borderRadius: "0.25rem",
          }}
        >
          <Flag className="h-3 w-3" style={{ color: "oklch(0.60 0.245 27)" }} />
          <span
            className="font-num text-[11px] font-semibold"
            style={{ color: "oklch(0.60 0.245 27)", letterSpacing: "0.1em" }}
          >
            22 DRIVERS · 8 QUESTIONS
          </span>
        </div>

        <h1
          className="font-display font-black uppercase animate-in fade-in slide-in-from-bottom-6 duration-700"
          style={{
            fontSize: "clamp(2.75rem, 9vw, 6rem)",
            lineHeight: 0.92,
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ display: "block", color: "oklch(0.94 0.003 255)" }}>Find Your</span>
          <span
            style={{
              display: "block",
              color: "oklch(0.60 0.245 27)",
              WebkitTextStroke: "1px oklch(0.60 0.245 27)",
            }}
          >
            F1 Driver
          </span>
        </h1>

        <p
          className="mt-6 max-w-lg text-base leading-relaxed animate-in fade-in duration-700"
          style={{
            color: "oklch(0.58 0.012 255)",
            animationDelay: "150ms",
            animationFillMode: "both",
          }}
        >
          Eight calls only you can make — on the brakes, in the rain, on the radio when it all goes
          wrong. Answer honestly and we'll match you to the driver on the current grid who races
          like you do.
        </p>

        <button
          onClick={onStart}
          className="group mt-10 inline-flex items-center gap-2 font-display text-base font-bold uppercase transition-all hover:brightness-110 animate-in fade-in zoom-in-95 duration-700"
          style={{
            background: "oklch(0.60 0.245 27)",
            color: "white",
            padding: "1rem 2.5rem",
            borderRadius: "0.25rem",
            letterSpacing: "0.08em",
            clipPath: "polygon(0 0, 100% 0, 95% 100%, 0 100%)",
            boxShadow: "0 0 40px -8px oklch(0.60 0.245 27 / 0.6)",
            animationDelay: "250ms",
            animationFillMode: "both",
          }}
        >
          Start the Quiz
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>

        <Link
          to="/season"
          className="mt-8 font-display text-xs font-bold uppercase transition-opacity hover:opacity-80"
          style={{ color: "oklch(0.50 0.010 255)", letterSpacing: "0.08em" }}
        >
          Not feeling it? Jump straight to season stats →
        </Link>
      </div>
    </section>
  );
}
