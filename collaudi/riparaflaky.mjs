import { readFileSync, writeFileSync } from "fs";

const vecchio = "await C.goto(URL); await C.waitForTimeout(2500);";
const nuovo = [
  "await C.goto(URL);",
  "/* ── PERCHE' QUESTO COLLAUDO ERA CAPRICCIOSO ──",
  "   Qui c'era un'attesa fissa di 2,5 secondi. Da solo bastava; dentro il",
  "   censimento, con decine di browser che si contendono la macchina, a volte",
  "   no — e il collaudo diventava rosso a caso. E' il peggior tipo di rosso:",
  "   insegna a non fidarsi del rosso. Adesso aspetta che «Pino» ci sia davvero,",
  "   fino a mezzo minuto, e riparte appena compare. */",
  'await C.getByText("Pino", { exact: false }).first().waitFor({ state: "visible", timeout: 30000 });',
].join("\n");

let s = readFileSync("pin2test.mjs", "utf8");
if (!s.includes(vecchio)) { console.log("!! riga non trovata"); process.exit(1); }
writeFileSync("pin2test.mjs", s.replace(vecchio, nuovo));
console.log("attesa fissa sostituita da un'attesa vera");
