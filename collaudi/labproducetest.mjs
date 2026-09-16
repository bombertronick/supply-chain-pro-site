/* gen-5.84: il laboratorio produce da dove legge cosa deve fare.

   SEGNALATO DA VALERIO: «il laboratorio non puo' confermare la produzione dei
   preparati in laboratorio, gli viene solo detto quanti kg o pezzi devono
   fare (pero' dovrebbero vedere sia i pezzi che sono stati richiesti e a
   quanti kg corrispondono)» e «devo poter confermare la produzione di quel
   prodotto».

   COS'ERA. La strada c'era, ma passava da un'altra parte: Magazzini → apri il
   magazzino del laboratorio → cerca la riga → «Ho prodotto». Due schermate per
   un lavoro solo, e nel mezzo la richiesta che stavi guardando la perdi di
   vista. Nelle Richieste si poteva solo CONFERMARE L'INVIO — che e' un'altra
   cosa: manda roba che dev'essere gia' stata fatta.
   E la quantita' si vedeva in una sola unita' alla volta, da cambiare con una
   tendina. Chi lavora ha in mano una bilancia, non un convertitore.

   IL §5 E' IL CONTROCONTROLLO, ed e' la ragione per cui i due tasti restano
   due. Se «Ho prodotto» facesse anche partire la merce, la richiesta
   risulterebbe evasa senza che nessuno abbia mandato niente, e la giacenza
   del laboratorio smetterebbe di dire il vero. Produrre e mandare sono due
   gesti, e devono restare due.

   Contro gen-5.83 il §2 e il §3 devono diventare rossi. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const lab = st.magazzini.find((m) => m.tipo === "laboratorio");
const linea = st.magazzini.find((m) => m.tipo === "linea-lab")
  || st.magazzini.find((m) => m.tipo.startsWith("linea"));
st.profili = [{ id: "pr-l", nome: "Laboratorio", ruolo: "laboratorio", sedeId: lab.sedeId,
  colore: "#22B8CF", pinHash: hash("3333") }];

/* il preparato: base in pezzi, e una conversione che dice quanto pesa.
   E' il cuore della sua richiesta — vedere i pezzi E i chili insieme. */
const uKg = st.unita.find((u) => u.simbolo === "kg") || st.unita[0];
const uPz = st.unita.find((u) => u.simbolo === "pz") || st.unita[1];
if (uKg.id === uPz.id) throw new Error("banco di prova rotto: «kg» e «pz» coincidono");
const prep = st.prodotti[0];
prep.nome = "Polpette"; prep.preparato = true; prep.soloInteri = false;
prep.uomBase = uPz.id; delete prep.uomLavorazione;
prep.conv = { [uKg.id]: 5 };          /* 1 kg vale 5 pezzi → 20 pz = 4 kg */
delete prep.convStim; delete prep.ricetta;
lab.articoli = [{ prodottoId: prep.id, uomId: uPz.id, qty: 0, par: 0 }];

st.richieste = [{ id: "ric-prova", t: Date.now(), daSedeId: linea.sedeId, aSedeLabId: lab.sedeId,
  daMagazzinoId: linea.id, magNome: linea.nome, prodottoId: prep.id,
  qty: 20, uomId: uPz.id, qtyLinea: 20, uomLineaId: uPz.id,
  stato: "in-attesa", creataDa: "banco di prova" }];
st.ordini = []; st.movimenti = []; st.rev = (st.rev || 0) + 1;

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
await p.getByText("Laboratorio", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "3333") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1400);

const stato = async () => await p.evaluate(async () => await window.__leggi());
const giacenzaLab = async () => {
  const s = await stato();
  const m = s.magazzini.find((x) => x.tipo === "laboratorio");
  return m.articoli.find((a) => a.prodottoId === s.prodotti.find((y) => y.preparato)?.id)?.qty;
};
const richiesta = async () => (await stato()).richieste[0];

/* ═══ 1. IL LABORATORIO ARRIVA ALLE SUE RICHIESTE ═══ */
console.log("\n— 1. il laboratorio vede cosa gli è stato chiesto —");
const nav = p.getByText("Richieste", { exact: true });
for (let i = 0; i < await nav.count(); i++)
  if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
await p.waitForTimeout(1000);
const testo = (await p.locator("body").innerText()).replace(/\n/g, " ");
ok(/Polpette/.test(testo), "la richiesta di «Polpette» c'è");

/* ═══ 2. I PEZZI E I CHILI INSIEME, SENZA TENDINE ═══
   Sua richiesta alla lettera: «dovrebbero vedere sia i pezzi che sono stati
   richiesti e a quanti kg corrispondono». */
console.log("\n— 2. si vedono i pezzi E i chili, senza toccare niente —");
ok(/\b20\b/.test(testo), "ci sono i 20 pezzi chiesti");
ok(/=\s*4\s*kg/.test(testo.replace(/\s+/g, " ")),
  `e accanto l'equivalenza in chili: 20 pz = 4 kg — «${(testo.match(/=\s*[\d,.]+\s*\w+/) || ["non trovata"])[0]}»`);

/* ═══ 3. «HO PRODOTTO» STA DOVE SI LEGGE COSA FARE ═══ */
console.log("\n— 3. «Ho prodotto» è lì, sulla richiesta —");
const tasto = p.getByRole("button", { name: /^Ho prodotto$/ }).first();
ok(await tasto.count() > 0, "il tasto «Ho prodotto» è sulla riga della richiesta");
await tasto.click(); await p.waitForTimeout(800);
ok(await p.getByText(/Ho prodotto · Polpette/).count() > 0, "e apre la scheda della produzione");

/* ═══ 4. LA PRODUZIONE ENTRA IN MAGAZZINO ═══ */
console.log("\n— 4. quello che si produce entra nel magazzino del laboratorio —");
await p.locator(".sc-foglio").last().locator("input").last().fill("20");
await p.waitForTimeout(300);
await p.getByRole("button", { name: /^Ho prodotto$/ }).last().click();
await p.waitForTimeout(1400);
ok((await giacenzaLab()) === 20, `in laboratorio ci sono 20 pezzi (${await giacenzaLab()})`);

/* ═══ 5. IL CONTROCONTROLLO: PRODURRE NON È MANDARE ═══
   Se «Ho prodotto» facesse partire anche la merce, la richiesta risulterebbe
   evasa senza che nessuno abbia mandato niente. Produrre e mandare sono due
   gesti e devono restare due. */
console.log("\n— 5. ma la richiesta NON è partita da sola —");
const r = await richiesta();
ok(r.stato === "in-attesa", `la richiesta è ancora in attesa (${r.stato})`);
const lin = (await stato()).magazzini.find((m) => m.id === linea.id);
const inLinea = lin.articoli.find((a) => a.prodottoId === prep.id)?.qty ?? 0;
ok(inLinea === 0, `e in linea non è arrivato niente finché non si conferma (${inLinea})`);

/* ═══ 6. E POI SI CONFERMA, DALLO STESSO POSTO ═══ */
console.log("\n— 6. adesso il tasto per mandarla c'è, e funziona —");
const conf = p.getByRole("button", { name: /^Conferma / }).first();
ok(await conf.count() > 0, `il tasto di conferma è comparso — «${await conf.innerText().catch(() => "?")}»`);
await conf.click(); await p.waitForTimeout(1500);
const r2 = await richiesta();
ok(r2.stato !== "in-attesa", `la richiesta è stata evasa (${r2.stato})`);
ok((await giacenzaLab()) < 20, `e i pezzi sono usciti dal laboratorio (${await giacenzaLab()})`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
