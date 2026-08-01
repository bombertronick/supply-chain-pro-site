/* gen-5.66: dire in blocco QUALI prodotti li fa il laboratorio.

   Il perche' e' aritmetico. In catalogo ci sono 102 prodotti e una ventina
   sono lavorati in casa. Fino a ieri la spunta stava solo nella scheda del
   singolo prodotto: per marcarli tutti volevano dire venti aperture, venti
   spunte, venti salvataggi — e uno saltato non lo vedi finche' non ti arriva
   un ordine a un fornitore per una cosa che vi fate da soli.

   Ci sono tre cose che devono essere vere insieme, e la terza e' quella che
   di solito si dimentica:
     1. marcare in blocco funziona
     2. TOGLIERE la marcatura funziona (altrimenti uno sbaglio non si ripara)
     3. si vede com'e' ADESSO prima di toccare, e i prodotti NON scelti
        restano esattamente come stavano */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
/* una categoria sola come bersaglio: cosi' «Tutti» ne prende un pugno e resta
   fuori tutto il resto, che e' il testimone */
const CAT = base.categorie[0];
const scena = () => {
  const s = JSON.parse(JSON.stringify(base));
  for (const p of s.prodotti) delete p.preparato;
  /* uno dei bersaglio si porta dietro un'eccezione di fornitore per sede:
     su un preparato non ha senso e deve sparire */
  const primo = s.prodotti.find((p) => p.categoriaId === CAT.id);
  primo.fornSede = { [s.sedi[0].id]: s.fornitori[0].id };
  return s;
};
const st0 = scena();
const bersaglio = st0.prodotti.filter((p) => p.categoriaId === CAT.id).map((p) => p.id);
const testimoni = st0.prodotti.filter((p) => p.categoriaId !== CAT.id).map((p) => p.id);
const primoBersaglio = st0.prodotti.find((p) => p.categoriaId === CAT.id);

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.addInitScript((s) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  const m = new Map(); m.set("scp:stato:v1", s);
  window.storage = {
    async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
    async set(k, v) { m.set(k, v); return true; },
    async delete(k) { m.delete(k); return true; },
  };
}, JSON.stringify(st0));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1300);

const apriBlocco = async () => {
  await vaiA(p, "Catalogo"); await p.waitForTimeout(500);
  await p.getByText(/Prodotti ·/).first().click().catch(() => {});
  await p.waitForTimeout(400);
  await p.getByRole("button", { name: /Modifica in blocco/ }).click();
  await p.getByText("Cosa vuoi cambiare", { exact: false }).first()
    .waitFor({ state: "visible", timeout: 30000 });
  await p.waitForTimeout(400);
};
const leggi = () => p.evaluate(async () => {
  const r = await window.storage.get("scp:stato:v1", true);
  const s = JSON.parse(r.value);
  return s.prodotti.map((x) => ({ id: x.id, nome: x.nome, prep: !!x.preparato,
    forn: x.fornitoreId || null, nFornSede: Object.keys(x.fornSede || {}).length }));
});

/* ═══ 1. LA VOCE C'È ═══ */
console.log("\n— 1. la voce nell'elenco «cosa vuoi cambiare» —");
await apriBlocco();
const campi = await p.locator(".sc-su select").first().locator("option").allInnerTexts();
ok(campi.some((t) => /laboratorio o fornitore/i.test(t)),
  "fra le cose modificabili c'e' «Chi lo fa»: " + campi.join(" · "));

await p.locator(".sc-su select").first().selectOption("preparato");
await p.waitForTimeout(300);
const valori = await p.locator(".sc-su select").nth(1).locator("option").allInnerTexts();
ok(valori.some((t) => /Lo fa il laboratorio/i.test(t)) && valori.some((t) => /Si compra da un fornitore/i.test(t)),
  "i due valori possibili sono scritti in italiano, non «sì/no»: " + valori.join(" · "));

/* ═══ 2. MARCARE IN BLOCCO ═══ */
console.log("\n— 2. marcare una categoria intera —");
await p.locator(".sc-su select").nth(1).selectOption("si");
await p.waitForTimeout(200);
/* filtro per categoria, poi «Tutti» prende solo quelli */
await p.getByRole("button", { name: CAT.nome, exact: true }).last().click();
await p.waitForTimeout(300);
await p.getByRole("button", { name: new RegExp(`^Tutti \\(${bersaglio.length}\\)$`) }).click();
await p.waitForTimeout(200);
await p.getByRole("button", { name: /^Applica a/ }).click();
await p.waitForTimeout(1000);

const d2 = await leggi();
const prep2 = d2.filter((x) => x.prep).map((x) => x.id);
ok(prep2.length === bersaglio.length && bersaglio.every((id) => prep2.includes(id)),
  `i ${bersaglio.length} prodotti di «${CAT.nome}» sono ora fatti in laboratorio`);
ok(testimoni.every((id) => !d2.find((x) => x.id === id).prep),
  `e i ${testimoni.length} di tutte le altre categorie non sono stati toccati`);
ok(d2.find((x) => x.id === primoBersaglio.id).nFornSede === 0,
  "a chi aveva un fornitore diverso per una sede quell'eccezione e' sparita: su un preparato non vuol dire niente");
ok(d2.find((x) => x.id === primoBersaglio.id).forn !== null,
  "il fornitore di prima resta scritto nei dati: se domani torni indietro non devi riscriverlo");

/* ═══ 3. SI VEDE COM'È ADESSO ═══ */
console.log("\n— 3. prima di toccare, si vede lo stato di adesso —");
await apriBlocco();
const testo = (await p.locator(".sc-su").innerText()).replace(/\s+/g, " ");
ok((testo.match(/in casa/g) || []).length >= 1,
  "nell'elenco i prodotti gia' fatti in casa portano la targhetta «in casa»");

/* il filtro dedicato: fammi vedere solo quelli */
await p.locator(".sc-su select").nth(2).selectOption("_prep");
await p.waitForTimeout(400);
const dopoFiltro = await p.locator(".sc-su").innerText();
const cont = dopoFiltro.match(/Tutti \((\d+)\)/);
ok(cont && Number(cont[1]) === bersaglio.length,
  `il filtro «solo quelli fatti in laboratorio» ne mostra esattamente ${bersaglio.length}`);

/* ═══ 4. TORNARE INDIETRO ═══ */
console.log("\n— 4. togliere la marcatura —");
await p.locator(".sc-su select").first().selectOption("preparato");
await p.waitForTimeout(300);
await p.locator(".sc-su select").nth(1).selectOption("no");
await p.waitForTimeout(200);
/* il filtro «solo i preparati» e' rimasto acceso: «Tutti» prende quelli */
await p.getByRole("button", { name: new RegExp(`^Tutti \\(${bersaglio.length}\\)$`) }).click();
await p.waitForTimeout(200);
await p.getByRole("button", { name: /^Applica a/ }).click();
await p.waitForTimeout(1000);

const d4 = await leggi();
ok(d4.every((x) => !x.prep),
  "tolta la marcatura, non resta nessun preparato: uno sbaglio si ripara in blocco com'e' stato fatto");
ok(d4.find((x) => x.id === primoBersaglio.id).forn === primoBersaglio.fornitoreId,
  "e ognuno si ritrova il suo fornitore di prima, senza doverlo riscrivere");

ok(errs.length === 0, "nessun errore di pagina" + (errs.length ? ": " + errs[0] : ""));
await p.screenshot({ path: "prepblocco.png", fullPage: false });
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
