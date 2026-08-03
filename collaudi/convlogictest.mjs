/* I conti di gen-5.51, provati sulle funzioni nude — senza schermo di mezzo.
   Due cose: la geometria delle teglie deve essere esatta, e i due tetti sui
   movimenti devono tenere lo storico delle uscite che serve alle soglie. */
import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const L = require("./conv-lib.cjs");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const vicino = (a, b, t = 1e-6) => a != null && Math.abs(a - b) < t;

/* ─────────── 1. LA GEOMETRIA GASTRONORM ─────────── */
console.log("\n— le teglie: geometria, non opinione —");
ok(vicino(L.gnFrazione("GN 1/6"), 1 / 6), "«GN 1/6» vale un sesto");
ok(vicino(L.gnFrazione("gn1/3"), 1 / 3), "e lo capisce anche scritto storto");
ok(vicino(L.gnFrazione("GN 2/3"), 2 / 3), "«GN 2/3» vale due terzi");
ok(L.gnFrazione("kg") == null && L.gnFrazione("pz") == null && L.gnFrazione("") == null,
  "kg, pz e il vuoto non sono teglie");
ok(L.gnFrazione("GN 1/0") == null, "e una frazione impossibile non passa");

const stato = {
  unita: [
    { id: "u-kg", simbolo: "kg" }, { id: "u-pz", simbolo: "pz" },
    { id: "g1", simbolo: "GN 1/1" }, { id: "g3", simbolo: "GN 1/3" }, { id: "g6", simbolo: "GN 1/6" },
    { id: "u-conf", simbolo: "conf" },
  ],
  prodotti: [
    { id: "p-fiori", nome: "Fiori di zucca", uomBase: "g3", conv: {} },
    { id: "p-zucc", nome: "Zucchine", uomBase: "g6", conv: {} },
    { id: "p-funghi", nome: "Funghi affettati", uomBase: "g1", conv: {} },
    { id: "p-suppli", nome: "Supplì nerone", uomBase: "u-pz", conv: {} },
    { id: "p-strano", nome: "Cartoni pizza", uomBase: "u-conf", conv: {} },
  ],
  magazzini: [{ id: "m1", articoli: [
    { prodottoId: "p-fiori", uomId: "g6", qty: 1 },
    { prodottoId: "p-zucc", uomId: "u-kg", qty: 1 },
    { prodottoId: "p-funghi", uomId: "u-kg", qty: 1 },
    { prodottoId: "p-suppli", uomId: "u-kg", qty: 1 },
    { prodottoId: "p-strano", uomId: "u-pz", qty: 1 },
  ] }],
};

const d = (pid, uom) => L.domandaConv(stato, stato.prodotti.find((p) => p.id === pid), uom);

const gg = d("p-fiori", "g6");
ok(gg.esatta === true, "teglia contro teglia: l'app la dà per esatta, non stimata");
ok(vicino(gg.proposta, 0.5), `1 GN 1/6 = 0,5 GN 1/3 (proposto ${gg.proposta})`);
ok(/1 GN 1\/6 = quante GN 1\/3/.test(gg.etichetta), `la domanda è quella giusta: «${gg.etichetta}»`);

const kt = d("p-zucc", "u-kg");
ok(kt.esatta === false, "peso di una teglia: dichiarato stimato");
ok(vicino(kt.proposta, 5 / 6, 1e-9), `propone 0,833 kg per GN 1/6 (${kt.proposta.toFixed(3)})`);
ok(/quanti kg stanno in 1 GN 1\/6/.test(kt.etichetta), `e chiede il peso, non il fattore: «${kt.etichetta}»`);
/* l'ancora è un numero di Valerio: sulle Patate forno 1 kg = 0,6 GN 1/3 */
const kt3 = d("p-fiori", "u-kg");
ok(vicino(L.convDaRisposta("kg-teglia", kt3.proposta), 0.6, 1e-9),
  "e su GN 1/3 ricasca esattamente sullo 0,6 che aveva scritto lui");
const kt1 = d("p-funghi", "u-kg");
ok(vicino(kt1.proposta, 5), `una teglia intera: 5 kg (${kt1.proposta})`);

const gp = d("p-suppli", "u-kg");
ok(/quanto pesa 1 pezzo, in grammi/.test(gp.etichetta), `sui pezzi chiede i grammi: «${gp.etichetta}»`);
ok(vicino(L.convDaRisposta("g-pezzo", 110), 1000 / 110),
  "110 g a pezzo → 9,09 pezzi in un chilo");
ok(vicino(L.convDaRisposta("kg-teglia", 0.833), 1 / 0.833), "0,833 kg a teglia → 1,2 teglie in un chilo");
ok(L.convDaRisposta("g-pezzo", 0) == null && L.convDaRisposta("kg-teglia", -3) == null,
  "zero e numeri negativi non producono un fattore");

const lib = d("p-strano", "u-pz");
ok(lib.tipo === "libero" && lib.proposta === null,
  "quando non sa che pesce prendere non inventa: lascia il campo vuoto");

const coppie = L.coppieConv(stato);
ok(coppie.length === 5, `trova tutte e cinque le coppie che mancano (${coppie.length})`);
ok(coppie.map((c) => c.prod.nome).join() === [...coppie].map((c) => c.prod.nome).sort((a, b) => a.localeCompare(b)).join(),
  "e le mette in ordine alfabetico, come si cercano");
/* una che il fattore ce l'ha già non deve comparire */
stato.prodotti.find((p) => p.id === "p-zucc").conv = { "u-kg": 1.2 };
ok(L.coppieConv(stato).length === 4, "chi il fattore ce l'ha già sparisce dall'elenco");
ok(L.convStimata({ convStim: ["u-kg"] }, "u-kg") === true
  && L.convStimata({ convStim: ["u-kg"] }, "g6") === false
  && L.convStimata({}, "u-kg") === false, "il marchio «stimata» si legge per singola unità");

/* ─────────── 2. I DUE TETTI SUI MOVIMENTI ─────────── */
console.log("\n— quello che viaggia —");
const GG = 86400000;
const mv = (t, causale, delta) => ({ id: "x" + t + causale + delta, t, causale, delta, magId: "m1", prodottoId: "p1" });

/* ── LO SCENARIO ERA ROVESCIATO, E IL VERDE NON VALEVA NIENTE ──
   Segnalato dal consiglio del 2 agosto e verificato coi numeri veri il 3:
   qui c'era scritto «~62 movimenti al giorno, di cui ~2 uscite», e su quella
   base il tetto mancante sulle uscite non poteva saltare fuori — due uscite
   al giorno non arrivano a nessun tetto nemmeno in dieci anni. Era verde per
   il motivo sbagliato.
   Misurato sullo stato in produzione: 390 movimenti in sei giorni, 140 dei
   quali uscite. Cioe' 65 al giorno, di cui 23 uscite: il 36%, non il 3%.
   Lo scenario adesso e' quello. */
const finti = [];
for (let g = 69; g >= 0; g--) {
  const t0 = Date.now() - g * GG;
  for (let i = 0; i < 42; i++) finti.push(mv(t0 - i * 1000, "carico", +5));
  for (let i = 0; i < 21; i++) finti.push(mv(t0 - 100000 - i * 1000, "conteggio", -3));
  finti.push(mv(t0 - 200000, "prelievo", -2));
  finti.push(mv(t0 - 201000, "evasione", -1));
}
finti.sort((a, b) => b.t - a.t);           // come li tiene l'app: il più nuovo in testa
const dopo = L.sfoltisciMov(finti);
const uscite = dopo.filter((m) => L.USCITE_STORICO.has(m.causale) && m.delta < 0);
const altri = dopo.length - uscite.length;
const giorniUscite = new Set(uscite.map((m) => Math.floor(m.t / GG))).size;

ok(altri === L.MAX_ALTRI_MOV, `i movimenti ordinari si fermano al tetto (${altri})`);
ok(giorniUscite >= 55 && giorniUscite <= 57,
  `le uscite coprono davvero ${giorniUscite} giorni: le soglie hanno di che parlare`);
ok(uscite.length === giorniUscite * 23, `e sono tutte lì, nessuna persa (${uscite.length})`);
/* col ritmo vero (23 uscite al giorno × 56 giorni ≈ 1300) il parapetto NON
   deve toccare niente: se mordesse qui, le soglie perderebbero settimane */
ok(uscite.length < L.MAX_USCITE_MOV,
  `e il tetto delle uscite non entra in gioco al ritmo normale (${uscite.length} sotto ${L.MAX_USCITE_MOV})`);

/* ── E IL PARAPETTO C'È DAVVERO, PER LA GIORNATA STORTA ──
   Un inventario che tocca ogni articolo scrive centinaia di uscite in un
   giorno solo. Prima non le fermava niente: sulle uscite c'era un limite di
   eta' e nessuno di numero. */
const valanga = [];
for (let g = 20; g >= 0; g--) {
  const t0 = Date.now() - g * GG;
  for (let i = 0; i < 300; i++) valanga.push(mv(t0 - i * 1000, "conteggio", -1));
}
valanga.sort((a, b) => b.t - a.t);
const dopoValanga = L.sfoltisciMov(valanga).filter((m) => L.USCITE_STORICO.has(m.causale) && m.delta < 0);
ok(dopoValanga.length === L.MAX_USCITE_MOV,
  `con 6300 uscite in tre settimane il tetto si fa sentire e ne restano ${dopoValanga.length}`);
ok(dopoValanga[0].t >= dopoValanga[dopoValanga.length - 1].t,
  "e quelle che restano sono le piu' recenti, non le prime capitate");
ok(uscite.every((m, i) => i === 0 || uscite[i - 1].t >= m.t), "l'ordine dal più recente resta");

/* la prova che conta: col vecchio tetto unico a 400 quanti giorni di uscite
   sarebbero sopravvissuti? */
const vecchio = finti.slice(0, 400);
const gVecchio = new Set(vecchio.filter((m) => L.USCITE_STORICO.has(m.causale) && m.delta < 0)
  .map((m) => Math.floor(m.t / GG))).size;
ok(gVecchio < 8, `col tetto unico di prima ne sopravvivevano ${gVecchio} giorni: mai abbastanza`);
ok(giorniUscite > gVecchio * 5,
  `ora sono ${giorniUscite}: ${Math.round(giorniUscite / Math.max(1, gVecchio))} volte tanto`);

/* le uscite più vecchie di 56 giorni se ne vanno davvero */
const vecchia = uscite.find((m) => m.t < Date.now() - 57 * GG);
ok(!vecchia, "e quelle oltre le otto settimane non restano a pesare");

/* niente esplode se la lista è vuota o strana */
ok(L.sfoltisciMov([]).length === 0, "una lista vuota resta vuota");

/* le soglie consigliate leggono ancora quello che devono */
const st2 = { magazzini: [{ id: "m1", nome: "M", articoli: [{ prodottoId: "p1", uomId: "u-kg", par: 1, qty: 0 }] }],
  prodotti: [{ id: "p1", nome: "P", uomBase: "u-kg" }], unita: [{ id: "u-kg", simbolo: "kg" }],
  movimenti: dopo };
const sug = L.soglieConsigliate(st2);
ok(Array.isArray(sug), `le soglie consigliate girano ancora sui movimenti sfoltiti (${sug.length} proposte)`);

console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
