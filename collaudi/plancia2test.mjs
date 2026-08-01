import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 880 }, isMobile: true, hasTouch: true });
const errs = [];
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);

/* la strada per le voci sotto «Gestione» la sa la libreria condivisa */
await vaiA(p, "Plancia");
await p.waitForTimeout(700);

// ===== RETE: real warehouses drawn, real links =====
const reteOk = await p.locator('svg[aria-label^="Mappa della rete"]').count() > 0;
const nomiSvg = await p.evaluate(() => [...document.querySelectorAll('svg[aria-label^="Mappa della rete"] text')].map(t => t.textContent));
console.log("vista Rete:", reteOk ? "PASS" : "CHECK", "| etichette:", nomiSvg.slice(0, 6));
// every drawn name must correspond to a REAL warehouse (no examples)
const veri = st.magazzini.map(m => m.nome);
const sediNomi = st.sedi.map(s => s.nome.toUpperCase());
// escludo le etichette di servizio: tipo+conteggio, nome sede, percentuale di riempimento
/* ── COSA CONTA COME NOME DI MAGAZZINO ──
   Il controllo qui sotto e' quello importante: sulla mappa non deve comparire
   NIENTE di inventato, solo magazzini che esistono davvero. Restava pero'
   indietro sulle DIDASCALIE: da gen-5.46 la mappa spiega anche chi rifornisce
   chi, e scrive «da fornitore», «da Magazzino Lab…», «serve le linee» accanto
   alle frecce. Non sono nomi di magazzini e non lo sono mai stati — sono le
   scritte che rendono la mappa leggibile. Il collaudo le prendeva per nomi
   falsi e si accendeva rosso su una cosa giusta. */
const DIDASCALIE = /^(da |serve |verso |rifornisce )/i;
const pezzi = nomiSvg.filter(t => !/·/.test(t) && !/^\d+%$/.test(t) && !sediNomi.includes(t)
  && !DIDASCALIE.test(t) && t !== "Altri magazzini".toUpperCase());
const tuttiVeri = pezzi.every(n => veri.some(v => v.includes(n.replace("…", ""))));
console.log("solo dati veri nella rete:", tuttiVeri ? "PASS" : "CHECK");
// particles animate along links
await p.evaluate(() => { const r = document.querySelector('svg[aria-label^="Mappa della rete"] rect[width="92"]'); if (r) r.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
await p.waitForTimeout(500);
const posA = await p.evaluate(() => { const c = document.querySelector('svg[aria-label^="Mappa della rete"] circle[r="4"]'); return c ? c.getAttribute("cx") + "," + c.getAttribute("cy") : null; });
await p.waitForTimeout(400);
const posB = await p.evaluate(() => { const c = document.querySelector('svg[aria-label^="Mappa della rete"] circle[r="4"]'); return c ? c.getAttribute("cx") + "," + c.getAttribute("cy") : null; });
console.log("pacchetti in movimento sui collegamenti:", posA && posB && posA !== posB ? "PASS" : "CHECK");
await p.screenshot({ path: "p2-1-rete.png" });

// ===== STRUTTURA: sede > magazzino > categoria > prodotto (dati veri) =====
await p.getByRole("button", { name: "Struttura", exact: true }).click(); await p.waitForTimeout(500);
const sede0 = st.sedi.find(s => st.magazzini.some(m => m.sedeId === s.id && m.articoli.length > 0));
const sedeVisibile = await p.getByText(sede0.nome, { exact: false }).count() > 0;
await p.getByText(sede0.nome, { exact: false }).first().click(); await p.waitForTimeout(400);
const magDiSede = st.magazzini.filter(m => m.sedeId === sede0.id);
const magVisibile = await p.getByText(magDiSede[0].nome, { exact: false }).count() > 0;
console.log("Struttura: sede", sedeVisibile ? "PASS" : "CHECK", "| magazzino dentro sede", magVisibile ? "PASS" : "CHECK");
// expand warehouse -> categories -> products
await p.getByText(magDiSede[0].nome, { exact: false }).first().click(); await p.waitForTimeout(450);
await p.screenshot({ path: "p2-2-struttura.png" });
const catCount = await p.locator('button:has-text("Senza categoria"), button').count();
console.log("albero espanso (elementi cliccabili):", catCount > 5 ? "PASS" : "CHECK");

// ===== SELEZIONE CONDIVISA: seleziono un magazzino in Struttura, ritrovo l'HUD =====
const magConArt = magDiSede.find(m => m.articoli.length > 0) || magDiSede[0];
await p.getByRole("button", { name: `Seleziona tutto ${magConArt.nome}` }).click(); await p.waitForTimeout(500);
const hud = await p.getByText(/\d+ caselle/).count() > 0;
console.log("HUD comparsa dopo selezione magazzino:", hud ? "PASS" : "CHECK");
await p.screenshot({ path: "p2-3-hud.png" });

// la selezione sopravvive al cambio vista
await p.getByRole("button", { name: "Rete", exact: true }).click(); await p.waitForTimeout(500);
const hudAncora = await p.getByText(/\d+ caselle/).count() > 0;
console.log("selezione condivisa fra le viste:", hudAncora ? "PASS" : "CHECK");

// ===== AZIONE IN BLOCCO dalla Rete =====
await p.getByRole("button", { name: /Riempi/ }).click(); await p.waitForTimeout(900);
const res = await p.evaluate(async (mid) => {
  const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value);
  const parOggi = (a) => { const g = new Date().getDay(); return a.parGiorni && a.parGiorni[g] != null ? a.parGiorni[g] : a.par; };
  const m = s.magazzini.find(x => x.id === mid);
  return { tot: m.articoli.length, ok: m.articoli.filter(a => Math.abs(a.qty - parOggi(a)) < 1e-6).length };
}, magConArt.id);
console.log(`Riempi dalla Rete su "${magConArt.nome}": ${res.ok}/${res.tot}`, res.ok === res.tot && res.tot > 0 ? "PASS" : "CHECK");

// ===== CASELLE: apro un magazzino toccandolo nella rete =====
for (let k = 0; k < 2; k++) { await p.evaluate(() => { const r = document.querySelector('svg[aria-label^="Mappa della rete"] rect[width="92"]'); if (r) r.dispatchEvent(new MouseEvent("click", { bubbles: true })); }); await p.waitForTimeout(500); }
const caselleOk = await p.getByText("Riempimento medio").count() > 0;
console.log("tocco sul nodo apre le Caselle:", caselleOk ? "PASS" : "CHECK");
await p.screenshot({ path: "p2-4-caselle.png" });

console.log("errs", errs.length, errs.slice(0, 4));
const pass = reteOk && tuttiVeri && posA !== posB && sedeVisibile && magVisibile && hud && hudAncora && res.ok === res.tot && caselleOk && errs.length === 0;
console.log("RESULT:", pass ? "PASS" : "CHECK");
await b.close();
