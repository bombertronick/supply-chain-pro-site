import { readFileSync, writeFileSync } from "fs";
const f = "finaltest.mjs";
let s = readFileSync(f, "utf8");
const rigaG = 'await p.getByRole("button", { name: /Gestione rapida/ }).click(); await p.waitForTimeout(500);';
const nuovoG = 'await p.getByRole("button", { name: /^Articoli$/ }).click(); await p.waitForTimeout(400);';
if (!s.includes(rigaG)) { console.log("!! riga non trovata"); process.exit(1); }
s = s.replace(rigaG, nuovoG);
s = s.replace(/\/\* da gen-5\.52 «Sposta» sta dentro «Gestione rapida» \*\//,
  "/* questo pezzo e' nella PLANCIA, non nel magazzino: li' i comandi stanno in\n     gruppi da gen-5.47 e «Sposta» e' sotto «Articoli». «Gestione rapida» non\n     esiste in quella schermata — l'avevo corretto con la ricetta sbagliata. */");
writeFileSync(f, s);
console.log("finaltest: passa dal gruppo «Articoli» della Plancia");
