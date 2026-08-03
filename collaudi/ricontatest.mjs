/* gen-5.76: contare due volte la stessa linea non fa piu' arrivare il doppio.

   Difetto n.4 del consiglio del 2 agosto. Conti la linea, parte la richiesta
   al laboratorio. Ti accorgi di aver battuto un numero sbagliato e riconti:
   nasceva una SECONDA richiesta identica, perche' la merce non e' ancora
   arrivata e il fabbisogno e' ancora tutto li'. Il laboratorio si trovava due
   righe per lo stesso prodotto, «Confermo tutto» le serviva entrambe, e sulla
   linea arrivava il doppio mentre all'altra sede rispondeva «non ce n'e'».

   La cosa che rende questo difetto istruttivo e' che la protezione nell'app
   c'era gia', scritta bene e col suo commento, duemilacinquecento righe piu'
   su, in un'altra funzione. Non era mai stata portata qui. Correggere il
   primo punto e lasciare il secondo e' il modo piu' comune di credere di aver
   chiuso una cosa che invece resta aperta a meta'.

   I §3 e §4 sono i controcontrolli, e sono la parte che vale. «Non nasce una
   seconda richiesta» sarebbe verde anche in un'app che ha smesso di chiedere
   del tutto, o che si rifiuta di aggiornare il numero quando lo correggi.
   Quindi: il numero DEVE cambiare al secondo conteggio, e un prodotto diverso
   DEVE avere la sua richiesta. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const linea = st.magazzini.find((m) => m.tipo === "linea-lab");
const sedeLinea = st.sedi.find((s) => s.id === linea.sedeId);
const lab = st.magazzini.find((m) => m.tipo === "laboratorio");

st.profili = [{ id: "pr-op", nome: "Operatore", ruolo: "operatore", sedeId: linea.sedeId,
  magazziniIds: [linea.id], colore: "#4C8DF6", pinHash: hash("1234") }];

/* Due prodotti soli sulla linea: quello che si riconta e quello che serve a
   provare che la protezione non e' un tappo generale. Gli altri si azzerano,
   se no il riepilogo si riempie di righe che non c'entrano e un numero
   sbagliato si nasconde in mezzo. */
for (const a of linea.articoli) { a.par = 0; a.qty = 0; delete a.parGiorni; }
const [aUno, aDue] = linea.articoli;
const pUno = st.prodotti.find((p) => p.id === aUno.prodottoId);
const pDue = st.prodotti.find((p) => p.id === aDue.prodottoId);
for (const p of [pUno, pDue]) { p.preparato = true; p.soloInteri = false; delete p.uomLavorazione; }
aUno.par = 10; aUno.qty = 0;
aDue.par = 8; aDue.qty = 0;
/* Il laboratorio ha i due prodotti ma NON li evade da solo: la prova sta
   tutta prima dell'evasione, che e' la finestra in cui nasceva il doppione. */
lab.articoli = [{ prodottoId: pUno.id, uomId: pUno.uomBase, qty: 100, par: 0 },
                { prodottoId: pDue.id, uomId: pDue.uomBase, qty: 100, par: 0 }];
/* niente retro che possa rifornire la linea: si deve passare dal laboratorio */
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
  window.__leggi = async () => JSON.parse((await window.storage.get("scp:stato:v1")).value);
}, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Operatore", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);

/* un giro di conteggio come lo fa una persona: Conteggi, Conta ora, i numeri,
   Verifica e conferma, Conferma tutto */
const conta = async (numeri) => {
  const nav = p.getByText("Conteggi", { exact: true });
  for (let i = 0; i < await nav.count(); i++)
    if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
  await p.waitForTimeout(800);
  /* dopo un conteggio la schermata resta su «Conteggio registrato»: la strada
     vera per rifarne uno passa da quel tasto, non da un ricaricamento */
  const ancora = p.getByRole("button", { name: /Nuovo conteggio/ }).first();
  if (await ancora.count()) { await ancora.click(); await p.waitForTimeout(700); }
  const avvia = p.getByRole("button", { name: /Conta ora/ }).first();
  if (await avvia.count()) { await avvia.click(); await p.waitForTimeout(700); }
  for (const [nome, v] of numeri) {
    await p.getByLabel("Conteggio " + nome).fill(String(v));
    await p.waitForTimeout(200);
  }
  await p.getByRole("button", { name: /Verifica e conferma/ }).click();
  await p.waitForTimeout(800);
  await p.getByRole("button", { name: /Conferma tutto/ }).click();
  await p.waitForTimeout(1200);
  const esito = (await p.locator("body").innerText()).replace(/\n/g, " ");
  return esito;
};
const attese = async (pid) => (await p.evaluate(async () => await window.__leggi()))
  .richieste.filter((r) => r.stato === "in-attesa" && r.prodottoId === pid);

/* ═══ 1. IL PRIMO CONTEGGIO CHIEDE QUELLO CHE MANCA ═══ */
console.log("\n— 1. il primo conteggio fa partire la richiesta —");
await conta([[pUno.nome, 2]]);
const uno1 = await attese(pUno.id);
ok(uno1.length === 1, `una richiesta per «${pUno.nome}» (${uno1.length})`);
ok(uno1[0] && Math.abs(uno1[0].qtyLinea - 8) < 1e-6,
  `e chiede gli 8 che mancano per arrivare a 10 (chiede ${uno1[0]?.qtyLinea})`);

/* ═══ 2. IL DIFETTO: RICONTARE NON RADDOPPIA ═══
   La finestra e' esattamente questa: la richiesta e' ancora in attesa, il
   laboratorio non ha evaso, quindi in magazzino la merce non c'e' e il
   fabbisogno e' ancora tutto li'. */
console.log("\n— 2. ricontando prima che il laboratorio evada, la richiesta resta UNA —");
await conta([[pUno.nome, 4]]);
const uno2 = await attese(pUno.id);
ok(uno2.length === 1,
  `«${pUno.nome}»: c'e' ancora una richiesta sola, non due (${uno2.length})`);

/* ═══ 3. CONTROCONTROLLO: IL NUMERO NUOVO COMANDA ═══
   Senza questo, «non ne nasce una seconda» sarebbe verde anche in un'app che
   si rifiuta di aggiornare il numero — e chi corregge un conteggio sbagliato
   si ritroverebbe servito il numero sbagliato. */
console.log("\n— 3. e porta il numero dell'ultimo conteggio, non del primo —");
ok(uno2[0] && Math.abs(uno2[0].qtyLinea - 6) < 1e-6,
  `adesso ne mancano 6 (10 previsti − 4 contati), e la richiesta dice ${uno2[0]?.qtyLinea}`);
ok(uno2[0] && uno1[0] && uno2[0].id === uno1[0].id,
  "ed e' la stessa riga aggiornata, non una nuova che ha sostituito l'altra");

/* ═══ 4. CONTROCONTROLLO: UN ALTRO PRODOTTO HA LA SUA ═══
   La protezione e' per prodotto, non un tappo su tutte le richieste. */
console.log("\n— 4. un prodotto diverso ha comunque la sua richiesta —");
await conta([[pDue.nome, 1]]);
const due1 = await attese(pDue.id);
ok(due1.length === 1, `«${pDue.nome}» ha la sua richiesta (${due1.length})`);
ok((await attese(pUno.id)).length === 1, `e quella di «${pUno.nome}» e' rimasta una`);

/* ═══ 5. SE LA LINEA È TORNATA PIENA, LA RICHIESTA SI RITIRA ═══
   L'altra meta' della stessa regola: una richiesta aperta per una cosa che
   non manca piu' fa preparare al laboratorio roba che nessuno aspetta. */
console.log("\n— 5. ricontando a livello, la richiesta aperta si ritira —");
const esito5 = await conta([[pUno.nome, 10]]);
ok((await attese(pUno.id)).length === 0,
  `«${pUno.nome}» e' a livello e non resta nessuna richiesta aperta (${(await attese(pUno.id)).length})`);
ok((await attese(pDue.id)).length === 1,
  `mentre quella di «${pDue.nome}», che manca ancora, resta al suo posto`);

/* ═══ 6. E LO SCHERMO LO DICE ═══
   «0 richieste» dopo un conteggio sembra che non sia successo niente: chi
   legge cosi' torna a contare, o peggio chiama il laboratorio a voce. */
console.log("\n— 6. la schermata di fine dice cosa e' successo alle richieste —");
ok(/ritirat/i.test(esito5), `l'esito nomina la richiesta ritirata — «${(esito5.match(/\d+ richiest\w+ ritirat\w+/) || ["non trovato"])[0]}»`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
