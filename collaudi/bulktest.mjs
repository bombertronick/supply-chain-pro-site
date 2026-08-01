import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));

// pick a retro magazzino with >=2 articles
const retro = st.magazzini.find((m) => m.tipo === "retro" && m.articoli.length >= 2)
  || st.magazzini.find((m) => m.tipo === "retro" && m.articoli.length);
const arts = retro.articoli.slice(0, 2);
arts.forEach((a) => (a.qty = 1)); // low start
const forn = st.fornitori[0];
st.ordini = [];
arts.forEach((a, i) => st.ordini.push({
  id: "ord-b" + i, t: 1784240000000, tipo: "diretto", sedeId: retro.sedeId,
  prodottoId: a.prodottoId, fornitoreId: forn.id, qty: 5, uomId: a.uomId,
  stato: "ordinato", ordinatoDa: "Admin", tOrdine: 1784240000000,
}));
const startQ = arts.map((a) => a.qty);
const state = JSON.stringify(st);

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
const errs = [];
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
/* «scp:tour:v1» spegne la panoramica guidata del primo accesso. Senza, il
   tutorial si apre sopra a tutto e la barra in basso non e' piu' cliccabile:
   il collaudo restava fermo su una schermata che nessuno gli aveva chiesto. */
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, state);
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);

await vaiA(p, "Ordini");
await p.waitForTimeout(600);
await p.getByText(/Ordinati ·/).first().click().catch(() => {});
await p.waitForTimeout(500);
const btn = p.getByRole("button", { name: /Tutto arrivato/ });
console.log("Tutto arrivato present:", await btn.count() > 0);
await btn.first().click();
await p.waitForTimeout(900);

const res = await p.evaluate(async ({ magId, pids, startQ }) => {
  const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value);
  const mg = s.magazzini.find((m) => m.id === magId);
  const q = pids.map((pid) => mg.articoli.find((a) => a.prodottoId === pid).qty);
  const ords = s.ordini.filter((o) => o.id.startsWith("ord-b"));
  return { q, startQ, ord_stati: ords.map((o) => o.stato), ord_ricevute: ords.map((o) => o.qtyRicevuta) };
}, { magId: retro.id, pids: arts.map((a) => a.prodottoId), startQ });
/* Prima questo file stampava il risultato e usciva col verde comunque fosse
   andata: era una sonda, non un collaudo. I numeri li calcolava gia' giusti —
   mancava solo qualcuno che dicesse se erano quelli attesi. */
console.log("RESULT:", JSON.stringify(res));
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
ok(res.q.every((v, i) => v > res.startQ[i]),
  `«Tutto arrivato» carica davvero la merce nel retro (da ${res.startQ} a ${res.q})`);
ok(res.ord_stati.every((x) => x === "ricevuto"),
  "e chiude tutte le righe d'ordine come ricevute");
ok(res.ord_ricevute.every((x) => typeof x === "number" && x > 0),
  `segnando quanto e' arrivato davvero (${res.ord_ricevute})`);
ok(errs.length === 0, "senza errori di pagina");
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
