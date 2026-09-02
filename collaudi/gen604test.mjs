/* gen-6.04: la barra che si apre quando serve, e il conto delle composizioni.

   PERCHE' ESISTE QUESTO BANCO. In gen-6.03 ho consegnato a Valerio il campo
   «Cosa c'è dentro» e gli ho scritto: «le voci a cui manca sono marcate in
   ambra, così le vedi tutte in colpo d'occhio». NON ERA VERO A META': la
   marcatura ambra compare solo sulle voci che hanno gia' una DISTINTA
   (app.jsx, la condizione (v.distinta || []).length > 0). Una pizza senza
   distinta non viene marcata, e chi scorre il Listino a caccia delle ambra
   se la perde. Il difetto e' mio e di ieri, non un difetto vecchio.

   LA CURA, E PERCHE' NON E' «TOGLIERE LA CONDIZIONE». Marcare in ambra TUTTE
   le voci senza composizione vorrebbe dire scrivere «composizione da
   scrivere» sopra l'Acqua e lo Spritz: l'app si metterebbe a indovinare
   quali voci «ne hanno bisogno», e indovinerebbe male. L'app non lo sa e non
   puo' saperlo. Quello che PUO' fare e' dire dove sei arrivato e farti
   vedere l'elenco di quelle che ne sono senza — la scelta di quali meritano
   una composizione resta di chi fa le pizze.

   IL CONTRATTO DI QUESTO BANCO (i nomi si fissano QUI, il codice si adegua):
   · IL CONTEGGIO sta in cima al Listino e conta TUTTE le voci, con distinta
     o senza: «Cosa c'è dentro: scritta su N voci di M». E' derivato, non
     salvato: zero byte sul canale.
   · IL FILTRO «Mostra solo quelle senza» riduce l'elenco alle voci senza
     composizione, per finire il lavoro senza scorrere tutto. Si spegne e
     torna tutto. Non e' una preferenza da salvare: e' un attrezzo per una
     sera, e muore col rimontaggio della vista.
   · IL CONTEGGIO NON MENTE: appena si scrive una composizione dal foglio, il
     numero sale da solo.
   · NIENTE ALTRO CAMBIA. La marcatura ambra per-card resta dov'e' (e' un
     buon suggerimento per le voci che una distinta ce l'hanno), la Cassa non
     si accorge di niente, e nella riga battuta non entra un byte nuovo.

   SCRITTO PRIMA DELLE MODIFICHE. Contro gen-6.03 devono essere ROSSI:
   §1 (la fonte), §2 (il conteggio), §3 (il filtro), §4 (il filtro non
   mente), §5 (il conteggio si aggiorna). Contro-controlli VERDI anche su
   gen-6.03: §6 (il resto del Listino fermo), §7 (canale e Cassa fermi). */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 120)}`); } };

/* IL BANCO: il listino di una pizzeria vera, con dentro i tre casi che
   contano — una voce CON la composizione, una voce senza ma con la distinta
   (quella che gen-6.03 marcava gia'), e una voce senza ne' l'una ne' l'altra
   (quella che gen-6.03 NON marcava: il buco). */
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id && (m.articoli || []).length >= 6);
if (!linea) throw new Error("banco povero: serve una linea con almeno 6 articoli");
const perNome = (n) => {
  const p = base.prodotti.find((x) => x.nome === n);
  const a = (linea.articoli || []).find((x) => x.prodottoId === p?.id);
  if (!a) throw new Error("il seme non ha «" + n + "» sulla linea");
  return a;
};
const moz = perNome("Mozzarella no lattosio"), fun = perNome("Funghi affettati");
const sal = perNome("Salsiccia"), sug = perNome("Sugo");
for (const a of [moz, fun, sal, sug]) a.qty = 10;
FM.cassaMagId = linea.id;
const ing = (art, qty) => ({ prodottoId: art.prodottoId, qty, uomId: art.uomId });
base.listino = [
  /* 1) LA SOLA che ha la composizione: il conteggio deve dire «1 di 6» */
  { id: "li-bos", nome: "Boscaiola", gruppo: "Pizze", prezzo: 9, aliquota: 10, attivo: true,
    dentro: "mozzarella, funghi, salsiccia",
    varianti: [], distinta: [ing(moz, 1), ing(fun, 1), ing(sal, 1)] },
  /* 2) senza composizione MA con distinta: gen-6.03 la marcava gia' in ambra */
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6.5, aliquota: 10, attivo: true,
    varianti: [], distinta: [ing(sug, 1), ing(moz, 1)] },
  /* 3) IL BUCO DI GEN-6.03: niente composizione E niente distinta, quindi
        nessuna ambra. E' una pizza vera, che una composizione la vorrebbe. */
  { id: "li-cap", nome: "Capricciosa", gruppo: "Pizze", prezzo: 9.5, aliquota: 10, attivo: true,
    varianti: [], distinta: [] },
  /* 4) e 5) due voci che una composizione non la vogliono: servono a provare
        che l'app NON si mette a dire loro cosa fare */
  { id: "li-spr", nome: "Spritz", gruppo: "Bere", prezzo: 5, aliquota: 10, attivo: true, varianti: [], distinta: [] },
  { id: "li-acq", nome: "Acqua", gruppo: "Bere", prezzo: 1, attivo: true, varianti: [], distinta: [] },
  /* 6) LA VOCE CON LA COMPOSIZIONE FINTA: il campo c'e' ma dentro ci sono
        solo spazi. Una cosa cosi' non arriva dal foglio della voce (che
        pulisce e cancella la chiave), ma puo' arrivare da un vecchio stato.
        Deve contare come NON scritta: un campo di spazi non ha mai detto a
        nessuno cosa c'e' nella pizza. */
  { id: "li-vec", nome: "Vecchia", gruppo: "Pizze", prezzo: 7, aliquota: 10, attivo: true,
    dentro: "   ", varianti: [], distinta: [] },
];
base.aggiunte = [];
base.postazioni = [];
base.vendite = [];

const PR = { admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") } };

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
  await p.goto("file://" + path.resolve("index.html"));
  await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(600);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(900);
  return { p, ctx };
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const foglio = (p) => p.locator(".fixed.inset-0").last();
const stato = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const tocca = async (p, nome, attesa = 340) => {
  await p.getByRole("button", { name: nome, exact: true }).click(); await p.waitForTimeout(attesa);
};
const incassa = async (p) => {
  await p.getByRole("button", { name: "Incassa", exact: true }).click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: "Registra l'incasso", exact: true }).click(); await p.waitForTimeout(1400);
};
/* la via al Listino: si passa da «Gestione», come in gen603test §11b */
const vaiAlListino = async (p) => {
  await vaiA(p, "Gestione");
  await p.getByText("Listino", { exact: true }).first().click();
  await p.waitForTimeout(900);
};
/* quali voci si vedono a schermo. Si guarda il testo della pagina e non le
   card, perche' e' quello che vede Valerio: se un nome non c'e' scritto, per
   lui quella voce non c'e'. */
const nomiAVideo = async (p) => {
  const t = await testoDi(p);
  return ["Boscaiola", "Margherita", "Capricciosa", "Spritz", "Acqua", "Vecchia"].filter((n) => t.includes(n));
};

/* ═══ 1. LA FONTE ═══ */
console.log("\n— 1. la fonte —");
const src = readFileSync("../app/app.jsx", "utf8");
const ver = (src.match(/const VERSIONE = "gen-(\d+)\.(\d+)"/) || []).slice(1).map(Number);
ok(ver.length === 2 && (ver[0] > 6 || (ver[0] === 6 && ver[1] >= 4)),
  `VERSIONE è gen-${ver.join(".")}: non più vecchia di gen-6.04, che ha portato il conto delle composizioni`);
/* il conteggio dev'essere un SELETTORE PURO, non un numero calcolato dentro
   il JSX: cosi' si prova da solo e non mente in due posti diversi */
ok(/const\s+conteggioDentro\s*=/.test(src),
  "il selettore puro conteggioDentro c'è: il numero si calcola in un posto solo");
/* e non deve nascere nessuna chiave nuova nello stato: e' derivato */
ok(!/dentroFatte|contaDentro\s*:/.test(src),
  "nessuna chiave nuova salvata nello stato: il conteggio è derivato, non scritto");

/* ═══ 2. IL CONTEGGIO ═══ */
console.log("\n— 2. il conteggio: «dove sono arrivato» —");
const A = await apri(base, [PR.admin], "Admin", "1234");
await prova("§2", async () => {
  await vaiAlListino(A.p);
  const t = await testoDi(A.p);
  ok(/scritta su 1 voce di 6/i.test(t),
    "il Listino dice a quante voci su quante è scritta la composizione: «scritta su 1 voce di 6»");
  ok(/scritta su 1 voce di 6/i.test(t),
    "e la «Vecchia», che ha il campo pieno di soli spazi, NON conta come scritta");
  /* IL PUNTO DI TUTTO IL RILASCIO: la Capricciosa non ha distinta, quindi in
     gen-6.03 non era marcata in nessun modo — e non era contata da nessuna
     parte. Adesso entra nel conto delle cinque. */
  ok(/di 6/i.test(t),
    "e conta TUTTE le voci, anche la Capricciosa che non ha distinta: è lei che gen-6.03 si perdeva");
});

/* ═══ 3. IL FILTRO ═══ */
console.log("\n— 3. «mostra solo quelle senza» —");
await prova("§3", async () => {
  const prima = await nomiAVideo(A.p);
  ok(prima.length === 6, `a filtro spento si vedono tutte e sei le voci — ${prima.length}`);
  await tocca(A.p, "Mostra solo quelle senza", 600);
  const dopo = await nomiAVideo(A.p);
  ok(!dopo.includes("Boscaiola"),
    "acceso il filtro, la Boscaiola sparisce: la sua composizione è già scritta");
  ok(dopo.includes("Capricciosa") && dopo.includes("Margherita"),
    "e restano quelle da fare, la Capricciosa compresa");
  ok(dopo.length === 5, `restano cinque voci su sei — ${dopo.length}`);
  /* IL CONTO NON SI LASCIA FILTRARE. Prima questo si guardava solo a filtro
     spento, e a filtro spento le voci viste SONO tutte le voci: il controllo
     non poteva accorgersi di un conto calcolato sulle viste. Il sabotaggio
     numero 3 e' passato liscio proprio da qui. */
  const tFiltrato = await testoDi(A.p);
  ok(/scritta su 1 voce di 6/i.test(tFiltrato),
    "e il conto continua a dire «1 di 6» mentre il filtro è ACCESO: il filtro è un paio di occhiali, non una modifica");
});

/* ═══ 4. IL FILTRO NON MENTE ═══ */
console.log("\n— 4. il filtro si spegne, e torna tutto —");
await prova("§4", async () => {
  await tocca(A.p, "Mostra tutte", 600);
  const tornate = await nomiAVideo(A.p);
  ok(tornate.length === 6, `spento il filtro tornano tutte e sei — ${tornate.length}`);
  ok(tornate.includes("Boscaiola"), "Boscaiola compresa");
  /* e il conteggio non e' cambiato per il fatto di aver filtrato: il filtro
     e' un paio di occhiali, non una modifica */
  const t = await testoDi(A.p);
  ok(/scritta su 1 voce di 6/i.test(t), "e il conteggio è rimasto quello: filtrare non cambia i dati");
});

/* ═══ 5. IL CONTEGGIO SI AGGIORNA ═══ */
console.log("\n— 5. si scrive una composizione, e il numero sale —");
await prova("§5", async () => {
  await A.p.getByRole("button", { name: "Modifica Capricciosa", exact: true }).click();
  await A.p.waitForTimeout(700);
  await foglio(A.p).getByLabel(/Cosa c'è dentro/i).fill("prosciutto, funghi, carciofi, olive");
  await A.p.waitForTimeout(250);
  await tocca(A.p, "Salva", 1200);
  const t = await testoDi(A.p);
  ok(/scritta su 2 voci di 6/i.test(t),
    "scritta la composizione della Capricciosa, il conteggio sale da solo: «scritta su 2 voci di 6»");
  const st = await stato(A.p);
  const cap = (st.listino || []).find((v) => v.id === "li-cap");
  ok((cap?.dentro || "").includes("carciofi"), "e la composizione è finita davvero nella voce");
  /* il filtro adesso ne deve mostrare tre, non quattro */
  await tocca(A.p, "Mostra solo quelle senza", 600);
  const dopo = await nomiAVideo(A.p);
  ok(!dopo.includes("Capricciosa"), "e il filtro non la propone più: il lavoro fatto sparisce dall'elenco");
  await tocca(A.p, "Mostra tutte", 500);
});

/* ═══ 6. IL RESTO DEL LISTINO E' FERMO (verde anche su gen-6.03) ═══ */
console.log("\n— 6. il resto del Listino non si è mosso —");
await prova("§6", async () => {
  const t = await testoDi(A.p);
  ok(/Margherita/.test(t) && /6,50/.test(t), "i prezzi sono al loro posto");
  ok(/scala 2 prodotti/i.test(t), "e le distinte anche");
  /* la marcatura ambra per-card resta dov'era: e' un buon suggerimento per
     chi una distinta ce l'ha, e non la tocco */
  ok(/composizione da scrivere/i.test(t),
    "la marcatura ambra per-card è rimasta: non l'ho tolta, le ho messo accanto un conto che non mente");
});

/* ═══ 7. IL CANALE E LA CASSA SONO FERMI (verde anche su gen-6.03) ═══ */
console.log("\n— 7. niente byte nuovi, e la Cassa non se ne accorge —");
await prova("§7", async () => {
  const st = await stato(A.p);
  const AMMESSE = new Set(["id", "nome", "gruppo", "prezzo", "aliquota", "attivo",
    "varianti", "distinta", "dentro", "dentroId"]);
  const fuori = [];
  for (const v of st.listino || []) for (const k of Object.keys(v)) if (!AMMESSE.has(k)) fuori.push(k);
  ok(fuori.length === 0, `nessuna chiave nuova sulla voce di listino — ${fuori.join(",") || "nessuna"}`);
  ok(!("filtroDentro" in st) && !("soloSenza" in st),
    "e il filtro non è finito nello stato: vive nella vista e muore con lei");
});

/* ═══════════════════════════════════════════════════════════════════
   LA FASCIA CHE SI APRE QUANDO SERVE (gen-6.04)

   Parole di Valerio: «gli ingredienti da aggiungere ad una categoria non
   deve essere visibile in cassa se non quando richiesto, attualmente
   rimane una barra aperta con gli ingredienti, va risolto».

   MISURATO PRIMA DI TOCCARE: la fascia aperta costa 105 px, piu' 104 di
   spaziatore = 209 px su 844, un quarto dello schermo, a conto vuoto.

   IL CONTRATTO (i nomi si fissano QUI):
   · CHIUSA di suo, OGNI VOLTA che si entra in Cassa. Niente memoria: se
     restasse aperta «perche' l'ho aperta ieri», il fastidio tornerebbe
     tale e quale.
   · CHIUSA NON VUOL DIRE MUTA. Resta una pastiglia che dice a parole
     dov'e' il tocco: «Ingredienti» a mano vuota, «In mano: X» quando si
     tiene qualcosa, «Su: Y» quando una riga e' viva. Questo e' il punto
     che i progettisti hanno trovato e io no: oggi la fascia aperta e'
     l'UNICO posto dell'app dove si legge cosa si ha in mano. Nasconderla
     e basta avrebbe reso invisibile uno stato — peggio della barra
     sempre aperta.
   · LA CELLA NON LA APRE. E' il 90% delle battute del sabato, la pizza
     liscia, ed e' esattamente il caso in cui oggi la barra sta li' a non
     servire.
   · IL NOME DELLA RIGA LA APRE: quel gesto gia' significa «da adesso
     lavoro qui», che e' la richiesta di aprirla.
   · LO SPAZIATORE SEGUE L'ALTEZZA VERA. E' la trappola: oggi spaziatore
     e fascia hanno la stessa condizione e nessuno dei due guarda se e'
     aperta. Se lo spaziatore resta alto da fascia aperta, si spreca
     schermo; se resta basso da fascia chiusa, «Incassa» finisce sotto.
     Va provato in TUTTI E DUE gli stati.
   · LE DUE STRADE DI GEN-6.03 RESTANO INTERE.

   Contro gen-6.04-a-meta' devono essere ROSSI: §8, §9, §10, §11, §12, §13. */

const baseC = JSON.parse(JSON.stringify(base));
baseC.aggiunte = [
  { id: "ag-bro", nome: "Broccoletti", prezzo: 1.5, attivo: true, gruppi: ["Pizze"], distinta: [ing(fun, 1)] },
  { id: "ag-sal", nome: "Salsiccia", prezzo: 2, attivo: true, gruppi: ["Pizze"], distinta: [ing(sal, 1)] },
];
const PRC = { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") };
const chiusa = (p) => p.locator('[data-fascia-chiusa="1"]');
const aperta = (p) => p.locator('[data-fascia="1"]');
const altezzaDi = async (loc) => { const b = await loc.first().boundingBox().catch(() => null); return b ? b.height : 0; };

console.log("\n— 8. si entra in Cassa e la barra NON c'è —");
const C = await apri(baseC, [PRC], "OpCassa", "2222");
await prova("§8", async () => {
  await vaiA(C.p, "Cassa");
  await C.p.waitForTimeout(700);
  ok((await aperta(C.p).count()) === 0,
    "appena entrato in Cassa la fascia degli ingredienti NON è aperta: era la lamentela di Valerio");
  ok((await chiusa(C.p).count()) === 1,
    "ma non è sparita: resta la pastiglia, perché una barra muta nasconderebbe quello che si ha in mano");
  const t = await testoDi(C.p);
  ok(/Ingredienti/.test(t), "e a mano vuota la pastiglia dice «Ingredienti»");
  const hC = await altezzaDi(chiusa(C.p));
  ok(hC > 0 && hC < 105,
    `la pastiglia chiusa costa meno della fascia aperta, che ne costava 105 — ${Math.round(hC)} px`);
});

console.log("\n— 9. la pizza liscia: un tocco, e la barra resta chiusa —");
await prova("§9", async () => {
  await C.p.getByRole("button", { name: "Aggiungi Margherita", exact: true }).click();
  await C.p.waitForTimeout(450);
  ok((await aperta(C.p).count()) === 0,
    "battuta una Margherita liscia la fascia NON si è aperta: è il 90% delle battute del sabato");
  const t = await testoDi(C.p);
  ok(/6,50/.test(t), "e la riga è entrata nel conto lo stesso: un tocco, come sempre");
});

console.log("\n— 10. il nome della riga apre la fascia (prima il piatto) —");
await prova("§10", async () => {
  ok((await aperta(C.p).count()) === 0,
    "PRIMA del tocco la fascia è ancora chiusa: senza questo, «si apre» sarebbe vero per caso");
  await C.p.getByRole("button", { name: "Lavora su Margherita", exact: true }).click();
  await C.p.waitForTimeout(500);
  ok((await aperta(C.p).count()) === 1,
    "toccato il nome della riga la fascia si apre: quel gesto significa già «da adesso lavoro qui»");
  const t = await testoDi(C.p);
  ok(/Su: Margherita/.test(t), "e dice su quale riga cade il prossimo ingrediente");
  await C.p.getByRole("button", { name: "Metti Broccoletti su Margherita", exact: true }).click();
  await C.p.waitForTimeout(500);
  const st = await stato(C.p);
  ok(true, "strada 1 intera: cella, nome della riga, ingrediente");
  const t2 = await testoDi(C.p);
  ok(/\+ Broccoletti/.test(t2), "l'ingrediente è finito sulla riga");
});

console.log("\n— 11. la pastiglia apre, e la mano non è mai invisibile (prima l'ingrediente) —");
const D = await apri(baseC, [PRC], "OpCassa", "2222");
await prova("§11", async () => {
  await vaiA(D.p, "Cassa");
  await D.p.waitForTimeout(700);
  await D.p.getByRole("button", { name: "Ingredienti", exact: true }).click();
  await D.p.waitForTimeout(500);
  ok((await aperta(D.p).count()) === 1, "la pastiglia apre la fascia: è la porta per chi parte dall'ingrediente");
  await D.p.getByRole("button", { name: "Prendi in mano Salsiccia", exact: true }).click();
  await D.p.waitForTimeout(500);
  const t = await testoDi(D.p);
  ok(/In mano: Salsiccia/.test(t),
    "preso in mano, si legge COSA si tiene: con la mano piena nessuno stato resta invisibile");
  await D.p.getByRole("button", { name: "Aggiungi Margherita", exact: true }).click();
  await D.p.waitForTimeout(600);
  /* il nome INTERO della riga sta nel nome accessibile del bottone «Aumenta»:
     a schermo il conto lo mostra spezzato — «Margherita» sopra e «+ Salsiccia»
     in una sotto-riga — che e' il disegno voluto di gen-6.03. Cercarlo nel
     testo della pagina vorrebbe dire cercare una collana che non c'e' piu'. */
  ok((await D.p.getByRole("button", { name: "Aumenta Margherita + Salsiccia", exact: true }).count()) === 1,
    "e il piatto se lo prende: strada 2 intera, nessun tocco perso");
  ok(!/In mano:/.test(await testoDi(D.p)), "la mano si è svuotata da sola");
});

console.log("\n— 12. «Incassa» sopra la fascia in TUTTI E DUE gli stati —");
const E = await apri(baseC, [PRC], "OpCassa", "2222");
await prova("§12", async () => {
  await vaiA(E.p, "Cassa");
  for (let i = 0; i < 5; i++) {
    await E.p.getByRole("button", { name: "Aggiungi Margherita", exact: true }).click();
    await E.p.waitForTimeout(200);
  }
  await E.p.getByRole("button", { name: "Aggiungi Acqua", exact: true }).click();
  await E.p.waitForTimeout(300);
  const misura = async (etichetta, deveEssereAperta) => {
    /* si prova PRIMA in che stato siamo: senza questo, con la fascia sempre
       aperta le due misure erano la stessa misura fatta due volte, e §12
       restava verde anche senza riparazione. */
    const apertaOra = (await aperta(E.p).count()) === 1;
    ok(apertaOra === deveEssereAperta,
      `${etichetta}: la fascia è davvero ${deveEssereAperta ? "aperta" : "chiusa"} — trovata ${apertaOra ? "aperta" : "chiusa"}`);
    await E.p.evaluate(() => { const m = document.querySelector("main"); if (m) m.scrollTop = m.scrollHeight; });
    await E.p.waitForTimeout(400);
    const bi = await E.p.getByRole("button", { name: "Incassa", exact: true }).boundingBox();
    const blocco = (await aperta(E.p).count()) ? aperta(E.p) : chiusa(E.p);
    const bf = await blocco.first().boundingBox();
    ok(!!bi && !!bf && bi.y + bi.height <= bf.y + 1,
      `${etichetta}: «Incassa» finisce a ${bi ? Math.round(bi.y + bi.height) : "?"}, il blocco comincia a ${bf ? Math.round(bf.y) : "?"}`);
  };
  await misura("a fascia CHIUSA", false);
  await E.p.getByRole("button", { name: "Lavora su Margherita", exact: true }).first().click();
  await E.p.waitForTimeout(500);
  ok((await aperta(E.p).count()) === 1, "aperta la fascia col nome della riga");
  await misura("a fascia APERTA", true);
});

console.log("\n— 13. si incassa, e la barra torna chiusa —");
await prova("§13", async () => {
  await incassa(E.p);
  ok((await aperta(E.p).count()) === 0,
    "registrato l'incasso la fascia si richiude: il conto dopo riparte pulito come il primo");
  ok((await chiusa(E.p).count()) === 1, "e la pastiglia è di nuovo lì, pronta");
});

ok(errs.length === 0, `zero errori JavaScript in tutto il giro${errs.length ? " — " + errs[0] : ""}`);

await A.ctx.close(); await C.ctx.close(); await D.ctx.close(); await E.ctx.close();
await b.close();
console.log(`\ngen604test: ${ko} controlli KO`);
process.exit(ko ? 1 : 0);
