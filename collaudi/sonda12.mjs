import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 6);
const pn = (n) => { const p = base.prodotti.find((x) => x.nome === n); return linea.articoli.find((x) => x.prodottoId === p.id); };
const moz = pn("Mozzarella no lattosio"), sal = pn("Salsiccia"), bro = pn("Broccoletti");
FM.cassaMagId = linea.id;
const ing = (a, q) => ({ prodottoId: a.prodottoId, qty: q, uomId: a.uomId });
base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6.5, attivo: true, varianti: [], distinta: [ing(moz, 1)] },
  { id: "li-bos", nome: "Boscaiola", gruppo: "Pizze", prezzo: 9, attivo: true, dentro: "mozzarella, funghi, salsiccia", varianti: [], distinta: [ing(moz, 1)] },
  { id: "li-pan", nome: "Panino", gruppo: "Mangiare", prezzo: 8, attivo: true, varianti: [{ id: "va-maxi", nome: "Maxi", delta: 1.5 }], distinta: [] },
  { id: "li-spr", nome: "Spritz", gruppo: "Bere", prezzo: 5, attivo: true, varianti: [], distinta: [] },
  { id: "li-acq", nome: "Acqua", prezzo: 1, attivo: true, varianti: [], distinta: [] },
];
base.aggiunte = [{ id: "ag-bro", nome: "Broccoletti", prezzo: 1.5, attivo: true, gruppi: ["Pizze"], distinta: [ing(bro, 1)] },
  { id: "ag-sal", nome: "Salsiccia", prezzo: 2, attivo: true, gruppi: ["Pizze"], distinta: [ing(sal, 1)] }];
base.vendite = [];
base.profili = [{ id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6", magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") }];
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(([j]) => {
  localStorage.setItem("scp:tour:v1", "1"); localStorage.setItem("db:scp:stato:v1", j);
  window.storage = { async get(k){const v=localStorage.getItem("db:"+k);return v==null?null:{value:v};}, async set(k,v){localStorage.setItem("db:"+k,v);return true;}, async delete(k){localStorage.removeItem("db:"+k);return true;} };
}, [JSON.stringify(base)]);
const p = await ctx.newPage();
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("OpCassa", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click().catch(()=>{}); await p.waitForTimeout(130); }
await p.waitForTimeout(1500);
await vaiA(p, "Cassa");
for (const v of ["Aggiungi Margherita", "Aggiungi Spritz", "Aggiungi Acqua", "Aggiungi Panino"]) {
  await p.getByRole("button", { name: v, exact: true }).click(); await p.waitForTimeout(250);
  if (v === "Aggiungi Panino") { await p.getByRole("button", { name: "Così com'è · € 8,00", exact: true }).click(); await p.waitForTimeout(350); }
}
await p.getByRole("button", { name: "Aggiungi Boscaiola", exact: true }).click(); await p.waitForTimeout(300);
await p.getByRole("button", { name: "Metti Salsiccia su Boscaiola", exact: true }).click(); await p.waitForTimeout(450);
await p.evaluate(() => { const m = document.querySelector("main"); if (m) m.scrollTop = m.scrollHeight; });
await p.waitForTimeout(400);
const m = await p.evaluate(() => { const x = document.querySelector("main"); return { sh: x.scrollHeight, ch: x.clientHeight, top: x.scrollTop, pb: getComputedStyle(x).paddingBottom }; });
const bi = await p.getByRole("button", { name: "Incassa", exact: true }).boundingBox();
const bf = await p.locator('[data-fascia="1"]').boundingBox();
console.log("main", JSON.stringify(m));
console.log("Incassa finisce a", bi && Math.round(bi.y + bi.height), "· la fascia comincia a", bf && Math.round(bf.y),
  "→", (bi && bf && bi.y + bi.height <= bf.y + 1) ? "LIBERO" : "COPERTO");
await b.close();
