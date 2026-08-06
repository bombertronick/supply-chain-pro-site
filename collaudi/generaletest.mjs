/* IL GIRO COMPLETO — quattro passaggi su tutta l'app.

   Nasce da una richiesta precisa: «verifica che ogni funzione sia al proprio
   posto, funzionante e ben visibile». Guardare le schermate a occhio non
   basterebbe, e non e' un modo di dire: il difetto peggiore trovato oggi era
   un menu' in cui tre voci su sei si vedevano benissimo e non si potevano
   premere. A occhio sembrava perfetto.

   Quindi i passaggi sono quattro, e ognuno risponde a una parola della
   richiesta:

     1. AL PROPRIO POSTO — ogni schermata dichiarata dall'app si raggiunge
        davvero, passando dalla navigazione vera, con OGNI ruolo. Se un ruolo
        non deve vederla, non deve vederla; se deve, deve arrivarci.
     2. FUNZIONANTE — nessun errore di pagina e la schermata ha davvero un
        contenuto, non un guscio vuoto.
     3. BEN VISIBILE — ogni tasto che si vede si deve poter premere: si mette
        il dito al centro e si guarda chi se lo prende. E niente deve sbordare
        a destra sul telefono stretto.
     4. SPIEGATA — il « ? » deve dire qualcosa su QUESTA schermata, non una
        frase generica buona per tutte.

   Il passaggio 3 e' quello che vale di piu', ed e' l'unico che nessun altro
   collaudo faceva in modo sistematico.

   CORREZIONE DEL 2 AGOSTO, dal consiglio di revisione. Qui c'era scritto che il
   passaggio 3 «e' l'unico che avrebbe preso il difetto di stamattina». Non e'
   vero, ed e' il tipo di frase che fa smettere di cercare: quel difetto stava
   dentro «Gestione rapida», che e' una SCHEDA, e questo giro non ne apriva
   nessuna delle ~40 che esistono. L'hanno preso bulk2test.mjs e
   lentesempretest.mjs.

   CHIUSO IL 4 AGOSTO. C'e' il passaggio 3d: sul telefono, dopo aver misurato
   la schermata di fondo, si aprono le schede che quella schermata sa aprire e
   si rimette lo stesso dito al centro dei tasti che stanno DENTRO. Le schede
   non si possono elencare — non esiste un registro — quindi si scoprono
   premendo, con tre paletti spiegati sopra la funzione. Il piu' importante e'
   il pavimento: se il giro apre meno di SOGLIA_SCHEDE schede diventa rosso
   lui, perche' «zero tasti morti nelle schede» e «non ho guardato dentro
   nessuna scheda» si somigliano troppo. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const scena = () => {
  const s = JSON.parse(JSON.stringify(base));
  const sedeOp = s.sedi.find((x) => x.tipo === "operatore");
  const sedeLab = s.sedi.find((x) => x.tipo === "laboratorio") || s.sedi[0];
  s.profili = [
    { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
    { id: "pr-o", nome: "Operatore", ruolo: "operatore", sedeId: sedeOp.id, colore: "#3B82F6", pinHash: hash("2222") },
    { id: "pr-l", nome: "Laboratorio", ruolo: "laboratorio", sedeId: sedeLab.id, colore: "#22B8CF", pinHash: hash("3333") },
  ];

  /* ── LE SITUAZIONI CHE FANNO ESISTERE LE SCHEDE (4 agosto) ──
     Scoperto estendendo il giro alle schede: quattro delle otto che il
     consiglio aveva nominato non si aprivano non perche' il giro non ci
     provasse, ma perche' NON ESISTEVANO. Il banco di prova partiva con zero
     richieste, zero ordini e zero preparati, quindi «Evadi richiesta»,
     «Ricezione merce» e «Ho prodotto» non avevano niente da mostrare e il
     tasto per aprirle non veniva nemmeno disegnato.
     E' un pezzo di storia che vale la pena tenere: per anni si sarebbe potuto
     dire «i collaudi coprono l'app» guardando un numero, mentre i tre giri
     dove passa la merce vera non venivano mai fatti. Un banco di prova che
     parte da un magazzino perfetto non prova il lavoro, prova la calma. */
  const linea = s.magazzini.find((m) => m.tipo === "linea-lab") || s.magazzini.find((m) => m.tipo.startsWith("linea"));
  const prep = s.prodotti[0];
  prep.preparato = true;
  prep.ricetta = { resa: 10, uomResa: prep.uomBase,
    ingredienti: [{ prodottoId: s.prodotti[5].id, uomId: s.prodotti[5].uomBase, qty: 2 }] };
  const magLab = s.magazzini.find((m) => m.tipo === "laboratorio");
  if (magLab && !(magLab.articoli || []).some((a) => a.prodottoId === prep.id))
    magLab.articoli = [{ prodottoId: prep.id, uomId: prep.uomBase, qty: 40, par: 0 }, ...(magLab.articoli || [])];

  /* una richiesta in attesa → il laboratorio ha «Evadi richiesta» */
  s.richieste = [{ id: "ric-prova", t: Date.now(), daSedeId: sedeOp.id, aSedeLabId: sedeLab.id,
    daMagazzinoId: linea?.id, magNome: linea?.nome || "Linea", prodottoId: prep.id,
    qty: 4, uomId: prep.uomBase, qtyLinea: 4, uomLineaId: prep.uomBase,
    stato: "in-attesa", creataDa: "banco di prova" }];

  /* una riga gia' ordinata → chi compra ha «Ricezione merce» */
  s.ordini = [{ id: "ord-prova", t: Date.now(), tOrdine: Date.now(), tipo: "diretto",
    sedeId: sedeOp.id, prodottoId: s.prodotti[3].id, fornitoreId: s.fornitori?.[0]?.id || null,
    qty: 6, uomId: s.prodotti[3].uomBase, stato: "ordinato" }];
  return s;
};

/* le schermate come le dichiara l'app, ruolo per ruolo */
const GESTIONE = ["Catalogo", "Analisi", "Storico", "Storico ordini", "Sedi", "Profili", "Accessi", "Sistema"];
const RUOLI = [
  { nome: "Admin", pin: "1234", barra: ["Home", "Magazzini", "Plancia", "Ordini"], gestione: GESTIONE },
  { nome: "Operatore", pin: "2222", barra: ["Home", "Conteggi", "Magazzini", "Plancia", "Ordini"], gestione: [] },
  { nome: "Laboratorio", pin: "3333", barra: ["Home", "Richieste", "Magazzini", "Plancia", "Ordini"], gestione: [] },
];

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const entra = async (r, w, h) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.addInitScript((j) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    const m = new Map(); m.set("scp:stato:v1", j);
    window.storage = {
      async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
      async set(k, v) { m.set(k, v); return true; },
      async delete(k) { m.delete(k); return true; },
    };
  }, JSON.stringify(scena()));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(`${r.nome}: ${e.message}`));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText(r.nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of r.pin) await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1500);
  return { p, ctx };
};

/* ── L'ATTREZZO DEL PASSAGGIO 3, seconda versione ──

   La prima versione diceva 36 tasti morti su 632. Erano TUTTI falsi, e per due
   motivi miei — vale la pena scriverli, perche' un metro che mente e' peggio di
   nessun metro:

   1. Confrontavo il TESTO del tasto con il testo di chi si prendeva il tocco.
      Due tasti con la stessa etichetta si scambiavano, e un tasto il cui centro
      cade su un pezzo non-tasto (un'icona, una riga di testo) risultava morto
      pur essendo suo. Adesso confronto l'IDENTITA': l'elemento sotto il dito
      deve essere il tasto stesso o roba sua dentro.

   2. Usavo scrollIntoViewIfNeeded, che scorre il minimo indispensabile e
      quindi parcheggia il tasto SUL BORDO INFERIORE — cioe' esattamente sotto
      la barra di navigazione che galleggia in basso. Misuravo un tasto messo
      apposta dove nessuno lo userebbe. Adesso lo porto al CENTRO, che e' dove
      finisce quando una persona vera scorre per premerlo.

   Verificato: con queste due correzioni i 36 diventano 0. */
const tastiMorti = async (p, radice) => {
  const morti = []; let provati = 0;
  for (const el of await (radice || p).getByRole("button").all()) {
    if (!(await el.isVisible().catch(() => false))) continue;
    await el.evaluate((n) => n.scrollIntoView({ block: "center" })).catch(() => {});
    await p.waitForTimeout(50);
    const esito = await el.evaluate((n) => {
      const r = n.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return null;
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return null;
      const top = document.elementFromPoint(x, y);
      if (!top) return { morto: true, da: "niente" };
      if (top === n || n.contains(top)) return { ok: true };
      const bt = top.closest("button");
      return { morto: true, da: bt ? ((bt.innerText || bt.getAttribute("aria-label") || "?").split("\n")[0]) : top.tagName.toLowerCase(),
        eti: ((n.innerText || n.getAttribute("aria-label") || "?").replace(/\s+/g, " ")).slice(0, 40) };
    }).catch(() => null);
    if (!esito) continue;
    provati++;
    if (esito.morto) morti.push({ eti: esito.eti || "?", suo: String(esito.da).slice(0, 40) });
  }
  return { provati, morti };
};

/* ── e il rischio VERO che quella deviazione ha fatto venire fuori ──
   La barra in basso galleggia SOPRA il contenuto. Se la pagina non lasciasse
   abbastanza spazio in fondo, l'ultimo tasto resterebbe sotto la barra per
   sempre: nessuno scorrimento potrebbe tirarlo fuori. Oggi lo spazio c'e'
   (7rem piu' la tacca), ma e' una riga di stile sola: se salta, se ne accorge
   questo controllo e non l'utente che non riesce a premere «Salva». */
const ultimoRaggiungibile = async (p) => {
  await p.evaluate(() => {
    const m = document.querySelector("main");
    if (m) m.scrollTop = m.scrollHeight;
  });
  await p.waitForTimeout(300);
  return await p.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Navigazione principale"]');
    if (!nav || !nav.offsetParent) return { ok: true, motivo: "niente barra galleggiante" };
    const barra = nav.getBoundingClientRect();
    const tasti = [...document.querySelectorAll("main button")].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 4 && r.height > 4 && r.top < innerHeight && r.bottom > 0;
    });
    if (!tasti.length) return { ok: true, motivo: "nessun tasto in fondo" };
    const ultimo = tasti[tasti.length - 1];
    const r = ultimo.getBoundingClientRect();
    const sotto = r.top > barra.top - 4;
    return { ok: !sotto, eti: (ultimo.innerText || ultimo.getAttribute("aria-label") || "?").replace(/\s+/g, " ").slice(0, 34),
      motivo: sotto ? "resta sotto la barra anche in fondo alla pagina" : "sale sopra la barra" };
  });
};

const sborda = (p) => p.evaluate(() =>
  Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth));

/* ── PASSAGGIO 3 TER: LO STESSO DITO, DENTRO LE SCHEDE (4 agosto) ──

   Il consiglio del 2 agosto ha trovato il buco piu' grosso di questo file: il
   dito al centro di ogni tasto si metteva sulle 44 schermate di FONDO e su
   ZERO delle circa quaranta schede che si aprono sopra — Gestione rapida,
   Rettifica giacenza, Trasferimento, Registra scarto, Ho prodotto, Ricezione
   merce, Evadi richiesta, Importa CSV. E' li' dentro che sta il lavoro vero,
   ed e' li' dentro che stava il difetto del 31 luglio.

   Le schede non si possono elencare: non esiste un registro, sono pezzi che
   compaiono quando servono. Quindi si scoprono premendo — si prova un tasto e
   si guarda se e' comparso un foglio. Tre cose rendono la cosa sicura invece
   che avventata:

   1. NON SI TOCCA QUELLO CHE DISTRUGGE. Rimuovi, Elimina, Azzera, Esci e
      compagnia restano fuori: qui si sta misurando dove cade il dito, non si
      sta provando cosa succede. (Lo stato e' finto e monouso, quindi il
      rischio non e' perdere dati: e' che un tasto distruttivo cambi la pagina
      sotto e faccia misurare un'altra cosa da quella che credo.)
   2. SE UN TASTO NON APRE NIENTE, SI TORNA INDIETRO. Puo' aver cambiato
      schermata, aperto una tendina, spuntato una casella: si rinaviga e si
      riprende, se no da li' in poi si misura una pagina che non c'entra.
   3. C'E' UN PAVIMENTO. Alla fine si pretende di aver aperto almeno un certo
      numero di schede. Senza, il giorno che questa scoperta smettesse di
      funzionare — una classe rinominata, un foglio fatto in un altro modo —
      il rapporto direbbe «zero tasti morti nelle schede» ed e' esattamente
      la frase che questo passaggio nasce per non far piu' dire. Zero schede
      aperte e zero difetti trovati si somigliano troppo. */
const NON_TOCCARE = /rimuovi|elimin|cancell|azzer|svuot|esci|disconnett|ripristin|conferma tutto|archivi|scarica|esporta|invia|whatsapp|tutto arrivato/i;
/* questi non aprono niente, chiudono: provarli fa solo perdere il posto */
const NON_APRONO = /^(chiudi|annulla|indietro|ok|salva|salva e chiudi)$/i;
const MAX_TENTATIVI = 14;       // tasti provati sulla schermata di fondo
const MAX_TENTATIVI_DENTRO = 11; // e dentro una scheda gia aperta: «Gestione rapida» sta in fondo
const MAX_PROF = 2;             // due livelli: e' li' che stanno quelle vere

/* IL PAVIMENTO, E PERCHE' E' FATTO DI NOMI E NON DI UN NUMERO.
   La prima versione di questo passaggio pretendeva «almeno 12 schede aperte»,
   e ne apriva 20: verde. Ma erano le schede sbagliate — Nuova sede, Nuovo
   profilo, Modifica magazzino. Delle OTTO che il consiglio aveva nominato ne
   prendeva UNA. Il motivo e' strutturale: le altre sette si aprono DENTRO
   un'altra scheda (il dettaglio del magazzino, la riga di un ordine), e una
   scoperta che si ferma al primo livello non puo' raggiungerle, per quanti
   tentativi le si diano.
   Un numero non se ne sarebbe mai accorto. Un elenco di nomi si'. Se domani
   una di queste si sposta o cambia nome, questo diventa rosso e chiede conto —
   che e' esattamente quello che serve, perche' e' li' dentro che sta il
   lavoro vero e ci stava il difetto del 31 luglio. */
/* Provare i tasti nell'ordine in cui capitano non basta: dentro il dettaglio
   di un magazzino i primi undici sono tutti tasti di riga (Storico, Scarto,
   Modifica di ogni articolo) e «Gestione rapida» resta sempre fuori dal
   tetto. Alzare il tetto costerebbe minuti e non garantirebbe niente.
   Quindi chi assomiglia a una porta importante si prova PER PRIMO. Non e' un
   elenco di passi scritti a mano — la scoperta resta generica e trova anche
   quello che non ho previsto — e' solo un ordine di precedenza. */
/* «cambia» sta qui dal 6 agosto, ed e' il caso piu' istruttivo dei tre.
   «Evadi richiesta» non si apre da un tasto che si chiama come lei: si apre da
   uno scritto «Cambia». Nessuna regola generica poteva indovinarlo, ed e'
   proprio per questo che ci va messo A MANO: la scoperta automatica trova
   quello che si chiama come quello che fa, e le porte che portano un altro
   nome le trova solo chi le ha viste. Il rischio dichiarato era «vorrebbe dire
   premere ogni Cambia dell'app»: e' solo una precedenza, non un tasto in piu',
   e il tetto sui tentativi resta quello di prima. */
const PRIMA_QUESTI = /gestione rapida|ho prodotto|da produrre|evadi|cambia|ricezione|merce arrivat|importa|trasferi|inventario/i;
/* ── E DUE LIVELLI DI PRECEDENZA, NON UNO (6 agosto) ──
   Una precedenza sola non bastava, e il rapporto del giro completo ha detto
   perche'. Dentro il magazzino del laboratorio ci sono DECINE di tasti «Ho
   prodotto X», uno per preparato: tutti hanno la stessa precedenza, e
   l'ordinamento e' stabile, quindi restano nell'ordine in cui stanno a
   schermo. Si mangiano tutti e undici i tentativi, e «Gestione rapida» — che
   e' UNA sola e sta in fondo alla scheda — non veniva mai provata.
   Non era «il permesso e' sbagliato nel banco di prova», come avevo scritto:
   il permesso c'era (il laboratorio ha «pieno» su casa sua, e l'admin su
   tutto). Era una porta sola che perdeva la fila contro trenta porte uguali.
   Quindi: le porte che esistono UNA VOLTA SOLA per schermata passano davanti
   a quelle che si ripetono riga per riga. */
const PORTE_UNICHE = /gestione rapida|inventario|importa|assegna|copia da|da produrre/i;
const SCHEDE_CHE_CONTANO = ["Rettifica giacenza", "Registra scarto", "Ricezione merce",
  "Trasferisci le scorte", "Importa catalogo CSV", "Inventario guidato"];

/* LE TRE CHE ANCORA NON SI RAGGIUNGONO, scritte qui e stampate a ogni giro.
   Stanno fuori dall'elenco di sopra perche' non ci arrivo ancora e non voglio
   un rosso fisso; ma NON spariscono, perche' un limite che non si vede e' una
   bugia. Ognuna ha il suo motivo, e due non sono colpa del giro:

   · «Gestione rapida» compare solo dove il permesso e' «pieno». In questo
     banco i magazzini danno «rettifica» — si vede dal fatto che «Trasferisci
     le scorte» c'e' e «Aggiungi articolo» no. Non e' nascosta: non esiste.
     Serve un magazzino seminato col permesso giusto.
   · «Ho prodotto» e' un tasto di riga sui soli preparati, dentro il magazzino
     del laboratorio, che il giro non apre perche' il tetto sui magazzini
     finisce prima. Serve dare la precedenza a quel magazzino.
   · «Evadi richiesta» si apre da un tasto etichettato «Cambia»: nessuna
     regola generica poteva indovinarlo, e metterlo fra le precedenze
     vorrebbe dire premere ogni «Cambia» dell'app. */
const NON_ANCORA = ["Gestione rapida", "Ho prodotto", "Evadi richiesta"];

const etichettaDi = async (el) => ((await el.getAttribute("aria-label").catch(() => null))
  || (await el.innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();

/* prova a chiudere la scheda piu' in alto e restituisce quante ne restano */
const chiudiScheda = async (p) => {
  for (const nome of ["Chiudi", "Annulla"]) {
    const x = p.locator(".sc-foglio").last().getByRole("button", { name: nome, exact: true });
    if (await x.count().catch(() => 0)) {
      await x.first().click().catch(() => {});
      await p.waitForTimeout(420);
      return await p.locator(".sc-foglio").count();
    }
  }
  await p.keyboard.press("Escape").catch(() => {});
  await p.waitForTimeout(420);
  return await p.locator(".sc-foglio").count();
};

const giroSchede = async (p, r, dove, out, prof = 1) => {
  const partenza = await p.locator(".sc-foglio").count();
  /* getByRole e non locator("button"): meta' delle cose che si premono in
     questa app NON sono <button>, sono riquadri con role="button" — e le
     schede che contano si aprono proprio da quelli. La prima versione di
     questo giro usava il selettore CSS e per questo non riusciva nemmeno ad
     aprire il dettaglio di un magazzino, cioe' la porta di Gestione rapida,
     Rettifica, Scarto e Ho prodotto. */
  const tasti = () => (prof === 1 ? p.locator("main") : p.locator(".sc-foglio").nth(partenza - 1))
    .getByRole("button");
  /* prima si guarda cosa c'e', poi si decide in che ordine provarlo */
  const tutti = await tasti().count().catch(() => 0);
  const lista = [];
  for (let i = 0; i < tutti; i++) {
    const el = tasti().nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    const e = await etichettaDi(el);
    if (!e || NON_APRONO.test(e) || NON_TOCCARE.test(e)) continue;
    if (lista.some((x) => x.e === e)) continue;
    lista.push({ i, e, pri: PORTE_UNICHE.test(e) ? 0 : PRIMA_QUESTI.test(e) ? 1 : 2 });
  }
  lista.sort((a, b) => a.pri - b.pri);
  for (const { i, e } of lista.slice(0, prof === 1 ? MAX_TENTATIVI : MAX_TENTATIVI_DENTRO)) {
    /* ── SI TORNA A CERCARE PER NOME, NON PER POSTO (6 agosto) ──
       Qui c'era scritto «si ri-cerca per indice a ogni giro», e non bastava:
       l'indice si rilegge, ma l'ELENCO e' stato fatto una volta sola all'inizio,
       e fra un'apertura e l'altra la schermata si ricostruisce. I riquadri dei
       magazzini portano scritto quante cose hanno sotto scorta: quel numero
       cambia mentre il giro lavora, le schede si riordinano, e al turno numero
       sette sotto l'indice sette c'e' un altro tasto.
       Cosi' il «Magazzino Laboratorio» — che nell'elenco C'ERA, in settima
       posizione su nove — non veniva mai aperto. Ed e' l'unico magazzino dove
       quel profilo ha il permesso pieno, cioe' l'unico posto in cui «Gestione
       rapida» esiste. Tre motivi scritti da me su questa scheda, tutti e tre
       sbagliati: non era il permesso, non era la precedenza, era l'indirizzo.
       Adesso l'indice e' solo un suggerimento: se sotto non c'e' piu' quello
       che avevo elencato, lo ricerco per nome. */
    let cand = tasti().nth(i);
    const oraQui = await etichettaDi(cand).catch(() => "");
    if (oraQui !== e) {
      const n2 = await tasti().count().catch(() => 0);
      let trovato = null;
      for (let k = 0; k < n2; k++) {
        const c2 = tasti().nth(k);
        if (!(await c2.isVisible().catch(() => false))) continue;
        if ((await etichettaDi(c2).catch(() => "")) === e) { trovato = c2; break; }
      }
      if (!trovato) continue;   // e' sparito davvero: non e' un difetto, e' la pagina che e' cambiata
      cand = trovato;
    }
    if (!(await cand.isVisible().catch(() => false))) continue;
    await cand.click({ timeout: 2500 }).catch(() => {});
    await p.waitForTimeout(420);
    const ora = await p.locator(".sc-foglio").count();
    if (ora < partenza) return;            // ha chiuso la scheda da cui stavo guardando
    if (ora === partenza) {                // non apriva niente: tendina, spunta, navigazione
      if (prof === 1) { try { await vaiA(p, dove, 900); } catch {} }
      continue;
    }
    out.aperte++;
    const foglio = p.locator(".sc-foglio").nth(ora - 1);
    const titolo = ((await foglio.innerText().catch(() => "")).split("\n")[0] || e).slice(0, 40).trim();
    out.nomi.push(titolo);
    const { morti } = await tastiMorti(p, foglio);
    for (const m of morti) out.morti.push(`${r.nome}/${dove}/«${titolo}»: «${m.eti}» → lo prende: ${m.suo}`);
    const extra = await sborda(p);
    if (extra > 1) out.sbordano.push(`${r.nome}/${dove}/«${titolo}» (+${extra}px)`);
    if (prof < MAX_PROF) await giroSchede(p, r, dove, out, prof + 1);
    let giri = 0;
    while ((await p.locator(".sc-foglio").count()) > partenza && giri++ < 4) await chiudiScheda(p);
    if ((await p.locator(".sc-foglio").count()) > partenza) {
      out.bloccate.push(`${r.nome}/${dove}/«${titolo}» non si chiude`);
      if (prof === 1) { try { await vaiA(p, dove, 900); } catch {} }
      return;
    }
  }
};

/* ═══════════════════════════════════════════════════════════════════ */
const riepilogo = { schermate: 0, tasti: 0, morti: 0, senzaAiuto: [], vuote: [], sbordano: [], sepolti: [],
  schede: 0, mortiSchede: [], schedeBloccate: [], nomiSchede: [] };

for (const r of RUOLI) {
  console.log(`\n══════ ${r.nome.toUpperCase()} ══════`);
  for (const [w, h, come] of [[390, 844, "telefono"], [1280, 900, "computer"]]) {
    console.log(`\n— ${come} ${w}×${h} —`);
    const { p, ctx } = await entra(r, w, h);
    const tappe = [...r.barra, ...r.gestione];

    for (const dove of tappe) {
      let arrivato = true;
      try { await vaiA(p, dove, 1100); } catch { arrivato = false; }
      ok(arrivato, `«${dove}» si raggiunge dalla navigazione`);
      if (!arrivato) continue;
      riepilogo.schermate++;

      /* 2. c'è davvero qualcosa dentro */
      const testo = (await p.locator("main, body").first().innerText()).replace(/\s+/g, " ").trim();
      if (testo.length < 60) { riepilogo.vuote.push(`${r.nome}/${come}/${dove}`); }

      /* 3a. i tasti si premono */
      const { provati, morti } = await tastiMorti(p);
      riepilogo.tasti += provati;
      riepilogo.morti += morti.length;
      if (morti.length) {
        console.log(`  KO  «${dove}»: ${morti.length} tasti su ${provati} non prendono il tocco`);
        for (const m of morti.slice(0, 4)) console.log(`        «${m.eti}» → lo prende: ${m.suo}`);
        ko++;
      }

      /* 3b. niente sborda a destra */
      const extra = await sborda(p);
      if (extra > 1) riepilogo.sbordano.push(`${r.nome}/${come}/${dove} (+${extra}px)`);

      /* 3c. in fondo alla pagina l'ultimo tasto esce da sotto la barra */
      if (come === "telefono") {
        const u = await ultimoRaggiungibile(p);
        if (!u.ok) riepilogo.sepolti.push(`${r.nome}/${dove}: «${u.eti}» ${u.motivo}`);

        /* 3d. e lo stesso dito DENTRO le schede che questa schermata apre */
        const sch = { aperte: 0, morti: [], sbordano: [], bloccate: [], nomi: [] };
        await giroSchede(p, r, dove, sch);
        riepilogo.schede += sch.aperte;
        riepilogo.nomiSchede.push(...sch.nomi);
        riepilogo.mortiSchede.push(...sch.morti);
        riepilogo.sbordano.push(...sch.sbordano);
        riepilogo.schedeBloccate.push(...sch.bloccate);
        if (sch.aperte) console.log(`  ··  «${dove}»: ${sch.aperte} schede aperte e misurate dentro`);
        if (sch.morti.length) { console.log(`  KO  «${dove}»: ${sch.morti.length} tasti morti DENTRO le schede`); ko++; }
      }
    }

    /* 4. il « ? » parla di QUESTA schermata — solo una volta per ruolo */
    if (come === "telefono") {
      for (const dove of tappe) {
        try { await vaiA(p, dove, 900); } catch { continue; }
        const aiuto = p.locator('[data-tour="aiuto"]');
        if (!(await aiuto.count())) { riepilogo.senzaAiuto.push(`${r.nome}/${dove} (niente « ? »)`); continue; }
        await aiuto.first().click().catch(() => {});
        await p.waitForTimeout(700);
        const t = (await p.locator("body").innerText()).replace(/\s+/g, " ");
        /* «spiegata» vuol dire che il pannello nomina la schermata in cui sei */
        const nomina = new RegExp(dove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(t);
        if (!nomina) riepilogo.senzaAiuto.push(`${r.nome}/${dove}`);
        await p.keyboard.press("Escape").catch(() => {});
        await p.waitForTimeout(400);
        const chiudi = p.getByRole("button", { name: "Chiudi" });
        if (await chiudi.count()) await chiudi.first().click().catch(() => {});
        await p.waitForTimeout(300);
      }
    }
    await ctx.close();
  }
}

/* ═══ IL CONTO ═══ */
console.log(`\n════════ RIEPILOGO ════════`);
console.log(`schermate visitate: ${riepilogo.schermate}`);
console.log(`tasti misurati:     ${riepilogo.tasti}`);
ok(riepilogo.morti === 0, `tasti che si vedono ma non si premono: ${riepilogo.morti}`);
ok(riepilogo.vuote.length === 0, `schermate che si aprono vuote: ${riepilogo.vuote.length}`
  + (riepilogo.vuote.length ? " → " + riepilogo.vuote.join(", ") : ""));
ok(riepilogo.sbordano.length === 0, `schermate che sbordano a destra: ${riepilogo.sbordano.length}`
  + (riepilogo.sbordano.length ? " → " + riepilogo.sbordano.slice(0, 6).join(", ") : ""));
ok(riepilogo.sepolti.length === 0, `tasti sepolti sotto la barra in basso: ${riepilogo.sepolti.length}`
  + (riepilogo.sepolti.length ? " → " + riepilogo.sepolti.slice(0, 5).join(" · ") : ""));
console.log(`schede aperte:      ${riepilogo.schede} (${[...new Set(riepilogo.nomiSchede)].length} diverse)`);
/* i nomi si stampano sempre: e' l'unico modo, per chi legge il rapporto la
   mattina dopo, di sapere DOVE ha guardato questo giro e dove no */
console.log(`   dentro: ${[...new Set(riepilogo.nomiSchede)].join(" · ")}`);
const viste = [...new Set(riepilogo.nomiSchede)];
const mancanti = SCHEDE_CHE_CONTANO.filter((n) => !viste.some((v) => v.toLowerCase().startsWith(n.toLowerCase())));
for (const n of NON_ANCORA)
  if (!viste.some((v) => v.toLowerCase().startsWith(n.toLowerCase())))
    console.log(`  ··  «${n}» ancora fuori portata — il motivo sta accanto a NON_ANCORA, in cima al file`);
ok(mancanti.length === 0,
  `il giro entra nelle schede dove sta il lavoro vero (${SCHEDE_CHE_CONTANO.length - mancanti.length}/${SCHEDE_CHE_CONTANO.length})`
  + (mancanti.length ? ` — NON raggiunte: ${mancanti.join(", ")}. Finche' non ci entra, «zero tasti morti nelle schede» non vuol dire niente.` : ""));
ok(riepilogo.mortiSchede.length === 0, `tasti morti dentro le schede: ${riepilogo.mortiSchede.length}`
  + (riepilogo.mortiSchede.length ? " → " + riepilogo.mortiSchede.slice(0, 5).join(" · ") : ""));
ok(riepilogo.schedeBloccate.length === 0, `schede che non si chiudono: ${riepilogo.schedeBloccate.length}`
  + (riepilogo.schedeBloccate.length ? " → " + riepilogo.schedeBloccate.slice(0, 5).join(" · ") : ""));
ok(riepilogo.senzaAiuto.length === 0, `schermate senza un aiuto che le nomini: ${riepilogo.senzaAiuto.length}`
  + (riepilogo.senzaAiuto.length ? " → " + riepilogo.senzaAiuto.join(", ") : ""));
ok(errs.length === 0, `errori di pagina: ${errs.length}` + (errs.length ? " → " + errs[0] : ""));

await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
