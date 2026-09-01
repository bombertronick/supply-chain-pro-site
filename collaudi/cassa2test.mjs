/* gen-6.00: la Cassa da banco — R2+R3 del piano della veste (approvato col
   «procedi» del 31 agosto).

   IL SENSO: la Cassa deve aprirsi SULLA BATTUTA. Oggi la card «Oggi» con le
   ultime otto vendite occupa mezzo schermo prima della griglia, e chi batte
   scorre. Le foto della revisione (shots598, foto 09-10) l'hanno mostrato.

   IL CONTRATTO DI QUESTO BANCO (nomi fissati QUI, il codice si adegua):
   · la card «Oggi» si comprime a UNA riga di chip; le ultime vendite — e i
     cerchietti rossi dello storno — vanno dietro un Foglio aperto dal tasto
     «Ultime vendite»; la riga del Foglio SI TOCCA per stornare e tiene
     l'aria-label di sempre («Storna la vendita delle HH:MM»);
   · i GRUPPI della griglia si ordinano per battute (conteggio client dalle
     vendite presenti nello stato — che per costruzione sono le ultime 48
     ore, sfoltisciVendite le tiene lì), «Altro» SEMPRE ultimo anche se
     batte più di tutti: è il ripieno senza nome, non un gruppo scelto;
   · la cella mostra QUANTE ce ne sono già nel conto (badge + data-nel-conto)
     e il prezzo sale a text-sm;
   · resto contanti: campo «Ricevuti» nel Foglio d'incasso, «Resto» grande;
     SOLO stato locale della vista — la vendita registrata NON porta campi
     ricevuti/resto (zero fiscale, zero peso sul canale);
   · «Svuota» si può disfare: «Ripristina il conto» riporta il conto com'era;
   · i tasti del conto (più, meno, Svuota) diventano bersagli da 44px.

   SCRITTO PRIMA DELLE MODIFICHE. Contro gen-5.99 devono essere ROSSI:
   §1 (fonte), §2 (ordine gruppi + badge), §3a-c (Oggi compresso, Foglio),
   §4a-c (resto), §5b-c (ripristino), §6 (44px). Contro-controlli verdi
   anche su gen-5.99: §3d (lo storno arriva in fondo comunque), §4d (la
   vendita resta pulita), §5a (Svuota svuota). */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 90)}`); } };

const giornoDi = (t) => { const d = new Date(t);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con almeno 2 articoli");
const artA = linea.articoli[0];
artA.qty = 10;
FM.cassaMagId = linea.id;
/* il listino del banco: tre gruppi veri più una voce SENZA gruppo (finisce
   in «Altro»). In alfabeto uscirebbero ALTRO, BERE, MANGIARE: l'ordine per
   battute qui sotto deve dare MANGIARE, BERE e ALTRO comunque ultimo. */
base.listino = [
  { id: "li-spr", nome: "Spritz", gruppo: "Bere", prezzo: 5, aliquota: 10, attivo: true,
    varianti: [], distinta: [{ prodottoId: artA.prodottoId, qty: 0.5, uomId: artA.uomId }] },
  { id: "li-pan", nome: "Panino", gruppo: "Mangiare", prezzo: 8, attivo: true,
    varianti: [{ id: "va-maxi", nome: "Maxi", delta: 1.5 }], distinta: [] },
  { id: "li-acq", nome: "Acqua", prezzo: 1, attivo: true, varianti: [], distinta: [] },
];
/* le battute recenti che decidono l'ordine: Mangiare 4, Bere 1, Altro 10.
   Se qualcuno ordinasse per solo conteggio, «Altro» salterebbe in cima:
   questo banco lo boccia. I timestamp stanno a mezz'ora fa, dentro le 48
   ore per costruzione. */
const tSeed = Date.now() - 30 * 60 * 1000;
const semina = [];
const battuta = (gruppo, nome, quante) => {
  for (let i = 0; i < quante; i++) semina.push({
    id: `vn-seme-${gruppo}-${i}`, t: tSeed - i * 1000, giorno: giornoDi(tSeed), sedeId: FM.id,
    chi: "Semina", n: semina.length + 1, metodo: "contanti", stato: "registrata", totale: 1,
    righe: [{ voceId: "x-" + gruppo, nome, qty: 1, prezzo: 1, gruppo }], scarico: [],
  });
};
battuta("Mangiare", "Piatto M", 4);
battuta("Bere", "Bibita B", 1);
battuta("Altro", "Cosa A", 10);
base.vendite = semina;

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  opCassa: { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") },
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
/* l'ultimo Foglio aperto: stesso aggancio di veritatest (§8) */
const foglio = (p) => p.locator(".fixed.inset-0").last();
const stato = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const incassa = async (p, metodo) => {
  await p.getByRole("button", { name: "Incassa", exact: true }).click(); await p.waitForTimeout(600);
  if (metodo !== "Contanti") { await p.getByRole("button", { name: metodo, exact: true }).click(); await p.waitForTimeout(250); }
  await p.getByRole("button", { name: "Registra l'incasso", exact: true }).click();
  await p.waitForTimeout(1400);
};

/* ═══ 1. LA FONTE: la versione sale, il prezzo in cella sale a text-sm ═══ */
console.log("\n— 1. la fonte —");
const src = readFileSync("../app/app.jsx", "utf8");
/* 01/09: qui c'era la versione inchiodata a «gen-6.00». Era giusta il giorno
   del rilascio e SBAGLIATA da quello dopo: al primo rilascio successivo
   (gen-6.01, le postazioni ai profili) e' diventata rossa da sola senza che
   niente fosse rotto — il tipo di rosso che insegna a non fidarsi del rosso.
   Quello che questo banco deve difendere e' che la Cassa da banco non torni
   indietro: la versione non puo' essere PIU' VECCHIA di quella che l'ha
   introdotta. Che salga a ogni rilascio lo garantiscono il rito del rilascio
   (meta + roadmap + memoria verificate) e memoriatest, che confronta le due
   lingue. */
const ver = (src.match(/const VERSIONE = "gen-(\d+)\.(\d+)"/) || []).slice(1).map(Number);
ok(ver.length === 2 && (ver[0] > 6 || (ver[0] === 6 && ver[1] >= 0)),
  `VERSIONE è gen-${ver.join(".")}: non più vecchia di gen-6.00, che ha portato la Cassa da banco`);
/* il prezzo dentro la cella della griglia: oggi text-xs, deve salire.
   01/09: l'aggancio «prima riga con fmtEuro(v.prezzo || 0)» pescava la riga
   SBAGLIATA — quella dell'elenco del Listino (app.jsx:12288), che è in
   grassetto e non ha classi di taglia. La cella della Cassa è l'unica che
   stampa quel prezzo in T.blu: si àncora lì. */
const cella = src.split("\n").find((r) =>
  /fmtEuro\(v\.prezzo \|\| 0\)/.test(r) && /T\.blu/.test(r)) || "";
ok(/text-sm/.test(cella), "il prezzo in cella è text-sm, non più text-xs");

/* ═══ 2. LA GRIGLIA: gruppi per battute, «Altro» ultimo, badge sul conto ═══ */
console.log("\n— 2. la griglia che impara dalle battute —");
/* l'Admin sta nel banco anche se non entra mai: senza un admin col PIN il
   Foglio dello storno NON mostra il campo del PIN (guardia adminConPin,
   app.jsx:12586) e §3d non avrebbe la seconda casella da riempire — la
   sonda del 01/09 ha misurato esattamente questo: un solo input visibile */
const G = await apri(base, [PR.opCassa, PR.admin], "OpCassa", "2222");
await prova("§2", async () => {
  await vaiA(G.p, "Cassa");
  const t0 = await testoDi(G.p);
  /* i titoli di gruppo arrivano MAIUSCOLI (trasformazione CSS: la lezione
     di Fatte e Scorporo IVA) — si cerca senza badare al caso */
  const iM = t0.search(/mangiare/i), iB = t0.search(/bere/i), iA = t0.search(/\baltro\b/i);
  ok(iM >= 0 && iB >= 0 && iM < iB,
    `MANGIARE (4 battute) viene prima di BERE (1) — non è più l'alfabeto (pos ${iM} vs ${iB})`);
  ok(iA > iB, `e ALTRO sta ULTIMO anche con 10 battute: il ripieno non scala la classifica (pos ${iA})`);
  await G.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await G.p.waitForTimeout(250);
  await G.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await G.p.waitForTimeout(350);
  const cellaSpr = G.p.getByRole("button", { name: "Aggiungi Spritz" });
  ok((await cellaSpr.getAttribute("data-nel-conto")) === "2",
    "la cella porta data-nel-conto=\"2\" dopo due tocchi");
  ok(/2/.test((await cellaSpr.innerText())),
    "e il badge col 2 si vede sulla cella: il tocco risponde dove è caduto");
});

/* ═══ 3. «OGGI» COMPRESSO, LE ULTIME VENDITE DIETRO IL FOGLIO ═══ */
console.log("\n— 3. la battuta davanti, lo storico dietro un Foglio —");
await prova("§3", async () => {
  await incassa(G.p, "Contanti");
  const t1 = await testoDi(G.p);
  ok((await G.p.getByRole("button", { name: /^Storna la vendita/ }).count()) === 0,
    "sulla schermata principale non ci sono più cerchietti di storno");
  ok(!/1× Spritz|2× Spritz/.test(t1),
    "e nemmeno le righe delle vendite: la griglia parte subito");
  ok(await G.p.getByRole("button", { name: "Ultime vendite" }).isVisible(),
    "nella riga «Oggi» c'è il tasto «Ultime vendite»");
  await G.p.getByRole("button", { name: "Ultime vendite" }).click(); await G.p.waitForTimeout(600);
  const tf = (await foglio(G.p).innerText()).replace(/\s+/g, " ");
  ok(/2× Spritz/.test(tf), "il Foglio elenca la vendita appena battuta");
  /* la riga si tocca per stornare e TIENE l'aria-label di cassatest §8:
     quel banco andrà riallineato al Foglio, non riscritto */
  await G.p.getByRole("button", { name: /^Storna la vendita delle/ }).first().click();
  await G.p.waitForTimeout(600);
  ok(/Motivo dello storno/.test(await testoDi(G.p)),
    "toccare la riga apre lo storno di sempre (motivo obbligatorio)");
  /* §3d — contro-controllo: lo storno arriva in fondo anche da qui.
     OpCassa non è admin: serve il PIN dell'Admin (1234), come in §8b. */
  await G.p.locator("input:visible").first().fill("prova del banco"); await G.p.waitForTimeout(200);
  await G.p.locator("input:visible").nth(1).fill("1234"); await G.p.waitForTimeout(200);
  await G.p.getByRole("button", { name: "Conferma lo storno", exact: true }).click();
  await G.p.waitForTimeout(1400);
  const st = await stato(G.p);
  const contro = (st.vendite || []).find((v) => v.totale === -10);
  ok(!!contro && contro.autorizzataDa === "Admin",
    "la riga contraria nasce col PIN dell'Admin: il giro non si è rotto nel trasloco");
});
await G.ctx.close();

/* ═══ 4. IL RESTO DEI CONTANTI: si vede grande, non si registra ═══ */
console.log("\n— 4. il resto: aiuto al banco, zero fiscale —");
const R = await apri(base, [PR.opCassa], "OpCassa", "2222");
await prova("§4", async () => {
  await vaiA(R.p, "Cassa");
  await R.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await R.p.waitForTimeout(250);
  await R.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await R.p.waitForTimeout(350);
  await R.p.getByRole("button", { name: "Incassa", exact: true }).click(); await R.p.waitForTimeout(600);
  ok(/Ricevuti/.test(await foglio(R.p).innerText()),
    "con «Contanti» il Foglio d'incasso offre il campo «Ricevuti»");
  await R.p.locator(".fixed.inset-0 input:visible").first().fill("50"); await R.p.waitForTimeout(350);
  const tR = (await foglio(R.p).innerText()).replace(/\s+/g, " ");
  ok(/Resto/.test(tR) && /€ 40,00/.test(tR),
    "50 su € 10,00: il Foglio dice «Resto € 40,00», da leggere a un metro");
  await R.p.getByRole("button", { name: "Carta", exact: true }).click(); await R.p.waitForTimeout(350);
  ok(!/Ricevuti/.test(await foglio(R.p).innerText()),
    "con «Carta» il campo sparisce: il resto è un mestiere dei contanti");
  await R.p.getByRole("button", { name: "Contanti", exact: true }).click(); await R.p.waitForTimeout(250);
  await R.p.getByRole("button", { name: "Registra l'incasso", exact: true }).click();
  await R.p.waitForTimeout(1400);
  const st = await stato(R.p);
  const v = (st.vendite || []).find((x) => x.totale === 10);
  ok(!!v && v.ricevuti === undefined && v.resto === undefined && v.stato === "registrata",
    "§4d contro-controllo: la vendita registrata NON porta ricevuti/resto — il conto del resto muore nella vista");
});

/* ═══ 5. «SVUOTA» SI PUÒ DISFARE ═══ */
console.log("\n— 5. svuota, e ripristina —");
await prova("§5", async () => {
  await R.p.getByRole("button", { name: "Aggiungi Spritz" }).click(); await R.p.waitForTimeout(250);
  await R.p.getByRole("button", { name: "Aggiungi Panino" }).click(); await R.p.waitForTimeout(400);
  await R.p.getByRole("button", { name: "Così com'è · € 8,00" }).click(); await R.p.waitForTimeout(400);
  ok(/Totale € 13,00/.test(await testoDi(R.p)), "§5a: il conto c'è — € 13,00");
  await R.p.getByRole("button", { name: "Svuota il conto" }).click(); await R.p.waitForTimeout(400);
  ok(!/Totale € 13,00/.test(await testoDi(R.p)), "§5a: «Svuota» svuota davvero");
  ok(await R.p.getByRole("button", { name: "Ripristina il conto" }).isVisible(),
    "ma resta la via del ritorno: «Ripristina il conto»");
  await R.p.getByRole("button", { name: "Ripristina il conto" }).click(); await R.p.waitForTimeout(400);
  ok(/Totale € 13,00/.test(await testoDi(R.p)),
    "e il conto torna com'era: € 13,00, righe e quantità comprese");
});

/* ═══ 6. I BERSAGLI DEL CONTO: 44px, misurati ═══ */
console.log("\n— 6. i tasti del conto sotto il pollice —");
await prova("§6", async () => {
  /* il carrello è appena stato ripristinato in §5: si misura su quello */
  for (const nome of ["Aumenta Spritz", "Diminuisci Spritz", "Svuota il conto"]) {
    const box = await R.p.getByRole("button", { name: nome }).boundingBox();
    ok(!!box && box.height >= 43.5 && box.width >= 43.5,
      `«${nome}» è un bersaglio da 44px — misura ${box ? Math.round(box.width) + "×" + Math.round(box.height) : "assente"}`);
  }
});
await R.ctx.close();

await b.close();
ok(errs.length === 0, "zero errori JavaScript in tutto il giro" + (errs.length ? " — " + errs[0] : ""));
console.log(ko === 0 ? "\ncassa2test: tutti i controlli passati" : `\ncassa2test: ${ko} controlli KO`);
process.exit(ko === 0 ? 0 : 1);
