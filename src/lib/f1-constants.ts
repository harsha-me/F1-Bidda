// Static reference data for real F1 APIs (Jolpica/Ergast has no colors/flags).

export const TEAM_COLORS: Record<string, string> = {
  // Ergast constructorId → hex
  red_bull: "#0090FF",
  mercedes: "#00D2BE",
  ferrari: "#E10600",
  mclaren: "#FF8000",
  aston_martin: "#00A19B",
  alpine: "#0090FF",
  williams: "#005AFF",
  rb: "#6692FF",
  alphatauri: "#2B4562",
  sauber: "#52E252",
  alfa: "#900000",
  haas: "#B6BABD",
  cadillac: "#C9B37E",
  audi: "#00E4E4",
};

export const TEAM_COLOR_FALLBACK = "#8A8A8A";

export function teamColor(constructorId?: string | null): string {
  if (!constructorId) return TEAM_COLOR_FALLBACK;
  return TEAM_COLORS[constructorId] ?? TEAM_COLOR_FALLBACK;
}

// Country → flag emoji lookup for calendar UI.
const FLAGS: Record<string, string> = {
  Bahrain: "🇧🇭",
  "Saudi Arabia": "🇸🇦",
  Australia: "🇦🇺",
  Japan: "🇯🇵",
  China: "🇨🇳",
  USA: "🇺🇸",
  "United States": "🇺🇸",
  UnitedStates: "🇺🇸",
  Italy: "🇮🇹",
  Monaco: "🇲🇨",
  Canada: "🇨🇦",
  Spain: "🇪🇸",
  Austria: "🇦🇹",
  UK: "🇬🇧",
  "United Kingdom": "🇬🇧",
  Great_Britain: "🇬🇧",
  Hungary: "🇭🇺",
  Belgium: "🇧🇪",
  Netherlands: "🇳🇱",
  Singapore: "🇸🇬",
  Mexico: "🇲🇽",
  Brazil: "🇧🇷",
  Qatar: "🇶🇦",
  UAE: "🇦🇪",
  "United Arab Emirates": "🇦🇪",
  Azerbaijan: "🇦🇿",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Portugal: "🇵🇹",
  Russia: "🇷🇺",
  Turkey: "🇹🇷",
};

export function countryFlag(country?: string): string {
  if (!country) return "🏁";
  return FLAGS[country] ?? FLAGS[country.replace(/\s+/g, "_")] ?? "🏁";
}
