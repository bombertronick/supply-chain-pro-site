import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
// find a retro magazzino with an article
const retro = st.magazzini.find(m => m.tipo === "retro" && m.articoli.length);
const art0 = retro.articoli[0];
art0.qty = 2; // starting stock
const forn = st.fornitori[0];
st.ordini = st.ordini || [];
st.ordini.unshift({ id: "ord-test", t: 1784240000000, tipo: "diretto", sedeId: retro.sedeId,
  prodottoId: art0.prodottoId, fornitoreId: forn.id, qty: 10, uomId: art0.uomId, stato: "ordinato", ordinatoDa: "Admin", tOrdine: 1784240000000 });
const prodNome = (st.prodotti.find(p => p.id === art0.prodottoId) || {}).nome;
const state = JSON.stringify(st);

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
console.log("targeting order:", prodNome, "qty ordered 10, retro start 2");
const ord = p.getByText("Ordini", { exact: true });
for (let i = 0; i < await ord.count(); i++) { if (await ord.nth(i).isVisible()) { await ord.nth(i).click(); break; } }
await p.waitForTimeout(700);
// go to Ordinati tab
await p.getByText(/Ordinati ·/).first().click().catch(async()=>{ await p.getByText("Ordinati", {exact:false}).first().click(); });
await p.waitForTimeout(500);
await p.locator('button[aria-label="Registra la merce arrivata"]').first().click();
await p.waitForTimeout(500);
console.log("form present:", await p.getByText("Ricezione merce").count() > 0);
// set received to 4 (partial)
const dlg = p.locator(".sc-su");
await dlg.getByPlaceholder("0").first().fill("4");
await p.waitForTimeout(200);
await p.screenshot({ path: "recv-1-form.png" });
await p.getByRole("button", { name: /Registra ricezione/ }).click();
await p.waitForTimeout(900);
const res = await p.evaluate(async (pid) => {
  const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value);
  const retro = s.magazzini.find(m => m.tipo === "retro" && m.articoli.some(a=>a.prodottoId===pid));
  const a = retro.articoli.find(a=>a.prodottoId===pid);
  const ordTest = s.ordini.find(o=>o.id==="ord-test");
  const residuo = s.ordini.find(o=>o.stato==="da-ordinare" && o.prodottoId===pid && o.nota==="residuo non consegnato");
  return { retro_qty: a.qty, ord_stato: ordTest?.stato, ord_ricevuta: ordTest?.qtyRicevuta, residuo_qty: residuo?.qty || null };
}, art0.prodottoId);
console.log("RESULT:", JSON.stringify(res));
ok(res.retro_qty === 6, `il retro si carica di quanto e' ARRIVATO: da 2 a 6 (trovato ${res.retro_qty})`);
ok(res.ord_stato === "ricevuto", "la riga d'ordine risulta ricevuta");
ok(res.ord_ricevuta === 4, `con segnata la quantita' reale, 4 (trovato ${res.ord_ricevuta})`);
ok(res.residuo_qty === 6, `e le 6 che mancano tornano da ordinare (trovato ${res.residuo_qty})`);
console.log("pageerrors:", errs.length, errs.slice(0,6));
await b.close();
ok(errs.length === 0, "nessun errore di pagina");
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
