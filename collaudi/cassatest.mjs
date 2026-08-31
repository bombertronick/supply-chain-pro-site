/* gen-5.96: la Cassa — la catena [cliente → cassa → scarico → riordino].

   CHIESTO DA VALERIO il 31 agosto (il «Protocollo ERP/POS»): la catena
   completa di vendita dentro l'app vera. Tradotto con le decisioni del
   piano: quarto interruttore «cassa» sul profilo (default spento), listino
   di vendita SOLO admin, vendite mai cancellate, scarico dal MAGAZZINO DI
   CASSA designato della sede (anche sotto zero: il negativo al banco è
   informazione, il fallback su un altro magazzino è una bugia che falsifica
   il riordino due volte), tetti dal giorno uno (48 ore / 300 righe) coi
   totali che sopravvivono in s.giornate.

   SCRITTO PRIMA DELLE MODIFICHE. Contro gen-5.95 devono essere ROSSI:
   §2 (tutta la vendita), §2b (variante), §2c (omaggio), §3 (admin dalla
   lente), §5 (Cassa scavalca Plancia + Plancia resta dalla lente),
   §6 (tetti), §7 (sotto zero e problemi). §1 è il contro-controllo (verde
   anche su gen-5.95: chi non ha la cassa non la vede) e §4 difende che la
   cassa NON regali correzioni od ordini. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
/* una sezione che esplode (una voce di barra che non esiste ancora) deve
   CONTARE come rossa, non ammazzare il giro: il primo giro si fa su
   gen-5.95 apposta per registrare i rossi */
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 90)}`); } };

const giornoDi = (t) => { const d = new Date(t);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con almeno 2 articoli");
const artA = linea.articoli[0], artB = linea.articoli[1];
const pA = base.prodotti.find((p) => p.id === artA.prodottoId);
const pB = base.prodotti.find((p) => p.id === artB.prodottoId);
const pGhost = base.prodotti.find((p) => !linea.articoli.some((a) => a.prodottoId === p.id));
artA.qty = 10; artB.qty = 6;
FM.cassaMagId = linea.id;
/* il listino del banco: distinte nell'UdM DELLA CASELLA, così lo scarico
   atteso è un numero secco senza conversioni di mezzo */
base.listino = [
  { id: "li-spr", nome: "Spritz", gruppo: "Bere", prezzo: 5, aliquota: 10, attivo: true,
    varianti: [], distinta: [{ prodottoId: artA.prodottoId, qty: 0.5, uomId: artA.uomId }] },
  { id: "li-pan", nome: "Panino", gruppo: "Mangiare", prezzo: 8, attivo: true,
    varianti: [{ id: "va-maxi", nome: "Maxi", delta: 1.5 }],
    distinta: [{ prodottoId: artB.prodottoId, qty: 1, uomId: artB.uomId }] },
  { id: "li-oma", nome: "Assaggio", gruppo: "Mangiare", prezzo: 0, attivo: true, varianti: [], distinta: [] },
  { id: "li-gho", nome: "Tagliere", gruppo: "Mangiare", prezzo: 12, attivo: true, varianti: [],
    distinta: [{ prodottoId: pGhost.id, qty: 1, uomId: pGhost.uomBase }] },
];

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  opZero: { id: "pr-o0", nome: "OpZero", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], pinHash: hash("2222") },
  opCassa: { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") },
  opCorrCassa: { id: "pr-occ", nome: "OpDoppio", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], correzioni: true, cassa: true, pinHash: hash("2222") },
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
const testoNav = async (p) => (await p.locator('nav[aria-label="Navigazione principale"]').innerText()).replace(/\s+/g, " ");
const stato = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const lente = async (p, testo) => {
  await p.getByRole("button", { name: "Cerca un prodotto o una funzione" }).click();
  await p.waitForTimeout(400);
  await p.locator("input:visible").first().fill(testo); await p.waitForTimeout(700);
};
const chiudiLente = async (p) => {
  await p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
  await p.waitForTimeout(400);
};
const incassa = async (p, metodo) => {
  await p.getByRole("button", { name: "Incassa", exact: true }).click(); await p.waitForTimeout(600);
  if (metodo !== "Contanti") { await p.getByRole("button", { name: metodo, exact: true }).click(); await p.waitForTimeout(250); }
  await p.getByRole("button", { name: "Registra l'incasso", exact: true }).click();
  await p.waitForTimeout(1400);
};

/* ═══ 1. CHI NON HA LA CASSA NON LA VEDE (contro-controllo, verde anche su 5.95) ═══ */
console.log("\n— 1. operatore senza «cassa»: nessuna porta —");
const O0 = await apri(base, [PR.opZero], "OpZero", "2222");
ok(!/Cassa/.test(await testoNav(O0.p)), "la Cassa non è in barra per chi non ce l'ha");
await lente(O0.p, "vendita");
ok(!/Battere una vendita/.test(await testoDi(O0.p)), "e la lente non offre «Battere una vendita»");
await chiudiLente(O0.p);
await O0.ctx.close();

/* ═══ 2. CON «CASSA»: tap → carrello → incasso → LA GIACENZA SCALA ═══ */
console.log("\n— 2. operatore con «cassa»: la vendita fino in fondo —");
const OK1 = await apri(base, [PR.opCassa], "OpCassa", "2222");
await prova("§2", async () => {
  const nav = await testoNav(OK1.p);
  ok(/Cassa/.test(nav), "la Cassa è in barra");
  ok(!/Plancia/.test(nav), "e la Plancia no: la cassa da sola non dà comandi di magazzino");
  await vaiA(OK1.p, "Cassa");
  const t0 = await testoDi(OK1.p);
  ok(/Spritz/.test(t0) && /Panino/.test(t0), "la griglia mostra le voci del listino");
  await OK1.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await OK1.p.waitForTimeout(250);
  await OK1.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await OK1.p.waitForTimeout(350);
  ok(/€ 10,00/.test(await testoDi(OK1.p)), "due Spritz nel carrello: totale € 10,00");
  await incassa(OK1.p, "Contanti");
  const st = await stato(OK1.p);
  const v = (st.vendite || [])[0];
  ok(!!v && v.totale === 10 && v.metodo === "contanti" && v.stato === "registrata",
    "la vendita è registrata: € 10, contanti, stato «registrata»");
  ok(!!v && v.righe.length === 1 && v.righe[0].qty === 2 && v.righe[0].prezzo === 5,
    "con la riga snapshottata: 2 × Spritz a € 5 congelati");
  const aA = st.magazzini.find((m) => m.id === linea.id).articoli.find((a) => a.prodottoId === artA.prodottoId);
  ok(Math.abs(aA.qty - 9) < 1e-9, `CONTRO-PROVA: la giacenza è scesa 10 → 9 (distinta 0,5 × 2) — vale ${aA.qty}`);
  ok((st.movimenti || []).some((mv) => mv.causale === "vendita" && Math.abs(mv.delta + 1) < 1e-9),
    "e c'è il movimento con causale «vendita», delta −1");
  const g = (st.giornate || []).find((x) => x.giorno === giornoDi(Date.now()) && x.sedeId === FM.id);
  ok(!!g && g.totale === 10 && g.nVendite === 1 && g.metodi?.contanti === 10,
    "la giornata di oggi conta: € 10, 1 vendita, contanti € 10");
});

/* ═══ 2b. LA VARIANTE ═══ */
console.log("\n— 2b. la variante: prezzo congelato con il delta —");
await prova("§2b", async () => {
  await OK1.p.getByRole("button", { name: "Aggiungi Panino" }).click(); await OK1.p.waitForTimeout(500);
  await OK1.p.getByRole("button", { name: /Maxi/ }).first().click(); await OK1.p.waitForTimeout(400);
  ok(/Panino \+ Maxi/.test(await testoDi(OK1.p)), "nel carrello si legge «Panino + Maxi»");
  await incassa(OK1.p, "Carta");
  const st = await stato(OK1.p);
  const v = (st.vendite || [])[0];
  ok(!!v && v.righe[0].prezzo === 9.5 && v.metodo === "carta",
    "prezzo congelato € 9,50 (8 + 1,50), pagata con carta");
  const aB = st.magazzini.find((m) => m.id === linea.id).articoli.find((a) => a.prodottoId === artB.prodottoId);
  ok(Math.abs(aB.qty - 5) < 1e-9, `e la giacenza del Panino scala 6 → 5 — vale ${aB.qty}`);
});

/* ═══ 2c. L'OMAGGIO ═══ */
console.log("\n— 2c. l'omaggio a prezzo zero si registra —");
await prova("§2c", async () => {
  await OK1.p.getByRole("button", { name: "Aggiungi Assaggio" }).click(); await OK1.p.waitForTimeout(350);
  await incassa(OK1.p, "Contanti");
  const st = await stato(OK1.p);
  const v = (st.vendite || [])[0];
  ok(!!v && v.totale === 0 && v.righe[0].nome === "Assaggio",
    "totale € 0: registrata lo stesso — un omaggio è una vendita, non un errore");
});

/* ═══ 4. LA CASSA NON REGALA ALTRO ═══ */
console.log("\n— 4. la cassa da sola non dà correzioni né ordini —");
await prova("§4", async () => {
  await vaiA(OK1.p, "Magazzini");
  await OK1.p.getByText(linea.nome, { exact: true }).first().click(); await OK1.p.waitForTimeout(1100);
  ok((await OK1.p.locator('[aria-label^="Rettifica "]').count()) === 0, "nel dettaglio niente matita di rettifica");
  ok((await OK1.p.locator('[aria-label^="Scarto "]').count()) === 0, "e niente scarto");
  await OK1.p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
  await OK1.p.waitForTimeout(400);
  await vaiA(OK1.p, "Ordini");
  ok(!/Ricalcola/.test(await testoDi(OK1.p)), "in Ordini niente Ricalcola");
});
await OK1.ctx.close();

/* ═══ 3. L'ADMIN DALLA LENTE ═══ */
console.log("\n— 3. l'admin arriva in Cassa dalla lente (la sua barra non cambia) —");
const A = await apri(base, [PR.admin], "Admin", "1234");
await prova("§3", async () => {
  ok(!/Cassa/.test(await testoNav(A.p)), "la barra dell'admin resta com'è (cinque voci)");
  await lente(A.p, "vendita");
  const trovato = await A.p.getByText("Battere una vendita", { exact: true }).count();
  ok(trovato > 0, "la lente gli offre «Battere una vendita»");
  await A.p.getByText("Battere una vendita", { exact: true }).first().click();
  await A.p.waitForTimeout(1200);
  await A.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await A.p.waitForTimeout(350);
  await incassa(A.p, "Contanti");
  const st = await stato(A.p);
  const v = (st.vendite || [])[0];
  ok(!!v && v.sedeId === FM.id, "e batte una vendita sulla sede scelta");
});
await A.ctx.close();

/* ═══ 5. CASSA SCAVALCA PLANCIA, MA LA PLANCIA NON SPARISCE ═══ */
console.log("\n— 5. correzioni+cassa: in barra vince la Cassa, la Plancia resta dalla lente —");
const D = await apri(base, [PR.opCorrCassa], "OpDoppio", "2222");
await prova("§5", async () => {
  const nav = await testoNav(D.p);
  ok(/Cassa/.test(nav) && !/Plancia/.test(nav),
    "in barra c'è la Cassa e non la Plancia (cinque posti, misurati in gen-5.52)");
  await lente(D.p, "colpo");
  ok((await D.p.getByText("La rete a colpo d'occhio", { exact: true }).count()) > 0,
    "la lente offre ancora la Plancia a chi ha le correzioni");
  await D.p.getByText("La rete a colpo d'occhio", { exact: true }).first().click();
  await D.p.waitForTimeout(1200);
  ok(!/Questa sezione non è del tuo profilo/.test(await testoDi(D.p)),
    "e la porta si apre: il gate non lo blocca");
});
await D.ctx.close();

/* ═══ 6. I TETTI: 48 ORE / 300 RIGHE, E LE GIORNATE SOPRAVVIVONO ═══ */
console.log("\n— 6. i tetti delle vendite, coi totali che restano —");
await prova("§6", async () => {
  const st6 = JSON.parse(JSON.stringify(base));
  const ora = Date.now(), vecchio = ora - 72 * 3600000;
  st6.vendite = [];
  for (let i = 0; i < 299; i++) st6.vendite.push({ id: `vn-r${i}`, t: ora - 3600000, giorno: giornoDi(ora),
    sedeId: FM.id, chi: "X", righe: [{ voceId: "li-spr", nome: "Spritz", qty: 1, prezzo: 5 }],
    totale: 5, metodo: "contanti", stato: "registrata", scarico: [] });
  for (let i = 0; i < 30; i++) st6.vendite.push({ id: `vn-v${i}`, t: vecchio, giorno: giornoDi(vecchio),
    sedeId: FM.id, chi: "X", righe: [{ voceId: "li-spr", nome: "Spritz", qty: 1, prezzo: 5 }],
    totale: 5, metodo: "contanti", stato: "registrata", scarico: [] });
  st6.giornate = [{ id: giornoDi(vecchio) + "|" + FM.id, giorno: giornoDi(vecchio), sedeId: FM.id,
    totale: 150, nVendite: 30, nStorni: 0, metodi: { contanti: 150, carta: 0, altro: 0 } }];
  const S = await apri(st6, [PR.opCassa], "OpCassa", "2222");
  await vaiA(S.p, "Cassa");
  await S.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await S.p.waitForTimeout(350);
  await incassa(S.p, "Contanti");
  const st = await stato(S.p);
  ok((st.vendite || []).length <= 300, `il tetto tiene: ${st.vendite.length} righe (≤ 300)`);
  ok(!(st.vendite || []).some((v) => v.t <= vecchio + 1000), "le vendite oltre le 48 ore sono uscite");
  const gv = (st.giornate || []).find((x) => x.giorno === giornoDi(vecchio));
  ok(!!gv && gv.totale === 150, "ma la giornata vecchia è ancora lì, col suo totale: € 150");
  await S.ctx.close();
});

/* ═══ 7. SOTTO ZERO E PROBLEMI: LA CASSA NON SI BLOCCA E NON MENTE ═══ */
console.log("\n— 7. il banco basso va sotto zero; l'ingrediente assente non si scala di nascosto —");
await prova("§7", async () => {
  const st7 = JSON.parse(JSON.stringify(base));
  const l7 = st7.magazzini.find((m) => m.id === linea.id);
  l7.articoli.find((a) => a.prodottoId === artA.prodottoId).qty = 0.4;
  const S = await apri(st7, [PR.opCassa], "OpCassa", "2222");
  await vaiA(S.p, "Cassa");
  await S.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await S.p.waitForTimeout(350);
  await incassa(S.p, "Contanti");
  let st = await stato(S.p);
  const aA = st.magazzini.find((m) => m.id === linea.id).articoli.find((a) => a.prodottoId === artA.prodottoId);
  ok(Math.abs(aA.qty + 0.1) < 1e-9,
    `la vendita passa e la giacenza dice il vero: −0,1 (vale ${aA.qty}) — il negativo è un invito a contare`);
  await S.p.getByRole("button", { name: "Aggiungi Tagliere" }).click(); await S.p.waitForTimeout(350);
  await incassa(S.p, "Contanti");
  st = await stato(S.p);
  const v = (st.vendite || [])[0];
  ok(!!v && (v.problemi || []).length >= 1,
    "il Tagliere ha l'ingrediente fuori dal magazzino di cassa: la vendita passa MA porta il problema scritto");
  ok(!(st.movimenti || []).some((mv) => mv.causale === "vendita" && mv.prodottoId === pGhost.id),
    "e nessun movimento finto: quello che non si può scalare non si scala di nascosto");
  await S.ctx.close();
});

/* ═══ 8. LO STORNO (gen-5.97, FASE B del piano approvato) ═══
   Mai una gomma: riga contraria, motivo obbligatorio, PIN di un admin se chi
   storna non lo e'. Contro gen-5.96 devono essere ROSSI §8a/§8b/§8d e §9. */
console.log("\n— 8. lo storno: riga contraria, mai una gomma —");
await prova("§8a", async () => {
  const A8 = await apri(base, [PR.admin], "Admin", "1234");
  await lente(A8.p, "vendita");
  await A8.p.getByText("Battere una vendita", { exact: true }).first().click();
  await A8.p.waitForTimeout(1200);
  await A8.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await A8.p.waitForTimeout(250);
  await A8.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await A8.p.waitForTimeout(350);
  await incassa(A8.p, "Contanti");
  await A8.p.getByRole("button", { name: /^Storna la vendita/ }).first().click();
  await A8.p.waitForTimeout(600);
  await A8.p.locator("input:visible").first().fill("prova del banco"); await A8.p.waitForTimeout(200);
  await A8.p.getByRole("button", { name: "Conferma lo storno", exact: true }).click();
  await A8.p.waitForTimeout(1400);
  const st = await stato(A8.p);
  const orig = (st.vendite || []).find((v) => v.totale === 10 && v.stato === "stornata");
  const contro = (st.vendite || []).find((v) => v.totale === -10);
  ok(!!orig, "l'originale resta, marcata «stornata» — non cancellata");
  ok(!!contro && contro.motivo === "prova del banco" && contro.origId === orig?.id,
    "e c'è la riga contraria: −€ 10, col motivo e il riferimento all'originale");
  const aA = st.magazzini.find((m) => m.id === linea.id).articoli.find((a) => a.prodottoId === artA.prodottoId);
  ok(Math.abs(aA.qty - 10) < 1e-9, `CONTRO-PROVA: la giacenza è tornata a 10 — vale ${aA.qty}`);
  ok((st.movimenti || []).some((mv) => mv.causale === "storno" && Math.abs(mv.delta - 1) < 1e-9),
    "col movimento causale «storno», delta +1");
  const g = (st.giornate || []).find((x) => x.giorno === giornoDi(Date.now()) && x.sedeId === FM.id);
  ok(!!g && Math.abs(g.totale) < 1e-9 && g.nStorni === 1 && Math.abs(g.metodi?.contanti || 0) < 1e-9,
    "e la giornata torna a zero: € 0, 1 storno, contanti € 0");
  await A8.ctx.close();
});

console.log("\n— 8b. chi non è admin storna SOLO col PIN di un admin —");
await prova("§8b", async () => {
  const O8 = await apri(base, [PR.opCassa, PR.admin], "OpCassa", "2222");
  await vaiA(O8.p, "Cassa");
  await O8.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await O8.p.waitForTimeout(350);
  await incassa(O8.p, "Contanti");
  await O8.p.getByRole("button", { name: /^Storna la vendita/ }).first().click();
  await O8.p.waitForTimeout(600);
  await O8.p.locator("input:visible").first().fill("errore di battitura"); await O8.p.waitForTimeout(200);
  const pinCampo = O8.p.locator("input:visible").nth(1);
  await pinCampo.fill("9999"); await O8.p.waitForTimeout(200);
  await O8.p.getByRole("button", { name: "Conferma lo storno", exact: true }).click();
  await O8.p.waitForTimeout(900);
  let st = await stato(O8.p);
  ok(!(st.vendite || []).some((v) => v.stato === "stornata"),
    "col PIN sbagliato NON succede niente: l'originale resta «registrata»");
  await pinCampo.fill("1234"); await O8.p.waitForTimeout(200);
  await O8.p.getByRole("button", { name: "Conferma lo storno", exact: true }).click();
  await O8.p.waitForTimeout(1400);
  st = await stato(O8.p);
  const contro = (st.vendite || []).find((v) => v.totale < 0);
  ok(!!contro && contro.autorizzataDa === "Admin",
    "col PIN giusto lo storno passa e porta scritto CHI l'ha autorizzato");
  await O8.ctx.close();
});

console.log("\n— 8d. senza motivo non si storna —");
await prova("§8d", async () => {
  const M8 = await apri(base, [PR.admin], "Admin", "1234");
  await lente(M8.p, "vendita");
  await M8.p.getByText("Battere una vendita", { exact: true }).first().click();
  await M8.p.waitForTimeout(1200);
  await M8.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await M8.p.waitForTimeout(350);
  await incassa(M8.p, "Contanti");
  await M8.p.getByRole("button", { name: /^Storna la vendita/ }).first().click();
  await M8.p.waitForTimeout(600);
  await M8.p.getByRole("button", { name: "Conferma lo storno", exact: true }).click();
  await M8.p.waitForTimeout(700);
  const st = await stato(M8.p);
  ok(!(st.vendite || []).some((v) => v.stato === "stornata"),
    "senza motivo lo storno non parte: uno storno senza perché non si può rileggere");
  await M8.ctx.close();
});

/* ═══ 9. IL REPORT DI GIORNATA (gen-5.97) ═══ */
console.log("\n— 9. il report di giornata: totali, metodi e scorporo IVA informativo —");
await prova("§9", async () => {
  const R9 = await apri(base, [PR.opCassa], "OpCassa", "2222");
  await vaiA(R9.p, "Cassa");
  await R9.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await R9.p.waitForTimeout(250);
  await R9.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await R9.p.waitForTimeout(350);
  await incassa(R9.p, "Contanti");
  await R9.p.getByRole("button", { name: "Aggiungi Panino" }).click(); await R9.p.waitForTimeout(500);
  await R9.p.getByRole("button", { name: /Maxi/ }).first().click(); await R9.p.waitForTimeout(400);
  await incassa(R9.p, "Carta");
  await R9.p.getByRole("button", { name: "Report di giornata", exact: true }).click();
  await R9.p.waitForTimeout(700);
  const t = await testoDi(R9.p);
  ok(/€ 19,50/.test(t), "il report dice il totale vero: € 19,50 (10 + 9,50)");
  ok(/[Cc]ontanti/.test(t) && /€ 10,00/.test(t) && /[Cc]arta/.test(t) && /€ 9,50/.test(t),
    "diviso per metodo: contanti € 10, carta € 9,50");
  ok(/IVA 10%/.test(t) && /[Ii]mponibile/.test(t), "con lo scorporo IVA per aliquota (lo Spritz è al 10%)");
  ok(/registratore telematico/.test(t), "e la frase onesta: lo scontrino fiscale resta al registratore telematico");
  ok((await R9.p.getByRole("button", { name: "Copia il report", exact: true }).count()) > 0,
    "col tasto per copiarlo");
  await R9.ctx.close();
});

console.log(`\nerrori di pagina: ${errs.length}`); errs.slice(0, 3).forEach((e) => console.log("   ", e));
if (errs.length) ko++;
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
