/* gen-5.75: un CSV con poche colonne non cancella piu' quello che non nomina.

   Difetto n.3 del consiglio del 2 agosto. Un listino a due colonne
   (Nome; Prezzo) e' un file legittimo — anzi, e' esattamente quello che si
   ottiene ripulendo in Excel un export dell'app, cioe' quello che il pannello
   invita a fare. Prima ogni prodotto toccato da un file cosi' perdeva l'unita'
   base, TUTTE le conversioni, la categoria e il fornitore, e l'anteprima
   diceva tranquillamente «1 aggiornato, 0 errori». Da quel momento 4 buste di
   grana valevano 4 teglie invece di 12: prelievi, richieste e righe d'ordine
   uscivano col numero sbagliato mentre il magazzino continuava a mostrare
   numeri credibili. E non si torna indietro: lo storico fotografa le caselle
   dei magazzini, non i prodotti.

   Il §5 e' il controllo che vale piu' di tutti. Non basta che il campo
   «conv» sia rimasto nei dati: quello che conta e' che il NUMERO che esce
   dall'app dopo l'importazione sia ancora quello giusto. Un dato salvo che
   nessuno usa piu' non serve a niente, e un dato perso si vede in cucina come
   merce sbagliata, non come un campo vuoto.

   I §3 e §4 sono i controcontrolli: la regola nuova non deve diventare
   «l'importazione non cambia piu' niente». Una colonna che C'E' resta
   autorevole anche quando la casella e' vuota, e un prodotto nuovo deve
   nascere completo. Senza questi due, il §2 sarebbe verde anche in un'app che
   ha semplicemente smesso di importare. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
st.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];

/* Il prodotto della prova e' fatto come quelli veri di Valerio: una busta che
   in linea vale tre teglie. E' proprio la conversione che il difetto
   cancellava, ed e' quella che fa la differenza fra ordinare 4 buste e
   ordinarne 12.
   Nell'app «conv[x] = f» vuol dire «una x vale f unita' base», non il
   contrario: il fattore si legge dal lato della confezione. Il seme lo
   rispecchia esattamente com'e' nei dati veri — la teglia e' l'unita' base,
   la busta e' quello che si ordina, e una busta fa tre teglie. */
const uTeglia = st.unita.find((u) => /gn/i.test(u.simbolo)) || st.unita[1];
const uBusta = st.unita.find((u) => /conf/i.test(u.simbolo)) || st.unita[0];
/* NON la prima categoria e NON il primo fornitore, ed e' una precauzione che
   mi sono guadagnato sbagliando: al primo giro avevo seminato quelli in cima
   all'elenco, e siccome sono esattamente i valori di ripiego che il difetto
   ci metteva sopra, quei due controlli passavano anche contro la versione
   rotta. Erano verdi per il motivo sbagliato. Un controllo che non puo'
   diventare rosso non e' un controllo. */
if (st.categorie.length < 3) st.categorie.push({ id: "cat-x", nome: "Dispensa", colore: "#8A63F4" });
if (st.fornitori.length < 3) st.fornitori.push({ id: "for-x", nome: "Caseificio" });
const catA = st.categorie[2], catB = st.categorie[1];
const fornA = st.fornitori[2];

const grana = st.prodotti[0];
grana.nome = "Grana in busta";
grana.uomBase = uTeglia.id;
grana.conv = { [uBusta.id]: 3 };
grana.uomFornitoreDiretto = uBusta.id;   /* al fornitore si ordina a buste */
grana.categoriaId = catA.id;
grana.fornitoreId = fornA.id;
grana.soloInteri = false;
grana.preparato = false;
delete grana.prezzo;
delete grana.uomFornitore; delete grana.uomLavorazione;

/* un secondo prodotto per il controcontrollo sulla colonna presente-ma-vuota */
const secondo = st.prodotti[1];
secondo.nome = "Pomodoro pelato";
secondo.uomBase = uTeglia.id;
secondo.conv = { [uBusta.id]: 2 };
secondo.categoriaId = catA.id;
secondo.fornitoreId = fornA.id;

/* e un magazzino dove leggere il numero vero dopo l'importazione */
const mag = st.magazzini.find((m) => m.tipo === "retro");
let art = mag.articoli.find((a) => a.prodottoId === grana.id);
if (!art) { art = { prodottoId: grana.id }; mag.articoli.push(art); }
art.uomId = uTeglia.id; art.qty = 0; art.par = 12; delete art.parGiorni;
for (const m of st.magazzini) for (const a of m.articoli) if (a !== art) { a.par = 0; delete a.parGiorni; }
st.ordini = []; st.richieste = [];
st.rev = (st.rev || 0) + 1;

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const p = await b.newPage({ viewport: { width: 1280, height: 950 } });
p.on("pageerror", (e) => errs.push(e.message));
await p.addInitScript((s) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  const m = new Map(); m.set("scp:stato:v1", s);
  window.storage = {
    async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
    async set(k, v) { m.set(k, v); return true; },
    async delete(k) { m.delete(k); return true; },
  };
  window.__leggi = async () => JSON.parse((await window.storage.get("scp:stato:v1")).value);
}, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);
await vaiA(p, "Sistema");

/* il giro completo come lo farebbe una persona: apri, incolla, Analizza,
   guarda l'anteprima, Applica */
const importa = async (csv) => {
  await p.getByRole("button", { name: /^Importa catalogo$/ }).first().click();
  await p.waitForTimeout(700);
  await p.locator("textarea").first().fill(csv);
  await p.waitForTimeout(200);
  await p.getByRole("button", { name: /^Analizza$/ }).first().click();
  await p.waitForTimeout(700);
  const anteprima = await p.locator("text=Anteprima").first()
    .locator("xpath=ancestor::div[1]").innerText().catch(() => "");
  await p.getByRole("button", { name: /^Applica \(/ }).first().click();
  await p.waitForTimeout(900);
  return anteprima;
};
const prodotto = async (nome) => (await p.evaluate(async () => await window.__leggi()))
  .prodotti.find((x) => x.nome === nome);

const prima = await prodotto("Grana in busta");
ok(!!prima && prima.conv && prima.conv[uBusta.id] === 3,
  `si parte da «Grana in busta»: 1 ${uBusta.simbolo} = 3 ${uTeglia.simbolo}`);

/* ═══ 1. IL LISTINO A DUE COLONNE — IL CASO DEL DIFETTO ═══ */
console.log("\n— 1. un listino «Nome;Prezzo» aggiorna il prezzo e basta —");
const testo1 = await importa("Nome;Prezzo\nGrana in busta;14,50\n");
const dopo = await prodotto("Grana in busta");
ok(dopo?.prezzo === 14.5, `il prezzo e' arrivato (${dopo?.prezzo})`);
ok(dopo?.uomBase === uTeglia.id,
  `l'unita' base e' ancora «${uTeglia.simbolo}» (${dopo?.uomBase === uTeglia.id ? "sì" : "cancellata!"})`);
ok(dopo?.conv && dopo.conv[uBusta.id] === 3,
  `la conversione c'e' ancora: 1 ${uBusta.simbolo} = ${dopo?.conv?.[uBusta.id]} ${uTeglia.simbolo} (era 3)`);
ok(dopo?.uomFornitoreDiretto === uBusta.id,
  `e al fornitore si ordina ancora a «${uBusta.simbolo}»`);
ok(dopo?.categoriaId === catA.id, `la categoria e' ancora «${catA.nome}»`);
ok(dopo?.fornitoreId === fornA.id, `il fornitore e' ancora «${fornA.nome}»`);

/* ═══ 2. E L'ANTEPRIMA LO DICE PRIMA, NON DOPO ═══
   Accorgersi del file sbagliato quando il danno e' fatto non serve: qui non
   si torna indietro senza ripristinare un backup. */
console.log("\n— 2. l'anteprima dice cosa il file NON porta —");
ok(/non porta/i.test(testo1), "l'anteprima avvisa che il file non porta tutto");
for (const parola of ["categoria", "fornitore", "unità base", "conversioni"])
  ok(new RegExp(parola, "i").test(testo1), `  e nomina «${parola}»`);
ok(/restano come sono|non vengono azzerate/i.test(testo1),
  "e dice cosa succede a quelle cose: restano come sono");

/* ═══ 3. CONTROCONTROLLO: UNA COLONNA CHE C'È RESTA AUTOREVOLE ═══
   La regola nuova non deve diventare «l'importazione non cambia piu' niente».
   Se la colonna c'e' e la casella e' vuota, quella e' una dichiarazione. */
console.log("\n— 3. una colonna che c'e', anche vuota, comanda —");
await importa("Nome;Conversioni;Categoria\nPomodoro pelato;;" + catB.nome + "\n");
const sec = await prodotto("Pomodoro pelato");
ok(sec && Object.keys(sec.conv || {}).length === 0,
  `«Pomodoro pelato»: colonna conversioni presente e vuota, le conversioni se ne vanno (${JSON.stringify(sec?.conv)})`);
ok(sec?.categoriaId === catB.id, `e la categoria cambia in «${catB.nome}»`);
ok(sec?.uomBase === uTeglia.id, `mentre l'unita' base, che il file non nomina, resta «${uTeglia.simbolo}»`);

/* ═══ 4. CONTROCONTROLLO: UN PRODOTTO NUOVO NASCE COMPLETO ═══ */
console.log("\n— 4. un prodotto nuovo nasce con tutto quello che gli serve —");
await importa("Nome;Prezzo\nCosa mai vista;3\n");
const nuovo = await prodotto("Cosa mai vista");
ok(!!nuovo, "il prodotto nuovo e' stato creato");
ok(!!nuovo?.uomBase, `e ha un'unita' base (${nuovo?.uomBase ? "sì" : "NESSUNA — sarebbe rotto"})`);
ok(nuovo?.conv && typeof nuovo.conv === "object", "e ha il posto per le conversioni, anche se vuoto");
ok(nuovo?.prezzo === 3, "e il prezzo del file");

/* ═══ 5. IL CONTROLLO CHE CONTA: IL NUMERO CHE ESCE È ANCORA GIUSTO ═══
   Un campo salvo nei dati non basta. Dopo l'importazione il fabbisogno di 12
   teglie deve tradursi in 4 buste da chiedere al fornitore — se la
   conversione fosse andata persa ne chiederebbe 12, che e' il triplo. */
console.log("\n— 5. e in cucina il numero e' ancora quello giusto —");
await vaiA(p, "Ordini");
await p.getByRole("button", { name: /^Ricalcola$/ }).first().click();
await p.waitForTimeout(900);
const riga = (await p.evaluate(async () => await window.__leggi()))
  .ordini.find((o) => o.prodottoId === grana.id && o.stato === "da-ordinare");
ok(!!riga, "dal fabbisogno di 12 teglie nasce una riga d'ordine");
ok(riga && Math.abs(riga.qty - 4) < 1e-6,
  `e chiede 4 ${uBusta.simbolo}, non 12: la conversione ha retto all'importazione (chiede ${riga?.qty} ${riga?.uomId === uBusta.id ? uBusta.simbolo : "?"})`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
