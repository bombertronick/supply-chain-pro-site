/* gen-5.56: due lavori.
   1) confermare una richiesta alla volta non salta più la coda dei livelli
   2) Fiumicino e Roma fanno l'inventario nello stesso momento

   Sul primo la prova che conta è che il tasto della singola riga dica lo stesso
   numero che direbbe «Confermo tutto», e che dopo averlo premuto in laboratorio
   resti la roba per la linea che era ancora sotto il livello. Il controllo
   negativo conta uguale: quando c'è abbondanza, o quando l'altra linea è corta
   su un PRODOTTO DIVERSO, il freno non deve scattare — un avviso falso insegna
   a ignorare gli avvisi. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const LAB = base.sedi.find((x) => x.tipo === "laboratorio");
const [FM, RM] = base.sedi.filter((x) => x.tipo === "operatore");
const [PA, PB] = base.prodotti;
/* i due livelli sono DIVERSI di proposito (3 e 4): così i due tasti portano
   numeri diversi e non c'è modo di premere quello sbagliato credendo di aver
   premuto l'altro. Col laboratorio a 7, i livelli (3+4) ci stanno esatti e
   l'extra no: è il caso in cui il freno deve scattare. */
const PAR = 3, PAR_B = 4, IN_PIU = 2, IN_LAB = 7;

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
const qtyDi = (st, magId, pid) => st.magazzini.find((m) => m.id === magId)
  .articoli.find((a) => a.prodottoId === pid).qty;

/* ═══════════ 1. LA SINGOLA RIGA RISPETTA LA CODA ═══════════ */
/* la scena: laboratorio con `inLab` di PA. La linea di fm chiede 3 di livello
   + 2 in più (richiesta già formata, con i campi che gen-5.55 le mette dentro),
   la linea di rm chiede 3 di livello e basta. */
const scena = (inLab, prodottoDiRm) => {
  const s = JSON.parse(JSON.stringify(base));
  const magLab = s.magazzini.find((m) => m.tipo === "laboratorio");
  const lineaA = s.magazzini.find((m) => m.tipo === "linea-lab");
  const lineaB = { id: "mag-linea-b", sedeId: RM.id, nome: "Linea rm", tipo: "linea-lab",
    articoli: [{ prodottoId: prodottoDiRm.id, uomId: prodottoDiRm.uomBase, qty: 0, par: PAR_B }] };
  lineaA.articoli = [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 0, par: PAR }];
  magLab.articoli = [
    { prodottoId: PA.id, uomId: PA.uomBase, qty: inLab, par: 30 },
    { prodottoId: PB.id, uomId: PB.uomBase, qty: 1, par: 30 },
  ];
  s.magazzini = [magLab, lineaA, lineaB];
  const ric = (id, mag, sede, prod, qty, extra) => ({
    id, t: Date.now() - (id === "ric-a" ? 60000 : 30000),
    daSedeId: sede.id, aSedeLabId: LAB.id, daMagazzinoId: mag.id, magNome: mag.nome,
    prodottoId: prod.id, qty, uomId: prod.uomBase, qtyLinea: qty, uomLineaId: prod.uomBase,
    ...(extra ? { extraLinea: extra, qtyLivello: qty - extra } : {}),
    stato: "in-attesa", creataDa: "Op",
  });
  /* «ric-a» prima in elenco: è l'ordine in cui la vecchia passata sola faceva
     danno, perché la prima riga si portava via anche l'extra */
  s.richieste = [ric("ric-a", lineaA, FM, PA, PAR + IN_PIU, IN_PIU),
                 ric("ric-b", lineaB, RM, prodottoDiRm, PAR_B, 0)];
  s.ordini = []; s.movimenti = []; s.log = []; s.codici = []; s.accessi = [];
  s.profili = [{ id: "pr-lab", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id,
    colore: "#22B8CF", magazziniIds: [magLab.id], pinHash: hash("3333") }];
  return { s, magLab, lineaA, lineaB };
};

console.log("\n— 1a. non basta per tutti: la riga si ferma al livello —");
{
  const { s, magLab, lineaA, lineaB } = scena(IN_LAB, PA);
  const L = await apri("Lab", "3333", s, "Richieste");
  const t = (await L.p.locator("body").innerText()).replace(/\s+/g, " ");
  ok(/Il tasto manda 3 pz, cioè il livello/.test(t),
    "la riga con l'extra spiega che il tasto manda solo il livello");
  ok(new RegExp(`non ce n'è abbastanza anche per il livello di «${lineaB.nome}»`).test(t),
    `nominando la linea che resterebbe corta («${lineaB.nome}»)`);
  ok(/usa Cambia/.test(t), "e dicendo da dove mandare l'extra comunque");
  ok(await L.p.getByRole("button", { name: `Conferma ${PAR} pz` }).count() === 1,
    `il tasto della riga con l'extra dice «Conferma ${PAR} pz», non ${PAR + IN_PIU}`);
  ok(await L.p.getByRole("button", { name: `Conferma ${PAR_B} pz` }).count() === 1,
    `e quello dell'altra riga dice ${PAR_B}, il suo livello intero`);
  ok(await L.p.getByRole("button", { name: `Conferma ${PAR + IN_PIU} pz` }).count() === 0,
    "e il numero grande non compare da nessuna parte");
  await L.p.screenshot({ path: "g556-1-frenata.png", fullPage: true });

  /* L'avviso dice «usa Cambia» per mandare l'extra comunque: quell'istruzione
     sta scritta DENTRO l'app, quindi va tenuta da un controllo e non dalla mia
     parola. Se un giorno «Cambia» si mettesse a tagliare al livello, l'app
     direbbe a chi lavora di fare una cosa che non si può fare. */
  await L.p.getByRole("button", { name: /Cambia/ }).first().click();
  await L.p.waitForTimeout(1100);
  const fc = L.p.locator(".fixed.inset-0.z-50").last();
  const campo = fc.locator("input").first();
  ok((await campo.getAttribute("placeholder")) === String(PAR + IN_PIU)
     || (await fc.innerText()).includes(String(PAR + IN_PIU)),
    `«Cambia» parte dal totale chiesto (${PAR + IN_PIU}), non dal livello`);
  await campo.fill(String(PAR + IN_PIU)); await L.p.waitForTimeout(400);
  const tc = (await fc.innerText()).replace(/\s+/g, " ");
  ok(!/non si può|troppo|massimo/i.test(tc),
    "e accetta il totale senza rifiutarlo");
  await fc.getByRole("button", { name: /^Chiudi$|^Annulla$/ }).first().click()
    .catch(async () => { await L.p.locator('[aria-label="Chiudi"]').last().click(); });
  await L.p.waitForTimeout(900);

  /* la prima riga in elenco è quella con l'extra: la confermo per nome della
     riga, non col primo tasto che capita, perché ora anche l'altra riga dice
     «Conferma 3 pz» e prendere quella sbagliata farebbe passare il controllo
     per il motivo sbagliato */
  await L.p.getByRole("button", { name: `Conferma ${PAR} pz` }).click();
  await L.p.waitForTimeout(2200);
  const d = await letto(L.p);
  ok(qtyDi(d, lineaA.id, PA.id) === PAR,
    `la linea che chiedeva l'extra riceve il suo livello: ${qtyDi(d, lineaA.id, PA.id)}`);
  ok(qtyDi(d, magLab.id, PA.id) === IN_LAB - PAR,
    `e in laboratorio restano ${IN_LAB - PAR} per l'altra linea (${qtyDi(d, magLab.id, PA.id)})`);
  /* e adesso l'altra ce la fa: è questa la differenza che si sente in cucina.
     Confermata la prima, resta una sola richiesta in attesa, quindi il tasto
     che trovo è per forza il suo. */
  ok(await L.p.getByRole("button", { name: /^Conferma \d/ }).count() === 1,
    "confermata la prima, resta una sola richiesta da confermare");
  await L.p.getByRole("button", { name: `Conferma ${PAR_B} pz` }).first().click();
  await L.p.waitForTimeout(2200);
  const d2 = await letto(L.p);
  ok(qtyDi(d2, lineaB.id, PA.id) === PAR_B,
    `anche la seconda linea arriva al suo livello: ${qtyDi(d2, lineaB.id, PA.id)} su ${PAR_B} (con la vecchia riga singola sarebbe rimasta a ${IN_LAB - PAR - IN_PIU})`);
  ok(d2.richieste.every((r) => r.stato !== "in-attesa"), "e non resta niente in attesa");
  await L.ctx.close();
}

console.log("\n— 1b. i controlli negativi: il freno non deve scattare a vuoto —");
{
  /* abbondanza: 20 in laboratorio, nessuno resta corto */
  const { s } = scena(20, PA);
  const L = await apri("Lab", "3333", s, "Richieste");
  const t = (await L.p.locator("body").innerText()).replace(/\s+/g, " ");
  ok(!/cioè il livello/.test(t), "con abbondanza in laboratorio nessun avviso");
  ok(await L.p.getByRole("button", { name: `Conferma ${PAR + IN_PIU} pz` }).count() === 1,
    `e il tasto manda tutto quello che è stato chiesto (${PAR + IN_PIU} pz)`);
  await L.ctx.close();
}
{
  /* l'altra linea è corta su un PRODOTTO DIVERSO: non c'entra niente con
     l'extra di questa, e frenare qui sarebbe un avviso falso */
  const { s } = scena(IN_LAB, PB);
  const L = await apri("Lab", "3333", s, "Richieste");
  const t = (await L.p.locator("body").innerText()).replace(/\s+/g, " ");
  ok(!/cioè il livello/.test(t),
    "se l'altra linea è corta su un altro prodotto il freno non scatta");
  ok(await L.p.getByRole("button", { name: `Conferma ${PAR + IN_PIU} pz` }).count() === 1,
    "e il tasto resta pieno");
  await L.p.screenshot({ path: "g556-2-nessun-falso.png", fullPage: true });
  await L.ctx.close();
}

/* ═══════════ 2. DUE SEDI, DUE INVENTARI ═══════════ */
console.log("\n— 2. Fiumicino e Roma nello stesso momento —");
const s2 = JSON.parse(JSON.stringify(base));
const retroFm = s2.magazzini.find((m) => m.tipo === "retro");
retroFm.sedeId = FM.id; retroFm.nome = "Secco fm";
retroFm.articoli = [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 4, par: 10 }];
const retroRm = { id: "mag-retro-rm", sedeId: RM.id, nome: "Secco rm", tipo: "retro",
  articoli: [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 7, par: 10 }] };
s2.magazzini = [retroFm, retroRm];
s2.richieste = []; s2.ordini = []; s2.movimenti = []; s2.log = []; s2.codici = []; s2.accessi = [];
s2.profili = [
  { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  { id: "pr-fm", nome: "Fm", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [retroFm.id], pinHash: hash("2222") },
  { id: "pr-rm", nome: "Rm", ruolo: "operatore", sedeId: RM.id, colore: "#E8A13C",
    magazziniIds: [retroRm.id], pinHash: hash("4444") },
];

/* Fiumicino apre il suo e conta */
const F = await apri("Fm", "2222", s2, "Magazzini");
await F.p.getByRole("button", { name: /^Inventario$/ }).click(); await F.p.waitForTimeout(1100);
const ff = F.p.locator(".fixed.inset-0.z-50").last();
await ff.getByRole("button", { name: /Avvia inventario/ }).click(); await F.p.waitForTimeout(1500);
await ff.getByText(retroFm.nome, { exact: true }).first().click(); await F.p.waitForTimeout(1000);
await ff.locator(`input[aria-label="Contato di ${PA.nome} in ${retroFm.nome}"]`).fill("9");
await F.p.waitForTimeout(300);
await ff.getByRole("button", { name: /Magazzino fatto/ }).click(); await F.p.waitForTimeout(1700);
const dFm = await letto(F.p);
ok(!!dFm.invCorso?.[FM.id], "l'inventario di Fiumicino è salvato sotto la sua sede");
ok(dFm.invCorso[FM.id].magIds.length === 1
  && dFm.invCorso[FM.id].magIds[0] === retroFm.id,
  "e contiene solo i magazzini di Fiumicino");
ok(!dFm.inventario, "il vecchio campo unico non viene più scritto");

/* Roma, partendo da quei dati, deve poter aprire il SUO */
const R = await apri("Rm", "4444", dFm, "Magazzini");
const bR = R.p.getByRole("button", { name: /^Inventario$/ });
ok(await bR.count() === 1,
  "per Roma il tasto dice ancora «Inventario»: quello di Fiumicino non la riguarda");
await bR.click(); await R.p.waitForTimeout(1100);
const fr = R.p.locator(".fixed.inset-0.z-50").last();
const tR = (await fr.innerText()).replace(/\s+/g, " ");
ok(/Avvia inventario/.test(tR), "e trova il tasto per avviare il proprio");
ok(!new RegExp(retroFm.nome).test(tR), `senza vedersi il magazzino di Fiumicino («${retroFm.nome}»)`);
await fr.getByRole("button", { name: /Avvia inventario/ }).click(); await R.p.waitForTimeout(1500);
await fr.getByText(retroRm.nome, { exact: true }).first().click(); await R.p.waitForTimeout(1000);
await fr.locator(`input[aria-label="Contato di ${PA.nome} in ${retroRm.nome}"]`).fill("5");
await R.p.waitForTimeout(300);
await fr.getByRole("button", { name: /Magazzino fatto/ }).click(); await R.p.waitForTimeout(1700);
const dDue = await letto(R.p);
ok(!!dDue.invCorso?.[FM.id] && !!dDue.invCorso?.[RM.id],
  "i due inventari convivono, uno per sede");
ok(dDue.invCorso[FM.id].valori[`${retroFm.id}|${PA.id}`] === 9
  && dDue.invCorso[RM.id].valori[`${retroRm.id}|${PA.id}`] === 5,
  "e ognuno tiene i suoi conteggi, senza mescolarsi (9 e 5)");
await R.p.screenshot({ path: "g556-3-due-sedi.png", fullPage: true });

/* Roma chiude: il suo si scrive, quello di Fiumicino non si tocca */
await fr.getByRole("button", { name: /Chiudi inventario/ }).click(); await R.p.waitForTimeout(900);
await R.p.getByRole("button", { name: /^Correggi 1$/ }).click(); await R.p.waitForTimeout(2200);
const dChiuso = await letto(R.p);
ok(qtyDi(dChiuso, retroRm.id, PA.id) === 5, "la giacenza di Roma è quella contata (5)");
ok(qtyDi(dChiuso, retroFm.id, PA.id) === 4,
  "quella di Fiumicino NON è stata toccata: il suo inventario è ancora aperto (4)");
ok(!dChiuso.invCorso?.[RM.id], "la sessione di Roma è chiusa");
ok(!!dChiuso.invCorso?.[FM.id], "quella di Fiumicino è ancora lì, intatta");
ok((dChiuso.inventari || []).length === 1
  && dChiuso.inventari[0].righe.length === 1,
  "e resta il foglio del solo inventario di Roma");
await R.ctx.close(); await F.ctx.close();

/* l'admin non deve potersi prendere magazzini già dentro un inventario altrui */
const A = await apri("Admin", "1234", dChiuso, "Magazzini");
/* Da gen-5.57 il tasto dell'admin porta l'avanzamento dell'inventario aperto
   da ALTRI («Inventario · 0 su 1»), perché dire «Inventario» mentre una
   squadra sta contando sarebbe una bugia. Questo controllo cercava solo
   l'etichetta secca e non trovava più niente: la colpa era del controllo, non
   dell'app — ma nel frattempo i tre controlli qui sotto non giravano più. */
/* gen-5.64 ha aggiunto la terza forma: quando il giro è di UN ALTRO l'admin
   legge «Inventario · N in corso» invece di una frazione che non è la sua.
   Qui il controllo serve a dire che il tasto si trova e si apre, quindi accetta
   tutte e tre le forme; che la forma sia quella giusta lo prova invtasto.mjs. */
const bA = A.p.getByRole("button", { name: /^Inventario( · (\d+ su \d+|\d+ in corso))?$/ });
ok(await bA.count() === 1,
  `l'admin trova il tasto inventario («${await bA.innerText().catch(() => "?")}»)`);
await bA.click(); await A.p.waitForTimeout(1100);
const fa = A.p.locator(".fixed.inset-0.z-50").last();
const tA = (await fa.innerText()).replace(/\s+/g, " ");
/* Da gen-5.57 l'admin sceglie prima la sede, e da lì ENTRA nella sessione di
   quella sede invece di aprirne una seconda: è quello che impedisce davvero il
   doppio conteggio, meglio del vecchio elenco «questi restano fuori». Il
   controllo di prima cercava quell'elenco, che su due sedi non compare più. */
ok(/scegli su quale fare il giro/.test(tA),
  "l'admin, che non ha una sede, sceglie prima su quale fare il giro");
await fa.getByText(FM.nome, { exact: true }).first().click(); await A.p.waitForTimeout(1000);
const tA2 = (await fa.innerText()).replace(/\s+/g, " ");
ok(/1 differenza finora|differenze finora/.test(tA2),
  `scelta ${FM.nome}, l'admin ENTRA nell'inventario già aperto da Fm invece di aprirne un secondo`);
/* la prova che conta: nessuna seconda sessione è nata su quella sede */
const dA = await letto(A.p);
ok(Object.keys(dA.invCorso || {}).length === 1 && !!dA.invCorso[FM.id],
  "e nel database resta una sola sessione, quella di Fiumicino");
ok(dA.invCorso[FM.id].valori[`${retroFm.id}|${PA.id}`] === 9,
  "coi conteggi di Fm ancora dentro, non azzerati (9)");
await A.p.screenshot({ path: "g556-4-occupato.png", fullPage: true });
await A.ctx.close();

/* ── compatibilità: un inventario aperto con la versione di ieri ── */
console.log("\n— 2b. un inventario aperto con la versione precedente —");
const sVecchio = JSON.parse(JSON.stringify(s2));
sVecchio.inventario = { id: "inv-vecchio", t: Date.now() - 3600000, chi: "Fm",
  magIds: [retroFm.id], valori: { [`${retroFm.id}|${PA.id}`]: 8 }, chiusi: [retroFm.id] };
const V = await apri("Fm", "2222", sVecchio, "Magazzini");
const bV = V.p.getByRole("button", { name: /^Inventario · \d+ su \d+$/ });
ok(await bV.count() === 1,
  `chi ne ha i magazzini lo ritrova col suo avanzamento («${await bV.innerText().catch(() => "?")}»)`);
await bV.click(); await V.p.waitForTimeout(1100);
const fv = V.p.locator(".fixed.inset-0.z-50").last();
ok(/1 differenza finora/.test(await fv.innerText()),
  "coi conteggi già fatti ancora dentro");
await fv.getByRole("button", { name: /Chiudi inventario/ }).click(); await V.p.waitForTimeout(900);
await V.p.getByRole("button", { name: /^Correggi 1$/ }).click(); await V.p.waitForTimeout(2200);
const dV = await letto(V.p);
ok(qtyDi(dV, retroFm.id, PA.id) === 8, "chiudendolo la correzione si scrive (8)");
ok(!dV.inventario, "e il vecchio campo sparisce, non resta un inventario fantasma");
ok((dV.inventari || []).length === 1, "col suo foglio negli inventari chiusi");
await V.ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs.join(" | ") : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
