/* GUARDA L'APP, NON SOLO IL CODICE (10 settembre, chiesto da Valerio).
   Apre il pacchetto costruito da build.mjs su un server http (mai file://,
   lezione di servi.mjs), lo semina con seed-state.json arricchito di un
   listino e di qualche vendita, entra come Admin, e FOTOGRAFA le schermate
   principali in due formati: telefono (390x844) e schermo largo (1280x800).
   Le foto finiscono in collaudi/foto/<versione>/ e sono gitignorate (*.png):
   sono dati finti, ma non serve gonfiare un repository pubblico.

   COME SI USA:
     node build.mjs ../app/app.jsx     — PRIMA, se no si fotografa il vecchio
     node guarda.mjs                   — tutte le schermate, tutti e due i formati
     node guarda.mjs cassa giornata    — solo quelle
     FORMATO=telefono node guarda.mjs  — un formato solo (telefono | largo)
   Poi le foto si aprono con lo strumento di lettura: una PNG si vede.

   L'antenato e' render-test.mjs (file://, un formato solo, seme senza
   listino: la Cassa veniva vuota). Questo lo sostituisce; corri.mjs non lo
   conta perche' il nome non finisce in test.mjs — e' un attrezzo, non un
   collaudo.

   NON e' la produzione: quella sta su un dominio che il proxy blocca, e non
   si aggira. E' lo stesso codice con dati finti, che e' quello che serve per
   vedere cosa sto costruendo. */
import { chromium } from "playwright";
import { readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { apriServer } from "./servi.mjs";
import { vaiA } from "./navtest.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const src = readFileSync(existsSync("app-under-test.jsx") ? "app-under-test.jsx" : "../app/app.jsx", "utf8");
const VER = (src.match(/const VERSIONE = "([^"]+)"/) || [, "sconosciuta"])[1];
const CARTELLA = path.join("foto", VER);
mkdirSync(CARTELLA, { recursive: true });

/* ── IL SEME: quello dei collaudi, piu' un listino e una serata ──
   Il seme condiviso ha listino e vendite vuoti (verificato a gen-6.07), quindi
   la Cassa sarebbe una stanza vuota e la Giornata direbbe zero: si aggiunge
   quello che serve a VEDERE, con gli stessi attrezzi di gen607test. */
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 6);
const perNome = (n) => { const p = base.prodotti.find((x) => x.nome === n); return (linea?.articoli || []).find((a) => a.prodottoId === p?.id); };
const moz = perNome("Mozzarella no lattosio"), sug = perNome("Sugo");
const ing = (a, qty) => (a ? [{ prodottoId: a.prodottoId, qty, uomId: a.uomId }] : []);
if (linea) FM.cassaMagId = linea.id;
base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6.5, aliquota: 10, attivo: true, varianti: [], distinta: [...ing(sug, 1), ...ing(moz, 1)] },
  { id: "li-dia", nome: "Diavola", gruppo: "Pizze", prezzo: 8, aliquota: 10, attivo: true, varianti: [], distinta: [...ing(sug, 1), ...ing(moz, 1)] },
  { id: "li-cap", nome: "Capricciosa", gruppo: "Pizze", prezzo: 9, aliquota: 10, attivo: true, varianti: [], distinta: [...ing(sug, 1), ...ing(moz, 1)] },
  { id: "li-fri", nome: "Fritto misto", gruppo: "Fritti", prezzo: 5, aliquota: 10, attivo: true, varianti: [], distinta: [] },
  { id: "li-tir", nome: "Tiramisu", gruppo: "Dolci", prezzo: 4.5, aliquota: 10, attivo: true, varianti: [], distinta: [] },
  { id: "li-acq", nome: "Acqua", gruppo: "Bevande", prezzo: 1.5, aliquota: 22, attivo: true, varianti: [], distinta: [] },
];
base.aggiunte = [{ id: "ag-bro", nome: "Broccoletti", categoria: "Verdure", prezzo: 1.5, gruppi: ["Pizze"], distinta: [] },
  { id: "ag-buf", nome: "Bufala", categoria: "Formaggi", prezzo: 2, gruppi: ["Pizze"], distinta: [] }];
base.postazioni = [{ id: "po-for", nome: "Forno", gruppi: ["Pizze"] }, { id: "po-fri", nome: "Friggitoria", gruppi: ["Fritti", "Dolci"] }];
const giornoDi = (t) => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const ora = Date.now();
const vend = (id, minFa, righe, totale, extra = {}) => ({ id, t: ora - minFa * 60000, giorno: giornoDi(ora - minFa * 60000), sedeId: FM.id, chi: "Admin",
  metodo: "contanti", righe, totale, stato: "registrata", n: 1, scarico: [], ...extra });
base.vendite = [
  vend("ve-1", 12, [{ voceId: "li-mar", nome: "Margherita", qty: 2, prezzo: 6.5, aliquota: 10, gruppo: "Pizze" }], 13,
    { cli: { nome: "Rossi", modo: "asporto", fascia: "20:30" }, n: 3 }),
  vend("ve-2", 35, [{ voceId: "li-dia", nome: "Diavola", qty: 1, prezzo: 8, aliquota: 10, gruppo: "Pizze" },
    { voceId: "li-fri", nome: "Fritto misto", qty: 1, prezzo: 5, aliquota: 10, gruppo: "Fritti" }], 13, { n: 2 }),
  vend("ve-3", 70, [{ voceId: "li-tir", nome: "Tiramisu", qty: 2, prezzo: 4.5, aliquota: 10, gruppo: "Dolci" }], 9, { n: 1, metodo: "carta", fatte: { Dolci: { t: ora - 60 * 60000, chi: "Admin" } } }),
];
base.giornate = [{ id: giornoDi(ora) + "|" + FM.id, giorno: giornoDi(ora), sedeId: FM.id, totale: 35, nVendite: 3, nStorni: 0, metodi: { contanti: 26, carta: 9, altro: 0 } }];
base.clienti = [{ id: "cl-1", nome: "Rossi", tel: "3400000001", via: "Via delle Prove 1", t: ora - 12 * 60000 }];
const SEME = JSON.stringify(base);

/* ── LE SCHERMATE ──
   Ognuna e' [nome, come ci si arriva]. Dentro la Cassa la barra cambia
   (Battere · Clienti · Giornata · Esci): quelle tre si raggiungono dalla
   barra della stanza, non da quella dell'app. */
/* L'admin arriva in Cassa e alle Comande dalla LENTE, non dalla barra (la
   barra dell'admin non cambia: e' scritto nel codice, gen-5.96 e gen-5.98).
   La lente e' il bottone con l'etichetta «Cerca un prodotto o una funzione»:
   si scrive il nome della funzione e si tocca il risultato. */
const viaLente = async (p, testo) => {
  await p.getByRole("button", { name: "Cerca un prodotto o una funzione" }).first().click();
  /* il bottone e il campo hanno la STESSA etichetta: si vuole il campo */
  const campo = p.locator('input[aria-label="Cerca un prodotto o una funzione"]').first();
  await campo.waitFor({ state: "visible" });
  await campo.fill(testo.slice(0, 12));
  await p.waitForTimeout(400);
  await p.getByText(testo, { exact: true }).first().click();
  await p.waitForTimeout(900);
};
/* prima la barra, se la voce c'e'; se no la lente */
const vaiO = async (p, barra, lente) => {
  try { await vaiA(p, barra, 900); return; } catch {}
  if (!lente) throw new Error("«" + barra + "» non e' in barra e non ha una voce in lente");
  await viaLente(p, lente);
};
const TUTTE = [
  ["home", async (p) => {}],
  ["cassa", async (p) => { await vaiO(p, "Cassa", "Battere una vendita"); }],
  ["cassa-clienti", async (p) => { await vaiO(p, "Cassa", "Battere una vendita"); await barraCassa(p, /Clienti/); }],
  ["cassa-giornata", async (p) => { await vaiO(p, "Cassa", "Battere una vendita"); await barraCassa(p, /Giornata/); }],
  ["comande", async (p) => { await vaiO(p, "Comande", "Le comande in cucina"); }],
  ["magazzini", async (p) => { await vaiO(p, "Magazzini"); }],
  ["plancia", async (p) => { await vaiO(p, "Plancia"); }],
  ["conteggi", async (p) => { await vaiO(p, "Conteggi", "Contare quello che c'\u00e8"); }],
  ["ordini", async (p) => { await vaiO(p, "Ordini"); }],
  ["analisi", async (p) => { await vaiO(p, "Analisi", "Copertura, consumi e valore della merce"); }],
  ["gestione", async (p) => { await vaiO(p, "Gestione"); }],
  /* Sistema sta DENTRO Gestione, e da gen-6.15 e' dove vive la scheda che
     dice come sta questo telefono e quali telefoni sono rimasti indietro:
     senza questa voce quella schermata non si poteva guardare, solo
     collaudare — e il banco misura, la foto mostra. */
  ["sistema", async (p) => {
    await vaiO(p, "Gestione");
    await p.getByText("Sistema", { exact: true }).locator("visible=true").first().click();
    await p.waitForTimeout(1100);
  }],
];
const barraCassa = async (p, re) => {
  const nav = p.locator("nav, [role=navigation], aside");
  const v = nav.getByRole("button", { name: re }).first();
  if (await v.count()) { await v.click(); await p.waitForTimeout(700); return; }
  await p.getByRole("button", { name: re }).first().click(); await p.waitForTimeout(700);
};
const FORMATI = {
  telefono: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  largo: { viewport: { width: 1280, height: 800 } },
};
const scelte = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const daFare = scelte.length ? TUTTE.filter(([n]) => scelte.includes(n)) : TUTTE;
const formati = process.env.FORMATO ? [process.env.FORMATO] : Object.keys(FORMATI);
if (daFare.length === 0) { console.log("nessuna schermata con quei nomi. Quelle che conosco:", TUTTE.map(([n]) => n).join(", ")); process.exit(1); }

const srv = await apriServer();
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const fatte = [];
for (const f of formati) {
  const ctx = await b.newContext(FORMATI[f]);
  /* la rete finta: window.storage in memoria, seminato. Modo classico, senza
     window.auth: si entra col profilo e il PIN dimostrativo del seme. */
  await ctx.addInitScript((s) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    const m = new Map(); m.set("scp:stato:v1", s);
    window.storage = { async get(k) { return m.has(k) ? { value: m.get(k) } : null; }, async set(k, v) { m.set(k, v); return true; }, async delete(k) { m.delete(k); return true; } };
  }, SEME);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(f + ": " + e.message));
  await p.goto(srv.url, { timeout: 45000, waitUntil: "domcontentloaded" });
  await p.getByText("Admin", { exact: false }).first().waitFor({ state: "visible", timeout: 20000 });
  await p.getByText("Admin", { exact: false }).first().click();
  await p.getByRole("button", { name: "1", exact: true }).first().waitFor({ state: "visible", timeout: 20000 });
  for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(120); }
  await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(900);
  /* da qui in poi otto secondi bastano a qualunque tocco: un'attesa piu'
     lunga vuol dire che la strada e' sbagliata, e si passa alla foto dopo.
     Il caricamento della pagina, prima, ha il suo tempo: il pacchetto pesa
     1,2 MB e i font bloccati dal proxy lo fanno aspettare. */
  p.setDefaultTimeout(8000);
  for (const [nome, arriva] of daFare) {
    const file = path.join(CARTELLA, `${f}-${nome}.png`);
    try {
      /* si riparte sempre dalla Home: cosi' ogni foto e' indipendente dalla
         precedente, e «Esci» dalla Cassa lo fa vaiA da solo */
      await p.keyboard.press("Escape").catch(() => {});   // chiude una lente rimasta aperta
      await vaiA(p, "Home", 700).catch(() => {});
      await arriva(p);
      await p.waitForTimeout(500);
      /* la foto aspetta i font, e i font stanno dietro un proxy che li
         blocca: le si lascia il suo tempo, separato da quello dei tocchi */
      await p.screenshot({ path: file, fullPage: f === "largo", timeout: 40000 });
      fatte.push(file); console.log("foto ", file);
    } catch (e) { console.log("salta", nome, "(" + f + "):", String(e.message).split("\n")[0].slice(0, 100)); }
  }
  await ctx.close();
}
await b.close(); await srv.chiudi();
console.log(`\n${fatte.length} foto in ${CARTELLA}/ (versione ${VER})`);
if (errs.length) console.log("errori di pagina:", [...new Set(errs)].slice(0, 5).join(" | "));
