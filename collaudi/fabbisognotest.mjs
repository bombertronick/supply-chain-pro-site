/* gen-5.89: un conto solo, e dice se gli ingredienti bastano.

   SEGNALATO DA VALERIO, con due schermate a confronto: «nella schermata delle
   richieste non sono presenti queste diciture che sono in ordinazioni, e'
   difficile capire cosa mandare cosi' o cosa produrre. Basati sui sistemi
   migliori di produzione ed approvvigionamento».

   COS'ERA, E L'AVEVO FATTO IO. C'erano DUE elenchi di produzione in due
   schermate con due regole diverse:
   · Ordini, «Da preparare»: giacenza del laboratorio contro il LIVELLO DEL
     LABORATORIO — che in produzione vale 3 su tutti e dodici i preparati,
     cioe' un valore di partenza che non ha scelto nessuno.
   · Richieste, aggiunto da me in gen-5.88: quanto manca alle LINEE.
   Sui dati veri il primo diceva «da fare 2» e il secondo «niente».

   ADESSO IL CONTO E' UNO SOLO e sta dove il laboratorio lavora. Per ogni linea
   la domanda e' quanto le manca, e puo' arrivare da due parti — il livello
   previsto del giorno, o una richiesta gia' in coda: si prende la PIU' GRANDE,
   non la somma. Il §3 e' li' per questo: sommarle raddoppierebbe, perche' una
   richiesta nasce proprio dal fatto che la linea e' sotto il livello.

   IL §4 E' LA COSA NUOVA, ed e' quello che un piano di produzione serio fa
   sempre: sapere che ne servono 20 non serve a niente se il riso basta per 10.
   Meglio saperlo adesso che davanti alla pentola.

   Contro gen-5.88 il §2 e il §4 devono diventare rossi. */
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
if (!linee.length) throw new Error("banco di prova rotto: nessuna linea servita dal laboratorio");
const linea = linee[0];
st.profili = [{ id: "pr-l", nome: "Laboratorio", ruolo: "laboratorio", sedeId: lab.sedeId,
  colore: "#22B8CF", pinHash: hash("3333") }];

const uPz = st.unita.find((u) => u.simbolo === "pz") || st.unita[0];
const uKg = st.unita.find((u) => u.simbolo === "kg") || st.unita[1];
const [pA, pB, ing] = st.prodotti;
pA.nome = "Supplì nostrum"; pB.nome = "Crocchetta patate";
for (const p of [pA, pB]) {
  p.preparato = true; delete p.soloInteri; p.uomBase = uPz.id; p.conv = {}; delete p.convStim;
}
ing.nome = "Riso"; ing.uomBase = uKg.id; ing.conv = {}; delete ing.preparato; delete ing.convStim; delete ing.ricetta;
/* 10 supplì per 1 kg di riso: con 1 kg in casa se ne fanno 10, non 20 */
pA.ricetta = { resa: 10, uomResa: uPz.id, ingredienti: [{ prodottoId: ing.id, qty: 1, uomId: uKg.id }] };
delete pB.ricetta;

const perGiorno = (n) => { const o = {}; for (let g = 0; g < 7; g++) o[String(g)] = n; return o; };
linea.articoli = [
  /* sotto il livello di 20, ne ha 0 → ne mancano 20 */
  { prodottoId: pA.id, uomId: uPz.id, qty: 0, par: 20, parGiorni: perGiorno(20) },
  /* a livello: non deve comparire */
  { prodottoId: pB.id, uomId: uPz.id, qty: 30, par: 30, parGiorni: perGiorno(30) },
];
for (const l of linee.slice(1)) l.articoli = [];
lab.articoli = [
  { prodottoId: pA.id, uomId: uPz.id, qty: 0, par: 3 },
  { prodottoId: pB.id, uomId: uPz.id, qty: 0, par: 3 },
  { prodottoId: ing.id, uomId: uKg.id, qty: 1, par: 0 },   /* riso solo per 10 */
];
for (const a of lab.articoli) delete a.parGiorni;
/* UNA RICHIESTA GIÀ IN CODA per lo stesso prodotto e la stessa linea: nasce
   proprio dal fatto che è sotto livello, quindi NON va sommata */
st.richieste = [{ id: "ric-1", t: Date.now(), daSedeId: linea.sedeId, aSedeLabId: lab.sedeId,
  daMagazzinoId: linea.id, magNome: linea.nome, prodottoId: pA.id,
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
}, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Laboratorio", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "3333") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1400);
const scheda = () => p.locator(".sc-foglio").last();
const vai = async (nome) => {
  const n = p.getByText(nome, { exact: true });
  for (let i = 0; i < await n.count(); i++)
    if (await n.nth(i).isVisible()) { await n.nth(i).click(); break; }
  await p.waitForTimeout(1100);
};

/* ═══ 1. IN ORDINI NON C'È PIÙ UN SECONDO ELENCO ═══ */
console.log("\n— 1. in Ordini non c'è più un secondo conto che dice un'altra cosa —");
await vai("Ordini");
const ord = (await p.locator("body").innerText()).replace(/\s+/g, " ");
ok(!/Da preparare · \d/.test(ord), "l'elenco «Da preparare» non è più in Ordini");
ok(/Cosa produrre sta in «Richieste»/.test(ord), "e c'è scritto dov'è finito, invece di sparire e basta");

/* ═══ 2. IL CONTO STA IN RICHIESTE, E DICE QUANTO MANCA ALLE LINEE ═══ */
console.log("\n— 2. il conto sta in Richieste, e guarda quanto manca alle linee —");
await vai("Richieste");
const corpo = (await p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/Da produrre oggi/.test(corpo), "c'è «Da produrre oggi»");
await p.getByRole("button", { name: /Da produrre oggi/i }).first().click();
await p.waitForTimeout(800);
const t = (await scheda().innerText()).replace(/\s+/g, " ");
ok(/Supplì nostrum/.test(t), "c'è il supplì, che manca alla linea");
ok(!/Crocchetta patate/.test(t), "e non c'è la crocchetta, che è a livello");
ok(/Manca 20/.test(t), `dice che ne mancano 20 — «${t.slice(0, 160)}»`);

/* ═══ 3. LA RICHIESTA IN CODA NON RADDOPPIA IL LAVORO ═══
   La linea è sotto di 20 E ha una richiesta aperta da 20: è lo stesso
   fabbisogno visto da due parti. Sommarle direbbe 40 e farebbe produrre il
   doppio, che è il modo classico di sbagliare un piano di produzione. */
console.log("\n— 3. la richiesta già in coda non si somma al sotto-livello —");
ok(!/Manca 40/.test(t), "non dice 40: la richiesta e il sotto-livello sono la stessa cosa");
ok(/già chiesti/.test(t), `e dice che quei 20 sono già stati chiesti — «${(t.match(/di cui [^·]*/) || ["non detto"])[0]}»`);

/* ═══ 4. IL CONTROLLO CHE MANCAVA: GLI INGREDIENTI BASTANO? ═══
   Servono 20 supplì, la ricetta chiede 1 kg di riso ogni 10, e in casa c'è 1
   kg. Se ne fanno 10, non 20. */
console.log("\n— 4. e dice che gli ingredienti bastano solo per una parte —");
ok(/Gli ingredienti bastano per 10/.test(t),
  `avvisa che il riso basta per 10 su 20 — «${(t.match(/Gli ingredienti[^·]*|Non si può[^·]*/) || ["non detto"])[0]}»`);
ok(/Riso/.test(t), "e nomina l'ingrediente che manca, invece di dire solo «non basta»");

/* ═══ 5. IL CONTROCONTROLLO: LA SCELTA SUL LIVELLO DEL LABORATORIO È DICHIARATA ═══
   Il livello di scorta del laboratorio vale 3 su tutti e due i preparati e NON
   entra nel conto. Tacerlo sarebbe una scelta nascosta: chi vede «manca 20» e
   sa di avere un livello impostato deve capire perché non c'entra. */
console.log("\n— 5. e la scelta di non usare il livello del laboratorio è scritta —");
ok(/scorta che il laboratorio tiene per sé non ci entra/i.test(t),
  "c'è scritto che la scorta interna non entra nel conto");
ok(!/Manca 23/.test(t), "e infatti il 3 del laboratorio non è stato sommato");

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
