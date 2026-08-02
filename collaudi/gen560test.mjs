/* gen-5.60: i preparati non hanno un fornitore.

   La prova che conta non è che la spunta si veda: è che dopo la spunta
   NESSUNA strada dell'app produca più una riga d'ordine a un fornitore per
   quel prodotto. Le strade sono tre e le provo tutte e tre:
     1. il retro sotto scorta            → richiesta al laboratorio, non ordine
     2. il laboratorio sotto scorta      → niente riga, compare in «Da preparare»
     3. il conteggio di linea col retro  → richiesta, non ordine
   In più: una riga d'ordine rimasta da PRIMA della spunta deve sparire, e una
   richiesta già in attesa non deve essere duplicata (arriverebbe il doppio). */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const LAB = base.sedi.find((x) => x.tipo === "laboratorio");
const [FM] = base.sedi.filter((x) => x.tipo === "operatore");
const [PA, PB] = base.prodotti;          // PA = preparato, PB = comprato
const F1 = base.fornitori[0];
const UPZ = base.unita.find((u) => u.simbolo === "pz").id;

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin, seme, dove) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(seme));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(URL); await p.waitForTimeout(1600);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
  await p.waitForTimeout(1600);
  if (dove) await vaiA(p, dove);
  return { p, ctx };
};
const letto = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const testo = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");

/* la scena: un retro e un laboratorio, entrambi sotto scorta su due prodotti —
   PA che si prepara, PB che si compra. Così ogni controllo ha il suo testimone:
   se sparisse tutto invece che solo il preparato, PB lo direbbe. */
const scena = (preparato) => {
  const s = JSON.parse(JSON.stringify(base));
  s.prodotti = s.prodotti.slice(0, 2).map((p, i) => ({
    ...p, uomBase: UPZ, fornitoreId: F1.id, categoriaId: s.categorie[0].id,
    ...(i === 0 && preparato ? { preparato: true } : {}),
  }));
  const retro = { id: "mag-retro-fm", sedeId: FM.id, nome: "Secco fm", tipo: "retro", articoli: [
    { prodottoId: PA.id, uomId: UPZ, qty: 1, par: 6 },
    { prodottoId: PB.id, uomId: UPZ, qty: 1, par: 5 },
  ] };
  const labMag = { id: "mag-lab", sedeId: LAB.id, nome: "Magazzino centrale", tipo: "laboratorio", articoli: [
    { prodottoId: PA.id, uomId: UPZ, qty: 2, par: 9 },
    { prodottoId: PB.id, uomId: UPZ, qty: 2, par: 7 },
  ] };
  const linea = { id: "mag-linea", sedeId: FM.id, nome: "Linea secco fm", tipo: "linea-retro",
    rifMagazzinoId: retro.id, articoli: [{ prodottoId: PA.id, uomId: UPZ, qty: 0, par: 3 }] };
  s.magazzini = [retro, labMag, linea];
  s.ordini = []; s.richieste = []; s.movimenti = []; s.log = []; s.codici = []; s.accessi = [];
  s.profili = [
    { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
    { id: "pr-lab", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id, colore: "#22B8CF", pinHash: hash("3333") },
    { id: "pr-fm", nome: "Fm", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
      magazziniIds: [linea.id], pinHash: hash("2222") },
  ];
  return s;
};
/* «Ricalcola» in Ordini è la via più diretta per far girare i fabbisogni su
   TUTTI i magazzini che il profilo può toccare */
const ricalcola = async (p) => {
  await p.getByRole("button", { name: /Ricalcola/ }).click();
  await p.waitForTimeout(2000);
};

/* ═══════════ 1. PRIMA DELLA SPUNTA: SI COMPRA TUTTO ═══════════ */
console.log("\n— 1. com'era prima (testimone) —");
const A0 = await apri("Admin", "1234", scena(false), "Ordini");
await ricalcola(A0.p);
const d0 = await letto(A0.p);
const ord0 = (d0.ordini || []).filter((o) => o.stato === "da-ordinare");
ok(ord0.some((o) => o.prodottoId === PA.id && o.tipo === "diretto"),
  `senza spunta, «${PA.nome}» genera una riga d'ordine dal retro`);
ok(ord0.some((o) => o.prodottoId === PA.id && o.tipo === "lab"),
  "e una anche dal laboratorio: è la bugia che stiamo togliendo");
ok((d0.richieste || []).length === 0, "e nessuna richiesta al laboratorio");
await A0.ctx.close();

/* ═══════════ 2. DOPO LA SPUNTA: NESSUN ORDINE, MAI ═══════════ */
console.log("\n— 2. col preparato —");
const A1 = await apri("Admin", "1234", scena(true), "Ordini");
await ricalcola(A1.p);
const d1 = await letto(A1.p);
const ord1 = (d1.ordini || []).filter((o) => o.stato === "da-ordinare");
ok(!ord1.some((o) => o.prodottoId === PA.id),
  `«${PA.nome}» non genera NESSUNA riga d'ordine, né dal retro né dal laboratorio`);
ok(ord1.some((o) => o.prodottoId === PB.id && o.tipo === "diretto")
  && ord1.some((o) => o.prodottoId === PB.id && o.tipo === "lab"),
  `«${PB.nome}», che si compra, continua a generarle entrambe: non ho spento tutto`);
/* il retro chiede al laboratorio */
const ric1 = (d1.richieste || []).filter((r) => r.prodottoId === PA.id);
ok(ric1.length === 1, "il retro manda UNA richiesta al laboratorio");
ok(ric1[0]?.daMagazzinoId === "mag-retro-fm" && ric1[0]?.aSedeLabId === LAB.id,
  "che parte dal retro e va al laboratorio giusto");
ok(ric1[0]?.stato === "in-attesa" && ric1[0]?.qty === 5,
  `chiedendo quanto manca per stare a livello (6 − 1 = 5, trovato ${ric1[0]?.qty})`);
/* e in Ordini l'admin vede cosa c'è da preparare */
const t1 = await testo(A1.p);
ok(/Da preparare · 1/.test(t1), "e in Ordini compare «Da preparare · 1»");
ok(new RegExp(`${PA.nome}[\\s\\S]{0,80}Magazzino centrale`).test(t1),
  `con «${PA.nome}» e il magazzino dov'è sotto`);
ok(/da fare 7 pz/.test(t1), "e quanto manca al laboratorio per stare a livello (9 − 2 = 7)");
ok(!/\+7 pz/.test(t1), "detto come una mancanza, non come un «+» che sembrerebbe merce in più");
ok(!new RegExp(`Da preparare[\\s\\S]{0,200}${PB.nome}`).test(t1),
  `senza «${PB.nome}», che si compra e infatti sta negli ordini`);
await A1.p.screenshot({ path: "g560-1-da-preparare.png", fullPage: true });

/* ricalcolare due volte non deve duplicare la richiesta */
await ricalcola(A1.p);
const d1b = await letto(A1.p);
ok((d1b.richieste || []).filter((r) => r.prodottoId === PA.id).length === 1,
  "ricalcolando di nuovo la richiesta resta una: non arriva il doppio della merce");
await A1.ctx.close();

/* ═══════════ 3. UNA RIGA VECCHIA SPARISCE ═══════════ */
console.log("\n— 3. quello che era già stato ordinato —");
const s3 = scena(true);
s3.ordini = [{ id: "o-vecchio", t: Date.now(), tipo: "diretto", sedeId: FM.id, prodottoId: PA.id,
  fornitoreId: F1.id, qty: 4, uomId: UPZ, stato: "da-ordinare" }];
const A3 = await apri("Admin", "1234", s3, "Ordini");
await ricalcola(A3.p);
const d3 = await letto(A3.p);
ok(!(d3.ordini || []).some((o) => o.id === "o-vecchio"),
  "una riga d'ordine rimasta da prima della spunta se ne va: nessuno la comprerà");
ok((d3.richieste || []).some((r) => r.prodottoId === PA.id),
  "e al suo posto c'è la richiesta al laboratorio");
await A3.ctx.close();

/* ═══════════ 4. IL CONTEGGIO DI LINEA ═══════════ */
console.log("\n— 4. dalla linea, contando —");
const O4 = await apri("Fm", "2222", scena(true), "Conteggi");
await O4.p.getByRole("button", { name: /Conta ora/ }).first().click(); await O4.p.waitForTimeout(1000);
await O4.p.getByLabel(`Conteggio ${PA.nome}`).fill("0"); await O4.p.waitForTimeout(300);
await O4.p.getByRole("button", { name: /Verifica e conferma/ }).first().click();
await O4.p.waitForTimeout(900);
const t4 = await testo(O4.p);
ok(/chiede al laboratorio/.test(t4) || /richiesta al laboratorio/i.test(t4),
  "il riepilogo dice che il retro lo chiede al laboratorio");
ok(!new RegExp(`ordine[\\s\\S]{0,40}a ${F1.nome}`).test(t4),
  `e NON promette un ordine a «${F1.nome}»`);
await O4.p.screenshot({ path: "g560-2-conteggio.png", fullPage: true });
await O4.ctx.close();

/* ═══════════ 5. IL CATALOGO LO DICE, E LA SPUNTA SI SALVA ═══════════ */
console.log("\n— 5. il catalogo —");
const A5 = await apri("Admin", "1234", scena(false), "Catalogo");
await A5.p.getByText(/^Prodotti · \d+$/).click(); await A5.p.waitForTimeout(800);
/* i gruppi per categoria partono chiusi: si apre quello del prodotto */
await A5.p.getByText(base.categorie[0].nome, { exact: false }).first().click(); await A5.p.waitForTimeout(600);
await A5.p.getByRole("button", { name: `Modifica ${PA.nome}` }).click(); await A5.p.waitForTimeout(900);
const fg = A5.p.locator(".fixed.inset-0.z-50").last();
ok(/Si prepara in laboratorio/.test(await fg.innerText()), "nella scheda prodotto c'è la spunta");
ok(await fg.getByText("Fornitore abituale", { exact: true }).count() === 1, "e finché è spenta il fornitore si sceglie");
await fg.getByRole("button", { name: /Si prepara in laboratorio/ }).click(); await A5.p.waitForTimeout(500);
ok(await fg.getByText("Fornitore abituale", { exact: true }).count() === 0,
  "spuntandola il fornitore sparisce: non ne ha uno");
await fg.getByRole("button", { name: /^Salva$/ }).click(); await A5.p.waitForTimeout(1600);
const d5 = await letto(A5.p);
ok(d5.prodotti.find((p) => p.id === PA.id)?.preparato === true, "e la spunta si salva");
ok(!d5.prodotti.find((p) => p.id === PB.id)?.preparato,
  "senza toccare gli altri prodotti");
const t5 = await testo(A5.p);
ok(/Preparato in laboratorio/.test(t5),
  "nell'elenco del Catalogo si legge «Preparato in laboratorio» al posto del fornitore");
await A5.p.screenshot({ path: "g560-3-catalogo.png", fullPage: true });
/* la lente in alto e' l'ultima finestra che diceva il fornitore: se qui
   restasse «Fornitore: Verdure» due schermate direbbero due cose diverse */
await A5.p.getByRole("button", { name: "Cerca un prodotto o una funzione" }).click(); await A5.p.waitForTimeout(500);
await A5.p.getByRole("textbox", { name: "Cerca un prodotto o una funzione" }).fill(PA.nome.slice(0, 6)); await A5.p.waitForTimeout(900);
const t5b = await testo(A5.p);
ok(/Preparato in laboratorio/.test(t5b), "anche la ricerca dice «Preparato in laboratorio»");
ok(!new RegExp(`Fornitore: ${F1.nome}`).test(t5b), `e non «Fornitore: ${F1.nome}»`);
await A5.ctx.close();

/* ═══════════ 6. CHI LO VEDE ═══════════ */
console.log("\n— 6. chi vede «Da preparare» —");
const L6 = await apri("Lab", "3333", scena(true), "Ordini");
await ricalcola(L6.p);
ok(/Da preparare/.test(await testo(L6.p)), "il laboratorio lo vede: è lui che prepara");
await L6.ctx.close();
const O6 = await apri("Fm", "2222", scena(true), "Ordini");
ok(!/Da preparare/.test(await testo(O6.p)),
  "l'operatore di sede no: non è lui che le fa");
await O6.ctx.close();

/* ═══════════ 7. QUANDO IL LABORATORIO MANDA LA ROBA ═══════════
   La richiesta nata da sola deve dirlo in italiano, e la finestra che il
   laboratorio apre per mandare la merce non deve promettere un ordine a un
   fornitore: per un preparato quell'ordine non nasce piu', quindi annunciarlo
   sarebbe raccontare una cosa che non succede. */
console.log("\n— 7. quando il laboratorio manda la roba —");
const s7 = scena(true);
s7.richieste = [{ id: "ric-1", t: Date.now(), daSedeId: FM.id, aSedeLabId: LAB.id,
  daMagazzinoId: "mag-retro-fm", magNome: "Secco fm", prodottoId: PA.id,
  qty: 5, uomId: UPZ, qtyLinea: 5, uomLineaId: UPZ, stato: "in-attesa",
  creataDa: "fabbisogno automatico" }];
const L7 = await apri("Lab", "3333", s7, "Richieste");
const t7 = await testo(L7.p);
ok(/in automatico, per scorta bassa/.test(t7),
  "una richiesta nata da sola lo dice in italiano");
ok(!/di fabbisogno automatico/.test(t7),
  "e non «di fabbisogno automatico», che non è italiano");
await L7.p.getByRole("button", { name: /Cambia/ }).first().click(); await L7.p.waitForTimeout(1000);
const fg7 = L7.p.locator(".fixed.inset-0.z-50").last();
const t7b = (await fg7.innerText()).replace(/\s+/g, " ");
ok(/si preparano/.test(t7b) && /non si comprano/.test(t7b),
  "la finestra dell'evasione dice che quel che manca si prepara");
ok(!new RegExp(`Report ordine[\\s\\S]{0,80}${F1.nome}`).test(t7b),
  `e non promette un «Report ordine … a ${F1.nome}» che non nascera' mai`);
await L7.p.screenshot({ path: "g560-4-evasione.png", fullPage: true });
await L7.ctx.close();

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 8)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
