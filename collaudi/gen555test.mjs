/* gen-5.55: tre lavori.
   1) il laboratorio sa quanto è «in più», e in blocco copre prima i livelli
   2) un magazzino non si rifornisce più da se stesso
   3) i prodotti che non stanno in nessun magazzino si vedono e si sistemano

   La prova che conta sul primo è la seconda linea: con la vecchia passata sola
   la prima richiesta in elenco si portava via anche l'extra e l'ultima linea
   restava sotto il livello previsto. Qui devono finire entrambe a livello. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const LAB = base.sedi.find((x) => x.tipo === "laboratorio");
const [FM, RM] = base.sedi.filter((x) => x.tipo === "operatore");
const [PA, PB] = base.prodotti;
const PAR = 3, IN_PIU = 2, IN_LAB = 6;

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin, seme, dove, largo = 390) => {
  const ctx = await b.newContext({ viewport: { width: largo, height: 830 },
    isMobile: largo < 700, hasTouch: largo < 700, deviceScaleFactor: 2 });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(seme));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(URL); await p.waitForTimeout(1600);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
  await p.waitForTimeout(1600);
  if (dove) await vaiA(p, dove);
  return { p, ctx };
};
const letto = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const qtyDi = (st, magId, pid) => st.magazzini.find((m) => m.id === magId)
  .articoli.find((a) => a.prodottoId === pid).qty;

/* ═══════════ 1. IL LIVELLO PRIMA DELL'EXTRA ═══════════ */
console.log("\n— 1. il laboratorio sa quanto è «in più» —");
/* la scena: due linee in due sedi diverse, entrambe rifornite dallo stesso
   laboratorio, che ha 6 pezzi. La prima chiede 3 di livello + 2 in più, la
   seconda 3 di livello. Chiesti 8, disponibili 6: non bastano. */
const s1 = JSON.parse(JSON.stringify(base));
const magLab = s1.magazzini.find((m) => m.tipo === "laboratorio");
const lineaA = s1.magazzini.find((m) => m.tipo === "linea-lab");
const lineaB = { id: "mag-linea-b", sedeId: RM.id, nome: "Linea rm", tipo: "linea-lab",
  articoli: [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 0, par: PAR }] };
lineaA.articoli = [{ prodottoId: PA.id, uomId: PA.uomBase, qty: PAR, par: PAR }];
magLab.articoli = [{ prodottoId: PA.id, uomId: PA.uomBase, qty: IN_LAB, par: 30 }];
s1.magazzini = [magLab, lineaA, lineaB];
/* la richiesta della seconda linea la metto già fatta: quella della prima la
   creo dall'app, così provo anche che l'extra viene davvero salvato */
s1.richieste = [{
  id: "ric-b", t: Date.now() - 60000, daSedeId: RM.id, aSedeLabId: LAB.id,
  daMagazzinoId: lineaB.id, magNome: lineaB.nome, prodottoId: PA.id,
  qty: PAR, uomId: PA.uomBase, qtyLinea: PAR, uomLineaId: PA.uomBase,
  stato: "in-attesa", creataDa: "Rm",
}];
s1.ordini = []; s1.movimenti = []; s1.log = []; s1.codici = []; s1.accessi = [];
s1.profili = [
  { id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [lineaA.id], pinHash: hash("2222") },
  { id: "pr-lab", nome: "Lab", ruolo: "laboratorio", sedeId: LAB.id, colore: "#22B8CF",
    magazziniIds: [magLab.id], pinHash: hash("3333") },
];

const O = await apri("Op", "2222", s1, "Conteggi");
await O.p.getByRole("button", { name: /Conta ora/ }).first().click();
await O.p.waitForTimeout(1100);
const meno = O.p.locator('button[aria-label="Diminuisci"]').first();
for (let i = 0; i < IN_PIU; i++) { await meno.click(); await O.p.waitForTimeout(150); }
await O.p.getByRole("button", { name: /Verifica e conferma/ }).click();
await O.p.waitForTimeout(1100);
await O.p.getByRole("button", { name: /Conferma tutto/ }).click();
await O.p.waitForTimeout(2200);

const d1 = await letto(O.p);
const ricA = d1.richieste.find((r) => r.daMagazzinoId === lineaA.id);
ok(ricA?.extraLinea === IN_PIU,
  `la richiesta porta con sé l'extra (extraLinea ${ricA?.extraLinea})`);
ok(ricA?.qtyLivello === PAR,
  `e la parte di livello, tenuta separata (qtyLivello ${ricA?.qtyLivello})`);
const ricB = d1.richieste.find((r) => r.id === "ric-b");
ok(ricB.extraLinea == null,
  "una richiesta senza extra non si porta dietro campi a zero");
await O.ctx.close();

const L = await apri("Lab", "3333", d1, "Richieste");
const tL = (await L.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(new RegExp(`${PAR} di livello \\+ ${IN_PIU} in più`).test(tL),
  `il laboratorio legge quanto è livello e quanto è extra («${PAR} di livello + ${IN_PIU} in più»)`);
ok(/Prima il livello di tutte le linee/.test(tL),
  "e il tasto in blocco dice che copre prima i livelli");
await L.p.screenshot({ path: "g555-1-lab.png", fullPage: true });

/* ── LA PROVA CHE CONTA ── */
await L.p.locator("button", { hasText: "Confermo tutto" }).first().click();
await L.p.waitForTimeout(800);
await L.p.getByRole("button", { name: /^Confermo|^Conferma/ }).last().click();
await L.p.waitForTimeout(2400);

const d2 = await letto(L.p);
const qA = qtyDi(d2, lineaA.id, PA.id), qB = qtyDi(d2, lineaB.id, PA.id);
ok(qA === PAR, `la linea che aveva chiesto l'extra resta al suo livello: ${qA} (non ${PAR + IN_PIU})`);
ok(qB === PAR, `e la seconda linea arriva al suo livello: ${qB} (con la passata sola sarebbe rimasta a 1)`);
/* la proprietà, non solo i due numeri: nessuno prende più del livello finché
   qualcun altro è sotto il suo */
const sotto = [[lineaA.id, qA], [lineaB.id, qB]].filter(([, q]) => q < PAR);
const sopra = [[lineaA.id, qA], [lineaB.id, qB]].filter(([, q]) => q > PAR);
ok(!(sotto.length && sopra.length),
  `nessuna linea ha preso l'extra mentre un'altra era sotto il livello (${sotto.length} sotto, ${sopra.length} sopra)`);
ok(qtyDi(d2, magLab.id, PA.id) === 0, `il laboratorio si è svuotato dei ${IN_LAB} che aveva`);
ok(d2.movimenti.every((m) => m.dopo >= -1e-9), "nessun movimento lascia una giacenza negativa");
await L.p.screenshot({ path: "g555-2-dopo.png", fullPage: true });
await L.ctx.close();

/* ═══════════ 2. NIENTE MAGAZZINI CHE SI RIFORNISCONO DA SÉ ═══════════ */
console.log("\n— 2. un magazzino non si rifornisce da se stesso —");
/* 2a: un retro assegnato per sbaglio. Non deve comparire fra i contabili. */
const s2 = JSON.parse(JSON.stringify(base));
const retro2 = s2.magazzini.find((m) => m.tipo === "retro");
retro2.sedeId = FM.id;
retro2.articoli = [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 10, par: 8 }];
/* e una linea-retro il cui riferimento punta a se stessa: la schermata non
   basta a fermare questo caso, lo deve fermare il conto */
const lineaSe = { id: "mag-linea-se", sedeId: RM.id, nome: "Linea avvitata rm", tipo: "linea-retro",
  rifMagazzinoId: "mag-linea-se",
  articoli: [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 2, par: 8 }] };
s2.magazzini = [retro2, lineaSe];
s2.richieste = []; s2.ordini = []; s2.movimenti = []; s2.log = []; s2.codici = []; s2.accessi = [];
s2.profili = [
  { id: "pr-op2", nome: "Op", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [retro2.id], pinHash: hash("2222") },
  { id: "pr-op3", nome: "Rm", ruolo: "operatore", sedeId: RM.id, colore: "#E8A13C",
    magazziniIds: [lineaSe.id], pinHash: hash("4444") },
];

const C = await apri("Op", "2222", s2, "Conteggi");
const tC = (await C.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(new RegExp(`«${retro2.nome}» non è una linea`).test(tC),
  `il retro assegnato per sbaglio non si conta, e l'app dice quale è («${retro2.nome}»)`);
ok(/rifornire se stesso/.test(tC), "spiegando anche perché");
ok(/usa l'Inventario|usa l'.?Inventario/.test(tC), "e dove andare invece: l'Inventario");
ok(await C.p.getByRole("button", { name: /Conta ora/ }).count() === 0,
  "e non c'è nessun tasto per contarlo");
await C.p.screenshot({ path: "g555-3-non-linea.png", fullPage: true });
await C.ctx.close();

/* 2b: la linea avvitata su se stessa */
const R = await apri("Rm", "4444", s2, "Conteggi");
await R.p.getByRole("button", { name: /Conta ora/ }).first().click();
await R.p.waitForTimeout(1100);
/* conto 1 dove ce n'erano 2: così un movimento di conteggio si scrive
   davvero e si vede che NON ne nascono altri. Contando 2, cioè quanto già
   c'era, registraMov non scrive niente (delta zero) e il controllo sarebbe
   passato per il motivo sbagliato. */
await R.p.locator('input[aria-label^="Conteggio"]').first().fill("1");
await R.p.waitForTimeout(300);
await R.p.getByRole("button", { name: /Verifica e conferma/ }).click();
await R.p.waitForTimeout(1100);
const tR = (await R.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/non ha un magazzino di retro che la rifornisca/.test(tR),
  "una linea che punta a se stessa lo dice, invece di prelevare da sé");
ok(!/Dal retro/.test(tR), "e non annuncia nessun prelievo");
await R.p.screenshot({ path: "g555-4-avvitata.png", fullPage: true });
await R.p.getByRole("button", { name: /Conferma tutto/ }).click();
await R.p.waitForTimeout(2200);

const d3 = await letto(R.p);
const caus = d3.movimenti.map((m) => m.causale).sort();
ok(JSON.stringify(caus) === JSON.stringify(["conteggio"]),
  `si scrive solo il conteggio: nessun prelievo o carico inventato (${caus.join(", ") || "nessuno"})`);
ok((d3.ordini || []).length === 0,
  `e non nasce nessuna riga d'ordine che nessuno ha chiesto (${(d3.ordini || []).length})`);
ok(qtyDi(d3, lineaSe.id, PA.id) === 1, "la giacenza è quella contata e basta");
await R.ctx.close();

/* ═══════════ 3. I PRODOTTI IN NESSUN MAGAZZINO ═══════════ */
console.log("\n— 3. i prodotti che non stanno in nessun magazzino —");
const s3 = JSON.parse(JSON.stringify(base));
const retro3 = s3.magazzini.find((m) => m.tipo === "retro");
retro3.articoli = [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 4, par: 4 }];
s3.magazzini = [retro3];
/* PB e PC restano a catalogo senza stare in nessuna casella */
const PC = s3.prodotti[2];
s3.prodotti = [PA, PB, PC].map((p) => JSON.parse(JSON.stringify(p)));
s3.richieste = []; s3.ordini = []; s3.movimenti = []; s3.log = []; s3.codici = []; s3.accessi = [];
s3.profili = [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];

const A = await apri("Admin", "1234", s3, "Plancia");
const tP = (await A.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/2 in nessun magazzino/.test(tP),
  `nella Plancia la pastiglia conta quanti sono («${/\d+ in nessun magazzino/.exec(tP)?.[0] ?? "?"}»)`);
await A.p.getByRole("button", { name: /in nessun magazzino/ }).first().click();
await A.p.waitForTimeout(700);
const tP2 = (await A.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(new RegExp(PB.nome).test(tP2) && new RegExp(PC.nome).test(tP2),
  `e aperta li nomina tutti (${PB.nome}, ${PC.nome})`);
ok(/nessuno li conta/i.test(tP2), "dicendo perché è un problema");
await A.p.screenshot({ path: "g555-5-plancia.png", fullPage: true });

/* e nel Catalogo si sistemano */
await vaiA(A.p, "Catalogo");
await A.p.getByText(/^Prodotti · /).first().click(); await A.p.waitForTimeout(900);
const tK = (await A.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/2 prodotti non stanno in nessun magazzino/.test(tK),
  "in Catalogo c'è l'avviso, dove si aggiustano");
const mostra = A.p.getByRole("button", { name: /Mostra solo questi 2/ });
ok(await mostra.count() === 1, "con un tasto per vedere solo quelli");
await mostra.click(); await A.p.waitForTimeout(900);
const righe = A.p.locator('[aria-label^="Modifica"]');
ok(await righe.count() === 2, `toccandolo l'elenco mostra solo i 2 (${await righe.count()})`);
ok(/solo quelli in nessun magazzino/.test(await A.p.locator("body").innerText()),
  "e si legge che il filtro è acceso");
await A.p.screenshot({ path: "g555-6-catalogo.png", fullPage: true });

/* la trappola: se li sistemo tutti col filtro acceso, l'elenco non deve
   restare vuoto senza via d'uscita */
for (const nome of [PB.nome, PC.nome]) {
  await A.p.locator(`[aria-label="Elimina ${nome}"]`).first().click();
  await A.p.waitForTimeout(1000);
  const fg = A.p.locator(".fixed.inset-0.z-50").last();
  await fg.getByRole("button", { name: /^Elimina$/ }).first().click();
  await A.p.waitForTimeout(1700);
}
const d4 = await letto(A.p);
ok(d4.prodotti.length === 1, `tolti entrambi, resta un prodotto solo (${d4.prodotti.length})`);
ok(!/solo quelli in nessun magazzino/.test(await A.p.locator("body").innerText()),
  "il filtro si spegne da solo quando non c'è più niente da filtrare");
ok(await A.p.getByRole("button", { name: /Mostra solo questi/ }).count() === 0,
  "e l'avviso col suo tasto sparisce");
/* Spento il filtro i gruppi tornano chiusi, che è il comportamento normale del
   Catalogo: contare le righe adesso darebbe zero per quel motivo, non perché
   l'elenco sia rimasto vuoto. Quindi apro i gruppi e guardo lì. */
const gruppi = A.p.locator('button[aria-expanded="false"]');
for (let i = await gruppi.count(); i > 0; i--) { await gruppi.first().click(); await A.p.waitForTimeout(300); }
const dopoFiltro = await A.p.locator('[aria-label^="Modifica"]').count();
ok(dopoFiltro === 1,
  `e il prodotto che resta è ancora nell'elenco (${dopoFiltro}): niente trappola a elenco vuoto`);
await A.p.screenshot({ path: "g555-7-trappola.png", fullPage: true });
await A.ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs.join(" | ") : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
