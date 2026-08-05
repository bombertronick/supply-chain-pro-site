/* gen-5.88: il laboratorio vede cosa deve produrre, e quando.

   CHIESTO DA VALERIO: «in laboratorio si deve vedere quando e quali prodotti
   devono essere prodotti (parlo dei prodotti composti)».

   COS'ERA. Il laboratorio vedeva solo le richieste GIA' ARRIVATE: si lavorava
   all'indietro, quando la linea era gia' scesa sotto il livello. Il dato per
   guardare avanti c'era gia', ma dall'altra parte — sulle LINEE, che hanno il
   livello previsto giorno per giorno (in produzione ce l'hanno tutte e 24 le
   righe dei preparati).

   DOVE SI GUARDA E' LA DECISIONE CHE CONTA, e il §3 la difende. Il livello dei
   preparati DENTRO il laboratorio non serve a questo: e' quanto se ne tiene di
   scorta, e in produzione vale 3 su tutti e dodici — un numero che non ha
   scelto nessuno. Un piano costruito su quello sarebbe inventato e sembrerebbe
   vero, che e' il modo peggiore di sbagliare.

   Contro gen-5.87 il §1 deve diventare rosso. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const lab = st.magazzini.find((m) => m.tipo === "laboratorio");
const linee = st.magazzini.filter((m) => m.tipo === "linea-lab"
  && st.sedi.find((s) => s.id === m.sedeId)?.labSedeId === lab.sedeId);
if (linee.length < 1) throw new Error("banco di prova rotto: il laboratorio non rifornisce nessuna linea");
st.profili = [{ id: "pr-l", nome: "Laboratorio", ruolo: "laboratorio", sedeId: lab.sedeId,
  colore: "#22B8CF", pinHash: hash("3333") }];

const uPz = st.unita.find((u) => u.simbolo === "pz") || st.unita[0];
const [pA, pB, ing] = st.prodotti;
pA.nome = "Supplì nostrum"; pB.nome = "Crocchetta patate";
for (const p of [pA, pB]) {
  p.preparato = true; delete p.soloInteri; p.uomBase = uPz.id; p.conv = {};
  delete p.convStim; delete p.ricetta;
}
ing.nome = "Riso"; delete ing.preparato; delete ing.ricetta;

/* IL LIVELLO CHE CONTA STA SULLE LINEE, giorno per giorno.
   Oggi la linea ne vuole 30 e ne ha 10 → ne mancano 20. In laboratorio ce ne
   sono 5 → da produrre 15. La crocchetta invece e' a posto: 20 volute, 20 in
   linea. Cosi' il collaudo distingue «tutti i preparati» da «quelli che
   servono davvero», che e' la differenza fra un elenco e un piano di lavoro. */
const oggi = new Date().getDay();
const perGiorno = (n) => { const o = {}; for (let g = 0; g < 7; g++) o[String(g)] = n; return o; };
linee[0].articoli = [
  { prodottoId: pA.id, uomId: uPz.id, qty: 10, par: 30, parGiorni: perGiorno(30) },
  { prodottoId: pB.id, uomId: uPz.id, qty: 20, par: 20, parGiorni: perGiorno(20) },
];
for (const l of linee.slice(1)) l.articoli = [];

/* dentro il laboratorio il livello e' un numero che non vuol dire niente per
   questo conto: se il piano lo usasse, i numeri uscirebbero diversi */
lab.articoli = [
  { prodottoId: pA.id, uomId: uPz.id, qty: 5, par: 3 },
  { prodottoId: pB.id, uomId: uPz.id, qty: 5, par: 3 },
  { prodottoId: ing.id, uomId: ing.uomBase, qty: 50, par: 0 },
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
const inLab = async (pid) => {
  const s = await stato();
  return s.magazzini.find((m) => m.tipo === "laboratorio").articoli.find((a) => a.prodottoId === pid)?.qty;
};
const scheda = () => p.locator(".sc-foglio").last();
const nav = p.getByText("Richieste", { exact: true });
for (let i = 0; i < await nav.count(); i++)
  if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
await p.waitForTimeout(1100);

/* ═══ 1. IL PIANO DI LAVORO SI VEDE APPENA SI ENTRA ═══
   Senza nessuna richiesta in attesa: è il punto, si guarda AVANTI. */
console.log("\n— 1. senza che nessuno abbia chiesto niente, dice già cosa fare —");
const corpo = (await p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/Nessuna richiesta in attesa/.test(corpo), "non c'è nessuna richiesta in attesa");
const tasto = p.getByRole("button", { name: /Da produrre oggi/i }).first();
ok(await tasto.count() > 0, "e c'è «Da produrre oggi»");
ok(/Da produrre oggi · 1 preparato/.test(corpo),
  `e dice che il preparato da fare è uno, non due — «${(corpo.match(/Da produrre oggi[^·]*·[^·]*/) || ["non trovato"])[0].trim()}»`);

/* ═══ 2. QUANTI, E IL CONTO IN CHIARO ═══ */
console.log("\n— 2. dice quanti, e mostra la somma invece di darla per buona —");
await tasto.click(); await p.waitForTimeout(800);
const t = (await scheda().innerText()).replace(/\s+/g, " ");
ok(/Supplì nostrum/.test(t), "c'è il supplì, che manca");
ok(!/Crocchetta patate/.test(t), "e NON c'è la crocchetta, che è a livello");
ok(/\b15\b/.test(t), `da produrre 15: 30 voluti − 10 in linea − 5 in laboratorio — «${t.slice(0, 150)}»`);
ok(/1 linea vuole 30/.test(t), "e il conto è scritto: «1 linea vuole 30»");
ok(/ne hanno già 10/.test(t), "«ne hanno già 10»");
ok(/in laboratorio 5/.test(t), "«in laboratorio 5»");
ok(/nessuna ricetta/.test(t), "e avvisa che senza ricetta non scalerà ingredienti");

/* ═══ 3. IL CONTROCONTROLLO: IL NUMERO VIENE DALLE LINEE, NON DAL LABORATORIO ═══
   In laboratorio il livello dei due preparati è 3 con 5 pezzi dentro: se il
   piano guardasse LI', il supplì risulterebbe a posto e la lista sarebbe
   vuota. Il 15 può venire solo dal livello della linea. */
console.log("\n— 3. e viene dal livello della LINEA, non da quello del laboratorio —");
ok(!/\b3\b(?!\d)/.test((t.match(/Supplì nostrum[^]*?in laboratorio \d+/) || [""])[0]),
  "nel conto non compare il livello interno del laboratorio (3), che qui non c'entra");
ok(/15/.test(t) && !/^0/.test(t),
  "il numero è 15, cioè quello che serve alla linea: guardando il laboratorio sarebbe stato zero");

/* ═══ 4. SI PASSA DAL PIANO ALLA PRODUZIONE COL NUMERO GIÀ SCRITTO ═══ */
console.log("\n— 4. e si va a produrre col numero già scritto —");
await scheda().getByText("Supplì nostrum", { exact: false }).first().click();
await p.waitForTimeout(800);
const val = await scheda().locator("input").first().inputValue();
ok(val === "15", `il campo è già a 15, non da riscrivere (dice «${val}»)`);
await scheda().getByRole("button", { name: /^Ho prodotto$/ }).last().click();
await p.waitForTimeout(1500);
ok((await inLab(pA.id)) === 20, `in laboratorio adesso sono 20 (${await inLab(pA.id)})`);

/* ═══ 5. FATTO IL LAVORO, IL RIQUADRO SPARISCE ═══
   Un avviso che resta acceso anche quando non c'è più niente da fare insegna
   a ignorare gli avvisi. */
console.log("\n— 5. e finito il lavoro l'avviso se ne va —");
await p.waitForTimeout(600);
const corpo2 = (await p.locator("body").innerText()).replace(/\s+/g, " ");
ok(!/Da produrre oggi/.test(corpo2),
  "«Da produrre oggi» non c'è più: il lavoro è fatto");

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
