// Centralized HD Assets for F1 Drivers and Circuits

export const HD_DRIVER_PHOTOS: Record<string, string> = {
  // Current Grid & Drivers (keyed by driverId, code, or surname)
  verstappen: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png",
  norris: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png",
  leclerc: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png",
  hamilton: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png",
  russell: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png",
  sainz: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png",
  piastri: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png",
  alonso: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png",
  antonelli: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ANDANT01_Andrea_Kimi_Antonelli/andant01.png",
  albon: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png",
  stroll: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png",
  ocon: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png",
  gasly: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png",
  hulkenberg: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png",
  bottas: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png",
  perez: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png",
  colapinto: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png",
  bortoleto: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GABBOR01_Gabriel_Bortoleto/gabbor01.png",
  doohan: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/J/JACDOO01_Jack_Doohan/jacdoo01.png",
  bearman: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png",
  tsunoda: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png",
  hadjar: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png",
  lawson: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png",
  lindblad: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ARVLIN01_Arvid_Lindblad/arvlin01.png",

  // Acronym/Code mappings
  VER: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png",
  NOR: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png",
  LEC: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png",
  HAM: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png",
  RUS: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png",
  SAI: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png",
  PIA: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png",
  ALO: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png",
  ANT: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ANDANT01_Andrea_Kimi_Antonelli/andant01.png",
  ALB: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png",
  STR: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png",
  OCO: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png",
  GAS: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png",
  HUL: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png",
  BOT: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png",
  PER: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png",
  COL: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png",
  BOR: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GABBOR01_Gabriel_Bortoleto/gabbor01.png",
  DOO: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/J/JACDOO01_Jack_Doohan/jacdoo01.png",
  BEA: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png",
  TSU: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png",
  HAD: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png",
  LAW: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png",
  LIN: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ARVLIN01_Arvid_Lindblad/arvlin01.png",
};

export function getHDDriverPhoto(driverIdOrCode?: string, fallbackUrl?: string): string {
  if (!driverIdOrCode) return fallbackUrl || "";
  const key = driverIdOrCode.toLowerCase().trim();

  if (HD_DRIVER_PHOTOS[key]) return HD_DRIVER_PHOTOS[key];
  if (HD_DRIVER_PHOTOS[driverIdOrCode.toUpperCase()]) return HD_DRIVER_PHOTOS[driverIdOrCode.toUpperCase()];

  // Try matching surname segment
  const matchKey = Object.keys(HD_DRIVER_PHOTOS).find(
    (k) => k.endsWith(key) || key.endsWith(k)
  );
  if (matchKey) return HD_DRIVER_PHOTOS[matchKey];

  return fallbackUrl || "";
}

// Circuit SVG Layout maps (High clarity vector outlines)
export const CIRCUIT_MAP_SVGS: Record<string, string> = {
  "albert_park": "https://upload.wikimedia.org/wikipedia/commons/6/68/Albert_Park_Circuit_2021.svg",
  "americas": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Circuit_of_the_Americas_%28COTA%29.svg",
  "bahrain": "https://upload.wikimedia.org/wikipedia/commons/2/29/Bahrain_International_Circuit--Grand_Prix_Layout.svg",
  "baku": "https://upload.wikimedia.org/wikipedia/commons/5/52/Baku_City_Circuit_2016.svg",
  "catalunya": "https://upload.wikimedia.org/wikipedia/commons/2/20/Circuit_de_Catalunya_2021.svg",
  "hungaroring": "https://upload.wikimedia.org/wikipedia/commons/9/91/Hungaroring.svg",
  "imola": "https://upload.wikimedia.org/wikipedia/commons/6/60/Autodromo_Enzo_e_Dino_Ferrari_2020.svg",
  "interlagos": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Aut%C3%B3dromo_Jos%C3%A9_Carlos_Pace_%28layout_2014-present%29.svg",
  "jeddah": "https://upload.wikimedia.org/wikipedia/commons/1/19/Jeddah_Street_Circuit.svg",
  "losail": "https://upload.wikimedia.org/wikipedia/commons/d/d6/Losail_International_Circuit.svg",
  "marina_bay": "https://upload.wikimedia.org/wikipedia/commons/f/fb/Marina_Bay_Street_Circuit_2023.svg",
  "miami": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Miami_International_Autodrome_layout_2022.svg",
  "monaco": "https://upload.wikimedia.org/wikipedia/commons/3/36/Circuit_Monaco.svg",
  "monza": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Autodromo_Nazionale_Monza_pg.svg",
  "red_bull_ring": "https://upload.wikimedia.org/wikipedia/commons/8/87/Red_Bull_Ring.svg",
  "rodriguez": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez_2015.svg",
  "shanghai": "https://upload.wikimedia.org/wikipedia/commons/1/14/Shanghai_International_Racing_Circuit_track_map.svg",
  "silverstone": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Silverstone_Circuit_2011.svg",
  "spa": "https://upload.wikimedia.org/wikipedia/commons/5/54/Spa-Francorchamps_of_Belgium.svg",
  "suzuka": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Suzuka_circuit_map_%282005%29.svg",
  "vegas": "https://upload.wikimedia.org/wikipedia/commons/d/d6/Las_Vegas_Strip_Circuit.svg",
  "villeneuve": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Circuit_Gilles_Villeneuve.svg",
  "yas_marina": "https://upload.wikimedia.org/wikipedia/commons/8/89/Yas_Marina_Circuit_2021.svg",
  "zandvoort": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Circuit_Zandvoort_2020.svg",
};

export function getCircuitImageUrl(circuitId?: string): string {
  if (!circuitId) return "";
  const key = circuitId.toLowerCase().replace(/-/g, "_");
  return CIRCUIT_MAP_SVGS[key] || "";
}
