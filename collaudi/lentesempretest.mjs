/* gen-5.72: la lente si raggiunge SEMPRE, anche con una scheda aperta.

   Da dove nasce. In gen-5.70 avevo scritto, nel commento della ricerca, che
   quella lente era «raggiungibile da ogni schermata». Collaudando gen-5.71 ho
   scoperto che non era vero: il magazzino, la scheda di un prodotto, un modulo
   — sono tutti Foglio, cioe' <div class="fixed inset-0 z-50">, e coprono
   l'intestazione dove la lente sta. Per cercare qualcosa bisognava prima
   chiudere quello che si stava facendo. «Da ovunque» era una parola di troppo,
   e l'ho scritto nella roadmap invece di nasconderlo.

   La correzione e' di due pezzi, e il secondo e' quello che conta:

     1. la lente sale a z 60: sopra i fogli (50), sotto il tutorial (80);

     2. quando la lente ti porta da qualche parte, quello che avevi aperto si
        chiude. Senza questo, saltare a una funzione della sezione in cui sei
        gia' non cambiava la chiave del contenuto: la scheda restava davanti e
        sembrava che il tocco fosse andato a vuoto. Una promessa mantenuta a
        meta' e' peggio di una non fatta — ed e' il §4 qui sotto.

   Il §5 e' la lezione del 31 luglio applicata a questa modifica: alzare un
   elemento sopra gli altri e' esattamente il gesto che quella volta ha reso
   impremibili tre tasti su sei. Quindi non basta che la lente si prenda il
   tocco: bisogna anche che non lo rubi a nessun altro. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const scena = () => {
  const s = JSON.parse(JSON.stringify(base));
  s.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
  return s;
};
const mag = scena().magazzini.find((m) => (m.articoli || []).length >= 2);

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const entra = async (w = 390, h = 900) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.addInitScript((j) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    const m = new Map(); m.set("scp:stato:v1", j);
    window.storage = {
      async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
      async set(k, v) { m.set(k, v); return true; },
      async delete(k) { m.delete(k); return true; },
    };
  }, JSON.stringify(scena()));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1500);
  return { p, ctx };
};
const lente = (p) => p.getByRole("button", { name: "Cerca un prodotto o una funzione" }).first();
const campo = (p) => p.getByPlaceholder(/Un prodotto o una cosa da fare/);
const fogliAperti = (p) => p.locator(".fixed.inset-0.z-50").count();
const nelMagazzino = async (p) => {
  await vaiA(p, "Magazzini"); await p.waitForTimeout(600);
  await p.getByText(mag.nome, { exact: false }).first().click(); await p.waitForTimeout(700);
};
/* chi si prende davvero il dito al centro di un elemento */
const chiPrende = async (p, loc) => {
  const bx = await loc.boundingBox();
  if (!bx) return "(non disegnato)";
  return p.evaluate(({ x, y }) => {
    const e = document.elementFromPoint(x, y);
    const bt = e && e.closest("button");
    return bt ? (bt.getAttribute("aria-label") || (bt.innerText || "").split("\n")[0] || "(tasto senza nome)") : "(lo sfondo)";
  }, { x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 });
};

/* ═══ 1. CON UNA SCHEDA APERTA, LA LENTE C'È ANCORA ═══ */
console.log("\n— 1. dentro un magazzino la lente si raggiunge —");
const A = await entra();
await nelMagazzino(A.p);
ok(await fogliAperti(A.p) === 1, "il magazzino e' una scheda aperta sopra la pagina");
ok(await chiPrende(A.p, lente(A.p)) === "Cerca un prodotto o una funzione",
  "e la lente in alto prende comunque il dito: prima lo prendeva il foglio");
await lente(A.p).click();
await campo(A.p).waitFor({ state: "visible", timeout: 30000 });
await A.p.waitForTimeout(400);
ok(true, "toccandola la ricerca si apre davvero, senza chiudere il magazzino");

/* ═══ 2. SI CHIUDE E SI TORNA ESATTAMENTE DOV'ERI ═══ */
console.log("\n— 2. chiuderla non fa perdere il posto —");
await A.p.locator(".fixed.inset-0.z-50").last().getByRole("button", { name: "Chiudi" }).click();
await A.p.waitForTimeout(700);
const t2 = (await A.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(new RegExp(mag.nome).test(t2) && /Gestione rapida/.test(t2),
  `chiusa la ricerca sono ancora dentro «${mag.nome}», con i suoi comandi`);

/* ═══ 3. ANCHE DA UNA SCHEDA SOPRA UN'ALTRA SCHEDA ═══ */
console.log("\n— 3. due schede impilate, e la lente sta sopra tutte e due —");
await A.p.getByRole("button", { name: /Gestione rapida/ }).click();
await A.p.locator("[data-azione]").first().waitFor({ state: "visible", timeout: 30000 });
await A.p.waitForTimeout(400);
ok(await fogliAperti(A.p) === 2, "adesso le schede aperte sono due");
ok(await chiPrende(A.p, lente(A.p)) === "Cerca un prodotto o una funzione",
  "e la lente prende il dito lo stesso");
await A.ctx.close();

/* ═══ 4. LA COSA CHE NON DEVE SUCCEDERE ═══
   Saltare a una funzione della sezione in cui sei gia': se la scheda resta
   davanti, il tocco sembra andato a vuoto. */
console.log("\n— 4. quando ti porta da qualche parte, quello che avevi aperto si chiude —");
const B = await entra();
await nelMagazzino(B.p);
await lente(B.p).click();
await campo(B.p).waitFor({ state: "visible", timeout: 30000 });
await campo(B.p).fill("trasferisci"); await B.p.waitForTimeout(600);
const rigaStessa = B.p.locator(".sc-su").last().getByRole("button", { name: /^Trasferisci le scorte/ }).first();
ok(await rigaStessa.count() > 0, "cercando «trasferisci» esce la funzione, che sta in Magazzini — dove sono gia'");
await rigaStessa.click(); await B.p.waitForTimeout(1400);
ok(await fogliAperti(B.p) === 0,
  `il magazzino che avevo aperto si e' chiuso (schede aperte: ${await fogliAperti(B.p)})`);
const t4 = (await B.p.locator("main").innerText()).replace(/\s+/g, " ");
ok(/Magazzini/i.test(t4) || new RegExp(mag.nome).test(t4),
  "e sono nell'elenco dei Magazzini, non davanti alla scheda di prima");

/* e verso una sezione DIVERSA */
await nelMagazzino(B.p);
await lente(B.p).click();
await campo(B.p).waitFor({ state: "visible", timeout: 30000 });
await campo(B.p).fill("backup"); await B.p.waitForTimeout(600);
await B.p.locator(".sc-su").last().getByRole("button", { name: /^Backup, esportazioni/ }).first().click();
await B.p.waitForTimeout(1500);
ok(await fogliAperti(B.p) === 0, "lo stesso saltando in un'altra sezione: niente resta aperto");
ok(/Backup|ripristino|Esporta/i.test((await B.p.locator("main").innerText()).replace(/\s+/g, " ")),
  "e ci si arriva davvero (Sistema)");
await B.ctx.close();

/* ═══ 5. LA LEZIONE DEL 31 LUGLIO: NON DEVE RUBARE IL DITO A NESSUNO ═══
   Alzare un elemento sopra gli altri e' il gesto che quella volta ha reso
   impremibili tre voci su sei. Quindi si controlla anche il contrario. */
console.log("\n— 5. e non ruba il tocco a nessun altro —");
for (const [w, h, nome] of [[390, 844, "telefono"], [1200, 950, "computer"]]) {
  const C = await entra(w, h);
  await nelMagazzino(C.p);
  const chiudi = C.p.locator(".fixed.inset-0.z-50").last().getByRole("button", { name: "Chiudi" });
  ok((await chiPrende(C.p, chiudi)) === "Chiudi",
    `${nome}: la X della scheda si preme ancora, la lente non le sta davanti`);
  await C.p.getByRole("button", { name: /Gestione rapida/ }).click();
  await C.p.locator("[data-azione]").first().waitFor({ state: "visible", timeout: 30000 });
  await C.p.waitForTimeout(400);
  const voci = await C.p.locator("[data-azione]").all();
  let rubate = [];
  for (const v of voci) {
    const chi = await chiPrende(C.p, v);
    const suo = (await v.innerText()).split("\n")[0];
    if (!chi.startsWith(suo.slice(0, 12))) rubate.push(`${suo} → ${chi}`);
  }
  ok(rubate.length === 0,
    `${nome}: tutte e ${voci.length} le voci di «Gestione rapida» prendono il proprio tocco`
    + (rubate.length ? " — rubate: " + rubate.join(" · ") : ""));
  await C.ctx.close();
}

/* ═══ 6. IL PREZZO DI AVER ALZATO L'INTESTAZIONE ═══
   Se l'intestazione sta sopra i fogli, un foglio alto ci finisce sotto. L'ho
   misurato invece di immaginarlo: su un portatile 1440×760 il TITOLO della
   scheda del magazzino spariva dietro l'intestazione. Adesso da md in su i
   fogli lasciano libera quella fascia. Questo controllo la tiene ferma: se
   qualcuno domani cambia l'altezza dell'intestazione o toglie «sc-foglio»,
   diventa rosso. */
/* IL MARGINE. In gen-5.72 questo controllo chiedeva «sopra >= headBot - 1»:
   sul telefono passava con TRE PIXEL, misurati in un browser senza barre. Sul
   telefono vero — con la barra dell'indirizzo e la tacca — quei tre pixel non
   ci sono, e il titolo della scheda finiva sotto l'intestazione. Me l'ha
   segnalato una fotografia, non il collaudo.
   Adesso ne chiede almeno OTTO. Un controllo che passa per un pelo non e' un
   controllo che passa: e' un controllo che sta per fallire da qualche altra
   parte, dove non lo si sta guardando. */
const MARGINE = 8;
console.log("\n— 6. e nessuna scheda finisce sotto l'intestazione, con margine vero —");
for (const [w, h, nome] of [[1200, 950, "computer"], [1440, 760, "portatile basso"],
  [390, 844, "telefono"], [360, 640, "telefono piccolo"]]) {
  const D = await entra(w, h);
  await nelMagazzino(D.p);
  const m = await D.p.evaluate(() => {
    const head = document.querySelector("header").getBoundingClientRect();
    const su = document.querySelector(".fixed.inset-0.z-50 .sc-su").getBoundingClientRect();
    const h3 = document.querySelector(".sc-su h3").getBoundingClientRect();
    return { headBot: Math.round(head.bottom), sopra: Math.round(su.top),
      titolo: Math.round(h3.top), giu: Math.round(su.bottom), vh: innerHeight };
  });
  ok(m.sopra >= m.headBot + MARGINE,
    `${nome}: il bordo alto della scheda (${m.sopra}px) sta almeno ${MARGINE}px sotto l'intestazione (${m.headBot}px)`);
  ok(m.titolo >= m.headBot + MARGINE,
    `${nome}: e il titolo si legge tutto (${m.titolo}px)`);
  ok(m.giu <= m.vh + 1,
    `${nome}: e non sborda nemmeno di sotto (${m.giu}px su ${m.vh}px)`);
  await D.ctx.close();
}

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
