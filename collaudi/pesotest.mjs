/* Quanto pesa lo storico con dentro le differenze? Lo stato viaggia intero a
   ogni sincronizzazione, quindi il conto va fatto, non stimato. */
import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lib = require("./peso-lib.cjs");
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const topo = JSON.parse(readFileSync("topologia-vera.json", "utf8"));
const s = { ...base, sedi: topo.sedi, magazzini: topo.magazzini.map((m) => ({ ...m })), log: [] };
const PR = base.prodotti;
/* i numeri veri: 13 magazzini, in media 22 articoli */
s.magazzini.forEach((m, k) => {
  m.articoli = PR.slice(0, 11 + (k % 25)).map((p, i) => ({ prodottoId: p.id, uomId: p.uomBase, par: 4, qty: i % 5 }));
});
const nArt = s.magazzini.reduce((n, m) => n + m.articoli.length, 0);
const partenza = JSON.stringify(s).length;
console.log(`stato di partenza: ${(partenza / 1024).toFixed(1)} KB · ${s.magazzini.length} magazzini · ${nArt} articoli`);

/* 50 azioni da 20 caselle l'una: lo storico pieno, il caso peggiore realistico */
let cur = s;
for (let i = 0; i < 50; i++) {
  const pri = lib.fotoCaselle(cur);
  const b = JSON.parse(JSON.stringify(cur));
  let tocc = 0;
  for (const m of b.magazzini) for (const a of m.articoli) { if (tocc >= 20) break; a.qty = (a.qty + 1) % 7; tocc++; }
  /* esattamente quello che fa l'app quando scrive una voce di storico */
  b.log = lib.sfoltisci([lib.voceLog({ logId: "l" + i, t: Date.now(), chi: "Admin", descr: "Giacenza su 20 caselle" }, pri, b), ...b.log].slice(0, 50));
  cur = b;
}
const pieno = JSON.stringify(cur).length;
console.log(`storico pieno (50 azioni × 20 caselle): ${(pieno / 1024).toFixed(1)} KB`);
console.log(`crescita: +${((pieno - partenza) / 1024).toFixed(1)} KB (+${Math.round((pieno / partenza - 1) * 100)}%)`);

/* e il tetto: un'azione enorme non deve salvare niente */
const pri = lib.fotoCaselle(cur);
const b = JSON.parse(JSON.stringify(cur));
for (const m of b.magazzini) for (const a of m.articoli) a.qty = 99;
const v = lib.voceLog({ logId: "big", t: Date.now(), chi: "Admin", descr: "Riempi tutto" }, pri, b);
console.log(`azione da ${nArt} caselle → ${v.cambi ? "salvata (" + v.cambi.length + ")" : "NON salvata, segnate " + v.tante + " caselle"}`);
if (v.cambi) { console.log("  !! il tetto non ha funzionato"); process.exit(1); }
const cresciuto = (pieno - partenza) / 1024;
let ko = 0;
const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
ok(cresciuto < 30, `lo storico pieno costa meno di 30 KB (${cresciuto.toFixed(1)} KB)`);
ok(!v.cambi, "un'azione enorme non salva il dettaglio, salva solo il conto");
const conDett = cur.log.filter((e) => e.cambi).length;
ok(conDett <= lib.MAX_VOCI_CAMBI, `solo le ultime ${lib.MAX_VOCI_CAMBI} azioni conservano il dettaglio (${conDett})`);
ok(cur.log.length === 50, `lo storico resta lungo 50 voci (${cur.log.length})`);
process.exit(ko ? 1 : 0);
