/* gen-5.71 (C): «Gestione rapida» diventa un pannello di comando.

   La frase da cui nasce, la stessa di B: «un centro di comando si chiama tale
   quando controlla tutte le sue periferiche e funzionalità principali».

   Erano sei voci in fila, nell'ordine in cui le ho scritte io, senza titoli.
   Per trovarne una bisognava leggerle tutte. E quattro sparivano quando il
   magazzino era vuoto — cioe' proprio nel momento in cui uno le cerca per
   capire cosa puo' farci.

   I due controlli che contano davvero:

     · § 2 — LA PROVA CHE I DUE POSTI NON SI SCOLLANO. Il nome di ogni voce
       non lo scrivo io in questo file: lo LEGGO dal menu', e poi lo cerco con
       la lente. Se qualcuno domani cambia il nome in un posto solo, questo
       controllo diventa rosso senza che nessuno debba ricordarsi di venirlo a
       correggere. E' l'unico modo per cui «le stesse identiche parole» resta
       vero anche fra sei mesi.

     · § 4 — LE VOCI NON SPARISCONO. Su un magazzino vuoto le quattro voci che
       hanno bisogno di prodotti restano al loro posto, spente, e dicono
       perche'. Una funzione che sparisce e' una funzione da ricordare a
       memoria: e' la fatica che tutto questo lavoro doveva togliere. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const scena = (vuoto) => {
  const s = JSON.parse(JSON.stringify(base));
  const m = s.magazzini.find((x) => (x.articoli || []).length >= 2);
  if (vuoto) m.articoli = [];
  s.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
  return { s, mag: m };
};
const { mag } = scena(false);

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const entra = async (vuoto) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript((j) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    const m = new Map(); m.set("scp:stato:v1", j);
    window.storage = {
      async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
      async set(k, v) { m.set(k, v); return true; },
      async delete(k) { m.delete(k); return true; },
    };
  }, JSON.stringify(scena(vuoto).s));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1500);
  return { p, ctx };
};
const entraNelMagazzino = async (p) => {
  await vaiA(p, "Magazzini"); await p.waitForTimeout(600);
  await p.getByText(mag.nome, { exact: false }).first().click(); await p.waitForTimeout(700);
};
const apriMenu = async (p) => {
  await p.getByRole("button", { name: /Gestione rapida/ }).click();
  await p.locator("[data-azione]").first().waitFor({ state: "visible", timeout: 30000 });
  await p.waitForTimeout(400);
};
const apriGestione = async (p) => { await entraNelMagazzino(p); await apriMenu(p); };
/* Il Foglio si chiude solo con la sua X: non ascolta il tasto Esc. E i fogli si
   impilano — il magazzino stesso e' un foglio, «Gestione rapida» un secondo
   sopra — quindi si chiude sempre quello piu' in alto. */
const chiudiFoglio = async (p) => {
  await p.locator(".fixed.inset-0.z-50").last().getByRole("button", { name: "Chiudi" }).click();
  await p.waitForTimeout(600);
};
/* il titolo del foglio aperto in questo momento */
const titoloFoglio = (p) => p.locator(".sc-su").last().locator("h3").first().innerText();
/* legge il menù dal vivo: chiave → nome scritto, e in che ordine sta */
const leggiMenu = (p) => p.evaluate(() => {
  const gruppi = [], voci = [];
  for (const box of document.querySelectorAll("[data-azione]")) {
    const tit = box.parentElement.querySelector("span.uppercase");
    voci.push({ k: box.getAttribute("data-azione"),
      nome: (box.querySelector("span.font-extrabold") || {}).textContent || "",
      sotto: (box.querySelectorAll("span.text-xs")[0] || {}).textContent || "",
      gruppo: (tit || {}).textContent || "",
      spenta: parseFloat(getComputedStyle(box).opacity) < 0.9 });
  }
  for (const t of document.querySelectorAll("[data-azione]"))
    { const g = t.parentElement.querySelector("span.uppercase"); if (g && !gruppi.includes(g.textContent)) gruppi.push(g.textContent); }
  return { gruppi, voci };
});

/* ═══ 1. TRE GRUPPI, NELL'ORDINE IN CUI SI LAVORA ═══ */
console.log("\n— 1. non piu' una fila: tre gruppi con l'intestazione —");
const A = await entra(false);
await apriGestione(A.p);
const menu = await leggiMenu(A.p);
ok(JSON.stringify(menu.gruppi) === JSON.stringify(["Aggiungere", "Spostare", "Livelli"]),
  `i gruppi sono Aggiungere · Spostare · Livelli, in quest'ordine (ho letto: ${menu.gruppi.join(" · ")})`);
ok(menu.voci.length === 6, `e dentro ci stanno tutte e sei le voci (${menu.voci.length})`);

const attesi = {
  "mag-aggiungi": "Aggiungere", "mag-copia": "Aggiungere",
  "mag-sposta": "Spostare", "mag-trasf": "Spostare",
  "mag-par": "Livelli", "mag-soglie": "Livelli",
};
for (const v of menu.voci)
  ok(v.gruppo === attesi[v.k], `«${v.nome}» sta sotto «${attesi[v.k]}»`);

/* ═══ 2. LE STESSE IDENTICHE PAROLE DELLA RICERCA ═══
   Il nome non e' scritto in questo file: lo leggo dal menù e lo cerco con la
   lente. Se i due posti si scollano, qui diventa rosso da solo. */
console.log("\n— 2. quello che leggi nel menu' lo ritrovi cercando —");
/* due chiusure: prima «Gestione rapida», poi il magazzino. La lente sta
   nell'intestazione dell'app, e un foglio aperto le sta davanti. */
await chiudiFoglio(A.p);
await chiudiFoglio(A.p);
const parole = { "mag-aggiungi": "aggiungi", "mag-copia": "copia", "mag-sposta": "togli",
  "mag-trasf": "trasferisci", "mag-par": "livello", "mag-soglie": "soglie" };
await A.p.getByRole("button", { name: /Cerca/i }).first().click();
await A.p.getByPlaceholder(/Un prodotto o una cosa da fare/).waitFor({ state: "visible", timeout: 30000 });
await A.p.waitForTimeout(300);
for (const v of menu.voci) {
  await A.p.getByPlaceholder(/Un prodotto o una cosa da fare/).fill(parole[v.k]);
  await A.p.waitForTimeout(500);
  const t = (await A.p.locator(".sc-su").last().innerText()).replace(/\s+/g, " ");
  ok(t.includes(v.nome),
    `cercando «${parole[v.k]}» esce «${v.nome}» — parola per parola come nel menù`);
}
await A.ctx.close();

/* ═══ 3. OGNI VOCE APRE DAVVERO LA SUA ═══ */
console.log("\n— 3. non e' un elenco decorativo: ogni voce apre la sua —");
const B = await entra(false);
/* Guardo il TITOLO del foglio che si apre, non il testo della pagina: «Sposta»
   e «Trasferisci» compaiono anche fra i tasti del magazzino, e un controllo che
   li trova li' passerebbe anche se il foglio non si aprisse affatto.

   E il titolo atteso non lo scrivo: e' il nome che ho letto nel menù. Prima
   erano tre nomi diversi per la stessa cosa — la voce diceva «Copia i prodotti
   da un altro magazzino», il foglio «Copia prodotti da un magazzino», la
   ricerca un terzo. Da gen-5.71 e' uno solo, e questo controllo lo prova. */
const apre = menu.voci.map((v) => [v.k, v.nome]);
await entraNelMagazzino(B.p);
for (const [k, atteso] of apre) {
  await apriMenu(B.p);
  await B.p.locator(`[data-azione="${k}"]`).click();
  await B.p.waitForTimeout(1000);
  const t = (await titoloFoglio(B.p)).trim();
  ok(t === atteso, `«${k}»: la voce dice «${atteso}» e il foglio si intitola uguale`
    + (t === atteso ? "" : ` — invece si intitola «${t}»`));
  await chiudiFoglio(B.p);
}
await B.ctx.close();

/* ═══ 4. SU UN MAGAZZINO VUOTO NON SPARISCE NIENTE ═══ */
console.log("\n— 4. quello che non si puo' fare adesso resta visibile e dice perche' —");
const V = await entra(true);
await apriGestione(V.p);
const mv = await leggiMenu(V.p);
ok(mv.voci.length === 6,
  `il magazzino e' vuoto e le voci sono ancora sei (${mv.voci.length}): prima ne sparivano quattro`);
const spente = mv.voci.filter((v) => v.spenta).map((v) => v.k).sort();
ok(JSON.stringify(spente) === JSON.stringify(["mag-par", "mag-soglie", "mag-sposta", "mag-trasf"]),
  `le quattro che hanno bisogno di prodotti sono spente (${spente.join(", ")})`);
const conRagione = mv.voci.filter((v) => v.spenta && /Serve almeno un prodotto/i.test(v.sotto)).length;
ok(conRagione === 4, `e tutte e quattro dicono perche' (${conRagione}/4)`);

/* toccarne una non deve essere un buco nero: spiega, e non chiude il menù */
await V.p.locator('[data-azione="mag-sposta"]').click();
await V.p.waitForTimeout(900);
const dopo = (await V.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/magazzino è ancora vuoto|prima aggiungi dei prodotti/i.test(dopo),
  "toccando una voce spenta l'app spiega, invece di non fare niente");
ok(await V.p.locator("[data-azione]").count() === 6,
  "e il menù resta aperto: non si perde il posto");

/* le due che si possono fare davvero funzionano lo stesso */
await V.p.locator('[data-azione="mag-aggiungi"]').click();
await V.p.waitForTimeout(1000);
ok((await titoloFoglio(V.p)).trim() === "Aggiungi più prodotti",
  "e «Aggiungi più prodotti», che su un magazzino vuoto e' proprio quello che serve, si apre");
await V.ctx.close();

/* ═══ 5. SUL TELEFONO CI STANNO TUTTE E SEI, SENZA SCORRERE ═══
   Questo controllo e' nato da un errore mio. Nel dare alle voci i nomi lunghi
   della ricerca — «Copia i prodotti da un altro magazzino» — i titoli sono
   andati a capo, i tre gruppi hanno aggiunto la loro riga, e l'ultima voce e'
   finita sotto il bordo dello schermo. Si vedeva soltanto scorrendo, e un
   pannello di comando dove l'ultimo comando non si vede non e' un pannello di
   comando. Se ne aggiungete una settima, o allungate un nome, qui diventa
   rosso: e' il prezzo del posto, e va pagato consapevolmente. */
console.log("\n— 5. su un telefono normale ci stanno tutte, senza scorrere —");
const M = await entra(false);
await apriGestione(M.p);
const spazio = await M.p.evaluate(() => {
  const box = document.querySelector("[data-azione]").closest(".sc-su");
  const giu = [...document.querySelectorAll("[data-azione]")]
    .filter((e) => e.getBoundingClientRect().bottom > innerHeight)
    .map((e) => e.getAttribute("data-azione"));
  return { scorre: box.scrollHeight > box.clientHeight + 1, giu };
});
ok(!spazio.scorre, `il foglio non ha bisogno di scorrere su 390×900`);
ok(spazio.giu.length === 0,
  `nessuna voce finisce sotto il bordo dello schermo${spazio.giu.length ? " — invece: " + spazio.giu.join(", ") : ""}`);
await M.ctx.close();

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
