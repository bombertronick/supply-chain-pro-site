import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const mag = st.magazzini.find((m) => m.articoli.length >= 1) || st.magazzini[0];
const state = JSON.stringify(st);
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
const errs = [];
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
await p.addInitScript((s) => { const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, state);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1300);

// 1. first-run tour auto-started?
const tourOn = await p.getByText(/Passo 1 di/).count() > 0;
const welcome = await p.getByText("Benvenuto", { exact: false }).count() > 0;
console.log("FIRST-RUN tour auto-started:", tourOn, "| welcome shown:", welcome);
await p.screenshot({ path: "tut-1-welcome.png" });
// advance twice
await p.getByRole("button", { name: /Avanti/ }).click(); await p.waitForTimeout(500);
await p.getByRole("button", { name: /Avanti/ }).click(); await p.waitForTimeout(500);
const p3 = await p.getByText(/Passo 3 di/).count() > 0;
console.log("advanced to step 3:", p3);
await p.screenshot({ path: "tut-2-spotlight.png" });
// skip
await p.getByRole("button", { name: /Salta/ }).click(); await p.waitForTimeout(400);
const closed = await p.getByText(/Passo \d+ di/).count() === 0;
console.log("skip closed tour:", closed);

// 2. help menu via "?"
await p.locator('[data-tour="aiuto"]').click(); await p.waitForTimeout(400);
const helpOpen = await p.getByText("Panoramica completa").count() > 0;
const sezBtn = await p.getByText(/Guida di «/).count() > 0;
console.log("help menu open:", helpOpen, "| section-guide option:", sezBtn);
// start section guide for Home
await p.getByText(/Guida di «/).first().click(); await p.waitForTimeout(500);
const secTour = await p.getByText(/Passo 1 di/).count() > 0;
console.log("section guide started:", secTour);
await p.getByRole("button", { name: /Salta|Ho capito/ }).first().click(); await p.waitForTimeout(400);

// 3. Gestione rapida menu in warehouse
const nav = p.getByText("Magazzini", { exact: true });
for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(500);
await p.getByText(mag.nome, { exact: false }).first().click(); await p.waitForTimeout(600);
await p.getByRole("button", { name: /Gestione rapida/ }).click(); await p.waitForTimeout(400);
const gestOpen = await p.getByText("Aggiungi più prodotti").count() > 0 && await p.getByText("Copia da un magazzino").count() > 0;
console.log("Gestione rapida menu open with actions:", gestOpen);
await p.screenshot({ path: "tut-3-gestione.png" });

console.log("pageerrors:", errs.length, errs.slice(0, 8));
console.log("RESULT:", tourOn && welcome && p3 && closed && helpOpen && sezBtn && secTour && gestOpen && errs.length === 0 ? "PASS" : "CHECK");
await b.close();
