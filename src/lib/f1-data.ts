// Real F1 data layer, powered by Jolpica-F1 (Ergast-compatible) + OpenF1.
// No mock/random data. Kept type shapes compatible with existing UI.

import { countryFlag, teamColor } from "./f1-constants";

const JOLP = "https://api.jolpi.ca/ergast/f1";
const OPENF1 = "https://api.openf1.org/v1";

// ---------- Cache ----------

type CacheEntry = { ts: number; ttl: number; value: unknown };
const CACHE = new Map<string, CacheEntry>();
const INFLIGHT = new Map<string, Promise<unknown>>();

async function cachedFetch<T>(url: string, ttlMs: number): Promise<T> {
  const now = Date.now();
  const hit = CACHE.get(url);
  if (hit && now - hit.ts < hit.ttl) return hit.value as T;
  const pending = INFLIGHT.get(url);
  if (pending) return pending as Promise<T>;
  const p = (async () => {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
    const data = (await res.json()) as T;
    CACHE.set(url, { ts: Date.now(), ttl: ttlMs, value: data });
    INFLIGHT.delete(url);
    return data;
  })();
  INFLIGHT.set(url, p);
  return p;
}

// TTLs
const TTL_LIVE = 60_000; // 60s for live sessions/telemetry
const TTL_STATIC = 60 * 60_000; // 1h for schedule/results/standings
const TTL_MED = 5 * 60_000; // 5m for standings during a running season

// ---------- Types (kept for UI/MCP compatibility) ----------

export type TeamColor = string;

export interface Driver {
  code: string;
  name: string;
  team: string;
  teamColor: TeamColor;
  number: number;
  driverId?: string;
  constructorId?: string;
}

export interface Race {
  id: string; // `${season}-${round}`
  season: number;
  round: number;
  name: string;
  circuit: string;
  circuitId?: string;
  country: string;
  flag: string;
  date: string; // ISO
  laps: number;
  weather: string;
  winner?: string; // driver code
  completed: boolean;
}

export type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTER" | "WET";

export interface LapRecord {
  driver: string;
  lap: number;
  lapTime: number; // seconds
  compound?: Compound;
  tyreAge?: number;
  position: number;
  pit: boolean;
}

export interface Stint {
  driver: string;
  compound: Compound;
  startLap: number;
  endLap: number;
}

export interface StandingRow {
  position: number;
  driver: Driver;
  points: number;
  wins: number;
  delta: number;
}

export interface ConstructorRow {
  position: number;
  team: string;
  color: string;
  points: number;
  wins: number;
  delta: number;
}

export interface ResultRow {
  position: number;
  driver: Driver;
  grid: number;
  points: number;
  status: string;
  time?: string;
  fastestLap: boolean;
}

export interface QualifyingResultRow {
  position: number;
  driver: Driver;
  q1?: string;
  q2?: string;
  q3?: string;
}

export interface TelemetrySample {
  distance: number;
  speed: number;
  throttle: number;
  brake: number;
}

// ---------- Season list ----------
// We restrict to years available in Jolpica lap/results coverage.
export const SEASONS = [2026, 2025, 2024, 2023];
export const CURRENT_SEASON = 2026;

// ---------- Helpers ----------

function parseLapTime(t?: string): number {
  if (!t) return 0;
  // formats: "1:23.456" or "83.456"
  const m = t.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
  if (!m) return 0;
  const mins = m[1] ? Number(m[1]) : 0;
  const secs = Number(m[2]);
  return mins * 60 + secs;
}

function toDriver(d: any, c: any): Driver {
  const constructorId: string | undefined = c?.constructorId;
  const teamName: string = c?.name ?? "";
  const code: string = d?.code ?? (d?.familyName ? d.familyName.slice(0, 3).toUpperCase() : "???");
  return {
    code,
    name: `${d?.givenName ?? ""} ${d?.familyName ?? ""}`.trim(),
    team: teamName,
    teamColor: teamColor(constructorId),
    number: Number(d?.permanentNumber ?? 0),
    driverId: d?.driverId,
    constructorId,
  };
}

// ---------- Jolpica: Races ----------

export async function fetchSeasonRaces(season: number): Promise<Race[]> {
  const data = await cachedFetch<any>(`${JOLP}/${season}.json?limit=100`, TTL_STATIC);
  const races: any[] = data?.MRData?.RaceTable?.Races ?? [];
  const now = Date.now();
  return races.map((r) => {
    const round = Number(r.round);
    const country = r?.Circuit?.Location?.country ?? "";
    const dateIso = r.time ? `${r.date}T${r.time}` : `${r.date}T00:00:00Z`;
    return {
      id: `${season}-${round}`,
      season,
      round,
      name: r.raceName,
      circuit: r?.Circuit?.circuitName ?? "",
      circuitId: r?.Circuit?.circuitId,
      country,
      flag: countryFlag(country),
      date: dateIso,
      laps: 0, // filled from results when available
      weather: "TBD",
      completed: new Date(dateIso).getTime() < now,
    } satisfies Race;
  });
}

export async function fetchNextRace(): Promise<Race | null> {
  const races = await fetchSeasonRaces(CURRENT_SEASON);
  const now = Date.now();
  const upcoming = races.find((r) => new Date(r.date).getTime() > now);
  return upcoming ?? races[races.length - 1] ?? null;
}

// ---------- Jolpica: Standings ----------

export async function fetchDriverStandings(season: number): Promise<StandingRow[]> {
  const data = await cachedFetch<any>(`${JOLP}/${season}/driverStandings.json?limit=100`, TTL_MED);
  const list = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
  return list.map((row: any, i: number) => {
    const c = row?.Constructors?.[0];
    return {
      position: Number(row.position ?? i + 1),
      driver: toDriver(row.Driver, c),
      points: Number(row.points ?? 0),
      wins: Number(row.wins ?? 0),
      delta: 0,
    } satisfies StandingRow;
  });
}

export async function fetchConstructorStandings(season: number): Promise<ConstructorRow[]> {
  const data = await cachedFetch<any>(
    `${JOLP}/${season}/constructorStandings.json?limit=100`,
    TTL_MED,
  );
  const list = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];
  return list.map((row: any, i: number) => ({
    position: Number(row.position ?? i + 1),
    team: row?.Constructor?.name ?? "",
    color: teamColor(row?.Constructor?.constructorId),
    points: Number(row.points ?? 0),
    wins: Number(row.wins ?? 0),
    delta: 0,
  }));
}

// Derive driver list for a season from standings (no separate roster endpoint needed).
export async function fetchSeasonDrivers(season: number): Promise<Driver[]> {
  const rows = await fetchDriverStandings(season).catch(() => [] as StandingRow[]);
  return rows.map((r) => r.driver);
}

// ---------- Jolpica: Results / Laps / Pitstops ----------

function parseRaceId(raceId: string): { season: number; round: number } | null {
  const [s, r] = raceId.split("-").map(Number);
  if (!Number.isFinite(s) || !Number.isFinite(r)) return null;
  return { season: s, round: r };
}

export async function fetchRace(raceId: string): Promise<Race | null> {
  const p = parseRaceId(raceId);
  if (!p) return null;
  const races = await fetchSeasonRaces(p.season);
  const race = races.find((r) => r.id === raceId) ?? null;
  if (!race) return null;
  // enrich laps count from results if completed
  if (race.completed) {
    const results = await fetchRaceResults(raceId).catch(() => [] as ResultRow[]);
    const winnerLaps = results[0];
    if (winnerLaps) {
      // Ergast Result has "laps" — refetch raw to grab it
      try {
        const data = await cachedFetch<any>(
          `${JOLP}/${p.season}/${p.round}/results.json`,
          TTL_STATIC,
        );
        const laps = Number(data?.MRData?.RaceTable?.Races?.[0]?.Results?.[0]?.laps ?? 0);
        if (laps) race.laps = laps;
      } catch {
        /* ignore */
      }
      race.winner = winnerLaps.driver.code;
    }
  }
  return race;
}

export async function fetchRaceResults(raceId: string): Promise<ResultRow[]> {
  const p = parseRaceId(raceId);
  if (!p) return [];
  const data = await cachedFetch<any>(`${JOLP}/${p.season}/${p.round}/results.json`, TTL_STATIC);
  const results: any[] = data?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
  let fastest = -1;
  let fastestTime = Infinity;
  results.forEach((r, i) => {
    const t = parseLapTime(r?.FastestLap?.Time?.time);
    if (t > 0 && t < fastestTime) {
      fastestTime = t;
      fastest = i;
    }
  });
  return results.map((r, i) => ({
    position: Number(r.position ?? i + 1),
    driver: toDriver(r.Driver, r.Constructor),
    grid: Number(r.grid ?? 0),
    points: Number(r.points ?? 0),
    status: r.status ?? "",
    time: r?.Time?.time,
    fastestLap: i === fastest,
  }));
}

export async function fetchQualifyingResults(raceId: string): Promise<QualifyingResultRow[]> {
  const p = parseRaceId(raceId);
  if (!p) return [];
  const data = await cachedFetch<any>(`${JOLP}/${p.season}/${p.round}/qualifying.json`, TTL_STATIC);
  const results: any[] = data?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults ?? [];
  return results.map((r, i) => ({
    position: Number(r.position ?? i + 1),
    driver: toDriver(r.Driver, r.Constructor),
    q1: r.Q1 || undefined,
    q2: r.Q2 || undefined,
    q3: r.Q3 || undefined,
  }));
}

export async function fetchRaceLaps(raceId: string, drivers?: string[]): Promise<LapRecord[]> {
  const p = parseRaceId(raceId);
  if (!p) return [];
  // Ergast paginates laps; pull up to 2000 timings per page
  const all: LapRecord[] = [];
  const wantedCodes = drivers?.length ? new Set(drivers) : null;
  // Build driverId → code lookup from results
  const results = await fetchRaceResults(raceId).catch(() => [] as ResultRow[]);
  const idToCode = new Map<string, string>();
  results.forEach((r) => {
    if (r.driver.driverId) idToCode.set(r.driver.driverId, r.driver.code);
  });
  const pitStops = await fetchPitStops(raceId).catch(() => [] as PitStop[]);
  const pitKey = new Set(pitStops.map((s) => `${s.driverCode}:${s.lap}`));

  let offset = 0;
  const limit = 2000;
  // fetch all pages
  // Ergast max ~30 pages for a full race; guard with page cap
  for (let page = 0; page < 30; page++) {
    const data = await cachedFetch<any>(
      `${JOLP}/${p.season}/${p.round}/laps.json?limit=${limit}&offset=${offset}`,
      TTL_STATIC,
    );
    const laps: any[] = data?.MRData?.RaceTable?.Races?.[0]?.Laps ?? [];
    if (laps.length === 0) break;
    laps.forEach((lap) => {
      const lapNum = Number(lap.number);
      (lap.Timings ?? []).forEach((t: any) => {
        const code = idToCode.get(t.driverId) ?? t.driverId?.slice(0, 3).toUpperCase();
        if (wantedCodes && !wantedCodes.has(code)) return;
        all.push({
          driver: code,
          lap: lapNum,
          lapTime: parseLapTime(t.time),
          position: Number(t.position ?? 0),
          pit: pitKey.has(`${code}:${lapNum}`),
        });
      });
    });
    const total = Number(data?.MRData?.total ?? 0);
    offset += limit;
    if (offset >= total) break;
  }
  return all;
}

export interface PitStop {
  driverCode: string;
  driverId: string;
  lap: number;
  stop: number;
  time: string;
  duration: string;
}

export async function fetchPitStops(raceId: string): Promise<PitStop[]> {
  const p = parseRaceId(raceId);
  if (!p) return [];
  const data = await cachedFetch<any>(
    `${JOLP}/${p.season}/${p.round}/pitstops.json?limit=200`,
    TTL_STATIC,
  );
  const stops: any[] = data?.MRData?.RaceTable?.Races?.[0]?.PitStops ?? [];
  const results = await fetchRaceResults(raceId).catch(() => [] as ResultRow[]);
  const idToCode = new Map<string, string>();
  results.forEach((r) => {
    if (r.driver.driverId) idToCode.set(r.driver.driverId, r.driver.code);
  });
  return stops.map((s) => ({
    driverId: s.driverId,
    driverCode: idToCode.get(s.driverId) ?? s.driverId?.slice(0, 3).toUpperCase(),
    lap: Number(s.lap),
    stop: Number(s.stop),
    time: s.time,
    duration: s.duration,
  }));
}

// ---------- OpenF1: session helpers + stints/telemetry ----------

export interface OF1Session {
  session_key: number;
  meeting_key: number;
  location: string;
  country_name: string;
  circuit_short_name: string;
  session_name: string; // "Race", "Qualifying", ...
  date_start: string;
  date_end: string;
  year: number;
}

export interface OF1Driver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  team_colour: string; // e.g. "0090FF" (no #)
  country_code?: string;
  headshot_url?: string;
}

export interface OF1Position {
  driver_number: number;
  position: number;
  date: string;
}

export interface OF1Weather {
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  wind_direction: number;
  date: string;
}

export async function fetchLatestSession(): Promise<OF1Session | null> {
  const arr = await cachedFetch<OF1Session[]>(`${OPENF1}/sessions?session_key=latest`, TTL_LIVE);
  return arr?.[0] ?? null;
}

export async function fetchSessionDrivers(
  sessionKey: number | "latest" = "latest",
): Promise<OF1Driver[]> {
  return cachedFetch<OF1Driver[]>(`${OPENF1}/drivers?session_key=${sessionKey}`, TTL_LIVE);
}

export async function fetchLatestPositions(): Promise<OF1Position[]> {
  return cachedFetch<OF1Position[]>(`${OPENF1}/position?session_key=latest`, TTL_LIVE);
}

export async function fetchLatestWeather(): Promise<OF1Weather | null> {
  const arr = await cachedFetch<OF1Weather[]>(`${OPENF1}/weather?session_key=latest`, TTL_LIVE);
  return arr?.[arr.length - 1] ?? null;
}

export interface OF1CarSample {
  date: string;
  speed: number;
  throttle: number;
  brake: number;
  n_gear: number;
  rpm: number;
  drs: number;
}

export async function fetchCarData(
  driverNumber: number,
  sessionKey: number | "latest" = "latest",
): Promise<OF1CarSample[]> {
  return cachedFetch<OF1CarSample[]>(
    `${OPENF1}/car_data?session_key=${sessionKey}&driver_number=${driverNumber}&speed>=1`,
    TTL_LIVE,
  );
}

// Distance-based samples for one lap, downsampled for chart use.
export async function fetchTelemetry(
  driverNumber: number,
  sessionKey: number | "latest" = "latest",
  maxSamples = 400,
): Promise<TelemetrySample[]> {
  const samples = await fetchCarData(driverNumber, sessionKey);
  if (!samples.length) return [];
  // Take a middle slice of ~90s (~one lap-ish) worth of samples for smoothness.
  const total = samples.length;
  const start = Math.floor(total / 3);
  const end = Math.min(total, start + Math.min(total - start, 1200));
  const slice = samples.slice(start, end);
  // Integrate distance from speed samples (speed in km/h, dt seconds).
  const out: TelemetrySample[] = [];
  let dist = 0;
  let prev: Date | null = null;
  slice.forEach((s) => {
    const d = new Date(s.date);
    if (prev) {
      const dt = (d.getTime() - prev.getTime()) / 1000;
      dist += (s.speed / 3.6) * Math.max(0, Math.min(dt, 2));
    }
    prev = d;
    out.push({ distance: dist, speed: s.speed, throttle: s.throttle, brake: s.brake });
  });
  if (out.length <= maxSamples) return out;
  const step = Math.ceil(out.length / maxSamples);
  return out.filter((_, i) => i % step === 0);
}

// Stints from OpenF1 for a given race (season+round). Best-effort match by year+country.
export interface OF1Stint {
  driver_number: number;
  compound: string; // "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET"
  lap_start: number;
  lap_end: number;
  tyre_age_at_start: number;
}

function normalizeCompound(c: string): Compound {
  const u = c.toUpperCase();
  if (u.startsWith("INT")) return "INTER";
  if (u.startsWith("WET")) return "WET";
  if (u.startsWith("SOFT")) return "SOFT";
  if (u.startsWith("MED")) return "MEDIUM";
  return "HARD";
}

async function findOF1RaceSession(season: number, country: string): Promise<OF1Session | null> {
  try {
    const arr = await cachedFetch<OF1Session[]>(
      `${OPENF1}/sessions?year=${season}&session_name=Race`,
      TTL_STATIC,
    );
    if (!arr?.length) return null;
    const target = country.toLowerCase().replace(/\s+/g, "");
    const match = arr.find(
      (s) =>
        s.country_name?.toLowerCase().replace(/\s+/g, "") === target ||
        s.location?.toLowerCase().includes(country.toLowerCase()),
    );
    return match ?? null;
  } catch {
    return null;
  }
}

export async function fetchStints(raceId: string): Promise<Stint[]> {
  try {
    const p = parseRaceId(raceId);
    if (!p) return [];
    const races = await fetchSeasonRaces(p.season);
    const race = races.find((r) => r.id === raceId);
    if (!race) return [];
    const session = await findOF1RaceSession(p.season, race.country);
    if (!session) return [];
    const [drivers, stints] = await Promise.all([
      fetchSessionDrivers(session.session_key).catch(() => [] as OF1Driver[]),
      cachedFetch<OF1Stint[]>(
        `${OPENF1}/stints?session_key=${session.session_key}`,
        TTL_STATIC,
      ).catch(() => [] as OF1Stint[]),
    ]);
    const numToCode = new Map<number, string>();
    drivers.forEach((d) => {
      if (d && d.driver_number !== undefined) {
        numToCode.set(d.driver_number, d.name_acronym);
      }
    });
    return stints
      .map((s) => ({
        driver: numToCode.get(s.driver_number) ?? String(s.driver_number),
        compound: normalizeCompound(s.compound),
        startLap: s.lap_start,
        endLap: s.lap_end,
      }))
      .sort((a, b) => a.startLap - b.startLap);
  } catch (error) {
    console.error("Failed to fetch stints:", error);
    return [];
  }
}

// ---------- Compound color/letter (unchanged) ----------

export const COMPOUND_COLOR: Record<Compound, string> = {
  SOFT: "#E10600",
  MEDIUM: "#F5C518",
  HARD: "#F5F5F7",
  INTER: "#00D97E",
  WET: "#0090FF",
};

export const COMPOUND_LETTER: Record<Compound, string> = {
  SOFT: "S",
  MEDIUM: "M",
  HARD: "H",
  INTER: "I",
  WET: "W",
};

// ---------- Utility used by UI ----------

export function driverByCodeFrom(drivers: Driver[], code: string): Driver {
  return drivers.find((d) => d.code === code) ?? drivers[0];
}
