/* gen-6.02: le AGGIUNTE — «la pizza più broccoletti, patate e salsiccia»
   (chiesto da Valerio il 2 settembre: «nella cassa devo poter aggiungere
   articoli al prodotto che sto vendendo»).

   IL CONTRATTO DI QUESTO BANCO (nomi fissati QUI, il codice si adegua):
   · le aggiunte sono un CATALOGO riusabile nello stato (s.aggiunte), non un
     campo della voce: «broccoletti» vale per TUTTE le Pizze, «salsiccia» per
     Pizze e Patate. Ogni aggiunta: {id "ag-…", nome, prezzo ≥ 0, attivo,
     gruppi[] (per nome, confronto con chiaveGruppo come le postazioni),
     distinta[] (stessa forma della distinta di voce)};
   · si creano in Gestione → Listino, scheda «Aggiunte» sotto «Postazioni»
     («Nuova aggiunta», matita «Modifica l'aggiunta X», mai un cestino a
     vista: veritatest §6 lo esige);
   · in Cassa la voce liscia resta UN tocco. Le aggiunte si mettono da un
     Foglio con chip a spunta multipla («Metti X» / «Leva X»);
   · la riga del conto e della vendita porta il nome COMPOSTO
     («Margherita + Broccoletti»), il prezzo UNITARIO già sommato, la
     distinta di voce ⊕ aggiunte, e lo snapshot agg:[{id,nome,prezzo}];
     stessa pizza + stesse aggiunte = qty 2, aggiunte diverse = righe diverse;
   · il motore non cambia: calcoloScarico somma la distinta composta,
     applicaStorno rimette tutto, l'aliquota è quella della voce;
   · in cucina la carta stampa «1× Margherita» e sotto «+ Broccoletti»;
   · il CSV vendite ha la colonna «Aggiunte» IN CODA (le dieci di prima
     non si spostano).

   SCRITTO PRIMA DELLE MODIFICHE. Contro gen-6.01 devono essere ROSSI:
   §1 (fonte), §2 (editor), §3 (banco), §4 (scarico), §5 (storno),
   §6 (cucina). Contro-controlli verdi anche su gen-6.01: §7 (la voce
   senza aggiunte non cambia flusso), §8 (il nome composto lo legge anche
   il telefono vecchio). */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 110)}`); } };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con almeno 2 articoli");
const [artA, artB] = linea.articoli;
artA.qty = 10; artB.qty = 6;
FM.cassaMagId = linea.id;
base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6.5, aliquota: 10, attivo: true,
    varianti: [], distinta: [{ prodottoId: artB.prodottoId, qty: 1, uomId: artB.uomId }] },
  { id: "li-spr", nome: "Spritz", gruppo: "Bere", prezzo: 5, aliquota: 10, attivo: true,
    varianti: [], distinta: [{ prodottoId: artA.prodottoId, qty: 0.5, uomId: artA.uomId }] },
  { id: "li-pan", nome: "Panino", gruppo: "Mangiare", prezzo: 8, attivo: true,
    varianti: [{ id: "va-maxi", nome: "Maxi", delta: 1.5 }], distinta: [] },
  { id: "li-acq", nome: "Acqua", prezzo: 1, attivo: true, varianti: [], distinta: [] },
];
/* il catalogo delle aggiunte. «pizze» minuscolo APPOSTA: l'abbinamento deve
   reggere sulla chiave normalizzata come per le postazioni. «Bufala» è
   SPENTA: finita in cucina, non si cancella, e il banco non la propone. */
base.aggiunte = [
  { id: "ag-bro", nome: "Broccoletti", prezzo: 1.5, attivo: true, gruppi: ["pizze"],
    distinta: [{ prodottoId: artA.prodottoId, qty: 0.5, uomId: artA.uomId }] },
  { id: "ag-sal", nome: "Salsiccia", prezzo: 2, attivo: true, gruppi: ["Pizze", "Mangiare"], distinta: [] },
  { id: "ag-buf", nome: "Bufala", prezzo: 2, attivo: false, gruppi: ["Pizze"], distinta: [] },
];
base.postazioni = [{ id: "po-piz", nome: "Pizzeria", sedeId: "", gruppi: ["Pizze"] }];
base.vendite = [];

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  opCassa: { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") },
  opZero: { id: "pr-o0", nome: "OpZero", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], pinHash: hash("2222") },
};

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (st0, profili, nome, pin) => {
  const st = JSON.parse(JSON.stringify(st0));
  st.profili = profili;
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, [JSON.stringify(st)]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1500);
  return { p, ctx };
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const foglio = (p) => p.locator(".fixed.inset-0").last();
const stato = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const giacenza = (st, art) => (st.magazzini.find((m) => m.id === linea.id)?.articoli || [])
  .find((a) => a.prodottoId === art.prodottoId)?.qty;
const incassa = async (p) => {
  await p.getByRole("button", { name: "Incassa", exact: true }).click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: "Registra l'incasso", exact: true }).click();
  await p.waitForTimeout(1400);
};
const tocca = async (p, nome, attesa = 300) => {
  await p.getByRole("button", { name: nome, exact: true }).click(); await p.waitForTimeout(attesa);
};
/* gen-6.04: la fascia degli ingredienti parte CHIUSA (Valerio: «non deve
   essere visibile in cassa se non quando richiesto»). Toccare un chip senza
   averla aperta e' cercare un tasto dietro uno sportello chiuso. Questo e' il
   gesto che fa un cassiere vero; quello che il banco pretende non cambia. */
const apriFascia = async (p) => {
  if (await p.locator('[data-fascia="1"]').count()) return;
  const pastiglia = p.locator('[data-fascia-chiusa="1"] button').first();
  if (await pastiglia.count()) { await pastiglia.click(); await p.waitForTimeout(420); }
};

/* ═══ 1. LA FONTE ═══ */
console.log("\n— 1. la fonte —");
const src = readFileSync("../app/app.jsx", "utf8");
/* mai la versione esatta (lezione di cassa2test): non più vecchia di quella
   che ha portato le aggiunte */
const ver = (src.match(/const VERSIONE = "gen-(\d+)\.(\d+)"/) || []).slice(1).map(Number);
ok(ver.length === 2 && (ver[0] > 6 || (ver[0] === 6 && ver[1] >= 2)),
  `VERSIONE è gen-${ver.join(".")}: non più vecchia di gen-6.02, che ha portato le aggiunte`);
ok(/aggiunte: \[\]/.test(src), "normalizza conosce la collezione: `aggiunte: []` accanto a postazioni");
const testaCsv = src.split("\n").find((r) => /"Prezzo unitario"/.test(r) && /"Scontrino"/.test(r)) || "";
ok(/"Scontrino",\s*"Aggiunte"/.test(testaCsv),
  "il CSV vendite ha la colonna «Aggiunte» IN CODA, dopo «Scontrino»: le dieci di prima non si spostano");

/* ═══ 2. L'EDITOR NEL LISTINO ═══ */
console.log("\n— 2. l'editor delle aggiunte nel Listino —");
const AD = await apri(base, [PR.admin], "Admin", "1234");
await prova("§2", async () => {
  await vaiA(AD.p, "Gestione");
  await AD.p.getByText("Listino", { exact: true }).first().click();
  await AD.p.waitForTimeout(900);
  const t = await testoDi(AD.p);
  ok(/Aggiunte/.test(t) && /Broccoletti/.test(t) && /Salsiccia/.test(t),
    "il Listino mostra la scheda «Aggiunte» con le aggiunte esistenti");
  ok(/spenta/i.test(t), "e la Bufala spenta è marcata «spenta», non nascosta");
  /* la card della voce dice quante aggiunte le si possono mettere: la
     Margherita ne ha 2 accese (Bufala spenta non conta) */
  ok(/2 aggiunte/.test(t), "la card «Margherita» dice «2 aggiunte»: si vede senza aprire niente");
  ok((await AD.p.locator('[aria-label^="Rimuovi "]').count()) === 0,
    "nessun cestino a vista nel Listino (contro-controllo di veritatest §6)");
  await tocca(AD.p, "Nuova aggiunta", 600);
  const inputs = AD.p.locator(".fixed.inset-0 input:visible");
  await inputs.first().fill("Patate al forno"); await AD.p.waitForTimeout(150);
  await inputs.nth(1).fill("2"); await AD.p.waitForTimeout(150);
  /* i gruppi si scelgono a spunta dall'elenco VERO del listino */
  await tocca(AD.p, "Abbina il gruppo Pizze", 200);
  await tocca(AD.p, "Salva", 900);
  const st = await stato(AD.p);
  const ag = (st.aggiunte || []).find((x) => x.nome === "Patate al forno");
  ok(!!ag && /^ag-/.test(ag.id) && ag.prezzo === 2 && (ag.gruppi || []).includes("Pizze") && ag.attivo !== false,
    "l'aggiunta «Patate al forno» è nata: id ag-…, prezzo 2, gruppo Pizze, accesa");
  ok((st.aggiunte || []).length === 4, "e le tre di prima sono ancora lì (si appende, non si sovrascrive)");
  ok(/3 aggiunte/.test(await testoDi(AD.p)), "la card «Margherita» ora dice «3 aggiunte»");
  await AD.p.getByRole("button", { name: "Modifica l'aggiunta Patate al forno", exact: true }).click();
  await AD.p.waitForTimeout(600);
  const tf = (await foglio(AD.p).innerText()).replace(/\s+/g, " ");
  ok(/Togli questa aggiunta/.test(tf), "la matita riapre l'aggiunta col suo «Togli questa aggiunta»");
  ok(/distinta/i.test(tf) && /ingrediente/i.test(tf),
    "e il Foglio ha la distinta: cosa esce dal magazzino a ogni aggiunta");
  /* «senza gruppi non vale per niente»: si rifiuta come per le postazioni */
  await tocca(AD.p, "Stacca il gruppo Pizze", 200);
  await tocca(AD.p, "Salva", 700);
  const st2 = await stato(AD.p);
  ok(((st2.aggiunte || []).find((x) => x.nome === "Patate al forno")?.gruppi || []).includes("Pizze"),
    "senza nessun gruppo il salvataggio si rifiuta: l'aggiunta tiene ancora «Pizze»");
});
await AD.ctx.close();

/* ═══ 3. IL BANCO: la riga del conto si tocca per aggiungere ═══ */
console.log("\n— 3. il banco: «la pizza più broccoletti» —");
const C = await apri(base, [PR.opCassa, PR.admin], "OpCassa", "2222");
await prova("§3", async () => {
  await vaiA(C.p, "Cassa");
  /* la voce liscia resta UN tocco: la cella non apre niente, come in
     gen-6.01. È il 90% delle battute del sabato e non deve rallentare. */
  await tocca(C.p, "Aggiungi Margherita", 250);
  await tocca(C.p, "Aggiungi Margherita", 350);
  ok(/Totale € 13,00/.test(await testoDi(C.p)),
    "due tocchi sulla cella = due Margherite, nessun foglio di mezzo: € 13,00");
  /* 02/09, gen-6.03: qui si apriva un Foglio dal nome della riga e ci
     volevano quattro tocchi. Adesso l'ingrediente si tocca nella fascia,
     e l'ordine non conta piu' (parole di Valerio). Il banco prova la
     stessa INTENZIONE — due margherite, una coi broccoletti — col gesto
     nuovo: il collaudo di gen-6.03 (gen603test.mjs) prova il resto. */
  /* gen-6.04: i chip si leggono a fascia APERTA. Prima questa riga guardava
     una barra che era sempre li'; adesso va chiesta, come fa il cassiere. */
  await apriFascia(C.p);
  const tf = await testoDi(C.p);
  ok(/Broccoletti/.test(tf) && /Salsiccia/.test(tf),
    "la fascia porta le aggiunte del gruppo «Pizze» (anche con «pizze» minuscolo nel catalogo)");
  ok(!/Bufala/.test(tf), "e la Bufala spenta non si propone: finita è finita");
  await apriFascia(C.p);
  await tocca(C.p, "Metti Broccoletti su Margherita", 500);
  const t3 = await testoDi(C.p);
  ok((await C.p.getByRole("button", { name: "Aumenta Margherita", exact: true }).count()) === 1
    && (await C.p.getByRole("button", { name: "Aumenta Margherita + Broccoletti", exact: true }).count()) === 1,
    "il conto ha DUE righe: «Margherita» e «Margherita + Broccoletti»");
  ok(/Totale € 14,50/.test(t3), "e il totale è € 14,50: 6,50 + 8,00");
  /* la seconda passa nella riga composta: stessa pizza + stesse aggiunte =
     una riga sola con qty 2, non due righe gemelle */
  await tocca(C.p, "Lavora su Margherita", 400);
  await apriFascia(C.p);
  await tocca(C.p, "Metti Broccoletti su Margherita", 500);
  const t3b = await testoDi(C.p);
  ok((await C.p.getByRole("button", { name: "Aumenta Margherita", exact: true }).count()) === 0,
    "la riga liscia sparisce quando l'ultima unità se ne va");
  ok(/Totale € 16,00/.test(t3b), "e le due composte si fondono in una riga da 2: € 16,00");
});

/* ═══ 4. VARIANTI E AGGIUNTE INSIEME ═══ */
console.log("\n— 4. «Panino Maxi con salsiccia»: le due cose convivono —");
await prova("§4", async () => {
  await tocca(C.p, "Aggiungi Panino", 600);
  const tf = (await foglio(C.p).innerText()).replace(/\s+/g, " ");
  /* contro-controllo VERDE anche oggi: senza spuntare niente il foglio dice
     quello che ha sempre detto (cassatest §2b e cassa2test §5 lo cercano) */
  ok(/Così com'è · € 8,00/.test(tf) && /Maxi · € 9,50/.test(tf),
    "§4 contro-controllo: senza aggiunte spuntate il foglio è quello di sempre");
  await apriFascia(C.p);
  await tocca(C.p, "Metti Salsiccia", 300);
  const tf2 = (await foglio(C.p).innerText()).replace(/\s+/g, " ");
  ok(/Con Salsiccia · € 10,00/.test(tf2) && /Maxi \+ Salsiccia · € 11,50/.test(tf2),
    "spuntata la salsiccia, TUTTI i tasti si aggiornano: «Maxi + Salsiccia · € 11,50»");
  await tocca(C.p, "Maxi + Salsiccia · € 11,50", 500);
  /* 02/09, gen-6.03: la giunzione del formato e' uno SPAZIO — prima del
     primo «+» c'e' il piatto, dopo ogni «+» quello che ci hai messo sopra */
  const tPan = await testoDi(C.p);
  ok(/Panino Maxi/.test(tPan) && /\+ Salsiccia/.test(tPan),
    "nel conto la riga dice tutto: «Panino Maxi» e sotto «+ Salsiccia»");
});

/* ═══ 5. L'INCASSO: la riga congelata e il magazzino che scala ═══ */
console.log("\n— 5. lo scarico, con la contro-prova numerica —");
let dopoVendita = null;
await prova("§5", async () => {
  await incassa(C.p);
  const st = await stato(C.p);
  dopoVendita = st;
  const v = (st.vendite || [])[0];
  const rM = (v?.righe || []).find((r) => r.nome === "Margherita + Broccoletti");
  ok(!!rM, "la riga porta il nome COMPOSTO: «Margherita + Broccoletti»");
  ok(rM?.qty === 2 && rM?.prezzo === 8, "prezzo unitario già sommato (€ 8,00) e quantità 2");
  ok(rM?.gruppo === "Pizze" && rM?.aliquota === 10,
    "gruppo e IVA restano quelli della VOCE: la comanda va alla Pizzeria, l'aggiunta segue l'aliquota della pizza");
  ok(rM?.agg?.length === 1 && rM.agg[0].id === "ag-bro" && rM.agg[0].nome === "Broccoletti" && rM.agg[0].prezzo === 1.5,
    "e lo snapshot dell'aggiunta viaggia con la riga: {id, nome, prezzo}");
  const rP = (v?.righe || []).find((r) => r.nome === "Panino Maxi + Salsiccia");
  ok(rP?.prezzo === 11.5 && rP?.varianteId === "va-maxi" && rP?.agg?.[0]?.nome === "Salsiccia",
    "la riga con variante E aggiunta porta tutti e due: € 11,50, va-maxi, Salsiccia");
  ok(v?.totale === 27.5, "totale dello scontrino € 27,50 (16,00 + 11,50)");
  const qA = (v?.scarico || []).find((x) => x.prodottoId === artA.prodottoId)?.quanto;
  const qB = (v?.scarico || []).find((x) => x.prodottoId === artB.prodottoId)?.quanto;
  ok(qA === 1, `lo scarico dell'ingrediente dell'AGGIUNTA c'è: 2 × 0,5 = 1 (letto ${qA})`);
  ok(qB === 2, `e quello della voce resta giusto: 2 × 1 = 2 (letto ${qB})`);
  ok(giacenza(st, artA) === 9 && giacenza(st, artB) === 4,
    `il magazzino di cassa è sceso davvero: ${giacenza(st, artA)} e ${giacenza(st, artB)} (erano 10 e 6)`);
  const mov = (st.movimenti || []).filter((m) => m.causale === "vendita");
  ok(mov.length === 2, `un movimento per prodotto, non uno per riga: ${mov.length}`);
});

/* ═══ 6. LA CUCINA: «+ Broccoletti» sotto la pizza ═══ */
console.log("\n— 6. la carta in cucina —");
await prova("§6", async () => {
  const K = await apri(dopoVendita || base, [PR.opZero], "OpZero", "2222");
  await vaiA(K.p, "Comande");
  await K.p.getByRole("button", { name: "Siediti a Pizzeria" }).click();
  await K.p.waitForTimeout(500);
  const t = await testoDi(K.p);
  ok(/2× Margherita/.test(t), "la Pizzeria vede «2× Margherita»: il nome base, non un nome lungo che si tronca");
  ok(await K.p.getByText("+ Broccoletti", { exact: true }).first().isVisible(),
    "e sotto, su una riga sua, «+ Broccoletti»: il pizzaiolo legge l'aggiunta senza rileggere la riga");
  await K.p.getByRole("button", { name: /Fatta la comanda/ }).first().click();
  await K.p.waitForTimeout(900);
  ok(/2× Margherita \+ Broccoletti/.test(await testoDi(K.p)),
    "nella striscia delle «Fatte» torna il nome composto: una riga sola deve dire tutto");
  await K.ctx.close();
});

/* ═══ 7. LO STORNO RIMETTE ANCHE L'AGGIUNTA ═══ */
console.log("\n— 7. lo storno —");
await prova("§7", async () => {
  await tocca(C.p, "Ultime vendite", 600);
  await C.p.getByRole("button", { name: /^Storna la vendita delle/ }).first().click();
  await C.p.waitForTimeout(600);
  await C.p.locator("input:visible").first().fill("prova delle aggiunte"); await C.p.waitForTimeout(200);
  await C.p.locator("input:visible").nth(1).fill("1234"); await C.p.waitForTimeout(200);
  await tocca(C.p, "Conferma lo storno", 1600);
  const st = await stato(C.p);
  ok(giacenza(st, artA) === 10 && giacenza(st, artB) === 6,
    `lo storno rimette anche l'ingrediente dell'aggiunta: ${giacenza(st, artA)} e ${giacenza(st, artB)}`);
  const contro = (st.vendite || []).find((v) => v.stato === "storno" || v.totale === -27.5);
  ok(!!contro && (contro.righe || []).some((r) => (r.agg || []).length),
    "e la riga contraria porta ancora le aggiunte: lo storno non le perde per strada");
});
await C.ctx.close();

/* ═══ 8. LA VOCE SENZA AGGIUNTE NON CAMBIA (contro-controllo verde oggi) ═══ */
console.log("\n— 8. quello che NON deve cambiare —");
const Z = await apri(base, [PR.opCassa], "OpCassa", "2222");
await prova("§8", async () => {
  await vaiA(Z.p, "Cassa");
  await tocca(Z.p, "Aggiungi Spritz", 400);
  ok(/Totale € 5,00/.test(await testoDi(Z.p)), "lo Spritz (gruppo «Bere», nessuna aggiunta) entra con un tocco solo");
  /* 02/09: l'etichetta vecchia («Aggiunte per Spritz») in gen-6.03 non
     esiste piu' e questo controllo sarebbe rimasto verde PER CASO — cioe'
     avrebbe smesso di provare la cosa per cui esiste. Adesso cerca
     l'etichetta nuova. */
  ok((await Z.p.getByRole("button", { name: /^Lavora su Spritz/ }).count()) === 0,
    "e la sua riga NON diventa un bottone: niente porte che non aprono niente");
  await tocca(Z.p, "Aggiungi Acqua", 400);
  ok(/Totale € 6,00/.test(await testoDi(Z.p)), "l'Acqua senza gruppo entra anche lei con un tocco: € 6,00");
});
await Z.ctx.close();

await b.close();
ok(errs.length === 0, "zero errori JavaScript in tutto il giro" + (errs.length ? " — " + errs[0] : ""));
console.log(ko === 0 ? "\nextratest: tutti i controlli passati" : `\nextratest: ${ko} controlli KO`);
process.exit(ko === 0 ? 0 : 1);
