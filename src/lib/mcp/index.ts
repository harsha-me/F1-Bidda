import { defineMcp } from "@lovable.dev/mcp-js";
import listSeasons from "./tools/list-seasons";
import listDrivers from "./tools/list-drivers";
import listRaces from "./tools/list-races";
import getRace from "./tools/get-race";
import getNextRace from "./tools/get-next-race";
import getDriverStandings from "./tools/get-driver-standings";
import getConstructorStandings from "./tools/get-constructor-standings";
import getRaceLaps from "./tools/get-race-laps";

export default defineMcp({
  name: "f1bidda-mcp",
  title: "f1Bidda F1 MCP",
  version: "0.1.0",
  instructions:
    "F1 race strategy data from f1Bidda. Use list_seasons and list_drivers to discover valid IDs, then list_races / get_race for calendar and results, get_driver_standings and get_constructor_standings for championship tables, and get_race_laps for lap timing.",
  tools: [
    listSeasons,
    listDrivers,
    listRaces,
    getRace,
    getNextRace,
    getDriverStandings,
    getConstructorStandings,
    getRaceLaps,
  ],
});
