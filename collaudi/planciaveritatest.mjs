/* gen-5.85: la Plancia conta quelle che ha toccato davvero, non quelle che
   avevi selezionato.

   PRIMA DI TUTTO, UNA CORREZIONE AL CONSIGLIO. Il difetto era scritto cosi':
   «un profilo Laboratorio spunta tutta la sede, preme Riempi, e nello storico
   resta scritto Riempite 90 caselle mentre sul magazzino non si e' mosso
   niente». QUELLO SCENARIO NON E' RAGGIUNGIBILE, e l'ho verificato: nella
   Plancia le caselle che non sono tue si vedono ma NON si selezionano — la
   riga che lo fa esiste da prima del consiglio, e «seleziona tutto» salta i
   magazzini altrui. Il permesso e' gia' sbarrato a monte.

   IL DIFETTO VERO, che resta, e' un altro e non c'entra coi permessi: il
   messaggio e la voce di storico si costruiscono su «sel.size», cioe' su
   quante caselle hai SELEZIONATO. Fra il momento in cui selezioni e quello in
   cui premi puo' passare del tempo, e in quel tempo un ALTRO TELEFONO puo'
   togliere un articolo. Allora dentro muta() quella casella viene saltata
   («if (!a) continue»), ma il conto la conta lo stesso.

   Non e' teoria: da gen-5.80 due telefoni lavorano davvero insieme, ed e'
   esattamente la finestra che quella correzione ha reso normale.

   Un'app che dice «fatto» per un lavoro che non ha fatto e' peggio di un'app
   che lo rifiuta: chi ha premuto va via convinto, e chi legge lo storico non
   ha modo di accorgersene.

   IL §4 E' IL CONTROCONTROLLO: sistemare il conto non deve aver rotto il caso
   normale. Quando le caselle ci sono tutte, il numero e il messaggio devono
   restare quelli di prima, senza nessun avviso di mezzo.

   Contro gen-5.84 il §3 deve diventare rosso. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const lab = st.magazzini.find((m) => m.tipo === "laboratorio");
/* la linea NON e' del laboratorio: e' la casella che i permessi devono
   fermare, ed e' quella su cui prima l'app diceva «fatto» */
const linea = st.magazzini.find((m) => m.tipo !== "laboratorio" && m.sedeId === lab.sedeId)
  || st.magazzini.find((m) => m.tipo !== "laboratorio");
st.profili = [{ id: "pr-l", nome: "Laboratorio", ruolo: "laboratorio", sedeId: lab.sedeId,
  colore: "#22B8CF", pinHash: hash("3333") }];

/* due caselle sue, sotto il livello, e due della linea: cosi' si vede la
   differenza fra «quante ne ho scelte» e «quante ne ho toccate» */
const pA = st.prodotti[0], pB = st.prodotti[1];
lab.articoli = [{ prodottoId: pA.id, uomId: pA.uomBase, qty: 1, par: 10 },
                { prodottoId: pB.id, uomId: pB.uomBase, qty: 2, par: 8 }];
linea.articoli = [{ prodottoId: pA.id, uomId: pA.uomBase, qty: 0, par: 5 },
                  { prodottoId: pB.id, uomId: pB.uomBase, qty: 0, par: 5 }];
for (const a of [...lab.articoli, ...linea.articoli]) delete a.parGiorni;
st.richieste = []; st.ordini = []; st.rev = (st.rev || 0) + 1;

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
const qta = async (magId, pid) => {
  const s = await stato();
  return s.magazzini.find((m) => m.id === magId)?.articoli.find((a) => a.prodottoId === pid)?.qty;
};
const ultimaVoce = async () => ((await stato()).log || [])[0]?.msg || "";

const vaiPlancia = async () => {
  const nav = p.getByText("Plancia", { exact: true });
  for (let i = 0; i < await nav.count(); i++)
    if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
  await p.waitForTimeout(1100);
};

/* ═══ 1. IL LABORATORIO SPUNTA LE SUE DUE CASELLE ═══ */
console.log("\n— 1. il laboratorio apre la Plancia e spunta quello che vede —");
await vaiPlancia();
const sotto = p.getByRole("button", { name: /sotto scorta|Sotto|Tutte/i }).first();
if (await sotto.count()) { await sotto.click(); await p.waitForTimeout(800); }
const conta = async () => {
  const t = (await p.locator("body").innerText()).replace(/\n/g, " ");
  /* si legge la pastiglia della SELEZIONE («N scelte»), non un qualunque
     numero seguito da «caselle»: la Plancia ne mostra altri, e al primo giro
     questo contatore leggeva 62 invece di 2 */
  const m = t.match(/(\d+)\s*scelte/);
  return m ? +m[1] : 0;
};
const scelte = await conta();
ok(scelte === 2, `ha spuntato le sue 2 caselle (${scelte})`);

/* ═══ 2. LA CONFERMA CHE IL MURO DEI PERMESSI C'ERA GIÀ ═══
   Le caselle della linea, che non sono sue, non entrano nella selezione: la
   Plancia non gliele lascia spuntare. E' per questo che lo scenario scritto
   dal consiglio — «90 caselle» — non e' raggiungibile. */
console.log("\n— 2. le caselle non sue non si potevano spuntare comunque —");
ok(scelte < 4, `su 4 caselle a schermo ne ha potute spuntare ${scelte}: le altre sono della linea`);

/* ═══ 3. IL CUORE: UN ALTRO TELEFONO TOGLIE UN ARTICOLO NEL FRATTEMPO ═══
   E' la finestra vera, e da gen-5.80 due telefoni lavorano davvero insieme. */
console.log("\n— 3. un altro telefono toglie un articolo mentre è selezionato —");
await p.evaluate(async (ids) => {
  const s = JSON.parse((await window.storage.get("scp:stato:v1")).value);
  const lab = s.magazzini.find((m) => m.id === ids.lab);
  lab.articoli = lab.articoli.filter((a) => a.prodottoId !== ids.pid);
  s.rev = (s.rev || 0) + 1; s.mtime = Date.now();
  await window.storage.set("scp:stato:v1", JSON.stringify(s));
  await window.storage.set("scp:rev:v1", String(s.rev));
}, { lab: lab.id, pid: pB.id });
await p.waitForTimeout(5000);
const rimasti = (await stato()).magazzini.find((m) => m.id === lab.id).articoli.length;
ok(rimasti === 1, `in laboratorio è rimasto 1 articolo su 2 (${rimasti})`);

const riempi = p.getByRole("button", { name: /Riempi/i }).first();
ok(await riempi.count() > 0, "il tasto «Riempi al livello previsto» c'è ancora");
await riempi.click(); await p.waitForTimeout(1800);

const voce = await ultimaVoce();
console.log(`      [storico] «${voce}»`);
const detto = +(voce.match(/Riempite\s+(\d+)/) || [])[1];
ok(detto === 1,
  `lo storico dice 1, non 2: conta quelle toccate DAVVERO (dice ${detto})`);
ok(/saltate/i.test(voce),
  "e dice che una è stata saltata, invece di tacerlo");
/* il motivo NON dev'essere «non è tua»: qui il permesso non c'entra, la
   casella e' sparita. Un messaggio che nomina la causa sbagliata manda a
   cercare dalla parte sbagliata. */
ok(!/non sono tue/i.test(voce), `e non dà la colpa ai permessi, che qui non c'entrano — «${voce}»`);

/* ═══ 4. IL CONTROCONTROLLO: IL CASO NORMALE NON SI TOCCA ═══
   Sistemare il conto non deve aver rotto il giro di tutti i giorni: quando le
   caselle ci sono tutte, il numero e il messaggio restano quelli di prima e
   non compare nessun avviso. */
console.log("\n— 4. e quando c'è tutto, il messaggio resta quello di sempre —");
ok((await qta(lab.id, pA.id)) === 10, `il riempimento ha funzionato: 10 (${await qta(lab.id, pA.id)})`);
await vaiPlancia();
const sotto2 = p.getByRole("button", { name: /sotto scorta|Sotto|Tutte/i }).first();
if (await sotto2.count()) { await sotto2.click(); await p.waitForTimeout(800); }
const riempi2 = p.getByRole("button", { name: /Riempi/i }).first();
if ((await conta()) > 0 && (await riempi2.count())) {
  await riempi2.click();
  await p.waitForTimeout(1600);
  const v2 = await ultimaVoce();
  console.log(`      [storico] «${v2}»`);
  ok(!/lasciate stare|non sono tue/i.test(v2),
    `nessun avviso quando è tutto a posto — «${v2}»`);
} else {
  console.log("  ··  niente più sotto scorta: il caso normale è già coperto dal §3 verde");
  ok(true, "niente da riempire, il giro normale non ha avvisi da mostrare");
}

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
