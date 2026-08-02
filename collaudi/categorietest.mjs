/* gen-5.73: «Da mandare adesso» esce diviso per categoria, laboratorio compreso.

   Nasce da una segnalazione, con le sue parole: «nella schermata dell'ordine da
   copia incollare mi serve che anche al laboratorio i prodotti siano divisi per
   categoria senza che vengano mischiati tutti insieme, almeno anche loro sono
   facilitati nella lettura».

   Aveva ragione due volte. Il «Report ordine» raggruppava per categoria da
   sempre; questo testo — che e' quello che si manda davvero su WhatsApp — no.
   La stessa persona si trovava in mano due elenchi fatti in due modi diversi a
   seconda del tasto premuto. Percio' qui va per categoria TUTTO, non solo il
   blocco chiesto: sistemarne uno e lasciare l'altro sarebbe stato spostare
   l'incoerenza, non toglierla.

   Il controllo che conta e' il §2: non basta che le intestazioni ci siano,
   bisogna che sotto ognuna ci stiano SOLO i prodotti di quella categoria e
   tutti insieme. «Diviso per categoria» con un prodotto fuori posto e' peggio
   di un elenco piatto, perche' chi legge si fida. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
st.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
const sede = st.sedi.find((s) => s.tipo === "operatore");
const lab = st.sedi.find((s) => s.tipo === "laboratorio");
const forn = st.fornitori[0];

/* due categorie ben popolate, e due prodotti per ognuna: e' il minimo per
   accorgersi se qualcosa finisce nel gruppo sbagliato */
const catA = st.categorie[0], catB = st.categorie[2];
const diCat = (c) => st.prodotti.filter((p) => p.categoriaId === c.id);
const [a1, a2] = diCat(catA).slice(0, 2);
const [b1, b2] = diCat(catB).slice(0, 2);
/* e uno senza categoria: quello che non si vede in un ordine e' quello che poi
   manca in cucina, quindi non deve sparire — deve finire in fondo, dichiarato */
const orfano = st.prodotti.find((p) => ![a1, a2, b1, b2].includes(p) && p.categoriaId);
orfano.categoriaId = null;

st.ordini = [];
st.richieste = [];
/* AI FORNITORI: uno per categoria, piu' l'orfano, in ordine sparso apposta */
for (const [i, p] of [b1, a1, orfano, b2, a2].entries())
  st.ordini.push({ id: "o" + i, t: Date.now(), tipo: "diretto", sedeId: sede.id,
    prodottoId: p.id, fornitoreId: forn.id, qty: 3 + i, uomId: p.uomBase, stato: "da-ordinare" });
/* AL LABORATORIO: due categorie, anche qui in ordine sparso */
for (const [i, p] of [b1, a2, a1].entries())
  st.richieste.push({ id: "r" + i, t: Date.now(), stato: "in-attesa", daSedeId: sede.id,
    aSedeLabId: lab.id, prodottoId: p.id, qty: 2 + i, uomId: p.uomBase, magNome: "Linea" });
st.rev = (st.rev || 0) + 1;

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
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
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);
const nav = p.getByText("Ordini", { exact: true }); const n = await nav.count();
for (let i = 0; i < n; i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(700);
await p.getByRole("button", { name: /^Vedi il testo$/ }).first().click();
await p.waitForTimeout(600);
/* la textarea contiene ESATTAMENTE quello che finisce negli appunti e su
   WhatsApp: i tasti «Copia» e «WhatsApp» mandano quella stessa stringa */
const testo = await p.locator("textarea").first().inputValue();
const righe = testo.split("\n");

/* ═══ 1. LE INTESTAZIONI CI SONO, IN TUTTI E DUE I BLOCCHI ═══ */
console.log("\n— 1. le categorie compaiono anche sotto AL LABORATORIO —");
const iLab = righe.indexOf("AL LABORATORIO");
const iForn = righe.indexOf(forn.nome.toUpperCase());
ok(iLab >= 0, "il blocco «AL LABORATORIO» c'e'");
ok(iForn > iLab, `e sotto c'e' quello del fornitore «${forn.nome}»`);
const bloccoLab = righe.slice(iLab + 1, iForn);
const bloccoForn = righe.slice(iForn + 1);
for (const [nome, blocco] of [["laboratorio", bloccoLab], ["fornitore", bloccoForn]])
  for (const c of [catA, catB])
    ok(blocco.includes("· " + c.nome),
      `nel blocco del ${nome} c'e' l'intestazione «${c.nome}»`);

/* ═══ 2. SOTTO OGNI INTESTAZIONE SOLO LA SUA ROBA, E TUTTA INSIEME ═══
   E' il controllo vero: «diviso per categoria» con un prodotto fuori posto e'
   peggio di un elenco piatto, perche' chi legge si fida. */
console.log("\n— 2. e sotto ognuna ci sta solo la sua roba —");
const catDi = (nomeProd) => {
  const pr = st.prodotti.find((x) => x.nome === nomeProd);
  return pr ? (st.categorie.find((c) => c.id === pr.categoriaId)?.nome || "Senza categoria") : "?";
};
for (const [nome, blocco] of [["laboratorio", bloccoLab], ["fornitore", bloccoForn]]) {
  let corrente = null; const sbagliati = [];
  for (const r of blocco) {
    if (r.startsWith("· ")) { corrente = r.slice(2); continue; }
    if (!r.startsWith("- ")) continue;
    const nomeProd = r.slice(2, r.lastIndexOf(":"));
    if (catDi(nomeProd) !== corrente) sbagliati.push(`${nomeProd} sotto «${corrente}» invece che «${catDi(nomeProd)}»`);
  }
  ok(sbagliati.length === 0,
    `${nome}: ogni prodotto sta sotto la sua categoria` + (sbagliati.length ? " — " + sbagliati.join(" · ") : ""));
  const intest = blocco.filter((r) => r.startsWith("· "));
  ok(new Set(intest).size === intest.length,
    `${nome}: nessuna categoria compare due volte — sono raggruppate, non solo etichettate`);
}

/* ═══ 3. QUELLO CHE NON HA CATEGORIA NON SPARISCE ═══ */
console.log("\n— 3. chi non ha categoria finisce in fondo, non nel nulla —");
ok(bloccoForn.includes("· Senza categoria"),
  "c'e' l'intestazione «Senza categoria» per chi non ne ha una");
ok(testo.includes(orfano.nome),
  `e «${orfano.nome}» e' ancora nell'ordine: quello che sparisce da un ordine e' quello che poi manca in cucina`);
const intestForn = bloccoForn.filter((r) => r.startsWith("· "));
ok(intestForn[intestForn.length - 1] === "· Senza categoria",
  "e sta in fondo, dopo le categorie vere — non in mezzo");

/* ═══ 4. DENTRO UNA CATEGORIA, IN ORDINE ALFABETICO ═══ */
console.log("\n— 4. dentro ogni categoria, in ordine alfabetico —");
let fuoriOrdine = [];
let cur = null, ultimi = [];
for (const r of [...bloccoLab, "· FINE"]) {
  if (r.startsWith("· ")) {
    const ordinati = [...ultimi].sort((x, y) => x.localeCompare(y));
    if (JSON.stringify(ultimi) !== JSON.stringify(ordinati)) fuoriOrdine.push(cur);
    cur = r.slice(2); ultimi = []; continue;
  }
  if (r.startsWith("- ")) ultimi.push(r.slice(2, r.lastIndexOf(":")));
}
ok(fuoriOrdine.length === 0,
  "i prodotti dentro ogni categoria sono in ordine alfabetico"
  + (fuoriOrdine.length ? " — fuori ordine: " + fuoriOrdine.join(", ") : ""));

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
