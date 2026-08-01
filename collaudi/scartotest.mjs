import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const _st = JSON.parse(readFileSync("seed-state.json", "utf8"));
{ const mg = _st.magazzini.find(m=>m.nome==="Linea Pizze"); if (mg) mg.articoli.forEach(a=>a.qty = 5); }
const state = JSON.stringify(_st);
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const errs = [];
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {}  const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, state);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(()=>{});
await p.waitForTimeout(1200);
const mag = p.getByText("Magazzini", { exact: true });
for (let i = 0; i < await mag.count(); i++) { if (await mag.nth(i).isVisible()) { await mag.nth(i).click(); break; } }
await p.waitForTimeout(800);
await p.getByText("Linea Pizze", { exact: false }).first().click().catch(()=>{});
await p.waitForTimeout(900);
const scartoBtns = p.locator('button[aria-label^="Scarto "]');
console.log("scarto buttons:", await scartoBtns.count());
const artName = (await scartoBtns.first().getAttribute("aria-label")).replace(/^Scarto /, "");
const before = await p.evaluate(async (nm) => { const r = await window.storage.get("scp:stato:v1", true); const st = JSON.parse(r.value);
  const mg = st.magazzini.find(m=>m.nome==="Linea Pizze"); const prod = st.prodotti.find(x=>x.nome===nm);
  const a = mg.articoli.find(x=>x.prodottoId===prod.id); return a.qty; }, artName);
console.log("targeting:", artName, "qty before:", before);
await scartoBtns.first().click();
await p.waitForTimeout(600);
// target qty input by its label
const qtyInput = p.locator('label:has-text("Quantità scartata") input');
await qtyInput.fill("1");
await p.waitForTimeout(150);
console.log("qty value after fill:", await qtyInput.inputValue());
await p.getByRole("button", { name: "Danneggiato", exact: true }).click().catch((e)=>console.log("reason fail", e.message));
await p.waitForTimeout(150);
await p.screenshot({ path: "scarto-1-form.png" });
await p.getByRole("button", { name: "Registra scarto", exact: true }).click().catch((e)=>console.log("save fail", e.message));
await p.waitForTimeout(1000);
const res = await p.evaluate(async (nm) => { const r = await window.storage.get("scp:stato:v1", true); const st = JSON.parse(r.value);
  const sc = (st.movimenti||[]).filter(m => m.causale === "scarto");
  const mg = st.magazzini.find(m=>m.nome==="Linea Pizze"); const prod = st.prodotti.find(x=>x.nome===nm);
  const a = mg.articoli.find(x=>x.prodottoId===prod.id);
  return { nScarti: sc.length, sample: sc[0]||null, qtyAfter: a.qty }; }, artName);
console.log("RESULT:", JSON.stringify(res));
ok(res.nScarti === 1, `lo scarto viene registrato una volta sola (${res.nScarti})`);
ok(res.sample?.causale === "scarto", "col suo motivo di movimento «scarto»");
ok(res.sample?.delta === -1, `e toglie davvero la quantita' scartata (${res.sample?.delta})`);
ok(res.qtyAfter === 4, `la giacenza scende da 5 a 4 (trovato ${res.qtyAfter})`);
// close the warehouse-detail modal via its Chiudi button
let closeBtns = p.locator('button[aria-label="Chiudi"]');
while (await closeBtns.count() > 0 && await closeBtns.first().isVisible()) { await closeBtns.first().click().catch(()=>{}); await p.waitForTimeout(400); }
/* «Analisi» sta sotto «Gestione» da gen-5.52: cercandola in barra questo
   collaudo non ci arrivava mai, e stampava «Sprechi recenti present: false»
   come se il pannello non ci fosse. Il pannello c'era: era la strada sbagliata. */
await vaiA(p, "Analisi");
ok(await p.getByText("Sprechi recenti").count() > 0,
  "in Analisi c'e' il pannello «Sprechi recenti»");
const tSpr = (await p.locator("body").innerText()).replace(/\s+/g, " ");
ok(new RegExp(artName).test(tSpr), `e dentro c'e' lo scarto appena registrato («${artName}»)`);
ok(/Danneggiato/.test(tSpr), "col motivo che era stato scritto");
await p.screenshot({ path: "scarto-2-analisi.png", fullPage: true });
console.log("pageerrors:", errs.length, errs.slice(0, 8));
await b.close();
ok(errs.length === 0, "nessun errore di pagina");
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
