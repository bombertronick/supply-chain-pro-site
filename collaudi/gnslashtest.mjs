import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const seed = JSON.parse(readFileSync("seed-state.json", "utf8"));
const PIN = seed.profili.find((p) => p.ruolo === "admin").pinHash;

/* le unità VERE di Valerio: il simbolo contiene una barra */
const st = {
  ...seed,
  unita: [
    { id: "u-pz", nome: "Pezzo", simbolo: "pz" },
    { id: "u-gn13", nome: "Gastronorm 1/3", simbolo: "GN 1/3" },
    { id: "u-gn16", nome: "Gastronorm 1/6", simbolo: "GN 1/6" },
  ],
  categorie: [{ id: "c1", nome: "Verdure", colore: "#2FA97C" }],
  fornitori: [{ id: "f1", nome: "Ortofrutta" }],
  prodotti: [
    { id: "PAT", nome: "Patate forno", categoriaId: "c1", fornitoreId: "f1", uomBase: "u-gn13", conv: {},
      uomLavorazione: "u-gn13", uomFornitore: "u-gn13", uomFornitoreDiretto: "u-gn13" },
    { id: "PEP", nome: "Peperoni", categoriaId: "c1", fornitoreId: "f1", uomBase: "u-gn16", conv: {},
      uomLavorazione: "u-gn16", uomFornitore: "u-gn16", uomFornitoreDiretto: "u-gn16" },
  ],
  sedi: [{ id: "s-lab", nome: "Portuense", tipo: "laboratorio" },
         { id: "s-op", nome: "Fm", tipo: "operatore", labSedeId: "s-lab" }],
  magazzini: [
    { id: "m-lab", nome: "Magazzino centrale", sedeId: "s-lab", tipo: "laboratorio", articoli: [] },
    { id: "m-lin", nome: "Linea fm", sedeId: "s-op", tipo: "linea-lab", articoli: [
      { prodottoId: "PAT", uomId: "u-gn13", par: 1, qty: 1 },
      { prodottoId: "PEP", uomId: "u-gn16", par: 3, qty: 1 },
    ] },
  ],
  profili: [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: PIN }],
  richieste: [], ordini: [],
  /* qualche movimento in uscita, così la previsione fabbisogni si popola */
  movimenti: [
    { id: "mv1", t: Date.now() - 3 * 86400000, magId: "m-lin", prodottoId: "PAT", uomId: "u-gn13", delta: -2, dopo: 1, causale: "conteggio", chi: "Admin" },
    { id: "mv2", t: Date.now() - 1 * 86400000, magId: "m-lin", prodottoId: "PAT", uomId: "u-gn13", delta: -1, dopo: 1, causale: "prelievo", chi: "Admin" },
  ],
};

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 900 }, isMobile: true, hasTouch: true });
const errs = [];
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1400);

let esito = [];
const chk = (n, ok, extra = "") => { esito.push(ok); console.log(`[${ok ? "PASS" : "CHECK"}] ${n}${extra ? " | " + extra : ""}`); };
/* due numeri separati da una barra nuda: è l'ambiguità da eliminare */
const barraAmbigua = /\d\s*\/\s*\d+\s*GN/;
const testo = async () => (await p.locator("body").innerText()).replace(/\s+/g, " ");

/* ===== 1. Plancia · Caselle ===== */
/* la strada per le voci sotto «Gestione» la sa la libreria condivisa */
await vaiA(p, "Plancia");
await p.waitForTimeout(800);
await p.getByRole("button", { name: "Caselle", exact: true }).click(); await p.waitForTimeout(600);
await p.locator("select").first().selectOption("m-lin").catch(() => {});
await p.waitForTimeout(700);
const tCas = await testo();
chk("Caselle: si legge «1 di 1 GN 1/3»", /1 di 1 GN 1\/3/.test(tCas),
  (tCas.match(/.{0,6}di 1 GN 1\/3/) || tCas.match(/.{0,14}GN 1\/3/) || ["?"])[0]);
chk("Caselle: nessuna barra ambigua fra i due numeri", !barraAmbigua.test(tCas),
  (tCas.match(barraAmbigua) || ["nessuna"])[0]);
chk("Caselle: si legge «1 di 3 GN 1/6»", /1 di 3 GN 1\/6/.test(tCas));
await p.screenshot({ path: "gs-1-caselle.png" });

/* ===== 2. Plancia · Struttura (albero fino al prodotto) ===== */
await p.getByRole("button", { name: "Struttura", exact: true }).click(); await p.waitForTimeout(600);
await p.getByRole("button", { name: "Apri tutto" }).click(); await p.waitForTimeout(600);
await p.getByText("Linea fm", { exact: false }).first().click(); await p.waitForTimeout(500);
await p.getByText("Verdure", { exact: false }).first().click(); await p.waitForTimeout(600);
const tStr = await testo();
chk("Struttura: si legge «1 di 1 GN 1/3»", /1 di 1 GN 1\/3/.test(tStr),
  (tStr.match(/.{0,6}di 1 GN 1\/3/) || ["non trovato"])[0]);
chk("Struttura: nessuna barra ambigua", !barraAmbigua.test(tStr), (tStr.match(barraAmbigua) || ["nessuna"])[0]);
await p.screenshot({ path: "gs-2-struttura.png" });

/* ===== 3. Analisi · previsione fabbisogni ===== */
/* la strada per le voci sotto «Gestione» la sa la libreria condivisa */
await vaiA(p, "Analisi");
await p.waitForTimeout(900);
const tAn = await testo();
chk("Analisi: la velocità è scritta «al giorno»", /GN 1\/3 al giorno/.test(tAn),
  (tAn.match(/.{0,16}al giorno/) || ["non trovato"])[0]);
chk("Analisi: la settimana è scritta «a sett.»", /GN 1\/3 a sett\./.test(tAn),
  (tAn.match(/.{0,16}a sett\./) || ["non trovato"])[0]);
chk("Analisi: nessun «GN 1/3/gg» attaccato", !/GN 1\/3\/(gg|sett)/.test(tAn),
  (tAn.match(/GN 1\/3\/\w+/) || ["nessuno"])[0]);
await p.screenshot({ path: "gs-3-analisi.png" });

chk("nessun errore in console", errs.length === 0, errs.slice(0, 2).join(" | "));
console.log("RESULT:", esito.every(Boolean) ? "PASS" : "CHECK");
await b.close();
