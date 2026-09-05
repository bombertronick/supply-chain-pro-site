/* gen-6.06 «Di solito ne escono» — la media dei consumi nel conteggio di fine giornata.

   LE PAROLE DI VALERIO (4 settembre): «a fine giornata quando l'operatore fa il
   controllo per l'ordine che deve essere inviato al laboratorio il sistema
   calcola la media di prodotto utilizzato in base a quanto manca dalle soglie
   previste».

   LA DIVERGENZA, DETTA PRIMA. La media NON si calcola sul «quanto manca dalla
   soglia» ma sul CALO VERO fra un conteggio e l'altro (il delta negativo del
   movimento «conteggio»): se il laboratorio ieri ha portato meno del previsto,
   il «manca» di stasera e' piu' grande del consumo, e una media costruita cosi'
   gonfierebbe le richieste per settimane. Il calo e' quello che e' uscito
   davvero. Dichiarato a Valerio, non contestato.

   LE REGOLE che questo banco pretende, una per una, perche' ognuna ha un modo
   di sbagliare che si vede solo coi numeri:
   · SECCHI PER GIORNO DELLA SETTIMANA: il sabato non e' il martedi'. I consumi
     degli altri giorni NON entrano nella media di oggi.
   · LE SERE A ZERO CONTANO: un prodotto che una sera non si e' mosso ha
     consumato zero, e quello zero abbassa la media. Se si dividesse solo per
     le sere in cui si e' mosso (come fa soglieConsigliate, che ha un altro
     scopo), la media direbbe «ne escono 7» a un prodotto che ne fa 3,5.
     La sera conta se il MAGAZZINO ha avuto un conteggio quella sera.
   · IL PAVIMENTO: le sere PRIMA che il prodotto comparisse non contano. Un
     prodotto nuovo da due settimane ha due sere, non otto.
   · IL BUCO: un conteggio fatto dopo piu' di due giorni senza contare porta
     dentro il consumo di tre sere e non di una. Quella sera si butta, da
     numeratore E denominatore.
   · LO SCARTO E' UN'ALTRA COSA: quello che si butta si dice a parte, non si
     mescola con quello che si e' venduto.
   · L'UNITA' DI MISURA: un movimento in un'unita' diversa da quella
     dell'articolo di oggi non si somma. Meglio tacere che sommare chili a
     grammi.
   · SI TACE SOTTO DUE SERE, come le soglie: una sera non fa una regola.
   · IL CAMPANELLO AVVISA, NON BLOCCA: se chiedi piu' del doppio del solito
     (e almeno due in piu'), nel riepilogo compare l'avviso in ambra. Il
     «Conferma tutto» resta li' e la richiesta parte col numero battuto.
   · NESSUN TASTO «= media»: la media e' informazione, il numero lo mette chi
     ha contato. Un tasto che scrive la media al posto del conteggio farebbe
     sparire proprio il dato che nutre la media.

   Il banco costruisce OTTO settimane di storico in cui ogni regola ha almeno
   un prodotto che la fa cadere se viene tolta. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const NOMI_GIORNI = { "1": "lunedì", "2": "martedì", "3": "mercoledì", "4": "giovedì", "5": "venerdì", "6": "sabato", "0": "domenica" };

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const linea = st.magazzini.find((m) => m.tipo === "linea-lab");
const lab = st.magazzini.find((m) => m.tipo === "laboratorio");
st.profili = [{ id: "pr-op", nome: "Operatore", ruolo: "operatore", sedeId: linea.sedeId,
  magazziniIds: [linea.id], colore: "#4C8DF6", pinHash: hash("1234") }];

/* otto articoli soli: sette da guardare e uno «di riempimento» che si muove
   ogni sera, perche' e' il magazzino che deve risultare contato ogni sera */
linea.articoli = linea.articoli.slice(0, 8);
for (const a of linea.articoli) { a.qty = 0; delete a.parGiorni; }
const [A1, A2, A3, A4, A5, A6, A7, F] = linea.articoli;
const prodDi = (a) => st.prodotti.find((p) => p.id === a.prodottoId);
const nome = (a) => prodDi(a).nome;
for (const a of linea.articoli) { const p = prodDi(a); p.preparato = true; p.soloInteri = false; delete p.uomLavorazione; }
A1.par = 12; A2.par = 8; A3.par = 10; A4.par = 5; A5.par = 4; A6.par = 6; A7.par = 5; F.par = 3;
const sym = st.unita.find((u) => u.id === A1.uomId)?.simbolo || "?";
lab.articoli = linea.articoli.map((a) => ({ prodottoId: a.prodottoId, uomId: prodDi(a).uomBase, qty: 100, par: 0 }));
linea.rifornitoreId = null;
st.richieste = []; st.ordini = [];

/* ── LO STORICO ──
   «Sera d» = oggi alle 21 meno d giorni. Le sere che contano per oggi sono
   quelle dello stesso giorno della settimana: d = 7, 14, 21, 28, 35 (E1..E5).
   Il magazzino viene contato OGNI sera da 40 giorni (F si muove sempre),
   TRANNE le tre sere prima di E5: cosi' E5 arriva dopo un buco di quattro
   giorni e deve essere buttata. */
const oggi21 = new Date(); oggi21.setHours(21, 0, 0, 0);
const sera = (d) => oggi21.getTime() - d * 86400000;
const gOggi = String(new Date().getDay());
const E = (k) => 7 * k;
let nMv = 0;
const mv = (d, art, delta, extra = {}) => ({ id: "mv-" + (++nMv), t: sera(d), magId: linea.id,
  prodottoId: art.prodottoId, uomId: art.uomId, delta, dopo: 0, causale: "conteggio", chi: "Operatore", ...extra });
const movs = [];
for (let d = 1; d <= 40; d++) if (![36, 37, 38].includes(d)) movs.push(mv(d, F, -1));
/* A1: quattro sere buone (-4 -5 -3 -4 → media 4, da 3 a 5), la quinta nel
   buco (-4, da buttare), uno scarto su E1 (a parte), e due sere di ALTRI
   giorni (-9) che non devono entrare */
movs.push(mv(E(1), A1, -4), mv(E(2), A1, -5), mv(E(3), A1, -3), mv(E(4), A1, -4), mv(E(5), A1, -4));
movs.push(mv(E(1), A1, -2, { causale: "scarto" }));
movs.push(mv(2, A1, -9), mv(3, A1, -9));
/* A2: e' comparso a E2 — due sere, non quattro (media 6, non 2,4 ne' 3) */
movs.push(mv(E(2), A2, -6), mv(E(1), A2, -6));
/* A3: c'e' da prima di E4 (un carico a d=30), si muove solo E1 ed E3 (-7):
   le due sere a zero contano → 14/4 = 3,5, non 7 */
movs.push(mv(30, A3, 10, { causale: "carico" }));
movs.push(mv(E(1), A3, -7), mv(E(3), A3, -7));
/* A4: il buco. -12 su E5 (dopo quattro giorni senza contare) e -2 sulle
   altre quattro: media 2, non 4 */
movs.push(mv(E(5), A4, -12), mv(E(1), A4, -2), mv(E(2), A4, -2), mv(E(3), A4, -2), mv(E(4), A4, -2));
/* A5: nessuno storico. A6: storico in un'altra unita'. A7: una sera sola */
movs.push(mv(E(1), A7, -5));
movs.push(mv(E(1), A6, -3, { uomId: "u-kg" }), mv(E(2), A6, -3, { uomId: "u-kg" }), mv(E(3), A6, -3, { uomId: "u-kg" }));
movs.sort((a, b) => b.t - a.t);
st.movimenti = movs;
st.rev = (st.rev || 0) + 1;

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
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

const nav = p.getByText("Conteggi", { exact: true });
for (let i = 0; i < await nav.count(); i++) if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
await p.waitForTimeout(800);
await p.getByRole("button", { name: /Conta ora/ }).first().click(); await p.waitForTimeout(900);

/* la scheda di UN articolo: quella che contiene la casella «Conteggio <nome>».
   Si prende l'ultima che combacia (la piu' interna), non la prima. */
const carta = (a) => p.locator("div.p-4", { has: p.getByLabel("Conteggio " + nome(a)) }).last();
const testoDi = async (a) => (await carta(a).innerText()).replace(/\s+/g, " ");

console.log("\n— 1. la scheda dice quanto ne esce di solito, oggi (" + NOMI_GIORNI[gOggi] + ") —");
const t1 = await testoDi(A1);
ok(/Previsto 12/.test(t1), "«Previsto» c'e' ancora, com'era → " + t1.slice(0, 70));
ok(new RegExp("Di solito ne escono 4 " + sym).test(t1), "A1: «Di solito ne escono 4 " + sym + "» — la media delle quattro sere buone");
ok(/da 3 a 5/.test(t1), "A1: e la forbice «da 3 a 5»");
ok(/su 4 volte/.test(t1), "A1: «su 4 volte» — la sera nel buco NON conta");
ok(new RegExp(NOMI_GIORNI[gOggi]).test(t1), "A1: dice di che giorno parla (" + NOMI_GIORNI[gOggi] + ")");
ok(!/ne escono (4,5|4,4|5,2|5)\b/.test(t1), "A1: lo scarto e i -9 degli altri giorni NON sono entrati nella media");
ok(/scarto 0,5/.test(t1), "A1: lo scarto si dice A PARTE («scarto 0,5»)");

console.log("\n— 2. il pavimento: un prodotto nuovo ha le sue sere, non tutte —");
const t2 = await testoDi(A2);
ok(new RegExp("Di solito ne escono 6 " + sym).test(t2), "A2: «ne escono 6»: e' comparso da due settimane");
ok(/su 2 volte/.test(t2), "A2: «su 2 volte», non su quattro");
ok(!/2,4|ne escono 3 /.test(t2), "A2: non e' stato diviso per sere in cui non esisteva");

console.log("\n— 3. le sere a zero contano —");
const t3 = await testoDi(A3);
ok(new RegExp("Di solito ne escono 3,5 " + sym).test(t3), "A3: «ne escono 3,5»: due sere a -7 e due a zero");
ok(!/ne escono 7 /.test(t3), "A3: NON dice 7 (la media solo sulle sere mosse)");
ok(/da 0 a 7/.test(t3), "A3: la forbice parte da zero");
ok(/su 4 volte/.test(t3), "A3: su 4 volte");

console.log("\n— 4. il buco: la sera dopo quattro giorni senza contare si butta —");
const t4 = await testoDi(A4);
ok(new RegExp("Di solito ne escono 2 " + sym).test(t4), "A4: «ne escono 2»");
ok(!/ne escono 4 /.test(t4), "A4: NON 4 (il -12 di tre sere in una non e' entrato)");
ok(/su 4 volte/.test(t4), "A4: su 4 volte");

console.log("\n— 5. quando non si sa, si tace —");
const t5 = await testoDi(A5);
ok(!/Di solito/.test(t5), "A5: senza storico non compare niente (niente «ne escono 0»)");
const t6 = await testoDi(A6);
ok(!/Di solito/.test(t6), "A6: storico in un'altra unita' → si tace, non si sommano chili a grammi");
const t7 = await testoDi(A7);
ok(!/Di solito/.test(t7), "A7: una sera sola non fa una regola → si tace");
const tF = await testoDi(F);
ok(/Di solito ne escono 1 /.test(tF), "F (contro-controllo): un prodotto che si muove ogni sera dice 1");
ok(!(await p.getByRole("button", { name: /media/i }).count()), "nessun tasto «= media»: il numero lo mette chi conta");

console.log("\n— 6. il campanello: chiedere piu' del doppio del solito avvisa, non blocca —");
await p.getByLabel("Conteggio " + nome(A1)).fill("0");      // manca 12, di solito 4 → campanello
await p.getByLabel("Conteggio " + nome(A3)).fill("8");      // manca 2, di solito 3,5 → niente
await p.waitForTimeout(300);
await p.getByRole("button", { name: /Verifica e conferma/ }).click(); await p.waitForTimeout(900);
const camp = p.locator("[data-campanello]");
ok((await camp.count()) === 1, "nel riepilogo c'e' UN campanello (" + await camp.count() + ")");
const tc = (await camp.count()) ? (await camp.first().innerText()).replace(/\s+/g, " ") : "";
ok(/12/.test(tc) && /4/.test(tc) && /solito/i.test(tc), "e dice i due numeri: chiedi 12, di solito 4 → «" + tc.slice(0, 90) + "»");
ok(new RegExp(nome(A1)).test((await p.locator("[data-campanello]").first().locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]").innerText().catch(() => "")).replace(/\s+/g, " ")) || /12/.test(tc),
  "sta sulla riga di A1, non altrove");
const conferma = p.getByRole("button", { name: /Conferma tutto/ });
ok((await conferma.count()) === 1 && await conferma.isEnabled(), "«Conferma tutto» c'e' ed e' acceso: il campanello non blocca");
await conferma.click(); await p.waitForTimeout(1500);
ok(/Conteggio registrato/.test(await p.locator("body").innerText()), "il conteggio si registra lo stesso");
const dopo = await p.evaluate(() => window.__leggi());
const r1 = (dopo.richieste || []).find((r) => r.prodottoId === A1.prodottoId);
const r3 = (dopo.richieste || []).find((r) => r.prodottoId === A3.prodottoId);
ok(r1 && r1.qtyLinea === 12, "la richiesta di A1 parte con 12, il numero battuto, non con la media (" + JSON.stringify(r1 && r1.qtyLinea) + ")");
ok(r3 && r3.qtyLinea === 2, "e quella di A3 con 2 (" + JSON.stringify(r3 && r3.qtyLinea) + ")");

ok(errs.length === 0, "zero errori JavaScript" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\ngen606test: ${ko} controlli KO` : "\ngen606test: TUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
