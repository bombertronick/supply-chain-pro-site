/* gen-5.74: non si riordina la merce che e' gia' partita.

   Difetto n.1 del consiglio del 2 agosto, e l'unico che costava soldi tutti i
   giorni. Il retro ha bisogno di 8 kg di farina, parte l'ordine, lo si segna
   «ordinato». Il giorno dopo la merce non e' ancora arrivata — quindi in
   magazzino non c'e', quindi il fabbisogno e' ancora 8 — e ogni «Ricalcola»
   rifaceva la domanda da capo accanto a quella gia' partita. Al fornitore se
   ne chiedevano 16 per un bisogno di 8: arriva il doppio, si paga il doppio,
   e su un fresco e' roba da buttare.

   Questo file va letto per i suoi CONTROCONTROLLI, non per la prova principale.
   Sottrarre quello che e' in viaggio e' facile; sottrarre troppo e' facilissimo,
   e non ordinare abbastanza in una cucina e' peggio che ordinare due volte —
   i soldi si recuperano, il servizio no. Quindi:
     §3  la merce RICEVUTA non si sottrae (e' gia' dentro la giacenza: toglierla
         due volte vorrebbe dire non riordinare mai piu' quel prodotto)
     §4  se serve piu' di quanto e' in viaggio si chiede la differenza, non zero
     §6  quando la riga in viaggio si chiude, il fabbisogno torna a chiedersi
   Il §2 senza questi tre sarebbe verde anche in un'app che ha semplicemente
   smesso di ordinare.

   Il seme azzera il livello previsto di tutti gli articoli tranne i sei sotto
   esame: cosi' quello che compare in elenco viene da questa prova e non dal
   fondo del magazzino, e un numero sbagliato si vede subito invece di
   nascondersi in mezzo a settanta righe vere. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
st.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
st.ordini = []; st.richieste = [];

/* niente rumore: solo i prodotti sotto esame hanno un livello da raggiungere */
for (const m of st.magazzini) for (const a of m.articoli) { a.par = 0; delete a.parGiorni; }

const retro = st.magazzini.find((m) => m.tipo === "retro" && m.articoli.length >= 6);
const lab = st.magazzini.find((m) => m.tipo === "laboratorio");
const sedeRetro = retro.sedeId, sedeLab = lab.sedeId;

/* Il caso va costruito in unita' che non ballano: l'articolo, il fornitore e
   la riga d'ordine tutti nell'unita' base del prodotto. La conversione ha i
   suoi collaudi altrove (convlogictest); qui si prova il conto di «quanto
   manca», e mescolarci dentro un fattore sbagliato renderebbe illeggibile un
   eventuale rosso. */
const prepara = (art, par, qty) => {
  const p = st.prodotti.find((x) => x.id === art.prodottoId);
  p.preparato = false; p.soloInteri = false;
  delete p.uomFornitoreDiretto; delete p.uomFornitore;
  art.uomId = p.uomBase; art.par = par; art.qty = qty; delete art.parGiorni;
  return p;
};
const ordine = (o) => st.ordini.push({ t: Date.now(), tipo: "diretto", sedeId: sedeRetro,
  fornitoreId: null, ...o });

const [aCoperto, aParziale, aRicevuto, aDoppio, aLibero, aChiuso, aVecchio] = retro.articoli.slice(0, 7);
/* 1. serve 8, in viaggio 8 → non si richiede niente */
const pCoperto = prepara(aCoperto, 10, 2);
ordine({ id: "o-cop", prodottoId: pCoperto.id, qty: 8, uomId: pCoperto.uomBase,
  stato: "ordinato", fornitoreId: pCoperto.fornitoreId });
/* 2. serve 18, in viaggio 8 → se ne devono chiedere 10, non 18 e non 0 */
const pParziale = prepara(aParziale, 20, 2);
ordine({ id: "o-par", prodottoId: pParziale.id, qty: 8, uomId: pParziale.uomBase,
  stato: "ordinato", fornitoreId: pParziale.fornitoreId });
/* 3. controcontrollo: 5 gia' RICEVUTI non sono in viaggio, sono arrivati e
      consumati. Il fabbisogno di 5 va richiesto lo stesso. */
const pRicevuto = prepara(aRicevuto, 5, 0);
ordine({ id: "o-ric", prodottoId: pRicevuto.id, qty: 5, uomId: pRicevuto.uomBase,
  stato: "ricevuto", qtyRicevuta: 5, fornitoreId: pRicevuto.fornitoreId });
/* 4. due righe aperte gemelle, come quelle rimaste in giro da prima della
      correzione: dopo il ricalcolo ne deve restare UNA */
const pDoppio = prepara(aDoppio, 6, 0);
ordine({ id: "o-dop1", prodottoId: pDoppio.id, qty: 6, uomId: pDoppio.uomBase, stato: "da-ordinare", fornitoreId: pDoppio.fornitoreId });
ordine({ id: "o-dop2", prodottoId: pDoppio.id, qty: 6, uomId: pDoppio.uomBase, stato: "da-ordinare", fornitoreId: pDoppio.fornitoreId });
/* 5. niente in viaggio: si comporta come sempre */
const pLibero = prepara(aLibero, 7, 0);
/* 6. la riga in viaggio si chiudera' a meta' prova, e il fabbisogno deve
      tornare a chiedersi: la protezione non e' un tappo definitivo */
const pChiuso = prepara(aChiuso, 9, 0);
ordine({ id: "o-chi", prodottoId: pChiuso.id, qty: 9, uomId: pChiuso.uomBase,
  stato: "ordinato", fornitoreId: pChiuso.fornitoreId });
/* 7. segnato «ordinato» dieci giorni fa e mai ricevuto: la fiducia e' scaduta.
      Nessuno obbliga a registrare una consegna, e una dimenticanza non deve
      zittire un prodotto per sempre. */
const pVecchio = prepara(aVecchio, 12, 0);
ordine({ id: "o-vec", prodottoId: pVecchio.id, qty: 12, uomId: pVecchio.uomBase, stato: "ordinato",
  t: Date.now() - 10 * 86400000, tOrdine: Date.now() - 10 * 86400000, fornitoreId: pVecchio.fornitoreId });
/* 8. il laboratorio compra dal fornitore con la stessa identica regola */
const pLab = st.prodotti.find((x) => ![pCoperto, pParziale, pRicevuto, pDoppio, pLibero, pChiuso, pVecchio]
  .some((y) => y.id === x.id) && x.fornitoreId);
pLab.preparato = false; pLab.soloInteri = false;
delete pLab.uomFornitore; delete pLab.uomFornitoreDiretto;
lab.articoli.push({ prodottoId: pLab.id, uomId: pLab.uomBase, qty: 1, par: 5 });
st.ordini.push({ id: "o-lab", t: Date.now(), tipo: "lab", sedeId: sedeLab, prodottoId: pLab.id,
  qty: 4, uomId: pLab.uomBase, stato: "ordinato", fornitoreId: pLab.fornitoreId });
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
  /* per rileggere i dati veri invece di fidarsi di quello che si vede a
     schermo: un elenco puo' filtrare, i dati no */
  window.__leggi = async () => JSON.parse((await window.storage.get("scp:stato:v1")).value);
}, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);

const nav = p.getByText("Ordini", { exact: true }); const n = await nav.count();
for (let i = 0; i < n; i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(700);

const ricalcola = async () => {
  await p.getByRole("button", { name: /^Ricalcola$/ }).first().click();
  await p.waitForTimeout(900);
};
/* i dati, non lo schermo: le righe aperte per un prodotto */
const aperte = async (pid, tipo = "diretto") => (await p.evaluate(async () => await window.__leggi()))
  .ordini.filter((o) => o.stato === "da-ordinare" && o.prodottoId === pid && o.tipo === tipo);
const somma = (righe) => righe.reduce((t, o) => t + o.qty, 0);

/* ═══ 1. IL RICALCOLO FA IL SUO LAVORO SU QUELLO CHE NON E' IN VIAGGIO ═══
   Prima di dire cosa NON deve succedere bisogna sapere che il tasto funziona:
   se il ricalcolo non facesse niente del tutto, tutti i controlli «non si
   riordina» sarebbero verdi per il motivo sbagliato. */
console.log("\n— 1. il ricalcolo scrive le righe che deve scrivere —");
await ricalcola();
const libero = await aperte(pLibero.id);
ok(libero.length === 1 && Math.abs(somma(libero) - 7) < 1e-6,
  `senza niente in viaggio si chiedono i 7 che mancano (${libero.length} righe, ${somma(libero)})`);

/* ═══ 2. IL DIFETTO: NON SI RICHIEDE QUELLO CHE E' GIA' PARTITO ═══ */
console.log("\n— 2. quello che e' gia' ordinato non si riordina —");
const coperto = await aperte(pCoperto.id);
ok(coperto.length === 0,
  `«${pCoperto.nome}»: servono 8 e 8 sono in viaggio, non si richiede niente (righe aperte: ${coperto.length}, per ${somma(coperto)})`);
/* e ancora dopo, perche' e' il ricalcolo del giorno dopo quello che faceva il danno */
await ricalcola(); await ricalcola();
const copertoAncora = await aperte(pCoperto.id);
ok(copertoAncora.length === 0,
  `e nemmeno dopo altri due ricalcoli (righe aperte: ${copertoAncora.length})`);

/* ═══ 3. CONTROCONTROLLO: LA MERCE ARRIVATA NON SI SOTTRAE ═══
   Sottrarre anche le righe «ricevuto» sarebbe l'errore opposto e piu' grave:
   quella merce e' gia' dentro la giacenza, toglierla due volte vorrebbe dire
   non riordinare mai piu' quel prodotto. */
console.log("\n— 3. la merce gia' ricevuta non conta come «in viaggio» —");
const ricevuto = await aperte(pRicevuto.id);
ok(ricevuto.length === 1 && Math.abs(somma(ricevuto) - 5) < 1e-6,
  `«${pRicevuto.nome}»: 5 ricevuti ieri e consumati, i 5 che mancano si richiedono (${ricevuto.length} righe, ${somma(ricevuto)})`);

/* ═══ 4. CONTROCONTROLLO: SI CHIEDE LA DIFFERENZA, NON ZERO ═══ */
console.log("\n— 4. se serve piu' di quanto e' in viaggio, si chiede la differenza —");
const parziale = await aperte(pParziale.id);
ok(parziale.length === 1 && Math.abs(somma(parziale) - 10) < 1e-6,
  `«${pParziale.nome}»: servono 18, 8 in viaggio, se ne chiedono 10 (${parziale.length} righe, ${somma(parziale)})`);

/* ═══ 5. I DOPPIONI GIA' IN GIRO SI RIASSORBONO ═══ */
console.log("\n— 5. di righe aperte per la stessa cosa ne resta una —");
const doppio = await aperte(pDoppio.id);
ok(doppio.length === 1,
  `«${pDoppio.nome}»: le due righe gemelle diventano una (righe aperte: ${doppio.length})`);
ok(doppio.length === 1 && Math.abs(somma(doppio) - 6) < 1e-6,
  `e chiede 6, non 12: due righe da 6 sarebbero merce doppia (${somma(doppio)})`);

/* ═══ 6. CONTROCONTROLLO: NON E' UN TAPPO DEFINITIVO ═══
   Chiusa la riga in viaggio, il fabbisogno deve tornare a chiedersi. Se no si
   sarebbe barattato «ordino il doppio» con «non ordino mai piu'». */
console.log("\n— 6. chiusa la riga in viaggio, il fabbisogno torna a chiedersi —");
const primaDi = await aperte(pChiuso.id);
ok(primaDi.length === 0, `«${pChiuso.nome}»: finche' e' in viaggio non si richiede (${primaDi.length})`);
/* La riga si chiude come la chiuderebbe una persona: scheda «Ordinati», il
   furgone e' arrivato senza quella merce, «Niente arrivato». Scriverlo nei
   dati da fuori sarebbe piu' comodo e proverebbe meno — il giro vero passa
   dal modulo di ricezione, ed e' quello che deve reggere. */
await p.getByText(/^Ordinati · \d+$/).first().click();
await p.waitForTimeout(600);
const rigaChiusa = p.locator("div").filter({ hasText: new RegExp("^" + pChiuso.nome + "$") })
  .locator("xpath=ancestor::div[.//button[@aria-label='Registra la merce arrivata']][1]").first();
await rigaChiusa.locator("button[aria-label='Registra la merce arrivata']").first().click();
await p.waitForTimeout(700);
await p.getByRole("button", { name: /^Niente arrivato$/ }).first().click();
await p.waitForTimeout(300);
await p.getByRole("button", { name: /^Registra ricezione$/ }).first().click();
await p.waitForTimeout(900);
await p.getByText(/^Da ordinare · \d+$/).first().click();
await p.waitForTimeout(500);
await ricalcola();
const dopoDi = await aperte(pChiuso.id);
ok(dopoDi.length === 1 && Math.abs(somma(dopoDi) - 9) < 1e-6,
  `chiusa quella riga, i 9 che mancano si richiedono di nuovo (${dopoDi.length} righe, ${somma(dopoDi)})`);

/* ═══ 7. LA FIDUCIA IN UNA RIGA «ORDINATO» SCADE ═══
   Il controcontrollo piu' importante di tutti, perche' e' l'unico modo in cui
   questa correzione puo' fare piu' danno del difetto che chiude. Nessuno
   obbliga a registrare una consegna: basta dimenticarsene una volta e quella
   riga direbbe «tranquillo, sta arrivando» per sempre. Dopo una settimana
   l'app torna a chiedere, com'era prima. Ordinare due volte una cosa che
   tarda da dieci giorni costa dei soldi; non ordinarla mai piu' costa il
   servizio. */
console.log("\n— 7. una riga ordinata e dimenticata non zittisce il prodotto per sempre —");
const vecchio = await aperte(pVecchio.id);
ok(vecchio.length === 1 && Math.abs(somma(vecchio) - 12) < 1e-6,
  `«${pVecchio.nome}»: ordinato dieci giorni fa e mai arrivato, i 12 si richiedono (${vecchio.length} righe, ${somma(vecchio)})`);

/* ═══ 8. IL LABORATORIO HA LA STESSA PROTEZIONE ═══
   Sistemare il retro e lasciare il laboratorio vorrebbe dire spostare il
   difetto, non toglierlo: gli acquisti del laboratorio passano da un'altra
   funzione, scritta uguale. */
console.log("\n— 8. gli acquisti del laboratorio seguono la stessa regola —");
const inLab = await aperte(pLab.id, "lab");
ok(inLab.length === 0,
  `«${pLab.nome}»: servono 4 e 4 sono in viaggio, il laboratorio non li riordina (${inLab.length} righe, ${somma(inLab)})`);

/* ═══ 9. E CHI PREME IL TASTO LO VIENE A SAPERE ═══
   «Serve, ma e' gia' in arrivo» non e' «non serve». Senza una parola, chi
   ricalcola e non vede comparire niente va a riordinare a mano — e il difetto
   e' come se ci fosse ancora. */
console.log("\n— 9. il messaggio dice perche' non compare niente —");
await p.getByRole("button", { name: /^Ricalcola$/ }).first().click();
const avviso = p.getByText(/gi[àa] ordinat/i).first();
let visto = "";
try { await avviso.waitFor({ state: "visible", timeout: 3500 }); visto = (await avviso.innerText()).trim(); } catch {}
ok(/gi[àa] ordinat/i.test(visto), `il messaggio nomina la merce gia' ordinata — «${visto || "(niente)"}»`);
ok(/\bordinati\b/i.test(visto), "e dice dove trovarla (la scheda «Ordinati»)");

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
