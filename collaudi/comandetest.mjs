/* gen-5.98: le Comande — l'anello mancante della catena di Valerio:
   [cliente → cassa → POSTAZIONI → scarico → riordino].

   CHIESTO DA VALERIO il 31 agosto, parole sue: «dalla cassa l'ordine viene
   visualizzato dalle postazioni produttive di appartenenza; se viene ordinato
   un fritto, una pizza e un dolce, e chi fa i fritti fa anche i dolci, deve
   poterlo vedere». Tradotto col disegno vinto in giudizio (A + 4 innesti):
   la comanda È la vendita — nessuna seconda collezione — col GRUPPO congelato
   sulla riga alla battuta (come nome/prezzo/aliquota); le postazioni sono
   configurazione di vista (s.postazioni, editor nel Listino admin); la spunta
   è UNA per scontrino-per-postazione e scrive v.fatte[gruppo] via una closure
   guardata come lo storno; lo storno in cucina NON sparisce in silenzio:
   card barrata con motivo e «Vista» locale; le righe di gruppi non abbinati
   compaiono su TUTTI gli schermi con l'etichetta «senza postazione» — mai un
   piatto invisibile. L'abbinamento gruppo→postazione è per chiave normalizzata
   (minuscole, senza accenti): il listino è testo libero e «Pizze» e «pizze»
   sono la stessa pizzeria.

   SCRITTO PRIMA DELLE MODIFICHE. Contro gen-5.97 devono essere ROSSI:
   §1 (Comande in barra per l'operatore tutto-spento + lente), §2 (snapshot
   del gruppo + smistamento + normalizzazione), §3 (spunta e togli),
   §5 (storno barrato con Vista), §6 (editor Postazioni nel Listino).
   Contro-controlli (verdi anche su 5.97): la barra dell'admin non cambia,
   chi non ha «cassa» continua a non vederla, la finestra delle comande non
   regala correzioni/ordini. La finestra delle 12 ore non si collauda qui
   (servirebbe muovere l'orologio): la difende il filtro, dichiarato nel
   codice. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
/* il primo giro si fa su gen-5.97 apposta per registrare i rossi: una vista
   che ancora non esiste deve CONTARE come rossa, non ammazzare il giro */
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 90)}`); } };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 2);
if (!linea) throw new Error("banco povero: serve una linea con almeno 2 articoli");
const artA = linea.articoli[0], artB = linea.articoli[1];
artA.qty = 10; artB.qty = 6;
FM.cassaMagId = linea.id;
/* la cucina del banco: tre mestieri veri piu' una voce SENZA gruppo (Acqua),
   che deve finire in «Altro» e quindi su tutti gli schermi */
base.listino = [
  { id: "li-fri", nome: "Fritto misto", gruppo: "Fritti", prezzo: 7, attivo: true, varianti: [],
    distinta: [{ prodottoId: artA.prodottoId, qty: 0.5, uomId: artA.uomId }] },
  { id: "li-piz", nome: "Margherita", gruppo: "Pizze", prezzo: 6, attivo: true, varianti: [],
    distinta: [{ prodottoId: artB.prodottoId, qty: 1, uomId: artB.uomId }] },
  { id: "li-dol", nome: "Tiramisù", gruppo: "Dolci", prezzo: 4, attivo: true, varianti: [], distinta: [] },
  { id: "li-acq", nome: "Acqua", gruppo: "", prezzo: 1, attivo: true, varianti: [], distinta: [] },
];
/* «chi fa i fritti fa anche i dolci»: la Friggitoria abbina DUE gruppi.
   La Pizzeria e' scritta minuscola APPOSTA: l'abbinamento deve reggere
   sulla chiave normalizzata, non sulla stringa identica. */
base.postazioni = [
  { id: "po-fri", nome: "Friggitoria", sedeId: "", gruppi: ["Fritti", "Dolci"] },
  { id: "po-piz", nome: "Pizzeria", sedeId: "", gruppi: ["pizze"] },
];

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  opZero: { id: "pr-o0", nome: "OpZero", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], pinHash: hash("2222") },
  opCassa: { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") },
};

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (st0, profili, nome, pin) => {
  const st = JSON.parse(JSON.stringify(st0));
  st.profili = profili;
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, [JSON.stringify(st)]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1500);
  return { p, ctx };
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const testoNav = async (p) => (await p.locator('nav[aria-label="Navigazione principale"]').innerText()).replace(/\s+/g, " ");
const stato = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const lente = async (p, testo) => {
  await p.getByRole("button", { name: "Cerca un prodotto o una funzione" }).click();
  await p.waitForTimeout(400);
  await p.locator("input:visible").first().fill(testo); await p.waitForTimeout(700);
};
const chiudiLente = async (p) => {
  await p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
  await p.waitForTimeout(400);
};
const incassa = async (p) => {
  await p.getByRole("button", { name: "Incassa", exact: true }).click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: "Registra l'incasso", exact: true }).click();
  await p.waitForTimeout(1400);
};
/* le sedie sono un toggle, ma l'etichetta dice la verita' dello stato:
   «Siediti a X» quando sei in piedi, «Alzati da X» quando sei seduto —
   si puo' stare seduti a PIU' postazioni insieme (l'unione dei gruppi) */
const siediti = async (p, nomePost) => {
  await p.getByRole("button", { name: `Siediti a ${nomePost}` }).click();
  await p.waitForTimeout(400);
};
const alzati = async (p, nomePost) => {
  await p.getByRole("button", { name: `Alzati da ${nomePost}` }).click();
  await p.waitForTimeout(400);
};

/* ═══ 1. LA BARRA: le Comande sono dell'operatore col posto libero ═══ */
console.log("\n— 1. barra e porte —");
const O0 = await apri(base, [PR.opZero], "OpZero", "2222");
await prova("§1", async () => {
  const nav = await testoNav(O0.p);
  ok(/Comande/.test(nav), "operatore tutto-spento: «Comande» è la quinta voce (il posto della Plancia filtrata)");
  ok(!/Cassa/.test(nav), "e la Cassa continua a non esserci: guardare non è battere");
  await lente(O0.p, "comande");
  ok(/comande in cucina/i.test(await testoDi(O0.p)), "la lente trova «Le comande in cucina»");
  await chiudiLente(O0.p);
});
await O0.ctx.close();
const AD = await apri(base, [PR.admin], "Admin", "1234");
await prova("§1b", async () => {
  const nav = await testoNav(AD.p);
  ok(/Home/.test(nav) && /Plancia/.test(nav) && !/Comande/.test(nav),
    "la barra dell'admin NON cambia: le Comande le raggiunge dalla lente");
  await lente(AD.p, "cucina");
  ok(/comande in cucina/i.test(await testoDi(AD.p)), "eccole nella lente dell'admin");
  await chiudiLente(AD.p);
});
const OC = await apri(base, [PR.opCassa], "OpCassa", "2222");
await prova("§1c", async () => {
  const nav = await testoNav(OC.p);
  ok(/Cassa/.test(nav) && !/Comande/.test(nav),
    "chi ha la cassa tiene la Cassa in barra: le Comande stanno nella lente");
  await lente(OC.p, "postazione");
  ok(/comande in cucina/i.test(await testoDi(OC.p)), "e la lente gliele trova");
  await chiudiLente(OC.p);
});

/* ═══ 2. LA COMANDA ARRIVA ALLA POSTAZIONE GIUSTA ═══ */
console.log("\n— 2. dalla battuta allo schermo giusto —");
let dopoVendita = null;
await prova("§2", async () => {
  await vaiA(OC.p, "Cassa");
  for (const nome of ["Fritto misto", "Margherita", "Tiramisù", "Acqua"]) {
    await OC.p.getByRole("button", { name: `Aggiungi ${nome}` }).click();
    await OC.p.waitForTimeout(200);
  }
  await incassa(OC.p);
  dopoVendita = await stato(OC.p);
  const v = (dopoVendita.vendite || [])[0];
  ok(!!v && v.righe.length === 4, "la vendita ha le sue 4 righe");
  const gr = Object.fromEntries((v?.righe || []).map((r) => [r.nome, r.gruppo]));
  ok(gr["Fritto misto"] === "Fritti" && gr["Margherita"] === "Pizze",
    "il GRUPPO è congelato sulla riga come il prezzo");
  ok(gr["Acqua"] === "Altro", "la voce senza gruppo si congela come «Altro», mai vuota");
  /* innesto del giudizio (B): il progressivo da urlare in cucina — congelato
     FUORI da muta come l'id; con due casse può uscire doppio, dichiarato */
  ok(v?.n === 1, "la vendita porta il progressivo di giornata: #1");
});
await OC.ctx.close();
const F1 = await apri(dopoVendita || base, [PR.opZero], "OpZero", "2222");
await prova("§2b", async () => {
  await vaiA(F1.p, "Comande");
  await siediti(F1.p, "Friggitoria");
  const t = await testoDi(F1.p);
  ok(/1× Fritto misto/.test(t) && /1× Tiramisù/.test(t),
    "la Friggitoria vede fritto E dolce: «chi fa i fritti fa anche i dolci»");
  /* innesto del giudizio (B): l'eta' della comanda sulla card — appena
     battuta dice «adesso», poi conta i minuti */
  ok(/adesso/.test(t), "la card appena nata dice «adesso»: l'età si legge senza orologio");
  ok(!/1× Margherita/.test(t), "la Margherita NON è sua");
  ok(/anche per: Pizzeria/.test(t), "ma la card dice che lo scontrino tocca anche la Pizzeria");
  ok(/1× Acqua/.test(t) && /senza postazione/.test(t),
    "l'Acqua (gruppo non abbinato) compare QUI con l'etichetta «senza postazione»");
  /* cambio sedia sullo stesso schermo: la Pizzeria abbina «pizze» minuscolo */
  await alzati(F1.p, "Friggitoria");
  await siediti(F1.p, "Pizzeria");
  const t2 = await testoDi(F1.p);
  ok(/1× Margherita/.test(t2), "la Pizzeria vede la Margherita: «pizze» minuscolo abbina «Pizze» (chiave normalizzata)");
  ok(!/1× Fritto misto/.test(t2), "e il fritto non è suo");
  ok(/1× Acqua/.test(t2), "l'Acqua senza postazione compare anche qui: mai un piatto invisibile");
  /* la sedia sopravvive al giro per la Home (localStorage, non stato React) */
  await vaiA(F1.p, "Home");
  await vaiA(F1.p, "Comande");
  ok(/1× Margherita/.test(await testoDi(F1.p)), "la sedia scelta sopravvive al cambio di schermata");
});

/* ═══ 3. LA SPUNTA: una per scontrino-per-postazione, e si può togliere ═══ */
console.log("\n— 3. il «Fatto» —");
let dopoSpunta = null;
await prova("§3", async () => {
  await alzati(F1.p, "Pizzeria");
  await siediti(F1.p, "Friggitoria");
  await F1.p.getByRole("button", { name: /Fatta la comanda/ }).first().click();
  await F1.p.waitForTimeout(900);
  const t = await testoDi(F1.p);
  /* l'intestazione della sezione e' resa MAIUSCOLA dal CSS (uppercase) e
     innerText restituisce il testo trasformato: misurato al primo giro
     verde, la regex e' senza maiuscole/minuscole per questo */
  ok(/Fatte/i.test(t), "la card è scesa nella sezione «Fatte»");
  dopoSpunta = await stato(F1.p);
  const v = (dopoSpunta.vendite || [])[0];
  ok(!!v?.fatte?.Fritti && !!v?.fatte?.Dolci, "v.fatte porta Fritti E Dolci in un tocco solo");
  ok(v?.fatte?.Fritti?.chi === "OpZero", "e resta scritto CHI ha spuntato");
  ok(!!v?.fatte?.Altro, "il tocco copre anche l'Acqua senza postazione: era sul suo schermo");
  ok(!v?.fatte?.Pizze, "la parte della Pizzeria NON è toccata: la spunta il suo schermo");
  /* il tocco sbagliato si toglie */
  await F1.p.getByRole("button", { name: /Riporta in coda/ }).first().click();
  await F1.p.waitForTimeout(900);
  const st2 = await stato(F1.p);
  ok(!(st2.vendite || [])[0]?.fatte?.Fritti, "«Riporta in coda»: la spunta si toglie e la card risale");
  ok(!/Fatte/i.test(await testoDi(F1.p)),
    "niente card ferma fra le Fatte: la sezione sparisce quando è vuota");
});
await F1.ctx.close();

/* ═══ 4. L'ORDINE È UNA CODA: la più vecchia in cima ═══ */
console.log("\n— 4. la coda di cucina —");
await prova("§4", async () => {
  const AD2 = await apri(base, [PR.admin], "Admin", "1234");
  await lente(AD2.p, "cassa");
  await AD2.p.getByText("Battere una vendita", { exact: false }).first().click();
  await AD2.p.waitForTimeout(900);
  await AD2.p.getByRole("button", { name: "Aggiungi Fritto misto" }).click();
  await AD2.p.waitForTimeout(250);
  await incassa(AD2.p);
  await AD2.p.getByRole("button", { name: "Aggiungi Tiramisù" }).click();
  await AD2.p.waitForTimeout(250);
  await incassa(AD2.p);
  const st = await stato(AD2.p);
  await AD2.ctx.close();
  const F2 = await apri(st, [PR.opZero], "OpZero", "2222");
  await vaiA(F2.p, "Comande");
  await siediti(F2.p, "Friggitoria");
  const t = await testoDi(F2.p);
  const iFritto = t.indexOf("1× Fritto misto"), iDolce = t.indexOf("1× Tiramisù");
  ok(iFritto >= 0 && iDolce >= 0 && iFritto < iDolce,
    "due scontrini: il PRIMO battuto sta in cima — è una coda, non una chat");
  ok(/#1/.test(t) && /#2/.test(t), "e ogni card urla il suo progressivo: #1, #2");
  await F2.ctx.close();
});

/* ═══ 5. LO STORNO NON SPARISCE IN SILENZIO ═══ */
console.log("\n— 5. lo storno in cucina —");
await prova("§5", async () => {
  const AD3 = await apri(base, [PR.admin], "Admin", "1234");
  await lente(AD3.p, "cassa");
  await AD3.p.getByText("Battere una vendita", { exact: false }).first().click();
  await AD3.p.waitForTimeout(900);
  await AD3.p.getByRole("button", { name: "Aggiungi Fritto misto" }).click();
  await AD3.p.waitForTimeout(250);
  await incassa(AD3.p);
  await AD3.p.getByRole("button", { name: /Storna la vendita/ }).first().click();
  await AD3.p.waitForTimeout(500);
  await AD3.p.locator("input:visible").first().fill("cliente andato via");
  await AD3.p.waitForTimeout(250);
  await AD3.p.getByRole("button", { name: "Conferma lo storno", exact: true }).click();
  await AD3.p.waitForTimeout(1200);
  const st = await stato(AD3.p);
  await AD3.ctx.close();
  const F3 = await apri(st, [PR.opZero], "OpZero", "2222");
  await vaiA(F3.p, "Comande");
  await siediti(F3.p, "Friggitoria");
  const t = await testoDi(F3.p);
  ok(/[Ss]tornata/.test(t) && /cliente andato via/.test(t),
    "la card stornata resta a schermo, barrata, col motivo: non sparisce sotto le mani del cuoco");
  await F3.p.getByRole("button", { name: /Vista/ }).first().click();
  await F3.p.waitForTimeout(500);
  ok(!/cliente andato via/.test(await testoDi(F3.p)), "«Vista» la congeda: è una presa d'atto, non una scrittura");
  await F3.ctx.close();
});

/* ═══ 6. LE POSTAZIONI LE DISEGNA L'ADMIN NEL LISTINO ═══ */
console.log("\n— 6. l'editor delle postazioni —");
await prova("§6", async () => {
  await vaiA(AD.p, "Gestione");
  await AD.p.getByText("Listino", { exact: true }).first().click();
  await AD.p.waitForTimeout(900);
  const t = await testoDi(AD.p);
  ok(/Postazioni/.test(t) && /Friggitoria/.test(t), "il Listino mostra le postazioni esistenti");
  await AD.p.getByRole("button", { name: "Nuova postazione", exact: true }).click();
  await AD.p.waitForTimeout(600);
  await AD.p.locator("input:visible").first().fill("Banco");
  await AD.p.waitForTimeout(200);
  /* i gruppi si scelgono a spunta dall'elenco VERO del listino: mai testo
     libero due volte */
  await AD.p.getByRole("button", { name: "Abbina il gruppo Fritti", exact: true }).click();
  await AD.p.waitForTimeout(200);
  await AD.p.getByRole("button", { name: "Salva", exact: true }).click();
  await AD.p.waitForTimeout(900);
  const st = await stato(AD.p);
  const po = (st.postazioni || []).find((x) => x.nome === "Banco");
  ok(!!po && (po.gruppi || []).includes("Fritti"), "la postazione «Banco» è nata coi suoi gruppi a spunta");
});
await AD.ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
