import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

/* ── la topologia vera in piccolo: un laboratorio, due sedi operatore,
      una linea rifornita dal laboratorio per ciascuna ── */
const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
const LAB = s.sedi.find((x) => x.tipo === "laboratorio");
const [FM, RM] = s.sedi.filter((x) => x.tipo === "operatore");
const magLab = s.magazzini.find((m) => m.tipo === "laboratorio");
const lineaFm = s.magazzini.find((m) => m.tipo === "linea-lab");
const [PA, PB, PC] = s.prodotti;

/* tre prodotti in laboratorio: due arrivano alle linee, il terzo resta lì */
magLab.articoli = [PA, PB, PC].map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 10, par: 12 }));
lineaFm.articoli = [PA, PB].map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 1, par: 3 }));
const lineaRm = { id: "mag-linea-rm", sedeId: RM.id, nome: "Linea Pizze rm", tipo: "linea-lab",
  articoli: [PA, PB].map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 2, par: 4 })) };
s.magazzini.push(lineaRm);

s.profili = [
  { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  /* DAL 30 AGOSTO (gen-5.95) la FORMA del magazzino — aggiungere articoli,
     Gestione rapida, cestino — sta dietro «struttura» (permessoSu → "pieno").
     Questo collaudo prova LA CASCATA: togliendo un prodotto dal laboratorio
     deve sparire anche dalle linee rifornite. Serve un laboratorio
     autorizzato; che senza spunta la superficie sparisca lo difende
     essenzialetest (31/08/2026, dal triage del censimento). */
  { id: "pr-lab", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id, colore: "#8A63F4",
    struttura: true, magazziniIds: [magLab.id], pinHash: hash("3333") },
  { id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: FM.id, colore: "#E8A13C",
    magazziniIds: [lineaFm.id], pinHash: hash("2222") },
];

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin, dove) => {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 } });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j);
    localStorage.setItem("scp:tour:v1", "1");
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(s));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(URL); await p.waitForTimeout(1600);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
  await p.waitForTimeout(1600);
  /* su schermo largo il menù è la barra laterale, non il <nav> dei telefoni */
  if (dove) { await p.getByText(dove, { exact: true }).first().click(); await p.waitForTimeout(1200); }
  return { p, ctx };
};
/* i fogli si chiudono con la X: il tasto Esc non è previsto */
const chiudi = (p) => p.locator('[aria-label="Chiudi"]').last().click();
/* legge lo stato salvato: è lì che si vede se la cascata è avvenuta */
const letto = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));

/* ─────────── IL LABORATORIO IN MAGAZZINI ─────────── */
const L = await apri("Lab", "3333", "Magazzini");
let t = await L.p.locator("body").innerText();
ok(t.includes(magLab.nome), "il laboratorio vede il proprio magazzino «" + magLab.nome + "»");
ok(t.includes(lineaFm.nome) && t.includes(lineaRm.nome), "e vede le due linee che rifornisce");
ok(t.includes(FM.nome) && t.includes(RM.nome), "con il nome delle sedi servite: " + FM.nome + ", " + RM.nome);
ok(/Tutte le sedi/.test(t), "compare il filtro per sede, che prima era solo dell'admin");
ok(/le linee che rifornisci/.test(t), "il sottotitolo spiega che quelle si vedono soltanto");
await L.p.screenshot({ path: "lab-1-magazzini.png", fullPage: true });

/* una linea rifornita: si guarda e basta */
await L.p.getByText(lineaRm.nome, { exact: true }).first().click(); await L.p.waitForTimeout(900);
let d = await L.p.locator("body").innerText();
ok(!/Aggiungi articolo/.test(d), "aprendo una linea rifornita non c'è «Aggiungi articolo»");
ok(!/Gestione rapida/.test(d), "né «Gestione rapida»: è in sola lettura");
ok(await L.p.locator(`[aria-label^="Rimuovi "]`).count() === 0, "e nessun cestino sulle righe");
await L.p.screenshot({ path: "lab-2-linea-sola-lettura.png", fullPage: true });
await chiudi(L.p); await L.p.waitForTimeout(800);

/* il proprio magazzino: mano libera */
await L.p.getByText(magLab.nome, { exact: true }).first().click(); await L.p.waitForTimeout(900);
d = await L.p.locator("body").innerText();
ok(/Aggiungi articolo/.test(d), "sul proprio magazzino può aggiungere articoli");
ok(/Gestione rapida/.test(d), "e ha la gestione rapida");
const cestini = await L.p.locator(`[aria-label^="Rimuovi "]`).count();
ok(cestini === 3, "e il cestino su ogni riga (" + cestini + " righe)");
await L.p.screenshot({ path: "lab-3-suo-magazzino.png", fullPage: true });

/* ─────────── LA CASCATA ─────────── */
await L.p.locator(`[aria-label="Rimuovi ${PA.nome}"]`).first().click(); await L.p.waitForTimeout(700);
const avviso = await L.p.locator("body").innerText();
ok(new RegExp(`Rimuovere «${PA.nome}»`).test(avviso), "la conferma nomina il prodotto");
ok(avviso.includes(lineaFm.nome) && avviso.includes(lineaRm.nome),
  "e nomina le due linee che perderanno il prodotto");
ok(/soglie andranno perse/.test(avviso), "e avverte che le soglie si perdono");
ok(/Rimuovi da 3 magazzini/.test(avviso), "il tasto dice quanti magazzini tocca: 3");
await L.p.screenshot({ path: "lab-4-conferma-cascata.png", fullPage: true });
await L.p.getByRole("button", { name: /Rimuovi da 3 magazzini/ }).first().click();
await L.p.waitForTimeout(1400);

const dopo = await letto(L.p);
const ha = (mid, pid) => dopo.magazzini.find((m) => m.id === mid).articoli.some((a) => a.prodottoId === pid);
ok(!ha(magLab.id, PA.id), "dopo la conferma il prodotto non è più in laboratorio");
ok(!ha(lineaFm.id, PA.id), "ed è sparito dalla linea di " + FM.nome);
ok(!ha(lineaRm.id, PA.id), "e dalla linea di " + RM.nome);
ok(ha(lineaFm.id, PB.id) && ha(lineaRm.id, PB.id), "gli altri prodotti delle linee restano al loro posto");
ok(dopo.prodotti.some((p) => p.id === PA.id), "il prodotto resta a catalogo: non è stato cancellato");
ok((dopo.log || []).some((l) => (l.msg || "").includes(lineaRm.nome)),
  "e lo storico scrive quali linee sono state toccate");

/* un prodotto che le linee non hanno: nessun allarme inutile */
await L.p.locator(`[aria-label="Rimuovi ${PC.nome}"]`).first().click(); await L.p.waitForTimeout(700);
const solo = await L.p.locator(".fixed.inset-0.z-50").last().innerText();
ok(!/linee che rifornisci/.test(solo), "per un prodotto che sta solo in laboratorio non parla di linee");
ok(/il prodotto resta a catalogo/.test(solo), "e resta l'avviso semplice di sempre");
ok(/^Rimuovi$/m.test(solo), "e il tasto torna a dire solo «Rimuovi»");
await chiudi(L.p); await L.p.waitForTimeout(600);
await L.ctx.close();

/* ─────────── LA PLANCIA: si vede, non si tocca ─────────── */
const P2 = await apri("Lab", "3333", "Plancia");
await P2.p.waitForTimeout(1200);
let pl = await P2.p.locator("body").innerText();
ok(/Rete · 6 magazzini/.test(pl), "nella Rete ci sono tutti e 6 i magazzini che il laboratorio vede");
ok(pl.includes(FM.nome.toUpperCase()) && pl.includes(RM.nome.toUpperCase()),
  "con una fascia per ognuna delle due sedi rifornite");
ok(/serve le linee/.test(pl), "e il nodo del laboratorio dice che serve le linee");
await P2.p.screenshot({ path: "lab-5-rete.png", fullPage: true });

await P2.p.getByText("Caselle", { exact: true }).first().click().catch(() => {});
await P2.p.waitForTimeout(1200);
/* si deve aprire su un magazzino SUO, non sulla prima linea che capita */
const dentro = await P2.p.locator("body").innerText();
ok(dentro.includes(magLab.nome), "le Caselle si aprono sul magazzino del laboratorio, non su quello di un'altra sede");

/* ora lo porto a mano su una linea che non è sua e provo a modificarla */
await P2.p.locator("select").first().selectOption({ label: lineaFm.nome });
await P2.p.waitForTimeout(1100);
const qtyPrima = (await letto(P2.p)).magazzini.find((m) => m.id === lineaFm.id).articoli[0].qty;

/* il + di una casella non sua */
await P2.p.getByRole("button", { name: "Aumenta" }).first().click();
await P2.p.waitForTimeout(800);
let pl2 = await P2.p.locator("body").innerText();
ok(/lo vedi, non lo modifichi/.test(pl2), "il + su una linea rifornita avvisa invece di scrivere");
const qtyDopo = (await letto(P2.p)).magazzini.find((m) => m.id === lineaFm.id).articoli[0].qty;
ok(qtyPrima === qtyDopo, `e la quantità non si muove (${qtyPrima} → ${qtyDopo})`);

/* e nemmeno si seleziona */
await P2.p.getByText(PA.nome, { exact: true }).first().click().catch(() => {});
await P2.p.waitForTimeout(700);
pl2 = await P2.p.locator("body").innerText();
ok(!/[1-9]\d* selezionat/.test(pl2), "e nemmeno toccandola si seleziona");
await P2.p.screenshot({ path: "lab-6-plancia-blocco.png", fullPage: true });

/* sul proprio magazzino invece funziona tutto */
await P2.p.locator("select").first().selectOption({ label: magLab.nome });
await P2.p.waitForTimeout(1100);
const mioPrima = (await letto(P2.p)).magazzini.find((m) => m.id === magLab.id).articoli[0].qty;
await P2.p.getByRole("button", { name: "Aumenta" }).first().click();
await P2.p.waitForTimeout(900);
const mioDopo = (await letto(P2.p)).magazzini.find((m) => m.id === magLab.id).articoli[0].qty;
ok(mioDopo === mioPrima + 1, `sul proprio magazzino il + funziona (${mioPrima} → ${mioDopo})`);
await P2.p.screenshot({ path: "lab-7-plancia-suo.png", fullPage: true });
await P2.ctx.close();

/* ─────────── REGRESSIONE: operatore e admin ─────────── */
const O = await apri("Op", "2222", "Magazzini");
const to = await O.p.locator("body").innerText();
ok(to.includes(lineaFm.nome), "l'operatore vede i magazzini della sua sede");
ok(!to.includes(magLab.nome), "e non vede il magazzino del laboratorio");
ok(!to.includes(lineaRm.nome), "né la linea dell'altra sede");
ok(!/Tutte le sedi/.test(to), "senza filtro sedi: ne ha una sola");
await O.ctx.close();

const AD = await apri("Admin", "1234", "Magazzini");
const ta = await AD.p.locator("body").innerText();
ok(ta.includes(magLab.nome) && ta.includes(lineaFm.nome) && ta.includes(lineaRm.nome),
  "l'admin continua a vedere tutto");
ok(/Tutte le sedi/.test(ta), "e ha ancora il filtro per sede");
ok(/Nuovo magazzino/.test(ta), "e solo lui crea magazzini");
await AD.ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
