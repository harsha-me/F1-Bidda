import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { QuizLanding } from "@/components/f1/quiz-landing";
import { QuizQuestionCard } from "@/components/f1/quiz-question";
import { QuizReveal } from "@/components/f1/quiz-reveal";
import {
  TRAITS,
  emptyTraitScores,
  matchDriver,
  type DriverArchetype,
  type QuizOption,
  type QuizQuestion,
  type Trait,
  type TraitScores,
} from "@/lib/quiz-match";
import driverArchetypesRaw from "@/data/driverArchetypes.json";
import quizQuestionsRaw from "@/data/quizQuestions.json";

const DRIVERS = driverArchetypesRaw as Record<string, DriverArchetype>;
const QUESTIONS = quizQuestionsRaw as QuizQuestion[];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Find Your F1 Driver — f1Bidda" },
      {
        name: "description",
        content:
          "An 8-question personality quiz that matches you to the current F1 grid — from Verstappen's aggression to Alonso's strategy — based on how you'd actually drive.",
      },
      { property: "og:title", content: "Find Your F1 Driver — f1Bidda" },
      {
        property: "og:description",
        content: "Answer 8 questions on race craft, risk and temperament to find your F1 match.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Stage = "landing" | "question" | "reveal";

function Home() {
  const [stage, setStage] = useState<Stage>("landing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [traitScores, setTraitScores] = useState<TraitScores>(emptyTraitScores);
  const [teamAffinity, setTeamAffinity] = useState<string | null>(null);

  const leadingTrait = useMemo<Trait | null>(() => {
    let top: Trait | null = null;
    let topVal = 0;
    for (const t of TRAITS) {
      if (traitScores[t] > topVal) {
        top = t;
        topVal = traitScores[t];
      }
    }
    return top;
  }, [traitScores]);

  const result = useMemo(() => {
    if (stage !== "reveal") return null;
    return matchDriver(traitScores, teamAffinity, DRIVERS, QUESTIONS);
  }, [stage, traitScores, teamAffinity]);

  function handleStart() {
    setStage("question");
  }

  function handleAnswer(option: QuizOption) {
    if (option.trait && option.delta) {
      const trait = option.trait;
      const delta = option.delta;
      setTraitScores((prev) => ({ ...prev, [trait]: prev[trait] + delta }));
    }
    if (option.teamAffinity) {
      setTeamAffinity(option.teamAffinity);
    }

    const next = questionIndex + 1;
    if (next < QUESTIONS.length) {
      setQuestionIndex(next);
    } else {
      setStage("reveal");
    }
  }

  function handleRetake() {
    setTraitScores(emptyTraitScores());
    setTeamAffinity(null);
    setQuestionIndex(0);
    setStage("question");
  }

  if (stage === "landing") {
    return <QuizLanding onStart={handleStart} />;
  }

  if (stage === "question") {
    const question = QUESTIONS[questionIndex];
    return (
      <QuizQuestionCard
        key={question.id}
        question={question}
        index={questionIndex}
        total={QUESTIONS.length}
        leadingTrait={leadingTrait}
        onAnswer={handleAnswer}
      />
    );
  }

  if (!result) return null;

  return <QuizReveal result={result} teamAffinity={teamAffinity} onRetake={handleRetake} />;
}
