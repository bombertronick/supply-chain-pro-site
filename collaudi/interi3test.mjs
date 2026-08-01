import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const seed = JSON.parse(readFileSync("seed-state.json", "utf8"));
const PIN = seed.profili.find((p) => p.ruolo === "admin").pinHash;   // stesso PIN di prova per tutti

/* ===== stato di prova: 1 conf = 4 pz, bufala solo intera ===== */
const stato = {
  ...seed,
  unita: [{ id: "u-pz", nome: "pezzo", simbolo: "pz" }, { id: "u-conf", nome: "confezione", simbolo: "conf" }],
  categorie: [{ id: "c1", nome: "Latticini", colore: "#4C8DF6" }],
  fornitori: [{ id: "f1", nome: "Caseificio" }],
  prodotti: [{ id: "BUF", nome: "Bufala", categoriaId: "c1", fornitoreId: "f1", uomBase: "u-pz",
    conv: { "u-conf": 4 }, uomLavorazione: "u-conf", uomFornitore: "u-conf", uomFornitoreDiretto: "u-conf",
    soloInteri: true }],
  sedi: [{ id: "s-lab", nome: "Portuense", tipo: "laboratorio" },
         { id: "s-op", nome: "Fm", tipo: "operatore", labSedeId: "s-lab" }],
  magazzini: [
    { id: "m-lab", nome: "Magazzino centrale", sedeId: "s-lab", tipo: "laboratorio",
      articoli: [{ prodottoId: "BUF", uomId: "u-conf", par: 5, qty: 1.5 }] },
    { id: "m-lin", nome: "Linea fm", sedeId: "s-op", tipo: "linea-lab",
      articoli: [{ prodottoId: "BUF", uomId: "u-pz", par: 8, qty: 0 }] },
    { id: "m-retro", nome: "Secco fm", sedeId: "s-op", tipo: "retro",
      articoli: [{ prodottoId: "BUF", uomId: "u-conf", par: 5, qty: 0 }] },
  ],
  profili: [
    { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: PIN },
    { id: "pr-lab", nome: "Laboratorio", ruolo: "laboratorio", colore: "#22B8CF", sedeId: "s-lab", pinHash: PIN },
    { id: "pr-op", nome: "Operatore", ruolo: "operatore", colore: "#D96AC0", sedeId: "s-op",
      magazziniIds: ["m-lin"], pinHash: PIN },
  ],
  /* la linea ha chiesto 2 conf (giá arrotondate dal conteggio) */
  richieste: [{ id: "ric-1", t: Date.now(), daSedeId: "s-op", aSedeLabId: "s-lab", daMagazzinoId: "m-lin",
    magNome: "Linea fm", prodottoId: "BUF", qty: 2, uomId: "u-conf", qtyLinea: 8, uomLineaId: "u-pz",
    stato: "in-attesa", creataDa: "Operatore" }],
  /* un ordine giá partito, da ricevere */
  ordini: [{ id: "ord-1", t: Date.now(), tipo: "diretto", sedeId: "s-op", prodottoId: "BUF",
    fornitoreId: "f1", qty: 4, uomId: "u-conf", stato: "ordinato" }],
  movimenti: [], richiesteArchivio: undefined,
};

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
let esito = [];
const chk = (n, ok, extra = "") => { esito.push(ok); console.log(`[${ok ? "PASS" : "CHECK"}] ${n}${extra ? " | " + extra : ""}`); };

async function entra(nomeProfilo) {
  const p = await b.newPage({ viewport: { width: 440, height: 900 }, isMobile: true, hasTouch: true });
  const errs = [];
  p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(stato));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText(nomeProfilo, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1400);
  return { p, errs };
}
const leggi = (p) => p.evaluate(async () => JSON.parse((await window.storage.get("scp:stato:v1", true)).value));

/* ===== 1. EVASIONE dal laboratorio: escono solo confezioni intere ===== */
{
  const { p, errs } = await entra("Laboratorio");
  const nav = p.getByText("Richieste", { exact: true });
  for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
  await p.waitForTimeout(800);
  chk("la richiesta della linea è in attesa", await p.getByText("Bufala", { exact: false }).count() > 0);
  /* da gen-5.50 il tasto che apre la finestra si chiama «Cambia»: «Conferma»
     manda la quantità proposta senza aprire niente */
  await p.getByRole("button", { name: /Cambia/ }).first().click(); await p.waitForTimeout(700);
  const nota = await p.getByText(/si spedisce solo intero/).count() > 0;
  const interi = await p.getByText(/a pezzi interi/).count() > 0;
  chk("il modulo avvisa che si spedisce solo intero", nota && interi);
  /* nel laboratorio c'è 1,5 conf: il suggerito deve essere 1, non 1,5 */
  const campo = p.getByPlaceholder(/^1$|^1,5$|^0$/).first();
  const segnaposto = await campo.getAttribute("placeholder").catch(() => null);
  chk("il suggerito è una confezione intera", segnaposto === "1", `placeholder "${segnaposto}"`);
  const testo = (await p.locator("div").filter({ hasText: /Prelievo:/ }).last().innerText()).replace(/\n/g, " ");
  chk("l'anteprima dichiara il prelievo intero", /Prelievo:\s*1\s*conf/.test(testo), testo.slice(0, 120));
  await p.screenshot({ path: "i3-1-evasione.png" });
  /* provo a forzare 1,5: deve scendere a 1 */
  await campo.fill("1,5"); await p.waitForTimeout(300);
  const testo2 = (await p.locator("div").filter({ hasText: /Prelievo:/ }).last().innerText()).replace(/\n/g, " ");
  chk("scrivendo 1,5 il prelievo scende a 1", /Prelievo:\s*1\s*conf/.test(testo2), testo2.slice(0, 120));
  await p.getByRole("button", { name: /Evadi/ }).last().click(); await p.waitForTimeout(1000);
  const s = await leggi(p);
  const lab = s.magazzini.find((m) => m.id === "m-lab").articoli[0];
  const lin = s.magazzini.find((m) => m.id === "m-lin").articoli[0];
  const ric = s.richieste[0];
  chk("il laboratorio scende di 1 confezione intera", Math.abs(lab.qty - 0.5) < 1e-9, `lab ${lab.qty} conf`);
  chk("in linea arrivano 4 pz", Math.abs(lin.qty - 4) < 1e-9, `linea ${lin.qty} pz`);
  chk("la richiesta resta parziale", ric.stato === "parziale", `stato ${ric.stato}`);
  chk("nessun errore (evasione)", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

/* ===== 2. RICEZIONE: non arriva mezza confezione ===== */
{
  const { p, errs } = await entra("Admin");
  const nav = p.getByText("Ordini", { exact: true });
  for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
  await p.waitForTimeout(800);
  await p.getByRole("button", { name: /Ordinati · \d+/ }).click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: "Registra la merce arrivata" }).first().click(); await p.waitForTimeout(700);
  const nota = await p.getByText(/confezioni intere sono arrivate/).count() > 0;
  chk("il modulo di ricezione avvisa sulle confezioni intere", nota);
  const campo = p.getByPlaceholder("0").first();
  await campo.fill("2,4"); await p.waitForTimeout(400);
  const anteprima = (await p.locator("div").filter({ hasText: /si carica di/ }).last().innerText()).replace(/\n/g, " ");
  chk("2,4 conf diventano 2 confezioni intere", /si carica di 2 conf/.test(anteprima), anteprima.slice(0, 120));
  await p.screenshot({ path: "i3-2-ricezione.png" });
  await p.getByRole("button", { name: /Registra ricezione/ }).click(); await p.waitForTimeout(1000);
  const s = await leggi(p);
  const retro = s.magazzini.find((m) => m.id === "m-retro").articoli[0];
  const residuo = s.ordini.find((o) => o.stato === "da-ordinare");
  chk("il retro si carica di 2 conf intere", Math.abs(retro.qty - 2) < 1e-9, `retro ${retro.qty} conf`);
  chk("il residuo da riordinare è intero", residuo && Number.isInteger(residuo.qty) && residuo.qty === 2,
    residuo ? `residuo ${residuo.qty} conf` : "nessun residuo");
  chk("nessun errore (ricezione)", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

/* ===== 3. CONTEGGIO dell'operatore: si conta a pezzi interi e la
   richiesta al laboratorio sale alla confezione intera ===== */
{
  const { p, errs } = await entra("Operatore");
  const nav = p.getByText("Conteggi", { exact: true });
  for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
  await p.waitForTimeout(800);
  await p.getByRole("button", { name: /Conta ora/ }).first().click(); await p.waitForTimeout(700);
  chk("la scheda dice che il prodotto va a pezzi interi",
    await p.getByText("solo pezzi interi", { exact: false }).count() > 0);
  const campo = p.getByLabel("Conteggio Bufala");
  await campo.fill("1,5"); await p.waitForTimeout(300);
  await p.screenshot({ path: "i3-3-conteggio.png" });
  await p.getByRole("button", { name: /Verifica e conferma/ }).click(); await p.waitForTimeout(800);
  const riep = (await p.locator("div").filter({ hasText: /Richiesta al laboratorio/ }).last().innerText()).replace(/\n/g, " ");
  const paginaRiep = (await p.locator("body").innerText()).replace(/\n/g, " ");
  chk("nel riepilogo il conteggio è arrotondato a 2 pz", /2 di 8 pz/.test(paginaRiep),
    (paginaRiep.match(/.{0,20}di 8 pz/) || ["non trovato"])[0]);
  chk("la richiesta al laboratorio è di 2 conf intere", /2 conf/.test(riep), riep.slice(0, 140));
  chk("il riepilogo dichiara l'arrotondamento", /salita al pezzo intero/.test(riep), riep.slice(0, 160));
  await p.screenshot({ path: "i3-4-riepilogo.png" });
  await p.getByRole("button", { name: /Conferma tutto/ }).click(); await p.waitForTimeout(1200);
  const s = await leggi(p);
  const lin = s.magazzini.find((m) => m.id === "m-lin").articoli[0];
  const nuova = s.richieste.find((r) => r.id !== "ric-1");
  chk("la giacenza salvata è intera", lin.qty === 2, `linea ${lin.qty} pz`);
  chk("la richiesta creata è di 2 conf intere", nuova && nuova.qty === 2 && nuova.uomId === "u-conf",
    nuova ? `${nuova.qty} ${nuova.uomId}` : "nessuna richiesta");
  chk("il fabbisogno vero della linea resta 6 pz", nuova && Math.abs(nuova.qtyLinea - 6) < 1e-9,
    nuova ? `qtyLinea ${nuova.qtyLinea}` : "-");
  chk("nessun errore (conteggio)", errs.length === 0, errs.slice(0, 2).join(" | "));
  await p.close();
}

console.log("RESULT:", esito.every(Boolean) ? "PASS" : "CHECK");
await b.close();
