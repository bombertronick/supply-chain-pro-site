/* gen-5.53: il fornitore sede per sede, e l'inventario guidato.
   La prova che conta sul primo è l'ultima: un ordine generato in una sede con
   l'eccezione deve uscire indirizzato all'altro fornitore, perché è quello il
   guasto (i messaggi WhatsApp partivano verso chi non vende quella roba). */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

/* ── la scena: due sedi operatore, un retro per ciascuna con lo stesso
      prodotto sotto scorta. Il fornitore abituale è «Verdure»; a Rm quel
      prodotto lo comprano da «Carne». ── */
const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
const [FM, RM] = s.sedi.filter((x) => x.tipo === "operatore");
const [PA, PB] = s.prodotti;
const F1 = s.fornitori[0], F2 = s.fornitori[1];
PA.fornitoreId = F1.id;
PB.fornitoreId = F1.id;
const retroFm = s.magazzini.find((m) => m.tipo === "retro" && m.sedeId === FM.id);
/* il seme ha i retro solo su fm: per provare la differenza fra sedi me ne
   serve uno anche su rm, se no non c'è niente da distinguere */
const retroRm = { id: "mag-retro-rm", sedeId: RM.id, nome: "Secco rm", tipo: "retro", articoli: [] };
s.magazzini.push(retroRm);
for (const m of [retroFm, retroRm]) {
  m.articoli = [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 1, par: 10 },
                { prodottoId: PB.id, uomId: PB.uomBase, qty: 2, par: 8 }];
}
s.ordini = []; s.movimenti = []; s.log = []; s.richieste = []; s.codici = []; s.accessi = [];
s.profili = [
  { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  { id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: FM.id, colore: "#E8A13C",
    magazziniIds: [retroFm.id], pinHash: hash("2222") },
];

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin, largo = 390) => {
  const ctx = await b.newContext({ viewport: { width: largo, height: 800 },
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
const letto = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
/* Da gen-5.56 l'inventario in corso è uno per sede: l'admin, che non ha sede,
   sta sotto «_tutte». La vecchia chiave unica resta letta per i giri aperti
   prima dell'aggiornamento. */
const invDi = (st, sedeId) => (st.invCorso || {})[sedeId || "_tutte"] || st.inventario || null;

const A = await apri("Admin", "1234");

/* ═══════════ 1. IL FORNITORE, SEDE PER SEDE ═══════════ */
console.log("\n— 1. fornitori diversi per sede —");
await vaiA(A.p, "Catalogo");
await A.p.getByText(/^Prodotti · /).first().click(); await A.p.waitForTimeout(900);
/* apro il gruppo del prodotto e poi la sua scheda */
const gr = A.p.locator('button[aria-expanded="false"]');
for (let i = 0; i < await gr.count(); i++) { await gr.nth(0).click(); await A.p.waitForTimeout(300); }
await A.p.locator(`[aria-label="Modifica ${PA.nome}"]`).first().click(); await A.p.waitForTimeout(1000);

const fg = A.p.locator(".fixed.inset-0.z-50").last();
const t1 = await fg.innerText();
ok(/Fornitore abituale/.test(t1), "la scheda distingue il «Fornitore abituale»");
ok(/Dove si compra altrove/.test(t1), "e sotto c'è dove si compra altrove");
ok(/nessuna eccezione/.test(t1), "che parte da zero eccezioni");
const selRm = fg.locator(`select[aria-label="Fornitore per ${RM.nome}"]`);
ok(await selRm.count() === 1, `c'è una riga per ogni sede (${RM.nome})`);
ok((await selRm.inputValue()) === "", "e parte da «come sopra»");
await A.p.screenshot({ path: "g553-1-scheda.png", fullPage: true });

await selRm.selectOption(F2.id); await A.p.waitForTimeout(400);
ok(/1 sede diversa/.test(await fg.innerText()), "scegliendone uno, il conto sale a 1");
await fg.getByRole("button", { name: /Salva/ }).first().click(); await A.p.waitForTimeout(1600);

const d1 = await letto(A.p);
const pa1 = d1.prodotti.find((x) => x.id === PA.id);
ok(pa1.fornSede?.[RM.id] === F2.id, `l'eccezione è salvata: a ${RM.nome} da «${F2.nome}»`);
ok(pa1.fornSede?.[FM.id] == null, "e su Fm non è stato scritto niente: vale l'abituale");
ok(pa1.fornitoreId === F1.id, "il fornitore abituale non è cambiato");
const t1b = await A.p.locator("body").innerText();
ok(/\(\+1 sede diversa\)/.test(t1b), "e nell'elenco del Catalogo si vede che c'è un'eccezione");

/* ── LA PROVA CHE CONTA: l'ordine esce indirizzato bene, sede per sede ── */
await vaiA(A.p, "Ordini");
await A.p.getByText(/^Ricalcola$/).first().click(); await A.p.waitForTimeout(2000);
const d2 = await letto(A.p);
const ordFm = d2.ordini.find((o) => o.prodottoId === PA.id && o.sedeId === FM.id);
const ordRm = d2.ordini.find((o) => o.prodottoId === PA.id && o.sedeId === RM.id);
ok(!!ordFm && !!ordRm, "il ricalcolo crea la riga in entrambe le sedi");
ok(ordFm?.fornitoreId === F1.id, `la riga di ${FM.nome} va a «${F1.nome}» (l'abituale)`);
ok(ordRm?.fornitoreId === F2.id, `la riga di ${RM.nome} va a «${F2.nome}»: l'eccezione ha funzionato`);
/* e l'altro prodotto, senza eccezioni, resta all'abituale in tutte le sedi */
const altre = d2.ordini.filter((o) => o.prodottoId === PB.id);
ok(altre.length > 0 && altre.every((o) => o.fornitoreId === F1.id),
  `«${PB.nome}», che non ha eccezioni, va all'abituale in tutte le sedi (${altre.length} righe)`);
const t2 = await A.p.locator("body").innerText();
ok(new RegExp(F2.nome).test(t2), `e in Ordini compare il gruppo «${F2.nome}»`);
await A.p.screenshot({ path: "g553-2-ordini.png", fullPage: true });

/* un fornitore usato SOLO come eccezione non deve sembrare cancellabile senza avvisi */
await vaiA(A.p, "Catalogo");
await A.p.getByText(/^Fornitori · /).first().click(); await A.p.waitForTimeout(800);
/* l'etichetta è «Elimina», non «Rimuovi»; e niente .catch() qui: se il clic
   non riesce devo vederlo, non scoprirlo dopo da un controllo che passa per
   caso su un pezzo di testo qualunque della pagina */
await A.p.locator(`[aria-label="Elimina ${F2.nome}"]`).first().click();
await A.p.waitForTimeout(1100);
/* La cosa da proteggere è sempre la stessa: un fornitore usato SOLO come
   eccezione di sede non deve sparire in silenzio. Da gen-5.59 però il foglio
   non elenca più i nomi e non sposta più niente da qui — dice quanti sono e
   manda su «Modifica in blocco», dove i prodotti si vedono uno per uno mentre
   li tocchi. Il controllo segue il comportamento nuovo, non quello vecchio. */
const fdel = A.p.locator(".fixed.inset-0.z-50").last();
const t3 = await fdel.innerText().catch(() => "");
ok(/non si può togliere/.test(t3),
  "un fornitore usato solo come eccezione di sede non si cancella");
ok(/Modifica in blocco/.test(t3),
  "e l'app dice dove si spostano davvero quei prodotti");
ok(!/Sposta ed elimina/.test(t3),
  "senza più il tasto che li spostava tutti insieme senza farli vedere");
/* singolare o plurale dipende da quanti sono: nel seme altri prodotti possono
   già avere quel fornitore come abituale, quindi accetto entrambe le forme */
const quanti = /(\d+)\s+prodott(?:o usa|i usano)/.exec(t3.replace(/\n/g, " "));
ok(!!quanti, `dicendo quanti prodotti lo usano (${quanti?.[1] ?? "non trovato"})`);
await A.p.locator('[aria-label="Chiudi"]').last().click();
await A.p.waitForTimeout(800);

/* ═══════════ 2. INVENTARIO GUIDATO ═══════════ */
console.log("\n— 2. inventario guidato —");
await vaiA(A.p, "Magazzini");
const bInv = A.p.getByRole("button", { name: /^Inventario$/ });
ok(await bInv.count() === 1, "in Magazzini c'è il tasto «Inventario»");
await bInv.click(); await A.p.waitForTimeout(1000);
const fi = A.p.locator(".fixed.inset-0.z-50").last();
/* Da gen-5.57 l'admin scegli prima la sede: qui serve «tutte le sedi». */
if (await fi.getByText(/Tutte le sedi in un giro solo/).count()) {
  await fi.getByText(/Tutte le sedi in un giro solo/).click();
  await A.p.waitForTimeout(900);
}
const ti = await fi.innerText();
ok(/corregge le giacenze/.test(ti) && /non\s+fa partire né richieste né ordini/.test(ti.replace(/\n/g, " ")),
  "che spiega la differenza col conteggio: corregge, non ordina");
await A.p.screenshot({ path: "g553-3-inv-avvio.png", fullPage: true });
await fi.getByRole("button", { name: /Avvia inventario/ }).click(); await A.p.waitForTimeout(1600);

const d3 = await letto(A.p);
const inv3 = invDi(d3);
ok(!!inv3, "l'inventario avviato è salvato nei dati, non solo a schermo");
ok((inv3.magIds || []).length > 0, `con ${inv3.magIds.length} magazzini in elenco`);
const tinv = await fi.innerText();
ok(/0 caselle contate/.test(tinv), "e parte da zero contate");

/* entro in un magazzino e conto due caselle */
await fi.getByText(retroFm.nome, { exact: true }).first().click(); await A.p.waitForTimeout(1100);
const campoA = fi.locator(`input[aria-label="Contato di ${PA.nome} in ${retroFm.nome}"]`);
ok(await campoA.count() === 1, "dentro il magazzino c'è un campo per ogni casella");
const tc = await fi.innerText();
ok(/l'app dice 1/.test(tc), "che mostra accanto quello che l'app credeva");
ok(/Quello che lasci vuoto resta com'è/.test(tc), "e dice che il vuoto non tocca niente");
await campoA.fill("7"); await A.p.waitForTimeout(300);
await fi.locator(`input[aria-label="Contato di ${PB.nome} in ${retroFm.nome}"]`).fill("2");
await A.p.waitForTimeout(300);
await A.p.screenshot({ path: "g553-4-inv-conta.png", fullPage: true });
await fi.getByRole("button", { name: /Magazzino fatto/ }).click(); await A.p.waitForTimeout(1800);

const d4 = await letto(A.p);
const inv4 = invDi(d4);
ok(inv4.valori[`${retroFm.id}|${PA.id}`] === 7, "il 7 è salvato");
ok(inv4.valori[`${retroFm.id}|${PB.id}`] === 2, "e anche il 2, che però è uguale a prima");
ok((inv4.chiusi || []).includes(retroFm.id), "il magazzino risulta fatto");
/* e le giacenze NON sono ancora state toccate */
const artPrima = d4.magazzini.find((m) => m.id === retroFm.id).articoli.find((a) => a.prodottoId === PA.id);
ok(artPrima.qty === 1, "la giacenza NON è ancora cambiata: si scrive solo alla fine");

const t4 = await fi.innerText();
ok(/1 differenza finora/.test(t4), "il riepilogo conta una differenza sola, non due");
ok(/fatto/.test(t4), "e il magazzino contato è segnato fatto");
await A.p.screenshot({ path: "g553-5-inv-elenco.png", fullPage: true });

/* la ripresa: chiudo il foglio e riapro, deve ricordarsi tutto */
await fi.getByRole("button", { name: /Continua dopo/ }).click(); await A.p.waitForTimeout(900);
const bInv2 = A.p.getByRole("button", { name: /^Inventario · \d+ su \d+$/ });
ok(await bInv2.count() === 1, `il tasto ora mostra l'avanzamento («${await bInv2.innerText()}»)`);
await bInv2.click(); await A.p.waitForTimeout(1100);
const fi2 = A.p.locator(".fixed.inset-0.z-50").last();
ok(/1 differenza finora/.test(await fi2.innerText()), "riaprendo, l'inventario è ancora lì com'era");

/* chiudo e verifico che scriva SOLO la differenza vera */
await fi2.getByRole("button", { name: /Chiudi comunque/ }).click(); await A.p.waitForTimeout(800);
const tc2 = await A.p.locator("body").innerText();
ok(/Correggere 1 giacenze\?|Correggere 1 giacenza/.test(tc2), "chiede conferma dicendo quante ne cambia");
ok(/non li hai ancora segnati come fatti/.test(tc2), "e avvisa che alcuni magazzini non li hai finiti");
const ordPrima = (await letto(A.p)).ordini.length;
await A.p.getByRole("button", { name: /^Correggi 1$/ }).click(); await A.p.waitForTimeout(2000);

const d5 = await letto(A.p);
ok(!invDi(d5), "chiuso l'inventario, non resta niente nei dati");
const artDopo = d5.magazzini.find((m) => m.id === retroFm.id).articoli.find((a) => a.prodottoId === PA.id);
ok(artDopo.qty === 7, `ora la giacenza è quella contata (${artDopo.qty})`);
const artPb = d5.magazzini.find((m) => m.id === retroFm.id).articoli.find((a) => a.prodottoId === PB.id);
ok(artPb.qty === 2, "e quella contata uguale è rimasta com'era");
const movInv = (d5.movimenti || []).filter((mv) => mv.rif === "inventario");
ok(movInv.length === 1, `un solo movimento scritto, non uno per casella contata (${movInv.length})`);
ok(movInv[0].causale === "rettifica", "e la causale è «rettifica», non «conteggio»");
/* Questo prima confrontava o.t con d5.inventario?.t, che dopo la chiusura è
   undefined: «numero > undefined» è sempre falso, quindi il controllo passava
   qualunque cosa fosse successo. Ora conto le righe prima e dopo. */
ok(d5.ordini.length === ordPrima,
  `l'inventario non ha generato nessun ordine: ${ordPrima} righe prima, ${d5.ordini.length} dopo`);
ok((d5.log || []).some((e) => /Inventario chiuso/.test(e.msg || "")), "lo storico registra la chiusura");
await A.p.screenshot({ path: "g553-6-inv-fatto.png", fullPage: true });

/* ── l'operatore vede solo i suoi magazzini nell'inventario ── */
const O = await apri("Op", "2222");
await vaiA(O.p, "Magazzini");
const bo = O.p.getByRole("button", { name: /^Inventario$/ });
ok(await bo.count() === 1, "l'inventario è offerto anche all'operatore");
await bo.click(); await O.p.waitForTimeout(1000);
const fo = O.p.locator(".fixed.inset-0.z-50").last();
const to = await fo.innerText();
ok(new RegExp(retroFm.nome).test(to), "che gli propone il suo magazzino");
ok(!new RegExp(retroRm.nome).test(to), "e non quello dell'altra sede");
await O.p.screenshot({ path: "g553-7-inv-operatore.png", fullPage: true });
await O.ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await A.ctx.close();
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
