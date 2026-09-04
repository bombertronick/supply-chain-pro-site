/* gen-6.05: la coda che non si perde.

   IL DIFETTO, trovato misurando e non da una segnalazione. Le mutazioni in
   attesa di invio vivono in codaRef = useRef([]) (app.jsx:14794) e NON sono
   salvate da nessuna parte: zero occorrenze di localStorage per la coda.
   In servizio normale la finestra e' di uno o due secondi per vendita,
   perche' pianifica(0) parte subito. Ma quando la rete cade, dopo tre
   tentativi falliti offlineRef va a true (app.jsx:14935) e la coda ACCUMULA
   IN MEMORIA tutto il periodo di buio: un ricaricamento della pagina, un
   blocco, o iOS che sospende la scheda, e quella serata di incassi sparisce
   senza un avviso. I soldi sono gia' stati presi.

   PERCHE' NON BASTA «SALVARE LA CODA». La coda non contiene dati: contiene
   FUNZIONI. muta(fn, descr) prende una closure, e una closure non si
   serializza. Non e' una dimenticanza di chi l'ha scritta, e' una
   conseguenza del disegno.

   LA CURA, CHE E' MIRATA E NON UN RIFACIMENTO. Le tre mutazioni che portano
   SOLDI E ORDINI sono gia' funzioni PURE su dati semplici, e il codice lo
   dice a voce alta: applicaVendita(s, v) (663), applicaStorno(s, d) (695) e
   la spunta di cucina, «gemella di applicaStorno: pura su (s, d)» (873). Il
   call-site della vendita porta gia' il commento «TUTTO calcolato fuori da
   muta, id compreso: la closure viene rieseguita». Quindi quelle tre — e
   solo quelle — si registrano come DATI invece che come closure, si salvano
   su localStorage e si rigiocano al riavvio. Tutto il resto (configurazione,
   anagrafiche, conteggi) resta closure e non cambia di una riga.

   IL CONTRATTO DI QUESTO BANCO (i nomi si fissano QUI, il codice si adegua):
   · mutaDato(tipo, dati, descr) accoda una voce SERIALIZZABILE {tipo, dati,
     descr, chi, t, logId}. ESECUTORI la rigioca: {vendita, storno, spunta}.
   · La coda serializzabile si specchia su localStorage a ogni accodamento e
     a ogni svuotamento, sotto la chiave scp:coda:v1.
   · Al montaggio, quello che era rimasto in coda si RIGIOCA, col dedup per
     logId che esiste gia' (s.applicate, MAX_APPLICATE 300): una vendita
     ritrovata non si conta due volte.
   · ZERO BYTE SUL CANALE: la coda sta sul telefono, non nello stato.
   · Le mutazioni a closure continuano a funzionare identiche. Non si
     salvano — non si puo' — e questo va DETTO, non nascosto.

   SCRITTO PRIMA DELLE MODIFICHE. Contro gen-6.04 devono essere ROSSI:
   §1 (la fonte), §2 (la vendita sopravvive), §3 (niente doppioni),
   §5 (la coda si vede). Contro-controlli VERDI anche su gen-6.04:
   §4 (il resto della Cassa fermo), §6 (niente byte nuovi nello stato). */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 130)}`); } };

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
const moz = perNome("Mozzarella no lattosio"), sug = perNome("Sugo");
for (const a of [moz, sug]) a.qty = 50;
FM.cassaMagId = linea.id;
const ing = (art, qty) => ({ prodottoId: art.prodottoId, qty, uomId: art.uomId });
/* distinta VERA: cosi' la vendita scala davvero, e il ritrovamento si prova
   anche sulle giacenze, non solo sul conto degli scontrini */
base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6.5, aliquota: 10, attivo: true,
    varianti: [], distinta: [ing(sug, 1), ing(moz, 1)] },
  { id: "li-acq", nome: "Acqua", gruppo: "Bere", prezzo: 1, attivo: true, varianti: [], distinta: [] },
];
base.aggiunte = []; base.postazioni = []; base.vendite = []; base.giornate = [];
const PRC = { id: "pr-ok", nome: "OpCassa", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [linea.id], cassa: true, pinHash: hash("2222") };

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
/* IL BANCO PROVA IL CASO VERO: la rete che non risponde. window.storage.set
   fallisce finche' non gli si dice di smettere, esattamente come una
   connessione caduta — l'app va in offline dopo tre tentativi. */
const apri = async (nome, pin) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    if (!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1", j);
    /* LA RETE MORTA DEVE SOPRAVVIVERE AL RICARICAMENTO, se no il collaudo
       non prova quello che dice di provare: al reload la finta rete tornava
       viva, la coda si svuotava subito e il controllo guardava una pagina
       gia' allineata. Sta su localStorage come lo stato che vuole misurare. */
    window.__reteMorta = () => { try { return localStorage.getItem("prova:rete-morta") === "1"; } catch { return false; } };
    window.__uccidiRete = (x) => { try { localStorage.setItem("prova:rete-morta", x ? "1" : "0"); } catch {} };
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) {
        if (window.__reteMorta()) throw new Error("rete morta (finta)");
        localStorage.setItem("db:" + k, v); return true;
      },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, [JSON.stringify({ ...base, profili: [PRC] })]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  return { p, ctx };
};
const entra = async (p, nome, pin) => {
  await p.goto("file://" + path.resolve("index.html"));
  await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(600);
  await p.getByText(nome, { exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(900);
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const salvato = (p) => p.evaluate(() => {
  const v = localStorage.getItem("db:scp:stato:v1");
  return v ? JSON.parse(v) : null;
});
const codaSalvata = (p) => p.evaluate(() => {
  try { return JSON.parse(localStorage.getItem("scp:coda:v1") || "null"); } catch { return "ILLEGGIBILE"; }
});
const incassa = async (p) => {
  await p.getByRole("button", { name: "Incassa", exact: true }).click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: "Registra l'incasso", exact: true }).click(); await p.waitForTimeout(1200);
};

/* ═══ 1. LA FONTE ═══ */
console.log("\n— 1. la fonte —");
const src = readFileSync("../app/app.jsx", "utf8");
const ver = (src.match(/const VERSIONE = "gen-(\d+)\.(\d+)"/) || []).slice(1).map(Number);
ok(ver.length === 2 && (ver[0] > 6 || (ver[0] === 6 && ver[1] >= 5)),
  `VERSIONE è gen-${ver.join(".")}: non più vecchia di gen-6.05, che ha reso la coda a prova di ricaricamento`);
ok(/const\s+mutaDato\s*=/.test(src),
  "mutaDato c'è: le mutazioni che portano soldi si accodano come DATI, non come funzioni");
ok(/ESECUTORI\s*=\s*\{/.test(src),
  "ESECUTORI c'è: il registro che sa rigiocare una voce salvata");
/* le tre che portano soldi e ordini devono passare da mutaDato */
for (const [chi, re] of [
  ["la vendita", /mutaDato\(\s*["']vendita["']/],
  ["lo storno", /mutaDato\(\s*["']storno["']/],
  ["la spunta di cucina", /mutaDato\(\s*["']spunta["']/],
]) ok(re.test(src), `${chi} passa da mutaDato: è una delle tre che non si possono perdere`);
ok(/scp:coda:v1/.test(src), "la coda ha una chiave sua sul telefono: scp:coda:v1");
/* e NON deve finire nello stato che viaggia in rete */
ok(!/\bs\.coda\b|\bcoda:\s*\[\]/.test(src),
  "la coda NON entra nello stato condiviso: sta sul telefono, zero byte sul canale");

/* ═══ 2. LA VENDITA SOPRAVVIVE AL RICARICAMENTO ═══ */
console.log("\n— 2. rete morta, pagina ricaricata: la vendita è ancora lì —");
const A = await apri("A", "2222");
await prova("§2", async () => {
  await entra(A.p, "OpCassa", "2222");
  await vaiA(A.p, "Cassa");
  await A.p.waitForTimeout(700);
  /* la rete muore PRIMA di battere */
  await A.p.evaluate(() => window.__uccidiRete(true));
  await A.p.getByRole("button", { name: "Aggiungi Margherita", exact: true }).click();
  await A.p.waitForTimeout(300);
  await incassa(A.p);
  await A.p.waitForTimeout(2500);            // il tempo di tre tentativi falliti
  const coda = await codaSalvata(A.p);
  ok(Array.isArray(coda) && coda.length >= 1,
    `con la rete morta la vendita è salvata sul telefono, non solo in memoria — ${Array.isArray(coda) ? coda.length : String(coda)}`);
  ok(Array.isArray(coda) && coda.some((m) => m.tipo === "vendita" && m.logId),
    "ed è salvata come DATO, col suo logId: si può rigiocare");
  /* IL MOMENTO DELLA VERITA': la pagina si ricarica, come quando il telefono
     va in blocco o il sistema sospende la scheda */
  await A.p.reload();
  await A.p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
  await A.p.waitForTimeout(1200);
  /* DOPO IL RICARICAMENTO SI RIENTRA COL PIN, ed e' giusto cosi': l'app
     riparte dalla schermata dei profili. La coda e' gia' stata ritrovata —
     il controllo qui sopra lo prova — ma la spia col numero la vede solo
     chi e' dentro. Il collaudo deve rifare il gesto che fa il cassiere. */
  /* il rientro e' NOME POI PIN, come al primo accesso: col solo PIN si resta
     fermi sulla schermata dei profili, e ogni controllo dopo misura quella */
  await A.p.getByText("OpCassa", { exact: true }).first().click().catch(() => {});
  await A.p.waitForTimeout(400);
  for (const d of "2222") { await A.p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await A.p.waitForTimeout(130); }
  await A.p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
  await A.p.waitForTimeout(1500);
  const dopo = await codaSalvata(A.p);
  ok(Array.isArray(dopo) && dopo.length >= 1,
    "dopo il ricaricamento la vendita è ancora in coda: non è sparita in silenzio");
  const t = await testoDi(A.p);
  /* «Riconnessione…» era vero ma non diceva la cosa che serve al cassiere:
     QUANTE vendite sono rimaste indietro. Adesso la spia porta il numero —
     ed e' una promessa mantenibile solo perche' la coda sopravvive. */
  const spia = (t.match(/(\d+) da salvare/i) || [])[0];
  ok(!!spia, `a schermo c'è scritto QUANTE ne mancano, non solo che qualcosa non va — ${spia || "NIENTE. A schermo c'era: " + t.slice(0, 150)}`);
});

/* ═══ 3. LA RETE TORNA, E NON SI CONTA DUE VOLTE ═══ */
console.log("\n— 3. la rete torna: si salva una volta sola —");
await prova("§3", async () => {
  await A.p.evaluate(() => window.__uccidiRete(false));
  /* il rinvio cresce fino a 8 secondi: un'attesa corta darebbe un rosso
     che non e' un difetto, e il rumore fa smettere di guardare i rossi */
  await A.p.waitForTimeout(12000);
  const st = await salvato(A.p);
  const vendite = (st?.vendite || []).length;
  ok(vendite === 1, `la vendita ritrovata è finita in rete UNA volta sola — ${vendite}`);
  const coda = await codaSalvata(A.p);
  ok(!coda || coda.length === 0, `e la coda si è svuotata — ${coda ? coda.length : 0}`);
  /* la contro-prova numerica: la giacenza è scesa una volta, non due */
  const art = (st?.magazzini || []).find((m) => m.id === linea.id)?.articoli
    ?.find((a) => a.prodottoId === moz.prodottoId);
  ok(art && Math.abs(art.qty - 49) < 0.001,
    `e il magazzino è sceso di UNO, non di due: la mozzarella è a ${art ? art.qty : "?"} (era 50)`);
});

/* ═══ 4. IL RESTO DELLA CASSA NON SI È MOSSO (verde anche su gen-6.04) ═══ */
console.log("\n— 4. il resto della Cassa è fermo —");
await prova("§4", async () => {
  /* dopo il rientro col PIN l'app riparte dalla Home, non dalla Cassa: senza
     questo passo il controllo cerca i tasti del banco su un'altra schermata */
  await vaiA(A.p, "Cassa");
  await A.p.waitForTimeout(700);
  await A.p.getByRole("button", { name: "Aggiungi Acqua", exact: true }).click();
  await A.p.waitForTimeout(300);
  await incassa(A.p);
  await A.p.waitForTimeout(2000);
  const st = await salvato(A.p);
  ok((st?.vendite || []).length === 2, "con la rete viva si batte come sempre");
  ok((st?.giornate || []).length >= 1, "e la giornata si aggiorna");
});

/* ═══ 5. LA CODA SI VEDE, E DICE LA VERITÀ ═══ */
console.log("\n— 5. quello che non è ancora salvato si vede —");
const B = await apri("B", "2222");
await prova("§5", async () => {
  await entra(B.p, "OpCassa", "2222");
  await vaiA(B.p, "Cassa");
  await B.p.waitForTimeout(700);
  await B.p.evaluate(() => window.__uccidiRete(true));
  for (let i = 0; i < 3; i++) {
    await B.p.getByRole("button", { name: "Aggiungi Margherita", exact: true }).click();
    await B.p.waitForTimeout(250);
    await incassa(B.p);
    await B.p.waitForTimeout(400);
  }
  await B.p.waitForTimeout(2000);
  const coda = await codaSalvata(B.p);
  ok(Array.isArray(coda) && coda.length === 3,
    `tre vendite battute a rete morta, tre in coda salvate — ${Array.isArray(coda) ? coda.length : String(coda)}`);
  /* e NON devono esserci dati personali dentro la coda: quando arriveranno
     gli ordini col nome del cliente, questa chiave resta sul telefono ma non
     deve diventare un secondo posto dove si accumulano nomi e telefoni */
  const testo = JSON.stringify(coda);
  ok(!/telefono|indirizzo|"via"/i.test(testo),
    "e nella coda salvata non ci sono dati personali: è una fila di lavori, non una rubrica");
});

/* ═══ 6. NIENTE BYTE NUOVI SUL CANALE (verde anche su gen-6.04) ═══ */
console.log("\n— 6. il canale non è cresciuto —");
await prova("§6", async () => {
  await B.p.evaluate(() => window.__uccidiRete(false));
  await B.p.waitForTimeout(13000);
  const st = await salvato(B.p);
  ok(!("coda" in (st || {})), "la coda non è entrata nello stato che viaggia in rete");
  const chiavi = Object.keys(st || {});
  ok(!chiavi.some((k) => /coda|pendenti|inAttesa/i.test(k)),
    `nessuna chiave nuova di primo livello — ${chiavi.filter((k) => /coda|pendenti|inAttesa/i.test(k)).join(",") || "nessuna"}`);
  ok((st?.vendite || []).length === 3, "e le tre vendite dell'altro telefono sono tutte in rete");
});
ok(errs.length === 0, `zero errori JavaScript in tutto il giro${errs.length ? " — " + errs[0] : ""}`);

await A.ctx.close(); await B.ctx.close();
await b.close();
console.log(`\ngen605test: ${ko} controlli KO`);
process.exit(ko ? 1 : 0);
