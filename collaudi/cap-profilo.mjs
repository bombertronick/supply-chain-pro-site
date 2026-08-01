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
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(()=>{});
await p.waitForTimeout(1000);
// desktop-width sidebar not present at 440 mobile; Profili is in bottom nav overflow. Try clicking.
const goProfili = await p.getByText("Profili", { exact: true }).first().click().then(()=>true).catch(()=>false);
console.log("clicked Profili:", goProfili);
await p.waitForTimeout(700); await p.screenshot({ path: "pf-1-lista.png", fullPage: true });
await p.getByRole("button", { name: /Nuovo profilo/i }).first().click().catch(async()=>{ await p.getByText("Nuovo profilo").first().click().catch(()=>{}); });
await p.waitForTimeout(700); await p.screenshot({ path: "pf-2-form-default.png", fullPage: true });
// fill nome
await p.getByPlaceholder("Es. Marco").fill("Test Utente").catch((e)=>console.log("nome fill fail", e.message));
await p.waitForTimeout(300);
// select operatore sede if present
await p.screenshot({ path: "pf-3-nome.png", fullPage: true });
// switch to Admin role
await p.getByText("Admin", { exact: true }).click().catch((e)=>console.log("role admin click fail"));
await p.waitForTimeout(400); await p.screenshot({ path: "pf-4-admin.png", fullPage: true });
// switch to Laboratorio
await p.getByText("Laboratorio", { exact: true }).click().catch(()=>{});
await p.waitForTimeout(400); await p.screenshot({ path: "pf-5-lab.png", fullPage: true });
// back to Operatore
await p.getByText("Operatore", { exact: true }).click().catch(()=>{});
await p.waitForTimeout(400); await p.screenshot({ path: "pf-6-operatore.png", fullPage: true });
console.log("ERRORS:", errs.length, errs.slice(0,10));
await b.close();
