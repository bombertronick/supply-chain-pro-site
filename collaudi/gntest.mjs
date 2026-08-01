import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });

async function login(p, state) {
  await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, state);
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
  await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1100);
}
async function goMag(p) {
  await vaiA(p, "Magazzini");
  await p.waitForTimeout(600);
}

// ===== TEST A: one-tap Gastronorm set in Catalogo =====
{
  const st = JSON.parse(JSON.stringify(base));
  const before = st.unita.length;
  const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
  const errs = []; p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  await login(p, JSON.stringify(st));
  await vaiA(p, "Catalogo");
  await p.waitForTimeout(600);
  await p.getByRole("button", { name: /Aggiungi set Gastronorm/ }).click(); await p.waitForTimeout(800);
  const res = await p.evaluate(async () => { const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value); const gn = s.unita.filter((u)=>/^GN /.test(u.simbolo)); return { tot: s.unita.length, gn: gn.map((u)=>u.simbolo) }; });
  const want = ["GN 1/1","GN 1/2","GN 1/3","GN 1/4","GN 1/6","GN 1/9","GN 2/3","GN 2/1"];
  const ok = want.every((w) => res.gn.includes(w)) && res.tot === before + 8;
  console.log(`GN-SET: before ${before} -> ${res.tot}, gn=[${res.gn.join(", ")}]`, ok ? "PASS" : "CHECK", "errs", errs.length, errs.slice(0,3));
  // idempotency: button should now be hidden
  const stillThere = await p.getByRole("button", { name: /Aggiungi set Gastronorm/ }).count();
  console.log("GN-SET idempotent (button hidden after add):", stillThere === 0 ? "PASS" : "CHECK");
  await p.close();
}

// ===== TEST B: bulk expected-level (par) + GN unit on many articles =====
{
  const st = JSON.parse(JSON.stringify(base));
  // seed GN units
  const gnId = "u-gn16";
  st.unita.push({ id: gnId, nome: "Gastronorm 1/6", simbolo: "GN 1/6" });
  const A = st.magazzini.find((m) => m.articoli.length >= 2);
  const aCount = A.articoli.length;
  const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
  const errs = []; p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  await login(p, JSON.stringify(st)); await goMag(p);
  await p.getByText(A.nome, { exact: false }).first().click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: /Gestione rapida/ }).click(); await p.waitForTimeout(400);
  await p.getByText("Livello previsto in blocco", { exact: false }).first().click(); await p.waitForTimeout(500);
  // par field
  await p.getByPlaceholder("es. 2").fill("3"); await p.waitForTimeout(150);
  // unit select -> GN 1/6
  await p.locator("select").last().selectOption(gnId).catch(()=>{});
  await p.waitForTimeout(150);
  await p.getByRole("button", { name: /Tutti \(/ }).click(); await p.waitForTimeout(200);
  await p.getByRole("button", { name: /^Applica$/ }).click(); await p.waitForTimeout(800);
  const res = await p.evaluate(async ({ aid, gid }) => { const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value); const m = s.magazzini.find(x=>x.id===aid); return { tot: m.articoli.length, par3: m.articoli.filter(a=>a.par===3).length, gn: m.articoli.filter(a=>a.uomId===gid).length }; }, { aid: A.id, gid: gnId });
  const ok = res.par3 === aCount && res.gn === aCount;
  console.log(`PAR-BULK on "${A.nome}" (${aCount} art): par=3 -> ${res.par3}, GN1/6 -> ${res.gn}`, ok ? "PASS" : "CHECK", "errs", errs.length, errs.slice(0,3));
  await p.close();
}

await b.close();
