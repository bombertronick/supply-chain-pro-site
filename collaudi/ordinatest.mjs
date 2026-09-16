/* gen-5.93: le liste di prodotti si leggono in ORDINE, ovunque si scelga.

   CHIESTO DA VALERIO il 18 agosto: «quando seleziono un prodotto tra le
   scelte ho bisogno di vedere le scelte con una visualizzazione ordinata,
   [se no] si dovrà scorrere sempre una lunga lista di prodotti non
   ordinati. Risolvi questo problema anche nelle altre sezioni che
   possiedono questo stesso problema.»

   Misurato prima di correggere: nel file non c'era NESSUN ordinamento nei
   punti di scelta — ogni lista usciva nell'ordine di inserimento nello
   stato, cioè nell'ordine in cui i prodotti sono stati creati mesi fa. Su
   103 prodotti, trovare «Zucchine» voleva dire leggerli tutti.

   LA REGOLA SCELTA (e dichiarata): i PRODOTTI si ordinano per categoria
   (nell'ordine di stato.categorie, che è quello scelto da chi le ha
   create e usato in tutta l'app) e per nome dentro la categoria, con le
   regole dell'italiano (localeCompare "it"). Le CATEGORIE invece NON si
   alfabetizzano mai: il loro ordine è una scelta, non un caso — il §4
   difende proprio questo, perché «ordinare tutto» è il modo più rapido
   per rompere un ordine che qualcuno aveva voluto.

   Contro gen-5.92 i §1, §2 e §3 devono essere rossi. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
st.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") }];

/* il metro: la stessa regola calcolata QUI, sui dati del banco, senza
   passare dal codice dell'app — se no misurerei l'app con sé stessa */
const perIt = (a, b) => (a || "").localeCompare(b || "", "it", { sensitivity: "base" });
const nomeDi = (pid) => st.prodotti.find((p) => p.id === pid)?.nome || "—";
const attesoPerCategoria = (arts) => {
  const byCat = {};
  for (const a of arts) {
    const cid = st.prodotti.find((p) => p.id === a.prodottoId)?.categoriaId || "_";
    (byCat[cid] = byCat[cid] || []).push(nomeDi(a.prodottoId));
  }
  const fuori = [];
  for (const c of st.categorie) if (byCat[c.id]) fuori.push(...byCat[c.id].sort(perIt));
  if (byCat["_"]) fuori.push(...byCat["_"].sort(perIt));
  return fuori;
};

/* il magazzino più affollato: dove il disordine si paga di più */
const mag = [...st.magazzini].sort((a, b) => (b.articoli || []).length - (a.articoli || []).length)[0];
if ((mag.articoli || []).length < 6) throw new Error("banco povero: nessun magazzino con almeno 6 articoli");

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errs = [];
await ctx.addInitScript((j) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  const m = new Map(); m.set("scp:stato:v1", j);
  window.storage = {
    async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
    async set(k, v) { m.set(k, v); return true; },
    async delete(k) { m.delete(k); return true; },
  };
}, JSON.stringify(st));
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1500);

/* ═══ 1. IL DETTAGLIO DEL MAGAZZINO SI LEGGE IN ORDINE ═══
   Copre in un colpo tutto quello che passa da perCategoria: il dettaglio,
   i conteggi, le tre linguette della Plancia, l'inventario. */
console.log(`\n— 1. il dettaglio di «${mag.nome}» (${mag.articoli.length} articoli) è in ordine —`);
await vaiA(p, "Magazzini");
await p.getByText(mag.nome, { exact: true }).first().click(); await p.waitForTimeout(1100);
const visti = await p.evaluate(() =>
  [...document.querySelectorAll('main button[aria-label^="Storico "]')]
    .map((x) => x.getAttribute("aria-label").replace(/^Storico /, "")));
const attesi = attesoPerCategoria(mag.articoli);
ok(visti.length === attesi.length, `si vedono tutti gli articoli (${visti.length} su ${attesi.length})`);
ok(JSON.stringify(visti) === JSON.stringify(attesi),
  "in ordine: per categoria, e per nome dentro la categoria");
if (JSON.stringify(visti) !== JSON.stringify(attesi))
  console.log("      primi visti:  " + visti.slice(0, 5).join(" · ") + "\n      primi attesi: " + attesi.slice(0, 5).join(" · "));

/* ═══ 2. LA TENDINA «AGGIUNGI ARTICOLO»: GRUPPI E ALFABETO ═══
   È il caso peggiore di tutti: quasi tutto il catalogo in un solo select.
   Qui non basta l'alfabeto: servono i gruppi per categoria (optgroup),
   che il telefono mostra come intestazioni native nella tendina. */
console.log("\n— 2. la tendina «Aggiungi articolo» ha i gruppi e l'alfabeto —");
await p.getByRole("button", { name: /Aggiungi articolo/ }).first().click(); await p.waitForTimeout(900);
const tendina = await p.evaluate(() => {
  const s = [...document.querySelectorAll("select")].find((x) => x.querySelector("optgroup"))
    || [...document.querySelectorAll("select")].sort((a, b) => b.options.length - a.options.length)[0];
  if (!s) return null;
  return {
    gruppi: [...s.querySelectorAll("optgroup")].map((g) => ({
      label: g.label, voci: [...g.querySelectorAll("option")].map((o) => o.textContent) })),
    piatte: [...s.options].map((o) => o.textContent),
  };
});
ok(!!tendina, "la tendina esiste");
ok((tendina?.gruppi || []).length >= 2,
  `le voci sono raggruppate per categoria (${tendina?.gruppi?.length || 0} gruppi)`);
const nomiCat = st.categorie.map((c) => c.nome);
ok((tendina?.gruppi || []).every((g) => nomiCat.includes(g.label) || g.label === "Senza categoria"),
  "e i gruppi portano i nomi delle categorie");
const tuttiOrdinati = (tendina?.gruppi || []).every((g) =>
  JSON.stringify(g.voci) === JSON.stringify([...g.voci].sort(perIt)));
ok((tendina?.gruppi || []).length > 0 && tuttiOrdinati, "dentro ogni gruppo, alfabeto italiano");
/* i fogli si impilano (il dettaglio del magazzino è anch'esso un Foglio):
   la X giusta è l'ULTIMA, quella del foglio in cima. Due volte: prima il
   form, poi il dettaglio, per tornare alla schermata di fondo. */
await p.getByRole("button", { name: "Chiudi", exact: true }).last().click();
await p.waitForTimeout(500);
await p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
await p.waitForTimeout(700);

/* ═══ 3. IL CATALOGO: DENTRO OGNI CATEGORIA, ALFABETO ═══ */
console.log("\n— 3. il Catalogo si legge in ordine dentro ogni categoria —");
await vaiA(p, "Catalogo");
await p.waitForTimeout(600);
/* il Catalogo parte dalla linguetta «unità»: quella dei prodotti va scelta */
await p.getByText(/^Prodotti · \d+$/).first().click(); await p.waitForTimeout(700);
/* invece di indovinare i gruppi da aprire, si CERCA: mentre si cerca il
   Catalogo li apre da solo (sta scritto nel suo codice), quindi una lettera
   comune basta a vedere i prodotti di più categorie */
const cat0 = st.categorie[0];
await p.getByPlaceholder(/Cerca/).first().fill("a"); await p.waitForTimeout(900);
const nomiCatalogo = await p.evaluate(() =>
  [...document.querySelectorAll('main [aria-label^="Modifica "]')]
    .map((x) => x.getAttribute("aria-label").replace(/^Modifica /, "")));
const conA = st.prodotti.filter((x) => (x.nome || "").toLowerCase().includes("a"));
const attesiCat0 = conA.filter((x) => x.categoriaId === cat0.id).map((x) => x.nome).sort(perIt);
const inCat0 = nomiCatalogo.filter((n) => attesiCat0.includes(n));
ok(inCat0.length >= Math.min(4, attesiCat0.length),
  `il gruppo «${cat0.nome}» è visibile cercando (${inCat0.length} prodotti)`);
ok(JSON.stringify(inCat0) === JSON.stringify([...inCat0].sort(perIt)),
  "e i prodotti sono in alfabeto");
if (JSON.stringify(inCat0) !== JSON.stringify([...inCat0].sort(perIt)))
  console.log("      visti: " + inCat0.slice(0, 6).join(" · "));

/* ═══ 4. IL CONTROCONTROLLO: LE CATEGORIE NON SI ALFABETIZZANO ═══
   L'ordine delle categorie è una scelta di chi le ha create, usata
   identica in tutta l'app. Se questo controllo diventa rosso, ho
   «ordinato» anche quello che era già in un ordine voluto. */
console.log("\n— 4. e le categorie restano nell'ordine scelto, non in alfabeto —");
const intesteViste = (tendina?.gruppi || []).map((g) => g.label).filter((l) => l !== "Senza categoria");
const ordineScelto = nomiCat.filter((n) => intesteViste.includes(n));
ok(intesteViste.length > 0 && JSON.stringify(intesteViste) === JSON.stringify(ordineScelto),
  `i gruppi della tendina seguono l'ordine di stato.categorie (${intesteViste.join(" · ")})`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
