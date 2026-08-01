/* gen-5.58: una pagina vera per lo storico degli ordini.

   Le prove che contano non sono «la pagina si apre», sono tre:
   1) il periodo seleziona le righe giuste — se sbaglia, il conto è sbagliato
      e nessuno se ne accorge, perché un numero plausibile lo si crede;
   2) le quantità NON si sommano fra unità diverse: 3 kg + 2 cassette non fa
      «5» di niente, e il riassunto per fornitore non deve nemmeno provarci;
   3) dove il prezzo non c'è, la pagina lo DICE invece di scrivere zero.

   In più due controlli sulla tenuta dei dati: una riga ricevuta ieri ma nata
   50 giorni fa deve restare (prima si sfoltiva guardando la data di nascita,
   e spariva il giorno dopo la consegna), e di una consegna parziale si vede
   quello che è arrivato davvero, non quello che era stato chiesto. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const GIORNO = 86400000;

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const LAB = base.sedi.find((x) => x.tipo === "laboratorio");
const [FM, RM] = base.sedi.filter((x) => x.tipo === "operatore");
const [PA, PB, PC] = base.prodotti;
const [F1, F2] = base.fornitori;
const UPZ = base.unita.find((u) => u.simbolo === "pz").id;
const UKG = base.unita.find((u) => u.simbolo === "kg").id;

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin, seme, dove, largo = 390) => {
  const ctx = await b.newContext({ viewport: { width: largo, height: 900 },
    isMobile: largo < 700, hasTouch: largo < 700, deviceScaleFactor: 2 });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(seme));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(URL); await p.waitForTimeout(1600);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
  await p.waitForTimeout(1600);
  if (dove) await vaiA(p, dove);
  return { p, ctx };
};
const letto = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const testo = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const periodo = async (p, nome) => { await p.getByRole("button", { name: nome, exact: true }).click(); await p.waitForTimeout(700); };

/* la scena: due fornitori, tre prodotti, unità diverse, prezzi assenti */
const scena = (ordini, prezzi = {}) => {
  const s = JSON.parse(JSON.stringify(base));
  const retro = s.magazzini.find((m) => m.tipo === "retro");
  retro.sedeId = FM.id; retro.nome = "Secco fm";
  retro.articoli = [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 5, par: 5 }];
  s.magazzini = [retro];
  s.prodotti = s.prodotti.map((p) => (prezzi[p.id] ? { ...p, prezzo: prezzi[p.id] } : p));
  s.ordini = ordini;
  s.richieste = []; s.movimenti = []; s.log = []; s.codici = []; s.accessi = [];
  s.profili = [
    { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
    { id: "pr-fm", nome: "Fm", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
      magazziniIds: [retro.id], pinHash: hash("2222") },
    { id: "pr-lab", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id, colore: "#22B8CF", pinHash: hash("3333") },
  ];
  return s;
};
/* un ordine ricevuto N giorni fa: nato qualche giorno prima, ricevuto allora */
const ric = (id, prodottoId, fornitoreId, qty, uomId, giorniFa, extra = {}) => ({
  id, tipo: "diretto", sedeId: FM.id, prodottoId, fornitoreId, qty, uomId,
  stato: "ricevuto", t: Date.now() - (giorniFa + 2) * GIORNO,
  tOrdine: Date.now() - (giorniFa + 1) * GIORNO,
  tRicezione: Date.now() - giorniFa * GIORNO, ricevutoDa: "Fm", ...extra,
});

/* ═══════════ 1. IL PERIODO SELEZIONA LE RIGHE GIUSTE ═══════════ */
console.log("\n— 1. il periodo —");
const s1 = scena([
  ric("o-ieri", PA.id, F1.id, 3, UPZ, 1),
  ric("o-dieci", PB.id, F1.id, 4, UPZ, 10),
  ric("o-quaranta", PC.id, F2.id, 2, UPZ, 40),
]);
const A1 = await apri("Admin", "1234", s1, "Storico ordini");
ok(/Storico ordini/.test(await testo(A1.p)), "la pagina si raggiunge da Gestione");

await periodo(A1.p, "Oggi");
const tOggi = await testo(A1.p);
ok(/Niente in questo periodo/.test(tOggi), "«Oggi»: nessuna riga, e l'app lo dice");
ok(/allarga il periodo/.test(tOggi), "suggerendo di allargare invece di lasciare il vuoto muto");

await periodo(A1.p, "7 giorni");
const t7 = await testo(A1.p);
ok(/1 ordine · 1 riga/.test(t7), "«7 giorni»: solo quella di ieri");
ok(new RegExp(PA.nome, "i").test(t7) === false || /1 riga/.test(t7),
  "e il conto in cima parla di una riga sola");

await periodo(A1.p, "30 giorni");
const t30 = await testo(A1.p);
ok(/2 ordini · 2 righe/.test(t30), "«30 giorni»: due, quella di ieri e quella di dieci giorni fa");
/* il nome del fornitore fuori periodo resta nel menù a tendina (è un filtro,
   non un risultato): quello che conta è che non stia nel CONTO. */
const conto30 = (await A1.p.getByText("Il conto per fornitore", { exact: true })
  .locator("xpath=../..").innerText()).replace(/\s+/g, " ");
ok(!new RegExp(F2.nome).test(conto30), `e il fornitore della riga di 40 giorni (${F2.nome}) non entra nel conto`);

await periodo(A1.p, "Sempre");
const tTutto = await testo(A1.p);
ok(/3 ordini · 3 righe/.test(tTutto), "«Sempre»: tutte e tre");
ok(new RegExp(F1.nome).test(tTutto) && new RegExp(F2.nome).test(tTutto),
  "con tutti e due i fornitori nel conto");
await A1.p.screenshot({ path: "g558-1-periodo.png", fullPage: true });

/* ═══════════ 2. LE QUANTITÀ NON SI SOMMANO FRA UNITÀ DIVERSE ═══════════ */
console.log("\n— 2. non si somma quello che non è sommabile —");
const s2 = scena([
  ric("o-pz", PA.id, F1.id, 3, UPZ, 1),
  ric("o-kg", PB.id, F1.id, 2, UKG, 1),
]);
const A2 = await apri("Admin", "1234", s2, "Storico ordini");
const t2 = await testo(A2.p);
ok(/1 ordine · 2 righe/.test(t2), "stesso fornitore, stesso giorno, stesso stato: un ordine solo");
/* la riga di riassunto del fornitore conta righe e prodotti, non quantità */
ok(/2 righe · 2 prodotti/.test(t2), "il riassunto conta righe e prodotti");
ok(!/\b5 pz\b/.test(t2) && !/\b5 kg\b/.test(t2),
  "e non inventa un «5» sommando 3 pz con 2 kg");
/* le quantità vere ci sono, ognuna con la sua unità, dentro l'ordine aperto */
/* il nome del fornitore compare due volte — nel conto in cima (non cliccabile)
   e sull'ordine sotto: si apre l'ordine per ruolo, non per posizione */
await A2.p.getByRole("button", { name: new RegExp(F1.nome) }).first().click(); await A2.p.waitForTimeout(700);
const t2b = await testo(A2.p);
ok(/3 pz/.test(t2b) && /2 kg/.test(t2b), "aprendo l'ordine, ogni riga tiene la sua unità");
await A2.p.screenshot({ path: "g558-2-unita.png", fullPage: true });
await A2.ctx.close();

/* ═══════════ 3. I SOLDI: SI DICE QUANDO NON SI SANNO ═══════════ */
console.log("\n— 3. i soldi —");
const t3senza = await testo(A1.p);
ok(/non si sa/.test(t3senza) && /nessuno di questi prodotti ha un prezzo/.test(t3senza),
  "senza prezzi in catalogo il totale non è «€ 0», è «non si sa»");
ok(/Il conto delle righe è comunque esatto/.test(t3senza),
  "e si distingue quello che manca (i soldi) da quello che c'è (gli ordini)");
ok(!/€ 0/.test(t3senza), "nessuno zero finto da nessuna parte");
await A1.ctx.close();

/* con un prezzo su uno dei due prodotti: totale parziale + righe fuori dal conto */
const s3 = scena([
  ric("o-p1", PA.id, F1.id, 2, UPZ, 1),
  ric("o-p2", PB.id, F1.id, 3, UPZ, 1),
], { [PA.id]: 4 });
const A3 = await apri("Admin", "1234", s3, "Storico ordini");
const t3 = await testo(A3.p);
ok(/Totale di quello che si sa/.test(t3), "con un prezzo su due: il totale è dichiarato parziale");
ok(/€ 8,00/.test(t3), "il totale di quello che si sa è 2 × 4 = 8");
ok(/1 riga fuori dal conto/.test(t3), "e la riga senza prezzo è contata, non ignorata");
await A3.p.screenshot({ path: "g558-3-soldi.png", fullPage: true });
await A3.ctx.close();

/* ═══════════ 4. LA CONSEGNA PARZIALE DICE QUELLO CHE È ARRIVATO ═══════════ */
console.log("\n— 4. consegna parziale —");
const s4 = scena([
  ric("o-parziale", PA.id, F1.id, 5, UPZ, 1, { qtyRicevuta: 2 }),
], { [PA.id]: 10 });
const A4 = await apri("Admin", "1234", s4, "Storico ordini");
await A4.p.getByRole("button", { name: new RegExp(F1.nome) }).first().click(); await A4.p.waitForTimeout(700);
const t4 = await testo(A4.p);
ok(/2 pz/.test(t4), "la quantità mostrata è quella ARRIVATA (2), non quella ordinata (5)");
ok(/ne erano stati ordinati 5 pz/.test(t4), "e l'ordinato resta scritto, senza nasconderlo");
/* «50» da solo pescava il «al massimo 150» della nota sulla finestra: il
   controllo va fatto sulla cifra in euro, non su due caratteri qualunque */
ok(/€ 20,00/.test(t4) && !/€ 50,00/.test(t4), "il valore segue l'arrivato: 2 × 10 = 20, non 50");
await A4.p.screenshot({ path: "g558-4-parziale.png", fullPage: true });
await A4.ctx.close();

/* ═══════════ 5. LA FINESTRA SI CONTA DALL'ULTIMA COSA SUCCESSA ═══════════ */
console.log("\n— 5. la finestra —");
/* Il caso che prima si perdeva: ordine partito 50 giorni fa, merce arrivata
   ieri. Guardando la data di nascita la riga era «vecchia» e spariva il giorno
   dopo la consegna — cioè proprio quando serviva vederla. */
const s5 = scena([
  { id: "o-lungo", tipo: "diretto", sedeId: FM.id, prodottoId: PA.id, fornitoreId: F1.id,
    qty: 3, uomId: UPZ, stato: "ricevuto", t: Date.now() - 50 * GIORNO,
    tOrdine: Date.now() - 49 * GIORNO, tRicezione: Date.now() - 1 * GIORNO },
  { id: "o-vecchio-davvero", tipo: "diretto", sedeId: FM.id, prodottoId: PB.id, fornitoreId: F1.id,
    qty: 1, uomId: UPZ, stato: "ricevuto", t: Date.now() - 60 * GIORNO,
    tOrdine: Date.now() - 59 * GIORNO, tRicezione: Date.now() - 58 * GIORNO },
  { id: "o-da-fare-antico", tipo: "diretto", sedeId: FM.id, prodottoId: PC.id, fornitoreId: F1.id,
    qty: 1, uomId: UPZ, stato: "da-ordinare", t: Date.now() - 400 * GIORNO },
  { id: "o-senza-data", tipo: "diretto", sedeId: FM.id, prodottoId: PA.id, fornitoreId: F1.id,
    qty: 1, uomId: UPZ, stato: "ricevuto" },
]);
/* serve una scrittura qualsiasi perché lo sfoltimento si applichi: l'avvio di
   un inventario scrive e non ha niente a che vedere con gli ordini */
const A5 = await apri("Admin", "1234", s5, "Magazzini");
await A5.p.getByRole("button", { name: /^Inventario$/ }).click(); await A5.p.waitForTimeout(1100);
const f5 = A5.p.locator(".fixed.inset-0.z-50").last();
const t5f = (await f5.innerText()).replace(/\s+/g, " ");
if (/Tutte le sedi in un giro solo/.test(t5f)) {
  await f5.getByText("Tutte le sedi in un giro solo").first().click(); await A5.p.waitForTimeout(800);
}
await f5.getByRole("button", { name: /Avvia inventario/ }).click(); await A5.p.waitForTimeout(2000);
const d5 = (await letto(A5.p)).ordini.map((o) => o.id);
ok(d5.includes("o-lungo"),
  "un ordine nato 50 giorni fa ma arrivato ieri RESTA: la finestra guarda l'ultima cosa successa");
ok(!d5.includes("o-vecchio-davvero"), "uno ricevuto 58 giorni fa esce: è oltre i 45");
ok(d5.includes("o-da-fare-antico"), "una riga ancora da fare non si tocca mai, neanche di 400 giorni");
ok(d5.includes("o-senza-data"), "una riga senza data si tiene: non sapere quanti anni ha non è un motivo per buttarla");
await A5.ctx.close();

/* ═══════════ 6. CHI VEDE CHE COSA: LA STESSA REGOLA DI «ORDINI» ═══════════ */
console.log("\n— 6. chi vede che cosa —");
const s6 = scena([
  ric("o-diretto-fm", PA.id, F1.id, 3, UPZ, 1),
  { id: "o-lab", tipo: "lab", sedeId: LAB.id, prodottoId: PB.id, fornitoreId: F2.id,
    qty: 2, uomId: UPZ, stato: "ricevuto", t: Date.now() - 3 * GIORNO,
    tRicezione: Date.now() - 1 * GIORNO },
]);
/* «Gestione» ce l'ha solo l'admin: chi non lo è arriva allo storico dal tasto
   dentro «Ordini». Senza quel tasto la pagina, per loro, non esisterebbe. */
const O6 = await apri("Fm", "2222", s6, "Ordini");
ok(await O6.p.getByRole("button", { name: /^Storico$/ }).count() === 1,
  "l'operatore, che non ha «Gestione», trova il tasto «Storico» dentro Ordini");
await O6.p.getByRole("button", { name: /^Storico$/ }).click(); await O6.p.waitForTimeout(1200);
const t6 = await testo(O6.p);
ok(/Storico ordini/.test(t6), "e il tasto lo porta davvero sulla pagina");
ok(new RegExp(F1.nome).test(t6), `l'operatore vede l'acquisto diretto della sua sede (${F1.nome})`);
ok(!new RegExp(F2.nome).test(t6), `e non quello del laboratorio (${F2.nome}), come in «Ordini»`);
ok(/1 ordine · 1 riga/.test(t6), "il conto è quello delle sue righe, non di tutte");
/* e la strada di ritorno c'è: senza, resterebbe chiuso dentro */
await O6.p.getByRole("button", { name: /^Ordini$/ }).first().click(); await O6.p.waitForTimeout(1200);
ok(/Report acquisti/.test(await testo(O6.p)), "e il tasto indietro riporta agli Ordini");
await O6.p.screenshot({ path: "g558-6-operatore.png", fullPage: true });
await O6.ctx.close();

const L6 = await apri("Lab", "3333", s6, "Ordini");
await L6.p.getByRole("button", { name: /^Storico$/ }).click(); await L6.p.waitForTimeout(1200);
const t6b = await testo(L6.p);
ok(new RegExp(F2.nome).test(t6b) && !new RegExp(F1.nome).test(t6b),
  "il laboratorio vede i suoi e non quelli delle sedi operative");
await L6.ctx.close();

/* ═══════════ 7. LA FINESTRA È DICHIARATA, CON LA VIA D'USCITA ═══════════ */
console.log("\n— 7. quello che l'app non tiene, lo dice —");
const A7 = await apri("Admin", "1234", s1, "Storico ordini");
const t7b = await testo(A7.p);
ok(/le righe chiuse restano 45 giorni/.test(t7b), "la pagina dichiara quanto tiene");
ok(/al massimo 150/.test(t7b), "e quante righe");
ok(/Scarica CSV/.test(t7b), "indicando il CSV come modo per conservarle più a lungo");
ok(await A7.p.getByRole("button", { name: /Scarica CSV/ }).count() > 0, "e il tasto c'è davvero");

/* il filtro per stato non deve nascondere righe che ci sono */
await periodo(A7.p, "Sempre");
await A7.p.getByLabel("Filtra per stato").selectOption("ordinato"); await A7.p.waitForTimeout(700);
ok(/Niente in questo periodo/.test(await testo(A7.p)),
  "filtrando per «Ordinati» (che qui non ce ne sono) resta vuoto, e lo dice");
await A7.p.getByRole("button", { name: /Togli i filtri/ }).click(); await A7.p.waitForTimeout(800);
const t7c = await testo(A7.p);
ok(/2 ordini · 2 righe/.test(t7c), "«Togli i filtri» riporta al periodo di partenza (30 giorni)");
await A7.p.screenshot({ path: "g558-5-filtri.png", fullPage: true });
await A7.ctx.close();

/* ═══════════ 8. REGRESSIONE: «ORDINI» FUNZIONA ANCORA ═══════════ */
console.log("\n— 8. regressione su «Ordini» —");
const A8 = await apri("Admin", "1234", s6, "Ordini");
const t8 = await testo(A8.p);
ok(/Ricevuti · 2/.test(t8), "l'admin vede tutte e due le righe, come prima");
await A8.ctx.close();
const O8 = await apri("Fm", "2222", s6, "Ordini");
const t8b = await testo(O8.p);
ok(/Ricevuti · 1/.test(t8b), "l'operatore ne vede una: la regola condivisa non ha cambiato niente");
await O8.ctx.close();

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 8)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
