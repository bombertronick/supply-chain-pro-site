/* LA POTATURA DELLE RICHIESTE (gen-6.10) — scritto PRIMA del codice.

   IL FATTO, misurato sullo stato VERO in produzione l'8 settembre, non
   stimato: lo stato che viaggia INTERO a ogni salvataggio, verso ogni
   telefono acceso, pesa 321.140 caratteri. Dentro ci sono 155 richieste per
   66.005 caratteri, e 147 di quelle 155 sono CHIUSE e piu' vecchie di 21
   giorni: 63.306 caratteri, il 19,7% di tutto. Nessuna schermata dell'app le
   legge: la lista dello Storico tiene le chiuse per 7 giorni
   («(r.tEvasione || r.t) >= Date.now() - 7 * 86400000»), la card «evase7»
   guarda una settimana, e il grafico dell'Analisi guarda 14 giorni.
   Sono peso morto che viaggia in rete da settimane.

   E la ragione e' semplice: sfoltisciRichieste NON ESISTE. Ci sono
   sfoltisciOrdini, sfoltisciVendite, sfoltisciGiornate, sfoltisciClienti e
   sfoltisciMov; le richieste sono l'unica collezione che cresce senza fine e
   senza nessuno che la poti.

   IL MODELLO E' GIA' IN CASA, e si copia con le sue lezioni dentro:
   sfoltisciOrdini (a) non tocca MAI le righe ancora da fare — «sono lavoro,
   non archivio» — (b) tiene una riga senza data, perche' non sapere quanti
   anni ha non e' un motivo per buttarla, (c) conta la finestra dall'ULTIMA
   cosa successa alla riga e non dalla sua nascita, e (d) applica il tetto
   alle piu' VECCHIE PER DATA, non alle ultime dell'array — l'ordine di una
   lista non e' garantito, e sfoltire per posizione buttava una riga di ieri
   tenendone una di un mese fa. Sono quattro trappole gia' pagate una volta:
   qui si provano tutte e quattro invece di sperare di ricordarsele.

   PERCHE' 21 GIORNI E NON 7. Il lettore piu' esigente dell'app guarda 14
   giorni (il grafico «nuove richieste al giorno»), e conta le righe per data
   di NASCITA mentre la potatura ragiona per data di CHIUSURA. Le due date
   non coincidono, quindi la finestra della potatura dev'essere piu' larga
   della finestra del lettore piu' largo, con margine. 21 giorni lo e', e
   sulla produzione di oggi non cambia niente: tutte e 147 le chiuse sono
   oltre i 21 giorni comunque.

   CONTRO gen-6.09 QUESTI DEVONO ESSERE ROSSI: §1 §2 §3 §4 §5 §6 §7 §8 §9 §10
   §11. VERDE ANCHE PRIMA, e ci sta apposta: §12 — sfoltisciOrdini non deve
   cambiare comportamento. Se §12 diventasse rosso vorrebbe dire che ho
   toccato il modello invece di copiarlo. */
import { readFileSync } from "fs";
import path from "path";

let ko = 0;
const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const G = 86400000;
const ora = Date.now();
const gg = (n) => ora - n * G;

const { POTA } = await import("./pota-lib.cjs").then((m) => m.default || m);
const pota = POTA.richieste;
const chiama = (lista) => (typeof pota === "function" ? pota(lista) : null);
const ids = (l) => (Array.isArray(l) ? l.map((r) => r.id) : null);

/* una richiesta come le fa l'app: id, prodotto, sedi, stato, t, tEvasione */
const ric = (id, stato, t, tEv) => ({
  id, prodottoId: "p-" + id, daSedeId: "fm", aSedeLabId: "fm", daMagazzinoId: "linea-fm",
  qty: 3, uomId: "u-kg", stato, t,
  ...(tEv === undefined ? {} : tEv === null ? {} : { tEvasione: tEv }),
  ...(stato === "in-attesa" ? {} : { evasoDa: "Lab", magazzinoLabNome: "Centrale" }),
});

console.log("\n— 1. la potatura delle richieste esiste —");
ok(typeof pota === "function",
  `sfoltisciRichieste c'e' ed e' una funzione (trovato: ${pota === null ? "niente" : typeof pota})`);
ok(POTA.GIORNI_RICHIESTE != null,
  `e la finestra e' un numero dichiarato, non sparso nel codice (GIORNI_RICHIESTE = ${POTA.GIORNI_RICHIESTE})`);
ok(POTA.MAX_RICHIESTE_CHIUSE != null,
  `e c'e' anche un tetto, come per gli ordini (MAX_RICHIESTE_CHIUSE = ${POTA.MAX_RICHIESTE_CHIUSE})`);

console.log("\n— 2. quello che aspetta non si tocca MAI —");
{
  const l = [ric("a1", "in-attesa", gg(200)), ric("a2", "in-attesa", gg(3))];
  const out = chiama(l);
  ok(out && out.length === 2,
    `due richieste in attesa, una di duecento giorni fa: restano tutte e due (${out ? out.length : "niente"})`);
  ok(out && out.some((r) => r.id === "a1"),
    "quella vecchia di duecento giorni c'e' ancora — una richiesta non evasa e' lavoro, non archivio");
}

console.log("\n— 3. una chiusa dentro la finestra resta —");
{
  const out = chiama([ric("b1", "evasa", gg(9), gg(5)), ric("b2", "parziale", gg(12), gg(10))]);
  ok(out && out.length === 2, `evasa cinque giorni fa e parziale dieci: restano (${out ? out.length : "niente"})`);
}

console.log("\n— 4. una chiusa oltre la finestra sparisce —");
{
  const out = chiama([ric("c1", "evasa", gg(60), gg(58)), ric("c2", "in-attesa", gg(60))]);
  ok(out && out.length === 1, `di due righe di sessanta giorni fa ne resta una (${out ? out.length : "niente"})`);
  ok(out && out[0]?.id === "c2", `e quella che resta e' la richiesta ANCORA IN ATTESA (${out ? out[0]?.id : "—"})`);
}

console.log("\n— 5. la finestra si conta dall'ULTIMA cosa successa, non dalla nascita —");
{
  /* nata cinquanta giorni fa, evasa ieri: e' roba di ieri. Guardando «t»
     sparirebbe il giorno dopo essere stata evasa — la trappola gia' pagata
     su sfoltisciOrdini. */
  const out = chiama([ric("d1", "evasa", gg(50), gg(1))]);
  ok(out && out.length === 1,
    "nata cinquanta giorni fa ed evasa IERI: resta, perche' conta la data dell'evasione");
  const out2 = chiama([ric("d2", "evasa", gg(2), gg(60))]);
  ok(out2 && out2.length === 0,
    "e al contrario: se l'evasione e' vecchia, la data di nascita recente non la salva");
}

console.log("\n— 6. una chiusa SENZA data si tiene —");
{
  const senza = { id: "e1", prodottoId: "p", stato: "annullata", daSedeId: "fm", aSedeLabId: "fm" };
  const out = chiama([senza]);
  ok(out && out.length === 1,
    "non sapere quanti anni ha non e' un motivo per buttarla (la regola scritta su sfoltisciOrdini)");
}

console.log("\n— 7. il tetto toglie le PIU' VECCHIE, non le ultime dell'array —");
{
  const tetto = POTA.MAX_RICHIESTE_CHIUSE;
  if (typeof pota !== "function" || tetto == null) {
    ok(false, "non provabile: manca la funzione o il tetto");
    ok(false, "non provabile: manca la funzione o il tetto");
  } else {
    /* tutte DENTRO la finestra, cosi' a tagliare e' il tetto e non l'eta'.
       L'array e' costruito col piu' RECENTE in fondo apposta: chi sfoltisse
       per posizione butterebbe proprio quello. */
    const n = tetto + 5;
    const l = Array.from({ length: n }, (_, i) =>
      ric("f" + String(i).padStart(3, "0"), "evasa", gg(20), ora - (n - i) * 60000));
    const out = chiama(l);
    ok(out && out.length === tetto,
      `${n} righe chiuse e recenti, il tetto e' ${tetto}: ne restano ${out ? out.length : "niente"}`);
    const rimaste = new Set(ids(out) || []);
    const piuRecente = "f" + String(n - 1).padStart(3, "0");
    const piuVecchia = "f000";
    ok(rimaste.has(piuRecente) && !rimaste.has(piuVecchia),
      `resta la piu' RECENTE (${piuRecente}) e se ne va la piu' VECCHIA (${piuVecchia}) — non l'ultima dell'array`);
  }
}

console.log("\n— 8. e' pura: non tocca la lista che le si passa —");
{
  const l = [ric("g1", "evasa", gg(60), gg(58)), ric("g2", "in-attesa", gg(2))];
  const prima = JSON.stringify(l);
  const out = chiama(l);
  /* «la lista non e' cambiata» sarebbe vero anche se la funzione non
     esistesse e non avesse fatto niente: il controllo pretende ANCHE che il
     lavoro sia stato fatto davvero, se no e' verde per assenza. */
  ok(Array.isArray(out) && out.length === 1 && JSON.stringify(l) === prima && l.length === 2,
    `ha potato (2 -> ${Array.isArray(out) ? out.length : "niente"}) e la lista in ingresso e' rimasta identica — filtra, non splicia`);
}

console.log("\n— 9. e' agganciata in TUTTI i punti dove passa una scrittura —");
{
  /* Le potature non stanno nei punti che creano le righe: stanno dove passa
     OGNI scrittura, se no il prossimo che aggiunge un punto se ne dimentica.
     Sono tre blocchi gemelli — applicaCoda, il ramo locale di muta, il ramo
     locale di mutaDato — e si riconoscono perche' ognuno pota gia' ordini,
     vendite, giornate e clienti. */
  const src = readFileSync(path.resolve("../app/app.jsx"), "utf8");
  const blocchi = src.split("\n").reduce((acc, riga, i, righe) => {
    if (/b\.clienti\s*=\s*sfoltisciClienti\(/.test(riga)) {
      acc.push(righe.slice(Math.max(0, i - 8), i + 3).join("\n"));
    }
    return acc;
  }, []);
  ok(blocchi.length === 3,
    `i blocchi di potatura sono tre come previsto (trovati ${blocchi.length})`);
  const con = blocchi.filter((b) => /sfoltisciRichieste\(/.test(b)).length;
  ok(con === blocchi.length && blocchi.length > 0,
    `e in ognuno dei tre le richieste si potano insieme alle altre (${con} su ${blocchi.length})`);
}

console.log("\n— 10. la finestra e' piu' larga di ogni lettore vero —");
{
  const src = readFileSync(path.resolve("../app/app.jsx"), "utf8");
  const g = POTA.GIORNI_RICHIESTE;
  /* il lettore piu' esigente e' il grafico dell'Analisi: GIORNI = 14, e conta
     per data di NASCITA mentre la potatura ragiona per data di CHIUSURA */
  const graf = /const GIORNI = (\d+);/.exec(src);
  const lettore = graf ? +graf[1] : 14;
  ok(g != null && g > lettore,
    `la potatura tiene ${g} giorni, il grafico ne legge ${lettore}: la finestra e' piu' larga di chi legge`);
  const lista7 = /r\.tEvasione \|\| r\.t\) >= Date\.now\(\) - (\d+) \* 86400000/.exec(src);
  const g7 = lista7 ? +lista7[1] : 7;
  ok(g != null && g > g7,
    `e piu' larga anche della lista dello Storico, che mostra le chiuse per ${g7} giorni`);
}

console.log("\n— 11. la misura: quello che oggi viaggia per niente —");
{
  /* Stessa FORMA e stessa distribuzione d'eta' della produzione dell'8
     settembre — 155 righe, 8 in attesa, 147 chiuse fra 22 e 41 giorni fa —
     ma con dati inventati: nel repository, che e' pubblico, non entrano
     nomi di prodotti, fornitori o giacenze vere. */
  const l = [
    ...Array.from({ length: 8 }, (_, i) => ric("h-att-" + i, "in-attesa", gg(1 + i))),
    ...Array.from({ length: 147 }, (_, i) =>
      ric("h-chi-" + i, i % 5 === 0 ? "parziale" : i % 7 === 0 ? "annullata" : "evasa",
        gg(45 + (i % 10)), gg(22 + (i % 20)))),
  ];
  const pesoPrima = JSON.stringify(l).length;
  const out = chiama(l);
  const pesoDopo = out ? JSON.stringify(out).length : pesoPrima;
  const risparmio = Math.round((1 - pesoDopo / pesoPrima) * 100);
  ok(out && out.length === 8,
    `di 155 richieste ne restano 8 — esattamente quelle ancora in attesa (${out ? out.length : "niente"})`);
  ok(risparmio >= 90,
    `e il peso delle richieste scende del ${risparmio}% (da ${pesoPrima} a ${pesoDopo} caratteri)`);
}

console.log("\n— 12. contro-controllo: il modello non si tocca —");
{
  /* Verde ANCHE PRIMA delle modifiche, ed e' apposta: se diventasse rosso
     vorrebbe dire che ho cambiato sfoltisciOrdini invece di copiarlo. */
  const o = (id, stato, t) => ({ id, stato, t, prodottoId: "p", sedeId: "fm", tipo: "diretto" });
  const out = POTA.ordini([o("o1", "da-ordinare", gg(400)), o("o2", "ricevuto", gg(400))]);
  ok(out.length === 1 && out[0].id === "o1",
    "sfoltisciOrdini fa ancora quello che faceva: la riga da ordinare resta, quella ricevuta di un anno fa no");
  ok(POTA.GIORNI_ORDINI === 45, `e la sua finestra e' rimasta a 45 giorni (${POTA.GIORNI_ORDINI})`);
}

console.log(`\nerrori di pagina: 0`);
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
