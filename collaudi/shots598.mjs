/* Fotografie di gen-5.98 per la revisione «veste professionale» (01/09):
   schermate vere, dati realistici, telefono 390x844. Non e' un collaudo:
   e' il materiale su cui il gruppo di critici lavora. */
import { chromium } from "playwright";
import { readFileSync, existsSync, mkdirSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const OUT = "/tmp/shots598"; mkdirSync(OUT, { recursive: true });

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
const artA = linea.articoli[0], artB = linea.articoli[1];
artA.qty = 10; artB.qty = 6;
FM.cassaMagId = linea.id;
base.listino = [
  { id: "li-fri", nome: "Fritto misto", gruppo: "Fritti", prezzo: 7, aliquota: 10, attivo: true, varianti: [],
    distinta: [{ prodottoId: artA.prodottoId, qty: 0.5, uomId: artA.uomId }] },
  { id: "li-sup", nome: "Supplì", gruppo: "Fritti", prezzo: 2, aliquota: 10, attivo: true, varianti: [], distinta: [] },
  { id: "li-piz", nome: "Margherita", gruppo: "Pizze", prezzo: 6.5, aliquota: 10, attivo: true,
    varianti: [{ id: "va-maxi", nome: "Maxi", delta: 2 }],
    distinta: [{ prodottoId: artB.prodottoId, qty: 1, uomId: artB.uomId }] },
  { id: "li-dia", nome: "Diavola", gruppo: "Pizze", prezzo: 7.5, aliquota: 10, attivo: true, varianti: [], distinta: [] },
  { id: "li-dol", nome: "Tiramisù", gruppo: "Dolci", prezzo: 4, aliquota: 10, attivo: true, varianti: [], distinta: [] },
  { id: "li-acq", nome: "Acqua", gruppo: "", prezzo: 1, attivo: true, varianti: [], distinta: [] },
];
base.postazioni = [
  { id: "po-fri", nome: "Friggitoria", sedeId: "", gruppi: ["Fritti", "Dolci"] },
  { id: "po-piz", nome: "Pizzeria", sedeId: "", gruppi: ["Pizze"] },
];
/* vendite di stamattina: una coda viva per la Cassa e le Comande */
const giornoDi = (t) => { const d = new Date(t);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const adesso = Date.now();
const vend = (min, n, righe, totale, extra) => ({
  id: "vn-" + n, t: adesso - min * 60000, giorno: giornoDi(adesso - min * 60000), sedeId: FM.id,
  chi: "Sara", n, righe, totale, metodo: "contanti", scarico: [], stato: "registrata", ...extra });
base.vendite = [
  vend(2, 4, [{ voceId: "li-piz", nome: "Margherita", qty: 2, prezzo: 6.5, aliquota: 10, gruppo: "Pizze" },
              { voceId: "li-acq", nome: "Acqua", qty: 2, prezzo: 1, gruppo: "Altro" }], 15),
  vend(7, 3, [{ voceId: "li-fri", nome: "Fritto misto", qty: 1, prezzo: 7, aliquota: 10, gruppo: "Fritti" },
              { voceId: "li-dol", nome: "Tiramisù", qty: 1, prezzo: 4, aliquota: 10, gruppo: "Dolci" }], 11),
  vend(12, 2, [{ voceId: "li-sup", nome: "Supplì", qty: 4, prezzo: 2, aliquota: 10, gruppo: "Fritti" }], 8,
    { fatte: { Fritti: { t: adesso - 9 * 60000, chi: "Marco" } } }),
  vend(19, 1, [{ voceId: "li-piz", nome: "Margherita + Maxi", qty: 1, prezzo: 8.5, aliquota: 10, gruppo: "Pizze" }], 8.5),
];
base.giornate = [{ id: giornoDi(adesso) + "|" + FM.id, giorno: giornoDi(adesso), sedeId: FM.id,
  totale: 42.5, nVendite: 4, nStorni: 0, metodi: { contanti: 34, carta: 8.5, altro: 0 } }];

const PR = [
  { id: "pr-a", nome: "Valerio", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  { id: "pr-s", nome: "Sara", ruolo: "operatore", sedeId: FM.id, colore: "#E8A13C",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") },
  { id: "pr-m", nome: "Marco", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], pinHash: hash("3333") },
  { id: "pr-g", nome: "Gigi", ruolo: "laboratorio", sedeId: base.sedi.find((x) => x.tipo === "laboratorio")?.id,
    colore: "#22B8CF", pinHash: hash("1111") },
];
base.profili = PR;

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const apri = async (nome, pin) => {
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
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1600);
  await p.screenshot({ path: `${OUT}/00-login.png`, fullPage: false });
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1600);
  return { p, ctx };
};
const shot = async (p, nome) => { await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/${nome}.png`, fullPage: true }); console.log(nome); };

/* ── ADMIN (Valerio) ── */
const A = await apri("Valerio", "1234");
await shot(A.p, "01-admin-home");
await vaiA(A.p, "Magazzini"); await shot(A.p, "02-admin-magazzini");
await A.p.locator(".sc-scheda, [class*=rounded]").first();
await vaiA(A.p, "Plancia"); await shot(A.p, "03-admin-plancia");
await vaiA(A.p, "Ordini"); await shot(A.p, "04-admin-ordini");
await vaiA(A.p, "Gestione"); await shot(A.p, "05-admin-gestione");
await A.p.getByText("Listino", { exact: true }).first().click(); await A.p.waitForTimeout(900);
await shot(A.p, "06-admin-listino-postazioni");
await A.p.getByText("Catalogo", { exact: true }).first().click().catch(() => {});
await A.p.waitForTimeout(900); await shot(A.p, "07-admin-catalogo");
await vaiA(A.p, "Gestione");
await A.p.getByText("Analisi", { exact: true }).first().click(); await A.p.waitForTimeout(1200);
await shot(A.p, "08-admin-analisi");
await A.ctx.close();

/* ── CASSA (Sara) ── */
const S = await apri("Sara", "2222");
await vaiA(S.p, "Cassa"); await shot(S.p, "09-cassa-griglia");
await S.p.getByRole("button", { name: "Aggiungi Fritto misto" }).click(); await S.p.waitForTimeout(250);
await S.p.getByRole("button", { name: "Aggiungi Tiramisù" }).click(); await S.p.waitForTimeout(350);
await shot(S.p, "10-cassa-carrello");
await S.p.getByRole("button", { name: "Incassa", exact: true }).click(); await S.p.waitForTimeout(700);
await shot(S.p, "11-cassa-incasso");
await S.p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
await S.p.waitForTimeout(400);
await S.p.getByRole("button", { name: "Report di giornata" }).click().catch(() => {});
await S.p.waitForTimeout(700); await shot(S.p, "12-cassa-report");
await S.ctx.close();

/* ── COMANDE (Marco, cucina) ── */
const M = await apri("Marco", "3333");
await vaiA(M.p, "Comande"); await shot(M.p, "13-comande-sedie");
await M.p.getByRole("button", { name: "Siediti a Friggitoria" }).click(); await M.p.waitForTimeout(500);
await shot(M.p, "14-comande-friggitoria");
await vaiA(M.p, "Conteggi"); await shot(M.p, "15-op-conteggi");
await vaiA(M.p, "Home"); await shot(M.p, "16-op-home");
await M.ctx.close();

/* ── LABORATORIO (Gigi) ── */
const G = await apri("Gigi", "1111");
await shot(G.p, "17-lab-home");
await vaiA(G.p, "Richieste").catch(() => {});
await shot(G.p, "18-lab-richieste");
await G.ctx.close();

await b.close();
console.log("fatte: " + OUT);
