/* gen-5.94: operatore e laboratorio vedono il lavoro, non la struttura.

   CHIESTO DA VALERIO il 18 agosto: «semplifica la visualizzazione per il
   laboratorio e per gli operatori: quando tutto è a regime questi 2 profili
   dovranno solo vedere quello che devono fare, non dovranno modificare
   magazzini (senza autorizzazione) ma potranno solo utilizzare le loro
   funzionalità essenziali».

   LA LINEA SCELTA (e dichiarata, perché è una scelta e non un fatto):
   · STRUTTURA = la forma del magazzino: aggiungere/modificare/rimuovere
     articoli, soglie, livelli previsti, unità, spostare articoli fra
     magazzini in blocco. Si tocca solo con l'autorizzazione data
     dall'admin sul profilo (interruttore in Profili).
   · LAVORO DI TUTTI I GIORNI = contare, rettificare una giacenza,
     registrare uno scarto, trasferire scorte, produrre, evadere,
     ricevere. Resta a tutti, come prima.
   Misurato prima di correggere: il laboratorio aveva TUTTA la superficie
   strutturale sul suo magazzino (permesso «pieno»), e la Plancia offriva
   Soglie/Unità/Sposta/Rimuovi a ogni ruolo, senza nessun cancello.

   Contro gen-5.92 i §1, §2, §4 e §6 devono essere rossi. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const LAB = base.sedi.find((x) => x.tipo === "laboratorio");
const FM = base.sedi.find((x) => x.tipo === "operatore");
const magLab = base.magazzini.find((m) => m.tipo === "laboratorio");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length > 0);
if (!magLab || !linea) throw new Error("banco povero: mancano magazzino lab o linea con articoli");
/* DUE COSE CHE IL BANCO NON AVEVA, misurate al primo giro rosso:
   · il magazzino laboratorio del seme è VUOTO (0 articoli): senza righe non
     esistono matite, scarti o rettifiche da controllare — si semina;
   · «preparato» nell'app vuol dire p.preparato (la spunta «lo fa il
     laboratorio»), non l'unità di lavorazione, che ce l'hanno tutti. */
const semina = base.prodotti.slice(0, 4);
base.prodotti[0].preparato = true;
magLab.articoli = semina.map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 5, par: 8 }));
const preparatoInLab = true;

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (profili, nome, pin) => {
  const st = JSON.parse(JSON.stringify(base));
  st.profili = profili; st.richieste = st.richieste || [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript((j) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(st));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(140); }
  await p.waitForTimeout(1500);
  return { p, ctx };
};
/* DAL 30 AGOSTO (gen-5.95) le CORREZIONI sono un interruttore a parte:
   questo collaudo prova il confine della STRUTTURA, quindi i suoi profili
   hanno le correzioni accese — il pavimento del mestiere puro (tutto
   spento) lo difende autorizzazionitest.mjs. E' lo stesso spostamento di
   linea, deciso da Valerio, che gen-5.95 dichiara nel proprio header. */
const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  op: { id: "pr-o", nome: "Op", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], correzioni: true, pinHash: hash("2222") },
  lab: { id: "pr-l", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id, colore: "#22B8CF",
    correzioni: true, pinHash: hash("3333") },
  labAut: { id: "pr-l2", nome: "LabPro", ruolo: "laboratorio", sedeId: LAB.id, colore: "#22B8CF",
    struttura: true, pinHash: hash("3333") },
};
const nomeProd = (pid) => base.prodotti.find((x) => x.id === pid)?.nome || "—";
const primoLab = nomeProd(magLab.articoli[0].prodottoId);
const primoLinea = nomeProd(linea.articoli[0].prodottoId);
const vede = async (p, sel) => (await p.locator(sel).count()) > 0;
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");

const apriDettaglio = async (p, nomeMag) => {
  await vaiA(p, "Magazzini");
  await p.getByText(nomeMag, { exact: true }).first().click();
  await p.waitForTimeout(1100);
};
const controllaDettaglio = async (p, { strutturale }) => {
  const t = await testoDi(p);
  ok(/Gestione rapida/.test(t) === strutturale,
    strutturale ? "«Gestione rapida» c'è (autorizzato)" : "niente «Gestione rapida»");
  ok(/Aggiungi articolo/.test(t) === strutturale,
    strutturale ? "«Aggiungi articolo» c'è" : "niente «Aggiungi articolo»");
  ok((await vede(p, 'main button[aria-label^="Modifica "]')) === strutturale,
    strutturale ? "la matita di modifica articolo c'è" : "niente matita di modifica articolo");
  ok((await vede(p, 'main button[aria-label^="Rimuovi "]')) === strutturale,
    strutturale ? "il cestino c'è" : "niente cestino");
};
const controllaOperative = async (p) => {
  ok(await vede(p, 'main button[aria-label^="Scarto "]'), "lo scarto resta");
  ok(await vede(p, 'main button[aria-label^="Rettifica "]'), "la rettifica della giacenza resta");
  ok(/Trasferisci scorte/.test(await testoDi(p)), "il trasferimento scorte resta");
  if (preparatoInLab) ok(await vede(p, 'main button[aria-label^="Ho prodotto "]'), "e «Ho prodotto» resta");
};
const controllaPlancia = async (p, { strutturale, mag, primoNome }) => {
  await vaiA(p, "Plancia");
  await p.getByText("Caselle", { exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1100);
  /* i comandi in blocco compaiono SOLO con una selezione (misurato: la
     barra sta dentro «sel.size > 0»). E il magazzino di partenza non e'
     detto che sia quello giusto (per l'operatore e' il primo della sede,
     che puo' essere un retro): la tendina si trova cercando fra i select
     quello che OFFRE il nome del magazzino, perche' getByLabel sul
     Selettore torna zero — misurato, non dedotto. */
  const sels = p.locator("select");
  const nSel = await sels.count();
  for (let i = 0; i < nSel; i++) {
    const etichette = await sels.nth(i).locator("option").allTextContents();
    if (etichette.includes(mag.nome)) { await sels.nth(i).selectOption({ label: mag.nome }); break; }
  }
  await p.waitForTimeout(900);
  await p.getByRole("button", { name: new RegExp(primoNome) }).first().click();
  await p.waitForTimeout(900);
  /* bersagli ESATTI: /Riempi/ nel testo combaciava con «Riempimento medio»
     e il controllo era verde a vuoto. I gruppi sono bottoni con quel nome
     esatto e basta. */
  ok(await p.getByRole("button", { name: "Riempi", exact: true }).count() > 0,
    "i comandi sulle QUANTITÀ ci sono (Riempi)");
  ok((await p.getByRole("button", { name: "Soglie", exact: true }).count() > 0) === strutturale,
    strutturale ? "il gruppo «Soglie» c'è (autorizzato)" : "niente gruppo «Soglie»");
  ok((await p.getByRole("button", { name: "Articoli", exact: true }).count() > 0) === strutturale,
    strutturale ? "il gruppo «Articoli» c'è" : "niente gruppo «Articoli» (Unità/Sposta/Rimuovi)");
};

/* ═══ 1. IL LABORATORIO SENZA AUTORIZZAZIONE: LAVORA, NON RISTRUTTURA ═══ */
console.log("\n— 1. laboratorio senza autorizzazione: il suo magazzino si usa, non si ristruttura —");
const L = await apri([PR.lab], "Lab", "3333");
await apriDettaglio(L.p, magLab.nome);
await controllaDettaglio(L.p, { strutturale: false });
await controllaOperative(L.p);

/* ═══ 2. E IN PLANCIA VEDE LE QUANTITÀ, NON LA STRUTTURA ═══ */
console.log("\n— 2. e in Plancia vede le quantità, non la struttura —");
await L.p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
await L.p.waitForTimeout(500);
await controllaPlancia(L.p, { strutturale: false, mag: magLab, primoNome: primoLab });
await L.ctx.close();

/* ═══ 3. IL CONTROCONTROLLO: CON L'AUTORIZZAZIONE TORNA TUTTO ═══
   Se questo diventa rosso, ho tolto la funzione invece di metterle un
   interruttore: non è quello che è stato chiesto. */
console.log("\n— 3. con l'autorizzazione dell'admin torna tutto —");
const A2 = await apri([PR.labAut], "LabPro", "3333");
await apriDettaglio(A2.p, magLab.nome);
await controllaDettaglio(A2.p, { strutturale: true });
await A2.p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
await A2.p.waitForTimeout(500);
await controllaPlancia(A2.p, { strutturale: true, mag: magLab, primoNome: primoLab });
await A2.ctx.close();

/* ═══ 4. L'OPERATORE: STESSO PRINCIPIO ═══ */
console.log("\n— 4. l'operatore: conta e corregge, non ristruttura —");
const O = await apri([PR.op], "Op", "2222");
await apriDettaglio(O.p, linea.nome);
ok(!/Gestione rapida/.test(await testoDi(O.p)), "niente «Gestione rapida» (com'era già)");
ok(await vede(O.p, 'main button[aria-label^="Rettifica "]'), "la rettifica resta");
await O.p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
await O.p.waitForTimeout(500);
await controllaPlancia(O.p, { strutturale: false, mag: linea, primoNome: primoLinea });
await O.ctx.close();

/* ═══ 5. L'ADMIN NON CAMBIA DI UNA VIRGOLA ═══ */
console.log("\n— 5. l'admin non cambia di una virgola —");
const A = await apri([PR.admin], "Admin", "1234");
await apriDettaglio(A.p, magLab.nome);
await controllaDettaglio(A.p, { strutturale: true });
await A.p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
await A.p.waitForTimeout(500);
await controllaPlancia(A.p, { strutturale: true, mag: magLab, primoNome: primoLab });

/* ═══ 6. L'INTERRUTTORE STA IN PROFILI, E SCRIVE DAVVERO ═══ */
console.log("\n— 6. l'interruttore dell'autorizzazione sta in Profili e scrive davvero —");
await vaiA(A.p, "Profili");
await A.p.waitForTimeout(600);
/* basta il form del nuovo profilo, che è lo stesso identico form della
   modifica; l'interruttore riguarda i ruoli non-admin, quindi si sceglie
   prima il ruolo operatore */
await A.p.getByRole("button", { name: /Nuovo profilo/ }).first().click();
await A.p.waitForTimeout(900);
await A.p.getByText("Operatore", { exact: true }).last().click().catch(() => {});
await A.p.waitForTimeout(400);
const formTesto = await testoDi(A.p);
ok(/struttura dei magazzini/i.test(formTesto),
  "il form del profilo ha l'interruttore «può modificare la struttura dei magazzini»");
await A.ctx.close();

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
