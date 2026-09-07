/* gen-6.09: LE AGGIUNTE PER CATEGORIA, E LE FASCE IN UNA BARRA.

   CHIESTO DA VALERIO il 6 e il 7 settembre:
   · «i prodotti aggiunta devono poter essere divisi per categoria così mentre
     la cassa prepara l'ordine le aggiunte sono ordinate e le può selezionare
     rapidamente»
   · «nelle categorie devono essere ordinati in ordine alfabetico» (la risposta
     alla mia domanda: NON piu'-usate, alfabetico)
   · «le fasce orarie devono essere visibili tramite una barra laterale
     scorribile»

   SCRITTO PRIMA DELLE MODIFICHE, contro gen-6.08 (il build online). Devono
   essere ROSSI: §2 (la categoria non esiste sull'aggiunta), §3 (la fascia non
   raggruppa), §4 (dentro la categoria si ordina per piu'-usate, non in
   alfabeto), §5 (l'editor non ha il campo), §7 (la barra delle fasce non
   c'e'), §8 (la barra non scorre).
   VERDI ANCHE PRIMA, apposta: §1 (chi non ha la cassa non vede niente),
   §6 (un'aggiunta senza categoria non sparisce: finisce in un gruppo suo),
   §9 (la pizza liscia resta un tocco).

   NIENTE DATI VERI: nomi inventati. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
import { apriServer } from "./servi.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 100)}`); } };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con almeno 2 articoli");
const artA = linea.articoli[0]; artA.qty = 50;
FM.cassaMagId = linea.id;
base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6, attivo: true, varianti: [],
    distinta: [{ prodottoId: artA.prodottoId, qty: 1, uomId: artA.uomId }] },
  { id: "li-bib", nome: "Acqua", gruppo: "Bere", prezzo: 1.5, attivo: true, varianti: [], distinta: [] },
];
base.postazioni = [];
base.vendite = []; base.giornate = []; base.clienti = [];

/* LE AGGIUNTE DEL BANCO. I nomi sono scelti apposta perche' l'ordine
   ALFABETICO e quello PER PIU'-USATE siano DIVERSI: se coincidessero, il
   controllo sarebbe verde comunque e non proverebbe niente. */
base.aggiunte = [
  { id: "ag-zuc", nome: "Zucchine", categoria: "Verdure", prezzo: 1, attivo: true, gruppi: ["Pizze"], distinta: [] },
  { id: "ag-car", nome: "Carciofi", categoria: "Verdure", prezzo: 1.5, attivo: true, gruppi: ["Pizze"], distinta: [] },
  { id: "ag-mel", nome: "Melanzane", categoria: "Verdure", prezzo: 1.2, attivo: true, gruppi: ["Pizze"], distinta: [] },
  { id: "ag-sal", nome: "Salsiccia", categoria: "Salumi", prezzo: 2, attivo: true, gruppi: ["Pizze"], distinta: [] },
  { id: "ag-cru", nome: "Crudo", categoria: "Salumi", prezzo: 2.5, attivo: true, gruppi: ["Pizze"], distinta: [] },
  /* senza categoria APPOSTA: non deve sparire (§6) */
  { id: "ag-orf", nome: "Origano", prezzo: 0.2, attivo: true, gruppi: ["Pizze"], distinta: [] },
];
/* «Zucchine» battuta tante volte: con l'ordine vecchio starebbe PRIMA di
   «Carciofi», con quello alfabetico DOPO. E' il perno di §4. */
const IERI = Date.now() - 3600 * 1000;
base.vendite = [{
  id: "vn-vecchia", t: IERI, giorno: new Date(IERI).toISOString().slice(0, 10), sedeId: FM.id,
  chi: "OpCassa", n: 1, totale: 0, metodo: "contanti", stato: "registrata", scarico: [],
  righe: [{ voceId: "li-mar", nome: "Margherita", qty: 9, prezzo: 0, gruppo: "Pizze",
    agg: [{ id: "ag-zuc", nome: "Zucchine", prezzo: 1 }] }],
}];

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  opZero: { id: "pr-o0", nome: "OpZero", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], pinHash: hash("2222") },
  opCassa: { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") },
};

const srv = await apriServer();
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
  await p.goto(srv.url); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1500);
  return { p, ctx };
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const apriFascia = async (p) => {
  await p.locator('[data-fascia-chiusa="1"] button').first().click();
  await p.waitForTimeout(450);
};
/* i chip nell'ordine VERO in cui stanno nel DOM: e' quello che il dito trova */
const chipInOrdine = (p) => p.evaluate(() =>
  [...document.querySelectorAll('[data-fascia="1"] [data-agg]')].map((e) => e.getAttribute("data-agg")));
const intestazioni = (p) => p.evaluate(() =>
  [...document.querySelectorAll('[data-fascia="1"] [data-cat]')].map((e) => e.getAttribute("data-cat")));

/* ═══ 1. CONTRO-CONTROLLO: senza cassa non c'è niente ═══ */
console.log("\n— 1. senza «cassa» non si vede nessuna aggiunta —");
const Z = await apri(base, [PR.opZero], "OpZero", "2222");
await prova("§1", async () => {
  const t = await testoDi(Z.p);
  ok(!/Carciofi/.test(t) && !/Salsiccia/.test(t), "nessun ingrediente da nessuna parte");
});
await Z.ctx.close();

const C = await apri(base, [PR.opCassa], "OpCassa", "2222");
await vaiA(C.p, "Cassa");

/* ═══ 2. LA CATEGORIA ESISTE E ARRIVA A SCHERMO ═══ */
console.log("\n— 2. le categorie si vedono come intestazioni —");
await prova("§2", async () => {
  await apriFascia(C.p);
  const cat = await intestazioni(C.p);
  ok(cat.includes("Salumi") && cat.includes("Verdure"),
    `la fascia mostra le categorie come intestazioni — trovate: ${JSON.stringify(cat)}`);
});

/* ═══ 3. OGNI AGGIUNTA STA SOTTO LA SUA CATEGORIA ═══ */
console.log("\n— 3. ogni ingrediente sta nel suo gruppo —");
await prova("§3", async () => {
  const dentro = await C.p.evaluate(() => {
    const out = {};
    for (const g of document.querySelectorAll('[data-fascia="1"] [data-cat]'))
      out[g.getAttribute("data-cat")] = [...g.querySelectorAll("[data-agg]")].map((e) => e.getAttribute("data-agg"));
    return out;
  });
  ok(JSON.stringify(dentro["Salumi"] || []) === JSON.stringify(["Crudo", "Salsiccia"]),
    `sotto «Salumi» ci sono Crudo e Salsiccia, in quest'ordine — trovato ${JSON.stringify(dentro["Salumi"])}`);
  ok((dentro["Verdure"] || []).length === 3,
    `sotto «Verdure» ce ne sono tre — trovato ${JSON.stringify(dentro["Verdure"])}`);
});

/* ═══ 4. DENTRO LA CATEGORIA: ALFABETICO, NON PIÙ-USATE ═══ */
console.log("\n— 4. dentro la categoria si ordina in alfabeto —");
await prova("§4", async () => {
  const dentro = await C.p.evaluate(() => {
    const g = document.querySelector('[data-fascia="1"] [data-cat="Verdure"]');
    return g ? [...g.querySelectorAll("[data-agg]")].map((e) => e.getAttribute("data-agg")) : [];
  });
  /* «Zucchine» e' l'aggiunta piu' battuta (9 volte nella vendita del seed):
     con l'ordine vecchio starebbe PRIMA, in alfabeto sta ULTIMA. E' questo
     che rende il controllo capace di fallire. */
  ok(JSON.stringify(dentro) === JSON.stringify(["Carciofi", "Melanzane", "Zucchine"]),
    `Carciofi, Melanzane, Zucchine — e «Zucchine», la più battuta, sta ULTIMA. Trovato ${JSON.stringify(dentro)}`);
});

/* ═══ 6. CONTRO-CONTROLLO: senza categoria non si sparisce ═══ */
console.log("\n— 6. un ingrediente senza categoria non sparisce —");
await prova("§6", async () => {
  const tutti = await chipInOrdine(C.p);
  ok(tutti.includes("Origano"),
    `«Origano» non ha categoria e si vede lo stesso — trovati ${JSON.stringify(tutti)}`);
  ok(tutti.length === 6, `ci sono tutte e sei le aggiunte, nessuna persa — ${tutti.length}`);
});

/* ═══ 7. LA BARRA LATERALE DELLE FASCE ORARIE ═══ */
console.log("\n— 7. le fasce orarie in una barra laterale —");
await prova("§7", async () => {
  await C.p.getByRole("button", { name: /^Chi è, e come lo vuole/ }).click();
  await C.p.waitForTimeout(450);
  await C.p.getByRole("button", { name: "Asporto", exact: true }).click();
  await C.p.waitForTimeout(350);
  const barra = C.p.locator('[data-fasce="1"]');
  ok((await barra.count()) > 0, "c'è la barra delle fasce orarie");
  const quante = await C.p.locator('[data-fasce="1"] [data-ora]').count();
  ok(quante >= 8, `e propone almeno otto orari, non quattro tastini — ne trovo ${quante}`);
});

/* ═══ 8. LA BARRA SCORRE, E SCEGLIERE UN'ORA LA SCRIVE ═══ */
console.log("\n— 8. la barra scorre, e il tocco sceglie l'ora —");
await prova("§8", async () => {
  const scorre = await C.p.evaluate(() => {
    const b = document.querySelector('[data-fasce="1"]');
    if (!b) return null;
    const s = getComputedStyle(b);
    return { puo: b.scrollHeight > b.clientHeight + 1,
      stile: s.overflowY, alta: Math.round(b.clientHeight) };
  });
  ok(!!scorre && /auto|scroll/.test(scorre.stile),
    `la barra è scorribile (overflow-y: ${scorre?.stile})`);
  ok(!!scorre && scorre.puo,
    `e ha davvero più roba di quanta ne stia (${scorre?.alta}px di finestra, contenuto più alto)`);
  const prima = C.p.locator('[data-fasce="1"] [data-ora]').first();
  const ora = await prima.getAttribute("data-ora");
  await prima.click(); await C.p.waitForTimeout(400);
  const val = await C.p.getByLabel("Per le", { exact: false }).first().inputValue();
  ok(val === ora, `toccando «${ora}» il campo diventa «${ora}» — vale «${val}»`);
  ok(/^\d{2}:\d{2}$/.test(ora || ""), `e l'ora è scritta come un'ora (${ora})`);
});

/* ═══ 9. CONTRO-CONTROLLO: la pizza liscia resta un tocco ═══ */
console.log("\n— 9. la pizza liscia resta un tocco —");
await prova("§9", async () => {
  await C.p.getByRole("button", { name: "Va bene", exact: true }).click();
  await C.p.waitForTimeout(400);
  await C.p.getByRole("button", { name: "Aggiungi Margherita" }).click();
  await C.p.waitForTimeout(350);
  ok((await C.p.locator(".sc-foglio").count()) === 0, "nessun foglio si è aperto");
  ok(/€ 6,00/.test(await testoDi(C.p)), "una Margherita, € 6,00, un tocco solo");
});
await C.ctx.close();

/* ═══ 5. L'EDITOR: la categoria si scrive da Gestione ═══ */
console.log("\n— 5. la categoria si scrive nell'editor dell'aggiunta —");
const A = await apri(base, [PR.admin], "Admin", "1234");
await prova("§5", async () => {
  await vaiA(A.p, "Gestione");
  await A.p.getByText("Listino", { exact: true }).first().click(); await A.p.waitForTimeout(900);
  await A.p.getByRole("button", { name: /Aggiunte/ }).first().click(); await A.p.waitForTimeout(600);
  ok(/Verdure/.test(await testoDi(A.p)), "nell'elenco delle aggiunte si legge la categoria");
  await A.p.getByRole("button", { name: /Modifica l'aggiunta Carciofi|Carciofi/ }).first().click();
  await A.p.waitForTimeout(700);
  const campo = A.p.getByLabel("Categoria", { exact: false });
  ok((await campo.count()) > 0, "il foglio dell'aggiunta ha il campo «Categoria»");
  ok((await campo.first().inputValue()) === "Verdure", "e porta dentro quella che c'era");
});
await A.ctx.close();

await b.close();
await srv.chiudi();
console.log(`\nerrori di pagina: ${errs.length}`);
for (const e of errs.slice(0, 6)) console.log("  ! " + e);
if (errs.length) ko += errs.length;
console.log(ko === 0 ? "\nTUTTI I CONTROLLI PASSATI" : `\n${ko} CONTROLLI FALLITI`);
process.exit(ko ? 1 : 0);
