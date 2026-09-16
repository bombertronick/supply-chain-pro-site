/* gen-5.80: due telefoni che salvano insieme non si cancellano piu' a vicenda.

   IL DIFETTO. Fra il momento in cui un telefono legge com'e' lo stato e il
   momento in cui riscrive com'e' diventato passa un giro di rete: qualche
   decimo di secondo. Se in quel mezzo secondo salva anche un altro telefono,
   il secondo arrivato riscriveva TUTTO sopra. Il lavoro del primo spariva
   senza un avviso: un conteggio intero, un carico, una richiesta al
   laboratorio. Con tre o quattro telefoni accesi in cucina non e' un caso di
   scuola, e' il mercoledi' sera.

   LA CORREZIONE. Insieme allo stato viaggia «revBase», cioe' da quale
   revisione si e' partiti. Il server accetta la scrittura SOLO se in rete c'e'
   ancora quella revisione. Chi arriva secondo viene rifiutato — e non perde
   niente, perche' la coda delle sue modifiche non si svuota mai prima della
   conferma: si riapplica sulla base aggiornata e si SOMMA a quella dell'altro.

   COME E' FATTA QUESTA PROVA. Non e' una finta: qui c'e' un magazzino unico
   lato Node che si comporta come il server vero (stessa regola scritta in
   Postgres dentro app_kv_set), e due pagine separate che ci parlano. La
   scrittura del telefono A viene TRATTENUTA di proposito finche' quella di B
   non e' arrivata: cosi' la gara, che nella realta' dura mezzo secondo, si
   riproduce ogni volta uguale.

   IL CONTROCONTROLLO E' IL §4. Non basta che la scrittura venga rifiutata:
   se «rifiutata» volesse dire «buttata», la correzione sarebbe peggio del
   difetto — invece di perdere il lavoro di uno si perderebbe quello
   dell'altro. Il §4 pretende che alla fine ci siano ENTRAMBI i conteggi.

   Contro gen-5.79 questa prova deve diventare rossa. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const CHIAVE = "scp:stato:v1", CHIAVE_REV = "scp:rev:v1";
const dormi = (ms) => new Promise((r) => setTimeout(r, ms));

/* ═══ IL SERVER FINTO, CON LA REGOLA VERA ═══
   Stessa condizione scritta in Postgres: se chi scrive dichiara revBase e in
   rete c'e' un'altra revisione, la scrittura viene rifiutata. Chi non dichiara
   niente (versione vecchia) scrive come prima — durante il passaggio di
   versione nessuno deve restare fuori. */
const negozio = new Map();
let nRifiuti = 0, nScritture = 0;
const revInRete = () => { try { return JSON.parse(negozio.get(CHIAVE)).rev || 0; } catch { return 0; } };
const servSet = (k, v) => {
  if (k === CHIAVE) {
    let atteso = null;
    try { atteso = JSON.parse(v).revBase; } catch {}
    if (atteso != null && negozio.has(CHIAVE) && revInRete() !== atteso) { nRifiuti++; return false; }
    nScritture++;
  }
  negozio.set(k, v); return true;
};
const stat = () => JSON.parse(negozio.get(CHIAVE));

/* ═══ LO STATO DI PARTENZA ═══ */
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const linea = st.magazzini.find((m) => m.tipo === "linea-lab");
const lab = st.magazzini.find((m) => m.tipo === "laboratorio");
st.profili = [{ id: "pr-op", nome: "Operatore", ruolo: "operatore", sedeId: linea.sedeId,
  magazziniIds: [linea.id], colore: "#4C8DF6", pinHash: hash("1234") }];
for (const a of linea.articoli) { a.par = 0; a.qty = 0; delete a.parGiorni; }
const [aUno, aDue] = linea.articoli;
const pUno = st.prodotti.find((p) => p.id === aUno.prodottoId);
const pDue = st.prodotti.find((p) => p.id === aDue.prodottoId);
for (const p of [pUno, pDue]) { p.preparato = true; p.soloInteri = false; delete p.uomLavorazione; }
aUno.par = 10; aUno.qty = 3;
aDue.par = 10; aDue.qty = 5;
lab.articoli = [{ prodottoId: pUno.id, uomId: pUno.uomBase, qty: 100, par: 0 },
                { prodottoId: pDue.id, uomId: pDue.uomBase, qty: 100, par: 0 }];
linea.rifornitoreId = null;
st.richieste = []; st.ordini = []; st.rev = 1000;
negozio.set(CHIAVE, JSON.stringify(st));
negozio.set(CHIAVE_REV, "1000");

/* ═══ I DUE TELEFONI ═══ */
const errs = [];
const freni = { A: null, B: null };
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });

async function telefono(nome) {
  const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  p.on("pageerror", (e) => errs.push(`${nome}: ${e.message}`));
  await p.exposeFunction("__srvGet", (k) => (negozio.has(k) ? { value: negozio.get(k) } : null));
  await p.exposeFunction("__srvSet", async (k, v) => {
    /* il freno tiene appesa SOLO la scrittura dello stato, e solo del
       telefono che sto trattenendo: cosi' la gara si riproduce uguale */
    if (k === CHIAVE && freni[nome]) await freni[nome];
    return servSet(k, v);
  });
  await p.exposeFunction("__srvDel", (k) => { negozio.delete(k); return true; });
  await p.addInitScript(() => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    window.storage = {
      async get(k) { return await window.__srvGet(k); },
      async set(k, v) { return await window.__srvSet(k, v); },
      async delete(k) { return await window.__srvDel(k); },
    };
  });
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
  await p.getByText("Operatore", { exact: false }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1200);
  return p;
}

const apri = async (p) => {
  const nav = p.getByText("Conteggi", { exact: true });
  for (let i = 0; i < await nav.count(); i++)
    if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
  await p.waitForTimeout(800);
  const ancora = p.getByRole("button", { name: /Nuovo conteggio/ }).first();
  if (await ancora.count()) { await ancora.click(); await p.waitForTimeout(700); }
  const avvia = p.getByRole("button", { name: /Conta ora/ }).first();
  if (await avvia.count()) { await avvia.click(); await p.waitForTimeout(700); }
};
/* conta UN prodotto e conferma: e' la mutazione che deve sopravvivere */
const conta = async (p, nome, quanto) => {
  await p.getByLabel(new RegExp("^Conteggio " + nome)).fill(String(quanto));
  await p.waitForTimeout(250);
  await p.getByRole("button", { name: /Verifica e conferma/ }).click();
  await p.waitForTimeout(700);
  await p.getByRole("button", { name: /Conferma tutto/ }).click();
};
const qtaDi = (s, prodId) => s.magazzini.find((m) => m.tipo === "linea-lab")
  .articoli.find((a) => a.prodottoId === prodId)?.qty;

const A = await telefono("A");
const B = await telefono("B");
await apri(A); await apri(B);

console.log("\n— 0. si parte da fermi: tutti e due vedono la stessa cosa —");
ok(qtaDi(stat(), pUno.id) === 3 && qtaDi(stat(), pDue.id) === 5,
  `in rete ci sono 3 di «${pUno.nome}» e 5 di «${pDue.nome}»`);
const revPrima = revInRete();

/* ═══ 1. LA GARA: A SCRIVE, MA LA SUA SCRITTURA RESTA APPESA ═══ */
console.log("\n— 1. il telefono A salva, ma la sua scrittura resta per strada —");
let rilasciaA; freni.A = new Promise((r) => { rilasciaA = r; });
await conta(A, pUno.nome, 7);
await dormi(1500);
ok(revInRete() === revPrima,
  `in rete non e' arrivato ancora niente (rev ${revInRete()}, era ${revPrima})`);
ok(qtaDi(stat(), pUno.id) === 3, "e il conteggio di A e' ancora solo sul suo telefono");

/* ═══ 2. NEL FRATTEMPO B SALVA, E LA SUA ARRIVA ═══ */
console.log("\n— 2. nel frattempo il telefono B salva, e la sua arriva —");
await conta(B, pDue.nome, 9);
await dormi(1800);
ok(revInRete() > revPrima, `la scrittura di B e' in rete (rev ${revInRete()})`);
ok(qtaDi(stat(), pDue.id) === 9, `e in rete «${pDue.nome}» sta a 9 (${qtaDi(stat(), pDue.id)})`);

/* ═══ 3. ORA ARRIVA QUELLA DI A, PARTITA DA UNA BASE VECCHIA ═══ */
console.log("\n— 3. adesso arriva quella di A, che era partita da prima —");
freni.A = null; rilasciaA();
await dormi(2500);
ok(nRifiuti >= 1, `il server ha rifiutato la scrittura partita dalla base vecchia (${nRifiuti})`);

/* ═══ 4. IL CONTROCONTROLLO: RIFIUTATA NON VUOL DIRE BUTTATA ═══
   Se «rifiutata» volesse dire «persa», si sarebbe solo spostato il danno
   dall'uno all'altro. A deve essersi riaccodato sulla base nuova. */
console.log("\n— 4. e nessuno dei due ha perso il proprio lavoro —");
const fine = stat();
ok(qtaDi(fine, pUno.id) === 7,
  `«${pUno.nome}» ha i 7 contati da A (${qtaDi(fine, pUno.id)})`);
ok(qtaDi(fine, pDue.id) === 9,
  `«${pDue.nome}» ha i 9 contati da B (${qtaDi(fine, pDue.id)})`);
ok((fine.richieste || []).filter((r) => r.stato === "in-attesa").length === 2,
  `e al laboratorio sono arrivate tutte e due le richieste (${(fine.richieste || []).filter((r) => r.stato === "in-attesa").length})`);

/* ═══ 5. LA REVISIONE È UN CONTATORE, NON L'OROLOGIO DEL TELEFONO ═══
   Serve al server per riconoscere «da dove sei partito»: se fosse un
   timestamp, due telefoni con l'ora diversa parlerebbero due lingue. */
console.log("\n— 5. il numero di revisione e' un contatore, non un orario —");
ok(fine.rev < 1e12, `rev = ${fine.rev}: e' un contatore, non un timestamp in microsecondi`);
ok(fine.revBase === fine.rev - 1,
  `e dice da dove e' partita (revBase ${fine.revBase}, rev ${fine.rev})`);

/* ═══ 6. UNA GARA PERSA NON È UN GUASTO DI RETE ═══
   Dire «connessione instabile» quando la connessione c'e' manda in giro
   la gente a cercare il wifi per un problema che non esiste. */
console.log("\n— 6. perdere una gara non viene raccontato come rete che cade —");
const testoA = (await A.locator("body").innerText()).replace(/\n/g, " ");
ok(!/[Cc]onnessione instabile/.test(testoA),
  "il telefono A non ha detto «connessione instabile»");
ok(!/Modalit.\s*locale|senza rete/i.test(testoA), "e non e' passato in modalita' locale");

/* ═══ 7. TUTTI E DUE I TELEFONI FINISCONO CON LA STESSA VERITÀ ═══ */
console.log("\n— 7. dopo un attimo i due telefoni vedono la stessa cosa —");
await dormi(4000);
const letturaA = await A.evaluate(async () => (await window.__srvGet("scp:stato:v1")).value);
ok(JSON.parse(letturaA).rev === fine.rev, "la rete ha una versione sola");
const scherA = (await A.locator("body").innerText()).replace(/\n/g, " ");
ok(!/Sincronizzazione in corso/.test(scherA), "e nessuno dei due e' rimasto appeso");

console.log(`\nscritture andate a segno: ${nScritture}, rifiutate: ${nRifiuti}`);
console.log("errori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
