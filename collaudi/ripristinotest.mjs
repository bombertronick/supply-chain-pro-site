/* Due cose insieme: lo storico che sa tornare indietro, e la Plancia che sa
   togliere. Si fa tutto da amministratore su una copia della topologia vera. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const topo = JSON.parse(readFileSync("topologia-vera.json", "utf8"));
const s = { ...base, sedi: topo.sedi, magazzini: topo.magazzini.map((m) => ({ ...m })) };
const PR = base.prodotti.slice(0, 6);
/* il laboratorio tiene i primi 4 prodotti; le due linee che serve ne hanno 3 */
const M = (id) => s.magazzini.find((x) => x.id === id);
M("centrale").articoli = PR.slice(0, 4).map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 10, par: 12 }));
for (const id of ["linea-fm", "lfritti-fm"])
  M(id).articoli = PR.slice(0, 3).map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 2, par: 5 }));
for (const id of ["secco-fm", "lsecco-fm", "bevande-fm", "lconf-fm", "linea-rm", "secco-rm", "lsecco-rm", "bevande-rm", "lfritti-rm", "lconf-rm"])
  M(id).articoli = PR.slice(0, 3).map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 1, par: 4 }));
s.profili = [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
s.log = [];

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const ctx = await b.newContext({ viewport: { width: 430, height: 950 }, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
}, JSON.stringify(s));
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(e.message));
const letto = () => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const art = (st, mid, pid) => st.magazzini.find((m) => m.id === mid).articoli.find((a) => a.prodottoId === pid);
const barra = () => p.locator("div.fixed.z-40");
const vai = async (dove) => { await p.locator("nav").getByText(dove, { exact: true }).first().click(); await p.waitForTimeout(1100); };

await p.goto(URL); await p.waitForTimeout(1600);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
await p.waitForTimeout(1700);

/* ─────────── LA PLANCIA: COMANDI IN ORDINE ─────────── */
await vai("Plancia");
await p.getByText("Caselle", { exact: true }).first().click(); await p.waitForTimeout(1100);
await p.locator("select").first().selectOption({ label: M("centrale").nome });
await p.waitForTimeout(1000);
/* seleziono due caselle del magazzino laboratorio */
for (const q of [PR[0].nome, PR[1].nome]) {
  await p.getByText(q, { exact: true }).first().click(); await p.waitForTimeout(400);
}
let t = await p.locator("body").innerText();
ok(/2 caselle/.test(t), "la barra dice quante caselle sono scelte");
const tBarra = await barra().innerText();
ok(/Quantità/.test(tBarra) && /Soglie/.test(tBarra) && /Articoli/.test(tBarra),
  "i comandi sono divisi in tre famiglie: Quantità, Soglie, Articoli");
ok(/Riempi/.test(tBarra) && !/Rimuovi/.test(tBarra),
  "si parte da Quantità, e «Rimuovi» non è lì a portata di pollice");
await p.screenshot({ path: "rip-1-comandi.png" });

await barra().getByText("Articoli", { exact: true }).click(); await p.waitForTimeout(600);
const tArt = await barra().innerText();
ok(/Rimuovi/.test(tArt) && /Sposta/.test(tArt) && /Unità/.test(tArt), "in Articoli ci sono Unità, Sposta e Rimuovi");
ok(!/Riempi/.test(tArt), "e i comandi della quantità non sono più a schermo");
await p.screenshot({ path: "rip-2-struttura.png" });

/* ─────────── TOGLIERE, CON LA CASCATA ─────────── */
const prima = await letto();
ok(!!art(prima, "linea-fm", PR[0].id) && !!art(prima, "lfritti-fm", PR[0].id),
  "prima della rimozione il prodotto sta anche sulle due linee rifornite");

await barra().getByText("Rimuovi", { exact: true }).click(); await p.waitForTimeout(800);
const avviso = await p.locator(".fixed.inset-0.z-50").last().innerText();
ok(/Togli\s*2\s*articoli/.test(avviso.replace(/\n/g, " ")), "la finestra dice quanti articoli e da quanti magazzini");
ok(/A cascata/.test(avviso), "e avverte della cascata verso le linee");
ok(avviso.includes("Linea fm") && avviso.includes("Linea fritti fm"),
  "nominando le due linee che perderanno i prodotti");
ok(/soglie e i livelli per giorno si perdono/.test(avviso), "dice chiaramente che le soglie si perdono");
ok(/restano a catalogo/.test(avviso), "e che i prodotti restano a catalogo");
await p.screenshot({ path: "rip-3-conferma-rimozione.png" });

await p.getByRole("button", { name: /^Rimuovi 2$/ }).first().click();
await p.waitForTimeout(1500);
const dopo = await letto();
ok(!art(dopo, "centrale", PR[0].id) && !art(dopo, "centrale", PR[1].id),
  "i due articoli sono spariti dal magazzino laboratorio");
ok(!art(dopo, "linea-fm", PR[0].id) && !art(dopo, "lfritti-fm", PR[0].id),
  "e a cascata anche dalle due linee rifornite");
ok(!!art(dopo, "linea-fm", PR[2].id), "il terzo prodotto delle linee non è stato toccato");
ok(!!art(dopo, "lsecco-fm", PR[0].id), "e le linee rifornite dal retro non c'entrano: intatte");
ok(dopo.prodotti.length === prima.prodotti.length, "il catalogo prodotti non è stato toccato");

/* ─────────── LO STORICO: VEDERE E RIPRISTINARE ─────────── */
await vai("Home");
t = await p.locator("body").innerText();
ok(/articoli rimossi da/.test(t), "l'azione compare nello storico");
ok(/vedi cosa/.test(t), "con il tasto per vedere cosa è cambiato");
await p.getByRole("button", { name: "vedi cosa" }).first().click(); await p.waitForTimeout(700);
const dett = await p.locator("body").innerText();
ok(dett.includes(PR[0].nome) || dett.includes(PR[1].nome), "il dettaglio nomina i prodotti toccati");
ok(/tolto/.test(dett), "e per ognuno dice che l'articolo è stato tolto");
ok(/Riporta tutto com'era prima/.test(dett), "c'è il tasto per ripristinare quella singola azione");
await p.screenshot({ path: "rip-4-dettaglio.png", fullPage: true });

await p.getByRole("button", { name: /Riporta tutto com'era prima/ }).first().click(); await p.waitForTimeout(700);
const conf = await p.locator(".fixed.inset-0.z-50").last().innerText();
ok(/Riportare tutto com'era/.test(conf), "chiede conferma prima di rimettere le cose a posto");
ok(/tornano ai valori di prima/.test(conf), "spiegando cosa succede");
await p.getByRole("button", { name: "Ripristina", exact: true }).first().click();
await p.waitForTimeout(1600);

const tornato = await letto();
ok(!!art(tornato, "centrale", PR[0].id) && !!art(tornato, "centrale", PR[1].id),
  "dopo il ripristino i due articoli sono tornati in laboratorio");
ok(!!art(tornato, "linea-fm", PR[0].id) && !!art(tornato, "lfritti-fm", PR[0].id),
  "e sono tornati anche sulle due linee rifornite");
const a0 = art(tornato, "centrale", PR[0].id);
ok(a0.qty === 10 && a0.par === 12, `con i numeri di prima (giacenza ${a0.qty}, soglia ${a0.par})`);
const l0 = art(tornato, "linea-fm", PR[0].id);
ok(l0.qty === 2 && l0.par === 5, `e le linee con i loro (giacenza ${l0.qty}, soglia ${l0.par})`);
ok((tornato.log || []).some((e) => /^Ripristinato/.test(e.msg || "")),
  "anche il ripristino è scritto nello storico");
await p.screenshot({ path: "rip-5-ripristinato.png", fullPage: true });

/* ─────────── UNA MODIFICA NORMALE, RIPRISTINATA ─────────── */
await vai("Plancia");
await p.getByText("Caselle", { exact: true }).first().click(); await p.waitForTimeout(1000);
await p.locator("select").first().selectOption({ label: M("linea-fm").nome });
await p.waitForTimeout(900);
const qPrima = art(await letto(), "linea-fm", PR[2].id).qty;
await p.getByText(PR[2].nome, { exact: true }).first().click(); await p.waitForTimeout(500);
await barra().getByText("Riempi", { exact: true }).click(); await p.waitForTimeout(1400);
const qDopo = art(await letto(), "linea-fm", PR[2].id).qty;
ok(qDopo !== qPrima, `«Riempi» ha cambiato la giacenza (${qPrima} → ${qDopo})`);

await vai("Home");
await p.getByRole("button", { name: "vedi cosa" }).first().click(); await p.waitForTimeout(700);
const d2 = await p.locator("body").innerText();
ok(/giacenza/.test(d2), "il dettaglio mostra la voce «giacenza»");
ok(d2.includes(String(qPrima).replace(".", ",")) || d2.includes(String(qPrima)),
  `con il valore di partenza (${qPrima})`);
await p.getByRole("button", { name: /Riporta tutto com'era prima/ }).first().click(); await p.waitForTimeout(600);
await p.getByRole("button", { name: "Ripristina", exact: true }).first().click(); await p.waitForTimeout(1500);
ok(art(await letto(), "linea-fm", PR[2].id).qty === qPrima,
  `dopo il ripristino la giacenza è tornata a ${qPrima}`);

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
