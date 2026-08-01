import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const state = readFileSync("seed-state.json", "utf8");

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 950 } });

const errs = [];
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));

await p.addInitScript((s) => {
  const m = new Map();
  m.set("scp:stato:v1", s);
  window.storage = {
    async get(k){ return m.has(k) ? { value: m.get(k) } : null; },
    async set(k, v){ m.set(k, v); return true; },
    async delete(k){ m.delete(k); return true; },
  };
}, state);

await p.goto("file://" + path.resolve("index.html"));
await p.waitForTimeout(1500);

// Login: Admin -> PIN 1234
await p.getByText("Admin", { exact: false }).first().click();
await p.waitForTimeout(500);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);

// Navigate to Magazzini (click the VISIBLE one; desktop sidebar + mobile bottom-nav both contain it)
async function clickVisible(text) {
  const loc = p.getByText(text, { exact: true });
  const n = await loc.count();
  for (let i = 0; i < n; i++) {
    if (await loc.nth(i).isVisible()) { await loc.nth(i).click(); return true; }
  }
  return false;
}
const navOk = await clickVisible("Magazzini");
console.log("clicked Magazzini nav:", navOk);
await p.waitForTimeout(800);
await p.screenshot({ path: "verify-magazzini.png", fullPage: true });

// Open Linea Pizze detail
const linOk = await clickVisible("Linea Pizze");
console.log("clicked Linea Pizze:", linOk);
await p.waitForTimeout(800);
await p.screenshot({ path: "verify-linea.png", fullPage: true });

// Introspect what rendered: warehouse names visible + product rows in the Linea Pizze detail
const info = await p.evaluate(() => {
  const bodyText = document.body.innerText || "";
  const has = (s) => bodyText.includes(s);
  // count occurrences of some known Linea Pizze product names
  const sampleProducts = ["Patate forno", "Funghi affettati", "Prosciutto crudo", "Ventricina", "Sugo", "Rugetta", "Mozzarella no lattosio"];
  const foundProducts = sampleProducts.filter(has);
  return {
    warehousesMentioned: ["Linea Pizze", "Magazzino Laboratorio", "Magazzino consumabili", "Congelatore", "beverage"].filter(has),
    lineaPizzeProductsFound: foundProducts,
    bodyLen: bodyText.length,
  };
});
console.log("RENDER INFO:", JSON.stringify(info));
console.log("JS ERRORS:", errs.length);
for (const e of errs.slice(0, 8)) console.log("  -", e);

await b.close();
