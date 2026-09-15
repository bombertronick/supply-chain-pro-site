DISEGNO DI RECORD — IL CICLO SORPASSATO (15 settembre, per gen-6.21)

COME E' STATO FATTO. Il primo disegno (tre righe di cura, una scena minima a
tre battute) e' stato messo sotto processo contro il codice di gen-6.20 PRIMA
di scrivere una riga: quattro ricognizioni indipendenti sul file vivo (il
motore di sincronizza, tutte le strade che toccano codaRef, il cancello del
server, gli attrezzi dei banchi), sei lenti d'accusa (soldi-persi, soldi-doppi,
raggiungibilita', non-collaudabile, interazioni, vista-e-avvio) e DUE scettici
per accusa col mandato di demolirla. Regola di ferro: ogni accusa doveva
nominare una riga LETTA OGGI, col testo.
ESITO: 23 accuse, 16 in piedi, 7 confutate da tutti e due gli scettici.
Il disegno di partenza, spedito com'era scritto, NON PARTIVA: la sua cura
lanciava un ReferenceError in un ramo vivo, e la sua scena di collaudo era
VERDE anche col difetto dentro.

==============================================================================
IL DIFETTO, sul codice di gen-6.20 (app/app.jsx, 17.441 righe).

Il watchdog a 16754 — «if (inSyncRef.current && Date.now() - inSyncRef.current
< 12000) return;» — lascia partire un SECONDO ciclo di sincronizza quando il
primo e' appeso da piu' di dodici secondi. Ogni ciclo fotografa il PROPRIO
`inviate` (16813) e al ritorno esegue il PROPRIO
`codaRef.current = codaRef.current.slice(inviate)` (16896): un taglio per
POSIZIONE su una coda che nel frattempo e' cambiata.

LA SCENA CHE PERDE DAVVERO UN INCASSO — e sono QUATTRO condizioni, non tre.
La scena a tre battute del primo disegno non perdeva niente, e l'ha dimostrato
la lente «raggiungibilita'» leggendo 16904 («inSyncRef.current = 0;»): appena
il ciclo 2 esce, il watchdog non blocca piu' nessuno, quindi la battuta dopo si
porta dietro il proprio ciclo, si spedisce da sola e lascia la coda vuota —
sullo slice del ciclo lento non resta niente da tagliare. Perche' il danno
esista, il ciclo della voce nuova deve FALLIRE:
 (1) ciclo 1 appeso oltre 12 s COL COMMIT GIA' FATTO (il server committa e la
     risposta tarda: app_kv_set.sql:57-70, e scriviRemoto torna true al
     risveglio);
 (2) si batte B: il ciclo 2 parte, e la cernita di gen-6.20 toglie gia' A dalla
     coda perche' il ciclo 1 l'ha timbrata (16877) e il commit ha messo in rete
     il suo slot (16865) — quindi `inviate` del ciclo 2 vale 1, non 2. Il ciclo
     2 scrive, riesce, svuota la coda e azzera inSyncRef;
 (3) si batte C: il suo ciclo parte e la sua scrittura FALLISCE (rete che
     balla: e' la stessa rete che ha appeso il ciclo 1 per dodici secondi). La
     coda resta [C];
 (4) il ciclo 1 rientra: `slice(inviate=1)` su [C] -> [] . C non e' in rete,
     non e' in coda, e specchiaCoda l'ha tolta anche dal disco. Nessuna riga,
     nessun avviso, il pallino verde.

E C'E' UN SECONDO DANNO, PIU' FREQUENTE DEL PRIMO, che il primo disegno
metteva fra parentesi: il ciclo sorpassato, al ritorno, si comporta come se
fosse l'ultimo. Rimette in baseRef un documento piu' VECCHIO (16898), ci
ricostruisce sopra la vista (16899-16900), azzera inSyncRef (16904), mette il
semaforo su «ok» (16905) e riapre il rubinetto con pianifica (16905). E dentro
scriviRemoto ha gia' riscritto la spia: 221 «await window.storage.set
(CHIAVE_REV, String(stato.rev || 0), true)» — su una chiave che il cancello del
server NON protegge (app_kv_set.sql:43 guarda solo 'scp:stato:v1'), quindi
scp:rev:v1 TORNA INDIETRO. Da li' il poll di ogni telefono fermo a quella
revisione cade nel giro magro (17174) e non chiede piu' la lista per un massimo
di dieci giri, cioe' 26-35 secondi: e' cieco esattamente sui telefoni a cui
manca l'ultima vendita.

==============================================================================
LA CURA, in quattro tessere.

TESSERA 1 — LA FOTOGRAFIA VA DOVE NASCE «inviate», NON ACCANTO AL TIMBRO.
Il primo disegno diceva di dichiarare `const partite` a 16877 e di usarla
anche a 16823. 16823 gira PRIMA di 16877 nello stesso blocco: sarebbe stato un
ReferenceError da zona morta temporale, e non in un ramo raro — e' la via 2
della ricevuta, quella che protocollotest §13 esercita a ogni giro. La
fotografia va subito dopo 16813:
    const partite = codaRef.current.slice(0, inviate);
e i due tagli (16823 e 16896) diventano la stessa riga:
    codaRef.current = codaRef.current.filter((m) => !partite.includes(m));
Nel ramo della scorciatoia le due forme sono DIMOSTRABILMENTE equivalenti (fra
16813 e 16823 non c'e' nessun await, quindi `inviate` e' la lunghezza intera e
`partite` e' tutta la coda): si scrive uguale perche' la regola sia una sola,
non perche' li' serva.

TESSERA 2 — UN CICLO SORPASSATO NON COMANDA PIU'.
Un numero di generazione accanto agli altri ref, letto all'inizio del ciclo:
    const giroRef = useRef(0);
    ...
    const mio = ++giroRef.current;      // subito dopo inSyncRef.current = Date.now()
e al ritorno, in TUTTI E TRE i punti che concludono (scorciatoia, successo,
catch), una guardia sola: se `mio !== giroRef.current` il ciclo taglia le
PROPRIE voci (per identita') e si ferma li'. Niente baseRef, niente setStato,
niente semaforo, niente inSyncRef, niente pianifica, niente conteggio delle
riprove.
PERCHE' NON «nuovo.rev >= baseRef.rev», che era la proposta del primo disegno:
la lente «vista-e-avvio» ha dimostrato che quella guardia riapre di persona la
trappola che il commento di 16791-16799 dice di aver chiuso — quando la rev in
rete SCENDE per davvero (database ricostruito, seme nuovo a rev 1) e
ultimoProtRef vale ancora 0 perche' quel caricamento non ha mai scritto, la
scrittura passa il cancello ma la guardia rifiuterebbe di adottarla, e baseRef
resterebbe appeso a una revisione che in rete non esiste piu'. La rev e'
l'indizio sbagliato: confonde «un mio ciclo piu' recente ha gia' adottato» con
«la rete e' tornata indietro davvero». Il numero di giro distingue le due cose
senza guardare i dati.

TESSERA 3 — LA SPIA NON TORNA INDIETRO.
In scriviRemoto, la scrittura di CHIAVE_REV si fa solo se il numero SALE:
    let spiaScritta = 0;                                  // a modulo, accanto a CHIAVE_REV
    if ((stato.rev || 0) > spiaScritta) {
      try { await window.storage.set(CHIAVE_REV, String(stato.rev || 0), true); spiaScritta = stato.rev || 0; } catch {}
    }
LIMITE DICHIARATO: questo ferma solo le MIE scritture all'indietro. La spia e'
globale e un altro dispositivo puo' sempre riscriverla piu' bassa: la cura
completa e' un cancello su quella chiave dentro app_kv_set.sql, cioe' il
pavimento del traffico, e non si fa qui.

TESSERA 4 — IL RIPRISTINO CONTA TUTTA LA CODA.
17349 e' «const inFila = codaRef.current.filter((m) => m.tipo).length;», ma due
righe sotto 17392 fa «codaRef.current = [m];», che butta TUTTA la coda — anche
le mutazioni a closure (evasioni, produzioni, conteggi, e la riga stessa delle
ferme) che non hanno tipo e non stanno sul disco. La guardia e' piu' stretta
del danno che previene:
    const inFila = codaRef.current.length;
Il sostantivo del toast dice gia' «modifiche», quindi non cambia una parola di
quello che legge l'utente.

==============================================================================
QUELLO CHE NON SI SPEDISCE, E PERCHE'.

· LA SCORCIATOIA CHE ADOTTA UNA LETTURA GIA' GIUDICATA VECCHIA (16822-16825).
  Accusa in piedi, e vera: `stantia` si calcola a 16807 e si consuma solo a
  16812 per spegnere la cernita; il ramo del ritrovamento adotta quella stessa
  lettura in baseRef e nella vista senza chiedersi se e' vecchia. La cura e'
  una parola — «if (remoto && !stantia && !nuoveInCoda(base))» — ma non ho
  trovato un modo ONESTO di misurarla: ogni osservabile che ho provato (il
  totale a schermo, il toast «Connessione ripristinata», il numero di scritture
  rifiutate) e' soddisfatto anche senza la cura. Spedire una riga che nessun
  banco puo' far diventare rossa e' esattamente quello che questa casa non fa:
  diventa una voce di roadmap sua.
· LO SPECCHIO DELLA CODA E' UNA CHIAVE SOLA PER DUE SCHEDE. Accusa ALTA e vera,
  ma e' la voce «schede-gemelle» gia' aperta in roadmap da gen-6.20: la cura e'
  il proprietario della coda, non una riga.
· LE SETTE CONFUTATE stanno nel diario del giro e non qui: le due che valeva la
  pena ricordare sono «i 13 secondi sfondano il tetto del censimento» (falsa:
  corri.mjs da' 900 s per file) e «il collaudo sarebbe verde col difetto
  dentro» nella forma in cui era posta (vera in un altro senso, ed e' la scena
  a quattro condizioni qui sopra).

==============================================================================
IL COLLAUDO — collaudi/sorpassatotest.mjs, e serve UN attrezzo nuovo.

Il freno di protocollotest.mjs tiene appesa la set PRIMA del commit: per questa
scena serve il contrario — COMMITTA e poi tieni appesa la RISPOSTA — e serve
tenerne appese DUE insieme, rilasciandole nell'ordine scelto. Quindi: una MAPPA
di attese con chiave la rev dichiarata dalla bozza (leggibile da JSON.parse(v)
.rev dentro la set), `__appese()` che torna le chiavi vive e `__rilascia(rev)`
che ne risolve una sola. Con un resolver scalare come quello di oggi il secondo
arrivato sovrascriverebbe il primo e il ciclo lento resterebbe appeso PER
SEMPRE, senza nessun segnale: il banco sarebbe verde per il motivo peggiore.

§1 — LA VOCE BATTUTA NEL FRATTEMPO NON SPARISCE. La scena a quattro condizioni.
     Si pretende: C in rete, e la giornata che la conta una volta.
§2 — IL CICLO SORPASSATO NON RIAPRE IL RUBINETTO. Due cicli appesi, si rilascia
     il PIU' VECCHIO: si pretende che NON parta un terzo ciclo mentre il
     secondo e' ancora dentro l'attesa (si conta con __inSet, che e' gia' li').
§3 — LA SPIA NON TORNA INDIETRO. Stessa scena di §2: si pretende che
     db:scp:rev:v1 non scenda mai sotto il numero piu' alto gia' scritto.
§4 — IL RIPRISTINO CONTA TUTTA LA CODA. Si semina una voce ferma (>48 ore) che
     all'ingresso fa scrivere la riga delle ferme — che e' una mutazione a
     closure, senza tipo — con le scritture spente; poi si prova un ripristino.
     Si pretende il rifiuto, con il toast che dice «1 modifica ancora da
     salvare».
