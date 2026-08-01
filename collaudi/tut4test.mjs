import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const state = readFileSync("seed-state.json", "utf8");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 880 }, hasTouch: true, isMobile: true });
const errs = [];
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
await p.addInitScript((s) => { const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, state);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1300);

const scrollXduringtour = async () => p.evaluate(() => ({ winX: window.scrollX, bodyX: document.body.scrollLeft, docX: document.documentElement.scrollLeft, bodyW: document.body.scrollWidth, innerW: window.innerWidth }));

// walk the WHOLE overview to the end (8 steps). Steps 1-3 Avanti, 4 = attendi (Salta il passo), 5-8 Avanti/Ho capito.
let steps = 0;
for (let k = 0; k < 12; k++) {
  const onTour = await p.getByText(/Passo \d+ di/).count() > 0;
  if (!onTour) break;
  const b1 = p.getByRole("button", { name: /^Avanti$/ });
  const b2 = p.getByRole("button", { name: /Salta il passo/ });
  const b3 = p.getByRole("button", { name: /Ho capito/ });
  if (await b3.count()) { await b3.first().click(); steps++; break; }
  else if (await b2.count()) { await b2.first().click(); steps++; }
  else if (await b1.count()) { await b1.first().click(); steps++; }
  else break;
  await p.waitForTimeout(400);
}
await p.waitForTimeout(500);
const tourClosed = await p.getByText(/Passo \d+ di/).count() === 0;
const after = await scrollXduringtour();
console.log("stepped through:", steps, "| tour closed:", tourClosed);
console.log("after-tour scroll:", JSON.stringify(after), "| horizontal-shift:", after.winX !== 0 || after.docX !== 0 || after.bodyX !== 0 || after.bodyW > after.innerW + 1 ? "BUG" : "none");
await p.screenshot({ path: "tut4-after.png" });
console.log("pageerrors:", errs.length, errs.slice(0, 6));
console.log("RESULT:", tourClosed && after.winX === 0 && after.docX === 0 && after.bodyW <= after.innerW + 1 && errs.length === 0 ? "PASS" : "CHECK");
await b.close();
