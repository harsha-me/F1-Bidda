// "Find Your F1 Driver" quiz — trait model and driver matching.

export const TRAITS = [
  "aggression",
  "strategy",
  "precision",
  "emotion",
  "composure",
  "consistency",
  "riskTolerance",
] as const;

export type Trait = (typeof TRAITS)[number];

export type TraitScores = Record<Trait, number>;

export interface DriverArchetype {
  code: string;
  name: string;
  constructorId: string;
  number: number;
  traits: TraitScores;
}

export interface QuizOption {
  id: string;
  label: string;
  trait?: Trait;
  delta?: number;
  teamAffinity?: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

export interface MatchResult {
  driverId: string;
  driver: DriverArchetype;
  normalizedUser: TraitScores;
  /** Pearson correlation with the matched driver, in [-1, 1]. Higher is closer. */
  similarity: number;
  topTraits: Trait[];
}

export const TRAIT_LABEL: Record<Trait, string> = {
  aggression: "Aggression",
  strategy: "Strategy",
  precision: "Precision",
  emotion: "Emotion",
  composure: "Composure",
  consistency: "Consistency",
  riskTolerance: "Risk Tolerance",
};

export const TRAIT_COPY: Record<Trait, string> = {
  aggression: "you attack every opening, no hesitation",
  strategy: "you play the long game and win it on the pit wall",
  precision: "your inputs are clean, metronomic, repeatable",
  emotion: "you race with your heart on your sleeve",
  composure: "nothing rattles you, not even when it all goes wrong",
  consistency: "you deliver the same result, weekend after weekend",
  riskTolerance: "you thrive exactly when everyone else backs off",
};

// Kept within the site's existing hue families (red 27, amber 75, blue 250,
// teal 190, pink 350) with two nearby variants for composure/consistency.
export const TRAIT_COLOR: Record<Trait, string> = {
  aggression: "oklch(0.60 0.245 27)",
  riskTolerance: "oklch(0.80 0.18 75)",
  strategy: "oklch(0.62 0.20 250)",
  precision: "oklch(0.76 0.14 190)",
  emotion: "oklch(0.70 0.18 350)",
  composure: "oklch(0.66 0.16 200)",
  consistency: "oklch(0.70 0.15 165)",
};

// Small nudge on the [-1, 1] correlation scale — enough to settle a genuine
// near-tie, never enough to override a clear trait-shape match.
const TEAM_AFFINITY_BONUS = 0.08;

export function emptyTraitScores(): TraitScores {
  return TRAITS.reduce((acc, t) => {
    acc[t] = 0;
    return acc;
  }, {} as TraitScores);
}

// Sum, per question, of the largest delta offered for each trait — the
// ceiling a trait could reach if every relevant answer were picked.
export function maxTraitTotals(questions: QuizQuestion[]): TraitScores {
  const totals = emptyTraitScores();
  for (const q of questions) {
    const perQuestion = emptyTraitScores();
    for (const o of q.options) {
      if (o.trait && o.delta) {
        perQuestion[o.trait] = Math.max(perQuestion[o.trait], o.delta);
      }
    }
    for (const t of TRAITS) totals[t] += perQuestion[t];
  }
  return totals;
}

// Scales raw accumulated scores onto the same 0–10 scale driver profiles use,
// so traits touched by more questions (aggression, strategy) don't dominate
// the distance calculation just because they had more opportunities to score.
export function normalizeTraitScores(raw: TraitScores, max: TraitScores): TraitScores {
  const normalized = emptyTraitScores();
  for (const t of TRAITS) {
    normalized[t] = max[t] > 0 ? (raw[t] / max[t]) * 10 : 0;
  }
  return normalized;
}

/**
 * Pearson correlation between two trait vectors — cosine similarity on
 * mean-centered values, so it compares the *shape* of a profile rather than
 * its magnitude.
 *
 * Shape is what this quiz needs. Raw distance fails badly here: eight
 * questions can only push a trait to a handful of discrete levels (a trait
 * touched by one question lands at exactly 0 or 10), while driver profiles all
 * sit in a 3–10 mid-range. Straight Euclidean distance therefore rewards
 * whoever is nearest the population average and buries the distinctive
 * archetypes — Verstappen was reachable on 1 of 640 answer paths before this,
 * and Alonso never won a strategy-maxed run. Correlation asks the right
 * question instead: whose profile *leans* the way yours does?
 */
function correlation(a: TraitScores, b: TraitScores): number {
  const n = TRAITS.length;
  const meanA = TRAITS.reduce((s, t) => s + a[t], 0) / n;
  const meanB = TRAITS.reduce((s, t) => s + b[t], 0) / n;

  let num = 0;
  let denA = 0;
  let denB = 0;
  for (const t of TRAITS) {
    const da = a[t] - meanA;
    const db = b[t] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }

  // A perfectly flat vector has no shape to correlate against.
  if (denA === 0 || denB === 0) return 0;
  return num / Math.sqrt(denA * denB);
}

export function matchDriver(
  rawScores: TraitScores,
  teamAffinity: string | null,
  drivers: Record<string, DriverArchetype>,
  questions: QuizQuestion[],
): MatchResult {
  const max = maxTraitTotals(questions);
  const normalizedUser = normalizeTraitScores(rawScores, max);

  let best: MatchResult | null = null;
  for (const [driverId, driver] of Object.entries(drivers)) {
    let similarity = correlation(normalizedUser, driver.traits);
    if (teamAffinity && driver.constructorId === teamAffinity) {
      similarity += TEAM_AFFINITY_BONUS;
    }
    if (!best || similarity > best.similarity) {
      best = { driverId, driver, normalizedUser, similarity, topTraits: [] };
    }
  }

  // drivers is always non-empty (static grid data), so best is set.
  const result = best as MatchResult;
  result.topTraits = [...TRAITS]
    .filter((t) => normalizedUser[t] > 0)
    .sort((a, b) => normalizedUser[b] - normalizedUser[a])
    .slice(0, 3);

  return result;
}
