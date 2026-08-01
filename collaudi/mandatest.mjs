import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
const sedi = s.sedi.filter((x) => x.tipo === "operatore");
const FM = sedi[0], RM = sedi[1];
const P1 = s.prodotti[0], P2 = s.prodotti[1], P3 = s.prodotti[2];
const F1 = s.fornitori[0], F2 = s.fornitori[1] || s.fornitori[0];
s.profili = [
  { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  { id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: FM.id, colore: "#E8A13C",
    magazziniIds: [], pinHash: hash("2222") },
];
/* due richieste al laboratorio da Fm, una da Rm; e tre righe da ordinare */
s.richieste = [
  { id: "r1", t: Date.now(), daSedeId: FM.id, prodottoId: P1.id, qty: 4, uomId: P1.uomBase, stato: "in-attesa" },
  { id: "r2", t: Date.now(), daSedeId: FM.id, prodottoId: P2.id, qty: 2, uomId: P2.uomBase, stato: "in-attesa" },
  { id: "r3", t: Date.now(), daSedeId: RM.id, prodottoId: P1.id, qty: 7, uomId: P1.uomBase, stato: "in-attesa" },
  { id: "r4", t: Date.now(), daSedeId: FM.id, prodottoId: P3.id, qty: 9, uomId: P3.uomBase, stato: "evasa" },
  { id: "r5", t: Date.now(), tEvasione: Date.now(), daSedeId: FM.id, prodottoId: P2.id, qty: 8,
    qtyEvasa: 5, uomId: P2.uomBase, stato: "parziale", magNome: "Linea fm" },
  { id: "r6", t: Date.now() - 30 * 86400000, tEvasione: Date.now() - 30 * 86400000, daSedeId: FM.id,
    prodottoId: P1.id, qty: 3, uomId: P1.uomBase, stato: "evasa", magNome: "Linea fm" },
];
s.richieste[0].magNome = "Linea fm"; s.richieste[1].magNome = "Linea fm";
s.richieste[2].magNome = "Linea rm"; s.richieste[3].magNome = "Linea fm";
s.richieste[3].tEvasione = Date.now();
s.ordini = [
  { id: "o1", t: Date.now(), tipo: "diretto", sedeId: FM.id, prodottoId: P3.id, fornitoreId: F1.id,
    qty: 24, uomId: P3.uomBase, stato: "da-ordinare" },
  { id: "o2", t: Date.now(), tipo: "diretto", sedeId: RM.id, prodottoId: P2.id, fornitoreId: F2.id,
    qty: 3, uomId: P2.uomBase, stato: "da-ordinare" },
  { id: "o3", t: Date.now(), tipo: "diretto", sedeId: FM.id, prodottoId: P1.id, fornitoreId: F1.id,
    qty: 5, uomId: P1.uomBase, stato: "ordinato" },
];

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin) => {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 },
    permissions: ["clipboard-read", "clipboard-write"] });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j);
    localStorage.setItem("scp:tour:v1", "1");
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(s));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(1600);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
  await p.waitForTimeout(1600);
  await p.getByText("Ordini", { exact: true }).first().click(); await p.waitForTimeout(1300);
  return { p, ctx };
};

/* ── ADMIN: vede tutte le sedi ── */
const A = await apri("Admin", "1234");
let t = await A.p.locator("body").innerText();
ok(/Da mandare adesso/.test(t), "in Ordini c'è il riquadro «Da mandare adesso»");
ok(t.includes(FM.nome) && t.includes(RM.nome), "un blocco per ogni sede: " + FM.nome + " e " + RM.nome);
ok(/3 righe/.test(t), "conta le righe di Fm: 2 al laboratorio + 1 al fornitore");
ok(/2 righe/.test(t), "e quelle di Rm: 1 + 1");

/* il testo vero */
await A.p.getByText("Vedi il testo", { exact: true }).first().click();
await A.p.waitForTimeout(600);
const testo = await A.p.locator("textarea").first().inputValue();
console.log("   ── testo generato ──\n" + testo.split("\n").map((r) => "   " + r).join("\n"));
ok(testo.startsWith(FM.nome.toUpperCase()), "comincia con il nome della sede in maiuscolo");
ok(/AL LABORATORIO/.test(testo), "ha la sezione del laboratorio");
ok(testo.includes(F1.nome.toUpperCase()), "e la sezione del fornitore «" + F1.nome + "»");
ok(testo.includes("- " + P1.nome + ": 4"), "riga leggibile: «- " + P1.nome + ": 4 …»");
ok(!testo.includes(P3.nome + ": 9"), "la richiesta già evasa non finisce nel messaggio");
ok(!/\t|\|/.test(testo), "niente tabulazioni o barre: è testo da telefono");
ok(!testo.includes(RM.nome.toUpperCase()), "il blocco di Fm contiene solo Fm");

/* copia negli appunti */
await A.p.getByRole("button", { name: "Copia", exact: true }).first().click();
await A.p.waitForTimeout(700);
const appunti = await A.p.evaluate(() => navigator.clipboard.readText());
ok(appunti === testo, "il tasto «Copia» mette negli appunti esattamente quel testo");
ok(/Copiato/.test(await A.p.locator("body").innerText()), "e lo conferma a schermo");
await A.p.screenshot({ path: "manda-1-admin.png", fullPage: true });

/* whatsapp: intercetto window.open, che in headless non aprirebbe niente */
await A.p.evaluate(() => { window.__wa = []; window.open = (u) => { window.__wa.push(u); return null; }; });
await A.p.getByRole("button", { name: "WhatsApp", exact: true }).first().click();
await A.p.waitForTimeout(500);
const aperti = await A.p.evaluate(() => window.__wa);
ok(aperti.length === 1 && /^https:\/\/wa\.me\/\?text=/.test(aperti[0]), "«WhatsApp» apre wa.me · " + (aperti[0] || "-").slice(0, 40));
ok(aperti[0] && decodeURIComponent(aperti[0].split("text=")[1]).includes("AL LABORATORIO"),
  "e nel link c'è davvero il testo della sede");
await A.ctx.close();

/* ── OPERATORE: solo la sua sede ── */
const O = await apri("Op", "2222");
const to = await O.p.locator("body").innerText();
ok(/Da mandare adesso/.test(to), "anche l'operatore ce l'ha");
ok(to.includes(FM.nome) && !to.includes(RM.nome), "ma vede solo la propria sede");
ok(!/Copia tutto/.test(to), "e non gli compare «Copia tutto», che avrebbe una sede sola");
await O.p.screenshot({ path: "manda-2-operatore.png", fullPage: true });
await O.ctx.close();

/* ── ORDINI: la scheda del laboratorio ── */
const L = await apri("Admin", "1234");
const tl = await L.p.locator("body").innerText();
ok(/Al laboratorio · 3/.test(tl), "il segmento «Al laboratorio» conta le 3 richieste in attesa");
await L.p.getByText(/^Al laboratorio/).first().click(); await L.p.waitForTimeout(900);
const c = await L.p.locator("body").innerText();
ok(c.includes(FM.nome) && c.includes(RM.nome), "raggruppate per sede di provenienza");
ok(/2 in attesa/.test(c), "Fm ha 2 richieste ancora in attesa");
ok(/in attesa/.test(c), "le righe non ancora evase lo dicono");
ok(/confermati 5 di 8/.test(c), "l'evasione parziale mostra quanto ha confermato il laboratorio");
ok(/confermati 9/.test(c), "e quella completa mostra la quantità confermata");
ok(!c.includes("- " + P1.nome + ": 3"), "una richiesta chiusa un mese fa non ingombra più l'elenco");
ok(/Linea fm/.test(c), "si legge da quale magazzino è partita");
await L.p.screenshot({ path: "manda-3-laboratorio.png", fullPage: true });
await L.ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
