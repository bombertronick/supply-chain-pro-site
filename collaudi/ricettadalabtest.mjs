/* gen-5.86: le dosi le scrive chi ha la pentola in mano.

   SEGNALATO DA VALERIO, urgente: «serve poter confermare la preparazione dei
   prodotti che vengono lavorati con piu' prodotti nel laboratorio».

   COS'ERA, misurato sui dati veri il 5 agosto. Il tasto per confermare c'era
   gia' (gen-5.84). Quello che mancava e' che per DIECI PREPARATI SU DODICI la
   conferma era vuota: senza ricetta la quantita' del preparato sale e nessun
   ingrediente scende, quindi i magazzini continuano a dire che c'e' roba gia'
   usata. E i dieci senza ricetta sono tutti cose fatte con piu' prodotti —
   supplì, breccole, crocchette, fiori di zucca.

   E la ricetta il laboratorio NON POTEVA SCRIVERLA. Sta dentro il Catalogo,
   il Catalogo sta sotto «Gestione», e nella barra del laboratorio «Gestione»
   non c'e': quella voce ce l'ha solo l'admin. Le dosi le sa chi cucina, ed
   erano dietro un permesso che quella persona non ha.

   IL §4 E' IL CONTROCONTROLLO, ed e' il motivo per cui questo si puo' fare
   senza aprire il Catalogo al laboratorio: da qui si scrive LA RICETTA DI
   QUESTO PRODOTTO e nient'altro. Il prezzo, il fornitore, la categoria restano
   dove stanno. Allargare un permesso e' facile; allargarlo di quel tanto che
   serve e' il lavoro.

   Contro gen-5.85 il §2 deve diventare rosso. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const lab = st.magazzini.find((m) => m.tipo === "laboratorio");
st.profili = [{ id: "pr-l", nome: "Laboratorio", ruolo: "laboratorio", sedeId: lab.sedeId,
  colore: "#22B8CF", pinHash: hash("3333") }];

const uKg = st.unita.find((u) => u.simbolo === "kg");
const uPz = st.unita.find((u) => u.simbolo === "pz");
if (!uKg || !uPz || uKg.id === uPz.id) throw new Error("banco di prova rotto: «kg» e «pz»");

/* un preparato SENZA ricetta, come i dieci veri: si fa con piu' prodotti ma
   all'app non l'ha ancora detto nessuno */
const [prep, iRiso, iCarne] = st.prodotti;
prep.nome = "Supplì nostrum"; prep.preparato = true; delete prep.soloInteri;
prep.uomBase = uPz.id; prep.conv = {}; delete prep.convStim; delete prep.ricetta;
iRiso.nome = "Riso"; iRiso.uomBase = uKg.id; iRiso.conv = {}; delete iRiso.preparato; delete iRiso.convStim; delete iRiso.ricetta;
iCarne.nome = "Ragù"; iCarne.uomBase = uKg.id; iCarne.conv = {}; delete iCarne.preparato; delete iCarne.convStim; delete iCarne.ricetta;
lab.articoli = [
  { prodottoId: prep.id,   uomId: uPz.id, qty: 0, par: 0 },
  { prodottoId: iRiso.id,  uomId: uKg.id, qty: 8, par: 0 },
  { prodottoId: iCarne.id, uomId: uKg.id, qty: 4, par: 0 },
];
for (const a of lab.articoli) delete a.parGiorni;
st.richieste = []; st.ordini = []; st.movimenti = []; st.rev = (st.rev || 0) + 1;

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
const qta = async (pid) => {
  const s = await stato();
  return s.magazzini.find((m) => m.tipo === "laboratorio").articoli.find((a) => a.prodottoId === pid)?.qty;
};
const scheda = () => p.locator(".sc-foglio").last();

/* ═══ 1. IL CATALOGO AL LABORATORIO RESTA CHIUSO ═══
   E' il vincolo dentro cui va risolto il problema: la strada NON puo' essere
   «dagli il Catalogo». */
console.log("\n— 1. il laboratorio non ha (e non deve avere) il Catalogo —");
const corpo = (await p.locator("body").innerText()).replace(/\n/g, " ");
ok(!/\bGestione\b/.test(corpo), "in barra non c'è «Gestione», quindi nemmeno il Catalogo");

/* ═══ 2. IL CUORE: DA «HO PRODOTTO» SI SCRIVONO LE DOSI ═══ */
console.log("\n— 2. da «Ho prodotto» può scrivere cosa ci vuole —");
const nav = p.getByText("Magazzini", { exact: true });
for (let i = 0; i < await nav.count(); i++)
  if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
await p.waitForTimeout(900);
await p.getByText(lab.nome, { exact: true }).first().click(); await p.waitForTimeout(900);
await p.getByRole("button", { name: /Ho prodotto Supplì nostrum/i }).first().click();
await p.waitForTimeout(800);

const scrivi = scheda().getByRole("button", { name: /Scrivi cosa ci vuole/i }).first();
ok(await scrivi.count() > 0,
  "senza ricetta gli viene offerto di scriverla, invece di dirgli solo che non c'è");
await scrivi.click(); await p.waitForTimeout(500);

/* per 10 pezzi: 1 kg di riso e 0,5 kg di ragù */
const dentro = scheda();
await dentro.getByLabel("Ne escono").fill("10").catch(async () => {
  await dentro.locator("input").nth(1).fill("10");
});
const sceglie = dentro.locator("select");
await sceglie.nth(1).selectOption({ label: "Riso" });
await dentro.locator("input").nth(2).fill("1");
await dentro.getByRole("button", { name: /Aggiungi ingrediente/i }).click();
await p.waitForTimeout(400);
await dentro.locator("select").nth(3).selectOption({ label: "Ragù" });
await dentro.locator("input").nth(3).fill("0,5");
await p.waitForTimeout(300);
await dentro.getByRole("button", { name: /Salva la ricetta/i }).click();
await p.waitForTimeout(1200);

const s1 = await stato();
const r = s1.prodotti.find((x) => x.id === prep.id).ricetta;
ok(!!r, "la ricetta è stata salvata sul prodotto");
ok(r && r.resa === 10, `ne escono 10 per volta (${r?.resa})`);
ok(r && (r.ingredienti || []).length === 2, `con 2 ingredienti (${(r?.ingredienti || []).length})`);

/* ═══ 3. E SUBITO DOPO, LA CONFERMA NON È PIÙ VUOTA ═══
   E' la richiesta di Valerio alla lettera: confermare la preparazione di una
   cosa fatta con piu' prodotti, e vedere scendere quei prodotti. */
console.log("\n— 3. e adesso confermare la produzione scala davvero gli ingredienti —");
const testo = (await scheda().innerText()).replace(/\s+/g, " ");
ok(/La ricetta ne fa/.test(testo), "la scheda riconosce subito la ricetta appena scritta");
await scheda().locator("input").first().fill("20");
await p.waitForTimeout(600);
const testo2 = (await scheda().innerText()).replace(/\s+/g, " ");
ok(/Esce dai magazzini/.test(testo2), "e mostra cosa esce PRIMA di confermare");
ok(/Riso/.test(testo2) && /Ragù/.test(testo2), "con tutti e due gli ingredienti");

await scheda().getByRole("button", { name: /^Ho prodotto$/ }).last().click();
await p.waitForTimeout(1500);
ok((await qta(prep.id)) === 20, `ci sono 20 supplì (${await qta(prep.id)})`);
/* 20 pezzi = 2 volte la ricetta: 2 kg di riso, 1 kg di ragù */
const riso = await qta(iRiso.id), rag = await qta(iCarne.id);
ok(riso === 6, `il riso è sceso da 8 a 6 (${riso})`);
ok(rag === 3, `il ragù da 4 a 3 (${rag})`);

/* ═══ 4. IL CONTROCONTROLLO: SI È APERTO SOLO QUELLO CHE SERVIVA ═══
   Da qui si scrive la ricetta di QUESTO prodotto, non si entra in catalogo.
   Prezzo, fornitore e categoria non devono essere toccabili. */
console.log("\n— 4. ma non gli si è aperto il catalogo dalla finestra —");
const testo3 = (await scheda().innerText().catch(() => "")).replace(/\s+/g, " ");
ok(!/Prezzo|Fornitore|Categoria/i.test(testo3),
  "nella scheda non c'è prezzo, fornitore né categoria: solo le dosi");
const s2 = await stato();
const pr2 = s2.prodotti.find((x) => x.id === prep.id);
const pr0 = st.prodotti.find((x) => x.id === prep.id);
ok(pr2.fornitoreId === pr0.fornitoreId && pr2.categoriaId === pr0.categoriaId,
  "e sul prodotto sono cambiate solo le dosi, non il resto della sua scheda");

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
