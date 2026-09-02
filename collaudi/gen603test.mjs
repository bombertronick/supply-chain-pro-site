/* gen-6.03: l'ingrediente in mano e il nome corto.
   Parole di Valerio (2 settembre, dopo aver visto gen-6.02):
   «devo avere la possibilità in cassa di poter aggiungere ingredienti, ma
   devo poterlo fare in qualsiasi momento, non devo prima selezionare
   l'aggiunta e poi la pizza che voglio con l'aggiunta, deve essere
   interdipendente; poi le varianti, a schermo devo vedere il nome della
   variante, sennò ci sta molta ridondanza nel nome; ci sono nomi che
   riassumono un insieme di ingredienti, ad esempio boscaiola, ossia base
   mozzarella funghi e salsiccia: la cassa deve poter vedere il nome che
   contiene quegli ingredienti ma anche avere la possibilità di vedere da
   cosa è composto quel nome».

   IL CONTRATTO DI QUESTO BANCO (i nomi si fissano QUI, il codice si adegua):
   · L'ORDINE NON CONTA. Una FASCIA fissa in basso porta gli ingredienti.
     Con una riga VIVA il chip appoggia («Metti X su Y»); senza riga viva il
     chip va IN MANO («Prendi in mano X») e lo prende il primo piatto
     compatibile. L'invariante: mano piena ⇒ nessuna riga viva. Mai due modi
     da indovinare.
   · LA RIGA VIVA si sceglie con un gesto NEUTRO — il nome della riga,
     «Lavora su X» — che non cambia nessuna quantità, ed è marcata con
     data-viva="1". Le righe di un gruppo senza aggiunte non diventano mai
     vive e il loro nome NON è un bottone.
   · SI DISFA DOVE È CADUTO L'ERRORE: lo stesso chip («Leva X da Y»), la ×
     della sotto-riga («Riga: leva X da Y») che funziona anche su una riga
     non viva e NON appoggia la mano, «Svuota la mano», «Stacca da Y».
   · IL NOME RESTA CORTO. La cella dice il nome, sotto in piccolo la
     composizione (voce.dentro) e i NOMI dei formati al posto della parola
     «varianti». La riga del conto dice nomeBase() sopra e le aggiunte in
     sotto-righe. La composizione non entra MAI dentro un nome, e la riga
     battuta non guadagna un solo byte.
   · LA GIUNZIONE: «Panino Maxi + Salsiccia» — prima del primo «+» c'è il
     piatto, dopo ogni «+» quello che ci hai messo sopra.

   SCRITTO PRIMA DELLE MODIFICHE. Contro gen-6.02 devono essere ROSSI:
   §1 (fonte), §3 (dopo), §4 (prima), §5 (quale riga), §6 (disfare),
   §7 (la carta), §8 (le varianti a schermo), §9 (cucina), §11b (editor),
   §12 (bersagli e spazio). Contro-controlli VERDI anche su gen-6.02:
   §2 (la pizza liscia resta un tocco), §7b (il nome non si allunga),
   §10 (il passato non cambia), §11 (il canale e il motore fermi). */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 120)}`); } };

/* IL BANCO: una pizzeria vera, coi prodotti del seme. La Boscaiola È il
   caso di Valerio — un nome che vale per mozzarella, funghi e salsiccia. */
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 6);
if (!linea) throw new Error("banco povero: serve una linea con almeno 6 articoli");
const perNome = (n) => {
  const p = base.prodotti.find((x) => x.nome === n);
  const a = (linea.articoli || []).find((x) => x.prodottoId === p?.id);
  if (!a) throw new Error("il seme non ha «" + n + "» sulla linea");
  return a;
};
const moz = perNome("Mozzarella no lattosio"), fun = perNome("Funghi affettati");
const sal = perNome("Salsiccia"), bro = perNome("Broccoletti"), sug = perNome("Sugo");
for (const a of [moz, fun, sal, bro, sug]) a.qty = 10;
FM.cassaMagId = linea.id;
const ing = (art, qty) => ({ prodottoId: art.prodottoId, qty, uomId: art.uomId });
base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6.5, aliquota: 10, attivo: true,
    varianti: [], distinta: [ing(sug, 1), ing(moz, 1)] },
  { id: "li-bos", nome: "Boscaiola", gruppo: "Pizze", prezzo: 9, aliquota: 10, attivo: true,
    dentro: "mozzarella, funghi, salsiccia",
    varianti: [], distinta: [ing(moz, 1), ing(fun, 1), ing(sal, 1)] },
  { id: "li-pan", nome: "Panino", gruppo: "Mangiare", prezzo: 8, attivo: true,
    varianti: [{ id: "va-maxi", nome: "Maxi", delta: 1.5 }], distinta: [] },
  { id: "li-spr", nome: "Spritz", gruppo: "Bere", prezzo: 5, aliquota: 10, attivo: true, varianti: [], distinta: [] },
  { id: "li-acq", nome: "Acqua", prezzo: 1, attivo: true, varianti: [], distinta: [] },
];
base.aggiunte = [
  { id: "ag-bro", nome: "Broccoletti", prezzo: 1.5, attivo: true, gruppi: ["pizze"], distinta: [ing(bro, 1)] },
  { id: "ag-sal", nome: "Salsiccia", prezzo: 2, attivo: true, gruppi: ["Pizze", "Mangiare"], distinta: [ing(sal, 1)] },
  { id: "ag-buf", nome: "Bufala", prezzo: 2, attivo: false, gruppi: ["Pizze"], distinta: [] },
];
base.postazioni = [{ id: "po-piz", nome: "Pizzeria", sedeId: "", gruppi: ["Pizze"] }];
/* una riga «di telefono vecchio»: nome composto, niente agg, niente gruppo */
base.vendite = [{
  id: "vn-vecchia", t: Date.now() - 3600e3, giorno: new Date(Date.now() - 3600e3).toISOString().slice(0, 10),
  sedeId: FM.id, chi: "Semina", n: 1, metodo: "contanti", stato: "registrata", totale: 8,
  righe: [{ voceId: "li-mar", nome: "Margherita + Broccoletti", qty: 1, prezzo: 8 }], scarico: [],
}];

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  opCassa: { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") },
  opZero: { id: "pr-o0", nome: "OpZero", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], pinHash: hash("2222") },
};

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (st0, profili, nome, pin) => {
  const st = JSON.parse(JSON.stringify(st0));
  st.profili = profili;
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, [JSON.stringify(st)]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1500);
  return { p, ctx };
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const foglio = (p) => p.locator(".fixed.inset-0").last();
const stato = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const giacenza = (st, art) => (st.magazzini.find((m) => m.id === linea.id)?.articoli || [])
  .find((a) => a.prodottoId === art.prodottoId)?.qty;
const tocca = async (p, nome, attesa = 320) => {
  await p.getByRole("button", { name: nome, exact: true }).click(); await p.waitForTimeout(attesa);
};
const incassa = async (p) => {
  await p.getByRole("button", { name: "Incassa", exact: true }).click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: "Registra l'incasso", exact: true }).click(); await p.waitForTimeout(1400);
};
const viva = (p) => p.locator('[data-viva="1"]');
/* GEN-6.04 HA CAMBIATO IL CONTRATTO, e questo banco descriveva l'app di ieri.
   Valerio: «gli ingredienti non devono essere visibili in cassa se non quando
   richiesto». La fascia adesso parte CHIUSA, quindi toccare un chip senza
   averla aperta e' come cercare un tasto dietro uno sportello chiuso: gli
   otto Timeout erano quello, non una regressione della Cassa.
   Il gesto che aggiungo e' quello che fa un cassiere vero: apre gli
   ingredienti, poi tocca. Quello che questo banco prova — le due strade,
   l'invariante, il disfare — resta identico: cambia il modo di arrivarci. */
const apriFascia = async (p) => {
  if (await p.locator('[data-fascia="1"]').count()) return;
  const pastiglia = p.locator('[data-fascia-chiusa="1"] button').first();
  if (await pastiglia.count()) { await pastiglia.click(); await p.waitForTimeout(420); }
};

/* ═══ 1. LA FONTE ═══ */
console.log("\n— 1. la fonte —");
const src = readFileSync("../app/app.jsx", "utf8");
const ver = (src.match(/const VERSIONE = "gen-(\d+)\.(\d+)"/) || []).slice(1).map(Number);
ok(ver.length === 2 && (ver[0] > 6 || (ver[0] === 6 && ver[1] >= 3)),
  `VERSIONE è gen-${ver.join(".")}: non più vecchia di gen-6.03, che ha portato l'ingrediente in mano`);
ok(/const aggiunteTutte = \(stato\)/.test(src) && /const dentroDi = \(stato, voceId\)/.test(src),
  "i selettori puri nuovi ci sono: aggiunteTutte e dentroDi, accanto agli altri");
const rigaNome = src.split("\n").find((r) => /nome: voce\.nome \+ \(variante \?/.test(r)) || "";
ok(/\(variante \? " " \+ variante\.nome : ""\)/.test(rigaNome),
  "la giunzione della variante è uno SPAZIO, non « + »: «Panino Maxi + Salsiccia» si legge con una regola sola");
for (const f of ["giraAgg", "levaDaRiga", "lavoraSu", "bersagliabile"])
  ok(new RegExp("const " + f + " = ").test(src), `la Cassa ha ${f}`);
/* il motore NON si è mosso: guardia sul sorgente, senza browser */
const motore = src.slice(src.indexOf("const calcoloScarico"), src.indexOf("const gruppoDi"));
ok(!/\bdentro\b|\bmano\b|\bviva\b|composizione/.test(motore),
  "il motore (calcoloScarico → applicaVendita → applicaStorno) non nomina niente di gen-6.03: non è stato toccato");
const testaCsv = src.split("\n").find((r) => /"Prezzo unitario"/.test(r) && /"Scontrino"/.test(r)) || "";
ok(/"Scontrino", "Aggiunte"\]\]/.test(testaCsv),
  "il CSV vendite resta a undici colonne: la composizione è di oggi, la vendita è di ieri");
const importi = (src.match(/^import \{([\s\S]*?)\} from "lucide-react";/m) || [])[1] || "";
const iconeNuove = ["Info", "Eye", "List", "Layers", "CircleSlash", "Ban"].filter((i) => new RegExp("\\b" + i + "\\b").test(importi));
ok(iconeNuove.length === 0, "nessuna icona nuova nell'import: solo le 50 di sempre" + (iconeNuove.length ? " — " + iconeNuove.join(",") : ""));

/* ═══ 2. LA PIZZA LISCIA RESTA UN TOCCO (verde oggi, deve restare) ═══ */
console.log("\n— 2. la pizza liscia: un tocco, e nessun foglio —");
const C = await apri(base, [PR.opCassa, PR.admin], "OpCassa", "2222");
await prova("§2", async () => {
  await vaiA(C.p, "Cassa");
  const t0 = Date.now();
  await tocca(C.p, "Aggiungi Margherita", 250);
  ok(Date.now() - t0 < 2000, "il tocco sulla cella risponde subito");
  ok((await C.p.locator(".fixed.inset-0").count()) === 0, "nessun foglio si è aperto");
  await tocca(C.p, "Aggiungi Margherita", 350);
  ok(/Totale € 13,00/.test(await testoDi(C.p)), "due tocchi = due Margherite, € 13,00");
  ok((await C.p.locator(".fixed.inset-0").count()) === 0, "e nemmeno adesso c'è un foglio di mezzo");
  await tocca(C.p, "Svuota il conto", 350);
});

/* ═══ 3. DOPO: piatto → ingrediente, DUE tocchi ═══ */
console.log("\n— 3. prima il piatto, poi l'ingrediente —");
await prova("§3", async () => {
  await tocca(C.p, "Aggiungi Margherita", 350);
  ok(/Su: Margherita/.test(await testoDi(C.p)),
    "la fascia dice a parole dove cade il prossimo tocco: «Su: Margherita»");
  await apriFascia(C.p);
  await tocca(C.p, "Metti Broccoletti su Margherita", 450);
  const t = await testoDi(C.p);
  ok(/Totale € 8,00/.test(t), "due tocchi in tutto: € 8,00");
  ok((await C.p.locator(".fixed.inset-0").count()) === 0,
    "e nessun foglio si è mai aperto: la strada di gen-6.02 ne chiedeva quattro e uno da chiudere");
  ok((await C.p.getByRole("button", { name: "Aumenta Margherita + Broccoletti", exact: true }).count()) === 1,
    "il conto ha la riga composta");
  ok(/\+ Broccoletti/.test(t), "e l'aggiunta si legge in una sotto-riga, non dentro il nome");
});

/* ═══ 4. PRIMA: ingrediente → piatto, DUE tocchi ═══ */
console.log("\n— 4. prima l'ingrediente, poi il piatto —");
await prova("§4", async () => {
  await tocca(C.p, "Svuota il conto", 400);
  /* gen-6.04: a conto vuoto e a fascia CHIUSA la pastiglia dice
     «Ingredienti»; «Nessuna riga scelta» resta la frase della fascia aperta.
     Si guardano tutte e due, perche' e' proprio questo che gen-6.04 promette:
     chiudere toglie spazio, non informazione. */
  ok(/Ingredienti/.test(await testoDi(C.p)),
    "a conto vuoto la pastiglia chiusa lo dice a modo suo: «Ingredienti»");
  await apriFascia(C.p);
  ok(/Nessuna riga scelta/.test(await testoDi(C.p)),
    "e aperta lo dice per esteso: «Nessuna riga scelta»");
  await apriFascia(C.p);
  await tocca(C.p, "Prendi in mano Broccoletti", 350);
  const t1 = await testoDi(C.p);
  ok(/In mano: Broccoletti/.test(t1), "il chip va IN MANO e la fascia lo scrive");
  ok((await C.p.getByRole("button", { name: "Svuota la mano", exact: true }).count()) === 1,
    "e si può lasciare");
  await tocca(C.p, "Aggiungi Margherita", 450);
  const t2 = await testoDi(C.p);
  ok((await C.p.getByRole("button", { name: "Aumenta Margherita + Broccoletti", exact: true }).count()) === 1,
    "il piatto prende quello che si teneva in mano: «Margherita + Broccoletti» in due tocchi");
  ok(!/In mano:/.test(t2), "e la mano si è svuotata da sola");
  /* la mano che non ci va: resta in mano e lo dice */
  await tocca(C.p, "Svuota il conto", 400);
  await apriFascia(C.p);
  await tocca(C.p, "Prendi in mano Broccoletti", 350);
  await tocca(C.p, "Aggiungi Spritz", 500);
  const t3 = await testoDi(C.p);
  ok(/Totale € 5,00/.test(t3), "lo Spritz entra liscio: i broccoletti non ci vanno");
  ok(/In mano: Broccoletti/.test(t3), "e i broccoletti restano IN MANO invece di sparire");
  ok((await viva(C.p).count()) === 0,
    "l'invariante: con la mano piena nessuna riga è viva — non c'è mai un modo da indovinare");
  await tocca(C.p, "Svuota la mano", 350);
  await tocca(C.p, "Svuota il conto", 400);
});

/* ═══ 5. A QUALE RIGA, COL CONTO PIENO ═══ */
console.log("\n— 5. il bersaglio quando il conto è lungo —");
await prova("§5", async () => {
  for (const n of ["Aggiungi Margherita", "Aggiungi Spritz", "Aggiungi Boscaiola", "Aggiungi Acqua"])
    await tocca(C.p, n, 300);
  ok((await viva(C.p).count()) === 1, "una sola riga è viva in tutto il conto");
  ok(/Su: Boscaiola/.test(await testoDi(C.p)),
    "l'Acqua battuta per ultima NON ruba il bersaglio: non ha aggiunte, e la fascia dice ancora «Su: Boscaiola»");
  ok((await C.p.getByRole("button", { name: /^Lavora su Acqua/ }).count()) === 0,
    "e il nome dell'Acqua non è un bottone: niente porte che non aprono niente");
  await tocca(C.p, "Lavora su Margherita", 400);
  ok(/Su: Margherita/.test(await testoDi(C.p)), "il gesto neutro sposta il bersaglio senza toccare le quantità");
  ok(/Margherita/.test(await viva(C.p).innerText()), "ed è la Margherita a essere marcata");
  await apriFascia(C.p);
  await tocca(C.p, "Metti Broccoletti su Margherita", 450);
  ok(/Totale € 23,00/.test(await testoDi(C.p)),
    "l'ingrediente è finito sulla Margherita: 8,00 + 5,00 + 9,00 + 1,00 = € 23,00 (era 21,50)");
  await apriFascia(C.p);
  await tocca(C.p, "Stacca da Margherita", 400);
  ok((await viva(C.p).count()) === 0 && /Nessuna riga scelta/.test(await testoDi(C.p)),
    "«Stacca» libera il bersaglio: da qui l'ingrediente torna a prendersi in mano");
  await tocca(C.p, "Svuota il conto", 400);
  /* vale per una */
  for (let i = 0; i < 3; i++) await tocca(C.p, "Aggiungi Margherita", 250);
  await apriFascia(C.p);
  await tocca(C.p, "Metti Broccoletti su Margherita", 450);
  ok((await C.p.getByRole("button", { name: "Aumenta Margherita", exact: true }).count()) === 1
    && (await C.p.getByRole("button", { name: "Aumenta Margherita + Broccoletti", exact: true }).count()) === 1,
    "vale per UNA: da tre Margherite restano due lisce e una condita");
});

/* ═══ 6. DISFARE, DOVE È CADUTO L'ERRORE ═══ */
console.log("\n— 6. disfare —");
await prova("§6", async () => {
  await apriFascia(C.p);
  await tocca(C.p, "Leva Broccoletti da Margherita", 450);
  ok((await C.p.getByRole("button", { name: "Aumenta Margherita + Broccoletti", exact: true }).count()) === 0,
    "lo stesso chip disfa: le tre Margherite tornano una riga sola");
  /* la × della sotto-riga, su una riga NON viva, con la mano piena */
  await tocca(C.p, "Aggiungi Boscaiola", 300);
  await apriFascia(C.p);
  await tocca(C.p, "Metti Salsiccia su Boscaiola", 450);
  await tocca(C.p, "Lavora su Margherita", 400);
  await apriFascia(C.p);
  await tocca(C.p, "Stacca da Margherita", 350);
  await apriFascia(C.p);
  await tocca(C.p, "Prendi in mano Broccoletti", 350);
  await tocca(C.p, "Riga: leva Salsiccia da Boscaiola + Salsiccia", 500);
  const t = await testoDi(C.p);
  ok(!/\+ Salsiccia/.test(t), "la × della sotto-riga toglie l'ingrediente da una riga che non è viva");
  ok(/In mano: Broccoletti/.test(t),
    "e NON appoggia quello che si ha in mano: la mano è ancora piena, la riga non ha guadagnato niente");
  ok(!/Boscaiola \+ Broccoletti/.test(t), "la Boscaiola non si è presa i broccoletti di nascosto");
  await tocca(C.p, "Svuota la mano", 350);
  await tocca(C.p, "Svuota il conto", 400);
});

/* ═══ 7. LA CARTA: il nome corto e la composizione ═══ */
console.log("\n— 7. «cosa c'è nella boscaiola?» —");
await prova("§7", async () => {
  const cella = C.p.getByRole("button", { name: "Aggiungi Boscaiola", exact: true });
  const tc = (await cella.innerText()).replace(/\s+/g, " ");
  ok(/mozzarella, funghi, salsiccia/.test(tc),
    "ZERO tocchi: la composizione è già scritta sulla cella, sotto il prezzo");
  ok(/Boscaiola/.test(tc), "e il nome resta il nome");
  const cellaM = C.p.getByRole("button", { name: "Aggiungi Margherita", exact: true });
  ok(!/mozzarella/.test((await cellaM.innerText()).toLowerCase()),
    "la Margherita, che non ha «cosa c'è dentro» scritto, non guadagna nemmeno un pixel");
  await tocca(C.p, "Aggiungi Boscaiola", 400);
  ok(/mozzarella, funghi, salsiccia/.test(await testoDi(C.p)),
    "e la fascia la ripete accanto al bersaglio: «su cosa lavoro» e «di cosa è fatto» in uno sguardo");
  await apriFascia(C.p);
  await tocca(C.p, "Metti Salsiccia su Boscaiola", 450);
  const riga = viva(C.p);
  const tr = (await riga.innerText()).replace(/\s+/g, " ");
  ok(/Boscaiola/.test(tr) && /\+ Salsiccia/.test(tr),
    "nel conto: «Boscaiola» sopra e «+ Salsiccia» sotto, non un nome lungo");
  /* §7b — il nome non si allunga MAI: contro-controllo che deve valere sempre */
  ok(!/mozzarella/.test(tr.toLowerCase()),
    "§7b: la composizione non entra nella riga del conto");
  ok(!/mozzarella/.test((await cella.innerText()).split("\n")[0].toLowerCase()),
    "§7b: e non entra nel nome grande della cella");
});

/* ═══ 8. LE VARIANTI A SCHERMO ═══ */
console.log("\n— 8. il nome del formato, non la parola «varianti» —");
await prova("§8", async () => {
  const cp = C.p.getByRole("button", { name: "Aggiungi Panino", exact: true });
  const tp = (await cp.innerText()).replace(/\s+/g, " ");
  ok(/Maxi/i.test(tp), "la cella del Panino stampa il NOME del formato: «Maxi»");
  ok(!/variant/i.test(tp), "e non più la parola muta «varianti»");
  await tocca(C.p, "Aggiungi Panino", 500);
  await apriFascia(C.p);
  await tocca(C.p, "Metti Salsiccia", 300);
  await tocca(C.p, "Maxi + Salsiccia · € 11,50", 500);
  const t = await testoDi(C.p);
  ok(/Panino Maxi/.test(t) && !/Panino \+ Maxi/.test(t),
    "la giunzione è uno spazio: «Panino Maxi», non «Panino + Maxi»");
  ok((await C.p.getByRole("button", { name: "Cambia formato di Panino Maxi + Salsiccia", exact: true }).count()) === 1,
    "e sulla riga c'è la pillola del formato, che è l'unica porta al foglio");
});

/* ═══ 9. LA CUCINA ═══ */
console.log("\n— 9. la carta in cucina —");
let dopoVendita = null;
await prova("§9", async () => {
  await incassa(C.p);
  dopoVendita = await stato(C.p);
  const K = await apri(dopoVendita, [PR.opZero], "OpZero", "2222");
  await vaiA(K.p, "Comande");
  await K.p.getByRole("button", { name: "Siediti a Pizzeria" }).click();
  await K.p.waitForTimeout(500);
  const t = await testoDi(K.p);
  const iN = t.indexOf("Boscaiola"), iD = t.indexOf("mozzarella, funghi, salsiccia"), iA = t.indexOf("+ Salsiccia");
  ok(iN >= 0 && iD > iN && iA > iD,
    "in cucina l'ordine è: cosa devo fare, com'è fatto, cosa cambia — nome, composizione, aggiunta");
  ok(await K.p.getByText("+ Salsiccia", { exact: true }).first().isVisible(),
    "e l'aggiunta resta la riga più forte");
  await K.p.getByRole("button", { name: /Nascondi cosa c'è dentro/ }).click();
  await K.p.waitForTimeout(500);
  const t2 = await testoDi(K.p);
  ok(!/mozzarella, funghi, salsiccia/.test(t2) && /Boscaiola/.test(t2),
    "chi sa a memoria la spegne per il suo schermo: sparisce solo la riga grigia");
  await K.ctx.close();
});

/* ═══ 10. IL PASSATO NON CAMBIA (verde oggi, deve restare) ═══ */
console.log("\n— 10. il passato —");
await prova("§10", async () => {
  const st = dopoVendita || await stato(C.p);
  const v = (st.vendite || []).find((x) => (x.righe || []).some((r) => /Boscaiola/.test(r.nome)));
  /* lo scontrino ha DUE righe di Boscaiola — una liscia e una condita:
     la find generica pescava la prima. Difetto del banco, non dell'app. */
  const rB = (v?.righe || []).find((r) => (r.agg || []).length && /Boscaiola/.test(r.nome));
  ok(rB?.nome === "Boscaiola + Salsiccia", `la riga congelata è «${rB?.nome}»: il nome composto, non la composizione`);
  ok(!/mozzarella/i.test(JSON.stringify(rB)), "e la composizione non è finita dentro la vendita");
  const rP = (v?.righe || []).find((r) => /Panino/.test(r.nome));
  ok(rP?.nome === "Panino Maxi + Salsiccia", `la riga col formato è «${rP?.nome}»`);
  /* la riga del telefono vecchio è ancora leggibile */
  const vecchia = (st.vendite || []).find((x) => x.id === "vn-vecchia");
  ok(!!vecchia && vecchia.righe[0].nome === "Margherita + Broccoletti",
    "la riga scritta da un telefono vecchio (niente agg, niente gruppo) è ancora lì e si legge");
  for (const ve of st.vendite || []) for (const r of ve.righe || [])
    ok(typeof r.nome === "string" && r.nome.trim().length > 0, `ogni riga ha un nome leggibile da sola: «${r.nome}»`);
});

/* ═══ 11. IL CANALE: la riga battuta non ingrassa di un byte ═══ */
console.log("\n— 11. il canale —");
await prova("§11", async () => {
  const st = dopoVendita || await stato(C.p);
  const AMMESSE = new Set(["voceId", "varianteId", "nome", "qty", "prezzo", "aliquota", "gruppo", "agg"]);
  let fuori = [];
  for (const v of st.vendite || []) for (const r of v.righe || [])
    for (const k of Object.keys(r)) if (!AMMESSE.has(k)) fuori.push(k);
  ok(fuori.length === 0, "nessuna chiave nuova sulla riga battuta" + (fuori.length ? " — " + [...new Set(fuori)].join(",") : ""));
  const liscia = { voceId: "li-mar", nome: "Margherita", qty: 1, prezzo: 6.5, aliquota: 10, gruppo: "Pizze" };
  ok(Buffer.byteLength(JSON.stringify(liscia)) === 91,
    `la riga liscia pesa ${Buffer.byteLength(JSON.stringify(liscia))} byte, come in gen-6.02`);
  const conVar = (st.vendite || []).flatMap((v) => v.righe || []).find((r) => /Panino Maxi/.test(r.nome));
  ok(conVar && Buffer.byteLength(JSON.stringify(conVar)) <= 175,
    `la riga con formato e aggiunta pesa ${conVar ? Buffer.byteLength(JSON.stringify(conVar)) : "?"} byte (tetto 175)`);
  /* il telefono vecchio che salva NON cancella la composizione */
  const voce = (st.listino || []).find((x) => x.id === "li-bos");
  const finta = { ...voce };
  Object.assign(finta, { nome: voce.nome, gruppo: voce.gruppo, prezzo: voce.prezzo,
    aliquota: voce.aliquota, attivo: voce.attivo, varianti: voce.varianti, distinta: voce.distinta });
  ok(finta.dentro === "mozzarella, funghi, salsiccia",
    "un admin fermo a gen-6.02 che salva quella voce NON fa perdere la composizione a tutti");
});

/* ═══ 11b. L'EDITOR: dove si scrive «cosa c'è dentro» ═══ */
console.log("\n— 11b. l'editor nel Listino —");
const AD = await apri(base, [PR.admin], "Admin", "1234");
await prova("§11b", async () => {
  await vaiA(AD.p, "Gestione");
  await AD.p.getByText("Listino", { exact: true }).first().click();
  await AD.p.waitForTimeout(900);
  const t = await testoDi(AD.p);
  ok(/dentro: mozzarella, funghi, salsiccia/.test(t),
    "la card della Boscaiola mostra all'admin quello che vedrà il banco");
  ok(/composizione da scrivere/.test(t),
    "e marca in ambra le voci con una distinta ma senza composizione: si vede cosa manca senza aprirle");
  await AD.p.getByRole("button", { name: "Modifica Margherita", exact: true }).click();
  await AD.p.waitForTimeout(700);
  const f = foglio(AD.p);
  ok(/Cosa c'è dentro/.test((await f.innerText()).replace(/\s+/g, " ")),
    "il foglio della voce ha il campo «Cosa c'è dentro»");
  await AD.p.getByRole("button", { name: "Prendi dalla distinta", exact: true }).click();
  await AD.p.waitForTimeout(500);
  await AD.p.getByRole("button", { name: "Salva", exact: true }).click();
  await AD.p.waitForTimeout(900);
  const st = await stato(AD.p);
  const mar = (st.listino || []).find((x) => x.id === "li-mar");
  ok(/sugo/i.test(mar?.dentro || "") && /mozzarella/i.test(mar?.dentro || ""),
    `«Prendi dalla distinta» semina i nomi: «${mar?.dentro}»`);
  ok((mar?.dentroId || []).length === 2,
    "e tiene il legame coi prodotti, che è il ponte per il «senza» di domani");
  /* svuotare il campo lo TOGLIE davvero (Object.assign non cancella) */
  await AD.p.getByRole("button", { name: "Modifica Margherita", exact: true }).click();
  await AD.p.waitForTimeout(700);
  const campi = AD.p.locator(".fixed.inset-0 input:visible");
  await campi.nth(1).fill(""); await AD.p.waitForTimeout(200);
  await AD.p.getByRole("button", { name: "Salva", exact: true }).click();
  await AD.p.waitForTimeout(900);
  const st2 = await stato(AD.p);
  const mar2 = (st2.listino || []).find((x) => x.id === "li-mar");
  ok(!("dentro" in mar2), "svuotato il campo, la chiave sparisce davvero invece di restare per sempre");
  ok(mar2.prezzo === 6.5 && (mar2.distinta || []).length === 2,
    "e non è cambiato nient'altro: prezzo e distinta al loro posto");
});
await AD.ctx.close();

/* ═══ 12. I BERSAGLI E LO SPAZIO ═══ */
console.log("\n— 12. 44 punti, e «Incassa» che non finisce sotto la fascia —");
await prova("§12", async () => {
  /* il conto va fatto LUNGO e su una pagina PULITA: su quella del giro,
     piena di storia, «Incassa» resta in alto e il controllo sarebbe verde
     anche senza lo spaziatore — cioe' non proverebbe niente. Il sabotaggio
     n.9 (via lo spaziatore) lo ha dimostrato restando a zero rossi: un
     controllo che non puo' diventare rosso non e' un controllo. */
  const M = await apri(base, [PR.opCassa], "OpCassa", "2222");
  await vaiA(M.p, "Cassa");
  for (const v of ["Aggiungi Margherita", "Aggiungi Spritz", "Aggiungi Acqua", "Aggiungi Panino"]) {
    await M.p.getByRole("button", { name: v, exact: true }).click(); await M.p.waitForTimeout(250);
    if (v === "Aggiungi Panino") { await M.p.getByRole("button", { name: "Così com'è · € 8,00", exact: true }).click(); await M.p.waitForTimeout(350); }
  }
  await M.p.getByRole("button", { name: "Aggiungi Boscaiola", exact: true }).click(); await M.p.waitForTimeout(300);
  await apriFascia(M.p);
  await M.p.getByRole("button", { name: "Metti Salsiccia su Boscaiola", exact: true }).click(); await M.p.waitForTimeout(450);
  for (const n of ["Metti Broccoletti su Boscaiola", "Lavora su Boscaiola + Salsiccia", "Riga: leva Salsiccia da Boscaiola + Salsiccia"]) {
    const box = await M.p.getByRole("button", { name: n, exact: true }).first().boundingBox();
    ok(!!box && box.height >= 43.5, `«${n}» è un bersaglio da 44 punti — ${box ? Math.round(box.height) : "assente"}`);
  }
  /* l'app NON scorre sulla finestra: il guscio è h-screen overflow-hidden e
     il contenuto sta dentro <main class="overflow-y-auto">. mouse.wheel non
     lo tocca, e il controllo misurava una pagina ferma. Si scorre il
     contenitore vero, fino in fondo, come fa il dito. */
  await M.p.evaluate(() => { const m = document.querySelector("main"); if (m) m.scrollTop = m.scrollHeight; });
  await M.p.waitForTimeout(400);
  const bi = await M.p.getByRole("button", { name: "Incassa", exact: true }).boundingBox();
  const bf = await M.p.locator('[data-fascia="1"]').boundingBox();
  ok(!!bi && !!bf && bi.y + bi.height <= bf.y + 1,
    `«Incassa» sta sopra la fascia, non sotto — Incassa finisce a ${bi ? Math.round(bi.y + bi.height) : "?"}, la fascia comincia a ${bf ? Math.round(bf.y) : "?"}`);
  const scorre = await M.p.evaluate(() => {
    const m = document.querySelector("main") || document.documentElement;
    return m.scrollWidth > m.clientWidth + 1;
  });
  ok(!scorre, "e la pagina non scorre in orizzontale: i chip scorrono dentro la loro fascia");
  await M.ctx.close();
});
await C.ctx.close();

await b.close();
ok(errs.length === 0, "zero errori JavaScript in tutto il giro" + (errs.length ? " — " + errs[0] : ""));
console.log(ko === 0 ? "\ngen603test: tutti i controlli passati" : `\ngen603test: ${ko} controlli KO`);
process.exit(ko === 0 ? 0 : 1);
