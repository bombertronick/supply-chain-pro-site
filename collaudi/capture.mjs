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
await p.addInitScript((s) => { const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, state);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(()=>{});
await p.waitForTimeout(1200);
const shots = ["home", "Catalogo", "Magazzini", "Ordini", "Analisi", "Sistema"];
await p.screenshot({ path: "cap-home.png", fullPage: true });
for (const s of shots.slice(1)) {
  try { await p.getByText(s, { exact: true }).first().click(); await p.waitForTimeout(800);
    await p.screenshot({ path: `cap-${s}.png`, fullPage: true }); console.log("shot", s); }
  catch (e) { console.log("skip", s, e.message.split("\n")[0]); }
}
console.log("ERRORS:", errs.length, errs.slice(0,10));
await b.close();
