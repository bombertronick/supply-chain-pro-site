/* gen-5.52: la barra che ci sta, la ricerca ovunque, lo storico come pagina.
   Si prova sui dati veri e su tre larghezze di telefono, perché il guasto
   segnalato era proprio «metà delle voci non si vedono». */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const st = JSON.parse(readFileSync("stato-vero-conv.json", "utf8"));
const LAB = st.sedi.find((x) => x.tipo === "laboratorio");
const FM = st.sedi.find((x) => x.tipo === "operatore");
const magFm = st.magazzini.find((m) => m.sedeId === FM.id);
const s = { ...st, codici: [], accessi: [], profili: [
  { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  { id: "pr-lab", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id, colore: "#22B8CF", pinHash: hash("3333") },
  { id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: FM.id, colore: "#E8A13C",
    magazziniIds: [magFm.id], pinHash: hash("2222") },
]};
/* uno storico vero, con persone e giorni diversi, per provare i filtri */
const GG = 86400000;
/* ── UN COLLAUDO NON DEVE DIPENDERE DALL ORA IN CUI GIRA ──
   Qui c era scritto Date.now() - 3 * 3600000 e lo si chiamava «oggi». Alle
   01:37 di notte «tre ore fa» e ieri, e il controllo diventava rosso — sulla
   versione in produzione da giorni, non su una nuova. L ho scoperto perche un
   censimento e capitato dopo mezzanotte, ed e il peggior tipo di falso
   allarme: manda a cercare un difetto che non c e.
   Adesso i tempi sono ancorati alla mezzanotte di oggi, non a «adesso meno
   qualcosa»: quello che deve essere di oggi lo e a qualunque ora si giri. */
const MEZZANOTTE = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
s.log = [
  { id: "l1", t: MEZZANOTTE + 3 * 60000, chi: "Admin", msg: "Soglie aggiornate su «Linea fm»" },
  { id: "l2", t: MEZZANOTTE + 60000, chi: "Gigi", msg: "Conteggio Linea fm chiuso" },
  { id: "l3", t: MEZZANOTTE - 3600000, chi: "Admin", msg: "Prezzi aggiornati" },
  { id: "l4", t: MEZZANOTTE - 7200000, chi: "Gigi", msg: "Ricezione in blocco" },
  { id: "l5", t: MEZZANOTTE - 4 * GG, chi: "Valerio", msg: "Catalogo importato" },
  { id: "l6", t: MEZZANOTTE - 20 * GG, chi: "Valerio", msg: "Magazzini creati" },
];

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin, largo = 360) => {
  const ctx = await b.newContext({ viewport: { width: largo, height: 780 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
    window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
  }, JSON.stringify(s));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(URL); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(150); }
  await p.waitForTimeout(1800);
  return { p, ctx };
};
const misuraNav = (p) => p.evaluate(() => {
  const n = document.querySelector("nav");
  const voci = [...n.querySelectorAll("button")].map((el) => {
    const r = el.getBoundingClientRect();
    /* l'etichetta è l'ULTIMO FIGLIO DIRETTO del bottone. querySelector
       ("span:last-child") pescava invece uno span annidato dentro l'icona,
       e il controllo passava misurando la cosa sbagliata. */
    const et = el.children[el.children.length - 1];
    return { t: (el.textContent || "").trim(), x: Math.round(r.left), dx: Math.round(r.right),
      h: Math.round(r.height), et: (et?.textContent || "").trim(),
      /* quanto è larga la SCRITTA, non la casella che la contiene: con
         w-full+truncate lo span misura sempre quanto lo spazio disponibile,
         quindi confrontarlo con sé stesso non dice niente. */
      serve: et ? +(() => { const g = document.createRange();
        g.selectNodeContents(et); return g.getBoundingClientRect().width; })().toFixed(1) : 0,
      ha: et ? et.clientWidth : 0,
      tagliata: et ? et.scrollWidth > et.clientWidth + 1 : false };
  }).filter((v) => v.dx > v.x);
  return { n: voci.length, voci, scorre: n.scrollWidth > n.clientWidth + 1,
    fuori: voci.filter((v) => v.dx > innerWidth + 1 || v.x < -1).map((v) => v.t),
    bassi: voci.filter((v) => v.h < 32).map((v) => v.t) };
});

/* ─────────── 1. LA BARRA IN BASSO ─────────── */
console.log("\n— 1. la barra ci sta tutta —");
for (const W of [360, 390, 412]) {
  const { p, ctx } = await apri("Admin", "1234", W);
  const nav = await misuraNav(p);
  ok(nav.n === 5, `${W}px · admin ha 5 voci invece di 10 (${nav.n})`);
  const piuStretta = nav.voci.reduce((a, v) => (v.ha - v.serve < a.m ? { m: v.ha - v.serve, et: v.et } : a), { m: 999, et: "" });
  ok(piuStretta.m >= 4,
    `${W}px · alla più lunga («${piuStretta.et}») avanzano ${piuStretta.m.toFixed(1)}px di margine`);
  ok(nav.fuori.length === 0, `${W}px · nessuna voce oltre il bordo${nav.fuori.length ? " → " + nav.fuori.join(", ") : ""}`);
  ok(!nav.scorre, `${W}px · la barra non scorre più di lato`);
  ok(nav.bassi.length === 0, `${W}px · ogni voce resta prendibile col dito`);
  ok(nav.voci.every((v) => !v.tagliata), `${W}px · nessuna etichetta tagliata${nav.voci.filter((v) => v.tagliata).map((v) => ` → «${v.et}» ${v.ha}px per ${v.serve}px`).join("")}`);
  if (W === 360) await p.screenshot({ path: "g552-1-barra-360.png", fullPage: false });
  await ctx.close();
}
for (const [nome, pin] of [["Op", "2222"], ["Lab", "3333"]]) {
  const { p, ctx } = await apri(nome, pin, 360);
  const nav = await misuraNav(p);
  ok(nav.fuori.length === 0 && !nav.scorre,
    `360px · anche ${nome} vede tutte le sue ${nav.n} voci`);
  await ctx.close();
}

/* ─────────── 2. GESTIONE ─────────── */
console.log("\n— 2. quello che è uscito dalla barra si trova —");
const A = await apri("Admin", "1234", 360);
await A.p.locator("nav").getByText("Gestione", { exact: true }).first().click();
await A.p.waitForTimeout(1300);
const tG = await A.p.locator("body").innerText();
for (const v of ["Catalogo", "Analisi", "Storico", "Sedi", "Profili", "Accessi", "Sistema"]) {
  ok(new RegExp(v).test(tG), `«${v}» si raggiunge da Gestione`);
}
await A.p.screenshot({ path: "g552-2-gestione.png", fullPage: true });
/* la strada per le voci sotto «Gestione» la sa la libreria condivisa */
await vaiA(A.p, "Analisi");
ok(/Valore della merce ferma/.test(await A.p.locator("body").innerText()),
  "e toccandola ci si arriva davvero (Analisi)");

/* ─────────── 3. CERCA OVUNQUE ─────────── */
/* gen-5.71: la lente si chiama «Cerca un prodotto o una funzione», tasto e
   campo insieme. In gen-5.70 avevo cambiato l etichetta del campo e non quella
   del tasto: due nomi per la stessa lente, e chi usa un lettore di schermo
   sentiva ancora «cerca un prodotto» su una cosa che ormai trova anche le
   funzioni. Questo collaudo se n e accorto prima di me. */
console.log("\n— 3. cerca un prodotto ovunque —");
const cercaBtn = A.p.getByRole("button", { name: "Cerca un prodotto o una funzione" });
ok(await cercaBtn.count() === 1, "la lente sta nell'intestazione, non nella barra");
await cercaBtn.click(); await A.p.waitForTimeout(900);
const fg = A.p.locator(".fixed.inset-0.z-50").last();
const campo = fg.locator('input[aria-label="Cerca un prodotto o una funzione"]');
await campo.fill("guanci"); await A.p.waitForTimeout(800);
const tR = await fg.innerText();
ok(/Guanciale/i.test(tR), "cercando «guanci» esce il Guanciale");
const magsAdmin = await fg.locator("button").filter({ hasNot: A.p.locator("svg") }).count().catch(() => 0);
const doveAdmin = (await fg.innerText()).split("Guanciale")[1] || "";
ok(/Magazzino centrale/.test(doveAdmin), "e dice in quale magazzino sta");
ok(/previsto/i.test(tR), "col livello previsto accanto alla giacenza");
await A.p.screenshot({ path: "g552-3-ricerca.png", fullPage: true });

/* un prodotto che non sta in nessun magazzino dev'essere detto, non taciuto */
await campo.fill("nduja"); await A.p.waitForTimeout(800);
const tN = await fg.innerText();
ok(/non sta in nessun magazzino/i.test(tN) || /Nessun prodotto/i.test(tN),
  "un prodotto a catalogo ma in nessun magazzino lo dice apertamente");
await A.p.locator('[aria-label="Chiudi"]').last().click(); await A.p.waitForTimeout(600);

/* LA PROVA CHE CONTA: l'operatore non deve vedere le giacenze altrui */
const O = await apri("Op", "2222", 360);
ok(await O.p.getByRole("button", { name: "Cerca un prodotto o una funzione" }).count() === 1,
  "la lente c'è anche per l'operatore");
await O.p.getByRole("button", { name: "Cerca un prodotto o una funzione" }).click(); await O.p.waitForTimeout(900);
const fgO = O.p.locator(".fixed.inset-0.z-50").last();
await fgO.locator('input[aria-label="Cerca un prodotto o una funzione"]').fill("guanci");
await O.p.waitForTimeout(800);
const tO = await fgO.innerText();
ok(!/Magazzino centrale/.test(tO),
  "e l'operatore NON scopre da qui le giacenze del laboratorio");
await O.p.screenshot({ path: "g552-4-ricerca-op.png", fullPage: true });
await O.ctx.close();

/* ─────────── 4. LO STORICO COME PAGINA ─────────── */
console.log("\n— 4. lo storico come pagina vera —");
await A.p.locator("nav").getByText("Home", { exact: true }).first().click(); await A.p.waitForTimeout(1300);
const vediTutto = A.p.getByRole("button", { name: "vedi tutto" });
ok(await vediTutto.count() >= 1, "da Home c'è «vedi tutto» accanto all'attività recente");
await vediTutto.first().click(); await A.p.waitForTimeout(1400);
let tS = await A.p.locator("body").innerText();
ok(/Storico/.test(tS), "che porta alla pagina Storico");
ok(new RegExp(`Tutte le azioni · ${s.log.length}`).test(tS),
  `con tutte e ${s.log.length} le azioni, non solo cinque`);
await A.p.screenshot({ path: "g552-5-storico.png", fullPage: true });

/* i filtri */
await A.p.getByText("Oggi", { exact: true }).first().click(); await A.p.waitForTimeout(700);
tS = await A.p.locator("body").innerText();
ok(/2 su 6/.test(tS), `«Oggi» tiene solo le due di oggi (${/(\d+) su \d+/.exec(tS)?.[1]})`);
ok(!/Catalogo importato/.test(tS), "e quella di quattro giorni fa sparisce");

await A.p.getByText("Sempre", { exact: true }).first().click(); await A.p.waitForTimeout(700);
await A.p.selectOption('select[aria-label="Filtra per persona"]', "Gigi"); await A.p.waitForTimeout(700);
tS = await A.p.locator("body").innerText();
ok(/2 su 6/.test(tS), "filtrando per «Gigi» restano le sue due");
ok(!/Prezzi aggiornati/.test(tS), "e quelle degli altri non ci sono");

await A.p.locator('input[aria-label="Cerca nello storico"]').fill("ricezione"); await A.p.waitForTimeout(700);
tS = await A.p.locator("body").innerText();
ok(/1 su 6/.test(tS), "e cercando nel testo si arriva a una sola");
await A.p.getByRole("button", { name: /Togli i filtri/ }).click(); await A.p.waitForTimeout(700);
tS = await A.p.locator("body").innerText();
ok(/Tutte le azioni · 6/.test(tS), "«Togli i filtri» rimette tutto");

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await A.ctx.close();
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
