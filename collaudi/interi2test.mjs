import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lib = require("./interi-lib.cjs");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok  " + m); } else { fail++; console.log("  FAIL " + m); } };
const q = (n) => Math.round(n * 1e6) / 1e6;

/* ===== gli arrotondamenti di base ===== */
console.log("=== 1. suInteri / giuInteri ===");
ok(lib.suInteri(1.5) === 2, "suInteri(1,5) = 2");
ok(lib.suInteri(2) === 2, "suInteri(2) = 2 (non sale su un numero già intero)");
ok(lib.suInteri(2.0000001) === 2, "suInteri regge il rumore dei decimali");
ok(lib.suInteri(0.1) === 1, "suInteri(0,1) = 1");
ok(lib.suInteri(0) === 0, "suInteri(0) = 0");
ok(lib.giuInteri(1.5) === 1, "giuInteri(1,5) = 1");
ok(lib.giuInteri(2) === 2, "giuInteri(2) = 2");
ok(lib.giuInteri(1.9999999) === 2, "giuInteri regge il rumore dei decimali");
ok(lib.giuInteri(0.5) === 0, "giuInteri(0,5) = 0");

/* ===== stato di prova: 1 conf = 4 pz ===== */
const base = () => ({
  unita: [{ id: "u-pz", nome: "pezzo", simbolo: "pz" }, { id: "u-conf", nome: "confezione", simbolo: "conf" }],
  categorie: [{ id: "c1", nome: "Latticini", colore: "#4C8DF6" }],
  fornitori: [{ id: "f1", nome: "Caseificio" }],
  prodotti: [
    { id: "BUF", nome: "Bufala", categoriaId: "c1", fornitoreId: "f1", uomBase: "u-pz",
      conv: { "u-conf": 4 }, uomLavorazione: "u-conf", uomFornitore: "u-conf", uomFornitoreDiretto: "u-conf",
      soloInteri: true },
    { id: "LIB", nome: "Pomodoro", categoriaId: "c1", fornitoreId: "f1", uomBase: "u-pz",
      conv: { "u-conf": 4 }, uomLavorazione: "u-conf", uomFornitore: "u-conf", uomFornitoreDiretto: "u-conf" },
  ],
  sedi: [{ id: "s-lab", nome: "Lab", tipo: "laboratorio" }, { id: "s-op", nome: "Op", tipo: "operatore", labSedeId: "s-lab" }],
  magazzini: [
    { id: "m-lin", nome: "Linea lab", sedeId: "s-op", tipo: "linea-lab", articoli: [
      { prodottoId: "BUF", uomId: "u-pz", par: 8, qty: 0 },
      { prodottoId: "LIB", uomId: "u-pz", par: 8, qty: 0 },
    ] },
    { id: "m-linr", nome: "Linea retro", sedeId: "s-op", tipo: "linea-retro", rifMagazzinoId: "m-retro", articoli: [
      { prodottoId: "BUF", uomId: "u-pz", par: 8, qty: 0 },
      { prodottoId: "LIB", uomId: "u-pz", par: 8, qty: 0 },
    ] },
    { id: "m-retro", nome: "Secco", sedeId: "s-op", tipo: "retro", articoli: [
      { prodottoId: "BUF", uomId: "u-conf", par: 5, qty: 1.5 },
      { prodottoId: "LIB", uomId: "u-conf", par: 5, qty: 1.5 },
    ] },
  ],
  richieste: [], ordini: [], movimenti: [],
});
const riga = (esito, pid) => esito.righe.find((r) => r.art.prodottoId === pid);

/* ===== 2. linea rifornita dal LABORATORIO: la richiesta sale all'intero ===== */
console.log("=== 2. richiesta al laboratorio (1 conf = 4 pz) ===");
{
  const s = base();
  const e = lib.calcolaEsito(s, s.magazzini[0], { BUF: 2, LIB: 2 });   // mancano 6 pz = 1,5 conf
  const b = riga(e, "BUF"), l = riga(e, "LIB");
  ok(b.azione === "richiesta" && l.azione === "richiesta", "entrambi generano una richiesta");
  ok(q(b.mancante) === 6, `il fabbisogno vero resta 6 pz (${b.mancante})`);
  ok(b.uomLav === "u-conf", "la richiesta è in confezioni");
  ok(q(b.qtyLav) === 2, `BUF (solo interi): 1,5 conf -> chiede 2 conf (${b.qtyLav})`);
  ok(q(b.saliti) === 0.5, `BUF: mezza confezione di arrotondamento dichiarata (${b.saliti})`);
  ok(q(l.qtyLav) === 1.5, `POMODORO (libero): chiede 1,5 conf senza arrotondare (${l.qtyLav})`);
  ok(q(l.saliti) === 0, "POMODORO: nessun arrotondamento");
}
{
  const s = base();
  const e = lib.calcolaEsito(s, s.magazzini[0], { BUF: 0 });           // mancano 8 pz = 2 conf esatte
  const b = riga(e, "BUF");
  ok(q(b.qtyLav) === 2 && q(b.saliti) === 0, "se il conto torna intero non arrotonda nulla");
}

/* ===== 3. linea rifornita dal RETRO: dal retro escono solo pezzi interi ===== */
console.log("=== 3. prelievo dal retro (nel retro c'è 1,5 conf) ===");
{
  const s = base();
  const e = lib.calcolaEsito(s, s.magazzini[1], { BUF: 2, LIB: 2 });   // mancano 6 pz = 1,5 conf
  const b = riga(e, "BUF"), l = riga(e, "LIB");
  ok(q(b.bisognoRetro) === 2, `BUF: bisogno arrotondato a 2 conf (${b.bisognoRetro})`);
  ok(q(b.prelievo) === 1, `BUF: si portano via 1 conf intera, non 1,5 (${b.prelievo})`);
  ok(Number.isInteger(b.prelievo), "BUF: il prelievo è un numero intero");
  ok(q(b.resoLinea) === 4, `BUF: in linea arrivano 4 pz (${b.resoLinea})`);
  ok(b.azione === "parziale", "BUF: resta parziale, il resto va in ordine");
  ok(b.qtyOrd > 0, `BUF: genera l'ordine al fornitore (${b.qtyOrd} conf)`);
  ok(q(l.prelievo) === 1.5, `POMODORO: prelievo libero 1,5 conf (${l.prelievo})`);
  ok(l.azione === "prelievo", "POMODORO: prelievo completo");
}
{
  /* nel retro c'è mezza confezione: non si può portare via niente */
  const s = base();
  s.magazzini[2].articoli[0].qty = 0.5;
  const e = lib.calcolaEsito(s, s.magazzini[1], { BUF: 2 });
  const b = riga(e, "BUF");
  ok(q(b.prelievo) === 0, `mezza confezione nel retro -> prelievo 0 (${b.prelievo})`);
  ok(b.azione === "parziale", "e la riga resta parziale");
}
{
  /* nel retro ce n'è in abbondanza: prende esattamente il bisogno intero */
  const s = base();
  s.magazzini[2].articoli[0].qty = 10;
  const e = lib.calcolaEsito(s, s.magazzini[1], { BUF: 2 });
  const b = riga(e, "BUF");
  ok(q(b.prelievo) === 2, `retro pieno -> prelievo 2 conf intere (${b.prelievo})`);
  ok(b.azione === "prelievo", "prelievo completo");
  ok(q(b.resoLinea) === 8, `in linea arrivano 8 pz (${b.resoLinea})`);
}

/* ===== 4. gli ordini al fornitore restano a pezzi interi ===== */
console.log("=== 4. ordine al fornitore ===");
{
  const s = base();
  s.magazzini[2].articoli[0].qty = 1.5;
  const nOrd = lib.aggiornaOrdineDiretto(s, s.prodotti[0], s.magazzini[2].articoli[0], "s-op");
  ok(Number.isInteger(nOrd) && nOrd === 4, `deficit 3,5 conf -> ordine 4 conf intere (${nOrd})`);
}

console.log(`\nRESULT: ${fail === 0 ? "PASS" : "CHECK"}  (${pass} ok, ${fail} fail)`);
if (fail) process.exitCode = 1;
