/* gen-5.81: un salvataggio che arriva ma non risponde non viene contato due volte.

   IL DIFETTO. Il telefono manda la modifica, il server la registra, e la
   risposta si perde per strada — succede quando il segnale cade proprio in
   quel mezzo secondo. Il telefono non sa che e' andata a buon fine, quindi
   rimanda. La coda non si svuota mai prima della conferma, ed e' giusto
   cosi': e' quello che il 4 agosto ha permesso di non perdere il lavoro
   quando due telefoni salvano insieme. Ma vuol dire che la stessa modifica
   viene riapplicata su uno stato che gia' la contiene.

   Per le modifiche «metti a 7» non cambia niente: sette resta sette. Per
   quelle «aggiungi 3» invece si somma due volte. «Ho prodotto 3 teglie»
   diventa sei teglie in magazzino, e nello storico dei movimenti compaiono
   due righe di carico per una produzione sola.

   Non e' nato con la correzione del 4 agosto: c'era da prima. Si e' visto
   guardando dentro quel pezzo.

   LA CORREZIONE. Ogni modifica ha gia' un nome (logId). Adesso lo stato
   tiene l'elenco di quelle gia' registrate, e una modifica il cui nome e'
   gia' li' dentro non si riapplica.

   IL §4 E' IL CONTROCONTROLLO, ed e' quello che tiene in piedi tutto il
   resto. Saltare le modifiche gia' viste e' pericoloso in un modo preciso:
   se il salvataggio NON fosse arrivato e la saltassi lo stesso, il lavoro
   sparirebbe — cioe' avrei creato il difetto che ad agosto ho appena
   chiuso. Il §4 stacca la rete davvero e pretende che la modifica arrivi.

   Contro gen-5.80 il §2 e il §3 devono diventare rossi. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const CHIAVE = "scp:stato:v1", CHIAVE_REV = "scp:rev:v1";
const dormi = (ms) => new Promise((r) => setTimeout(r, ms));

/* ═══ IL SERVER FINTO, CHE SA ANCHE PERDERE LE RISPOSTE ═══
   «inghiotti» e' il caso che conta: la scrittura viene REGISTRATA come nella
   realta', ma al telefono si risponde di no. E' esattamente quello che fa la
   rete quando cade dopo che il pacchetto e' gia' passato. */
const negozio = new Map();
let inghiotti = 0, scritteDavvero = 0, risposteNegate = 0, muro = false;
const revInRete = () => { try { return JSON.parse(negozio.get(CHIAVE)).rev || 0; } catch { return 0; } };
const servSet = (k, v) => {
  if (k !== CHIAVE) { if (muro) return false; negozio.set(k, v); return true; }
  if (muro) return false;                       // rete staccata: non arriva niente
  let atteso = null;
  try { atteso = JSON.parse(v).revBase; } catch {}
  if (atteso != null && negozio.has(CHIAVE) && revInRete() !== atteso) return false;
  negozio.set(k, v); scritteDavvero++;
  if (inghiotti > 0) { inghiotti--; risposteNegate++; return false; }
  return true;
};
const stat = () => JSON.parse(negozio.get(CHIAVE));

/* ═══ LO STATO DI PARTENZA: UN PREPARATO CON LA SUA RICETTA ═══ */
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const lab = st.magazzini.find((m) => m.tipo === "laboratorio");
st.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
const pFatto = st.prodotti[0]; pFatto.nome = "Breccole";
pFatto.preparato = true; pFatto.soloInteri = false; delete pFatto.uomLavorazione;
const pIngr = st.prodotti[5]; pIngr.nome = "Farina 00";
pIngr.preparato = false;
/* uomResa non e' un dettaglio: senza, l'app dice «manca la conversione fra
   l'unita' del magazzino e quella della ricetta» e non scala niente */
pFatto.ricetta = { resa: 10, uomResa: pFatto.uomBase,
  ingredienti: [{ prodottoId: pIngr.id, uomId: pIngr.uomBase, qty: 2 }] };
lab.articoli = [{ prodottoId: pFatto.id, uomId: pFatto.uomBase, qty: 0, par: 0 },
                { prodottoId: pIngr.id, uomId: pIngr.uomBase, qty: 100, par: 0 }];
st.richieste = []; st.ordini = []; st.movimenti = []; st.rev = 500;
negozio.set(CHIAVE, JSON.stringify(st));
negozio.set(CHIAVE_REV, "500");

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const p = await b.newPage({ viewport: { width: 1280, height: 950 } });
p.on("pageerror", (e) => errs.push(e.message));
await p.exposeFunction("__srvGet", (k) => (muro ? null : (negozio.has(k) ? { value: negozio.get(k) } : null)));
await p.exposeFunction("__srvSet", (k, v) => servSet(k, v));
await p.exposeFunction("__srvDel", (k) => { negozio.delete(k); return true; });
await p.addInitScript(() => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  window.storage = {
    async get(k) { return await window.__srvGet(k); },
    async set(k, v) { return await window.__srvSet(k, v); },
    async delete(k) { return await window.__srvDel(k); },
  };
});
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);

const qtaDi = (s, pid) => s.magazzini.find((m) => m.tipo === "laboratorio")
  .articoli.find((a) => a.prodottoId === pid)?.qty;
const carichiDi = (s, pid) => (s.movimenti || [])
  .filter((mv) => mv.prodottoId === pid && mv.causale === "produzione" && mv.delta > 0).length;

/* Il dettaglio del magazzino e' un foglio che copre tutto: finche' resta
   aperto, il menu' sotto non si puo' toccare. Va chiuso prima di rinavigare,
   se no il secondo giro fallisce per un motivo che non c'entra niente con
   quello che questo collaudo deve dire. */
const chiudiFogli = async () => {
  for (let i = 0; i < 4; i++) {
    if (!(await p.locator(".sc-foglio").count())) return;
    const x = p.locator(".sc-foglio").last().getByRole("button", { name: "Chiudi" });
    if (await x.count()) await x.first().click().catch(() => {});
    else await p.keyboard.press("Escape");
    await p.waitForTimeout(400);
  }
};

/* apre «Ho prodotto» sul preparato, in laboratorio */
const hoProdotto = async (quanto) => {
  await chiudiFogli();
  const nav = p.getByText("Magazzini", { exact: true });
  for (let i = 0; i < await nav.count(); i++)
    if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
  await p.waitForTimeout(700);
  await p.getByText(lab.nome, { exact: false }).first().click(); await p.waitForTimeout(800);
  await p.getByRole("button", { name: new RegExp("Ho prodotto " + pFatto.nome) }).first().click();
  await p.waitForTimeout(700);
  /* il campo e' type=text con inputmode=decimal, non uno spinbutton: sul
     telefono deve uscire la tastiera coi numeri senza le frecce su/giu' */
  await p.locator(".sc-foglio input").last().fill(String(quanto));
  await p.waitForTimeout(300);
  await p.getByRole("button", { name: /^Ho prodotto$/ }).click();
};

/* ═══ 1. IL GIRO NORMALE FUNZIONA ═══ */
console.log("\n— 1. con la rete che risponde, tre teglie sono tre —");
await hoProdotto(3);
await dormi(2200);
ok(qtaDi(stat(), pFatto.id) === 3, `in rete ci sono 3 teglie (${qtaDi(stat(), pFatto.id)})`);
ok(carichiDi(stat(), pFatto.id) === 1, `e una sola riga di carico nello storico (${carichiDi(stat(), pFatto.id)})`);
ok(qtaDi(stat(), pIngr.id) === 99.4,
  `e la farina e' scalata una volta sola: 100 - 0,6 = 99,4 (${qtaDi(stat(), pIngr.id)})`);

/* ═══ 2. LA RISPOSTA SI PERDE: IL SALVATAGGIO È ARRIVATO LO STESSO ═══ */
console.log("\n— 2. la risposta si perde per strada, ma la scrittura era arrivata —");
const primaScritte = scritteDavvero;
inghiotti = 1;                                   // la prossima si registra e risponde di no
await hoProdotto(3);
await dormi(4000);
ok(risposteNegate === 1, `il server ha registrato e non ha risposto, una volta (${risposteNegate})`);
ok(scritteDavvero > primaScritte, `la scrittura era arrivata davvero (${scritteDavvero - primaScritte} scritture)`);

/* ═══ 3. IL CUORE: NON SI CONTA DUE VOLTE ═══ */
console.log("\n— 3. e le tre teglie restano tre, non diventano sei —");
const dopo = stat();
ok(qtaDi(dopo, pFatto.id) === 6,
  `in magazzino ci sono 6 teglie: 3 di prima + 3 di adesso (${qtaDi(dopo, pFatto.id)})`);
ok(carichiDi(dopo, pFatto.id) === 2,
  `e due righe di carico in tutto, una per produzione (${carichiDi(dopo, pFatto.id)})`);
ok(Math.abs(qtaDi(dopo, pIngr.id) - 98.8) < 1e-6,
  `e la farina e' scalata due volte in tutto, non tre: 98,8 (${qtaDi(dopo, pIngr.id)})`);

/* ═══ 4. IL CONTROCONTROLLO: SE NON È ARRIVATA, NON SI PERDE ═══
   Saltare le modifiche gia' viste e' pericoloso in un modo preciso: se lo
   facessi anche quando il salvataggio NON e' arrivato, il lavoro sparirebbe.
   Qui la rete si stacca DAVVERO — niente viene registrato — e poi torna. */
console.log("\n— 4. se invece la rete cade sul serio, il lavoro non si perde —");
const primaDelMuro = qtaDi(stat(), pFatto.id);
muro = true;
await hoProdotto(5);
await dormi(2500);
ok(qtaDi(stat(), pFatto.id) === primaDelMuro,
  `col muro alzato in rete non e' cambiato niente (${qtaDi(stat(), pFatto.id)})`);
muro = false;
await dormi(6000);
ok(qtaDi(stat(), pFatto.id) === primaDelMuro + 5,
  `e appena la rete torna le 5 teglie arrivano: ${primaDelMuro} + 5 = ${qtaDi(stat(), pFatto.id)}`);
ok(carichiDi(stat(), pFatto.id) === 3,
  `con la sua riga di carico, una sola (${carichiDi(stat(), pFatto.id)})`);

/* ═══ 5. L'ELENCO DELLE MODIFICHE GIÀ VISTE NON CRESCE ALL'INFINITO ═══
   Lo stato viaggia intero a ogni scrittura: un elenco che non si accorcia
   diventerebbe il peso che a gen-5.77 abbiamo appena tolto. */
console.log("\n— 5. l'elenco delle modifiche registrate ha un tetto —");
const fine = stat();
const app = Array.isArray(fine.applicate) ? fine.applicate : null;
ok(!!app, "lo stato tiene l'elenco delle modifiche gia' registrate");
ok(!!app && app.length <= 300, `e non supera le 300 voci (${app ? app.length : "non c'e'"})`);
ok(!!app && new Set(app).size === app.length, "senza doppioni dentro");

console.log(`\nscritture registrate: ${scritteDavvero}, risposte negate: ${risposteNegate}`);
console.log("errori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
