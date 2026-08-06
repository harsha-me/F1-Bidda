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
  /** "legend" drivers are retired; "current" are on the present grid. */
  era: "legend" | "current";
  tagline: string;
  /** The 3 traits that most define this driver — used by the signature term. */
  signature: Trait[];
  /** One-line character read shown on the reveal screen. */
  verdict: string;
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

/** Component breakdown of a single driver's composite score, for display + debugging. */
export interface ScoreBreakdown {
  /** Pearson correlation of trait shape, in [-1, 1]. */
  shape: number;
  /** Closeness of absolute intensity, in [0, 1]. */
  magnitude: number;
  /** Overlap between the user's leading traits and the driver's signature, in [0, 1]. */
  signature: number;
  /** Team-affinity bonus actually applied (0 when it didn't match). */
  teamBonus: number;
  /** Final weighted composite. */
  total: number;
}

export interface MatchResult {
  driverId: string;
  driver: DriverArchetype;
  normalizedUser: TraitScores;
  /** Composite match score, normalized to 0–100 for display. */
  matchPercent: number;
  breakdown: ScoreBreakdown;
  /** Runners-up, best first, for the "close calls" strip on the reveal. */
  runnersUp: { driverId: string; driver: DriverArchetype; matchPercent: number }[];
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

/**
 * Composite scoring weights. Shape leads because it is the most reliable
 * signal (see `correlation` below), but on its own it ignores intensity —
 * a mildly strategic user and a fanatically strategic one correlate
 * identically. Magnitude and signature restore that lost information.
 */
const WEIGHTS = {
  shape: 0.5,
  magnitude: 0.2,
  signature: 0.3,
} as const;

/** Applied post-composite, so it can settle a near-tie but never flip a clear win. */
const TEAM_AFFINITY_BONUS = 0.04;

/** Widest possible per-trait gap, used to normalize the magnitude term. */
const TRAIT_RANGE = 10;

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

/**
 * Coverage-weighted magnitude closeness, in [0, 1].
 *
 * Complements `correlation`: shape says "you both lean strategic", magnitude
 * says "and you lean that way just as hard". Traits are weighted by how many
 * questions actually probe them, so a trait the quiz asks about four times
 * counts for more than one it touches once.
 */
function magnitudeCloseness(user: TraitScores, driver: TraitScores, weights: TraitScores): number {
  let weighted = 0;
  let totalWeight = 0;
  for (const t of TRAITS) {
    const gap = Math.abs(user[t] - driver[t]) / TRAIT_RANGE;
    weighted += weights[t] * gap;
    totalWeight += weights[t];
  }
  return totalWeight > 0 ? 1 - weighted / totalWeight : 0;
}

/**
 * How much of the user's trait "mass" sits on this driver's signature traits,
 * in [0, 1].
 *
 * Value-weighted rather than rank-weighted, which matters because several
 * traits routinely tie at the top — a rank-based version silently resolved
 * those ties in TRAITS declaration order, handing the win to whichever
 * signature happened to sort earliest.
 *
 * This is what makes a result feel *earned*: max out aggression and risk and
 * you should get Senna or Ricciardo, not whoever sits nearest in raw vector
 * space.
 */
function signatureOverlap(user: TraitScores, signature: Trait[]): number {
  if (signature.length === 0) return 0;

  const onSignature = signature.reduce((s, t) => s + user[t], 0);
  // Ceiling: the same number of the user's own strongest traits.
  const best = [...TRAITS]
    .sort((a, b) => user[b] - user[a])
    .slice(0, signature.length)
    .reduce((s, t) => s + user[t], 0);

  return best > 0 ? Math.min(1, onSignature / best) : 0;
}

/** Per-trait weights proportional to how many questions probe each trait. */
function coverageWeights(max: TraitScores): TraitScores {
  const weights = emptyTraitScores();
  for (const t of TRAITS) weights[t] = max[t];
  return weights;
}

export function matchDriver(
  rawScores: TraitScores,
  teamAffinity: string | null,
  drivers: Record<string, DriverArchetype>,
  questions: QuizQuestion[],
): MatchResult {
  const max = maxTraitTotals(questions);
  const normalizedUser = normalizeTraitScores(rawScores, max);
  const weights = coverageWeights(max);

  const topTraits = [...TRAITS]
    .filter((t) => normalizedUser[t] > 0)
    .sort((a, b) => normalizedUser[b] - normalizedUser[a])
    .slice(0, 3);

  const scored = Object.entries(drivers).map(([driverId, driver]) => {
    const shape = correlation(normalizedUser, driver.traits);
    const magnitude = magnitudeCloseness(normalizedUser, driver.traits, weights);
    const signature = signatureOverlap(normalizedUser, driver.signature);
    const teamBonus =
      teamAffinity && driver.constructorId === teamAffinity ? TEAM_AFFINITY_BONUS : 0;

    // Shape spans [-1, 1]; rescale to [0, 1] so every term shares one scale
    // and the weights mean what they look like they mean.
    const total =
      WEIGHTS.shape * ((shape + 1) / 2) +
      WEIGHTS.magnitude * magnitude +
      WEIGHTS.signature * signature +
      teamBonus;

    return {
      driverId,
      driver,
      breakdown: { shape, magnitude, signature, teamBonus, total } satisfies ScoreBreakdown,
    };
  });

  scored.sort((a, b) => b.breakdown.total - a.breakdown.total);
  const [winner, ...rest] = scored;

  // Spread the raw composite (which clusters in a narrow band) across a
  // friendlier display range so a strong match reads as a strong match.
  const toPercent = (total: number) =>
    Math.max(0, Math.min(100, Math.round((total - 0.45) * (100 / 0.5))));

  return {
    driverId: winner.driverId,
    driver: winner.driver,
    normalizedUser,
    matchPercent: toPercent(winner.breakdown.total),
    breakdown: winner.breakdown,
    runnersUp: rest.slice(0, 3).map((r) => ({
      driverId: r.driverId,
      driver: r.driver,
      matchPercent: toPercent(r.breakdown.total),
    })),
    topTraits,
  };
}
