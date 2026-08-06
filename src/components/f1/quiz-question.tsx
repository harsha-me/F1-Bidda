import { useState } from "react";
import { TRAIT_COLOR, type QuizOption, type QuizQuestion, type Trait } from "@/lib/quiz-match";
import { QuizTrackBackground } from "./quiz-track-background";

const ANSWER_DELAY_MS = 220;

export function QuizQuestionCard({
  question,
  index,
  total,
  leadingTrait,
  onAnswer,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  leadingTrait: Trait | null;
  onAnswer: (option: QuizOption) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const accentColor = leadingTrait ? TRAIT_COLOR[leadingTrait] : "oklch(0.60 0.245 27)";

  function handleSelect(option: QuizOption) {
    if (selectedId) return; // already advancing
    setSelectedId(option.id);
    window.setTimeout(() => onAnswer(option), ANSWER_DELAY_MS);
  }

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden px-4 py-16 sm:px-8"
      style={{ minHeight: "calc(100dvh - 3.5rem)" }}
    >
      <QuizTrackBackground accentColor={accentColor} />

      <div
        key={question.id}
        className="relative mx-auto w-full max-w-3xl animate-in fade-in slide-in-from-right-6 duration-400"
      >
        {/* Progress */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? "1.75rem" : "0.9rem",
                  background: i <= index ? accentColor : "oklch(1 0 0 / 12%)",
                }}
              />
            ))}
          </div>
          <span
            className="font-num text-xs font-semibold"
            style={{ color: "oklch(0.52 0.010 255)", letterSpacing: "0.1em" }}
          >
            QUESTION {index + 1} / {total}
          </span>
        </div>

        <h2
          className="text-center font-display font-black uppercase leading-tight"
          style={{
            fontSize: "clamp(1.6rem, 4.5vw, 2.75rem)",
            letterSpacing: "-0.01em",
            color: "oklch(0.94 0.003 255)",
          }}
        >
          {question.prompt}
        </h2>

        <div
          className="mt-10 grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {question.options.map((option) => {
            const selected = selectedId === option.id;
            const dimmed = selectedId !== null && !selected;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                disabled={selectedId !== null}
                className="group relative flex min-h-[7rem] flex-col justify-center overflow-hidden px-6 py-5 text-left transition-all duration-200 disabled:cursor-default hover:-translate-y-1"
                style={{
                  background: "oklch(0.155 0.006 255)",
                  border: `1px solid ${selected ? accentColor : "oklch(1 0 0 / 8%)"}`,
                  borderRadius: "0.75rem",
                  opacity: dimmed ? 0.35 : 1,
                  transform: selected ? "scale(1.02)" : undefined,
                  boxShadow: selected
                    ? `0 0 0 1px ${accentColor}, 0 12px 32px -8px ${accentColor}66`
                    : undefined,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}14, transparent 60%)`,
                  }}
                />
                <span
                  className="relative font-display text-lg font-bold uppercase leading-snug sm:text-xl"
                  style={{ color: "oklch(0.92 0.003 255)" }}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
