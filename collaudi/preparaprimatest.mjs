/* gen-5.87: preparare prima, mandare in fretta dopo.

   SEGNALATO DA VALERIO: «non mi hai messo la conferma della produzione di quei
   prodotti, il laboratorio a volte si prepara prima dei prodotti per poi
   inviarli, quindi deve avere la possibilita' di poter inviare rapidamente i
   prodotti composti richiesti».

   HA RAGIONE, E COS'ERA. gen-5.84 aveva messo «Ho prodotto» SULLA RICHIESTA:
   risolveva meta' del lavoro — produrre quello che qualcuno ha gia' chiesto.
   L'altra meta', preparare la mattina PRIMA che arrivi qualunque richiesta,
   era rimasta dov'era: Magazzini, apri il magazzino, cerca la riga fra le
   altre, premi l'ampollina. E con zero richieste in attesa la schermata del
   laboratorio mostrava un riquadro vuoto — proprio mentre si sta lavorando.

   E DA LI' NASCE LA LENTEZZA A VALLE, che e' la parte che chiede lui. Quello
   che e' stato fatto ma non segnato in laboratorio NON C'E': «Confermo tutto»
   non lo vede, e quando le richieste arrivano non parte niente. Il §4 e' il
   controcontrollo di questo, ed e' il cuore del collaudo: si prepara a vuoto,
   POI arrivano le richieste, e devono partire tutte in un gesto solo.

   Contro gen-5.86 il §1 e il §2 devono diventare rossi. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const lab = st.magazzini.find((m) => m.tipo === "laboratorio");
const linea = st.magazzini.find((m) => m.tipo !== "laboratorio" && m.sedeId !== lab.sedeId)
  || st.magazzini.find((m) => m.tipo !== "laboratorio");
st.profili = [{ id: "pr-l", nome: "Laboratorio", ruolo: "laboratorio", sedeId: lab.sedeId,
  colore: "#22B8CF", pinHash: hash("3333") }];

const uKg = st.unita.find((u) => u.simbolo === "kg");
const uPz = st.unita.find((u) => u.simbolo === "pz");
if (!uKg || !uPz || uKg.id === uPz.id) throw new Error("banco di prova rotto: «kg» e «pz»");

/* DUE preparati composti, come i suoi: la ricetta c'e' gia' — qui non si
   prova a scriverla, si prova a farla e a mandarla */
const [pA, pB, ing1, ing2] = st.prodotti;
pA.nome = "Supplì nostrum"; pB.nome = "Crocchetta patate";
for (const p of [pA, pB]) {
  p.preparato = true; delete p.soloInteri; p.uomBase = uPz.id; p.conv = {}; delete p.convStim;
}
ing1.nome = "Riso"; ing2.nome = "Patate";
for (const p of [ing1, ing2]) { p.uomBase = uKg.id; p.conv = {}; delete p.preparato; delete p.convStim; delete p.ricetta; }
pA.ricetta = { resa: 10, uomResa: uPz.id, ingredienti: [{ prodottoId: ing1.id, qty: 1, uomId: uKg.id }] };
pB.ricetta = { resa: 10, uomResa: uPz.id, ingredienti: [{ prodottoId: ing2.id, qty: 2, uomId: uKg.id }] };

/* il laboratorio parte A ZERO sui preparati: e' la mattina */
lab.articoli = [
  { prodottoId: pA.id, uomId: uPz.id, qty: 0, par: 0 },
  { prodottoId: pB.id, uomId: uPz.id, qty: 0, par: 0 },
  { prodottoId: ing1.id, uomId: uKg.id, qty: 20, par: 0 },
  { prodottoId: ing2.id, uomId: uKg.id, qty: 20, par: 0 },
];
linea.articoli = [
  { prodottoId: pA.id, uomId: uPz.id, qty: 0, par: 30 },
  { prodottoId: pB.id, uomId: uPz.id, qty: 0, par: 30 },
];
for (const a of [...lab.articoli, ...linea.articoli]) delete a.parGiorni;
/* NESSUNA richiesta: e' esattamente la situazione in cui prima non si poteva
   fare niente da qui */
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
  window.__scrivi = async (f) => {
    const s2 = JSON.parse(m.get("scp:stato:v1"));
    f(s2); s2.rev = (s2.rev || 0) + 1; s2.mtime = Date.now();
    m.set("scp:stato:v1", JSON.stringify(s2));
    await window.storage.set("scp:rev:v1", String(s2.rev));
  };
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
const inLinea = async (pid) => {
  const s = await stato();
  return s.magazzini.find((m) => m.id === linea.id).articoli.find((a) => a.prodottoId === pid)?.qty;
};
const vaiRichieste = async () => {
  const nav = p.getByText("Richieste", { exact: true });
  for (let i = 0; i < await nav.count(); i++)
    if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
  await p.waitForTimeout(1000);
};
const scheda = () => p.locator(".sc-foglio").last();

/* ═══ 1. SENZA NESSUNA RICHIESTA, SI PUÒ GIÀ SEGNARE QUELLO CHE SI FA ═══ */
console.log("\n— 1. è mattina, non ha chiesto ancora nessuno, e si può già lavorare —");
await vaiRichieste();
const corpo = (await p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/Nessuna richiesta in attesa/.test(corpo), "la coda è vuota, come deve essere a quest'ora");
const tasto = p.getByRole("button", { name: /Ho prodotto/i }).first();
ok(await tasto.count() > 0,
  "e «Ho prodotto» c'è lo stesso, senza passare dai Magazzini");

/* ═══ 2. L'ELENCO DI QUELLO CHE PUÒ AVER FATTO ═══ */
console.log("\n— 2. gli si chiede cosa ha fatto, e ci sono tutti i suoi preparati —");
await tasto.click(); await p.waitForTimeout(700);
const el = (await scheda().innerText()).replace(/\s+/g, " ");
ok(/Supplì nostrum/.test(el) && /Crocchetta patate/.test(el),
  "ci sono tutti e due i preparati del laboratorio");
ok(/In laboratorio: 0/.test(el),
  "e dice quanto ce n'è adesso, che è la domanda che uno si fa in quel momento");

/* ═══ 3. NE PRODUCE DUE, IN ANTICIPO ═══ */
console.log("\n— 3. ne prepara due tipi, in anticipo —");
await scheda().getByText("Supplì nostrum", { exact: false }).first().click();
await p.waitForTimeout(700);
await scheda().locator("input").first().fill("40");
await p.waitForTimeout(500);
await scheda().getByRole("button", { name: /^Ho prodotto$/ }).last().click();
await p.waitForTimeout(1400);
ok((await inLab(pA.id)) === 40, `40 supplì in laboratorio (${await inLab(pA.id)})`);
ok((await inLab(ing1.id)) === 16, `e il riso è sceso di 4 kg: 20 → 16 (${await inLab(ing1.id)})`);

await p.getByRole("button", { name: /Ho prodotto/i }).first().click(); await p.waitForTimeout(700);
await scheda().getByText("Crocchetta patate", { exact: false }).first().click();
await p.waitForTimeout(700);
await scheda().locator("input").first().fill("40");
await p.waitForTimeout(500);
await scheda().getByRole("button", { name: /^Ho prodotto$/ }).last().click();
await p.waitForTimeout(1400);
ok((await inLab(pB.id)) === 40, `40 crocchette in laboratorio (${await inLab(pB.id)})`);

/* ═══ 4. IL CONTROCONTROLLO, ED È IL CUORE: ADESSO ARRIVANO LE RICHIESTE ═══
   Quello che e' stato preparato deve partire IN UN GESTO SOLO. E' la frase di
   Valerio alla lettera: «inviare rapidamente i prodotti composti richiesti».
   Se il §3 non avesse funzionato, in laboratorio ci sarebbe zero, «Confermo
   tutto» non comparirebbe e questo §4 sarebbe rosso: e' il modo di provare
   che le due meta' sono attaccate. */
console.log("\n— 4. arrivano le richieste, e parte tutto in un gesto solo —");
await p.evaluate(async (d) => {
  await window.__scrivi((s) => {
    s.richieste = [
      { id: "r1", t: Date.now(), daSedeId: d.sedeLinea, aSedeLabId: d.sedeLab,
        daMagazzinoId: d.linea, magNome: d.nomeLinea, prodottoId: d.pA,
        qty: 30, uomId: d.uPz, qtyLinea: 30, uomLineaId: d.uPz,
        stato: "in-attesa", creataDa: "banco di prova" },
      { id: "r2", t: Date.now(), daSedeId: d.sedeLinea, aSedeLabId: d.sedeLab,
        daMagazzinoId: d.linea, magNome: d.nomeLinea, prodottoId: d.pB,
        qty: 30, uomId: d.uPz, qtyLinea: 30, uomLineaId: d.uPz,
        stato: "in-attesa", creataDa: "banco di prova" },
    ];
  });
}, { sedeLinea: linea.sedeId, sedeLab: lab.sedeId, linea: linea.id, nomeLinea: linea.nome,
     pA: pA.id, pB: pB.id, uPz: uPz.id });
await p.waitForTimeout(5000);

const conferma = p.getByRole("button", { name: /Confermo tutto/i }).first();
ok(await conferma.count() > 0, "compare «Confermo tutto»: c'è merce pronta da mandare");
const testoC = await conferma.innerText().catch(() => "");
ok(/2 richieste/.test(testoC.replace(/\s+/g, " ")),
  `e dice che sono due — «${testoC.replace(/\s+/g, " ").slice(0, 60)}»`);
await conferma.click(); await p.waitForTimeout(900);
const vai = p.getByRole("button", { name: /^Conferma|Confermo tutto|Manda/i }).last();
await vai.click(); await p.waitForTimeout(1800);

ok((await inLinea(pA.id)) === 30, `in linea sono arrivati 30 supplì (${await inLinea(pA.id)})`);
ok((await inLinea(pB.id)) === 30, `e 30 crocchette (${await inLinea(pB.id)})`);
ok((await inLab(pA.id)) === 10, `in laboratorio ne restano 10 (${await inLab(pA.id)})`);
const s2 = await stato();
ok(s2.richieste.every((r) => r.stato !== "in-attesa"),
  `nessuna richiesta è rimasta in attesa (${s2.richieste.filter((r) => r.stato === "in-attesa").length})`);

/* ═══ 5. PRODURRE E MANDARE RESTANO DUE GESTI ═══
   Come in gen-5.84: se «Ho prodotto» facesse partire anche la merce, la
   richiesta risulterebbe evasa senza che nessuno abbia mandato niente. */
console.log("\n— 5. ma segnare una produzione non manda niente da solo —");
const primaLinea = await inLinea(pA.id);
await p.getByRole("button", { name: /Ho prodotto/i }).first().click(); await p.waitForTimeout(700);
await scheda().getByText("Supplì nostrum", { exact: false }).first().click(); await p.waitForTimeout(700);
await scheda().locator("input").first().fill("10");
await p.waitForTimeout(400);
await scheda().getByRole("button", { name: /^Ho prodotto$/ }).last().click();
await p.waitForTimeout(1400);
ok((await inLab(pA.id)) === 20, `in laboratorio sono 20 (${await inLab(pA.id)})`);
ok((await inLinea(pA.id)) === primaLinea,
  `e in linea non è cambiato niente: ${primaLinea} (${await inLinea(pA.id)})`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
