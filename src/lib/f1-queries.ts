// TanStack Query options for real F1 data.
import { queryOptions } from "@tanstack/react-query";
import {
  fetchCarData,
  fetchConstructorStandings,
  fetchDriverStandings,
  fetchLatestPositions,
  fetchLatestSession,
  fetchLatestWeather,
  fetchNextRace,
  fetchPitStops,
  fetchRace,
  fetchRaceLaps,
  fetchRaceResults,
  fetchQualifyingResults,
  fetchSeasonDrivers,
  fetchSeasonRaces,
  fetchSessionDrivers,
  fetchStints,
  fetchTelemetry,
  fetchConstructorPointsProgression,
} from "./f1-data";

const STATIC_STALE = 60 * 60_000;
const MED_STALE = 5 * 60_000;
const LIVE_STALE = 60_000;

export const seasonRacesQuery = (season: number) =>
  queryOptions({
    queryKey: ["races", season],
    queryFn: () => fetchSeasonRaces(season),
    staleTime: STATIC_STALE,
  });

export const nextRaceQuery = () =>
  queryOptions({
    queryKey: ["next-race"],
    queryFn: () => fetchNextRace(),
    staleTime: MED_STALE,
  });

export const driverStandingsQuery = (season: number) =>
  queryOptions({
    queryKey: ["driver-standings", season],
    queryFn: () => fetchDriverStandings(season),
    staleTime: MED_STALE,
  });

export const constructorStandingsQuery = (season: number) =>
  queryOptions({
    queryKey: ["constructor-standings", season],
    queryFn: () => fetchConstructorStandings(season),
    staleTime: MED_STALE,
  });

export const seasonDriversQuery = (season: number) =>
  queryOptions({
    queryKey: ["season-drivers", season],
    queryFn: () => fetchSeasonDrivers(season),
    staleTime: MED_STALE,
  });

export const teamPointsProgressionQuery = (season: number, constructorId: string) =>
  queryOptions({
    queryKey: ["constructor-points-progression", season, constructorId],
    queryFn: () => fetchConstructorPointsProgression(season, constructorId),
    staleTime: MED_STALE,
    enabled: !!constructorId,
  });

export const raceQuery = (raceId: string) =>
  queryOptions({
    queryKey: ["race", raceId],
    queryFn: () => fetchRace(raceId),
    staleTime: STATIC_STALE,
  });

export const raceResultsQuery = (raceId: string) =>
  queryOptions({
    queryKey: ["race-results", raceId],
    queryFn: () => fetchRaceResults(raceId),
    staleTime: STATIC_STALE,
  });

export const qualifyingResultsQuery = (raceId: string) =>
  queryOptions({
    queryKey: ["qualifying-results", raceId],
    queryFn: () => fetchQualifyingResults(raceId),
    staleTime: STATIC_STALE,
  });

export const raceLapsQuery = (raceId: string) =>
  queryOptions({
    queryKey: ["race-laps", raceId],
    queryFn: () => fetchRaceLaps(raceId),
    staleTime: STATIC_STALE,
  });

export const pitStopsQuery = (raceId: string) =>
  queryOptions({
    queryKey: ["pitstops", raceId],
    queryFn: () => fetchPitStops(raceId),
    staleTime: STATIC_STALE,
  });

export const stintsQuery = (raceId: string) =>
  queryOptions({
    queryKey: ["stints", raceId],
    queryFn: () => fetchStints(raceId),
    staleTime: STATIC_STALE,
  });

export const latestSessionQuery = () =>
  queryOptions({
    queryKey: ["of1-session"],
    queryFn: () => fetchLatestSession(),
    staleTime: LIVE_STALE,
  });

export const latestWeatherQuery = () =>
  queryOptions({
    queryKey: ["of1-weather"],
    queryFn: () => fetchLatestWeather(),
    staleTime: LIVE_STALE,
  });

export const latestPositionsQuery = () =>
  queryOptions({
    queryKey: ["of1-positions"],
    queryFn: () => fetchLatestPositions(),
    staleTime: LIVE_STALE,
  });

export const sessionDriversQuery = (sessionKey: number | "latest" = "latest") =>
  queryOptions({
    queryKey: ["of1-drivers", sessionKey],
    queryFn: () => fetchSessionDrivers(sessionKey),
    staleTime: LIVE_STALE,
  });

export const carDataQuery = (driverNumber: number, sessionKey: number | "latest" = "latest") =>
  queryOptions({
    queryKey: ["of1-car-data", sessionKey, driverNumber],
    queryFn: () => fetchCarData(driverNumber, sessionKey),
    staleTime: LIVE_STALE,
    enabled: driverNumber > 0,
  });

export const telemetryQuery = (driverNumber: number, sessionKey: number | "latest" = "latest") =>
  queryOptions({
    queryKey: ["of1-telemetry", sessionKey, driverNumber],
    queryFn: () => fetchTelemetry(driverNumber, sessionKey),
    staleTime: LIVE_STALE,
    enabled: driverNumber > 0,
  });
