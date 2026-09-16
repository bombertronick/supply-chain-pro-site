/* gen-5.95: le modifiche e la gestione sono dell'admin; gli altri si autorizzano.

   CHIESTO DA VALERIO il 30 agosto: «rivisita l'app in modo professionale
   tenendo conto della human factor, alleggerisci il carico cognitivo, le
   modifiche e la gestione generale va lasciata all'admin, gli altri profili
   possono essere autorizzati ma non è scontato».

   TRE INTERRUTTORI sul profilo: «correzioni» (rettifica, scarto, trasferisci,
   inventario, quantità in Plancia, annulla, ripristino), «ordini» (ricalcola,
   segna ordinato, rimuovi riga, report/da-mandare, storico ordini),
   «struttura» (gen-5.94, ora comprende le correzioni). Il MESTIERE — contare,
   evadere, produrre, scrivere le dosi, RICEVERE la merce — resta a tutti.

   I CONTRO-CONTROLLI CONTANO QUANTO I CONTROLLI: §1b e §2 difendono il
   mestiere con tutto spento (se diventano rossi ho tolto il lavoro, non il
   rumore); §4 e §5 difendono il ritorno con l'interruttore acceso; §6
   difende l'admin identico.

   Contro gen-5.94 devono essere ROSSI: §1 (tutto), §2b, §3a, §3b, §5a, §5b, §6b, §7. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const LAB = base.sedi.find((x) => x.tipo === "laboratorio");
const FM = base.sedi.find((x) => x.tipo === "operatore");
const magLab = base.magazzini.find((m) => m.tipo === "laboratorio");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length > 0);
const retro = base.magazzini.find((m) => m.tipo === "retro" && m.sedeId === FM.id);
if (!magLab || !linea || !retro) throw new Error("banco povero: servono lab, linea e retro");

/* il banco: lab con articoli (il seme lo ha VUOTO — misurato in gen-5.92),
   un preparato, una casella con quantità e soglie a metà per l'Arrotonda,
   una richiesta in attesa per il mestiere del lab, due righe d'ordine per
   il ciclo acquisti (una da ordinare, una ordinata con retro rifornibile) */
base.prodotti[0].preparato = true;
/* un prezzo E la conversione nel banco: senza prezzo il chip del valore non
   esiste per nessuno; e senza conversione nemmeno — l'articolo della linea
   sta in u-gn mentre la base e' in pezzi, e una riga non convertibile finisce
   fra le «senza prezzo». Misurato due volte, al primo e al secondo giro. */
const pPrezzo = base.prodotti.find((x) => x.id === linea.articoli[0].prodottoId);
pPrezzo.prezzo = 2;
if (linea.articoli[0].uomId !== pPrezzo.uomBase)
  pPrezzo.conv = { ...(pPrezzo.conv || {}), [linea.articoli[0].uomId]: 2 };
magLab.articoli = base.prodotti.slice(0, 4).map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 5, par: 8 }));
const artMezzo = linea.articoli[0];
artMezzo.qty = 2.5; artMezzo.par = 3.5; artMezzo.parGiorni = { ven: 4.5 };
const P_ORD = base.prodotti[1];
if (!retro.articoli.some((a) => a.prodottoId === P_ORD.id))
  retro.articoli.push({ prodottoId: P_ORD.id, uomId: P_ORD.uomBase, qty: 1, par: 10 });
base.richieste = [{ id: "ric-au1", t: Date.now() - 60000, daSedeId: FM.id, aSedeLabId: LAB.id,
  daMagazzinoId: linea.id, magNome: linea.nome, prodottoId: magLab.articoli[0].prodottoId,
  qty: 2, uomId: magLab.articoli[0].uomId, qtyLinea: 2, uomLineaId: magLab.articoli[0].uomId,
  stato: "in-attesa", creataDa: "Op" }];
base.ordini = [
  { id: "ord-da", t: Date.now() - 5000, tipo: "diretto", sedeId: FM.id, prodottoId: base.prodotti[2].id,
    fornitoreId: base.prodotti[2].fornitoreId, qty: 3, uomId: base.prodotti[2].uomBase, stato: "da-ordinare" },
  { id: "ord-ok", t: Date.now() - 4000, tipo: "diretto", sedeId: FM.id, prodottoId: P_ORD.id,
    fornitoreId: P_ORD.fornitoreId, qty: 4, uomId: P_ORD.uomBase, stato: "ordinato" },
];

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  opZero: { id: "pr-o0", nome: "OpZero", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], pinHash: hash("2222") },
  labZero: { id: "pr-l0", nome: "LabZero", ruolo: "laboratorio", sedeId: LAB.id, colore: "#22B8CF", pinHash: hash("3333") },
  opCorr: { id: "pr-oc", nome: "OpCorr", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], correzioni: true, pinHash: hash("2222") },
  opOrd: { id: "pr-oo", nome: "OpOrd", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], ordini: true, pinHash: hash("2222") },
  opStr: { id: "pr-os", nome: "OpStr", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], struttura: true, pinHash: hash("2222") },
  labStr: { id: "pr-ls", nome: "LabStr", ruolo: "laboratorio", sedeId: LAB.id, colore: "#22B8CF",
    struttura: true, pinHash: hash("3333") },
};

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (profili, nome, pin, { tour = true } = {}) => {
  const st = JSON.parse(JSON.stringify(base));
  st.profili = profili;
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j, t]) => {
    try { if (t) localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, [JSON.stringify(st), tour]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await entra(p, nome, pin);
  return { p, ctx };
};
const entra = async (p, nome, pin) => {
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1500);
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const testoNav = async (p) => (await p.locator('nav[aria-label="Navigazione principale"]').innerText()).replace(/\s+/g, " ");
const vede = async (p, sel) => (await p.locator(sel).count()) > 0;
const stato = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const apriDettaglio = async (p, nomeMag) => {
  await vaiA(p, "Magazzini");
  await p.getByText(nomeMag, { exact: true }).first().click(); await p.waitForTimeout(1100);
};
const chiudiFogli = async (p) => {
  for (let i = 0; i < 3; i++) {
    const n = await p.getByRole("button", { name: "Chiudi", exact: true }).count();
    if (!n) break;
    await p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
    await p.waitForTimeout(400);
  }
};

/* ═══ 1. OPERATORE CON TUTTO SPENTO (profilo di ieri, senza campi) ═══ */
console.log("\n— 1. operatore con tutto spento: vede il SUO lavoro e basta —");
const O = await apri([PR.opZero], "OpZero", "2222");
ok(!/Plancia/.test(await testoNav(O.p)), "la Plancia non è in barra: senza comandi è una stanza vuota");
const testoHome = await testoDi(O.p);
ok(!/Attività recente/.test(testoHome), "in Home niente registro attività (era il log GLOBALE dell'azienda)");
ok(!/vedi tutto/.test(testoHome), "e niente porta sullo storico aziendale");
await apriDettaglio(O.p, linea.nome);
ok(!(await vede(O.p, 'main button[aria-label^="Rettifica "]')), "niente rettifica giacenza");
ok(!(await vede(O.p, 'main button[aria-label^="Scarto "]')), "niente scarto");
ok(!/Trasferisci scorte/.test(await testoDi(O.p)), "niente trasferimento scorte");
ok(!/€/.test(await testoDi(O.p)), "e il valore in euro non si vede: è controllo di gestione");
await chiudiFogli(O.p);
ok(!/Inventario/.test(await testoDi(O.p)), "niente inventario guidato");
await vaiA(O.p, "Ordini");
const tOrd = await testoDi(O.p);
ok(!/Ricalcola/.test(tOrd), "in Ordini niente «Ricalcola»");
ok(!/Report ordine/.test(tOrd), "niente report");
ok(!/Da mandare adesso/.test(tOrd), "niente «Da mandare adesso»");
ok(!/Storico/.test(tOrd), "niente storico ordini");
ok(!/Da ordinare ·/.test(tOrd), "niente linguetta «Da ordinare»: il ciclo d'acquisto non è suo");
ok(!(await vede(O.p, 'button[aria-label="Rimuovi riga"]')), "e niente cestino sulle righe (era senza NESSUNA condizione)");

/* ═══ 1b. IL CONTRO-CONTROLLO DEL MESTIERE: verde anche su gen-5.94 ═══ */
console.log("\n— 1b. ma il MESTIERE è tutto lì: conta e riceve, con tutto spento —");
ok(/Ordinati ·/.test(tOrd), "la linguetta della merce ordinata c'è: ricevere è mestiere");
await O.p.getByText(/Ordinati ·/).first().click(); await O.p.waitForTimeout(800);
await O.p.getByRole("button", { name: /Tutto arrivato/ }).first().click(); await O.p.waitForTimeout(1600);
const s1 = await stato(O.p);
const artRetro = s1.magazzini.find((m) => m.id === retro.id).articoli.find((a) => a.prodottoId === P_ORD.id);
ok(s1.ordini.find((o) => o.id === "ord-ok")?.stato === "ricevuto", "la merce ordinata risulta ricevuta");
ok(artRetro.qty > 1, `e il retro si è caricato (${artRetro.qty})`);
await vaiA(O.p, "Conteggi");
await O.p.getByRole("button", { name: /Conta ora/ }).first().click(); await O.p.waitForTimeout(1100);
const campi = O.p.locator("main input[inputmode='decimal'], main input[type='number']");
const nc = Math.min(await campi.count(), 40);
for (let i = 0; i < nc; i++) await campi.nth(i).fill("2").catch(() => {});
await O.p.waitForTimeout(400);
await O.p.getByRole("button", { name: /Verifica e conferma/i }).first().click(); await O.p.waitForTimeout(1100);
await O.p.getByRole("button", { name: /Conferma tutto/i }).first().click(); await O.p.waitForTimeout(1800);
const s2 = await stato(O.p);
ok(Math.abs(s2.magazzini.find((m) => m.id === linea.id).articoli[0].qty - 2) < 1e-9,
  "il conteggio scrive la giacenza: contare è il suo lavoro");
await O.ctx.close();

/* ═══ 2. LABORATORIO CON TUTTO SPENTO: EVADE, PRODUCE, SCRIVE LE DOSI ═══ */
console.log("\n— 2. laboratorio con tutto spento: il suo mestiere è intero —");
const L = await apri([PR.labZero], "LabZero", "3333");
await vaiA(L.p, "Richieste");
await L.p.getByText(/Confermo tutto/).first().click(); await L.p.waitForTimeout(800);
await L.p.getByRole("button", { name: /Confermo tutto|Conferma/ }).last().click().catch(() => {});
await L.p.waitForTimeout(1600);
const s3 = await stato(L.p);
ok(s3.richieste.find((r) => r.id === "ric-au1")?.stato !== "in-attesa",
  "«Confermo tutto» evade la richiesta: evadere è mestiere");
console.log("— 2b. e la lente non lo porta a contare —");
await L.p.getByRole("button", { name: "Cerca un prodotto o una funzione" }).click();
await L.p.waitForTimeout(500);
await L.p.locator("input:visible").first().fill("contare"); await L.p.waitForTimeout(700);
ok(!/Contare quello che c/.test(await testoDi(L.p)),
  "la lente non offre «Contare quello che c'è» a chi non conta");
await L.ctx.close();

/* ═══ 3. CON «CORREZIONI» TORNANO I NUMERI — E LA PLANCIA È UNA STANZA SOLA ═══ */
console.log("\n— 3. con «correzioni»: tornano rettifica, scarto, trasferisci, inventario —");
const C = await apri([PR.opCorr], "OpCorr", "2222");
await apriDettaglio(C.p, linea.nome);
ok(await vede(C.p, 'main button[aria-label^="Rettifica "]'), "la rettifica torna");
ok(await vede(C.p, 'main button[aria-label^="Scarto "]'), "lo scarto torna");
ok(/Trasferisci scorte/.test(await testoDi(C.p)), "il trasferimento torna");
await chiudiFogli(C.p);
ok(/Inventario/.test(await testoDi(C.p)), "l'inventario torna");
console.log("— 3a. la Plancia torna in barra, ed è la sola stanza delle Caselle —");
ok(/Plancia/.test(await testoNav(C.p)), "la Plancia è in barra");
await vaiA(C.p, "Plancia"); await C.p.waitForTimeout(900);
const tPl = await testoDi(C.p);
ok(!/Settimana/.test(tPl) && !/Struttura/.test(tPl),
  "niente linguette Rete/Struttura/Settimana: una stanza sola, quella dove si lavora");
/* su gen-5.94 le linguette ci sono e si parte da «Rete»: per arrivare alle
   tessere serve il passaggio — sul codice nuovo il tasto non esiste e il
   catch lo salta, perche' si e' GIA' li' */
await C.p.getByText("Caselle", { exact: true }).first().click().catch(() => {});
await C.p.waitForTimeout(800);
ok(/Riempimento medio|passo/.test(await testoDi(C.p)), "ed è quella delle Caselle");
console.log("— 3b. «Arrotonda» arrotonda i NUMERI, non le soglie —");
await C.p.getByLabel("Magazzino", { exact: true }).first().selectOption({ label: linea.nome }).catch(async () => {
  const sels = C.p.locator("select"); const n = await sels.count();
  for (let i = 0; i < n; i++) {
    const et = await sels.nth(i).locator("option").allTextContents();
    if (et.includes(linea.nome)) { await sels.nth(i).selectOption({ label: linea.nome }); break; }
  }
});
await C.p.waitForTimeout(900);
const nomeMezzo = base.prodotti.find((x) => x.id === artMezzo.prodottoId)?.nome;
await C.p.getByRole("button", { name: new RegExp(nomeMezzo) }).first().click(); await C.p.waitForTimeout(800);
await C.p.getByRole("button", { name: "Arrotonda", exact: true }).first().click(); await C.p.waitForTimeout(1400);
const s4 = await stato(C.p);
const artDopo = s4.magazzini.find((m) => m.id === linea.id).articoli.find((a) => a.prodottoId === artMezzo.prodottoId);
ok(Math.abs(artDopo.qty - 3) < 1e-9, `la giacenza 2,5 è arrotondata a 3 (${artDopo.qty})`);
ok(Math.abs(artDopo.par - 3.5) < 1e-9,
  `ma la SOGLIA resta 3,5 (${artDopo.par}): la forma non si tocca senza «struttura»`);
ok(Math.abs((artDopo.parGiorni?.ven ?? 0) - 4.5) < 1e-9,
  `e il livello del venerdì resta 4,5 (${artDopo.parGiorni?.ven})`);
await C.ctx.close();

/* ═══ 4. CON «ORDINI» TORNA IL CICLO D'ACQUISTO ═══ */
console.log("\n— 4. con «ordini»: torna il ciclo d'acquisto intero —");
const D = await apri([PR.opOrd], "OpOrd", "2222");
await vaiA(D.p, "Ordini");
const tOrd2 = await testoDi(D.p);
ok(/Ricalcola/.test(tOrd2), "«Ricalcola» c'è");
ok(/Report ordine/.test(tOrd2), "il report c'è");
ok(/Da mandare adesso/.test(tOrd2), "«Da mandare adesso» c'è");
ok(/Da ordinare ·/.test(tOrd2), "la linguetta «Da ordinare» c'è");
await D.p.getByText(/Da ordinare ·/).first().click(); await D.p.waitForTimeout(800);
ok(await vede(D.p, 'button[aria-label="Rimuovi riga"]'), "e il cestino c'è — adesso dietro un interruttore");
await D.ctx.close();

/* ═══ 5. CON «STRUTTURA» LA SCALA È COERENTE, E LO SPOSTA NON ESCE DI SEDE ═══ */
console.log("\n— 5. con «struttura»: la scala è coerente anche per l'operatore —");
const E = await apri([PR.opStr], "OpStr", "2222");
await apriDettaglio(E.p, linea.nome);
const tDet = await testoDi(E.p);
ok(/Gestione rapida/.test(tDet), "l'operatore autorizzato alla struttura ha «Gestione rapida» (in gen-5.94 no: asimmetria)");
ok(await vede(E.p, 'main button[aria-label^="Rettifica "]') || /Aggiungi articolo/.test(tDet),
  "e la scala regge: struttura comprende il resto");
await E.ctx.close();
console.log("— 5b. e «Sposta in blocco» non offre magazzini di altre sedi —");
const F = await apri([PR.labStr], "LabStr", "3333");
await apriDettaglio(F.p, magLab.nome);
await F.p.getByRole("button", { name: /Gestione rapida/ }).first().click(); await F.p.waitForTimeout(700);
await F.p.getByText(/Sposta o rimuovi/).first().click(); await F.p.waitForTimeout(900);
const opzioni = await F.p.evaluate(() => [...document.querySelectorAll("select option")].map((o) => o.textContent));
const fuoriSede = base.magazzini.filter((m) => m.sedeId !== LAB.id).map((m) => m.nome);
const sfuggiti = opzioni.filter((o) => fuoriSede.some((n) => o.includes(n)));
ok(sfuggiti.length === 0,
  sfuggiti.length ? `DESTINAZIONI FUORI SEDE OFFERTE: ${sfuggiti.join(", ")}` : "nessuna destinazione fuori dalla sede");
await F.ctx.close();

/* ═══ 6. L'ADMIN NON CAMBIA DI UNA VIRGOLA ═══ */
console.log("\n— 6. l'admin non cambia di una virgola —");
const A = await apri([PR.admin], "Admin", "1234");
await apriDettaglio(A.p, linea.nome);
const tAdm = await testoDi(A.p);
ok(/Gestione rapida/.test(tAdm), "Gestione rapida c'è");
ok(/€/.test(tAdm), "il valore in euro c'è");
await chiudiFogli(A.p);
await vaiA(A.p, "Plancia"); await A.p.waitForTimeout(800);
const tPlA = await testoDi(A.p);
ok(/Rete/.test(tPlA) && /Settimana/.test(tPlA) && /Caselle/.test(tPlA), "tutte e quattro le linguette ci sono");
console.log("— 6b. e il chip «beta» non c'è più, per nessuno —");
ok(!/\bbeta\b/.test(tPlA), "niente «beta» su una schermata usata in produzione da mesi");
await A.ctx.close();

/* ═══ 7. IL TUTORIAL È PER PROFILO, NON PER TELEFONO ═══ */
console.log("\n— 7. il tutorial si presenta a OGNI persona, non a ogni telefono —");
const G = await apri([PR.opZero, PR.labZero], "OpZero", "2222", { tour: false });
await G.p.waitForTimeout(800);
ok(/Salta/.test(await testoDi(G.p)), "il primo profilo riceve il tour");
await G.p.getByText("Salta", { exact: false }).first().click().catch(() => {});
await G.p.waitForTimeout(600);
await G.p.getByRole("button", { name: "Esci dal profilo" }).click(); await G.p.waitForTimeout(900);
await entra(G.p, "LabZero", "3333");
await G.p.waitForTimeout(800);
ok(/Salta/.test(await testoDi(G.p)),
  "e ANCHE il secondo profilo sullo stesso telefono lo riceve (in gen-5.94 no)");
await G.ctx.close();

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
