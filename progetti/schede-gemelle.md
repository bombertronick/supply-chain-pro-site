DISEGNO DI RECORD — LE SCHEDE GEMELLE (16 settembre, per gen-6.22)

COME E' STATO FATTO. Il candidato — «il proprietario della fila»: una busta
{pad, t, voci} sul disco, con regola di scrittura, regola di lettura, rilascio
e scadenza — e' stato messo sotto processo contro il codice di gen-6.21 PRIMA
di scrivere una riga: quattro ricognizioni indipendenti sul file vivo (la vita
della coda e CHIAVE_CODA, la ricevuta di gen-6.20 e fin dove arriva, l'avvio
col ritrovamento e lo steccato d'eta', e una ricognizione sugli ATTREZZI dei
banchi che ha misurato cose che nessun file dichiarava), sei lenti d'accusa
(soldi-doppi, soldi-persi, il-tempo, non-misurabile, vita-scheda, interazioni).
Regola di ferro: ogni accusa doveva nominare una riga LETTA OGGI, col testo.
ESITO: 38 accuse, 38 IN PIEDI, ZERO confutate. Sette «fatali».

IL VERDETTO, e viene prima di tutto: IL CANDIDATO NON SI SPEDISCE.
Non una sua variante, non una sua versione con N tarato meglio: la forma
«proprietario + scadenza» e' morta, e le tre ragioni stanno tutte nel codice.

 1. N NON ESISTE. Perche' §16b resti verde — la scheda sola che si chiude e si
    riapre deve ritrovare i SUOI incassi, ed e' «la cosa piu' importante che
    questa app faccia coi soldi» — la busta lasciata dal caricamento di prima
    deve gia' risultare scaduta quando la scheda nuova legge il disco: uno o
    due secondi. Il caricamento nuovo e' un «altro» per costruzione, perche'
    mittRef e' dispositivo + CARICAMENTO (app/app.jsx:16636-16637) e la sua
    lapide lo vuole apposta: «un mittente che sopravvive al ricaricamento
    rimetterebbe in piedi esattamente il problema delle due schede»
    (16634-16635). Dall'altra parte N deve essere piu' lungo del piu' lungo
    silenzio di una scheda VIVA: e quel silenzio non ha tetto, perche' quando
    la lettura fallisce sincronizza lancia a 16797 («if (!letto &&
    (baseRef.current?.rev || 0) > 1) throw new Error("lettura non riuscita");»)
    e la sola specchiaCoda del ciclo sta 135 righe piu' sotto, a 16932. A rete
    giu' e senza gesti, i tocchi al minuto sono ZERO. N < 2 secondi e N >
    minuti: l'insieme e' vuoto.
    E l'uscita di sicurezza ovvia e' murata: pad = solo dispositivo fa tornare
    verde §16b, ma le due gemelle SONO lo stesso dispositivo (CHIAVE_DISP sta
    in localStorage, 750-751), quindi ognuna sarebbe «mia» per l'altra e la
    cura non farebbe piu' niente. Non c'e' nessun valore di pad che tenga
    insieme §16b e §17.

 2. LA REGOLA DI LETTURA FABBRICA UN DOPPIONE CHE OGGI NON ESISTE, ed e' il
    peggiore di tutto il dossier perche' nessuna delle due reti puo' fermarlo.
    La scheda che RIFIUTA di adottare esce dall'avvio con «ritrovate = 0», e
    allora 17163 — «setSync(ritrovate ? "salvataggio" : "ok");» — le accende
    il pallino VERDE, e 17147 («if (ritrovate) { setSync("salvataggio");
    setDaSalvare(ritrovate); }») non alza nessuna spia. La sua giornata si
    costruisce sulla rete pura, senza i 6,50 che l'altra scheda ha in coda.
    Schermo che dice insieme TUTTO SALVATO e SCONTRINO MANCANTE: il
    proprietario conclude l'unica cosa concludibile e RIBATTE. Lo scontrino
    ribattuto ha un v.id nuovo e un logId nuovo: la guardia a 978 («if
    ((s.vendite || []).some((x) => x && x.id === v.id)) return false;») non ha
    niente da confrontare, e il dedup a 16702 nemmeno. Oggi, senza il
    candidato, quella scheda adotta, mostra i 6,50 e la pastiglia «salvataggio»,
    e nessuno tocca niente.

 3. LA SCADENZA NON SI PUO' FAR DIVENTARE ROSSA, e il rituale su questo non
    tratta. In tutta collaudi/ non esiste una sola sessione CDP (grep di
    newCDPSession|CDPSession|WebLifecycle|setVirtualTimePolicy: soli riscontri
    dentro node_modules/playwright-core). Misurato oggi con sonde fuori dal
    repository: Page.setWebLifecycleState 'frozen' NON ferma i timer (12 tic in
    1,2 s sulla pagina «congelata»), e Emulation.setVirtualTimePolicy 'pause'
    li ferma davvero ma al risveglio recupera 604.365 tic in un colpo — che non
    e' un telefono che si riaccende. E c'e' una terza ragione che viene dal
    codice: il ramo d'errore ripianifica sempre (17014) e ogni riprova ripassa
    da 16932, quindi sul banco una scheda viva e senza rete rinfresca t ogni
    <=8 s PER SEMPRE: la sua busta non scade mai. Si potrebbe misurare solo il
    caso facile (la busta davvero abbandonata) e mai quello che fa male (il
    proprietario vivo che sembra morto).

Quindi si spedisce SOLO LA META' CHE SI PUO' DIMOSTRARE — il danno B — e la si
spedisce senza orologio, senza identita' e senza cambiare la forma del record.
L'altra meta' resta aperta, misurata, e detta a voce.

==============================================================================
IL DIFETTO, sul codice di gen-6.21 (app/app.jsx, 17.519 righe).

Due schede della stessa origine — l'app installata e il sito aperto nel browser
sullo stesso telefono — condividono localStorage e quindi CHIAVE_CODA
("scp:coda:v1", 1407), e non si vedono fra loro. Verificato per assenza: le
parole BroadcastChannel, navigator.locks e addEventListener("storage")
compaiono in DUE righe di tutto il file, ed e' il commento di mittRef che ne
dichiara l'assenza (16624-16625). Zero occorrenze di onstorage, pagehide,
freeze, resume, beforeunload, unload, sessionStorage.

DANNO B — SOLDI PERSI. specchiaCoda scrive la PROPRIA coda sulla chiave e, se
la propria coda non ha voci con un tipo, RIMUOVE la chiave:

    17060  const salvabili = codaRef.current.filter((m) => m.tipo);
    17063  if (salvabili.length) localStorage.setItem(CHIAVE_CODA, ...);
    17064  else localStorage.removeItem(CHIAVE_CODA);

DANNO A — SOLDI DOPPI. L'avvio adotta quello che trova, incondizionatamente
(«codaRef.current = fresche;», 17145), e da li' la stessa vendita vive in due
code con due identita' diverse (oggetti nuovi da JSON.parse), quindi i tagli
per identita' di chi l'aveva battuta (16874, 16949) non la toccheranno mai.

==============================================================================
LA SCENA CHE PERDE DAVVERO, e non e' quella che il candidato raccontava.

Il candidato diceva «basta che B salvi una volta». E' peggio: NON SERVE CHE LA
SECONDA SCHEDA INCASSI NIENTE. Il filtro della 17060 tiene solo le voci con un
tipo, cioe' le quattro di mutaDato; tutto quello che passa da muta() e' una
closure senza tipo. Allora:

  · in cucina qualcuno spunta una comanda, oppure un admin rinomina un
    fornitore, oppure l'app scrive da sola la riga delle ferme all'ingresso:
    muta() accoda (17045) e chiama pianifica(0) (17048);
  · sincronizza entra perche' la coda non e' vuota (16786) e arriva a 16932,
    «specchiaCoda();», che sta PRIMA dell'await;
  · salvabili e' vuoto, si va sul ramo else, e la fila di vendite dell'altra
    scheda sparisce dal disco.

E il caso peggiore e' quando la rete va male, cioe' esattamente quando la coda
dell'altra scheda e' piu' piena: su errore si ripianifica con backoff fino a
8 s (17014), su conflitto fra 90 e ~350 ms piu' un supplemento (17000), e ogni
riprova ripassa da 16932. Con una coda di sole closure sono fino a sette o otto
removeItem al minuto, a scheda ferma, senza che nessuno abbia battuto niente.
MISURATO (protocollotest §16, scritta oggi sul codice di gen-6.21): dopo il
salvataggio della seconda scheda il disco legge null; riaperta l'app, la
giornata dice 6,50 con UNA vendita invece di 13,00 con due.

E LA SCENA CHE RADDOPPIA, misurata anche quella (§17): una voce NUDA sul disco
— senza mitt e senza prot, che e' «la copia presa prima del primo timbro» che
§12b dichiara di non coprire — adottata da due schede, con s.applicate e
s.vendite consumate come in una serata piena: la giornata dice 13,00 con DUE
vendite invece di 6,50 con una. La finestra della voce nuda e' piu' larga di
come sembrava: il timbro nasce dentro sincronizza, che parte da entra(), cioe'
DOPO il login — quindi dura quanto la schermata dei nomi e del PIN.

==============================================================================
LA CURA, in quattro tessere. Nessun orologio, nessuna identita' nuova, nessun
cambio di forma del record.

TESSERA 1 — CHI SCRIVE SUL DISCO FONDE, NON SOSTITUISCE.
Il danno B non ha bisogno di sapere chi e' vivo: ha bisogno che nessuno tocchi
le voci che non ha messo lui. L'identita' esiste gia' ed e' m.logId, che sta su
ogni voce di mutaDato (17072) e sopravvive al JSON. Serve una sola cosa nuova:
il registro di quello di cui QUESTO caricamento si e' preso carico, accanto
agli altri ref (dopo 16604).

    const mieRef = useRef(new Set());

e una sola mano che scrive la chiave, DICHIARATA PRIMA di specchiaCoda — la
zona morta temporale e' la trappola che gen-6.21 ha gia' pagato una volta:

    /* la SOLA mano che scrive scp:coda:v1 (gen-6.22) */
    const scriviCoda = (miei) => {
      try {
        let altrui = [];
        try {
          const g = localStorage.getItem(CHIAVE_CODA);
          const dentro = g ? JSON.parse(g) : null;
          if (Array.isArray(dentro))
            altrui = dentro.filter((m) => m && m.tipo && m.logId && !mieRef.current.has(m.logId));
        } catch {}
        const tutte = [...altrui, ...miei];
        if (tutte.length) localStorage.setItem(CHIAVE_CODA, JSON.stringify(tutte));
        else localStorage.removeItem(CHIAVE_CODA);
      } catch {}
    };

    const specchiaCoda = () => {
      const salvabili = codaRef.current.filter((m) => m.tipo);
      setDaSalvare(salvabili.length);
      for (const m of salvabili) if (m.logId) mieRef.current.add(m.logId);
      scriviCoda(salvabili);
    };

Le altrui vanno PRIMA delle mie: sono arrivate prima, e all'avvio applicaCoda
le rigioca nell'ordine dell'array.
La removeItem non sparisce, CAMBIA SOGGETTO: si toglie la chiave solo quando
dopo la fusione non resta niente DI NESSUNO. Cosi' la riga 17064 smette di
essere «la mia coda e' vuota, butto tutto» e diventa «sul telefono non c'e'
piu' niente da salvare», che e' la cosa che quella riga ha sempre voluto dire.
setDaSalvare resta la PRIMA riga della funzione e gira sempre: il numero in
alto continua a parlare della coda in memoria, come promette la sua lapide
(16565-16568), e nessuna guardia gli va davanti.
mieRef NON HA TETTO, ed e' voluto: una voce che uscisse dal registro
tornerebbe «di un altro» e verrebbe risuscitata sul disco dopo essere stata
consegnata — cioe' un incasso rigiocato. Una serata da trecento scontrini
costa qualche kilobyte in memoria di pagina.
IL VERSO IN CUI SBAGLIA: una voce sul disco SENZA logId non e' riconoscibile e
viene lasciata cadere alla prima fusione. Oggi non esiste — mutaDato e' l'unico
produttore e il logId lo mette sempre (17072), e tutti i semi dei banchi ne
hanno uno — ma il verso va scelto: tenerla vorrebbe dire riscriverla accanto a
se stessa a ogni giro, farla crescere senza fine sul disco e poi rigiocarla N
volte all'avvio, perche' senza logId nemmeno il dedup di applicaCoda (16702)
la ferma. Duplicare senza freno e' peggio che perdere una voce che il codice
di oggi non sa produrre.

TESSERA 2 — IL RITROVAMENTO SCRIVE CON LA STESSA MANO.
Anche l'avvio riscrive la chiave, con la stessa logica «la mia coda e' la
verita'» (17149), e quella riga puo' cancellare uno scontrino che l'altra
scheda ha accodato fra il getItem della 17118 e li'. Due innesti:
  · a 17145, nello stesso gesto dell'adozione, si prende carico di tutto
    quello che si e' letto — le fresche perche' vanno in coda, le ferme perche'
    le ho spostate io nell'altra chiave:

        codaRef.current = fresche;
        for (const m of buone) if (m.logId) mieRef.current.add(m.logId);

    senza questa riga le fresche finirebbero sia fra le «mie» sia fra le
    «altrui» alla fusione, e si sdoppierebbero sul disco;
  · a 17149 il corpo dell'if diventa una chiamata sola: «scriviCoda(fresche);».
Il catch della 17152 resta com'e', e puo' restarci perche' scriviCoda non
lancia mai: l'unica cosa che ancora arriva li' e' un JSON illeggibile, che e'
illeggibile per tutti e non toglie niente a nessuno.

TESSERA 3 — LE FERME NON SI APPENDONO DUE VOLTE.
CHIAVE_FERMA e' il secondo disco conteso, e il candidato non lo nominava
nemmeno. L'append di 17141 e' una concatenazione pura con un tetto sulla coda
dell'array: ogni doppione spinge fuori in silenzio una ferma vera, e l'annuncio
all'ingresso (17389-17390) somma gli stessi euro due volte e manda a ribattere
uno scontrino. Una riga:

    const avanti = Array.isArray(gia) ? gia : [];
    const nuove = ferme.filter((m) => !(m.logId && avanti.some((x) => x && x.logId === m.logId)));
    if (nuove.length)
      localStorage.setItem(CHIAVE_FERMA, JSON.stringify([...avanti, ...nuove].slice(-50)));

QUI IL VERSO E' L'OPPOSTO DELLA TESSERA 1, E APPOSTA: una ferma senza logId si
appende lo stesso. La coda sul disco e' merce che si rigioca da sola, e li' un
doppione e' un incasso contato due volte; le ferme sono un BIGLIETTO PER UNA
PERSONA, e li' un biglietto di troppo si legge, uno di meno e' un incasso che
nessuno va a guardare.

TESSERA 4 — IL RIPRISTINO CONTA IL TELEFONO, NON LA SCHEDA.
17422 e' «const inFila = codaRef.current.length;»: conta la coda di QUESTA
scheda, e la fila dell'altra non la vede nessuno. La tessera 1 allunga la vita
di quella fila (prima veniva cancellata, adesso resta), quindi il buco diventa
piu' raggiungibile proprio per merito della cura: si chiude insieme, non dopo.
Il ripristino azzera tutto e scrive «s.scritture = {}» (17457-17458), cioe'
butta ogni ricevuta: le voci ancora in mano all'altra scheda si rigiocherebbero
al buio, senza ricevuta e senza testimoni.

    const fuoriDaMe = () => {
      try {
        const g = localStorage.getItem(CHIAVE_CODA);
        const dentro = g ? JSON.parse(g) : null;
        if (!Array.isArray(dentro)) return 0;
        return dentro.filter((m) => m && m.tipo && m.logId && !mieRef.current.has(m.logId)).length;
      } catch { return 0; }
    };
    const inFila = codaRef.current.length + fuoriDaMe();

E IL TOAST DEVE CAMBIARE, perche' com'e' scritto direbbe una cosa falsa: «aspetta
che il pallino in alto torni verde» non succedera' mai per una voce che questa
scheda non spedira'. Diventa:

    "Non ripristino: c'è 1 modifica ancora da salvare su questo telefono.
     Aspetta che il pallino in alto torni verde; se resta verde, chiudi le
     altre schede dell'app e riapri."

(e la forma plurale uguale, con il numero). L'istruzione e' giusta in tutti e
due i casi: se l'altra scheda e' viva la si chiude, se e' morta basta riaprire
— il ritrovamento adotta e spedisce. La sottostringa «1 modifica ancora da
salvare» resta intatta, quindi sorpassatotest §4 (446-447) non si tocca.
LA PASTIGLIA E IL RIFIUTO POSSONO DISSENTIRE, ed e' voluto: la pastiglia parla
di quello che QUESTA scheda deve mandare, il rifiuto parla di quello che sul
TELEFONO non e' ancora al sicuro da nessuna parte. Sono due domande diverse, e
la seconda frase del toast e' quella che le riconcilia per chi legge.

IL COSTO, dichiarato: specchiaCoda adesso LEGGE il disco oltre a scriverlo.
Sono al massimo tre letture per gesto (mutaDato 17090, il timbro 16932, il
taglio dopo la scrittura 16950), due per una mutazione a closure, e fino a
sette o otto al minuto in backoff pieno. Un getItem piu' un JSON.parse di
qualche centinaio di voci, dentro try/catch, su un gesto che gia' oggi ne
scrive altrettanti.

==============================================================================
QUELLO CHE NON SI SPEDISCE, E PERCHE'.

· TUTTO IL CANDIDATO: pad, t, regola di lettura, rifiuto di scrittura,
  rilascio, scadenza. Le tre ragioni sono in cima. Da notare che la parte
  peggiore non era la scadenza ma il RIFIUTO DI SCRITTURA: negare a una scheda
  di salvare i PROPRI soldi. Nella scena misurata sul codice — A bloccata e
  senza rete che rinfresca la busta a ogni riprova, B in primo piano che
  incassa — oggi si perdono i 18,00 di A; col candidato si perdono i 96,00 di
  B, perche' il possesso lo vince la scheda MALATA (si prende il pad fallendo,
  a 16932, e lo si perde consegnando, a 16949-16950) e perche' CHIAVE_CODA e'
  una chiave sola e non c'e' nessun altro posto dove quei soldi possano
  andare. In quella scena la cura costa piu' della malattia.

· LA GUARDIA SUL TIMBRO A 16931. La riga «for (const m of codaRef.current) {
  m.mitt = mittRef.current; m.prot = nuovo.rev; }» e' incondizionata e copre
  anche il timbro di un'altra scheda: da quel momento consegnata() interroga
  map[m.mitt] (922-923), cioe' lo slot sbagliato, e l'atterraggio di chi aveva
  battuto non e' piu' dimostrabile. La cura e' una riga sola — saltare le voci
  che portano gia' un mittente diverso dal mio con un prot valido — e
  probabilmente e' giusta. Non entra per due ragioni, e la seconda basta da
  sola: (1) la sua scena ha bisogno di comporre __revStantia e __perdiRisposta
  sulla stessa pagina in un ordine preciso, e io quei due attrezzi non li ho
  letti, quindi non posso dire QUALE banco la fa diventare rossa senza tirare a
  indovinare; (2) quella riga fa danno solo DENTRO la finestra del danno A, che
  resta aperta comunque — riparare la seconda porta di una stanza a cui manca
  la prima e' il modo piu' pulito di credere di aver finito. Voce di roadmap,
  attaccata a questa.

· LA SPIA CHE CONTA IL TELEFONO INVECE DELLA SCHEDA. Tentante e sbagliata: il
  cartello in casa dice «N modifiche da salvare su questo telefono: ... partono
  da sole appena entri» (app/app.jsx:2017-2020). Farci entrare le voci di
  un'altra scheda vorrebbe dire promettere, su quel numero, una partenza che
  questa scheda non puo' fare. Meglio un numero piu' piccolo e vero.

· UN CANALE FRA SCHEDE, cioe' la strada che il candidato ha saltato senza
  guardarla. Va detto che e' MISURABILE, al contrario di una scadenza: sonde
  fatte oggi mostrano che due pagine dello stesso contesto si consegnano
  davvero l'evento «storage» (la pagina A riceve quello che scrive B), e che
  BroadcastChannel e navigator.locks esistono nel Chromium del banco (typeof:
  function / object). Quindi il giorno in cui si scrive, un banco sa vederlo
  funzionare e sa vederlo rotto. Non entra oggi per tre cose che non so: (a)
  l'evento «storage» non arriva alla scheda che ha scritto, e soprattutto non
  arriva da una scheda che il sistema ha UCCISO — e quella e' proprio la scheda
  di cui vorremmo sapere se e' viva; (b) navigator.locks dentro una PWA in
  home-screen su iPhone non l'ha verificato nessuno in questa casa, io
  compreso; (c) un canale non dice niente di una scheda gia' congelata. Serve
  una ricognizione sua, su un telefono vero, prima di qualunque disegno.

· LA MIGRAZIONE, LA CONVIVENZA FRA GENERAZIONI E I BANCHI DA RISCRIVERE. Non
  si spediscono perche' NON ESISTONO PIU': il record resta un array nudo. Era
  il prezzo piu' alto del candidato — la busta avrebbe rotto otto asserzioni
  che trattano il record come un array (fra cui §7, §16, §17, e le tre che
  pretendono la chiave a null), avrebbe reso rossi diciotto punti di semina in
  quattro banchi per la sola forma del seme, e la riparazione ovvia (un unwrap
  dentro codaSalvata) avrebbe spento in silenzio l'unico posto del repository
  dove e' scritto cosa succede a un array nudo. In piu' avrebbe perso gli
  incassi della sera del rilascio in tutti e due i versi (deploy e rollback),
  perche' la guardia d'ingresso del ritrovamento e' letteralmente
  «Array.isArray(rimaste)» (17120) e una busta la manca IN SILENZIO, senza
  nemmeno passare dal catch. Con la fusione: zero righe di migrazione, zero
  semi da toccare, e il rollback trova quello che si aspetta.

==============================================================================
IL COLLAUDO — collaudi/protocollotest.mjs. Gli attrezzi ci sono gia' tutti:
apri() restituisce {p, ctx} e g.ctx.newPage() apre una SECONDA PAGINA NELLO
STESSO CONTESTO, che condivide davvero il disco (misurato oggi: A scrive, B
rilegge; B rimuove, A rilegge null). Le manopole del finto server sono per
PAGINA e non per origine (protocollotest:143-145), quindi si puo' spegnere la
rete a una sola delle due schede. Nessun attrezzo nuovo.

§16 — LA SCHEDA CHE SALVA NON CANCELLA LA FILA DELL'ALTRA. Gia' scritta, oggi
  ROSSA, e la cura la fa diventare verde. Scena: B apre col disco vuoto (non
  adotta niente), A resta senza rete e incassa, B incassa con la rete viva e
  consegna — la sua coda si svuota e oggi rimuove la chiave. Pretesa che conta:
  si CHIUDE A, si riapre, e la giornata dice 13,00 con due vendite.
  Copre la riga 17064 (removeItem).

§18 — E NON LE SCRIVE SOPRA. NUOVA. Oggi rossa, e copre l'ALTRA riga, la 17063:
  qui B non consegna niente, scrive. Scena: due pagine nello stesso contesto,
  rete spenta a TUTTE E DUE; A incassa 6,50 e finisce sul disco; B incassa
  20,00 e la sua specchiaCoda scrive la propria coda sulla chiave. Oggi il
  disco resta con la sola voce di B. Si chiude B, si riapre, si riaccende la
  rete: la giornata deve dire 26,50 con due vendite. Senza questa sezione la
  cura sarebbe misurata a meta', perche' §16 esercita solo la removeItem.

§19 — E NON SERVE CHE LA SECONDA SCHEDA INCASSI NIENTE. NUOVA. Oggi rossa, ed
  e' l'innesco piu' economico di tutto il difetto. Si usa la ricetta gia' verde
  di sorpassatotest §4: B apre con una sola voce FERMA sul disco (t di 50 ore),
  la adotta, la sposta fra le ferme e resta con la coda vuota; entra con le
  scritture SPENTE, cosi' la riga delle ferme — che e' una mutazione a closure,
  senza tipo — resta in coda e fa ripartire sincronizza a ogni backoff. Solo
  ADESSO si apre A, che quindi non adotta niente, le si spegne la rete e le si
  fa battere uno scontrino: il disco prende la voce di A. Oggi la prima
  riprova di B passa da 16932 con salvabili vuoto e la cancella. Si chiude A,
  si riapre: quell'incasso deve esserci. Nessuno ha incassato niente su B.

§20 — LA STESSA FERMA NON SI APPENDE DUE VOLTE. NUOVA, e va detto come e'
  costruita: il doppione vero nasce da una gara fra il getItem di una scheda e
  il setItem dell'altra, e quella gara non la so guidare. Si SEMINA il suo
  esito, che e' deterministico: CHIAVE_FERMA con dentro la voce F, e
  CHIAVE_CODA con la stessa F (48+ ore). Si apre una scheda sola. Oggi
  CHIAVE_FERMA finisce con F due volte; con la cura una sola. Seconda
  asserzione, che e' quella che parla di soldi: l'annuncio scritto nello
  storico all'ingresso nomina quegli euro UNA volta.

§21 — IL RIPRISTINO VEDE LA FILA DELL'ALTRA SCHEDA. NUOVA. Oggi rossa. Scena:
  B apre col disco vuoto ed entra; A (seconda pagina) apre, le si spegne la
  rete e incassa, quindi sul disco c'e' una voce che B non ha mai adottato. Su
  B si va in Sistema e si prova un ripristino con la ricetta di sorpassatotest
  §4 (due clic su «Ripristina»). Oggi il toast dice «Ripristino avviato»; con
  la cura dice «Non ripristino» e nomina il numero.

§16b — IL CHIODO, VERDE PRIMA E VERDE DOPO. Gia' scritta. Una scheda sola che
  si chiude e si riapre deve ritrovare i SUOI incassi, UNA volta sola. E' la
  sezione che ha ucciso il candidato, e resta a guardia di questa cura: la
  regola di LETTURA non si tocca (17145 resta incondizionata), quindi §16b non
  ha motivo di muoversi — e se si muove, non si aggiusta lei, si butta la cura.

§17 — IL LIMITE DICHIARATO: IL DANNO A RESTA APERTO. Gia' scritta come
  misura del difetto, e va CONVERTITA nella forma che questa casa usa gia' per
  §14b: si tiene visibile con un verde invece che con un rosso che nessuno
  potrebbe togliere. La scena non cambia di una riga — voce nuda sul disco,
  due schede che la adottano, le liste consumate a mano — e cambia solo cosa si
  pretende: che la giornata dica 13,00 con DUE vendite, con l'asserzione che si
  chiama per nome LIMITE DICHIARATO e con scritto sopra che IL GIORNO IN CUI
  ESISTE UN CANALE FRA SCHEDE QUESTA RIGA SI INVERTE. E' la sua sveglia.
  Nella stessa testata va l'altra meta' della misura, che e' una premessa e non
  un dettaglio: perche' il doppione si veda servono ANCHE le liste consumate
  (s.applicate col tetto MAX_APPLICATE = 1200 e s.vendite con MAX_VENDITE =
  300). Finche' reggono, il danno A e' coperto dalla seconda rete. E' il motivo
  per cui e' un limite e non un incendio — e il motivo per cui va misurato lo
  stesso, perche' in una serata piena quelle liste si consumano.

DA CONTROLLARE PRIMA DI DIRE CHE E' FINITA, e sono controlli di regressione,
non di tessera: tutte le sezioni che pretendono «(await codaSalvata(g.p)) ===
null» (fra cui §1 e §7b) devono restare verdi — con la fusione la chiave si
toglie ancora, solo piu' tardi e con piu' ragione. Vale anche per i banchi che
seminano la coda e poi ricaricano (gen605test, gen607test, sfrattotest,
testimonitest, esauritotest): ricaricano tutti, quindi la scheda ADOTTA e le
voci entrano nel registro — ma e' la prima cosa che deve girare al censimento.

==============================================================================
QUELLO CHE RESTA SCOPERTO, DETTO PER INTERO.

 1. IL DANNO A. Due schede aperte insieme possono ancora spedire lo stesso
    scontrino, e la giornata puo' contarlo due volte. Non si chiude senza
    sapere se l'altra scheda e' viva, e non si sa senza un canale.
 2. LA FUSIONE NON E' ATOMICA. Fra il getItem e il setItem l'altra scheda puo'
    scrivere, e quella scrittura si perde. Si passa da una distruzione CERTA a
    una gara di microsecondi: e' un miglioramento misurabile, non una garanzia.
    L'unica cosa che la renderebbe atomica e' navigator.locks, cioe' di nuovo
    il canale.
 3. UNA GENERAZIONE DI CONVIVENZA. Nessuno ricarica quando vogliamo noi (il
    commento del battito di versione lo dice: «il tablet della cassa in kiosk
    puo' restare indietro tre settimane», 723-728; in tutto il file non c'e'
    un location.reload). Finche' sullo stesso telefono convivono una scheda
    gen-6.21 e una gen-6.22, quella vecchia continua a sostituire e a
    rimuovere, quindi puo' ancora cancellare la fila della nuova. Non e'
    riparabile dal lato nuovo, si accetta per iscritto.
 4. LA PASTIGLIA NON PARLA DELL'ALTRA SCHEDA. Il numero in alto conta solo la
    coda di questa scheda. Sul telefono possono esserci altre modifiche in
    attesa e la pastiglia resta verde: e' il rifiuto del ripristino, con la sua
    seconda frase, il solo posto dove quella differenza viene detta.
 5. IL CARICATORE DI PRODUZIONE NON STA IN QUESTO REPOSITORY. Ho potuto
    escludere i tre meccanismi da app/app.jsx, app/sw.js e app/index.html, non
    dalla pagina host che carica il pacchetto. Se quella avesse un canale, non
    l'ho visto.

==============================================================================
COME SI DICE A VALERIO — tre frasi, dal telefono, senza una parola di codice.

  Riparato: se sul telefono hai aperta sia l'app installata sia il sito nel
  browser, adesso le due non si cancellano piu' la fila a vicenda. Prima
  bastava che una delle due salvasse una volta e quello che l'altra aveva in
  attesa spariva dal telefono: se poi la chiudevi, quell'incasso non tornava.

  Non riparato: resta il verso opposto. Se apri la seconda mentre la prima ha
  ancora degli scontrini in attesa, tutte e due possono spedire lo stesso
  scontrino e la giornata puo' contarlo due volte. Per accorgersene si guarda
  il totale di giornata.

  Cosa fare intanto: tieni aperta UNA SOLA delle due — o l'app installata, o il
  sito. Se ti accorgi di averle aperte tutte e due, chiudine una e riapri
  l'altra: quello che era in attesa parte da solo.

E LA RIGA DELLA ROADMAP VA RISCRITTA, perche' oggi promette una cosa che non
faremo: «La cura e' una sola e vale per tutti e due i versi: la fila prende un
proprietario» (roadmap.html, voce schede-gemelle). Il proprietario e' stato
processato e non passa. La voce resta aperta, con meta' difetto chiuso e
l'altra meta' che aspetta un canale fra schede — e il consiglio «tieni aperta
una sola delle due» resta, adesso per un motivo solo invece che per due.

==============================================================================
IL RITUALE, per chi scrive il codice dopo di qui.
 1. §18, §19, §20, §21 scritte e viste ROSSE sulla versione online PRIMA della
    cura; §16 rossa (lo e' gia'); §16b verde prima e dopo; §17 convertita.
 2. Sabotaggi contati aprendo ogni muto: spegnere il filtro di mieRef nella
    fusione deve arrossire §16, §18 e §19; spegnere la riga di presa in carico
    a 17145 deve far raddoppiare le voci sul disco; spegnere il dedup delle
    ferme deve arrossire §20; rimettere «codaRef.current.length» da solo nel
    ripristino deve arrossire §21.
 3. VERSIONE a gen-6.22, changelog, e i documenti chiusi PRIMA del censimento.

==============================================================================
COM'E' ANDATA — scritto il 16 settembre, a cura spedita, contro il rituale qui
sopra riga per riga.

LE SETTE SCENE, e i rossi registrati sul codice che era online (gen-6.21,
md5 c230922976fc1191d6f38b868edb753f, ricostruito dal git e ripassato dal
build per non fidarsi della memoria):

  §16   2 rossi   la fila di A cancellata da B che salva          → verde
  §16b  0 rossi   IL CHIODO: una scheda sola ritrova i suoi       → verde prima e dopo
  §17   0 rossi   LIMITE DICHIARATO: il danno A resta aperto      → verde sul danno
  §18   2 rossi   e non le scrive sopra (la setItem, non la remove)→ verde
  §19   2 rossi   e non serve che la seconda scheda incassi niente→ verde
  §20   1 rosso   la stessa ferma non si appende due volte        → verde
  §21   4 rossi   il ripristino vede la fila dell'altra scheda    → verde
  §21b  1 rosso   e le conta UNA volta sola (il numero nel rifiuto)→ verde
                 ————
                 12 rossi

DUE SEZIONI NON ERANO NEL PIANO, e sono nate da due domande che il rituale ha
fatto venire fuori:

 · §21b l'ha chiesta un SABOTAGGIO. Il piano prevedeva di spegnere il filtro
   mieRef dentro fuoriDaMe e di vedere qualcosa arrossire. Non arrossiva
   niente: nessuna scena guardava il NUMERO da vicino, e un numero gonfiato
   dentro un messaggio che chiede di aspettare manda a cercare una modifica che
   non esiste. La sezione e' nata per aprire quel muto, ed e' rossa sia col
   filtro spento sia su gen-6.21.
 · §19 E' NATA VERDE SUL CODICE NON CURATO, ed e' la cosa piu' importante di
   tutto il giro. Aspettava sei secondi prima di guardare il disco; il backoff
   della scheda senza rete arriva a otto. Misurava la fortuna. Riscritta per
   CHIUDERE la scheda che disturba — cosi' l'unica pagina che tocca il disco e'
   l'altra — e per CONTARE le sue scritture col contatore del finto server
   (window.__conta().set) prima di leggere, e' diventata rossa al primo colpo.
   La regola, gia' scritta in questa casa e pagata un'altra volta: un collaudo
   che non fa succedere il difetto non e' una prova che il difetto non ci sia.
   E un'attesa a tempo non e' un osservabile.

GLI OTTO SABOTAGGI (collaudi/sabotaggi-gen622.mjs), sul banco protocollotest.
Sei rossi come attesi, UNO DICHIARATO muto (S8, le mie davanti alle altrui nella
fusione: applicaCoda rigioca nell'ordine dell'array e in tutte e sette le scene
le voci in gara sono INDIPENDENTI) e UNO APERTO, che e' il piu' istruttivo del
giro:

  S3, spegnere la PRESA IN CARICO ALL'ADOZIONE, era MUTO con le sole sette
  scene nuove. Non perche' quella riga sia ridondante: perche' nessuna delle
  sette guarda il disco DOPO che la coda si e' svuotata. Lo guardano §1 e §7b —
  «codaSalvata === null» — che sono esattamente le due sezioni di regressione
  che questo documento chiedeva di controllare, e li' il rosso c'era: la voce
  adottata resta «di un altro», la fusione la rimette sul disco, e la chiave
  non si toglie piu'. I soldi restano giusti solo perche' c'e' la ricevuta di
  gen-6.20 a coprire il rigioco. Aggiunte al filtro (CON_REGRESSIONE = 1,7b +
  la famiglia): S3 da' 2 rossi in §1, S4 nove in §7b §16 §16b §18 §21 §21b.
  IL MUTO ERA DEL FILTRO DELLE SEZIONI, NON DEL CODICE. Regola nuova: quando
  una tessera tocca CHIAVE_CODA, il sabotaggio va girato ANCHE sulle sezioni
  che guardano il disco a coda vuota.

Il diario completo sta in /tmp/diario-sabotaggi-gen622.txt.

QUELLO CHE E' STATO SPEDITO, in una riga: scriviCoda fonde invece di
sostituire, mieRef dice quali voci sono mie (alimentato in DUE punti, e il
secondo — il ritrovamento — e' quello che si dimentica), le ferme non si
appendono due volte, e il ripristino conta il TELEFONO invece della scheda.
Niente orologi, niente identita' nuove, niente cambi di formato: le tre cose
che avevano ucciso il candidato.

QUELLO CHE NON E' STATO SPEDITO resta scritto sopra, sotto «QUELLO CHE RESTA
SCOPERTO», e non e' cambiato di una virgola: il danno A, la fusione non
atomica, la generazione di convivenza, la pastiglia che non parla dell'altra
scheda, e il caricatore di produzione che non sta in questo repository.
