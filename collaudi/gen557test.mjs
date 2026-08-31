/* gen-5.57: tre lavori.
   1) gli ordini non «spariscono» più: la scheda si apre dove c'è qualcosa, e
      quando è vuota l'app dice dove sono invece di mostrare il nulla
   2) l'admin scegli su quale sede fare l'inventario
   3) i conteggi di linea a fisarmonica per categoria

   Sul primo la prova che conta è che NIENTE venga perso: la finestra taglia solo
   le righe chiuse vecchie, e quelle ancora da fare non si toccano mai, neanche
   se hanno un anno. Sul terzo la prova che conta è che chiudere un gruppo non
   faccia sparire un numero già battuto dal conferma. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const GIORNO = 86400000;

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const LAB = base.sedi.find((x) => x.tipo === "laboratorio");
const [FM, RM] = base.sedi.filter((x) => x.tipo === "operatore");
const [PA, PB] = base.prodotti;
const F1 = base.fornitori[0];

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin, seme, dove, largo = 390) => {
  const ctx = await b.newContext({ viewport: { width: largo, height: 830 },
    isMobile: largo < 700, hasTouch: largo < 700, deviceScaleFactor: 2 });
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

/* ═══════════ 1. GLI ORDINI NON SPARISCONO ═══════════ */
console.log("\n— 1a. la scheda si apre dove c'è qualcosa —");
/* la scena vera che ha visto lui: tutte le righe sono «ricevuto», la scheda di
   partenza era «Da ordinare» e si apriva vuota ogni volta */
const s1 = JSON.parse(JSON.stringify(base));
const retro = s1.magazzini.find((m) => m.tipo === "retro");
retro.sedeId = FM.id;
retro.articoli = [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 5, par: 5 }];
s1.magazzini = [retro];
const ordine = (id, stato, tipo, sedeId, giorniFa) => ({
  id, t: Date.now() - giorniFa * GIORNO, tipo, sedeId, prodottoId: PA.id,
  fornitoreId: F1.id, qty: 3, uomId: PA.uomBase, stato,
});
s1.ordini = [
  ordine("o-ric-1", "ricevuto", "diretto", FM.id, 1),
  ordine("o-ric-2", "ricevuto", "diretto", FM.id, 2),
  ordine("o-ord-1", "ordinato", "diretto", FM.id, 3),
];
s1.richieste = []; s1.movimenti = []; s1.log = []; s1.codici = []; s1.accessi = [];
s1.profili = [
  { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  { id: "pr-lab", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id, colore: "#22B8CF", pinHash: hash("3333") },
];

const A1 = await apri("Admin", "1234", s1, "Ordini");
const t1 = (await A1.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(!/Nessun acquisto da fare/.test(t1),
  "aprendo Ordini non si finisce più su una schermata vuota");
ok(/Ordinati · 1/.test(t1) && /Ricevuti · 2/.test(t1),
  "le schede contano le righe che ci sono (1 ordinato, 2 ricevuti)");
/* si è aperta su «ordinato», la prima piena nell'ordine da-ordinare → ordinato
   → ricevuto. La prova che mostra roba vera: c'è il nome del fornitore e la
   quantità, non la scheda del vuoto. */
ok(new RegExp(F1.nome, "i").test(t1) && /3 pz/.test(t1),
  `e mostra righe vere («${F1.nome}», 3 pz), non il vuoto`);
await A1.p.screenshot({ path: "g557-1-ordini.png", fullPage: true });

/* e andando a mano su una scheda vuota, l'app dice dove sono le altre */
await A1.p.getByText(/^Da ordinare · 0$/).click(); await A1.p.waitForTimeout(800);
const t1b = (await A1.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/Qui non c'è niente, ma i tuoi ordini ci sono/.test(t1b),
  "su una scheda vuota l'app dice che gli ordini ci sono");
ok(/1 riga in «Ordinati»/.test(t1b) && /2 righe in «Ricevuti»/.test(t1b),
  "dicendo quante e dove");
ok(/restano per 45 giorni/.test(t1b), "e per quanto tempo restano");
ok(await A1.p.getByRole("button", { name: /Vai a «Ricevuti» · 2/ }).count() === 1,
  "con un tasto per andarci");
await A1.p.getByRole("button", { name: /Vai a «Ricevuti» · 2/ }).click();
await A1.p.waitForTimeout(800);
ok(/Ricevuti · 2/.test(await A1.p.locator("body").innerText()), "e il tasto ci porta");
await A1.p.screenshot({ path: "g557-2-dove-sono.png", fullPage: true });
await A1.ctx.close();

console.log("\n— 1b. chi non ne vede nessuno capisce perché —");
const L1 = await apri("Lab", "3333", s1, "Ordini");
const tL = (await L1.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/Ci sono 3 righe d'ordine in azienda, ma nessuna riguarda la tua sede/.test(tL),
  "il laboratorio, che non vede gli acquisti delle sedi operative, legge il perché");
ok(/Non sono spariti/.test(tL), "e che non sono spariti");
await L1.p.screenshot({ path: "g557-3-perche.png", fullPage: true });
await L1.ctx.close();

console.log("\n— 1c. la finestra: si tiene il lavoro, si sfoltisce l'archivio —");
/* Il controllo che conta di più di tutti: una riga DA FARE vecchissima non deve
   essere toccata, e una riga chiusa dentro la finestra non deve sparire. */
const s2 = JSON.parse(JSON.stringify(s1));
s2.ordini = [
  ordine("o-vecchia-da-fare", "da-ordinare", "diretto", FM.id, 400),
  ordine("o-chiusa-dentro", "ricevuto", "diretto", FM.id, 10),
  ordine("o-chiusa-fuori", "ricevuto", "diretto", FM.id, 60),
  { id: "o-senza-data", tipo: "diretto", sedeId: FM.id, prodottoId: PA.id,
    fornitoreId: F1.id, qty: 1, uomId: PA.uomBase, stato: "ricevuto" },
];
/* Serve una scrittura qualsiasi perché la finestra si applichi, ma NON un
   «Ricalcola»: quello ricalcola i fabbisogni e togliere una riga «da ordinare»
   senza deficit è il suo lavoro, non la finestra. Usandolo avrei dato la colpa
   alla finestra di una cosa che fa un altro. Uso l'avvio di un inventario, che
   scrive e non ha niente a che vedere con gli ordini. */
const A2 = await apri("Admin", "1234", s2, "Magazzini");
await A2.p.getByRole("button", { name: /^Inventario$/ }).click();
await A2.p.waitForTimeout(1100);
const f2 = A2.p.locator(".fixed.inset-0.z-50").last();
await f2.getByRole("button", { name: /Avvia inventario/ }).click();
await A2.p.waitForTimeout(2000);
const d2 = await letto(A2.p);
const ids = (d2.ordini || []).map((o) => o.id);
ok(ids.includes("o-vecchia-da-fare"),
  "una riga ANCORA DA FARE di 400 giorni non viene toccata: è lavoro, non archivio");
ok(ids.includes("o-chiusa-dentro"),
  "una riga chiusa di 10 giorni resta: è dentro la finestra");
ok(!ids.includes("o-chiusa-fuori"),
  "una riga chiusa di 60 giorni esce: è oltre i 45");
ok(ids.includes("o-senza-data"),
  "una riga senza data si tiene: non sapere quanti anni ha non è un motivo per buttarla");
await A2.ctx.close();

/* ═══════════ 2. L'ADMIN SCEGLIE LA SEDE ═══════════ */
console.log("\n— 2. l'admin scegli la sede dell'inventario —");
const s3 = JSON.parse(JSON.stringify(base));
const rFm = s3.magazzini.find((m) => m.tipo === "retro");
rFm.sedeId = FM.id; rFm.nome = "Secco fm";
rFm.articoli = [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 4, par: 10 }];
const rRm = { id: "mag-retro-rm", sedeId: RM.id, nome: "Secco rm", tipo: "retro",
  articoli: [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 7, par: 10 }] };
s3.magazzini = [rFm, rRm];
s3.ordini = []; s3.richieste = []; s3.movimenti = []; s3.log = []; s3.codici = []; s3.accessi = [];
s3.profili = [
  { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  /* DAL 30 AGOSTO (gen-5.95): l'inventario sta dietro «correzioni». Senza,
     il tasto non si disegna affatto e la prova sembrerebbe dire «l'operatore
     trova un altro inventario» quando invece non ne trova nessuno. Qui la
     prova è proprio che ENTRI nel giro aperto dall'admin, quindi l'operatore
     va autorizzato (31/08/2026, dal triage del censimento). */
  { id: "pr-fm", nome: "Fm", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    correzioni: true, magazziniIds: [rFm.id], pinHash: hash("2222") },
];

const A3 = await apri("Admin", "1234", s3, "Magazzini");
await A3.p.getByRole("button", { name: /^Inventario$/ }).click(); await A3.p.waitForTimeout(1100);
const f3 = A3.p.locator(".fixed.inset-0.z-50").last();
const t3 = (await f3.innerText()).replace(/\s+/g, " ");
ok(/scegli su quale fare il giro/.test(t3), "all'admin l'app chiede su quale sede fare il giro");
ok(new RegExp(FM.nome, "i").test(t3) && new RegExp(RM.nome, "i").test(t3),
  `elencando le due sedi (${FM.nome}, ${RM.nome})`);
ok(/Tutte le sedi in un giro solo/.test(t3), "con «tutte» come possibilità, spiegata");
await A3.p.screenshot({ path: "g557-4-scegli-sede.png", fullPage: true });

await f3.getByText(FM.nome, { exact: true }).first().click(); await A3.p.waitForTimeout(900);
const t3b = (await f3.innerText()).replace(/\s+/g, " ");
ok(new RegExp(rFm.nome).test(t3b), `scelta ${FM.nome}, si vede il suo magazzino`);
ok(!new RegExp(rRm.nome).test(t3b), `e NON quello dell'altra sede (${rRm.nome})`);
await f3.getByRole("button", { name: /Avvia inventario/ }).click(); await A3.p.waitForTimeout(1600);
const d3 = await letto(A3.p);
ok(!!d3.invCorso?.[FM.id],
  "la sessione è salvata sotto la sede scelta, non sotto «tutte»");
ok(!d3.invCorso?._tutte, "e «tutte» resta libera");
ok((d3.invCorso[FM.id].magIds || []).length === 1
  && d3.invCorso[FM.id].magIds[0] === rFm.id,
  "e contiene solo il magazzino di quella sede");
await A3.ctx.close();

/* e l'operatore di Fiumicino ci entra dentro, invece di trovarsi bloccato */
const F3 = await apri("Fm", "2222", d3, "Magazzini");
const bF = F3.p.getByRole("button", { name: /^Inventario · \d+ su \d+$/ });
ok(await bF.count() === 1,
  `l'operatore di ${FM.nome} entra nell'inventario aperto dall'admin, non ne trova un altro`);
await F3.ctx.close();

/* ═══════════ 3. I CONTEGGI A FISARMONICA ═══════════ */
console.log("\n— 3. i conteggi a fisarmonica per categoria —");
const s4 = JSON.parse(JSON.stringify(base));
const linea = s4.magazzini.find((m) => m.tipo === "linea-lab");
const magLab = s4.magazzini.find((m) => m.tipo === "laboratorio");
/* due prodotti in due categorie diverse: serve proprio la categoria diversa,
   se no non ci sono due gruppi da aprire e chiudere */
const [C1, C2] = s4.categorie;
const pA = s4.prodotti.find((p) => p.id === PA.id);
const pB = s4.prodotti.find((p) => p.id === PB.id);
pA.categoriaId = C1.id; pB.categoriaId = C2.id;
linea.articoli = [
  { prodottoId: PA.id, uomId: PA.uomBase, qty: 0, par: 3 },
  { prodottoId: PB.id, uomId: PB.uomBase, qty: 0, par: 4 },
];
magLab.articoli = [PA, PB].map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 50, par: 60 }));
s4.magazzini = [magLab, linea];
s4.ordini = []; s4.richieste = []; s4.movimenti = []; s4.log = []; s4.codici = []; s4.accessi = [];
s4.profili = [{ id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], pinHash: hash("2222") }];

const O4 = await apri("Op", "2222", s4, "Conteggi");
await O4.p.getByRole("button", { name: /Conta ora/ }).first().click();
await O4.p.waitForTimeout(1200);
const gruppi = O4.p.locator('button[aria-expanded]');
ok(await gruppi.count() === 2, `ci sono due gruppi, uno per categoria (${await gruppi.count()})`);
ok((await gruppi.first().getAttribute("aria-expanded")) === "true",
  "e partono APERTI: il conteggio è un giro da fare, non una ricerca");
const tG = (await O4.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/0 su 1/.test(tG), "ogni intestazione dice quanti ne hai contati su quanti sono");
await O4.p.screenshot({ path: "g557-5-fisarmonica.png", fullPage: true });

/* conto il primo, poi CHIUDO il suo gruppo: il numero non deve perdersi */
const c1 = O4.p.locator(`input[aria-label^="Conteggio ${pA.nome}"]`).first();
await c1.fill("1"); await O4.p.waitForTimeout(400);
ok(/1 su 1|tutti · 1/.test((await O4.p.locator("body").innerText()).replace(/\s+/g, " ")),
  "battuto un numero, l'intestazione del gruppo si aggiorna");
await gruppi.first().click(); await O4.p.waitForTimeout(600);
ok((await gruppi.first().getAttribute("aria-expanded")) === "false", "il gruppo si chiude");
ok(await O4.p.locator(`input[aria-label^="Conteggio ${pA.nome}"]`).count() === 0,
  "e la sua scheda non si vede più");
const tC = (await O4.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/tutti · 1/.test(tC),
  "ma l'intestazione chiusa dice che quel gruppo è fatto: non è una scatola nera");
await O4.p.screenshot({ path: "g557-6-chiuso.png", fullPage: true });

/* ── LA PROVA CHE CONTA: il conferma vede anche quello dentro il gruppo chiuso ── */
const c2 = O4.p.locator(`input[aria-label^="Conteggio ${pB.nome}"]`).first();
await c2.fill("2"); await O4.p.waitForTimeout(400);
await O4.p.getByRole("button", { name: /Verifica e conferma/ }).click();
await O4.p.waitForTimeout(1200);
const tR = (await O4.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(new RegExp(pA.nome).test(tR),
  `nel riepilogo c'è anche «${pA.nome}», che stava nel gruppo chiuso`);
ok(new RegExp(pB.nome).test(tR), `e «${pB.nome}»`);
await O4.p.getByRole("button", { name: /Conferma tutto/ }).click();
await O4.p.waitForTimeout(2400);
const d4 = await letto(O4.p);
const ric = (d4.richieste || []).map((r) => r.prodottoId).sort();
ok(ric.length === 2 && ric.includes(PA.id) && ric.includes(PB.id),
  `sono partite due richieste, una per prodotto (${ric.length}): chiudere un gruppo non ha perso niente`);
const qA = d4.magazzini.find((m) => m.id === linea.id).articoli.find((a) => a.prodottoId === PA.id).qty;
ok(qA === 1, `e la giacenza del prodotto nel gruppo chiuso è quella battuta (${qA})`);
await O4.p.screenshot({ path: "g557-7-confermato.png", fullPage: true });
await O4.ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs.join(" | ") : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
