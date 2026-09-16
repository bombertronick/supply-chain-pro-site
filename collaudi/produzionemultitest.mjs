/* SEGNALATO DA VALERIO, urgente: «serve poter confermare la preparazione dei
   prodotti che vengono lavorati con piu' prodotti nel laboratorio».

   Il banco di prova NON e' inventato: ricalca la forma esatta di una delle due
   ricette che ha scritto lui in produzione oggi — «Pollo cacciatora», base
   GN 1/6, resa 1 GN 1/6, tre ingredienti presi da tre unita' diverse (kg, pz,
   conf), tutti dentro il magazzino del laboratorio. Un banco di prova
   comodo direbbe di si' a un'app che in cucina dice di no.

   Cosa deve succedere: il laboratorio apre «Ho prodotto», scrive quanto ne ha
   fatto, VEDE prima di confermare cosa esce e da dove, e confermando trova
   TUTTI E TRE gli ingredienti scalati in proporzione.

   Il §5 e' il controcontrollo e vale piu' del resto: la proporzione. Fare il
   doppio deve consumare il doppio. Un'app che scala sempre la dose della
   ricetta indipendentemente da quanto hai fatto e' peggio di una che non
   scala niente, perche' il magazzino sembra giusto e non lo e'. */
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
const uConf = st.unita.find((u) => u.simbolo === "conf") || st.unita.find((u) => /conf/i.test(u.nome || ""));
const uGn = st.unita.find((u) => /GN/i.test(u.simbolo)) || uKg;
for (const [n, u] of [["kg", uKg], ["pz", uPz], ["conf", uConf], ["GN", uGn]])
  if (!u) throw new Error(`banco di prova rotto: manca l'unità «${n}»`);

/* il preparato e i suoi tre ingredienti, come li ha scritti lui */
const [prep, iPollo, iRosm, iOlive] = st.prodotti;
prep.nome = "Pollo cacciatora"; prep.preparato = true; delete prep.soloInteri;
prep.uomBase = uGn.id; prep.conv = { [uKg.id]: 1 }; delete prep.convStim;
prep.ricetta = { resa: 1, uomResa: uGn.id, ingredienti: [
  { prodottoId: iPollo.id, qty: 0.5, uomId: uKg.id },
  { prodottoId: iRosm.id,  qty: 0.5, uomId: uPz.id },
  { prodottoId: iOlive.id, qty: 0.3, uomId: uConf.id },
]};
iPollo.nome = "Pollo"; iPollo.uomBase = uKg.id; iPollo.conv = {}; delete iPollo.preparato; delete iPollo.convStim;
iRosm.nome = "Rosmarino"; iRosm.uomBase = uPz.id; iRosm.conv = {}; delete iRosm.preparato; delete iRosm.convStim;
iOlive.nome = "Olive leccino"; iOlive.uomBase = uConf.id; iOlive.conv = { [uKg.id]: 1 };
delete iOlive.preparato; delete iOlive.convStim;

/* tutto dentro il magazzino del laboratorio, come in produzione */
lab.articoli = [
  { prodottoId: prep.id,   uomId: uGn.id,   qty: 0,  par: 0 },
  { prodottoId: iPollo.id, uomId: uKg.id,   qty: 10, par: 0 },
  { prodottoId: iRosm.id,  uomId: uPz.id,   qty: 20, par: 0 },
  { prodottoId: iOlive.id, uomId: uConf.id, qty: 5,  par: 0 },
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

/* ═══ 1. IL LABORATORIO ARRIVA A «HO PRODOTTO» SENZA CHE NESSUNO GLIELO CHIEDA ═══
   E' il punto: si produce anche per rifare la scorta, non solo per evadere una
   richiesta. Se l'unica strada passasse da una richiesta in attesa, il lavoro
   di tutti i giorni resterebbe fuori. */
console.log("\n— 1. il laboratorio apre il suo magazzino e trova «Ho prodotto» —");
const nav = p.getByText("Magazzini", { exact: true });
for (let i = 0; i < await nav.count(); i++)
  if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
await p.waitForTimeout(900);
await p.getByText(lab.nome, { exact: true }).first().click(); await p.waitForTimeout(900);
const tasto = p.getByRole("button", { name: /Ho prodotto Pollo cacciatora/i }).first();
ok(await tasto.count() > 0, "il tasto «Ho prodotto» c'è sulla riga del preparato");
await tasto.click(); await p.waitForTimeout(800);
ok(await p.getByText(/Ho prodotto · Pollo cacciatora/).count() > 0, "e apre la scheda della produzione");

/* ═══ 2. LA RICETTA SI VEDE PRIMA DI CONFERMARE ═══ */
console.log("\n— 2. dice che c'è una ricetta, non «nessuna ricetta impostata» —");
const scheda = () => p.locator(".sc-foglio").last();
const testo1 = (await scheda().innerText()).replace(/\s+/g, " ");
ok(/La ricetta ne fa/.test(testo1),
  `riconosce la ricetta — «${(testo1.match(/La ricetta[^.]*\.|Nessuna ricetta[^.]*\./) || ["niente"])[0]}»`);

/* ═══ 3. SCRIVENDO LA QUANTITÀ SI VEDE COSA ESCE, E DA DOVE ═══
   Prima che i numeri si muovano. Un automatismo che scala di nascosto è
   indistinguibile da un errore. */
console.log("\n— 3. scrivo «2» e mi dice cosa esce dai magazzini —");
await scheda().locator("input").last().fill("2");
await p.waitForTimeout(500);
const testo2 = (await scheda().innerText()).replace(/\s+/g, " ");
ok(/Esce dai magazzini/.test(testo2), "compare il riquadro «Esce dai magazzini»");
for (const nome of ["Pollo", "Rosmarino", "Olive leccino"])
  ok(new RegExp(nome).test(testo2), `c'è «${nome}» fra quelli che escono`);
ok(/da «/.test(testo2), "e dice da quale magazzino esce");

/* ═══ 4. CONFERMANDO, TUTTI E TRE GLI INGREDIENTI SI SCALANO ═══ */
console.log("\n— 4. confermo, e i tre ingredienti calano davvero —");
await scheda().getByRole("button", { name: /^Ho prodotto$/ }).last().click();
await p.waitForTimeout(1500);
const fatti = await qta(prep.id);
ok(fatti === 2, `in laboratorio ci sono 2 GN di Pollo cacciatora (${fatti})`);
/* 2 volte la ricetta: 1 kg di pollo, 1 pz di rosmarino, 0,6 conf di olive */
const pollo = await qta(iPollo.id), rosm = await qta(iRosm.id), olive = await qta(iOlive.id);
ok(pollo === 9, `il pollo è sceso da 10 a 9 (${pollo})`);
ok(rosm === 19, `il rosmarino da 20 a 19 (${rosm})`);
ok(Math.abs(olive - 4.4) < 1e-6, `le olive da 5 a 4,4 (${olive})`);

/* ═══ 5. IL CONTROCONTROLLO: LA PROPORZIONE ═══
   Fare il doppio deve consumare il doppio. Se la quantita' prodotta non
   entrasse nel conto, questi numeri sarebbero gli stessi del §4 — il magazzino
   sembrerebbe giusto senza esserlo, che e' il modo peggiore di sbagliare. */
console.log("\n— 5. e rifacendone il doppio, consuma il doppio —");
await p.getByRole("button", { name: /Ho prodotto Pollo cacciatora/i }).first().click();
await p.waitForTimeout(800);
await scheda().locator("input").last().fill("4");
await p.waitForTimeout(500);
await scheda().getByRole("button", { name: /^Ho prodotto$/ }).last().click();
await p.waitForTimeout(1500);
const pollo2 = await qta(iPollo.id);
ok(pollo2 === 7, `il pollo è sceso di 2 kg, non ancora di 1: 9 → 7 (${pollo2})`);
ok((await qta(prep.id)) === 6, `e i GN prodotti sono 6 in tutto (${await qta(prep.id)})`);

/* ═══ 6. LO STORICO DICE CHE È STATA UNA PRODUZIONE, NON UNA RETTIFICA ═══
   Chi legge il magazzino domani deve poter distinguere «l'abbiamo fatto» da
   «qualcuno ha corretto il numero». */
console.log("\n— 6. e nello storico resta scritto che è stata una produzione —");
const s = await stato();
const mov = (s.movimenti || []).filter((m) => m.causale === "produzione");
const cons = (s.movimenti || []).filter((m) => m.causale === "consumo");
ok(mov.length === 2, `due movimenti di produzione (${mov.length})`);
ok(cons.length === 6, `e sei di consumo, tre per ogni volta (${cons.length})`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
