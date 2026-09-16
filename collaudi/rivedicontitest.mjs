/* gen-5.79: nei conteggi si rivede quello che c'e' gia' scritto.

   Segnalato da Valerio dopo il primo giorno di uso vero a lavoro, con le sue
   parole: «se voglio modificare un conteggio e' abbastanza complicato» e «se
   apro i conteggi dopo averne fatto uno, la lista si resetta in
   visualizzazione, facendo vedere che e' tutto da controllare invece di far
   vedere i valori che gia' hai inserito».

   Erano la stessa cosa: la schermata partiva vuota SEMPRE. Dopo aver contato
   non si rivedeva piu' niente, e per correggere un numero bisognava rifare
   tutta la linea da capo.

   Il §3 e' il controcontrollo, ed e' quello che tiene in piedi la
   correzione: far vedere un numero NON vuol dire darlo per confermato. Se
   bastasse aprire la schermata per far risultare contate tutte e trentotto le
   caselle, partirebbero richieste al laboratorio per roba che nessuno ha
   guardato — un difetto molto peggiore di quello che si chiude. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

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
/* la casella di «uno» ha gia' 3 sullo scaffale: e' il numero che si deve
   rivedere aprendo la schermata */
aUno.par = 10; aUno.qty = 3;
aDue.par = 8; aDue.qty = 5;
lab.articoli = [{ prodottoId: pUno.id, uomId: pUno.uomBase, qty: 100, par: 0 },
                { prodottoId: pDue.id, uomId: pDue.uomBase, qty: 100, par: 0 }];
linea.rifornitoreId = null;
st.richieste = []; st.ordini = [];
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
  window.__leggi = async () => JSON.parse(m.get("scp:stato:v1"));
}, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Operatore", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);

const apri = async () => {
  const nav = p.getByText("Conteggi", { exact: true });
  for (let i = 0; i < await nav.count(); i++)
    if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
  await p.waitForTimeout(800);
  const ancora = p.getByRole("button", { name: /Nuovo conteggio/ }).first();
  if (await ancora.count()) { await ancora.click(); await p.waitForTimeout(700); }
  const avvia = p.getByRole("button", { name: /Conta ora/ }).first();
  if (await avvia.count()) { await avvia.click(); await p.waitForTimeout(700); }
};
const campo = (nome) => p.getByLabel(new RegExp("^Conteggio " + nome));

/* ═══ 1. APRENDO SI VEDE QUELLO CHE C'È IN MAGAZZINO ═══ */
console.log("\n— 1. la casella non e' piu' vuota: mostra quello che c'e' —");
await apri();
ok((await campo(pUno.nome).inputValue()) === "3",
  `«${pUno.nome}» mostra i 3 che ci sono (mostra «${await campo(pUno.nome).inputValue()}»)`);
ok((await campo(pDue.nome).inputValue()) === "5",
  `e «${pDue.nome}» i suoi 5 (mostra «${await campo(pDue.nome).inputValue()}»)`);

/* ═══ 2. IL «+» PARTE DA LÌ, NON DA ZERO ═══
   E' l'altra meta' di «modificare un conteggio e' complicato»: premere piu'
   su una casella che ne ha tre deve portare a quattro. */
console.log("\n— 2. il tasto «+» parte dal numero che c'e' —");
const riga = p.locator("div").filter({ has: campo(pUno.nome) }).last();
await riga.getByRole("button", { name: "Aumenta" }).first().click();
await p.waitForTimeout(300);
ok((await campo(pUno.nome).inputValue()) === "4",
  `da 3 si passa a 4, non a 1 (adesso «${await campo(pUno.nome).inputValue()}»)`);

/* ═══ 3. CONTROCONTROLLO: VEDERE NON È CONFERMARE ═══
   Il controllo che tiene in piedi tutto il resto. Se aprire la schermata
   facesse risultare contate tutte le caselle, partirebbero richieste al
   laboratorio per roba che nessuno ha guardato. */
console.log("\n— 3. quello che non hai toccato NON viene mandato —");
await p.getByRole("button", { name: /Verifica e conferma/ }).click();
await p.waitForTimeout(800);
/* si legge SOLO il foglio del riepilogo: dietro c'e' ancora la lista del
   conteggio, e leggendo tutta la pagina ci si troverebbero i nomi di tutti
   gli articoli — un rosso che non vuol dire niente */
const riep = (await p.locator(".sc-foglio").last().innerText()).replace(/\n/g, " ");
ok(riep.includes(pUno.nome), `nel riepilogo c'e' «${pUno.nome}», che ho toccato`);
ok(!riep.includes(pDue.nome),
  `e NON c'e' «${pDue.nome}», che ho solo guardato: vederlo scritto non vuol dire averlo contato`);
await p.getByRole("button", { name: /Conferma tutto/ }).click();
await p.waitForTimeout(1200);
const dopo = await p.evaluate(async () => await window.__leggi());
const artUno = dopo.magazzini.find((m) => m.tipo === "linea-lab").articoli
  .find((a) => a.prodottoId === dopo.prodotti.find((x) => x.preparato)?.id);
ok((dopo.richieste || []).filter((r) => r.stato === "in-attesa").length === 1,
  `e' partita una richiesta sola, per quello toccato (${(dopo.richieste || []).length})`);

/* ═══ 4. RIAPRENDO SI RIVEDE IL NUMERO NUOVO ═══
   E' la frase di Valerio, alla lettera: dopo un conteggio la lista non si
   deve resettare. */
console.log("\n— 4. riaprendo si rivede quello che hai appena scritto —");
await apri();
ok((await campo(pUno.nome).inputValue()) === "4",
  `«${pUno.nome}» mostra i 4 appena contati, non il vuoto (mostra «${await campo(pUno.nome).inputValue()}»)`);
ok((await campo(pDue.nome).inputValue()) === "5",
  `e «${pDue.nome}» e' rimasto a 5, come deve`);

/* ═══ 5. CORREGGERE UN NUMERO È UN GESTO SOLO ═══ */
console.log("\n— 5. per correggere si cambia quel numero e basta —");
await campo(pUno.nome).fill("6"); await p.waitForTimeout(300);
await p.getByRole("button", { name: /Verifica e conferma/ }).click();
await p.waitForTimeout(800);
await p.getByRole("button", { name: /Conferma tutto/ }).click();
await p.waitForTimeout(1200);
const fine = await p.evaluate(async () => await window.__leggi());
const lin = fine.magazzini.find((m) => m.tipo === "linea-lab");
const art = lin.articoli[0];
ok(Math.abs(art.qty - 6) < 1e-9, `la giacenza e' 6 (${art.qty})`);
ok((fine.richieste || []).filter((r) => r.stato === "in-attesa").length === 1,
  `e la richiesta aperta e' sempre una sola (${(fine.richieste || []).filter((r) => r.stato === "in-attesa").length})`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
