import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });

async function login(p, state) {
  await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {}  const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, state);
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
  await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1100);
}
async function goMag(p) {
  const nav = p.getByText("Magazzini", { exact: true });
  for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
  await p.waitForTimeout(600);
}

// ===== MOVE: warehouse A -> B =====
{
  const st = JSON.parse(JSON.stringify(base));
  const A = st.magazzini.find((m) => m.articoli.length >= 2);
  const B = st.magazzini.find((m) => m.id !== A.id);
  B.articoli = [];
  const aCount = A.articoli.length;
  const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
  const errs = []; p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  await login(p, JSON.stringify(st)); await goMag(p);
  await p.getByText(A.nome, { exact: false }).first().click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: /Gestione rapida/ }).click(); await p.waitForTimeout(500);
  await p.getByRole("button", { name: /Sposta o rimuovi prodotti/ }).click(); await p.waitForTimeout(500);
  await p.locator(".sc-su select").first().selectOption(B.id).catch(()=>{});
  await p.getByRole("button", { name: /Tutti \(/ }).click(); await p.waitForTimeout(200);
  await p.getByRole("button", { name: /^Sposta \d+/ }).click(); await p.waitForTimeout(800);
  const res = await p.evaluate(async ({ aid, bid }) => { const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value); return { a: s.magazzini.find(x=>x.id===aid).articoli.length, b: s.magazzini.find(x=>x.id===bid).articoli.length }; }, { aid: A.id, bid: B.id });
  console.log(`MOVE ${aCount} from "${A.nome}" -> "${B.nome}":`, JSON.stringify(res), res.a === 0 && res.b === aCount ? "PASS" : "CHECK", "errs", errs.length);
  await p.close();
}

// ===== REMOVE in bulk =====
{
  const st = JSON.parse(JSON.stringify(base));
  const A = st.magazzini.find((m) => m.articoli.length >= 2);
  const aCount = A.articoli.length;
  const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
  const errs = []; p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  await login(p, JSON.stringify(st)); await goMag(p);
  await p.getByText(A.nome, { exact: false }).first().click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: /Gestione rapida/ }).click(); await p.waitForTimeout(500);
  await p.getByRole("button", { name: /Sposta o rimuovi prodotti/ }).click(); await p.waitForTimeout(500);
  await p.getByRole("button", { name: /Tutti \(/ }).click(); await p.waitForTimeout(200);
  await p.getByRole("button", { name: /^Rimuovi$/ }).click(); await p.waitForTimeout(800);
  const res = await p.evaluate(async (aid) => { const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value); return { a: s.magazzini.find(x=>x.id===aid).articoli.length }; }, A.id);
  console.log(`REMOVE all ${aCount} from "${A.nome}":`, JSON.stringify(res), res.a === 0 ? "PASS" : "CHECK", "errs", errs.length);
  await p.close();
}

// ===== ASSIGN products to multiple warehouses =====
{
  const st = JSON.parse(JSON.stringify(base));
  st.magazzini.forEach((m) => { m.articoli = []; }); // empty all
  const nMag = st.magazzini.length, nProd = st.prodotti.length;
  const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
  const errs = []; p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  await login(p, JSON.stringify(st)); await goMag(p);
  await p.getByRole("button", { name: /Assegna a più magazzini/ }).click(); await p.waitForTimeout(500);
  // product select-all is the first "Tutti (" button, warehouse the second
  const tutti = p.getByRole("button", { name: /Tutti \(/ });
  await tutti.nth(0).click(); await p.waitForTimeout(150);
  await tutti.nth(1).click(); await p.waitForTimeout(150);
  await p.getByRole("button", { name: /^Assegna$/ }).click(); await p.waitForTimeout(900);
  const res = await p.evaluate(async () => { const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value); return { magConProd: s.magazzini.filter(m=>m.articoli.length).length, tot: s.magazzini.length, sample: s.magazzini[0].articoli.length }; });
  console.log(`ASSIGN ${nProd} products -> ${nMag} warehouses:`, JSON.stringify(res), res.magConProd === res.tot ? "PASS" : "CHECK", "errs", errs.length);
  await p.close();
}

await b.close();
