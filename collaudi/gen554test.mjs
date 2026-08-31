/* gen-5.54: chiedere al laboratorio più del previsto, e il foglio di un
   inventario chiuso.

   La prova che conta sul primo non è che il campo accetti un −2: è che, dopo
   che il laboratorio ha consegnato, sulla linea ci siano 5 e non 3. Se la
   giacenza contata fosse davvero −2, la consegna farebbe −2 + 5 = 3 e la linea
   resterebbe indietro per sempre di quei 2 chiesti in più. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

/* ── la scena: una linea rifornita dal laboratorio, due articoli entrambi a
      livello (3 su 3 e 5 su 5). Il laboratorio ne ha 20 a testa, quindi tutto
      quello che si chiede si può servire: se qualcosa non torna è colpa del
      conto, non della merce che manca. ── */
const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
const LAB = s.sedi.find((x) => x.tipo === "laboratorio");
const FM = s.sedi.filter((x) => x.tipo === "operatore")[0];
const magLab = s.magazzini.find((m) => m.tipo === "laboratorio");
const linea = s.magazzini.find((m) => m.tipo === "linea-lab");
const retro = s.magazzini.find((m) => m.tipo === "retro");
const [PA, PB] = s.prodotti;
const PAR_A = 3, PAR_B = 5, IN_PIU = 2;

linea.articoli = [
  { prodottoId: PA.id, uomId: PA.uomBase, qty: PAR_A, par: PAR_A },
  { prodottoId: PB.id, uomId: PB.uomBase, qty: PAR_B, par: PAR_B },
];
magLab.articoli = [PA, PB].map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 20, par: 30 }));
/* il retro lo riduco a due caselle sole: l'inventario dell'admin le passa
   tutte, e con 32 righe la schermata diventa illeggibile in fotografia */
retro.articoli = [
  { prodottoId: PA.id, uomId: PA.uomBase, qty: 4, par: 10 },
  { prodottoId: PB.id, uomId: PB.uomBase, qty: 6, par: 10 },
];
s.magazzini = [retro, magLab, linea];
s.richieste = []; s.ordini = []; s.movimenti = []; s.log = []; s.codici = []; s.accessi = [];
s.profili = [
  { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4",
    magazziniIds: [retro.id], pinHash: hash("1234") },
  { id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], pinHash: hash("2222") },
  { id: "pr-lab", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id, colore: "#22B8CF",
    magazziniIds: [magLab.id], pinHash: hash("3333") },
];

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
/* seme passato ogni volta: così la seconda schermata parte da quello che ha
   lasciato la prima, e la catena operatore → laboratorio è quella vera */
const apri = async (nome, pin, seme, dove, largo = 390) => {
  const ctx = await b.newContext({ viewport: { width: largo, height: 820 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
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

/* ═══════════ 1. CHIEDERE PIÙ DEL PREVISTO ═══════════ */
console.log("\n— 1. chiedere al laboratorio più del previsto —");
const O = await apri("Op", "2222", s, "Conteggi");
await O.p.getByText(linea.nome, { exact: true }).first().click().catch(() => {});
await O.p.getByRole("button", { name: /Conta ora/ }).first().click();
await O.p.waitForTimeout(1200);

const t0 = await O.p.locator("body").innerText();
ok(/più del previsto/.test(t0) && /sotto zero/.test(t0),
  "la schermata spiega come si chiede più del previsto");

const campoA = O.p.locator(`input[aria-label^="Conteggio ${PA.nome}"]`).first();
ok(await campoA.count() === 1, "c'è il campo del primo articolo");

/* la via che funziona su ogni telefono: il tasto meno. Sulla tastiera
   numerica dell'iPhone il segno meno non c'è, quindi è QUESTA che va provata,
   non il testo battuto a mano.
   DUE INVECCHIAMENTI PRESI DAL TRIAGE DEL 31/08/2026:
   · gen-5.93 (18 ago) ordina gli articoli in ALFABETO dentro la categoria:
     «Pachino no condito» viene prima di «Patate forno», quindi .first() non
     era più la scheda giusta — il meno si prende dalla scheda del campo,
     non dalla posizione in pagina;
   · gen-5.79 (4 ago): la casella NON parte più vuota, mostra la giacenza,
     e il meno scende da lì. Per arrivare a −2 partendo dai 3 della linea
     servono PAR_A + IN_PIU pressioni. */
const meno = campoA.locator('xpath=preceding-sibling::button[@aria-label="Diminuisci"]');
for (let i = 0; i < PAR_A + IN_PIU; i++) { await meno.click(); await O.p.waitForTimeout(160); }
ok((await campoA.inputValue()) === String(-IN_PIU),
  `premendo il meno si scende sotto zero: il campo dice ${await campoA.inputValue()}`);

const t1 = (await O.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(new RegExp(`${PAR_A} \\+ ${IN_PIU} in più`).test(t1),
  `la pastiglia dice cosa sta chiedendo: «${PAR_A} + ${IN_PIU} in più»`);
const aria = await campoA.getAttribute("aria-label");
ok(/nessuno sul posto/.test(aria) && new RegExp(`chiedo ${IN_PIU}`).test(aria),
  `e chi legge lo schermo sente la stessa cosa («${aria}»)`);
await O.p.screenshot({ path: "g554-1-conteggio.png", fullPage: true });

/* il fondo: tenendo premuto il meno non si scende all'infinito */
for (let i = 0; i < 100; i++) await meno.click({ timeout: 4000 });
await O.p.waitForTimeout(300);
const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
const fondo = num(await campoA.inputValue());
ok(fondo === -99, `il meno tenuto premuto si ferma a −99, non va all'infinito (${fondo})`);

/* col dito scappato sul meno la richiesta diventa assurda: prima di scrivere
   niente, il riepilogo deve dirlo. È l'unica rete su un errore di battitura. */
await O.p.getByRole("button", { name: /Verifica e conferma/ }).click();
await O.p.waitForTimeout(1100);
ok(/più del doppio/.test((await O.p.locator("body").innerText()).replace(/\s+/g, " ")),
  `chiedere 99 dove ne sono previsti ${PAR_A} fa scattare l'avviso del doppio`);
await O.p.screenshot({ path: "g554-2-doppio.png", fullPage: true });
await O.p.getByRole("button", { name: /^Torna$/ }).click();
await O.p.waitForTimeout(900);

/* e lo rimetto a −2, che è il caso vero */
await campoA.fill(String(-IN_PIU)); await O.p.waitForTimeout(300);
ok((await campoA.inputValue()) === String(-IN_PIU),
  "e il meno si può anche battere a mano, dove la tastiera ce l'ha");

/* il secondo articolo lo lascio a livello: non deve generare niente.
   Anche qui per SCHEDA e non per posizione (alfabeto di gen-5.93). */
const campoB = O.p.locator(`input[aria-label^="Conteggio ${PB.nome}"]`).first();
await campoB.locator('xpath=following-sibling::button[@aria-label="Uguale al previsto"]').click();
await O.p.waitForTimeout(300);
await O.p.getByRole("button", { name: /Verifica e conferma/ }).click();
await O.p.waitForTimeout(1200);

const t2 = (await O.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(new RegExp(`${PAR_A} previsti \\+ ${IN_PIU} in più`).test(t2),
  "nel riepilogo la riga si legge a parole, non come un numero negativo");
ok(/Sulla linea non c'è niente e ne stai chiedendo/.test(t2),
  "e c'è scritto nero su bianco che sulla linea non c'è niente");
ok(new RegExp(`Richiesta al laboratorio: ${PAR_A + IN_PIU} `).test(t2),
  `la richiesta al laboratorio è di ${PAR_A + IN_PIU}, non di ${PAR_A}`);
ok(!/più del doppio/.test(t2),
  `chiedere ${IN_PIU} su ${PAR_A} previsti non fa scattare l'avviso del doppio`);
await O.p.screenshot({ path: "g554-2-riepilogo.png", fullPage: true });

await O.p.getByRole("button", { name: /Conferma tutto/ }).click();
await O.p.waitForTimeout(2200);

const d1 = await letto(O.p);
const ricA = d1.richieste.filter((r) => r.prodottoId === PA.id);
ok(ricA.length === 1, `è partita una richiesta sola per «${PA.nome}» (${ricA.length})`);
ok(ricA[0]?.qtyLinea === PAR_A + IN_PIU,
  `che chiede ${PAR_A + IN_PIU} in unità di linea (${ricA[0]?.qtyLinea})`);
ok(d1.richieste.filter((r) => r.prodottoId === PB.id).length === 0,
  `«${PB.nome}», lasciato a livello, non ha generato niente`);

/* ── QUI STA IL PUNTO: la giacenza scritta è zero, non −2 ── */
const qLinea = qtyDi(d1, linea.id, PA.id);
ok(qLinea === 0, `sulla linea è scritto 0, non ${-IN_PIU}: un negativo in giacenza è una bugia (${qLinea})`);
const movA = d1.movimenti.filter((m) => m.prodottoId === PA.id && m.causale === "conteggio");
ok(movA.length === 1 && movA[0].dopo === 0 && movA[0].delta === -PAR_A,
  `e il movimento dice «da ${PAR_A} a 0», non «a ${-IN_PIU}» (dopo ${movA[0]?.dopo}, delta ${movA[0]?.delta})`);
await O.ctx.close();

/* ── LA PROVA CHE CONTA: il laboratorio consegna, e sulla linea ci sono 5 ── */
const L = await apri("Lab", "3333", d1, "Richieste");
const tL = (await L.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(new RegExp(`${PAR_A + IN_PIU}`).test(tL), `il laboratorio vede la richiesta da ${PAR_A + IN_PIU}`);
await L.p.getByRole("button", { name: new RegExp(`^Conferma ${PAR_A + IN_PIU}\\b`) }).first().click();
await L.p.waitForTimeout(2000);

const d2 = await letto(L.p);
const qDopo = qtyDi(d2, linea.id, PA.id);
ok(qDopo === PAR_A + IN_PIU,
  `consegnato, sulla linea ci sono ${PAR_A + IN_PIU}: i ${IN_PIU} in più sono arrivati davvero (${qDopo})`);
ok(qtyDi(d2, magLab.id, PA.id) === 20 - (PAR_A + IN_PIU),
  `e dal laboratorio ne sono usciti ${PAR_A + IN_PIU} (${qtyDi(d2, magLab.id, PA.id)})`);
ok(d2.movimenti.every((m) => m.dopo >= -1e-9),
  "in tutta la catena nessun movimento lascia una giacenza negativa");
await L.p.screenshot({ path: "g554-3-consegnato.png", fullPage: true });
await L.ctx.close();

/* ═══════════ 2. IL FOGLIO DI UN INVENTARIO CHIUSO ═══════════ */
console.log("\n— 2. rivedere un inventario dopo averlo chiuso —");
/* parto con l'archivio già pieno: serve a provare che chiudendone un altro i
   dati non crescono all'infinito, e che è il più vecchio a uscire. Il tetto
   nell'app è 4, quindi qui ne metto 5 e mi aspetto che ne restino 4. */
const MAX_FOGLI = 4;
const semeInv = JSON.parse(JSON.stringify(s));
semeInv.inventari = Array.from({ length: MAX_FOGLI + 1 }, (_, i) => ({
  id: "inv-vecchio-" + (i + 1), t: 1700000000000 - i * 86400000,
  tFine: 1700000100000 - i * 86400000, chi: "Tizio", chiusoDa: "Tizio",
  magIds: [retro.id], contate: 2, righe: [],
}));

const A = await apri("Admin", "1234", semeInv, "Magazzini");
await A.p.getByRole("button", { name: /^Inventario$/ }).click();
await A.p.waitForTimeout(1100);
const fi = A.p.locator(".fixed.inset-0.z-50").last();
/* Da gen-5.57 l'admin, che non ha una sede, scegli prima su quale fare il giro.
   Qui interessa il caso «tutte le sedi», che è quello che questo controllo
   provava prima che la scelta esistesse. */
if (await fi.getByText(/Tutte le sedi in un giro solo/).count()) {
  await fi.getByText(/Tutte le sedi in un giro solo/).click();
  await A.p.waitForTimeout(900);
}

/* la porta d'ingresso agli inventari chiusi sta sulla schermata di partenza */
const tS = await fi.innerText();
ok(/Inventari chiusi/.test(tS), "prima di avviare, c'è la voce «Inventari chiusi»");
ok(new RegExp(`${MAX_FOGLI + 1} fogli`).test(tS),
  `che dice quanti sono («${new RegExp(MAX_FOGLI + 1 + " fogli[^\n]*").exec(tS)?.[0] ?? "?"}»)`);
ok(!/1 magazzini\b/.test(tS), "e il conteggio dei magazzini non dice più «1 magazzini»");
await A.p.screenshot({ path: "g554-4-inv-partenza.png", fullPage: true });

await fi.getByRole("button", { name: /Avvia inventario/ }).click();
await A.p.waitForTimeout(1500);
await fi.getByText(retro.nome, { exact: true }).first().click();
await A.p.waitForTimeout(1100);
/* una casella diversa e una uguale: solo la prima è una differenza */
await fi.locator(`input[aria-label="Contato di ${PA.nome} in ${retro.nome}"]`).fill("9");
await fi.locator(`input[aria-label="Contato di ${PB.nome} in ${retro.nome}"]`).fill("6");
await A.p.waitForTimeout(400);
await fi.getByRole("button", { name: /Magazzino fatto/ }).click();
await A.p.waitForTimeout(1600);
/* il secondo magazzino lo segno fatto senza contare niente: così ne resta uno
   solo indietro e si vede se l'app sa dire «1 magazzino» al singolare */
await fi.getByText(magLab.nome, { exact: true }).first().click();
await A.p.waitForTimeout(1000);
await fi.getByRole("button", { name: /Magazzino fatto/ }).click();
await A.p.waitForTimeout(1600);

/* anche a inventario in corso si deve poter guardare indietro */
ok(await fi.getByRole("button", { name: /Inventari chiusi/ }).count() === 1,
  "anche con un inventario in corso si arriva a quelli chiusi");
await fi.getByRole("button", { name: /Chiudi (inventario|comunque)/ }).click();
await A.p.waitForTimeout(900);
const tConf = (await A.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/foglio di questo inventario resta/.test(tConf),
  "la conferma dice che il foglio resterà consultabile");
ok(/1 magazzino non l'hai ancora segnato come fatto/.test(tConf),
  `con uno solo indietro dice «1 magazzino», non «1 magazzini» («${/\d+ magazzin[^,]*/.exec(tConf)?.[0] ?? "?"}»)`);
await A.p.getByRole("button", { name: /^Correggi 1$/ }).click();
await A.p.waitForTimeout(2200);

const d3 = await letto(A.p);
ok(!d3.inventario, "l'inventario in corso è chiuso");
ok(Array.isArray(d3.inventari) && d3.inventari.length === MAX_FOGLI,
  `restano ${MAX_FOGLI} fogli e non ${MAX_FOGLI + 2}: l'archivio non cresce all'infinito (${d3.inventari?.length})`);
ok(!d3.inventari.some((f) => /inv-vecchio-[45]/.test(f.id)),
  "e sono usciti i due più vecchi, non due a caso");
ok(d3.inventari.slice(1).every((f, i) => f.id === "inv-vecchio-" + (i + 1)),
  "quelli che restano sono in ordine, dal più recente al più vecchio");
const f0 = d3.inventari[0];
ok(f0.righe.length === 1,
  `il foglio nuovo tiene una riga sola: la differenza vera, non le due caselle contate (${f0.righe.length})`);
ok(f0.righe[0].p === PA.id && f0.righe[0].da === 4 && f0.righe[0].a === 9,
  `e dice da 4 a 9 su «${PA.nome}» (${JSON.stringify(f0.righe[0])})`);
ok(f0.contate === 2 && f0.chi === "Admin",
  `col conto delle caselle passate e chi le ha contate (${f0.contate}, ${f0.chi})`);
/* il foglio non deve pesare: sei fogli come questo sono una manciata di byte */
const peso = JSON.stringify(d3.inventari).length;
ok(peso < 4000, `${MAX_FOGLI} fogli occupano ${peso} byte, non chilobyte`);

/* e adesso si rilegge dallo schermo */
await A.p.getByRole("button", { name: /^Inventario$/ }).click();
await A.p.waitForTimeout(1100);
const fi2 = A.p.locator(".fixed.inset-0.z-50").last();
/* di nuovo la scelta della sede: chiuso l'inventario non ce n'è più uno aperto,
   quindi l'admin la rivede */
if (await fi2.getByText(/Tutte le sedi in un giro solo/).count()) {
  await fi2.getByText(/Tutte le sedi in un giro solo/).click();
  await A.p.waitForTimeout(900);
}
ok(new RegExp(`${MAX_FOGLI} fogli`).test(await fi2.innerText()),
  `riaprendo, l'archivio dice ${MAX_FOGLI} fogli: il tetto tiene`);
await fi2.getByText("Inventari chiusi", { exact: true }).click();
await A.p.waitForTimeout(1000);
const tArch = await fi2.innerText();
ok(/1 differenza/.test(tArch), "nell'elenco il foglio nuovo dice che ha una differenza");
ok(/0 differenze/.test(tArch), "e quelli vecchi senza differenze lo dicono");

/* apro il foglio nuovo: deve mostrare la riga, non solo contarla */
await fi2.locator("button[aria-expanded]").first().click();
await A.p.waitForTimeout(900);
const tFoglio = (await fi2.innerText()).replace(/\s+/g, " ");
ok(new RegExp(PA.nome).test(tFoglio), `aperto, nomina il prodotto («${PA.nome}»)`);
ok(new RegExp(retro.nome).test(tFoglio), "e il magazzino dov'era");
/* niente alternative comode qui: la riga deve dire proprio «da quanto a
   quanto», che è l'unica cosa che serve a chi cerca dove sparisce la merce */
ok(/4 → 9 pz/.test(tFoglio), "e mostra il prima e il dopo, non solo il quanto");
ok(/manca il prezzo/.test(tFoglio),
  "senza prezzi non inventa un valore: dice perché non può calcolarlo");
await A.p.screenshot({ path: "g554-5-foglio.png", fullPage: true });

/* un foglio vuoto non deve sembrare un errore */
await fi2.locator("button[aria-expanded]").nth(1).click();
await A.p.waitForTimeout(800);
ok(/i numeri dell'app erano giusti/.test(await fi2.innerText()),
  "un inventario senza differenze lo dice invece di mostrare il vuoto");

/* le rettifiche restano anche nello storico: il foglio si aggiunge, non sostituisce */
const rett = d3.movimenti.filter((m) => m.causale === "rettifica" && m.rif === "inventario");
ok(rett.length === 1, `nello storico resta anche la rettifica (${rett.length})`);
ok((d3.ordini || []).length === 0, "e l'inventario non ha generato nessun ordine");
await A.p.screenshot({ path: "g554-6-vuoto.png", fullPage: true });
await A.ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs.join(" | ") : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
