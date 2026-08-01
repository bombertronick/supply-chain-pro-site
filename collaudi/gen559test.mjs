/* gen-5.59: le anagrafiche dicono quanto sono usate, e da lì si rinomina e basta.

   Tre cose da provare, e la terza è quella che conta:
   1) unità, categorie e fornitori dicono se sono in uso e SU QUANTI — non su
      chi: il numero serve a decidere, l'elenco dei nomi no;
   2) il conto del fornitore include le eccezioni di sede (fornSede): prima le
      saltava, e un fornitore vivo su una sola sede risultava «0 prodotti»;
   3) da questa schermata non si modifica più niente oltre al nome. Il tasto
      «Sposta ed elimina» cambiava il fornitore a decine di prodotti con un
      menù a tendina e un tocco, senza far vedere quali. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const [FM] = base.sedi.filter((x) => x.tipo === "operatore");
const [PA, PB, PC] = base.prodotti;
const [F1, F2] = base.fornitori;
const [C1, C2] = base.categorie;
const UPZ = base.unita.find((u) => u.simbolo === "pz").id;
const UKG = base.unita.find((u) => u.simbolo === "kg").id;

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (seme, tab) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(seme));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(1600);
  await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
  await p.waitForTimeout(1600);
  await vaiA(p, "Catalogo");
  if (tab) { await p.getByText(new RegExp(`^${tab} · \\d+$`)).click(); await p.waitForTimeout(800); }
  return { p, ctx };
};
const letto = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const testo = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");

/* la scena: PA e PB sul fornitore 1 (uno dei due solo come eccezione di sede),
   PC senza nessuno; una categoria piena e una vuota; un'unità usata e una no */
const s = JSON.parse(JSON.stringify(base));
const retro = s.magazzini.find((m) => m.tipo === "retro");
retro.sedeId = FM.id; retro.nome = "Secco fm";
retro.articoli = [
  { prodottoId: PA.id, uomId: UPZ, qty: 5, par: 5 },
  { prodottoId: PB.id, uomId: UPZ, qty: 2, par: 4 },
];
s.magazzini = [retro];
s.prodotti = s.prodotti.slice(0, 3).map((p, i) => ({
  ...p, categoriaId: i < 2 ? C1.id : null, fornitoreId: i === 0 ? F1.id : null,
  uomBase: UPZ, ...(i === 1 ? { fornSede: { [FM.id]: F1.id } } : {}),
}));
s.ordini = []; s.richieste = []; s.movimenti = []; s.log = []; s.codici = []; s.accessi = [];
s.profili = [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];

/* ═══════════ 1. FORNITORI: IN USO, E SU QUANTI ═══════════ */
console.log("\n— 1. fornitori —");
const A1 = await apri(s, "Fornitori");
const t1 = await testo(A1.p);
/* PA ce l'ha come fornitore abituale, PB solo come eccezione di sede: due */
ok(/In uso · 2 prodotti/.test(t1),
  `«${F1.nome}» dice «In uso · 2 prodotti»: conta anche l'eccezione di sede, che prima spariva`);
ok(new RegExp(`${F2.nome}[\\s\\S]{0,40}Non ancora utilizzato`).test(t1),
  `«${F2.nome}», che non fornisce niente, dice «Non ancora utilizzato»`);
ok(!new RegExp(PA.nome).test(t1) && !new RegExp(PB.nome).test(t1),
  "e non fa vedere CHI: nessun nome di prodotto nell'elenco");
await A1.p.screenshot({ path: "g559-1-fornitori.png", fullPage: true });

/* il cestino su un fornitore in uso non sposta più niente */
await A1.p.getByRole("button", { name: `Elimina ${F1.nome}` }).click(); await A1.p.waitForTimeout(900);
const t1b = await testo(A1.p);
ok(/2 prodotti usano/.test(t1b), "il cestino dice quanti prodotti lo usano");
ok(/non si può togliere/.test(t1b), "e che quindi non si toglie");
ok(await A1.p.getByRole("button", { name: /Sposta ed elimina/ }).count() === 0,
  "«Sposta ed elimina» non c'è più: non si spostano decine di prodotti da un elenco di anagrafiche");
ok(/Modifica in blocco/.test(t1b), "e dice dove si spostano davvero");
await A1.p.screenshot({ path: "g559-2-cestino.png", fullPage: true });
await A1.p.getByRole("button", { name: /Ho capito/ }).click(); await A1.p.waitForTimeout(600);

/* rinominare invece si può, e non tocca i collegamenti */
await A1.p.getByRole("button", { name: `Modifica ${F1.nome}` }).click(); await A1.p.waitForTimeout(900);
ok(/è in uso su 2 prodotti/.test(await testo(A1.p)), "aprendo la modifica, dice su quanti è in uso");
await A1.p.locator(".fixed.inset-0.z-50 input").first().fill("Verdurificio"); await A1.p.waitForTimeout(200);
await A1.p.getByRole("button", { name: /^Salva$/ }).click(); await A1.p.waitForTimeout(1500);
const d1 = await letto(A1.p);
ok(d1.fornitori.find((f) => f.id === F1.id)?.nome === "Verdurificio", "il nome si cambia");
ok(d1.prodotti.find((p) => p.id === PA.id)?.fornitoreId === F1.id,
  "e i prodotti restano collegati: il legame è l'id, non il nome");
ok(d1.prodotti.find((p) => p.id === PB.id)?.fornSede?.[FM.id] === F1.id,
  "eccezione di sede compresa");
await A1.ctx.close();

/* ═══════════ 2. CATEGORIE ═══════════ */
console.log("\n— 2. categorie —");
const A2 = await apri(s, "Categorie");
const t2 = await testo(A2.p);
ok(new RegExp(`${C1.nome}[\\s\\S]{0,40}In uso · 2 prodotti`).test(t2),
  `«${C1.nome}» dice «In uso · 2 prodotti»`);
ok(new RegExp(`${C2.nome}[\\s\\S]{0,40}Non ancora utilizzata`).test(t2),
  `«${C2.nome}», vuota, dice «Non ancora utilizzata»`);

/* il colore di una categoria in uso è bloccato: cambiarlo cambierebbe come si
   riconoscono i prodotti in tutta l'app */
await A2.p.getByRole("button", { name: `Modifica ${C1.nome}` }).click(); await A2.p.waitForTimeout(900);
const t2b = await testo(A2.p);
ok(/è in uso su 2 prodotti/.test(t2b), "la modifica dice su quanti è in uso");
ok(await A2.p.getByRole("button", { name: /^Colore #/ }).count() === 0,
  "e la tavolozza non c'è: in uso si cambia solo il nome");
await A2.p.getByRole("button", { name: /Annulla/ }).click(); await A2.p.waitForTimeout(600);

/* su una categoria vuota invece si può tutto: non c'è niente da rompere */
await A2.p.getByRole("button", { name: `Modifica ${C2.nome}` }).click(); await A2.p.waitForTimeout(900);
ok(await A2.p.getByRole("button", { name: /^Colore #/ }).count() > 0,
  "su una categoria non ancora usata la tavolozza c'è: non c'è niente da rompere");
await A2.p.getByRole("button", { name: /Annulla/ }).click(); await A2.p.waitForTimeout(600);
await A2.p.screenshot({ path: "g559-3-categorie.png", fullPage: true });
await A2.ctx.close();

/* ═══════════ 3. UNITÀ ═══════════ */
console.log("\n— 3. unità di misura —");
const A3 = await apri(s, "Unità");
const t3 = await testo(A3.p);
/* pz: 3 prodotti (uomBase) + 2 caselle di magazzino */
ok(/In uso · 3 prodotti · 2 caselle/.test(t3),
  "«pz» dice su quanti prodotti e su quante caselle di magazzino è in uso");
ok(/Non ancora utilizzata/.test(t3), "e quelle non usate lo dicono");
await A3.p.screenshot({ path: "g559-4-unita.png", fullPage: true });

await A3.p.getByRole("button", { name: "Modifica Pezzo" }).click(); await A3.p.waitForTimeout(900);
const t3b = await testo(A3.p);
ok(/è in uso su 3 prodotti · 2 caselle di magazzino/.test(t3b), "la modifica dice dove è in uso");
ok(/cambiarlo le farebbe dire un'altra cosa/.test(t3b), "e perché il simbolo è bloccato");
/* il simbolo non è più un campo che si scrive */
const campi3 = await A3.p.locator(".fixed.inset-0.z-50 input").count();
ok(campi3 === 1, "resta un campo solo da riempire: il nome");
await A3.p.getByRole("button", { name: /Annulla/ }).click(); await A3.p.waitForTimeout(600);

/* un'unità non usata resta modificabile per intero */
const nonUsata = base.unita.find((u) => u.id !== UPZ && u.id !== UKG);
await A3.p.getByRole("button", { name: `Modifica ${nonUsata.nome}` }).click(); await A3.p.waitForTimeout(900);
ok(await A3.p.locator(".fixed.inset-0.z-50 input").count() === 2,
  `«${nonUsata.nome}», che non usa nessuno, ha ancora nome e simbolo`);
await A3.p.getByRole("button", { name: /Annulla/ }).click(); await A3.p.waitForTimeout(600);
await A3.ctx.close();

/* ═══════════ 4. QUELLO CHE NON È COLLEGATO SI TOGLIE ANCORA ═══════════ */
console.log("\n— 4. quello che non serve si toglie ancora —");
const A4 = await apri(s, "Categorie");
await A4.p.getByRole("button", { name: `Elimina ${C2.nome}` }).click(); await A4.p.waitForTimeout(900);
ok(/Nessun prodotto collegato/.test(await testo(A4.p)),
  "una categoria vuota si elimina come prima: il blocco vale solo per quello che è in uso");
await A4.p.getByRole("button", { name: /^Elimina$/ }).click(); await A4.p.waitForTimeout(1500);
const d4 = await letto(A4.p);
ok(!d4.categorie.some((c) => c.id === C2.id), "e sparisce davvero");
ok(d4.prodotti.filter((p) => p.categoriaId === C1.id).length === 2,
  "senza toccare i prodotti dell'altra categoria");
await A4.ctx.close();

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 8)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
