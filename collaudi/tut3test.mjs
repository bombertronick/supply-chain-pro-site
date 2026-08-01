import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const state = readFileSync("seed-state.json", "utf8");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
// MOBILE viewport -> bottom nav is used
const p = await b.newPage({ viewport: { width: 440, height: 880 }, hasTouch: true, isMobile: true });
const errs = [];
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
await p.addInitScript((s) => { const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, state);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1300);

await p.screenshot({ path: "tut3-1-welcome-mobile.png" });
// advance to "Prova tu!" (steps 1->4): Avanti x3
for (let k = 0; k < 3; k++) { await p.getByRole("button", { name: /Avanti/ }).click(); await p.waitForTimeout(500); }
const provaTu = await p.getByText("Prova tu!", { exact: false }).count() > 0;
console.log("reached Prova tu (mobile):", provaTu);
await p.screenshot({ path: "tut3-2-provatu-mobile.png" });

// REAL tap on the highlighted bottom-nav Magazzini (respects pointer-events / stacking)
let tapErr = "";
try {
  await p.getByText("Magazzini", { exact: true }).last().click({ timeout: 4000 });
} catch (e) { tapErr = e.message.split("\n")[0]; }
await p.waitForTimeout(700);
const advanced = await p.getByText("Dentro un magazzino", { exact: false }).count() > 0;
const onMag = await p.getByText(/Assegna a più magazzini/).count() > 0;
console.log("REAL tap advanced tour:", advanced, "| navigated:", onMag, tapErr ? "| tapErr: " + tapErr : "");
await p.screenshot({ path: "tut3-3-after-tap-mobile.png" });

console.log("pageerrors:", errs.length, errs.slice(0, 6));
console.log("RESULT:", provaTu && advanced && onMag && errs.length === 0 ? "PASS" : "CHECK");
await b.close();
