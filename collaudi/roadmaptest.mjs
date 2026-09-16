/* La roadmap interattiva: si tocca come la toccherebbe Valerio, su un telefono
   stretto, e si controlla che il messaggio esca nell'ordine giusto. */
import { chromium } from "playwright";
import { existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const URL = "file://" + path.resolve("../roadmap.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true,
  hasTouch: true, deviceScaleFactor: 2, permissions: ["clipboard-read", "clipboard-write"] });
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
/* Il file grezzo non ha il <meta viewport>: quello lo mette l'involucro di
   claude.ai al momento della pubblicazione. Senza, Chromium impagina a 980px
   e il controllo «niente sborda» passerebbe a una larghezza finta. Lo aggiungo
   qui prima di caricare, così si misura la larghezza vera del telefono. */
await p.addInitScript(() => {
  document.addEventListener("readystatechange", () => {
    if (document.head && !document.querySelector('meta[name="viewport"]')) {
      const m = document.createElement("meta");
      m.name = "viewport";
      m.content = "width=device-width, initial-scale=1, viewport-fit=cover";
      document.head.prepend(m);
    }
  }, true);
});
await p.goto(URL); await p.waitForTimeout(400);
const largo = await p.evaluate(() => innerWidth);
ok(largo === 360, `la pagina si impagina alla larghezza vera del telefono (${largo}px)`);
await p.waitForTimeout(400);

/* ── IL RIQUADRO «DOVE SIAMO ADESSO» ──
   Questa pagina non e' solo un menu' di lavori: e' la memoria fra una
   conversazione e l'altra, e quel riquadro e' la parte che si legge per prima
   quando si riparte da zero. Un riquadro rimasto indietro e' peggio di uno
   assente: si riprende il lavoro da una versione che in cucina non c'e' piu'.
   Percio' qui non si controlla che «ci sia», si controlla che sia AGGANCIATO
   al resto: la versione che dichiara in cucina dev'essere raccontata anche
   fra le cose gia' fatte. Aggiornare l'uno e dimenticare l'altro diventa
   rosso. */
const stato = await p.evaluate(() => {
  const box = document.querySelector(".stato");
  if (!box) return null;
  const dt = [...box.querySelectorAll("dt")].map((x) => x.textContent.trim());
  /* 01/09: terzo banco con la famiglia «gen-5» inchiodata (dopo memoriatest e
     roadmap-md): col passaggio a gen-6 diceva «nessuna versione in cucina»
     su una roadmap che la nominava benissimo. La famiglia non e' un dato
     del collaudo: qualunque gen-N.NN. */
  const gen = (box.textContent.match(/gen-\d+\.\d+/) || [])[0] || null;
  const fatte = [...document.querySelectorAll("details .dentro")]
    .map((x) => x.textContent).join(" ");
  return { dt, gen, raccontata: gen ? fatte.includes(gen) : false };
});
ok(stato !== null, "in cima c'e' il riquadro «dove siamo adesso»");
ok(stato && stato.dt.length >= 4,
  `e dice tutte e quattro le cose: cosa gira, cosa e' stato fatto, cosa aspetta me, dove si riparte (${stato?.dt.length})`);
ok(!!stato?.gen, `nomina la versione che gira davvero in cucina (${stato?.gen || "nessuna"})`);
ok(stato?.raccontata,
  `e quella versione e' raccontata anche fra le cose gia' fatte — il riquadro non e' rimasto indietro`);

const voci = p.locator(".voce");
const n = await voci.count();
/* Dal 2 agosto le voci stanno in due elenchi — i difetti trovati dal consiglio
   e le migliorie — ma la numerazione resta una sola, perche' chi sceglie
   ragiona per priorita', non per riquadro. Il controllo che conta e' che i
   numeri scritti a parole in cima siano ancora veri: e' il punto in cui una
   pagina come questa mente per prima, aggiungendo una voce e lasciando la
   frase di ieri. */
const conteggi = await p.evaluate(() => {
  /* il numero puo' capitare a inizio frase o in mezzo: si confronta minuscolo,
     se no un «sei» perfettamente italiano diventa un falso allarme */
  /* «nessuno» e' il modo in cui questa pagina scrive lo zero, ed e' quello
     giusto: «restano zero difetti» non lo direbbe nessuno (31/08/2026). */
  const parole = { nessuno:0, nessuna:0, nessun:0, zero:0,
    una:1, uno:1, due:2, tre:3, quattro:4, cinque:5, sei:6, sette:7, otto:8,
    nove:9, dieci:10, undici:11, dodici:12, tredici:13 };
  const num = (t) => parole[(t || "").toLowerCase()] ?? null;
  /* 02/09: gli schemi cercano frasi con gli spazi dentro («non ne resta
     nessuno») e l'HTML va a capo dove capita: un a-capo fra «ne» e «resta»
     ha fatto diventare rossa questa pagina per una riscrittura del tutto
     legittima. E' la stessa famiglia della trappola del maiuscolo CSS: si
     confronta il testo NORMALIZZATO, non quello impaginato. */
  const testo = document.querySelector(".apertura").textContent.replace(/\s+/g, " ");
  /* Il controllo e' sul NUMERO, non su come e' scritta la frase: la frase
     d'apertura si riscrive a ogni generazione ed e' giusto che si riscriva.
     La prima versione di questi due schemi era incollata a una frase precisa
     («ne restano quattro veri») e il 4 agosto e' diventata rossa per una
     riscrittura del tutto legittima — un rosso che non voleva dire niente e
     che, preso alla lettera, avrebbe spinto a piegare il testo allo schema
     invece del contrario. Adesso si aggancia solo alla parola che conta. */
  return {
    /* due forme legittime, e non si sceglie fra loro: «restano N difetti»
       quando ce ne sono, «di difetti non ne resta nessuno» quando sono zero —
       li' il numero sta DOPO la parola, non prima (31/08/2026). */
    difetti: { detti: [/restan[oa][^.]*?(\w+)\s+difett/i, /difett[^.]*?non ne rest\w*\s+(\w+)/i]
                 .map((r) => num(testo.match(r)?.[1])).find((v) => v !== null) ?? null,
               contati: document.querySelectorAll("#lista-difetti .voce").length },
    altro:   { detti: num(testo.match(/(\w+)\s+(?:modifiche|migliorie)/i)?.[1]),
               contati: document.querySelectorAll("#lista-altro .voce").length },
  };
});
ok(n >= 2, `ci sono lavori da scegliere (${n})`);
ok(conteggi.difetti.contati + conteggi.altro.contati === n,
  `ogni voce sta in uno dei due elenchi, nessuna fuori (${conteggi.difetti.contati}+${conteggi.altro.contati} di ${n})`);
ok(conteggi.difetti.detti === conteggi.difetti.contati,
  `il testo in cima dice quanti sono i difetti (dice ${conteggi.difetti.detti}, ce ne sono ${conteggi.difetti.contati})`);
ok(conteggi.altro.detti === conteggi.altro.contati,
  `e quante sono le migliorie (dice ${conteggi.altro.detti}, ce ne sono ${conteggi.altro.contati})`);
ok((await p.locator("#copia").isDisabled()), "senza scelte il tasto Copia è spento");
ok(/Nessuna scelta/.test(await p.locator("#conteggio").innerText()), "e il conteggio lo dice");
await p.screenshot({ path: "rm-1-partenza.png", fullPage: true });

/* Tocco alcune voci in un ordine preciso: una in mezzo, la prima, l'ultima.
   Gli indici si ricavano da quante ce ne sono: la lista si accorcia ogni volta
   che ne completo una, e un indice fisso prima o poi punta nel vuoto — o,
   peggio, ripunta su una già toccata, e il secondo tocco la deseleziona
   invece di aggiungerne una terza. Con due voci sole si tocca due volte. */
const ordine = n >= 3 ? [Math.floor(n / 2), 0, n - 1] : [1, 0];
if (new Set(ordine).size !== ordine.length) throw new Error(`indici ripetuti: ${ordine}`);
const titolo = async (i) => (await voci.nth(i).locator(".titolo").innerText()).trim();
const titoli = [];
for (const i of ordine) titoli.push(await titolo(i));
for (const i of ordine) { await voci.nth(i).click(); await p.waitForTimeout(220); }

const posto = ["la prima toccata porta il numero 1", "la seconda il 2", "la terza il 3"];
for (let k = 0; k < ordine.length; k++) {
  const v = (await voci.nth(ordine[k]).locator(".num").innerText()).trim();
  ok(v === String(k + 1), `${posto[k]} («${titoli[k]}»)` + (v === String(k + 1) ? "" : ` — dice «${v}»`));
}
ok(new RegExp(`${ordine.length} lavori scelti, in ordine`).test(await p.locator("#conteggio").innerText()),
  `il conteggio dice quanti sono (${ordine.length})`);
ok(await voci.nth(ordine[0]).getAttribute("aria-pressed") === "true", "e chi legge lo schermo sa che è selezionata");

const testo = await p.locator("#msg").inputValue();
const righe = titoli.map((t, k) => `${k + 1}. ${t}`);
ok(righe.every((r) => testo.includes(r)),
  `il messaggio elenca i ${ordine.length} lavori nell'ordine in cui li ho toccati`);
ok(righe.every((r, k) => k === 0 || testo.indexOf(righe[k - 1]) < testo.indexOf(r)),
  "e l'ordine nel testo è quello vero, non alfabetico");
ok(/ordine dei lavori che ho scelto/.test(testo), "con una frase d'apertura che mi dice cos'è");
await p.screenshot({ path: "rm-2-scelte.png", fullPage: true });

/* ritocco la prima che avevo toccato: deve uscire, e TUTTE quelle che
   venivano dopo devono scalare di uno. Ritoccando l'ultima non si
   controllerebbe nessuna rinumerazione. */
await voci.nth(ordine[0]).click(); await p.waitForTimeout(250);
ok((await voci.nth(ordine[0]).locator(".num").innerText()).trim() === "·", "ritoccandola, esce dalla lista");
let scalati = "";
for (let k = 1; k < ordine.length; k++) {
  const v = (await voci.nth(ordine[k]).locator(".num").innerText()).trim();
  if (v !== String(k)) scalati += ` «${titoli[k]}» dice ${v} invece di ${k};`;
}
ok(scalati === "", "e chi veniva dopo si rinumera da solo" + scalati);
const testo2 = await p.locator("#msg").inputValue();
ok(!testo2.includes(titoli[0]), "e sparisce anche dal messaggio");

/* copia negli appunti */
await p.locator("#copia").click(); await p.waitForTimeout(500);
const appunti = await p.evaluate(() => navigator.clipboard.readText());
ok(appunti === testo2, "il tasto Copia mette negli appunti esattamente quel testo");
ok(/Copiato/.test(await p.locator("#copia").innerText()), "e lo conferma a schermo");

/* azzera */
await p.locator("#azzera").click(); await p.waitForTimeout(300);
ok((await p.locator("#conteggio").innerText()).includes("Nessuna scelta"), "«Azzera» rimette tutto a zero");
ok(await p.locator("#copia").isDisabled(), "e rispegne il tasto Copia");

/* niente deve uscire dallo schermo, e i tocchi devono essere grossi */
const g = await p.evaluate(() => {
  const out = [];
  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth + 1) out.push("la pagina scorre in orizzontale");
  for (const el of document.querySelectorAll("button, summary, textarea")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.height < 32) out.push(`tocco piccolo: «${(el.textContent || "").trim().slice(0, 22)}» ${Math.round(r.height)}px`);
    if (r.right > innerWidth + 1) out.push(`esce a destra: «${(el.textContent || "").trim().slice(0, 22)}»`);
  }
  /* la barra in basso non deve coprire l'ultimo contenuto */
  const barra = document.querySelector(".barra").getBoundingClientRect();
  const coda = document.querySelector(".coda").getBoundingClientRect();
  scrollTo(0, document.body.scrollHeight);
  return out;
});
for (const x of g) console.log("  ⚠ " + x);
ok(g.length === 0, "niente sborda e ogni tocco è almeno 32px");

/* si legge anche al buio */
await p.emulateMedia({ colorScheme: "dark" }); await p.waitForTimeout(400);
await voci.nth(1).click(); await p.waitForTimeout(250);
const contrasto = await p.evaluate(() => {
  const el = document.querySelector('.voce[aria-pressed="true"] .num');
  const s = getComputedStyle(el);
  const num = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
  const lum = (c) => { const [r, g2, b2] = num(c).map((v) => { v /= 255;
    return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
    return .2126 * r + .7152 * g2 + .0722 * b2; };
  const a = lum(s.backgroundColor), b3 = lum(s.color);
  return Math.round(((Math.max(a, b3) + .05) / (Math.min(a, b3) + .05)) * 10) / 10;
});
ok(contrasto >= 4.5, `al buio il numero sulla pastiglia si legge (contrasto ${contrasto}:1)`);
await p.screenshot({ path: "rm-3-buio.png", fullPage: true });


/* ─────────── LA PROVA CHE CONTA: SENZA PERMESSO AGLI APPUNTI ───────────
   Dentro la pagina pubblicata l'inquadratura non concede l'accesso agli
   appunti: la via moderna fallisce. Qui la nego apposta, che è la condizione
   in cui Valerio l'ha trovata rotta. */
const ctx2 = await b.newContext({ viewport: { width: 360, height: 740 },
  isMobile: true, hasTouch: true, deviceScaleFactor: 2 });  // nessun permesso
const p2 = await ctx2.newPage();
const errs2 = [];
p2.on("pageerror", (e) => errs2.push(e.message));
await p2.addInitScript(() => {
  const m = document.createElement("meta");
  m.name = "viewport"; m.content = "width=device-width, initial-scale=1";
  document.addEventListener("readystatechange", () => {
    if (document.head && !document.querySelector('meta[name="viewport"]')) document.head.prepend(m);
  }, true);
  /* come si comporta davvero un'inquadratura senza permesso: la promessa
     viene rifiutata, non è che il metodo non esista */
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: () => Promise.reject(new DOMException("blocked", "NotAllowedError")) },
  });
});
await p2.goto(URL); await p2.waitForTimeout(700);

const v2 = p2.locator(".voce");
/* anche qui gli indici si ricavano dal numero di voci: la lista si accorcia
   ogni volta che ne completo una, e un 5 fisso prima o poi punta nel vuoto.
   Devono restare due indici DIVERSI: se coincidono il secondo tocco
   deseleziona, il messaggio resta vuoto e «Copia» è spento. */
const n2 = await v2.count();
const idx2 = [Math.min(2, n2 - 2), n2 - 1];
if (idx2[0] === idx2[1] || idx2[0] < 0) throw new Error(`indici non validi: ${idx2} su ${n2} voci`);
for (const i of idx2) { await v2.nth(i).click(); await p2.waitForTimeout(200); }
const atteso = await p2.locator("#msg").inputValue();

await p2.locator("#copia").click(); await p2.waitForTimeout(600);
const etichetta = (await p2.locator("#copia").innerText()).trim();
ok(etichetta !== "Copia", `col permesso negato il tasto reagisce comunque («${etichetta}»)`);
ok(!/Selezionato/.test(etichetta), "e non lascia più il messaggio ambiguo di prima");

/* la seconda via deve aver selezionato il testo, così il menù del telefono si apre */
const sel = await p2.evaluate(() => {
  const t = document.getElementById("msg");
  return { da: t.selectionStart, a: t.selectionEnd, lung: t.value.length,
           aiuto: !document.getElementById("aiutoCopia").hidden };
});
if (etichetta === "Copia a mano") {
  /* terza via: entrambe fallite, il testo deve restare selezionato e va spiegato */
  ok(sel.da === 0 && sel.a === sel.lung && sel.lung > 0,
    `il testo resta tutto selezionato, pronto per il menù del telefono (${sel.a} caratteri)`);
  ok(sel.aiuto, "e compare la spiegazione di cosa fare");
} else {
  /* seconda via: ha copiato davvero. La selezione la tolgo apposta, e negli
     appunti ci deve essere esattamente il messaggio giusto. */
  ok(!sel.aiuto, "la via vecchia ha copiato, quindi nessuna spiegazione serve");
  const dentro = await p2.evaluate(async () => {
    const t = document.createElement("textarea");
    document.body.appendChild(t); t.focus();
    document.execCommand("paste");
    const v = t.value; t.remove(); return v;
  }).catch(() => null);
  ok(dentro === null || dentro === atteso || dentro === "",
    "e quello che ha messo negli appunti è il messaggio giusto");
}
ok(errs2.length === 0, "nessun errore JS col permesso negato" + (errs2.length ? " → " + errs2[0] : ""));
await p2.screenshot({ path: "rm-4-senza-permesso.png", fullPage: true });
await ctx2.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
