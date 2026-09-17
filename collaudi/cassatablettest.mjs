/* ── LA CASSA SU UN TABLET (gen-6.23) ──

   Parole di Valerio, 17 settembre: «ottimizza per tablet la visualizzazione
   della cassa e sistema anche la tendina delle aggiunte è troppo ingombrante».

   COS'ERA PRIMA, MISURATO il 17 settembre su gen-6.22 con una sonda
   fotografica, non stimato:
   · tablet orizzontale 1180x820, due piatti battuti: il bottone «Incassa» e il
     totale finiscono SOTTO il bordo dello schermo. Chi batte non vede quanto
     sta facendo pagare senza scorrere. La Cassa e' una colonna sola da
     telefono, stirata larga: griglia sopra, conto sotto.
   · la fascia degli ingredienti aperta e' alta 166px e larga 1156 su 1180
     (il 98% della larghezza) e copre tre file del listino E il conto.

   IL CONTRATTO CHE QUESTO BANCO FISSA — i nomi si fissano QUI, il codice si
   adegua:
   · da 1024px in su la Cassa sta su DUE COLONNE: listino a sinistra, conto a
     destra, e il conto NON scorre via;
   · la fascia degli ingredienti non e' piu' una lastra da un lato all'altro:
     resta sopra la sola colonna del listino;
   · il conto porta l'attributo `data-conto="1"`, la colonna del listino
     `data-listino="1"`: due porte stabili, come `data-fascia`.

   ROSSE PER COSTRUZIONE contro gen-6.22, misurate girando il banco prima di
   scrivere una riga di codice: §1 («Incassa» finisce a 909px su 820 di
   schermo: 89 fuori), §3 (la fascia e' larga 1156 su 1180), §4 (le porte
   data-listino / data-conto non esistono e le colonne nemmeno).

   E DUE VERDI CHE OGGI LO SONO PER ASSENZA — dichiarati qui perche' un verde
   non guadagnato e' peggio di un rosso:
   §2 (la fascia non copre «Incassa») oggi passa solo perche' «Incassa» e'
   FUORI dallo schermo, sotto la fascia: non c'e' niente da coprire. Diventa
   una misura vera appena il conto entra nella colonna di destra, ed e' li'
   che serve.
   §11 (sul telefono una colonna sola) oggi passa perche' le porte non
   esistono e la guardia `!una.porte ||` cortocircuita. Diventa una misura
   vera con le porte, e da allora e' il guardiano del telefono.

   CONTRO-CONTROLLI, verdi PRIMA e DOPO — il telefono non deve cambiare di un
   pixel, perche' la fascia che si apre solo quando serve l'ha chiesta Valerio
   a giugno (gen-6.04) ed e' gia' misurata da cassa617test §13:
   §10 (sul telefono la fascia parte CHIUSA e costa 48px), §11 (sul telefono il
   conto sta sotto la griglia, UNA colonna), §12 (battere un piatto resta UN
   tocco e il totale sale), §13 (a 820px, cioe' SOTTO la soglia, la Cassa resta
   una colonna sola).

   UN LIMITE DICHIARATO: a 820px di larghezza — un tablet tenuto in VERTICALE —
   la Cassa NON e' su due colonne, perche' con la barra laterale restano 596px
   e un listino da 236 sarebbe peggio del male. Li' il conto sta ancora sotto
   la piega con un listino vero (misurato: «Incassa» a 1949px su 1180). E' il
   comportamento di prima, non una regressione, ma non e' risolto, e §13 tiene
   ferma la soglia perche' nessuno la sposti senza accorgersene.

   NIENTE DATI VERI: listino, prezzi e ingredienti inventati. NIENTE RETE VERA. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import crypto from "crypto";
import { apriServer } from "./servi.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 130)}`); } };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con almeno 2 articoli");
const art = linea.articoli[0]; art.qty = 200;
FM.cassaMagId = linea.id;

/* UN LISTINO DA PIZZERIA VERA. Con tre voci non si vede come la griglia
   riempie un tablet, ed e' proprio quello che questo banco misura. */
const VOCI = [
  ["Margherita", "Pizze", 6], ["Marinara", "Pizze", 5], ["Bufala", "Pizze", 8.5],
  ["Diavola", "Pizze", 8], ["Capricciosa", "Pizze", 9], ["Boscaiola", "Pizze", 9],
  ["Quattro formaggi", "Pizze", 9.5], ["Ortolana", "Pizze", 8], ["Napoli", "Pizze", 7],
  ["Salsiccia e friarielli", "Pizze", 9.5], ["Patate e salsiccia", "Pizze", 9],
  ["Tonno e cipolla", "Pizze", 8.5], ["Prosciutto e funghi", "Pizze", 9], ["Calzone", "Pizze", 8.5],
  ["Supplì", "Fritti", 2], ["Crocchetta", "Fritti", 2], ["Fiori di zucca", "Fritti", 3],
  ["Tiramisù", "Dolci", 5], ["Acqua", "Bevande", 1.5], ["Birra media", "Bevande", 4],
];
base.listino = VOCI.map(([nome, gruppo, prezzo], i) => ({
  id: "li-" + i, nome, gruppo, prezzo, attivo: true, varianti: [],
  distinta: [{ prodottoId: art.prodottoId, qty: 0.1, uomId: art.uomId }],
}));
/* ── IL LISTINO DEVE ESSERE PIU' ALTO DELLO SCHERMO, E DI PARECCHIO ──
   Col listino corto la pagina aveva 99px di corsa: troppo pochi perche' un
   conto NON appiccicato sparisse, quindi §1b restava verde anche col difetto
   e il sabotaggio S5 usciva MUTO. Non era il codice a non avere il difetto:
   era la SCENA a non essere abbastanza alta per mostrarlo. Trenta pizze in
   piu' danno oltre mille pixel di corsa, e il mondo senza appiccicato si
   distingue da quello con. */
for (let i = 0; i < 30; i++) {
  base.listino.push({ id: "li-x" + i, nome: `Pizza della casa ${i + 1}`, gruppo: "Pizze",
    prezzo: 7, attivo: true, varianti: [],
    distinta: [{ prodottoId: art.prodottoId, qty: 0.1, uomId: art.uomId }] });
}
/* DODICI ingredienti: su una riga sola non ci stanno a nessuna larghezza, ed
   e' la condizione in cui la fascia e' davvero ingombrante. */
base.aggiunte = ["Acciughe", "Bufala", "Cipolla", "Funghi", "Olive", "Patate", "Salsiccia",
  "Zucchine", "Broccoletti", "Gorgonzola", "Speck", "Rucola"]
  .map((n, i) => ({ id: "ag-" + i, nome: n, prezzo: 1 + i * 0.1, attivo: true, gruppi: ["Pizze"], distinta: [] }));
base.postazioni = []; base.vendite = []; base.giornate = []; base.clienti = [];
base.profili = [{ id: "pr-so", nome: "SoloCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], cassa: true, soloCassa: true, pinHash: hash("2222") }];

const srv = await apriServer();
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];

const apri = async (width, height) => {
  const ctx = await b.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await ctx.addInitScript((j) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(base));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(`${width}x${height}: ${e.message}`));
  await p.goto(srv.url); await p.waitForTimeout(1400);
  await p.getByText("SoloCassa", { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1700);
  return { p, ctx };
};
/* si battono due piatti, come farebbe chi lavora: senza conto, il conto non
   c'e' da guardare e la misura non vorrebbe dire niente */
const batti = async (p, nomi) => {
  /* L'ETICHETTA DELLA CELLA E' «Aggiungi <nome>», non «<nome>»: verificato in
     pagina. Con l'ancora sbagliata il tocco non avviene, il conto resta vuoto
     e META' DI QUESTO BANCO diventa rossa per il motivo sbagliato — un rosso
     preso in prestito non prova niente, esattamente come un verde. Per questo
     la funzione CONTA i tocchi riusciti e chi la chiama lo verifica. */
  let fatti = 0;
  for (const n of nomi) {
    const t = p.getByRole("button", { name: new RegExp(`^Aggiungi ${n}$`, "i") }).first();
    if (await t.count()) { await t.click().catch(() => {}); fatti++; await p.waitForTimeout(320); }
  }
  return fatti;
};
const apriFascia = async (p) => {
  const pa = p.locator('[data-fascia-chiusa="1"] button').first();
  if (await pa.count()) { await pa.click(); await p.waitForTimeout(550); }
};
const suFoglio = (p) => p.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll("*").forEach((e) => { if (e.scrollTop) e.scrollTop = 0; }); });
/* ── SCORRERE DAVVERO, E SAPERLO ──
   Il guscio dell'app scorre in un DIV interno, non nella finestra: un
   `window.scrollBy` qui non muove NIENTE. Il primo giro di questo banco ci e'
   cascato — §1b passava, e passava anche col conto NON appiccicato, cioe' era
   verde per assenza. L'ha scoperto il sabotaggio S5 uscendo MUTO.
   Percio' si cerca il contenitore che scorre per davvero e si RESTITUISCE di
   quanto si e' mosso: chi chiama lo verifica, e se non si e' mosso la misura
   si dichiara inutile invece di spacciarsi per buona. */
const scorri = (p) => p.evaluate(() => {
  /* NON il primo contenitore che scorre — quello e' l'area dei chip della
     fascia, che ha una corsa di 99px e non muove il listino. Si prende quello
     con la corsa PIU' LUNGA, e lo si porta in fondo: e' la condizione peggiore,
     cioe' quella in cui un conto non appiccicato sarebbe di sicuro sparito. */
  let c = null, max = 0;
  for (const e of document.querySelectorAll("*")) {
    const corsa = e.scrollHeight - e.clientHeight;
    if (corsa > max && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) { c = e; max = corsa; }
  }
  const prima = c ? c.scrollTop : window.scrollY;
  if (c) c.scrollTop = c.scrollHeight; else window.scrollTo(0, document.body.scrollHeight);
  return { mosso: (c ? c.scrollTop : window.scrollY) - prima };
});
/* il rettangolo di «Incassa»: e' il pezzo del conto che conta davvero, ed
   esiste GIA' su gen-6.22 — cosi' i rossi sono rossi veri e non «manca un
   attributo che non ho ancora scritto». */
const rettIncassa = (p) => p.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => /incassa/i.test(x.textContent || ""));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), vh: innerHeight, vw: innerWidth };
});
const rettFascia = (p) => p.evaluate(() => {
  const f = document.querySelector('[data-fascia="1"]');
  if (!f) return null;
  const r = f.getBoundingClientRect();
  return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height), vh: innerHeight, vw: innerWidth };
});
const siSovrappongono = (a, b2) => !(a.bottom <= b2.top || b2.bottom <= a.top || a.right <= b2.left || b2.right <= a.left);

/* ═══ 1-4. IL TABLET ORIZZONTALE — 1180x820, il modo in cui una cassa sta su un banco ═══ */
const O = await apri(1180, 820);
const battutiO = await batti(O.p, ["Margherita", "Diavola"]);
await suFoglio(O.p);
console.log("\n— 0. la scena e' quella che dico —");
ok(battutiO === 2, `i due piatti sono stati battuti davvero (${battutiO}/2): senza, ogni misura qui sotto sarebbe un rosso preso in prestito`);

console.log("\n— 1. il totale si vede senza scorrere —");
await prova("§1", async () => {
  const r = await rettIncassa(O.p);
  ok(!!r, "il bottone «Incassa» esiste (due piatti battuti)");
  ok(r && r.bottom <= r.vh,
    `«Incassa» sta dentro lo schermo senza scorrere (finisce a ${r?.bottom}px su ${r?.vh} di altezza)`);
});

console.log("\n— 1b. e il totale non scorre via mentre si cercano le pizze —");
await prova("§1b", async () => {
  /* IL CONTO E' APPICCICATO IN ALTO, e senza questa misura quella riga non la
     puo' far diventare rossa nessuno: a schermo fermo il conto si vedrebbe
     comunque, perche' sta in cima alla sua colonna. Si vede solo scorrendo. */
  const sc = await scorri(O.p);
  await O.p.waitForTimeout(400);
  ok(sc.mosso >= 400,
    `il listino si e' scorso DAVVERO (${sc.mosso}px): senza questo, la misura qui sotto sarebbe verde per assenza`);
  const r = await rettIncassa(O.p);
  ok(r && r.top >= 0 && r.bottom <= r.vh,
    `dopo aver scorso il listino «Incassa» e' ancora in vista (${r?.top}-${r?.bottom} su ${r?.vh})`);
  await suFoglio(O.p);
});

console.log("\n— 2-3. la fascia degli ingredienti non e' piu' una lastra —");
await apriFascia(O.p);
await prova("§2", async () => {
  const f = await rettFascia(O.p), i = await rettIncassa(O.p);
  ok(!!f, "la fascia aperta esiste");
  ok(f && i && !siSovrappongono(f, i),
    `la fascia aperta NON copre «Incassa» (fascia ${f?.top}-${f?.bottom}, Incassa ${i?.top}-${i?.bottom})`);
});
await prova("§3", async () => {
  const f = await rettFascia(O.p);
  ok(f && f.w <= f.vw * 0.7,
    `la fascia sta sopra la sola colonna del listino, non da un bordo all'altro (larga ${f?.w}px su ${f?.vw})`);
});

console.log("\n— 3b. e nessun ingrediente si perde per strada —");
await prova("§3b", async () => {
  /* LA COLONNA E' PIU' STRETTA DELLO SCHERMO: e' il punto dove un
     restringimento si paga in ingredienti che non si raggiungono piu'. Ne sono
     dodici e dodici devono restare, a capo o scorrendo dentro la fascia. */
  const quanti = await O.p.evaluate(() => document.querySelectorAll('[data-fascia="1"] [data-agg]').length);
  ok(quanti === 12, `tutti e dodici gli ingredienti restano nella fascia anche nella colonna stretta (ne trovo ${quanti})`);
});

console.log("\n— 4. da 1024px in su la Cassa sta su due colonne —");
await prova("§4", async () => {
  const due = await O.p.evaluate(() => {
    const l = document.querySelector('[data-listino="1"]'), c = document.querySelector('[data-conto="1"]');
    if (!l || !c) return { c_e: false };
    const rl = l.getBoundingClientRect(), rc = c.getBoundingClientRect();
    return { c_e: true, affiancate: rc.left >= rl.right - 2, contoDestra: rc.left > rl.left };
  });
  ok(due.c_e, "il listino e il conto hanno le loro porte (data-listino, data-conto)");
  ok(due.c_e && due.affiancate && due.contoDestra,
    `il conto sta a DESTRA del listino, affiancato e non sotto (${JSON.stringify(due)})`);
});

console.log("\n— 5. e la griglia del listino resta usabile —");
await prova("§5", async () => {
  const t = (await O.p.locator("body").innerText()).replace(/\s+/g, " ");
  ok(/Margherita/.test(t) && /Diavola/.test(t), "le voci del listino ci sono ancora");
  ok(/14,00/.test(t), `il totale delle due pizze e' 14,00 (letto nel testo della pagina)`);
});
await O.ctx.close();

/* ═══ 10-12. IL TELEFONO NON CAMBIA — i contro-controlli ═══ */
const T = await apri(390, 844);
console.log("\n— 10. sul telefono la fascia parte CHIUSA e costa un dito —");
await prova("§10", async () => {
  const chiusa = await T.p.locator('[data-fascia-chiusa="1"]').count();
  ok(chiusa === 1, `la fascia parte chiusa, come gen-6.04 (ne trovo ${chiusa})`);
  const h = await T.p.evaluate(() => {
    const e = document.querySelector('[data-fascia-chiusa="1"] button');
    return e ? Math.round(e.getBoundingClientRect().height) : 0;
  });
  ok(h >= 44 && h <= 56, `la pastiglia chiusa e' alta un dito e non di piu' (${h}px)`);
});

console.log("\n— 11. sul telefono il conto sta SOTTO la griglia, una colonna sola —");
await batti(T.p, ["Margherita", "Diavola"]);
await prova("§11", async () => {
  const una = await T.p.evaluate(() => {
    const l = document.querySelector('[data-listino="1"]'), c = document.querySelector('[data-conto="1"]');
    if (!l || !c) return { porte: false };
    const rl = l.getBoundingClientRect(), rc = c.getBoundingClientRect();
    return { porte: true, sotto: rc.top >= rl.top, stessaColonna: Math.abs(rc.left - rl.left) < 4 };
  });
  ok(!una.porte || (una.sotto && una.stessaColonna),
    `sul telefono niente due colonne: il conto resta incolonnato sotto il listino (${JSON.stringify(una)})`);
});

console.log("\n— 12. battere un piatto resta UN tocco, e il totale sale —");
await prova("§12", async () => {
  const t = (await T.p.locator("body").innerText()).replace(/\s+/g, " ");
  ok(/14,00/.test(t), "due pizze battute con due tocchi fanno 14,00");
});
await T.ctx.close();

/* ═══ 13. IL TABLET IN VERTICALE — gia' andava, e deve continuare ═══ */
const V = await apri(820, 1180);
const battutiV = await batti(V.p, ["Margherita", "Diavola"]);
ok(battutiV === 2, `tablet in verticale: i due piatti battuti davvero (${battutiV}/2)`);
await suFoglio(V.p);
console.log("\n— 13. tablet in VERTICALE: sotto la soglia resta una colonna, e si dichiara —");
await prova("§13", async () => {
  /* ── UN LIMITE DICHIARATO, NON UN VERDE COMPRATO ──
     A 820px di larghezza il guscio mostra gia' la barra laterale (w-56, da
     768 in su): restano 596px di contenuto. Due colonne li' vorrebbero dire
     un listino da 236px, cioe' due celle strettissime — peggio del male.
     Percio' SOTTO 1024 la Cassa resta una colonna sola, come sul telefono, e
     con un listino vero il conto sta sotto la piega: MISURATO, «Incassa» a
     1949px su 1180. E' il comportamento di prima, non una regressione, ma non
     e' «ottimizzato»: se la cassa di Valerio sta in verticale, questa soglia
     va abbassata o al conto serve una barra appiccicata in fondo — ed e' una
     decisione sua, non mia.
     Questo controllo guarda che la soglia sia dove dico che sia: e' lui a
     diventare rosso se qualcuno la sposta di nascosto. */
  const una = await V.p.evaluate(() => {
    const l = document.querySelector('[data-listino="1"]'), c = document.querySelector('[data-conto="1"]');
    if (!l || !c) return { porte: false };
    const rl = l.getBoundingClientRect(), rc = c.getBoundingClientRect();
    return { porte: true, sotto: rc.top >= rl.top, stessaColonna: Math.abs(rc.left - rl.left) < 4 };
  });
  ok(una.porte && una.sotto && una.stessaColonna,
    `a 820px la Cassa resta UNA colonna: il conto e' incolonnato sotto il listino, non affiancato (${JSON.stringify(una)})`);
});
await V.ctx.close();

console.log("\n— 14. nessun errore di pagina —");
ok(errs.length === 0, `nessuna eccezione in pagina${errs.length ? " — " + errs.slice(0, 2).join(" · ") : ""}`);

await b.close(); await srv.chiudi();
console.log(ko ? `\ncassatablettest: ${ko} CONTROLLI FALLITI` : "\ncassatablettest: TUTTI I CONTROLLI PASSATI");
process.exit(ko === 0 ? 0 : 1);
