import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
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

// ===== C) Catalog bulk edit: set all products to category catId =====
{
  const st = JSON.parse(JSON.stringify(base));
  const catId = st.categorie[st.categorie.length - 1].id; // last category
  const catNome = st.categorie[st.categorie.length - 1].nome;
  const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
  const errs = []; p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  await login(p, JSON.stringify(st));
  await vaiA(p, "Catalogo");
  await p.waitForTimeout(500);
  await p.getByText(/Prodotti ·/).first().click().catch(()=>{});
  await p.waitForTimeout(400);
  await p.getByRole("button", { name: /Modifica in blocco/ }).click();
  await p.waitForTimeout(500);
  await p.locator(".sc-su select").nth(1).selectOption(catId);
  await p.waitForTimeout(200);
  await p.getByRole("button", { name: /Tutti \(/ }).click();
  await p.waitForTimeout(200);
  await p.getByRole("button", { name: /Applica a/ }).click();
  await p.waitForTimeout(700);
  const res = await p.evaluate(async (cid) => { const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value); return { tot: s.prodotti.length, conCat: s.prodotti.filter(x=>x.categoriaId===cid).length }; }, catId);
  console.log(`C) bulk-edit category -> "${catNome}":`, JSON.stringify(res), res.conCat === res.tot ? "PASS" : "CHECK", "| errs", errs.length);
  await p.close();
}

// ===== B) Copy products from another warehouse into an empty one =====
{
  const st = JSON.parse(JSON.stringify(base));
  const src = st.magazzini.find((m) => m.articoli.length >= 1);
  const tgt = st.magazzini.find((m) => m.id !== src.id) || st.magazzini[1];
  tgt.articoli = []; // empty target
  const srcCount = src.articoli.length;
  const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
  const errs = []; p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  await login(p, JSON.stringify(st));
  await vaiA(p, "Magazzini");
  await p.waitForTimeout(600);
  await p.getByText(tgt.nome, { exact: false }).first().click();
  await p.waitForTimeout(600);
  /* da gen-5.52 queste azioni stanno dentro «Gestione rapida»: prima erano
     tasti in chiaro nella pagina del magazzino */
  await p.getByRole("button", { name: /Gestione rapida/ }).click(); await p.waitForTimeout(500);
  /* gen-5.71: la voce si chiama «Copia da un altro magazzino», con le stesse
     parole che usa la ricerca. Prima era «Copia da un magazzino» e basta. */
  await p.locator(".fixed.inset-0.z-50").last().getByRole("button", { name: /Copia da un altro/ }).click();
  await p.waitForTimeout(500);
  // source select is the first select in the dialog; pick src
  await p.locator(".sc-su select").first().selectOption(src.id).catch(()=>{});
  await p.waitForTimeout(200);
  await p.getByRole("button", { name: /^Copia \d+/ }).click();
  await p.waitForTimeout(800);
  const res = await p.evaluate(async (id) => { const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value); const m = s.magazzini.find(x=>x.id===id); return { n: m.articoli.length, qtyZero: m.articoli.every(a=>a.qty===0) }; }, tgt.id);
  console.log(`B) copy from "${src.nome}" (${srcCount}) -> "${tgt.nome}":`, JSON.stringify(res), res.n === srcCount && res.qtyZero ? "PASS" : "CHECK", "| errs", errs.length);
  await p.close();
}

await b.close();
