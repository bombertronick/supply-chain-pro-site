import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const _st = JSON.parse(readFileSync("seed-state.json", "utf8"));
_st.movimenti = _st.movimenti || [];
_st.ordini = _st.ordini || [];
/* ── UN COLLAUDO CHE SCADE DA SOLO ──
   Qui c'era una data scritta a mano: 1784240000000, cioe' il 14 luglio 2026,
   il giorno in cui l'ho scritto. La previsione pero' guarda gli ultimi giorni
   a partire da OGGI: passate due settimane, i consumi finti sono usciti dalla
   finestra e la schermata ha giustamente smesso di mostrarli. Il collaudo e'
   diventato rosso da solo, senza che nessuno toccasse una riga di codice.
   Adesso la storia finta si appoggia a oggi, come fa l'app. */
const now = Date.now();
const mgFm = _st.magazzini.find(m => m.nome === "Linea Pizze");
const artP = mgFm.articoli[0]; artP.qty = 6;
_st.movimenti.unshift(
  { id: "mv-t1", t: now - 2 * 86400000, magId: mgFm.id, prodottoId: artP.prodottoId, uomId: artP.uomId, delta: -3, dopo: 3, causale: "conteggio", chi: "Op" },
  { id: "mv-t2", t: now - 1 * 86400000, magId: mgFm.id, prodottoId: artP.prodottoId, uomId: artP.uomId, delta: -2, dopo: 4, causale: "conteggio", chi: "Op" },
);
_st.ordini.unshift({ id: "ord-t1", t: now, tipo: "diretto", sedeId: mgFm.sedeId, prodottoId: artP.prodottoId, fornitoreId: (_st.fornitori[0] || {}).id, qty: 5, uomId: artP.uomId, stato: "da-ordinare" });
const state = JSON.stringify(_st);

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
const errs = [];
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} 
  const m = new Map(); m.set("scp:stato:v1", s);
  window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} };
  window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; };
}, state);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(()=>{});
await p.waitForTimeout(1200);

// --- Analisi: Previsione fabbisogni ---
/* la strada per le voci sotto «Gestione» la sa la libreria condivisa */
await vaiA(p, "Analisi");
await p.waitForTimeout(700);
console.log("Previsione card present:", await p.getByText("Previsione fabbisogni").count() > 0);
await p.getByText("Previsione fabbisogni").first().scrollIntoViewIfNeeded().catch(()=>{});
// una riga deve mostrare il consumo al giorno dell'articolo
const prevRows = await p.locator('text=/al giorno/').count();
console.log("righe con il consumo al giorno:", prevRows, prevRows > 0 ? "PASS" : "CHECK");
await p.screenshot({ path: "prev-analisi.png", fullPage: true });

// --- Ordini: WhatsApp share ---
/* la strada per le voci sotto «Gestione» la sa la libreria condivisa */
await vaiA(p, "Ordini");
await p.waitForTimeout(700);
await p.getByRole("button", { name: /Report ordine/ }).click().catch((e)=>console.log("report open fail", e.message));
await p.waitForTimeout(600);
await p.screenshot({ path: "prev-report.png" });
const waBtns = await p.getByRole("button", { name: "WhatsApp", exact: true }).count();
console.log("per-category WhatsApp buttons:", waBtns);
console.log("Invia su WhatsApp present:", await p.getByRole("button", { name: /Invia su WhatsApp/ }).count() > 0);
await p.getByRole("button", { name: /Invia su WhatsApp/ }).click().catch((e)=>console.log("wa click fail", e.message));
await p.waitForTimeout(400);
const opened = await p.evaluate(() => window.__opened);
console.log("window.open URLs:", JSON.stringify(opened));
console.log("wa.me url ok:", opened.length > 0 && opened[0].startsWith("https://wa.me/?text="));
console.log("pageerrors:", errs.length, errs.slice(0, 8));
await b.close();
