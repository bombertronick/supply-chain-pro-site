import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const state = readFileSync("seed-state.json", "utf8");
const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + (e.stack || e.message).split("\n").slice(0, 3).join(" | ")));

await page.addInitScript((s) => {
  /* spegne la panoramica guidata: se si apre, copre la barra e il collaudo
     resta fermo su una schermata che nessuno gli ha chiesto */
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  const store = new Map(); store.set("scp:stato:v1", s);
  window.storage = {
    async get(k) { return store.has(k) ? { value: store.get(k) } : null; },
    async set(k, v) { store.set(k, v); return true; },
    async delete(k) { store.delete(k); return true; },
  };
  window.__store = store;
}, state);

const step = async (name) => { await page.waitForTimeout(700); await page.screenshot({ path: `t-${name}.png`, fullPage: true }); console.log("  · shot", name); };

await page.goto("file://" + path.resolve("index.html")).catch(() => {});
await page.waitForTimeout(1500);

// login Admin / 1234
await page.getByText("Admin", { exact: false }).first().click();
await page.waitForTimeout(400);
for (const d of "1234") await page.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await page.waitForTimeout(1200);

// Catalogo -> Prodotti -> open first product (check price field)
/* la strada per le voci sotto «Gestione» la sa la libreria condivisa */
await vaiA(page, "Catalogo");
await page.getByText("Prodotti ·", { exact: false }).first().click().catch(() => {});
await step("catalogo-prodotti");
// open first product row to see price field in the form
await page.locator("text=Patate forno").first().click().catch(() => {});
await step("form-prodotto-prezzo");
const hasPrice = await page.getByText("Prezzo d'acquisto", { exact: false }).count();
console.log("  price field present in form:", hasPrice > 0);
// close the sheet (Escape / click backdrop)
await page.keyboard.press("Escape").catch(() => {});
await page.waitForTimeout(400);

// Sistema
/* la strada per le voci sotto «Gestione» la sa la libreria condivisa */
await vaiA(page, "Sistema");
await step("sistema");
const hasCatCard = await page.getByText("Catalogo prodotti (CSV)", { exact: false }).count();
console.log("  catalog CSV card present:", hasCatCard > 0);

// Import flow
await page.getByRole("button", { name: /Importa catalogo/i }).first().click();
await page.waitForTimeout(400);
const csv = [
  "ID;Nome;Categoria;Fornitore;UdM base;Prezzo;Conversioni;UdM lavorazione;UdM fornitore lab;UdM fornitore diretto",
  ";Birra Moretti 66cl;Bevande;Birrificio Test;bott;1,20;cassa=15;bott;cassa;cassa",
].join("\n");
await page.getByPlaceholder(/ID;Nome/).fill(csv);
await page.getByRole("button", { name: /Analizza/i }).click();
await step("import-anteprima");
const previewTxt = await page.getByText("Anteprima", { exact: false }).count();
console.log("  preview shown:", previewTxt > 0);
await page.getByRole("button", { name: /Applica/i }).click();
await page.waitForTimeout(1500);

// verify state updated in mock store
const after = await page.evaluate(async () => {
  const r = await window.storage.get("scp:stato:v1", true);
  const st = JSON.parse(r.value);
  return {
    prodotti: st.prodotti.length,
    hasBirra: st.prodotti.some((p) => p.nome === "Birra Moretti 66cl"),
    hasForn: st.fornitori.some((f) => f.nome === "Birrificio Test"),
    birraPrezzo: (st.prodotti.find((p) => p.nome === "Birra Moretti 66cl") || {}).prezzo,
  };
});
console.log("  AFTER IMPORT:", JSON.stringify(after));
await step("after-import");

console.log("=== CONSOLE/PAGE ERRORS:", errors.length, "===");
errors.slice(0, 20).forEach((e) => console.log("  •", e));
await browser.close();
