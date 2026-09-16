/* I GRUPPI DIVENTANO PULSANTI (gen-6.19).

   Parole di Valerio del 13 settembre: «pizze fritti e dolci devono diventare
   dei pulsanti che aprono la loro sezione». E' l'ultima delle sue quattro
   richieste di quel giorno: le altre tre sono online da gen-6.17 e gen-6.18.

   IL DIFETTO, MISURATO SULLA PRODUZIONE VERA: 26 voci di listino — Pizze 20,
   Fritti 4, Dolci 2 — su due colonne fanno tredici righe di celle. Le PIZZE DA
   SOLE sono ~720px su un 390x844: fritti e dolci stanno SEMPRE sotto la piega,
   dopo venti pizze.

   ═══ LA COSA CHE IL DISEGNO HA SBAGLIATO QUATTRO VOLTE SU QUATTRO ═══
   Tutti e quattro i disegni indipendenti aprivano all'arrivo `gruppi[0]`, cioe'
   il primo dell'ordine per BATTUTE (app.jsx:13818). Quella riga non regge il
   peso della promessa «la pizza liscia resta un tocco», per due ragioni
   indipendenti e tutte e due verificate sul codice:
   · a vendite vuote il primo termine del sort e' sempre 0 e decide
     `localeCompare` — cioe' l'ALFABETO, cioe' DOLCI prima di PIZZE. Non e' un
     caso di laboratorio: e' il mercoledi' di riapertura, il rientro dalle
     ferie, un ripristino da backup, il primo servizio di un listino nuovo. Per
     48 ore la margherita costerebbe DUE tocchi.
   · peggio: `battute` si ricalcola nel corpo di render, `applicaVendita` mette
     lo scontrino appena incassato in testa a `s.vendite`, e il poll porta
     dentro quelli dell'altra cassa ogni 2,6-3,5 s. Con un archivio 48h povero,
     INCASSARE UN TIRAMISU' riaprirebbe la cassa sui DOLCI — cioe' esattamente
     il tocco in piu' che questa generazione esiste per togliere.
   Percio': l'ORDINE dei pulsanti resta quello delle battute (zero righe
   cambiate), ma l'APERTURA di partenza si legge dal LISTINO — il gruppo con
   PIU' VOCI, a parita' il primo del listino, e «Altro» non parte mai aperto se
   non e' l'unico. Il listino non si azzera mai e lo cambia solo un Admin.
   §3, §4, §9 e §3b sono le sezioni che provano proprio questo, e sono quelle
   che nessuno dei quattro disegni aveva.

   I CONTRO-CONTROLLI, verdi PRIMA e DOPO, e dichiarati tali invece di essere
   contati fra i rossi: §7b (la pizza liscia resta UN tocco), §12 (un gruppo
   solo non prende nessun pulsante) e §21 (la lente non punta a una cella
   nascosta). Un banco che si dichiara venti rossi quando ne ha diciassette
   mente sul proprio valore.

   NIENTE DATI VERI: nomi e prezzi inventati. NIENTE RETE VERA. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import crypto from "crypto";
import { apriServer } from "./servi.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 130)}`); } };
const giornoDi = (t) => { const d = new Date(t);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con almeno 2 articoli");
const artA = linea.articoli[0]; artA.qty = 200;
FM.cassaMagId = linea.id;

/* ── IL CONTESTO A: la produzione in piccolo, ma vera ──
   Pizze 20, Fritti 4, Dolci 2, piu' UNA VOCE SENZA CAMPO `gruppo` (finisce in
   «Altro»): 27 voci, 4 gruppi. Le proporzioni sono quelle vere lette da
   kv_store il 14 settembre. La voce senza gruppo serve a §10, che senza di lei
   non potrebbe mai diventare verde. */
const voce = (id, nome, gruppo, prezzo, extra = {}) => ({
  id, nome, prezzo, aliquota: 10, attivo: true, varianti: [], distinta: [],
  ...(gruppo ? { gruppo } : {}), ...extra });
const PIZZE = ["Margherita", "Marinara", "Napoli", "Capricciosa", "Diavola", "Quattro stagioni",
  "Boscaiola", "Bufala", "Ortolana", "Calzone", "Salsiccia e friarielli", "Tonno e cipolla",
  "Prosciutto e funghi", "Parmigiana", "Vegetariana", "Quattro formaggi", "Crudo e rucola",
  "Patate e salsiccia", "Focaccia", "Wurstel"];
const FRITTI = ["Supplì", "Crocchetta", "Fiore di zucca", "Olive ascolane"];
const DOLCI = ["Tiramisù", "Panna cotta"];
const listinoA = [
  ...PIZZE.map((n, i) => voce("li-p" + i, n, "Pizze", 6 + i * 0.5,
    i === 0 ? { distinta: [{ prodottoId: artA.prodottoId, qty: 1, uomId: artA.uomId }] } : {})),
  ...FRITTI.map((n, i) => voce("li-f" + i, n, "Fritti", 1.5 + i * 0.5)),
  ...DOLCI.map((n, i) => voce("li-d" + i, n, "Dolci", 4 + i)),
  voce("li-acq", "Acqua", null, 1),   // senza gruppo -> «Altro»
];

/* le battute che decidono l'ORDINE dei pulsanti. Sono fatte apposta DIVERSE
   dall'ordine per numero di voci: cosi' §3 separa le due regole invece di
   essere verde per coincidenza. Ordine atteso: Fritti, Pizze, Dolci, Altro —
   e «Altro» resta ultimo anche se e' il piu' battuto di tutti. */
const tSeed = Date.now() - 30 * 60 * 1000;
const semina = [];
const battuta = (gruppo, quante) => {
  for (let i = 0; i < quante; i++) semina.push({
    id: `vn-seme-${gruppo}-${i}`, t: tSeed - i * 1000, giorno: giornoDi(tSeed), sedeId: FM.id,
    chi: "Semina", n: semina.length + 1, metodo: "contanti", stato: "registrata", totale: 1,
    righe: [{ voceId: "x-" + gruppo, nome: "Seme " + gruppo, qty: 1, prezzo: 1, gruppo }], scarico: [],
  });
};
battuta("Fritti", 9); battuta("Pizze", 5); battuta("Dolci", 2); battuta("Altro", 20);

const conA = JSON.parse(JSON.stringify(base));
conA.listino = listinoA;
conA.vendite = semina;
conA.giornate = []; conA.clienti = []; conA.postazioni = [];
/* almeno un'aggiunta: spaziatore e fascia esistono SOLO se ce n'e' una
   (app.jsx:14525 e 14541), e §16/§17 misurano proprio quelli. Senza, il banco
   misurerebbe due elementi che non ci sono e sarebbe verde per assenza. */
conA.aggiunte = [{ id: "ag-bro", nome: "Broccoletti", prezzo: 1.5, attivo: true,
  gruppi: ["Pizze"], distinta: [] }];

/* ── CONTESTO B: un gruppo solo. Difende i sei banchi a diff zero. ── */
const conB = JSON.parse(JSON.stringify(conA));
conB.listino = [voce("li-b0", "Margherita", "Pizze", 6), voce("li-b1", "Marinara", "Pizze", 5),
  voce("li-b2", "Napoli", "Pizze", 7)];
conB.vendite = [];

/* ── CONTESTO C: il mercoledi' di riapertura. Stesso listino di A, zero
     vendite: e' il caso in cui l'ordine per battute cade tutto sull'alfabeto
     (DOLCI prima di PIZZE) e la regola vecchia avrebbe aperto i Dolci. ── */
const conC = JSON.parse(JSON.stringify(conA));
conC.vendite = [];

/* ── CONTESTO D: «Altro» e' il gruppo piu' grosso del listino. Serve a §3b:
     senza, il filtro che tiene «Altro» fuori dall'apertura non avrebbe nessun
     testimone e il suo sabotaggio resterebbe muto. ── */
const conD = JSON.parse(JSON.stringify(conA));
conD.listino = [
  voce("li-x0", "Margherita", "Pizze", 6), voce("li-x1", "Marinara", "Pizze", 5),
  voce("li-x2", "Acqua", null, 1), voce("li-x3", "Birra", null, 4),
  voce("li-x4", "Caffè", null, 1.2),
];
conD.vendite = [];

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  cassa: { id: "pr-c", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") },
  soloCassa: { id: "pr-s", nome: "SoloCassa", ruolo: "operatore", sedeId: FM.id, colore: "#8B5CF6",
    magazziniIds: [linea.id], cassa: true, soloCassa: true, pinHash: hash("3333") },
};

const srv = await apriServer();
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];

const apri = async (st0, profili, nome, pin, larghezza = 390) => {
  const st = JSON.parse(JSON.stringify(st0));
  st.profili = profili;
  const ctx = await b.newContext({ viewport: { width: larghezza, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript((j) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(st));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(srv.url); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1600);
  return { p, ctx };
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const barra = (p) => p.evaluate(() => [...document.querySelectorAll('nav[aria-label="Navigazione principale"] button')]
  .map((x) => x.textContent.trim()).filter(Boolean));
const entraInCassa = async (p) => {
  const voci = await barra(p);
  if (voci.some((v) => /battere/i.test(v))) return;
  const c = p.locator('nav[aria-label="Navigazione principale"]').getByRole("button", { name: /Cassa/i });
  if (await c.count()) { await c.first().click(); await p.waitForTimeout(1000); }
};
/* i pulsanti si leggono SEMPRE per data-gruppo, mai per nome accessibile: il
   nome porta il conto del gruppo e cambia mentre si batte */
const pulsanti = (p) => p.evaluate(() =>
  [...document.querySelectorAll("[data-gruppo]")].map((e) => e.getAttribute("data-gruppo")));
const aperti = (p) => p.evaluate(() =>
  [...document.querySelectorAll('[data-gruppo][aria-expanded="true"]')].map((e) => e.getAttribute("data-gruppo")));
const raggiungibile = async (p, nome) =>
  (await p.getByRole("button", { name: `Aggiungi ${nome}`, exact: true }).count()) > 0;
const altezzaDi = (p, sel) => p.evaluate((s) => {
  const e = document.querySelector(s);
  return e ? Math.round(e.getBoundingClientRect().height) : -1;
}, sel);
/* si scrive in rete come farebbe l'altra cassa, e poi si ASPETTA il poll:
   non si tocca lo stato dell'app da fuori (la lezione di gen-6.15) */
const scriviInRete = (p, f) => p.evaluate((src) => {
  const s = JSON.parse(localStorage.getItem("db:scp:stato:v1"));
  // eslint-disable-next-line no-new-func
  new Function("s", src)(s);
  s.rev = (s.rev || 0) + 1; s.mtime = Date.now();
  localStorage.setItem("db:scp:stato:v1", JSON.stringify(s));
  return s.rev;
}, f);

/* ═══════════ I ROSSI ═══════════ */
const A = await apri(conA, [PR.cassa, PR.admin], "OpCassa", "2222");
await entraInCassa(A.p);

console.log("\n— 1. ogni gruppo del listino ha il suo pulsante —");
await prova("§1", async () => {
  const b = await pulsanti(A.p);
  ok(b.length === 4, `quattro gruppi, quattro pulsanti — trovati ${b.length}: ${JSON.stringify(b)}`);
});

console.log("\n— 2. ne è acceso esattamente UNO —");
await prova("§2", async () => {
  const a = await aperti(A.p);
  ok(a.length === 1, `uno solo acceso — ${a.length}: ${JSON.stringify(a)}`);
});

console.log("\n— 3. l'acceso è il gruppo col PIÙ VOCI, non il più battuto —");
await prova("§3", async () => {
  /* qui le due regole si separano: l'ordine dei pulsanti comincia con FRITTI
     (9 battute contro 5), ma ad aprirsi devono essere le PIZZE (20 voci
     contro 4). Se il codice aprisse `gruppi[0]` questo sarebbe rosso. */
  const b = await pulsanti(A.p);
  ok(b[0] === "Fritti", `l'ordine dei pulsanti comincia col più BATTUTO — ${JSON.stringify(b)}`);
  const a = await aperti(A.p);
  ok(a[0] === "Pizze", `ma l'aperto è il gruppo col più VOCI — aperto ${JSON.stringify(a)}`);
  ok(await raggiungibile(A.p, "Margherita"), "e la margherita si tocca senza aprire niente");
});

console.log("\n— 3b. «Altro» non parte mai aperto, anche se è il più grosso —");
await prova("§3b", async () => {
  const D = await apri(conD, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(D.p);
  const a = await aperti(D.p);
  ok(a[0] === "Pizze",
    `«Altro» ha 3 voci contro 2, ma è il ripieno delle voci senza gruppo: si apre Pizze — aperto ${JSON.stringify(a)}`);
  await D.ctx.close();
});

console.log("\n— 4. e con le vendite vuote non cambia niente —");
await prova("§4", async () => {
  /* il mercoledì di riapertura: con `battute` vuoto l'ordine cade
     sull'alfabeto (Altro, Dolci, Fritti, Pizze) e la regola vecchia avrebbe
     aperto i DOLCI. La margherita deve restare a un tocco lo stesso. */
  const C = await apri(conC, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(C.p);
  const a = await aperti(C.p);
  ok(a[0] === "Pizze", `a vendite vuote si apre ancora Pizze — aperto ${JSON.stringify(a)}`);
  ok(await raggiungibile(C.p, "Margherita"), "e la margherita è ancora a un tocco");
  ok(!(await raggiungibile(C.p, "Tiramisù")), "mentre il tiramisù no: l'alfabeto non comanda");
  await C.ctx.close();
});

console.log("\n— 5. le celle dei gruppi chiusi non si raggiungono —");
await prova("§5", async () => {
  ok(!(await raggiungibile(A.p, "Tiramisù")), "col gruppo Pizze aperto, il tiramisù non è toccabile");
  ok(!(await raggiungibile(A.p, "Supplì")), "e nemmeno il supplì");
  ok(await raggiungibile(A.p, "Boscaiola"), "ma le altre pizze sì");
});

console.log("\n— 6. il pulsante apre davvero (prova diretta, senza aiutanti) —");
await prova("§6", async () => {
  /* questa sezione tocca il pulsante con un selettore CRUDO e non importa mai
     cassanav.mjs: è lei che difende gli otto banchi migrati dal diventare
     ciechi al difetto «il gruppo non si apre». */
  await A.p.locator('[data-gruppo="Dolci"]').first().click();
  await A.p.waitForTimeout(500);
  ok(await raggiungibile(A.p, "Tiramisù"), "toccato DOLCI, il tiramisù si raggiunge");
  ok(!(await raggiungibile(A.p, "Margherita")), "e la margherita si è chiusa: uno per volta");
  const a = await aperti(A.p);
  ok(a.length === 1 && a[0] === "Dolci", `e l'acceso è passato ai Dolci — ${JSON.stringify(a)}`);
});

console.log("\n— 13. il conto del gruppo sale sul pulsante —");
await prova("§13", async () => {
  await A.p.getByRole("button", { name: "Aggiungi Tiramisù", exact: true }).click();
  await A.p.waitForTimeout(400);
  await A.p.getByRole("button", { name: "Aggiungi Tiramisù", exact: true }).click();
  await A.p.waitForTimeout(400);
  await A.p.locator('[data-gruppo="Pizze"]').first().click();
  await A.p.waitForTimeout(500);
  const d = await A.p.evaluate(() => {
    const e = document.querySelector('[data-gruppo="Dolci"]');
    return e ? { n: e.getAttribute("data-nel-gruppo"), testo: (e.innerText || "").replace(/\s+/g, " "),
      nome: e.getAttribute("aria-label") || "" } : null;
  });
  ok(!!d && d.n === "2", `il pulsante DOLCI porta l'attributo col conto — ${d && d.n}`);
  ok(!!d && /2/.test(d.testo), `e il numero si VEDE sul pulsante — «${d && d.testo}»`);
  ok(!!d && /2 nel conto/.test(d.nome), `e lo dice anche a chi ascolta — «${d && d.nome}»`);
});

console.log("\n— 8. il gruppo resta aperto mentre si batte —");
await prova("§8", async () => {
  /* si batte dentro un gruppo SCELTO A MANO, non dentro quello di partenza:
     con le Pizze — che sono gia' aperte da sole — un difetto che azzera la
     scelta a ogni tocco sarebbe invisibile, perche' il ripiego riaprirebbe
     proprio le Pizze. Coi Fritti il difetto si vede al primo tocco. */
  const P = await apri(conA, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(P.p);
  await P.p.locator('[data-gruppo="Fritti"]').first().click();
  await P.p.waitForTimeout(500);
  for (let i = 0; i < 3; i++) {
    await P.p.getByRole("button", { name: "Aggiungi Supplì", exact: true }).click();
    await P.p.waitForTimeout(350);
  }
  const a = await aperti(P.p);
  ok(a.length === 1 && a[0] === "Fritti", `tre supplì di fila e FRITTI è ancora aperto — ${JSON.stringify(a)}`);
  ok(/3/.test(await testoDi(P.p)), "e nel conto ce ne sono tre");
  ok(!(await raggiungibile(P.p, "Margherita")),
    "e la griglia non è tornata sulle Pizze da sola: la scelta di chi batte vale più del ripiego");
  await P.ctx.close();
});

console.log("\n— 9. dopo l'incasso si torna al gruppo di partenza —");
await prova("§9", async () => {
  /* è la sezione che smaschera l'apertura appesa alle battute: incassare un
     tiramisù mette quello scontrino in testa a s.vendite, e con la regola
     vecchia la cassa si sarebbe riaperta sui DOLCI. */
  const I = await apri(conA, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(I.p);
  await I.p.locator('[data-gruppo="Dolci"]').first().click().catch(() => {});
  await I.p.waitForTimeout(500);
  await I.p.getByRole("button", { name: "Aggiungi Tiramisù", exact: true }).click().catch(() => {});
  await I.p.waitForTimeout(400);
  await I.p.getByRole("button", { name: "Incassa", exact: true }).click(); await I.p.waitForTimeout(700);
  await I.p.getByRole("button", { name: "Registra l'incasso", exact: true }).click();
  await I.p.waitForTimeout(1800);
  const a = await aperti(I.p);
  ok(a.length === 1 && a[0] === "Pizze",
    `incassato un tiramisù, la cassa torna sulle PIZZE — aperto ${JSON.stringify(a)}`);
  ok(await raggiungibile(I.p, "Margherita"), "e il cliente dopo trova la margherita a un tocco");
  await I.ctx.close();
});

console.log("\n— 10. l'ordine dei pulsanti è quello delle battute, «Altro» ultimo —");
await prova("§10", async () => {
  const b = await pulsanti(A.p);
  ok(JSON.stringify(b) === JSON.stringify(["Fritti", "Pizze", "Dolci", "Altro"]),
    `Fritti 9, Pizze 5, Dolci 2 — e «Altro», il più battuto di tutti con 20, resta ULTIMO. Trovato ${JSON.stringify(b)}`);
});

console.log("\n— 11. e non si riordina quando si apre un gruppo —");
await prova("§11", async () => {
  const prima = await pulsanti(A.p);
  await A.p.locator('[data-gruppo="Altro"]').first().click();
  await A.p.waitForTimeout(500);
  const dopo = await pulsanti(A.p);
  ok(JSON.stringify(prima) === JSON.stringify(dopo),
    `il pollice va a memoria sulla posizione: l'acceso non salta in testa — ${JSON.stringify(dopo)}`);
  await A.p.locator('[data-gruppo="Pizze"]').first().click();
  await A.p.waitForTimeout(400);
});

console.log("\n— 12. CONTRO-CONTROLLO: con un gruppo solo niente pulsanti —");
await prova("§12", async () => {
  /* verde PRIMA e DOPO. Difende i sei banchi a gruppo unico che restano a
     diff zero — e con loro il sabotaggio n.8 di gen-6.18, che vive dentro la
     cella e si prova con esauritotest. */
  const B = await apri(conB, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(B.p);
  const b = await pulsanti(B.p);
  ok(b.length === 0, `un gruppo solo non è una scelta: nessun pulsante — ${JSON.stringify(b)}`);
  for (const n of ["Margherita", "Marinara", "Napoli"])
    ok(await raggiungibile(B.p, n), `e «${n}» si tocca come sempre`);
  await B.ctx.close();
});

console.log("\n— 14. il pulsante è un bersaglio vero, e dice come sta —");
await prova("§14", async () => {
  const q = await A.p.evaluate(() => [...document.querySelectorAll("[data-gruppo]")].map((e) => ({
    g: e.getAttribute("data-gruppo"), tag: e.tagName, exp: e.getAttribute("aria-expanded"),
    nome: e.getAttribute("aria-label") || "", h: Math.round(e.getBoundingClientRect().height),
  })));
  ok(q.length > 0 && q.every((x) => x.tag === "BUTTON"), "sono bottoni veri, non div");
  ok(q.every((x) => x.exp === "true" || x.exp === "false"), "ognuno dichiara aria-expanded");
  ok(q.every((x) => x.h >= 43.5), `e sono tutti da 44 punti — ${JSON.stringify(q.map((x) => x.h))}`);
  const chiuso = q.find((x) => x.exp === "false"), aperto = q.find((x) => x.exp === "true");
  ok(!!chiuso && /^Apri /.test(chiuso.nome), `da chiuso il nome dice cosa fa — «${chiuso && chiuso.nome}»`);
  ok(!!aperto && /gruppo aperto/.test(aperto.nome), `da aperto dice come sta — «${aperto && aperto.nome}»`);
});

console.log("\n— 15. la riga dei pulsanti resta appiccicata mentre si scorre —");
await prova("§15", async () => {
  const scorso = await A.p.evaluate(async () => {
    const m = document.querySelector("main") || document.scrollingElement;
    m.scrollTop = 600; await new Promise((r) => setTimeout(r, 400));
    return m.scrollTop;
  });
  ok(scorso > 400, `il banco ha davvero scorso (${scorso}px): senza, misurerebbe se stesso`);
  const dentro = await A.p.evaluate(() => {
    const e = document.querySelector('[data-gruppo="Fritti"]');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  });
  ok(dentro === true, "e FRITTI è ancora sotto il pollice, non risalito fuori schermo");
  await A.p.evaluate(() => { const m = document.querySelector("main") || document.scrollingElement; m.scrollTop = 0; });
  await A.p.waitForTimeout(300);
});

console.log("\n— 16. cambiare gruppo non muove lo spaziatore —");
await prova("§16", async () => {
  ok((await A.p.locator('[data-spaziatore="1"]').count()) === 1,
    "lo spaziatore esiste (il seme porta un'aggiunta: senza, non ci sarebbe niente da misurare)");
  ok((await A.p.locator('[data-fascia-chiusa="1"]').count()) === 1, "e la fascia chiusa pure");
  const hP = await altezzaDi(A.p, '[data-spaziatore="1"]');
  await A.p.locator('[data-gruppo="Dolci"]').first().click(); await A.p.waitForTimeout(500);
  const hD = await altezzaDi(A.p, '[data-spaziatore="1"]');
  ok(Math.abs(hP - hD) <= 1, `20 pizze o 2 dolci, lo spaziatore è lo stesso: ${hP} contro ${hD}`);
  await A.p.locator('[data-fascia-chiusa="1"] button').first().click(); await A.p.waitForTimeout(500);
  const hDa = await altezzaDi(A.p, '[data-spaziatore="1"]');
  await A.p.locator('[data-gruppo="Pizze"]').first().click(); await A.p.waitForTimeout(500);
  const hPa = await altezzaDi(A.p, '[data-spaziatore="1"]');
  ok(Math.abs(hPa - hDa) <= 1, `e con la fascia aperta idem: ${hDa} contro ${hPa}`);
});

console.log("\n— 17. «Incassa» resta sopra la fascia anche con la pagina più corta —");
await prova("§17", async () => {
  /* TESTIMONE, non un rosso, e lo dichiaro: il caso estremo — gruppo più
     piccolo aperto, conto corto, fascia aperta — su gen-6.18 NON ESISTE,
     perché non c'è modo di aprire solo i Dolci. Sta qui perché la pagina più
     corta è nuova di questa generazione e nessun altro banco la misura.
     E si batte una voce PRIMA di misurare: «Incassa» vive dentro
     `{carrello.length > 0 && ...}` (app.jsx:14424), quindi a conto vuoto non
     esiste proprio e il controllo misurerebbe due elementi assenti. */
  const Z = await apri(conA, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(Z.p);
  await Z.p.locator('[data-gruppo="Dolci"]').first().click().catch(() => {});
  await Z.p.waitForTimeout(500);
  await Z.p.getByRole("button", { name: "Aggiungi Tiramisù", exact: true }).click().catch(() => {});
  await Z.p.waitForTimeout(500);
  const c = Z.p.locator('[data-fascia-chiusa="1"] button');
  if (await c.count()) { await c.first().click(); await Z.p.waitForTimeout(500); }
  /* ── SECONDA CORREZIONE MIA, e la dico ──
     Registrando i rossi avevo scritto la misura SENZA questa riga, e cosi'
     §17 non misurava la promessa di casa: la promessa di gen-6.09 e' «IN
     FONDO alla pagina Incassa sta sopra la fascia», e gen604test §12 la
     misura esattamente cosi' (gen604test.mjs:397, la riga prima della forma
     che mi ero copiato). Senza lo scorrimento il controllo sarebbe stato
     rosso anche su gen-6.18 per il motivo banale «Incassa e' sotto la piega»,
     cioe' un rosso che non parla del difetto. Quel che resta nuovo di questa
     generazione, e che nessun altro banco misura, e' che qui la pagina e'
     COSI' CORTA che scorrerla non sposta quasi niente: il franco lo deve fare
     tutto lo spaziatore. */
  await Z.p.evaluate(() => { const m = document.querySelector("main"); if (m) m.scrollTop = m.scrollHeight; });
  await Z.p.waitForTimeout(400);
  const m = await Z.p.evaluate(() => {
    const bi = [...document.querySelectorAll("button")].find((x) => /^Incassa$/.test(x.textContent.trim()));
    const bf = document.querySelector('[data-fascia="1"]') || document.querySelector('[data-fascia-chiusa="1"]');
    if (!bi || !bf) return null;
    const a = bi.getBoundingClientRect(), b = bf.getBoundingClientRect();
    return { fine: Math.round(a.y + a.height), fascia: Math.round(b.y) };
  });
  ok(!!m && m.fine <= m.fascia + 1,
    `«Incassa» finisce a ${m && m.fine} e la fascia comincia a ${m && m.fascia}: non ci va sotto`);
  await Z.ctx.close();
});

console.log("\n— 18. il gruppo aperto che sparisce sotto il dito —");
await prova("§18", async () => {
  /* ── APERTO DOPO IL PRIMO GIRO, e la correzione vale più della sezione ──
     Scritta così com'era, questa sezione NON raggiungeva il ripiego: non
     toccava nessun pulsante, quindi `gruppoScelto` restava `null` e il ramo
     «il gruppo scelto non c'è più» non veniva mai imboccato — il suo
     sabotaggio (S6) è uscito MUTO e aveva ragione lui. È esattamente il
     difetto che il disegno diceva di aver chiuso e non aveva chiuso.
     Adesso il cassiere SCEGLIE un gruppo (i Dolci) e l'Admin rinomina QUELLO:
     solo così `gruppi.includes(gruppoScelto)` è falso davvero, e il ripiego
     su `gPartenza` è codice vivo invece che codice morto. */
  const R = await apri(conA, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(R.p);
  await R.p.locator('[data-gruppo="Dolci"]').first().click();
  await R.p.waitForTimeout(500);
  ok((await aperti(R.p))[0] === "Dolci", "preparato: il cassiere ha SCELTO i Dolci");
  await scriviInRete(R.p, `for (const v of s.listino) if (v.gruppo === "Dolci") v.gruppo = "Dolci del giorno";`);
  await R.p.waitForTimeout(6000);
  const a = await aperti(R.p);
  ok(a.length === 1, `resta esattamente un gruppo acceso — ${JSON.stringify(a)}`);
  ok(a[0] === "Pizze", `ed è il gruppo di partenza, non quello sparito — ${JSON.stringify(a)}`);
  const celle = await R.p.locator("[data-griglia] [data-nel-conto]").count();
  ok(celle > 0, `e la griglia non è vuota: ${celle} celle`);
  await R.ctx.close();
});

console.log("\n— 19. toccare il pulsante già acceso riporta la riga in cima —");
await prova("§19", async () => {
  /* ── CORREZIONE MIA, scritta qui invece che nascosta ──
     Registrando i rossi avevo scritto «scrollTop del <main> < 40». E' un
     numero sbagliato, e lo era gia' su gen-6.18: l'ancora «torna in cima» sta
     SOPRA la riga dei pulsanti ma SOTTO l'intestazione, la riga «Oggi» e la
     pastiglia del cliente — cioe' a ~300px dall'inizio del contenuto. Portare
     l'ancora al bordo alto dello scrollport LASCIA scrollTop a ~300, ed e'
     esattamente il comportamento giusto: il cassiere torna alla PRIMA CELLA
     del gruppo, non alla targa della Cassa che non gli serve. Se il bersaglio
     fosse stato «la pagina in cima» l'ancora non sarebbe servita a niente e
     sarebbe bastato scrollTop = 0.
     Percio' si misura la cosa che il nome promette: DOVE FINISCE L'ANCORA, non
     quanto vale un contatore. Resta rosso senza codice (il pulsante non c'e')
     e resta rosso col sabotaggio S17 (senza lo scorrimento l'ancora resta a
     ~-300 e scrollTop resta 600). */
  await A.p.evaluate(async () => {
    const m = document.querySelector("main") || document.scrollingElement;
    m.scrollTop = 600; await new Promise((r) => setTimeout(r, 300));
  });
  await A.p.locator('[data-gruppo="Pizze"]').first().click();
  await A.p.waitForTimeout(600);
  const m = await A.p.evaluate(() => {
    const m = document.querySelector("main") || document.scrollingElement;
    const a = document.querySelector('[data-cima-gruppi="1"]');
    const r = document.querySelector('[data-riga-gruppi="1"]');
    return { y: m.scrollTop, mTop: m.getBoundingClientRect().top,
      aTop: a ? a.getBoundingClientRect().top : null,
      rTop: r ? r.getBoundingClientRect().top : null };
  });
  ok(m.aTop !== null && Math.abs(m.aTop - m.mTop) <= 8,
    `l'ancora della griglia torna al bordo alto: ${m.aTop} contro ${m.mTop}`);
  ok(m.y < 560, `e il banco si è davvero mosso da 600: ${m.y}px`);
  /* e la riga appiccicata non se n'è andata con lui: è il difetto vero che
     §15 ha trovato — scrollIntoView scorreva anche la scorza dell'app e
     portava <main> fuori schermo */
  ok(m.rTop !== null && m.rTop >= -1 && m.rTop < 200,
    `e la riga dei pulsanti è rimasta a schermo: ${m.rTop}`);
  ok((await aperti(A.p))[0] === "Pizze", "e Pizze resta aperto: non esiste lo stato «tutto chiuso»");
});

console.log("\n— 20. la scelta non sopravvive al cambio di stanza —");
await prova("§20", async () => {
  /* chi sta SOLO in cassa non esce mai dalla Cassa e la vista non si rimonta:
     senza un azzeramento esplicito, il gruppo scelto alle 23 sarebbe ancora lì
     a mezzogiorno del giorno dopo, sullo stesso telefono. */
  const S = await apri(conA, [PR.soloCassa, PR.admin], "SoloCassa", "3333");
  await S.p.waitForTimeout(800);
  await S.p.locator('[data-gruppo="Dolci"]').first().click().catch(() => {});
  await S.p.waitForTimeout(500);
  ok((await aperti(S.p))[0] === "Dolci", "preparato: il cassiere ha aperto i Dolci");
  const nav = S.p.locator('nav[aria-label="Navigazione principale"]');
  await nav.getByRole("button", { name: /Giornata/i }).first().click(); await S.p.waitForTimeout(800);
  await nav.getByRole("button", { name: /Battere/i }).first().click(); await S.p.waitForTimeout(800);
  const a = await aperti(S.p);
  ok(a[0] === "Pizze", `tornando a «Battere» si riparte dal gruppo di partenza — ${JSON.stringify(a)}`);
  await S.ctx.close();
});
await A.ctx.close();

console.log("\n— 7b. CONTRO-CONTROLLO: LA PIZZA LISCIA RESTA UN TOCCO —");
await prova("§7b", async () => {
  /* verde PRIMA e DOPO, e senza di lui §3 sarebbe soddisfatto anche da «non
     apro niente». Selettore CRUDO, mai l'aiutante: un verde ottenuto dopo aver
     speso un tocco sarebbe un verde per il motivo sbagliato su una promessa
     del padrone di casa. */
  const U = await apri(conA, [PR.cassa, PR.admin], "OpCassa", "2222");
  await entraInCassa(U.p);
  await U.p.getByRole("button", { name: "Aggiungi Margherita", exact: true }).click();
  await U.p.waitForTimeout(600);
  const t = await testoDi(U.p);
  ok(/Margherita/.test(t) && /€ 6,00/.test(t), "un tocco solo, e la margherita è nel conto");
  ok((await U.p.locator(".sc-foglio").count()) === 0, "e non si è aperto nessun foglio");
  await U.ctx.close();
});

console.log("\n— 21. CONTRO-CONTROLLO: la lente non punta a una cella nascosta —");
await prova("§21", async () => {
  /* la ricerca globale scorre i PRODOTTI, mai il listino, e per chi sta solo in
     cassa rende una lista vuota. Non esiste il caso — e questa sezione è il
     fermo per chi domani ci infilasse il listino. */
  /* `righeRicerca` e' una FUNCTION, non una const: cercare «const
     righeRicerca» dava -1 e la fetta veniva lunga ZERO — cioe' il controllo
     sotto passava sempre. E' la stessa trappola che gen603test si portava
     dietro da sempre, trovata a gen-6.17: una guardia sul sorgente si verifica
     subito che guardi qualcosa, se no e' decorazione. */
  const src = readFileSync(process.env.SORGENTE || "../app/app.jsx", "utf8");
  const i = src.indexOf("function righeRicerca");
  const j = src.indexOf("\nfunction ", i + 10);
  const corpo = i > 0 ? src.slice(i, j > i ? j : i + 4000) : "";
  ok(corpo.length > 100, `il corpo di righeRicerca si legge (${corpo.length} caratteri)`);
  ok(!/stato\.listino/.test(corpo), "e non scorre mai stato.listino: nessuna riga punta a una cella");
});

console.log("\n— 22. la migrazione dei banchi è completa —");
await prova("§22", async () => {
  /* sulla FONTE, come fa extratest §1: per i nomi di voce che i semi
     costruiscono, nessun «Aggiungi <nome>» crudo fuori dai tre punti
     dichiarati — quelli che devono restare crudi per contare i tocchi. */
  const CRUDI = {
    /* §7 promette «ZERO tocchi» e per dirlo legge DUE celle: la Boscaiola che
       la composizione ce l'ha e la Margherita che non ce l'ha. Avevo scritto 1
       registrando i rossi, senza aver aperto quella sezione: sono 2, e lo
       correggo qui invece di far passare la seconda dall'aiutante. */
    "gen603test.mjs": 2,
    "gen604test.mjs": 1,            // §9, la pizza liscia a UN tocco
    "postazionecassatest.mjs": 1,   // §8, idem
    /* questo banco è l'UNICO esente per intero, ed è il punto: è lui che prova
       che i pulsanti funzionano, quindi non può passare dall'aiutante che i
       pulsanti li dà per buoni. SEI letterali (§7, §8, §9, §17, §18, e il
       contro-controllo §7b) più l'aiutante `raggiungibile`: avevo scritto 6
       contandone cinque, e §17 ne ha aggiunto uno mentre lo riparavo. */
    "gruppitest.mjs": 7,
  };
  const { readdirSync } = await import("fs");
  const sospetti = [];
  for (const f of readdirSync(".").filter((x) => /test\.mjs$/.test(x))) {
    const s = readFileSync(f, "utf8");
    const n = (s.match(/"Aggiungi [A-ZÀ-Ù][^"]*"/g) || []).length
      + (s.match(/`Aggiungi \$\{/g) || []).length;
    const ammessi = CRUDI[f] || 0;
    if (n > ammessi) sospetti.push(`${f}: ${n} (ammessi ${ammessi})`);
  }
  ok(sospetti.length === 0,
    `nessun tocco crudo fuori dai punti dichiarati — ${sospetti.length ? sospetti.join(" · ") : "nessuno"}`);
});

console.log(`\nerrori di pagina: ${errs.length}${errs.length ? " — " + errs[0] : ""}`);
ok(errs.length === 0, "zero errori JavaScript in tutto il giro");
await b.close(); await srv.chiudi();
console.log(ko ? `\ngruppitest: ${ko} CONTROLLI FALLITI` : "\ngruppitest: TUTTI I CONTROLLI PASSATI");
process.exit(ko === 0 ? 0 : 1);
