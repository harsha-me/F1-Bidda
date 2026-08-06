# f1Bidda — F1 Race Strategy Analytics

A deep, interactive Formula 1 analytics platform: real strategy simulation, tire degradation curves, and live standings for analysts — plus a driver-personality quiz, meme vault, and news feed for everyone else.

Live data comes from [Jolpica-F1](https://github.com/jolpica/jolpica-f1) (Ergast-compatible) and [OpenF1](https://openf1.org/); nothing on the standings, results, or lap-time pages is fabricated.

## Features

**🏎️ Find Your F1 Driver** ([`/`](src/routes/index.tsx)) — A 10-question personality quiz that scores you on 7 traits (aggression, strategy, precision, emotion, composure, consistency, risk tolerance) and matches you against 16 drivers — the current grid plus 9 retired legends — using a weighted composite of trait-shape correlation, magnitude closeness, and signature-trait overlap. Every driver is reachable and none dominates more than ~20% of the 2,560 possible answer paths (verified by exhaustive sweep, not eyeballed).

**📊 Season Overview** ([`/season`](src/routes/season.tsx)) — Full schedule, driver standings, and constructor standings for the current season.

**🏁 Strategy Simulator** ([`/strategy`](src/routes/strategy.tsx)) — Pit-strategy what-if analysis with tire degradation curves and cliff prediction, built from real Jolpica lap data — undercut/overcut modeling included.

**⚖️ Driver Comparison** ([`/compare`](src/routes/compare.tsx)) — Radar-chart head-to-head between any two drivers.

**🏆 Craziest Races** ([`/races`](src/routes/races.tsx)) — The 50 most chaotic Grands Prix of all time, with video and chaos ratings; drill into any [race](src/routes/race.$raceId.tsx) for lap-by-lap position changes and tire strategy.

**🧑‍🤝‍🧑 Drivers** ([`/drivers`](src/routes/drivers.tsx)) — Every current-grid driver (bios, personal life, road to F1, controversies) plus a "Legends of the Sport" hall of fame for retired greats, each with career stats pulled from a static dataset since they don't appear in live standings.

**🏗️ Teams** ([`/teams`](src/routes/teams.tsx)) — Constructor grid with livery showcases, driver lineups, points progression, and championship history per team.

**🗺️ Circuits** ([`/circuits`](src/routes/circuits.tsx)) — Track layouts, iconic corners, and tactical guides for every venue on the calendar.

**📰 News** ([`/news`](src/routes/news.tsx)) — Live, auto-updating RSS feed of real F1 headlines from leading motorsport outlets.

**😂 F1 Memes** ([`/f1memes`](src/routes/f1memes.tsx)) — A curated vault of the sport's most legendary moments and social screenshots.

## Built with

- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) + [TanStack Query](https://tanstack.com/query)
- TypeScript + React 19
- Tailwind CSS 4 + Radix UI primitives
- Recharts for data visualization
- Vite + Nitro

## Development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd f1Bidda
npm i
npm run dev
```

Other scripts: `npm run build` (production build), `npm run lint`, `npm run format`.
