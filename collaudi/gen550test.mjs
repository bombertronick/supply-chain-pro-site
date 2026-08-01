/* I tre lavori di gen-5.50.
   Il controllo che conta è l'ultimo: «Confermo tutto» e la conferma riga per
   riga devono lasciare il magazzino ESATTAMENTE nello stesso stato. Se un
   giorno le due strade divergono, questa prova lo dice subito. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

/* ── la scena: un laboratorio con 10 di PA, due linee che ne chiedono 3 e 8
      (undici: non ci stanno), una che chiede 4 di PB, e una che chiede un
      prodotto che in laboratorio non c'è proprio ── */
const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
const LAB = s.sedi.find((x) => x.tipo === "laboratorio");
const [FM, RM] = s.sedi.filter((x) => x.tipo === "operatore");
const magLab = s.magazzini.find((m) => m.tipo === "laboratorio");
const lineaFm = s.magazzini.find((m) => m.tipo === "linea-lab");
const [PA, PB, PC] = s.prodotti;

magLab.articoli = [
  { prodottoId: PA.id, uomId: PA.uomBase, qty: 10, par: 20 },
  { prodottoId: PB.id, uomId: PB.uomBase, qty: 10, par: 20 },
];
lineaFm.articoli = [PA, PB].map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 1, par: 6 }));
const lineaRm = { id: "mag-linea-rm", sedeId: RM.id, nome: "Linea Pizze rm", tipo: "linea-lab",
  articoli: [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 0, par: 10 }] };
s.magazzini.push(lineaRm);

const ric = (id, mag, sede, prod, qty) => ({
  id, t: Date.now() - 60000, daSedeId: sede.id, aSedeLabId: LAB.id,
  daMagazzinoId: mag.id, magNome: mag.nome, prodottoId: prod.id,
  qty, uomId: prod.uomBase, qtyLinea: qty, uomLineaId: prod.uomBase,
  stato: "in-attesa", creataDa: "Op",
});
s.richieste = [
  ric("ric-1", lineaFm, FM, PA, 3),   // ci sta
  ric("ric-2", lineaRm, RM, PA, 8),   // ne restano 7: parziale
  ric("ric-3", lineaFm, FM, PB, 4),   // ci sta
  ric("ric-4", lineaFm, FM, PC, 2),   // PC non è in nessun magazzino laboratorio
];

s.profili = [
  { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  { id: "pr-lab", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id, colore: "#8A63F4",
    magazziniIds: [magLab.id], pinHash: hash("3333") },
];

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin, dove, largo = 390) => {
  const ctx = await b.newContext({ viewport: { width: largo, height: 800 },
    isMobile: largo < 700, hasTouch: largo < 700, deviceScaleFactor: 2 });
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
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(URL); await p.waitForTimeout(1600);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
  await p.waitForTimeout(1600);
  if (dove) { await vai(p, dove); }
  return { p, ctx };
};
/* su un telefono il menù è la barra in basso, non la colonna laterale;
   e da gen-5.52 alcune voci stanno sotto «Gestione» */
const vai = (p, dove) => vaiA(p, dove);
const letto = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
/* la fotografia che conta: quanto c'è in ogni casella e come sono finite le
   richieste. Fuori restano orari e identificativi, che cambiano per forza. */
const foto = (st) => JSON.stringify({
  mag: st.magazzini.map((m) => [m.id, (m.articoli || []).map((a) => [a.prodottoId, a.uomId, a.qty])]),
  ric: st.richieste.map((r) => [r.id, r.stato, r.qtyEvasa ?? null, r.magazzinoLabNome ?? null, r.evasoDa ?? null]),
}, null, 1);

/* ═══════════ 1. IL DOPPIONE NEL CATALOGO ═══════════ */
console.log("\n— 1. il doppione nel Catalogo —");
{
  const { p } = await apri("Admin", "1234", "Catalogo");
  await p.getByText(/^Prodotti · /).first().click(); await p.waitForTimeout(900);
  const pastiglia = await p.getByRole("button", { name: /^Tutti · \d+$/ }).count();
  ok(pastiglia === 0, `via la fila di pastiglie che filtrava per categoria (${pastiglia} trovate)`);
  const gruppi = await p.locator("button[aria-expanded]").count();
  ok(gruppi > 0, `i gruppi per categoria sono rimasti, e fanno la stessa cosa (${gruppi})`);
  /* e la ricerca continua a funzionare: era l'altro modo per restringere */
  const campo = p.locator('input[aria-label="Cerca nel catalogo"]');
  await campo.fill(PA.nome.slice(0, 5)); await p.waitForTimeout(700);
  const righe = await p.locator('[aria-label^="Modifica"]').count();
  ok(righe > 0, `cercando «${PA.nome.slice(0, 5)}» si trova ancora (${righe} righe)`);
  await campo.fill(""); await p.waitForTimeout(400);
  await p.screenshot({ path: "g550-1-catalogo.png", fullPage: true });
}

/* ═══════════ 2. IL VALORE DENTRO IL MAGAZZINO ═══════════ */
console.log("\n— 2. il valore dentro ogni magazzino —");
{
  const { p } = await apri("Admin", "1234", "Magazzini");
  await p.getByText(magLab.nome, { exact: true }).first().click(); await p.waitForTimeout(1000);
  const senza = await p.locator("body").innerText();
  ok(!/€\s*0,00/.test(senza), "senza prezzi non compare un finto «€ 0,00»");
  await p.locator('[aria-label="Chiudi"]').last().click(); await p.waitForTimeout(700);

  /* metto un prezzo a PA e uno a PB, poi torno a guardare */
  await vai(p, "Catalogo");
  await p.getByText(/^Prodotti · /).first().click(); await p.waitForTimeout(900);
  await p.getByRole("button", { name: "Prezzi" }).first().click(); await p.waitForTimeout(900);
  const foglio = p.locator(".fixed.inset-0.z-50").last();
  await foglio.locator(`input[aria-label="Prezzo di ${PA.nome}"]`).fill("2,50");
  await foglio.locator(`input[aria-label="Prezzo di ${PB.nome}"]`).fill("1");
  await foglio.getByRole("button", { name: /Salva i prezzi/ }).click(); await p.waitForTimeout(1500);

  await vai(p, "Magazzini");
  await p.getByText(magLab.nome, { exact: true }).first().click(); await p.waitForTimeout(1100);
  const t = await p.locator("body").innerText();
  /* 10 × 2,50 + 10 × 1,00 = 35,00 */
  ok(/€\s*35,00/.test(t), "dentro il magazzino compare quanto vale la merce che c'è (€ 35,00)");
  await p.screenshot({ path: "g550-2-valore-magazzino.png", fullPage: true });
  await p.locator('[aria-label="Chiudi"]').last().click(); await p.waitForTimeout(700);

  /* e il costo di quello che si sta per ordinare */
  await vai(p, "Ordini");
  await p.getByText(/^Ricalcola$/).first().click(); await p.waitForTimeout(1600);
  const to = await p.locator("body").innerText();
  ok(/Questo ordine costa circa/.test(to), "in Ordini si legge quanto costa l'ordine da mandare");
  await p.screenshot({ path: "g550-3-costo-ordine.png", fullPage: true });
}

/* ═══════════ 3. IL LABORATORIO CONFERMA DAL TELEFONO ═══════════ */
console.log("\n— 3. il laboratorio conferma dal telefono —");

/* ── 3a. quello che si vede, su un telefono ── */
const A = await apri("Lab", "3333", "Richieste");
{
  const t = await A.p.locator("body").innerText();
  ok(/Confermo tutto · 3 richieste/.test(t),
    "in cima c'è «Confermo tutto», e conta 3: la quarta non si può evadere");
  ok(/1 non si può/.test(t), "e dice apertamente quante restano fuori");
  ok(/Non si può confermare al volo/.test(t), `la riga di «${PC.nome}» spiega perché è ferma`);
  const conf = await A.p.getByRole("button", { name: /^Conferma \d/ }).count();
  ok(conf === 3, `tre righe hanno il tasto per confermare senza aprire niente (${conf})`);
  /* la proposta di ogni riga guarda quello che c'è ADESSO: da sola, la
     richiesta da 8 si può servire tutta, perché in laboratorio ce ne sono 10 */
  ok(await A.p.getByRole("button", { name: /^Conferma 8\b/ }).count() === 1,
    "presa da sola, la richiesta da 8 si può servire tutta: il tasto dice 8");
  /* ma «Confermo tutto» ne conta 3 e sa che, dopo i 3 della prima, per la
     seconda ne restano 7: il numero in cima non promette più del vero */
  ok(/Confermo tutto · 3 richieste/.test(t), "e in blocco restano 3, senza promettere di più");
  await A.p.screenshot({ path: "g550-4-richieste-lab.png", fullPage: true });
}

/* ── 3b. la strada lunga: riga per riga ── */
await A.p.getByRole("button", { name: /^Conferma 3\b/ }).first().click();
await A.p.waitForTimeout(1400);
{
  /* servita la prima, la seconda si aggiorna da sola: ora ne restano 7 */
  const t = (await A.p.locator("body").innerText()).replace(/\s+/g, " ");
  ok(/In laboratorio ce ne sono 7 .{0,12} su 8/.test(t),
    "confermata la prima, la riga da 8 avvisa che ora ne restano 7");
  ok(await A.p.getByRole("button", { name: /^Conferma 7\b/ }).count() === 1,
    "e il suo tasto si corregge da solo a 7");
}
for (let i = 0; i < 2; i++) {
  await A.p.getByRole("button", { name: /^Conferma \d/ }).first().click();
  await A.p.waitForTimeout(1400);
}
const dopoRighe = await letto(A.p);
{
  const t = await A.p.locator("body").innerText();
  ok(!/Confermo tutto/.test(t), "confermate tutte, la barra in cima sparisce");
  const a = magLab.articoli.length && dopoRighe.magazzini.find((m) => m.id === magLab.id);
  const qPA = a.articoli.find((x) => x.prodottoId === PA.id).qty;
  const qPB = a.articoli.find((x) => x.prodottoId === PB.id).qty;
  ok(qPA === 0, `il laboratorio è a zero di «${PA.nome}»: 3 + 7, non 3 + 8 (${qPA})`);
  ok(qPB === 6, `e a 6 di «${PB.nome}» (${qPB})`);
  const r2 = dopoRighe.richieste.find((r) => r.id === "ric-2");
  ok(r2.stato === "parziale", `la richiesta da 8 risulta parziale (${r2.stato})`);
  const r4 = dopoRighe.richieste.find((r) => r.id === "ric-4");
  ok(r4.stato === "in-attesa", "e quella che non si poteva evadere è rimasta in attesa");
  const lrm = dopoRighe.magazzini.find((m) => m.id === lineaRm.id).articoli[0].qty;
  ok(lrm === 7, `la linea che aveva chiesto 8 si è caricata di 7 (${lrm})`);
}
await A.ctx.close();

/* ── 3c. la strada corta: «Confermo tutto». Deve finire identica ── */
const B = await apri("Lab", "3333", "Richieste");
await B.p.locator("button", { hasText: "Confermo tutto" }).first().click();
await B.p.waitForTimeout(700);
{
  const t = await B.p.locator("body").innerText();
  ok(/Confermare 3 richieste\?/.test(t), "la conferma chiede il permesso, dicendo quante sono");
  ok(/Le 1 che non si possono evadere restano in attesa|1 che non si poss/.test(t),
    "e ricorda che la quarta resta lì");
  await B.p.screenshot({ path: "g550-5-conferma-tutto.png", fullPage: true });
}
await B.p.getByRole("button", { name: /^Conferma 3$/ }).click();
await B.p.waitForTimeout(1800);
const dopoTutto = await letto(B.p);

ok(foto(dopoTutto) === foto(dopoRighe),
  "«Confermo tutto» lascia magazzini e richieste ESATTAMENTE come la conferma riga per riga");
if (foto(dopoTutto) !== foto(dopoRighe)) {
  console.log("  ── riga per riga ──\n" + foto(dopoRighe));
  console.log("  ── tutto insieme ──\n" + foto(dopoTutto));
}
{
  const t = await B.p.locator("body").innerText();
  ok(!/Confermo tutto/.test(t), "e anche qui la barra sparisce quando non resta niente da fare");
  ok((dopoTutto.log || []).some((e) => /3 richieste confermate/.test(e.msg || "")),
    "lo storico registra il gesto in blocco, quindi si può riportare tutto com'era");
}
await B.p.screenshot({ path: "g550-6-dopo.png", fullPage: true });
await B.ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
