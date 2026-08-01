import { readFileSync, writeFileSync } from "fs";
const f = "plancia2test.mjs";
let s = readFileSync(f, "utf8");
const vecchio = 'const pezzi = nomiSvg.filter(t => !/·/.test(t) && !/^\\d+%$/.test(t) && !sediNomi.includes(t) && t !== "Altri magazzini".toUpperCase());';
const nuovo = [
  '/* ── COSA CONTA COME NOME DI MAGAZZINO ──',
  '   Il controllo qui sotto e\' quello importante: sulla mappa non deve comparire',
  '   NIENTE di inventato, solo magazzini che esistono davvero. Restava pero\'',
  '   indietro sulle DIDASCALIE: da gen-5.46 la mappa spiega anche chi rifornisce',
  '   chi, e scrive «da fornitore», «da Magazzino Lab…», «serve le linee» accanto',
  '   alle frecce. Non sono nomi di magazzini e non lo sono mai stati — sono le',
  '   scritte che rendono la mappa leggibile. Il collaudo le prendeva per nomi',
  '   falsi e si accendeva rosso su una cosa giusta. */',
  'const DIDASCALIE = /^(da |serve |verso |rifornisce )/i;',
  'const pezzi = nomiSvg.filter(t => !/·/.test(t) && !/^\\d+%$/.test(t) && !sediNomi.includes(t)',
  '  && !DIDASCALIE.test(t) && t !== "Altri magazzini".toUpperCase());',
].join("\n");
if (!s.includes(vecchio)) { console.log("!! riga non trovata"); process.exit(1); }
writeFileSync(f, s.replace(vecchio, nuovo));
console.log("plancia2test: le didascalie della mappa non contano piu' come nomi");
