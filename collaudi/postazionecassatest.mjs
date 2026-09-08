/* gen-6.11: LA POSTAZIONE CASSA — scritto PRIMA del codice.

   DUE RICHIESTE DI VALERIO, dette l'8 settembre con parole sue:
   1. «ricorda di dare un'interfaccia cassa senza mescolarla ai magazzini».
      Oggi chi ha l'interruttore «cassa» si trova sotto il pollice una barra
      che dice Conteggi · Magazzini · Ordini: parole di magazzino, mentre lui
      sta battendo scontrini. La Cassa e' una voce dentro l'app del
      magazziniere, non una postazione.
   2. «la verifica su Maps deve essere automatica, chi sta alla cassa puo'
      vedere una mini mappa ma la verifica automatica la fa il tasto senza
      aprire all'utente altre pagine» e «se la via non viene verificata, si
      deve correggere da sola».
      Oggi «Vedi sulla mappa» apre una PAGINA A PARTE: chi risponde al
      telefono esce dall'ordine, guarda, e torna indietro.

   IL CONTRATTO, fissato qui e il codice si adegua:
   · dentro la Cassa la barra diventa quella della Cassa: Battere · Clienti ·
     Giornata · Esci. Nessuna voce di magazzino. «Esci» riporta alla barra di
     prima: non si toglie niente a nessuno, si cambia stanza.
   · «Clienti» e' la rubrica con la sua ricerca, e toccare un cliente APRE UN
     ORDINE per lui invece di limitarsi a mostrarlo.
   · «Giornata» e' il giorno: totale, per metodo, e le vendite delle 48 ore da
     cui si storna. Sempre raggiungibile — la lezione di gen-6.07, dove la
     porta per stornare viveva dentro il riquadro «Oggi» che a mezzanotte e
     mezza non c'e' ancora.
   · l'indirizzo si CORREGGE DA SOLO: mentre scrivi, l'app propone gli
     indirizzi veri; ne tocchi uno e il campo si riscrive normalizzato, con
     una spunta «Verificato» e una MINI MAPPA li' dentro. Nessuna pagina si
     apre.
   · e il controllo dell'indirizzo NON BLOCCA MAI L'INCASSO: se il servizio
     non risponde si batte lo stesso, col vecchio tasto come ripiego. Una
     cassa che si ferma perche' un servizio di mappe e' giu' e' peggio di una
     cassa senza mappe.

   CONTRO gen-6.10 DEVONO ESSERE ROSSI: §1 §2 §2b §3 §4 §5 §6 §6b, e la PRIMA META' di
   §7 (col servizio su si propone). La seconda meta' di §7 — col servizio giu'
   non si propone niente, resta il vecchio tasto, si batte lo stesso — e' un
   contro-controllo verde prima e dopo: difende la scelta che una cassa non si
   ferma per un servizio di mappe.
   VERDI ANCHE PRIMA, apposta, i contro-controlli: §8 (la pizza liscia al
   banco resta un tocco), §9 (chi non ha la cassa non vede niente della
   cassa), §10 (telefono, via e coordinate NON entrano nella vendita — prima
   e' verde perche' le coordinate non esistono, dopo dev'essere verde perche'
   le ho tenute fuori: e' il controllo che difende la scelta).

   NIENTE DATI VERI QUI DENTRO: nomi, numeri e indirizzi sono inventati.
   E NIENTE RETE VERA: il servizio degli indirizzi e le mattonelle della mappa
   sono finti. Il banco prova come si comporta l'APP, non se il servizio di
   qualcun altro e' in piedi — quello lo vede Valerio dal suo telefono. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
import { apriServer } from "./servi.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 110)}`); } };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con almeno 2 articoli");
const artA = linea.articoli[0], artB = linea.articoli[1];
artA.qty = 40; artB.qty = 40;
FM.cassaMagId = linea.id;
base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6, aliquota: 10, attivo: true,
    varianti: [], distinta: [{ prodottoId: artA.prodottoId, qty: 1, uomId: artA.uomId }] },
  { id: "li-bib", nome: "Bibita", gruppo: "Bere", prezzo: 2.5, attivo: true,
    varianti: [], distinta: [{ prodottoId: artB.prodottoId, qty: 1, uomId: artB.uomId }] },
];
base.postazioni = []; base.vendite = []; base.giornate = []; base.aggiunte = [];
const IERI = Date.now() - 26 * 3600 * 1000;
base.clienti = [
  { id: "cl-uno", nome: "Rossi Uno", tel: "3401110001", via: "Via delle Prove 1", t: IERI, ultimo: IERI, n: 3 },
  { id: "cl-due", nome: "Bianchi Due", tel: "3401110002", via: "", t: IERI, ultimo: IERI, n: 1 },
];

const PR = {
  opCassa: { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") },
  opZero: { id: "pr-o0", nome: "OpZero", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], pinHash: hash("2222") },
};

const srv = await apriServer();
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];

/* IL FINTO SERVIZIO DEGLI INDIRIZZI. Risponde nella forma di Photon
   (komoot), che e' quella che l'app usa: features[].properties + geometry.
   «__geoRotto = true» lo fa cadere, ed e' il caso che conta di piu'. */
const apri = async (st0, profilo, nome, pin) => {
  const st = JSON.parse(JSON.stringify(st0));
  st.profili = [profilo];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
    window.__aperti = [];
    window.open = (u) => { window.__aperti.push(String(u)); return null; };
    window.__geoRotto = false;
    window.__geoChiamate = [];
    const veroFetch = window.fetch ? window.fetch.bind(window) : null;
    window.fetch = async (u, opt) => {
      const url = String(u);
      if (/photon|nominatim|geocod/i.test(url)) {
        window.__geoChiamate.push(url);
        if (window.__geoRotto) throw new Error("rete finta giu'");
        return {
          ok: true,
          async json() {
            return { features: [
              { properties: { name: "Via Giuseppe Garibaldi", housenumber: "12", street: "Via Giuseppe Garibaldi",
                              city: "Roma", postcode: "00100", countrycode: "IT" },
                geometry: { type: "Point", coordinates: [12.4924, 41.8902] } },
              { properties: { name: "Via Garibaldi", street: "Via Garibaldi", city: "Milano",
                              postcode: "20100", countrycode: "IT" },
                geometry: { type: "Point", coordinates: [9.19, 45.4642] } },
            ] };
          },
        };
      }
      return veroFetch ? veroFetch(u, opt) : Promise.reject(new Error("niente rete"));
    };
  }, [JSON.stringify(st)]);
  /* nessuna mattonella vera esce di qui: si risponde con un pixel */
  await ctx.route(/tile\.|tiles\.|openstreetmap/i, (r) => r.fulfill({
    status: 200, contentType: "image/gif",
    body: Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
  }));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(srv.url); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1500);
  return { p, ctx };
};

/* La voce si cerca SEMPRE dentro la barra. Il primo giro usava
   getByRole("button", {name:/Esci/i}).last() e ha preso «Esci dal profilo»:
   il collaudo si e' disconnesso da solo e le tre sezioni dopo sono cadute
   una sull'altra per traboccamento. Un nome non e' un indirizzo. */
/* Entrare in Cassa da DENTRO la Cassa: la barra li' non dice piu' «Cassa»,
   dice «Battere». vaiA() cerca la vecchia voce e non la trova — e' successo
   due volte in questo file, ed e' il prezzo di aver cambiato la barra: il
   banco deve saperlo invece di inciampare a ogni sezione. */
const vaiInCassa = async (p) => {
  const voci = await barra(p);
  if (voci.some((x) => /battere/i.test(x))) await voceBarra(p, /Battere/i).first().click();
  else await vaiA(p, "Cassa");
  await p.waitForTimeout(700);
};
const voceBarra = (p, re) => p.locator('nav[aria-label="Navigazione principale"]').getByRole("button", { name: re });
const barra = (p) => p.evaluate(() => [...document.querySelectorAll('nav[aria-label="Navigazione principale"] button, nav[aria-label="Navigazione principale"] a')]
  .map((x) => x.textContent.trim()).filter(Boolean));
const testoDi = (p) => p.evaluate(() => document.body.innerText);
const salvato = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1") || "null"));

/* ═══ 1-4. LA POSTAZIONE ═══ */
const A = await apri(base, PR.opCassa, "OpCassa", "2222");

console.log("\n— 1. dentro la Cassa la barra e' quella della Cassa —");
await prova("§1", async () => {
  await vaiInCassa(A.p);
  const voci = await barra(A.p);
  const ha = (n) => voci.some((v) => v.toLowerCase().includes(n));
  ok(ha("battere"), `c'e' «Battere» — barra: ${JSON.stringify(voci)}`);
  ok(ha("clienti"), "c'e' «Clienti»");
  ok(ha("giornata"), "c'e' «Giornata»");
  ok(ha("esci"), "c'e' «Esci»");
  ok(!ha("magazzin") && !ha("conteggi") && !ha("ordini"),
    `e NON ci sono piu' le voci di magazzino — barra: ${JSON.stringify(voci)}`);
});

console.log("\n— 2. «Esci» riporta la barra di prima: non si toglie niente a nessuno —");
await prova("§2", async () => {
  /* «Battere non c'e' piu'» sarebbe vero anche se non fosse MAI esistita:
     il controllo pretende di averla vista prima di dire che e' sparita. */
  const prima = await barra(A.p);
  ok(prima.some((v) => /battere/i.test(v)),
    `prima di uscire la barra e' quella della Cassa — ${JSON.stringify(prima)}`);
  await voceBarra(A.p, /Esci/i).first().click(); await A.p.waitForTimeout(900);
  const voci = await barra(A.p);
  ok(voci.some((v) => /magazzin/i.test(v)),
    `fuori dalla Cassa «Magazzini» e' tornata — barra: ${JSON.stringify(voci)}`);
  ok(!voci.some((v) => /battere/i.test(v)), "e «Battere» non c'e' piu': la stanza e' cambiata");
});

console.log("\n— 2b. rientrare in Cassa vuol dire ricominciare a BATTERE —");
await prova("§2b", async () => {
  await vaiInCassa(A.p);
  await voceBarra(A.p, /Clienti/i).first().click(); await A.p.waitForTimeout(600);
  await voceBarra(A.p, /Esci/i).first().click(); await A.p.waitForTimeout(800);
  await vaiInCassa(A.p);
  const t = await testoDi(A.p);
  ok(/Margherita/.test(t),
    "si rientra sulla griglia, non sulla stanza di prima: chi riapre la Cassa vuole battere");
});

console.log("\n— 3. «Clienti»: la rubrica ha una stanza sua, e apre l'ordine —");
await prova("§3", async () => {
  await vaiInCassa(A.p);
  await voceBarra(A.p, /Clienti/i).first().click(); await A.p.waitForTimeout(700);
  let t = await testoDi(A.p);
  ok(/Rossi Uno/.test(t) && /Bianchi Due/.test(t), "si vedono i clienti in rubrica");
  const campo = A.p.getByRole("textbox").first();
  await campo.fill("0002"); await A.p.waitForTimeout(600);
  t = await testoDi(A.p);
  ok(/Bianchi Due/.test(t) && !/Rossi Uno/.test(t),
    "battendo «0002» resta solo Bianchi Due — la ricerca e' quella del telefono");
  await A.p.getByRole("button", { name: /Bianchi Due/ }).first().click(); await A.p.waitForTimeout(900);
  t = await testoDi(A.p);
  ok(/Bianchi Due/.test(t) && /Margherita/.test(t),
    "toccare il cliente APRE un ordine per lui: si torna a battere col suo nome addosso");
});

console.log("\n— 4. «Giornata»: il giorno ha una stanza sua, sempre raggiungibile —");
await prova("§4", async () => {
  await voceBarra(A.p, /Giornata/i).first().click(); await A.p.waitForTimeout(700);
  const t = await testoDi(A.p);
  ok(/incass|totale|giornata/i.test(t), "la Giornata dice il totale del giorno");
  ok(/contanti/i.test(t) && /carta/i.test(t), "e lo dice PER METODO, contanti e carta separati");
  ok(/vendit|scontrin/i.test(t),
    "e da qui si arriva alle vendite da stornare senza passare dal riquadro «Oggi» (la lezione di gen-6.07)");
});

/* ═══ 5-7. L'INDIRIZZO ═══ */
console.log("\n— 5. l'indirizzo si corregge da solo —");
await prova("§5", async () => {
  await voceBarra(A.p, /Battere/i).first().click(); await A.p.waitForTimeout(700);
  await A.p.getByRole("button", { name: /Banco|Asporto|Consegna/ }).first().click(); await A.p.waitForTimeout(500);
  await A.p.getByRole("button", { name: "Consegna", exact: true }).first().click(); await A.p.waitForTimeout(400);
  const via = A.p.getByRole("textbox", { name: /Via e numero/i }).first();
  await via.fill("via garibald"); await A.p.waitForTimeout(1200);
  const sugg = A.p.locator("[data-viasugg] button");
  const n = await sugg.count();
  ok(n >= 1, `mentre scrivo l'app propone gli indirizzi veri — ne trovo ${n}`);
  if (n) {
    await sugg.first().click(); await A.p.waitForTimeout(600);
    const val = await via.inputValue();
    ok(/Garibaldi/i.test(val) && val.length > "via garibald".length,
      `toccandone uno il campo si RISCRIVE normalizzato — vale «${val}»`);
    const t = await testoDi(A.p);
    ok(/verificat/i.test(t), "e compare la spunta «Verificato»");
  } else { ok(false, "niente da toccare"); ok(false, "niente da verificare"); }
});

console.log("\n— 6. la mini mappa sta DENTRO la cassa, e non si apre niente —");
await prova("§6", async () => {
  const quante = await A.p.locator("[data-minimappa]").count();
  ok(quante > 0, "c'e' la mini mappa");
  const img = await A.p.locator("[data-minimappa] img").count();
  ok(img > 0, `e dentro c'e' davvero una mappa, non un riquadro vuoto — ${img} mattonelle`);
  /* «non si e' aperto niente» da solo sarebbe verde anche su un'app che non
     fa niente: vale solo INSIEME alla mappa che c'e'. */
  const aperti = await A.p.evaluate(() => window.__aperti.length);
  ok(quante > 0 && aperti === 0,
    `la verifica sta tutta qui: mappa presente e NESSUNA pagina aperta (mappe ${quante}, pagine ${aperti})`);
});

console.log("\n— 6b. se l'indirizzo cambia, la spunta verde se ne va —");
await prova("§6b", async () => {
  /* una spunta «verificato» che sopravvive alla riscrittura sarebbe peggio di
     nessuna spunta: direbbe verde su un indirizzo che nessuno ha controllato. */
  const via = A.p.getByRole("textbox", { name: /Via e numero/i }).first();
  await via.fill("via che nessuno ha controllato"); await A.p.waitForTimeout(400);
  const t = await testoDi(A.p);
  ok(!/verificat/i.test(t), "riscrivendo la via la spunta «Verificato» sparisce");
  ok(await A.p.locator("[data-minimappa]").count() === 0, "e con lei sparisce la mini mappa");
});

console.log("\n— 7. se il servizio non risponde, la cassa non si ferma —");
const B = await apri(base, PR.opCassa, "OpCassa", "2222");
await prova("§7", async () => {
  await vaiInCassa(B.p);
  await B.p.getByRole("button", { name: /Banco|Asporto|Consegna/ }).first().click(); await B.p.waitForTimeout(500);
  await B.p.getByRole("button", { name: "Consegna", exact: true }).first().click(); await B.p.waitForTimeout(400);
  await B.p.getByRole("textbox", { name: /Nome/i }).first().fill("Cliente Prova");
  const viaB = B.p.getByRole("textbox", { name: /Via e numero/i }).first();
  /* prima META': col servizio SU si propone. Senza questa, la seconda meta'
     («giu' non si propone niente») sarebbe verde su un'app che non propone
     mai — verde per assenza, cioe' per niente. */
  await viaB.fill("via garibald"); await B.p.waitForTimeout(1300);
  const su = await B.p.locator("[data-viasugg] button").count();
  ok(su >= 1, `col servizio SU si propone (${su})`);
  /* seconda META': si stacca il servizio e si riscrive */
  await B.p.evaluate(() => { window.__geoRotto = true; });
  await viaB.fill("via mazzin"); await B.p.waitForTimeout(1300);
  const n = await B.p.locator("[data-viasugg] button").count();
  ok(n === 0, `col servizio GIU' non si propone niente (${n}) e non si esplode`);
  const t = await testoDi(B.p);
  ok(/Vedi sulla mappa/i.test(t), "e resta il vecchio tasto come ripiego");
  ok(errs.length === 0, `nessun errore JavaScript col servizio giu'${errs.length ? " — " + errs[0] : ""}`);
  /* e adesso la cosa che conta davvero: si incassa lo stesso */
  await B.p.getByRole("button", { name: /Va bene|Conferma|Chiudi/i }).last().click().catch(() => {});
  await B.p.waitForTimeout(500);
  await B.p.getByRole("button", { name: "Aggiungi Margherita", exact: true }).click().catch(() => {});
  await B.p.waitForTimeout(400);
  const testo = await testoDi(B.p);
  ok(/6,00|Incassa/i.test(testo), "e si continua a battere: un servizio di mappe giu' non ferma una cassa");
});

/* ═══ 8-10. I CONTRO-CONTROLLI, verdi anche prima ═══ */
console.log("\n— 8. contro-controllo: la pizza liscia al banco resta un tocco —");
const C = await apri(base, PR.opCassa, "OpCassa", "2222");
await prova("§8", async () => {
  await vaiInCassa(C.p);
  await C.p.getByRole("button", { name: "Aggiungi Margherita", exact: true }).click();
  await C.p.waitForTimeout(500);
  const t = await testoDi(C.p);
  ok(/6,00/.test(t), "un tocco sulla cella e la Margherita e' nel conto, senza fogli di mezzo");
  const fogli = await C.p.locator('[role="dialog"]').count();
  ok(fogli === 0, `e nessun foglio si e' aperto (${fogli})`);
});

console.log("\n— 9. contro-controllo: chi non ha la cassa non vede niente della cassa —");
const D = await apri(base, PR.opZero, "OpZero", "2222");
await prova("§9", async () => {
  const voci = await barra(D.p);
  ok(!voci.some((v) => /cassa|battere|giornata/i.test(v)),
    `nella barra non c'e' niente della cassa — ${JSON.stringify(voci)}`);
  const t = await testoDi(D.p);
  ok(!/Margherita/.test(t), "e il listino non si vede da nessuna parte");
});

console.log("\n— 10. contro-controllo: telefono, via e coordinate NON entrano nella vendita —");
await prova("§10", async () => {
  /* la pagina C e' GIA' dentro la Cassa dopo §8, e li' dentro la barra non
     dice piu' «Cassa»: dice Battere. Cercare la vecchia voce da dentro la
     stanza nuova era un mio errore, non un difetto — e' il prezzo di aver
     cambiato la barra, e il banco deve saperlo. */
  await vaiInCassa(C.p);
  await C.p.getByRole("button", { name: /Incassa/i }).first().click(); await C.p.waitForTimeout(500);
  await C.p.getByRole("button", { name: /Registra/i }).first().click(); await C.p.waitForTimeout(1800);
  const st = await salvato(C.p);
  const v = (st?.vendite || [])[0];
  ok(!!v, `la vendita e' stata registrata (${(st?.vendite || []).length})`);
  const dentro = JSON.stringify(v || {});
  ok(!/tel|via|lat|lon|geo/i.test(dentro),
    "e dentro non c'e' ne' telefono ne' via ne' coordinate: quelli stanno in rubrica");
});

console.log(`\nerrori di pagina: ${errs.length}${errs.length ? " — " + errs[0] : ""}`);
await b.close(); await srv.chiudi();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(0);
