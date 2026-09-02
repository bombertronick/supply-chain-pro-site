/* SONDA: quanto schermo si mangia la fascia degli ingredienti sempre aperta.
   Non e' un collaudo, e' un metro. Valerio ha segnalato che la barra resta
   aperta; prima di ripararla voglio il numero vero, non un'impressione, e
   dopo la riparazione voglio poter dire di quanto e' migliorato.
   Si lancia a mano: node sonda-fascia.mjs */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 6);
const perNome = (n) => {
  const p = base.prodotti.find((x) => x.nome === n);
  return (linea.articoli || []).find((x) => x.prodottoId === p?.id);
};
const moz = perNome("Mozzarella no lattosio"), sal = perNome("Salsiccia"), bro = perNome("Broccoletti");
for (const a of [moz, sal, bro]) a.qty = 10;
FM.cassaMagId = linea.id;
const ing = (art, qty) => ({ prodottoId: art.prodottoId, qty, uomId: art.uomId });
base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6.5, aliquota: 10, attivo: true, varianti: [], distinta: [ing(moz, 1)] },
  { id: "li-acq", nome: "Acqua", gruppo: "Bere", prezzo: 1, attivo: true, varianti: [], distinta: [] },
];
base.aggiunte = [
  { id: "ag-bro", nome: "Broccoletti", prezzo: 1.5, attivo: true, gruppi: ["Pizze"], distinta: [ing(bro, 1)] },
  { id: "ag-sal", nome: "Salsiccia", prezzo: 2, attivo: true, gruppi: ["Pizze"], distinta: [ing(sal, 1)] },
];
base.postazioni = []; base.vendite = [];
/* NON l'admin: l'admin la Cassa non ce l'ha in barra, la raggiunge da Home o
   dalla lente. Chi sta al banco e' un operatore con l'interruttore cassa, ed
   e' il suo schermo quello che conta misurare. */
base.profili = [{ id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") }];

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(([j]) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  localStorage.setItem("db:scp:stato:v1", j);
  window.storage = {
    async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
    async delete(k) { localStorage.removeItem("db:" + k); return true; },
  };
}, [JSON.stringify(base)]);
const p = await ctx.newPage();
await p.goto("file://" + path.resolve("index.html"));
await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
await p.waitForTimeout(600);
await p.getByText("OpCassa", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
await p.waitForTimeout(1200);
/* la stessa navigazione dei collaudi veri: la barra non e' fatta di bottoni
   che si trovano per nome a occhio */
await vaiA(p, "Cassa");
await p.waitForTimeout(900);
/* «Incassa» e «Il conto» a conto VUOTO non ci sono: cercarli faceva dare
   l'allarme a una misura giusta. Si guarda una cella del listino, che in
   Cassa c'e' sempre. */
const inCassa = (await p.getByRole("button", { name: "Aggiungi Margherita", exact: true }).count()) > 0;
console.log("  sono davvero in Cassa:   " + (inCassa ? "si" : "NO — la misura sotto non vale niente"));

console.log("\n— quanto costa la fascia sempre aperta, su 390x844 —");
const fascia = await p.locator('[data-fascia="1"]').first().boundingBox().catch(() => null);
const spaziatore = await p.evaluate(() => {
  const d = [...document.querySelectorAll('div[aria-hidden="true"]')]
    .find((x) => (x.style.height || "").includes("rem") && !x.textContent.trim());
  return d ? d.getBoundingClientRect().height : null;
});
const schermo = await p.evaluate(() => window.innerHeight);
console.log("  schermo alto:            " + schermo + " px");
console.log("  la fascia e' visibile:   " + (fascia ? "SI, senza che nessuno l'abbia chiesta" : "no"));
if (fascia) console.log("  la fascia occupa:        " + Math.round(fascia.height) + " px (da " + Math.round(fascia.y) + " a " + Math.round(fascia.y + fascia.height) + ")");
console.log("  lo spaziatore occupa:    " + (spaziatore == null ? "non trovato" : Math.round(spaziatore) + " px"));
const costo = (fascia ? fascia.height : 0) + (spaziatore || 0);
console.log("  COSTO TOTALE:            " + Math.round(costo) + " px, cioe' il " + Math.round(costo / schermo * 100) + "% dello schermo");
console.log("                           (a conto vuoto, quando non serve a niente)\n");
await ctx.close(); await b.close();
