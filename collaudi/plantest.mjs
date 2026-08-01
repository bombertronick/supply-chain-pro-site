import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const A = st.magazzini.find((m) => m.articoli.length >= 3);
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 880 }, isMobile: true, hasTouch: true });
const errs = []; p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1100);

// go to Plancia
const nav = p.getByText("Plancia", { exact: true });
for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(500);
await p.screenshot({ path: "plan-1-picker.png" });
// apro la board del magazzino A dalla vista Caselle
await p.getByRole("button", { name: "Caselle", exact: true }).click(); await p.waitForTimeout(600);
await p.locator("select").first().selectOption(A.id).catch(() => {}); await p.waitForTimeout(600);
await p.screenshot({ path: "plan-2-board.png" });
const board = await p.getByText("Riempimento medio").count() > 0;

// STEP: +1 on first tile
const q0 = await p.evaluate(async (aid) => { const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value); return s.magazzini.find(m=>m.id===aid).articoli[0].qty; }, A.id);
await p.getByRole("button", { name: "Aumenta" }).first().click(); await p.waitForTimeout(400);
const q1 = await p.evaluate(async (aid) => { const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value); return s.magazzini.find(m=>m.id===aid).articoli[0].qty; }, A.id);
console.log(`STEP +1: ${q0} -> ${q1}`, q1 === q0 + 1 ? "PASS" : "CHECK");

// select all -> dock -> Riempi al previsto
await p.getByRole("button", { name: /^Tutti$/ }).click(); await p.waitForTimeout(300);
const dock = await p.getByText(/\d+ caselle ·/).count() > 0;   // la barra comandi
await p.screenshot({ path: "plan-3-dock.png" });
await p.getByRole("button", { name: /Riempi/ }).click(); await p.waitForTimeout(700);
const fillRes = await p.evaluate(async (aid) => {
  const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value);
  const parOggi = (a) => { const g = new Date().getDay(); return a.parGiorni && a.parGiorni[g] != null ? a.parGiorni[g] : a.par; };
  const m = s.magazzini.find(x=>x.id===aid);
  return { tot: m.articoli.length, ok: m.articoli.filter(a => Math.abs(a.qty - parOggi(a)) < 1e-6).length };
}, A.id);
console.log(`RIEMPI: ${fillRes.ok}/${fillRes.tot} caselle a livello`, fillRes.ok === fillRes.tot ? "PASS" : "CHECK");

// bulk Giacenza = 7
await p.getByRole("button", { name: /^Tutti$/ }).click().catch(()=>{}); await p.waitForTimeout(200);
await p.getByRole("button", { name: /Giacenza/ }).click(); await p.waitForTimeout(400);
await p.getByPlaceholder("0").fill("7"); await p.waitForTimeout(150);
await p.getByRole("button", { name: /Applica/ }).click(); await p.waitForTimeout(700);
const giaRes = await p.evaluate(async (aid) => { const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value); const m = s.magazzini.find(x=>x.id===aid); return { tot: m.articoli.length, seven: m.articoli.filter(a=>a.qty===7).length }; }, A.id);
console.log(`GIACENZA=7: ${giaRes.seven}/${giaRes.tot}`, giaRes.seven === giaRes.tot ? "PASS" : "CHECK");
await p.screenshot({ path: "plan-4-after.png" });

console.log("board:", board, "| dock:", dock, "| errs", errs.length, errs.slice(0,4));
console.log("RESULT:", board && dock && q1===q0+1 && fillRes.ok===fillRes.tot && giaRes.seven===giaRes.tot && errs.length===0 ? "PASS" : "CHECK");
await b.close();
