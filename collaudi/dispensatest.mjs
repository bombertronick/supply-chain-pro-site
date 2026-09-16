/* La dispensa: il contesto esterno che non si esaurisce.

   COSA DEVE ESSERE VERO:
   1. NIENTE SPARISCE IN SILENZIO. I tetti si rifiutano a voce alta.
   2. IL RIPIEGAMENTO NON PERDE IL FILO: l'indice ricorda chi ha assorbito
      cosa, anche ricompattando nello stesso sunto.
   3. DUE MANI NON SI PESTANO — e questa e' la parte RIFATTA dopo la
      demolizione a tre lenti: tutti e tre i revisori hanno trovato che il
      primo cancello MENTIVA AL PERDENTE (controllava «rev = rev+1», che e'
      esattamente cio' che il vincitore rende vero), e che i DELETE
      giravano fuori dal cancello. Adesso ogni mutazione e' UN SOLO
      statement: l'esito conta le righe toccate dal MIO aggiornamento
      (CTE con returning), e ogni scrittura/cancellazione di voce e'
      condizionata a quelle righe. Questo collaudo lo pretende sulla FORMA
      dell'SQL, perche' il database da qui non c'e': il §3 e' rosso contro
      la prima versione dell'attrezzo.
   4. IL GIRO BASE64 E' FEDELE, accenti e apostrofi compresi.
   5. LO SNAPSHOT E' UNA SORGENTE SOLA e si valida: rev e voci insieme,
      mai piu' spezzati fra riga di comando e file condiviso. */
import { TETTI, idValido, misura, ripulisci, leggiSnapshot, vociDopoScrittura, controllaTetti,
  sqlScrivi, sqlTogli, sqlCompatta, sqlLeggi, sqlUltima, sqlVerifica } from "../strumenti/dispensa.mjs";
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const rifiuta = (f) => { try { f(); return false; } catch { return true; } };

console.log("\n— 1. i tetti parlano invece di mordere —");
const voci = [{ id: "aa", t: 1, tag: "sapere", titolo: "A", car: 100 }];
ok(controllaTetti(voci, "x".repeat(TETTI.VOCE)) === null, "una voce ESATTAMENTE al tetto passa");
ok(controllaTetti(voci, "x".repeat(TETTI.VOCE + 1)) !== null, "un carattere oltre viene rifiutato");
ok(String(controllaTetti(voci, "x".repeat(TETTI.VOCE + 1))).includes("divisa"), "e il rifiuto dice cosa fare");
const tante = Array.from({ length: TETTI.VOCI }, (_, i) => ({ id: `v${i}`, t: 1, tag: "x", titolo: "V", car: 10 }));
ok(controllaTetti(tante, "ciao") !== null, "la 501ª voce viene rifiutata");
ok(controllaTetti(tante, "ciao", { id: "v7" }) === null, "ma SOVRASCRIVERE una delle 500 passa: non e' una voce in piu'");
const grosse = Array.from({ length: 200 }, (_, i) => ({ id: `g${i}`, t: 1, tag: "x", titolo: "G", car: 15000 }));
ok(controllaTetti(grosse, "ciao") !== null, "il tetto TOTALE viene rifiutato");
ok(controllaTetti(grosse, "x".repeat(14000), { id: "g0" }) === null,
  "sovrascrivere non conta doppio: il vecchio peso esce dal conto (era il difetto r80)");
const senzaSpazio = grosse.slice(0, 199);
ok(controllaTetti(senzaSpazio, "x".repeat(15001)) !== null, "un carattere oltre il tetto totale non entra…");
ok(controllaTetti(senzaSpazio, "x".repeat(15001), { assorbite: ["g0", "g1"] }) === null,
  "…ma con DUE assorbite si': e' il delta che prova che compattare fa spazio (niente verde a vuoto)");
ok(misura("🍕🍕") === 2, "i caratteri sono punti di codice veri: due pizze sono 2, non 4");

console.log("\n— 2. il ripiegamento non perde il filo —");
const s0 = { rev: 4, voci: [...voci, { id: "bb", t: 2, tag: "x", titolo: "B", car: 9 },
  { id: "sunto-1", t: 3, tag: "sunto", titolo: "S", car: 5, assorbe: ["vecchia-z"] }] };
const sqlC = sqlCompatta(s0, { id: "sunto-1", tag: "sunto", titolo: "S2", testo: "il sunto nuovo", assorbite: ["aa", "bb"] });
const corpoC = JSON.parse(Buffer.from([...sqlC.matchAll(/decode\('([A-Za-z0-9+/=]+)', 'base64'\)/g)][0][1], "base64").toString("utf8"));
const sunto = corpoC.voci.find((v) => v.id === "sunto-1");
ok(JSON.stringify([...sunto.assorbe].sort()) === JSON.stringify(["aa", "bb", "vecchia-z"]),
  `ricompattare nello stesso sunto FONDE la scia, non la sostituisce (${sunto.assorbe.join(",")})`);
ok(rifiuta(() => sqlCompatta(s0, { id: "s2", tag: "s", titolo: "S", testo: "x", assorbite: ["manca"] })),
  "assorbire una voce inesistente si rifiuta");
ok(rifiuta(() => sqlCompatta(s0, { id: "sunto-1", tag: "s", titolo: "S", testo: "x", assorbite: ["sunto-1"] })),
  "un sunto non puo' assorbire se stesso");
ok(rifiuta(() => sqlCompatta(s0, { id: "s2", tag: "s", titolo: "S", testo: "x", assorbite: [] })),
  "compattare senza assorbire non vuol dire niente");

console.log("\n— 3. due mani non si pestano: il cancello onesto, dentro UN solo statement —");
const s1 = { rev: 7, voci };
const sqlS = sqlScrivi(s1, { id: "prova-x", tag: "sapere", titolo: "P", testo: "ciao" });
ok(/with agg as \(/.test(sqlS) && /returning 1/.test(sqlS),
  "l'aggiornamento dell'indice restituisce le righe che HA toccato");
ok(/\(value::jsonb->>'rev'\)::int = 7/.test(sqlS), "e tocca solo alla revisione letta (7)");
ok(/exists \(select 1 from agg\)\s*\n\s*on conflict/.test(sqlS) || /select 'ctx:v1:voce:prova-x'[\s\S]*?where exists \(select 1 from agg\)/.test(sqlS),
  "la voce si deposita SOLO se l'indice e' passato: niente orfani");
ok(/case when exists \(select 1 from agg\)/.test(sqlS),
  "e l'esito conta le righe MIE, non lo stato che un vincitore concorrente rende vero (il falso verde trovato da tutti e tre)");
ok(!/=\s*8\b/.test(sqlS.split("case when")[1] || ""), "nell'esito non c'e' piu' nessun confronto con rev+1");
ok((sqlS.match(/;/g) || []).length === 1, `ed e' UN solo statement (un ';'), non tre: niente stati intermedi (${(sqlS.match(/;/g) || []).length})`);
const sqlT = sqlTogli(s1, "aa");
ok(/delete from kv_store where key = 'ctx:v1:voce:aa' and exists \(select 1 from agg\)/.test(sqlT),
  "anche il DELETE di «togli» sta dietro il cancello");
const sqlC2 = sqlCompatta({ rev: 3, voci: [...voci, { id: "bb", t: 2, tag: "x", titolo: "B", car: 9 }] },
  { id: "s9", tag: "sunto", titolo: "S", testo: "sunto", assorbite: ["aa", "bb"] });
ok(/delete from kv_store where key in \('ctx:v1:voce:aa', 'ctx:v1:voce:bb'\)\s*\n\s*and exists \(select 1 from agg\)/.test(sqlC2),
  "e quello di «compatta»: in conflitto non si distrugge NIENTE (era il difetto r131)");
const corpoS = JSON.parse(Buffer.from([...sqlS.matchAll(/decode\('([A-Za-z0-9+/=]+)', 'base64'\)/g)][0][1], "base64").toString("utf8"));
ok(corpoS.rev === 8 && corpoS.voci.some((v) => v.id === "prova-x" && v.car === 4),
  "l'indice nuovo porta rev 8 e la voce con la sua misura");
ok(rifiuta(() => sqlScrivi(s1, { id: "MAIUSCOLO", tag: "x", titolo: "X", testo: "x" })), "un id fuori regola si rifiuta");
ok(!idValido("a'; drop table kv_store; --"), "un id con dentro dell'SQL non e' un id");
ok(rifiuta(() => sqlLeggi(["buono", "an'che-no"])), "anche «leggi» valida gli id (prima non lo faceva)");

console.log("\n— 4. il giro base64 e' fedele, e «mostra» non si fa contraffare —");
const testo = "È l'unità « perché » — con /[\\u0300-\\u036f]/ dentro.";
const sql3 = sqlScrivi({ rev: 0, voci: [] }, { id: "fedele", tag: "prova", titolo: "F", testo });
const dentro = [...sql3.matchAll(/decode\('([A-Za-z0-9+/=]+)', 'base64'\)/g)];
/* contava i blocchi base64 e ne pretendeva DUE. Col secondo cancello (16
   settembre) sono tre — indice nuovo, voci vecchie da confrontare, testo — e
   l'asserzione e' diventata rossa per un motivo che non c'entrava niente col
   suo mestiere. Un'asserzione che conta i pezzi invece di dire l'invariante si
   rompe ogni volta che il pezzo in piu' e' un miglioramento. L'invariante vero
   e' questo: niente di lungo viaggia IN CHIARO. */
ok(dentro.length >= 2, `testo e indice viaggiano in base64 (${dentro.length} blocchi)`);
ok(!sql3.includes(testo), "e il testo non compare in chiaro da nessuna parte nello statement");
ok(!/'\{"rev"/.test(sql3), "e nemmeno il corpo dell'indice");
ok(dentro.some((m) => Buffer.from(m[1], "base64").toString("utf8") === testo),
  "e decodificato torna IDENTICO, apostrofi e accenti compresi");
const esc = String.fromCharCode(27);
ok(!ripulisci(esc + "[31mfinto" + esc + "[0m").includes(esc),
  "le sequenze ANSI di una voce non arrivano al terminale: una voce non puo' travestirsi da banner");

console.log("\n— 5. lo snapshot e' una sorgente sola, e si valida —");
ok(leggiSnapshot('{"rev":3,"voci":[{"id":"ok-1","t":1,"tag":"x","titolo":"O","car":5}]}').rev === 3,
  "uno snapshot sano si legge");
ok(leggiSnapshot('[{"value":"{\\"rev\\":2,\\"voci\\":[]}"}]').rev === 2,
  "anche salvato cosi' come esce da execute_sql, senza rimaneggiarlo");
ok(rifiuta(() => leggiSnapshot('{"voci":[]}')), "senza revisione si rifiuta");
ok(rifiuta(() => leggiSnapshot('{"rev":1}')), "senza voci si rifiuta");
ok(rifiuta(() => leggiSnapshot('{"rev":1,"voci":[{"id":"x1","titolo":"X"}]}')),
  "una voce senza misura si rifiuta: non si scrive alla cieca su un indice malformato");

console.log("\n— 6. lo snapshot ricopiato a mano non puo' riscrivere le voci vecchie —");
/* IL PASSO PIU' PERICOLOSO DI TUTTO IL RITUALE, misurato il 16 settembre.
   Lo snapshot dell'indice va ricopiato A MANO dal risultato di execute_sql a un
   file locale: oggi sono 7.363 caratteri su una riga sola, di cui il 64% sono
   TITOLI di voci vecchie. Se chi ricopia sbaglia UN carattere dentro il titolo
   di una voce vecchia, leggiSnapshot lo accetta (valida solo rev, l'array e la
   misura), vociDopoScrittura ricicla le voci verbatim, e l'UPDATE le riscrive
   TUTTE in produzione col refuso dentro. L'esito stampato dice «scritto: …
   rev N+1», che e' vero. Il danno e' IRREVERSIBILE: kv_store non ha storico.
   Prima di oggi non se ne accorgeva nessuno — nemmeno questo banco.
   Adesso il cancello dello statement pretende che le voci vecchie del file
   siano ESATTAMENTE quelle in rete, e in conflitto non tocca niente. */
const vecchieVere = [{ id: "aa", t: 1, tag: "x", titolo: "Titolo vecchio", car: 10 },
                     { id: "cc", t: 2, tag: "y", titolo: "Un altro", car: 20 }];
const sqlG = sqlScrivi({ rev: 5, voci: vecchieVere }, { id: "nuova", tag: "sapere", titolo: "N", testo: "testo" });
ok(/md5\(\(value::jsonb->'voci'\)::text\)/.test(sqlG),
  "l'UPDATE confronta le voci in rete con quelle del file, non solo la revisione");
const impronte = [...sqlG.matchAll(/decode\('([A-Za-z0-9+/=]+)', 'base64'\)/g)]
  .map((m) => Buffer.from(m[1], "base64").toString("utf8"));
ok(impronte.some((t) => { try { return JSON.stringify(JSON.parse(t)) === JSON.stringify(vecchieVere); } catch { return false; } }),
  "e le voci vecchie viaggiano nello statement per essere confrontate in rete");
ok(/SNAPSHOT DIVERSO/.test(sqlG),
  "e quando non combaciano l'esito lo DICE, invece di dire «conflitto» e mandare a cercare la persona sbagliata");
ok(/CONFLITTO/.test(sqlG) && /SNAPSHOT DIVERSO/.test(sqlG),
  "e i due casi restano distinti: «un altro ha scritto» non e' «hai ricopiato male»");
ok((sqlG.match(/;/g) || []).length === 1,
  `ed e' ancora UN solo statement (${(sqlG.match(/;/g) || []).length} «;»): il cancello non si e' spezzato in due`);

console.log("\n— 7. si puo' chiedere qual e' l'ULTIMA voce, invece di tenerlo a mente —");
/* Il puntatore all'ultima voce era tenuto a mano in prosa dentro PASSAGGIO.md,
   in DUE posti, e il 16 settembre erano gia' diversi: il primo messaggio da
   incollare mandava alla penultima. Un dato che si puo' chiedere non si tiene
   a mente. */
ok(typeof sqlUltima === "function", "il comando «ultima» esiste");
const su = sqlUltima();
/* ── APERTO DAL SABOTAGGIO 5 ──
   Prima qui c'era «la stringa contiene voci'->-1», e restava VERDE spostando
   l'ID alla posizione 0: gli altri campi continuavano a dire -1 e il test
   trovava lo stesso quello che cercava. Un'asserzione che cerca una sottostringa
   «da qualche parte» non sta guardando il campo che le interessa. Adesso ogni
   campo dell'ultima voce deve venire dalla POSIZIONE -1, uno per uno. */
for (const campo of ["id", "titolo", "tag"])
  ok(su.includes(`value::jsonb->'voci'->-1->>'${campo}'`),
    `«${campo}» dell'ultima voce viene dalla POSIZIONE -1, non da un timestamp`);
ok(!/->'voci'->[0-9]+->>/.test(su),
  "e nessun campo viene pescato da una posizione fissa dall'inizio");
ok(/jsonb_array_length/.test(su), "e dice anche quante voci ci sono");

console.log("\n— 8. si puo' verificare l'indice senza riscriverlo —");
ok(typeof sqlVerifica === "function", "il comando «verifica» esiste");
const sv = sqlVerifica();
ok(/md5\(v->>'titolo'\)/.test(sv), "e chiede l'impronta del titolo, che e' la parte piu' esposta al refuso");
ok(!/update|insert|delete/i.test(sv), "e non scrive niente: e' una domanda, non una mutazione");

console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
