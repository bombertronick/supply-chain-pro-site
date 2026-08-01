/* Il controllo delle conversioni, misurato sui DATI VERI di produzione.
   Non su un caso costruito: sui 13 magazzini e 102 prodotti di Valerio. */
import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lib = require("./controlli-lib.cjs");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const st = JSON.parse(readFileSync("stato-vero.json", "utf8"));
/* conteggio indipendente, fatto senza usare il codice dell'app */
const base = Object.fromEntries(st.prodotti.map((p) => [p.id, p]));
let attese = 0; const nomi = new Set();
for (const m of st.magazzini) for (const a of m.articoli) {
  const p = base[a.prodottoId];
  if (p && a.uomId !== p.uomBase && !(a.uomId in (p.conv || {}))) { attese++; nomi.add(p.nome); }
}
console.log(`\nstato vero: ${st.magazzini.length} magazzini, ${st.prodotti.length} prodotti, ` +
  `${st.magazzini.reduce((n, m) => n + m.articoli.length, 0)} caselle`);
console.log(`caselle senza conversione, contate a mano: ${attese} (${nomi.size} prodotti diversi)\n`);

const lista = lib.controlli(st, st.magazzini);
const conv = lista.find((c) => c.id === "conv");
ok(!!conv, "il pannello segnala le conversioni mancanti");
ok(conv && conv.chiavi.length === attese,
  `e ne conta esattamente ${attese} (trovate ${conv ? conv.chiavi.length : 0})`);
ok(conv && conv.col && conv.et === "conversione mancante", "con etichetta e colore di allarme");
ok(conv && /conta 1:1/.test(conv.aiuto), "e spiega che altrimenti l'app conta 1:1");
ok(conv && /Catalogo/.test(conv.aiuto), "dicendo dove si mette il fattore");
ok(lista[0] && lista[0].id === "conv", "è il primo della lista: è il più grave");
/* i nomi citati devono essere prodotti che hanno DAVVERO il problema */
const citati = [...nomi].filter((n) => conv && conv.aiuto.includes(n + " (tenuto in"));
ok(citati.length >= 3, `nomina per esteso i prodotti colpiti (${citati.length} citati: ${citati.slice(0, 3).join(", ")}…)`);
/* e non deve nominare prodotti che il problema non ce l'hanno */
const sani = st.prodotti.filter((p) => !nomi.has(p.nome)).map((p) => p.nome);
const falsi = sani.filter((n) => conv && conv.aiuto.includes(n + " (tenuto in"));
ok(falsi.length === 0, `e non ne inventa altri (${falsi.length} falsi positivi)`);
/* la frase deve riportare l'unità vera, non una generica */
const unaCoppia = conv && /\(tenuto in ([^,]+), base ([^)]+)\)/.exec(conv.aiuto);
ok(!!unaCoppia && unaCoppia[1] !== unaCoppia[2],
  unaCoppia ? `dice l'unità vera e quella base, e sono diverse: «${unaCoppia[1]}» vs «${unaCoppia[2]}»` : "manca la coppia di unità");

/* e la controprova: se metto le conversioni, il controllo sparisce */
const sanato = JSON.parse(JSON.stringify(st));
const b2 = Object.fromEntries(sanato.prodotti.map((p) => [p.id, p]));
for (const m of sanato.magazzini) for (const a of m.articoli) {
  const p = b2[a.prodottoId];
  if (p && a.uomId !== p.uomBase && !(a.uomId in (p.conv || {}))) { p.conv = p.conv || {}; p.conv[a.uomId] = 2; }
}
const dopo = lib.controlli(sanato, sanato.magazzini);
ok(!dopo.find((c) => c.id === "conv"), "messe le conversioni, l'allarme sparisce");

/* e la prova che il difetto era reale: senza fattore converti() torna null,
   ed è quel null che ogni chiamante trasforma in «uguale» */
const p1 = st.prodotti.find((p) => st.magazzini.some((m) => m.articoli.some((a) =>
  a.prodottoId === p.id && a.uomId !== p.uomBase && !(a.uomId in (p.conv || {})))));
const a1 = st.magazzini.flatMap((m) => m.articoli).find((a) => a.prodottoId === p1.id && a.uomId !== p1.uomBase);
ok(lib.converti(p1, 3, a1.uomId, p1.uomBase) === null,
  `«${p1.nome}»: convertire 3 dalla sua unità alla base torna null, non un numero`);

console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
