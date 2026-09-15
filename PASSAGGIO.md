# Passaggio di consegne fra sessioni · 15 settembre 2026

Questo file serve a UNA cosa: far ripartire un'altra sessione di Claude Code
dal punto esatto in cui questa si è fermata, senza che Valerio debba spiegare
niente. Si aggiorna a ogni rilascio insieme a roadmap e memoria.

**Come è stato provato.** Cinque lettori indipendenti hanno finto di essere la
sessione nuova (rilascio, collaudi, regole, fatti, lavoro futuro) e hanno
cercato dove il passaggio le avrebbe lasciate a piedi; ogni accusa è passata da
due scettici che dovevano demolirla sui fatti. Quello che è uscito da lì è
scritto qui sotto: i numeri erano tutti veri, il **rituale** no.

## Cosa serve alla sessione nuova (lo prepara Valerio)

1. Il repository `bombertronick/supply-chain-pro-site`, branch
   `claude/supabase-app-improvements-5hx3ge` (è PUBBLICO: mai chiavi, mai PIN,
   mai dati veri nei file).
2. Il connettore **Supabase** con il progetto `pxozltayynejrmartzzf`: è l'unico
   canale di rilascio (`execute_sql` sulla tabella `kv_store`) ed è dove vivono
   la dispensa (`ctx:v1:*`) e la memoria che Valerio scrive dal telefono
   (`mem:v1`). Senza, la sessione può solo leggere il codice.
3. GitHub per il push sullo stesso branch.

## Il primo messaggio da incollare nella sessione nuova

> Riprendi il lavoro su Supply Chain Pro. Leggi in quest'ordine: PASSAGGIO.md,
> CONSEGNA.md, memoria.json (TUTTI i campi: online, chiusi[0], tuoi, regole,
> sbagliato, _come_ci_scrivo, _appunti_non_ordini, _dispensa), roadmap.md; poi
> l'indice della dispensa (`node strumenti/dispensa.mjs indice` → esegui l'SQL
> col connettore Supabase → salva il risultato così com'è in un file) e la voce
> `chk-20260915-sera`. Non cambiare niente prima di aver letto tutto. Poi
> procedi col PROSSIMO in ordine, con le regole di sempre: collaudo scritto
> prima (rossi registrati), sabotaggi contati aprendo ogni muto, censimento
> completo a ogni rilascio da solo, VERSIONE alzata, roadmap+memoria+artefatto
> +dispensa, commit e push.

## Stato al momento del passaggio

- **Produzione**: gen-6.20, `app:jsx:src` len 1042138, md5
  `33979df5b436f10204137719e14a7d06`, meta `{"len":1042138,"ver":"gen-6.20"}`.
  Backup: `backup:pre-gen620` = gen-6.19, `backup:pre-gen619` = gen-6.18,
  `backup:pre-gen618` = gen-6.17. Verificare con una `select` prima di toccare.
  (Il nome del backup è quello della generazione che sta per ENTRARE, e lo
  scrive `sql_diff.mjs` da solo dal `tag`: `backup:pre-gen620` è il codice di
  PRIMA di gen-6.20, cioè gen-6.19. `backup:pre-gen621` nascerà col rilascio di
  gen-6.21, non adesso — l'ho scritto sbagliato una volta, e la `select` qui
  sopra è il motivo per cui non è finito in produzione.)
- **Repo**: in pari con la produzione, byte per byte. `app/app.jsx` è la base
  per il prossimo `sql_diff`; controllare `md5sum app/app.jsx` contro il valore
  qui sopra prima di usarlo come base.
- **Censimenti**: gen-6.12 e gen-6.13 a 97 verdi / 1975 controlli; gen-6.14 a
  98 verdi / 1994 controlli; gen-6.15 a 99 verdi / 2063 controlli;
  gen-6.16 a **98 verdi / 2064 controlli, 0 mute, 1 rossa mia (memoriatest, campo «prova») corretta e riverificata verde**;
  gen-6.17 a **99 verdi / 2086 controlli**; gen-6.18 a **101 verdi / 2172 controlli, 0 rosse, 0 mute, 7 saltate, 108 file**;
  gen-6.19 a **102 verdi / 2233 controlli veri, 0 rosse, 0 mute, 7 saltate, 109 file**;
  gen-6.20 a **102 verdi / 2300 controlli veri, 0 mute, 7 saltate, 111 file**
  (i due banchi in più sono `protocollotest` e `protopurotest`; il file in più è
  `mkprotolib.mjs`, che è una libreria e non un banco). **ATTENZIONE alla
  sequenza, che stavolta non è stata quella giusta**: il censimento di gen-6.20 è
  partito con i documenti ancora fermi a gen-6.19, quindi `memoriatest` e
  `roadmaptest` là dentro hanno letto i documenti VECCHI (ed erano coerenti fra
  loro, quindi verdi per il motivo giusto ma sulla versione prima). I due sono
  stati rifatti da soli DOPO l'aggiornamento dei documenti, e il loro esito vero
  è quello. La regola resta: **i documenti si chiudono PRIMA del censimento**.
  (il banco in più è `gruppitest`; il file in più è `cassanav.mjs`, che NON è un
  banco e infatti non finisce nel censimento — vedi la sezione sulla porta unica).
  (girato con `gen605test` ANCORA su `file://`, cioè prima della riparazione di
  #39: descrive i banchi com'erano l'11 settembre sera) (il banco in più è
  `spietest`). Sempre 0 rosse, 0 mute, 7 saltate: i sette vogliono i dati veri,
  che non stanno nel repository, e corri.mjs li elenca da solo alla fine.
- **Dispensa**: le voci che servono: `chk-20260915-sera` (il checkpoint
  completo, l'ultimo: gen-6.20), `chk-20260915` (quello prima) e
  `passaggio-20260909` (il
  testo del passaggio, così sta anche fuori dal repository). Ogni voce scritta
  in dispensa si verifica per impronta subito dopo, `length` E `md5`.
- **Artefatto roadmap**: https://claude.ai/code/artifact/e9da7ae5-bc75-409d-8633-254dab3ba5e8
  (si ripubblica con `roadmap.html` meno le prime 3 righe, passando l'URL;
  gen-6.20 e' la Versione 31). Prima di ripubblicare si passa da
  `node strumenti/artefatto-tocco.mjs <file>`: prova la copia PUBBLICATA, che
  non e' il file del repository.

## Le due regole del caricatore, che vengono prima di tutto

Stanno in `CONSEGNA.md:28-32` e non sono negoziabili, perché violarle **spegne
l'app per tutti**:

1. `meta.len` deve essere ESATTAMENTE `src.length` contato in JavaScript. Se non
   combacia, il caricatore rifiuta e l'app non parte.
2. **Zero caratteri astrali** (emoji fuori dal piano base) dentro `app.jsx`.
   Rompono il conteggio.

Conseguenza pratica sul **ritorno indietro**: rimettere solo il backup NON
riaccende l'app. Si rimettono INSIEME `app:jsx:src` (dal backup) e
`app:jsx:meta` con il `len` di quel backup. Prima di scrivere qualunque cosa:
`python3 -c "s=open('app/app.jsx',encoding='utf-8').read(); print(len(s), sum(1 for c in s if ord(c)>0xffff))"`
— il secondo numero deve essere 0.

## Il rilascio: cosa fa l'attrezzo e cosa tocca fare a mano

`node strumenti/sql_diff.mjs <base.jsx> <nuovo.jsx> <tag> <ver>` scrive
`<tag>.sql` e copre: il backup `backup:pre-<tag>`, le tessere
`tmp:<tag>:pNNN`, la **prova regina** in locale (base + tessere == nuovo byte
per byte, e se non combacia non scrive nemmeno il file), il cancello md5+len
prima dello swap, lo swap condizionato, la meta condizionata, il delete delle
tessere temporanee.

**Lo spezzettamento e l'audit adesso li scrive un attrezzo** (gen-6.15):

`node strumenti/sql_spezza.mjs <tag>.sql [caratteri] [vecchio.jsx]` scrive
`<tag>-pezzi/NNN.sql`, numerati nell'ordine in cui vanno mandati, più
`<tag>-pezzi/audit.sql` se gli si dice qual è il sorgente VECCHIO (quello da cui
tagliano le tessere `src`). Taglia il **TESTO per punti di codice** e ricodifica
ogni pezzo in base64 da solo: un taglio dentro il base64 spezzerebbe a metà una
lettera accentata, che in UTF-8 sta in due byte, e `convert_from` andrebbe in
errore — o, peggio, non ci andrebbe. Fino a gen-6.14 questo lavoro si faceva a
mano dentro ogni rilascio, cioè un po' diverso ogni volta.

**Quello che resta a mano ogni volta:**

- **Il file non si esegue in un colpo solo.** `execute_sql` restituisce solo il
  risultato dell'ULTIMO statement: si manda un pezzo per chiamata e si guarda
  cosa risponde.
- **Gli «update … value || …» UNA VOLTA SOLA**: non sono idempotenti,
  rieseguirne uno raddoppia quel pezzo. Il cancello md5 prima dello swap lo
  prende — è il suo mestiere — ma va saputo prima, non scoperto dopo. Incollarne
  due insieme è come si è corrotta una tessera a gen-6.11.
- **L'audit per tessera, PRIMA dello swap.** `audit.sql` torna
  `attese / in_rete / combaciano / diverse`: zero righe diverse = tutte e N le
  tessere in rete sono quelle provate in locale. È il cancello che a gen-6.11 ha
  trovato una tessera sbagliata su 47 prima di toccare la produzione. **Non
  selezionare mai `value` in una `select` di verifica**: torna un megabyte in
  chat. Solo `length` e `md5`.
- **Dopo lo swap**: verificare len+md5+meta con una `select`, e creare
  `backup:pre-gen<NNN+1>` dallo stato appena messo online.
- **La stessa regola vale per la dispensa e per `mem:v1`**, non solo per
  l'app: dopo OGNI scrittura di un testo lungo in base64, confrontare
  `length` e `md5` del valore in rete con quelli del file locale. Il 9
  settembre, incollando la voce del passaggio, una singola lettera è cambiata
  dentro il base64 (una maiuscola diventata minuscola) **a lunghezza
  invariata**: la lunghezza combaciava, l'md5 no. Un confronto sulla sola
  lunghezza non vede niente. La riparazione si fa chirurgica, con
  `update … set value = replace(value, 'vecchio', 'nuovo')`, senza reincollare
  tutto il testo.

## I collaudi: i comandi esatti

- **Costruire il pacchetto**: `cd collaudi && node build.mjs ../app/app.jsx`.
  L'argomento è OBBLIGATORIO — senza, il default è `../app-prod.jsx`, che nel
  repository non esiste. Senza questo passo ogni banco misura il pacchetto
  vecchio e diventa verde o rosso per il motivo sbagliato.
- **Girare un banco**: `cd collaudi && node <banco>test.mjs`.
- **Puntare un banco a un sorgente diverso** (serve per i sabotaggi):
  `node build.mjs /tmp/lavoro.jsx` e poi
  `SORGENTE=/tmp/lavoro.jsx node <banco>test.mjs` — servono TUTTE E DUE: la
  prima costruisce il pacchetto che il browser carica, la seconda dice al banco
  quale file leggere per i controlli sul testo.
- **Cancello veloce**: `node corri.mjs a.mjs b.mjs` (si ferma al primo rosso) o
  `node corri.mjs --tutte`.
- **I DOCUMENTI SI CHIUDONO PRIMA DEL CENSIMENTO.** `memoriatest` confronta
  `memoria.json` con `roadmap.md` e pretende che il campo `prova` nomini un
  FILE di banco che esiste (`gen606test.mjs`, non «gen606test §9»). Scrivere i
  documenti mentre il censimento gira vuol dire farglieli leggere a meta': il
  12 settembre e' uscita rossa per questo, ed era un rosso giusto su un mio
  errore di scrittura.
- **Censimento completo**: `node corri.mjs --censimento` — non si ferma mai, DA
  SOLO, ~2 ore e mezza; i banchi `gen6xx` e `generaletest` durano 5-22 minuti
  l'uno, non è un blocco: va aspettato. Mentre gira esiste il file
  `.censimento-in-corso` e `build.mjs` **si rifiuta di costruire** (per non
  cambiare il pacchetto sotto i piedi di chi sta girando). Se un giro muore a
  metà: `node corri.mjs --riprendi <diario>`.
- **I banchi si servono su http, mai `file://`** (origine opaca: lo stesso banco
  ha dato dieci risultati diversi sullo stesso codice). Chi tocca localStorage
  usa `collaudi/servi.mjs` (`apriServer`) o si scrive il server come fa
  `gen607test.mjs`.
- **Il pacchetto è UNO SOLO**: mentre gira QUALUNQUE banco non si chiama
  `build.mjs`, nemmeno su un file di prova in `/tmp`. `.censimento-in-corso`
  protegge solo il censimento; un banco singolo no, e chi ricostruisce sotto i
  suoi piedi gli cambia il codice a metà giro. È l'errore del 31 luglio, rifatto
  l'11 settembre per la porta accanto.
- **Sabotaggi contati**: si parte da una copia integra, si rompe UNA cosa, si
  ricostruisce, si contano i rossi, si scrive subito su un diario. Un banco che
  MUORE non è «zero rossi»: si dice. Un sabotaggio MUTO non si ignora mai: si
  apre, e quasi sempre è un buco del banco o una ridondanza vera del codice.

## Come GUARDARE l'app, e non solo il codice (10 settembre)

Valerio ha chiesto che la sessione possa VEDERE l'app che costruisce. C'è
l'attrezzo: `collaudi/guarda.mjs`. Apre il pacchetto costruito da `build.mjs`
su un server http, lo semina coi dati finti dei collaudi (più un listino e una
serata di vendite, altrimenti la Cassa è una stanza vuota), entra come Admin e
fotografa le schermate principali in due formati: telefono (390×844) e schermo
largo (1280×800).

- **Prima** `node build.mjs ../app/app.jsx`, se no si fotografa il vecchio.
- `node guarda.mjs` — tutte le schermate, tutti e due i formati (~2 minuti).
- `node guarda.mjs cassa cassa-giornata` — solo quelle. Nomi: home, cassa,
  cassa-clienti, cassa-giornata, **cassa-fascia**, **cassa-esauriti** (da
  gen-6.18: la fascia aperta col bottone nuovo, e il Foglio degli esauriti —
  la seconda TOCCA l'interruttore, quindi la foto mostra lo stato e non un
  elenco di righe uguali), comande, magazzini, plancia, conteggi, ordini,
  analisi, gestione, **sistema** (da gen-6.15: è dove sta la scheda
  diagnostica).
- `FORMATO=telefono node guarda.mjs` — un formato solo (`telefono` | `largo`).
- Le foto finiscono in `collaudi/foto/<versione>/<formato>-<nome>.png` e si
  aprono con lo strumento di lettura dei file: una PNG si vede. Sono
  gitignorate (`*.png`).
- **Per mostrarle a Valerio** si mandano come file (SendUserFile): due o tre,
  quelle che contano per il lavoro in corso, non tutte.

NON è la produzione: quella sta su `pro-sage.vercel.app`, che il proxy blocca,
e non si aggira. È lo stesso codice con dati finti — e per vedere COSA si sta
costruendo è esattamente quello che serve. Due limiti noti: i font di Google
sono bloccati (si vede il carattere di ripiego, non è un difetto dell'app) e la
lente va chiusa con Escape prima di cambiare schermata (l'attrezzo lo fa da
solo). Quando una modifica tocca una schermata, la foto prima/dopo va guardata
davvero, non data per buona: il banco misura, la foto mostra.

## Due fatti di navigazione che costano un giro di banco

Scritti perché li ho pagati due volte, e da fuori non si indovinano:

- **La barra dell'ADMIN non ha né Cassa né Comande**: ci si arriva dalla lente.
  Un banco che deve entrare in Cassa entra come **operatore con l'interruttore
  «cassa»**; in Comande come **operatore SENZA cassa** e senza correzioni; in
  Sistema come **admin**. Tre profili nel seme, non uno.
- **«Ultime vendite» sta nella riga «Oggi» della stanza di PARTENZA della
  Cassa**, non dentro «Giornata».

## Due regole per chi scrive i banchi (gen-6.15)

- **Un rilevatore d'arrivo che è vero anche quando non è successo niente non è
  un rilevatore.** Il mio cercava `/storno/i` nel testo della pagina e pescava
  «Motivo dello storno», cioè l'etichetta del Foglio aperto da prima: il banco
  cliccava troppo presto e dava la colpa al codice. Si aspetta un segno che
  esiste **solo** se lo stato nuovo è entrato (lì: «1 storni» nella riga «Oggi»
  dietro il Foglio).
- **`__proto__` scritto come letterale in JavaScript imposta il PROTOTIPO** e
  non lascia nessuna chiave propria: un banco che lo prova così prova un caso
  che non esiste. Va costruito con ``JSON.parse(String.raw`{"__proto__":…}`)``.

## Un controllo che non può diventare rosso (gen-6.17)

`gen603test:163` sorvegliava che il motore delle vendite non imparasse la
composizione di gen-6.03, e lo faceva così:
`src.slice(src.indexOf("const calcoloScarico"), src.indexOf("const gruppoDi"))`.
`calcoloScarico` è una **function**, non una const — `indexOf` tornava −1 — e
`gruppoDi` sta a 62.619 caratteri, cioè **prima**. La fetta era lunga **zero** e
il controllo passava sempre, da quando esiste. Riparato ai confini veri
(`function calcoloScarico` → `function datiGiornata`), con accanto un controllo
che pretende che quei confini racchiudano davvero qualcosa.

**E appena ha ricominciato a guardare ha suonato a vuoto**: dentro
`applicaVendita` due commenti usano «dentro» come preposizione italiana («un
`uid()` qui dentro»). L'intento era che il motore non imparasse i NOMI di
gen-6.03, e un motore è fatto di codice: adesso toglie i commenti e cerca
`dentroDi`/`suffissoAgg`/`mano`/`viva`/`composizione`, più un controllo che
pretende che `dentroDi` esista ancora nel file — se sparisse, il primo
diventerebbe verde per il motivo sbagliato.

**La regola generale**: quando si scrive una guardia sul SORGENTE, si verifica
subito che la fetta che guarda non sia vuota, e che le parole che cerca siano
nomi di identificatori e non parole comuni della lingua.

## Due trappole dei banchi, chiuse a gen-6.18

Sono la stessa famiglia di «un controllo che non può diventare rosso», e
costano ore a chi le trova senza saperle.

1. **Il banco che legge il file del repository invece della copia sabotata.**
   Otto banchi scrivevano `readFileSync("../app/app.jsx")` fisso. Sotto
   sabotaggio `build.mjs` costruisce da `/tmp/lavoro-sabotato.jsx`, ma il
   controllo sul TESTO continuava a leggere il file integro: diceva **verde su
   un muro che non c'era più**. È il difetto che a gen-6.17 ha prodotto due
   sabotaggi MUTI. Adesso tutti e otto leggono
   `process.env.SORGENTE || "../app/app.jsx"`. **Chi scrive un banco nuovo che
   legge il sorgente lo scrive già così**, se no il suo primo sabotaggio mente.
2. **La trappola di mezzanotte, ma dentro il banco.** `spietest §2` seminava
   uno scontrino a `Date.now() - 90 minuti` e poi pretendeva di vederlo nel
   contatore di **oggi**. Alle 00:35 «novanta minuti fa» è **ieri**: il banco
   diventava rosso per novanta minuti ogni notte, da quando esiste, e nessuno
   l'aveva mai visto perché nessuno gira i collaudi a quell'ora. Trovato il 14
   settembre alle 00:35, e **verificato girando lo stesso banco su gen-6.17**:
   identico rosso, stessa riga — cioè non era una regressione. Riparato con
   `oraDiOggi(minutiFa)`, che non torna mai prima delle 00:01 di oggi.
   **La regola**: un seme «N minuti fa» che poi si confronta con un contatore
   di giornata va **agganciato al giorno**, non all'orologio.

## La porta unica delle celle del listino (gen-6.19)

Da gen-6.19 la griglia della Cassa mostra **un gruppo per volta**: le celle
degli altri **non sono nel DOM**. Chi scrive o tocca un banco che batte in
Cassa deve sapere tre cose.

1. **Si passa da `collaudi/cassanav.mjs`**, `batti(p, "Spritz", 350)` per i
   tocchi e `cella(p, "Spritz")` per le letture. Se la cella c'è già la tocca e
   basta (**zero tocchi sui pulsanti**, quindi i banchi a gruppo unico si
   comportano esattamente come prima); se non c'è, ci arriva **come ci arriva
   una persona** — toccando il pulsante del gruppo, mai scrivendo nello stato,
   mai con `evaluate`, mai con `force`; se non ci arriva **alza un'eccezione**
   che nomina la voce e i gruppi visti. Non ingoia mai.
2. **La regola di ferro: l'aiutante NON si usa mai dentro un'asserzione che
   conta i tocchi.** Tre punti restano col selettore crudo **per sempre**, e
   ognuno ha il commento che dice perché: `gen603test §7` («ZERO tocchi», e
   legge DUE celle per dirlo), `gen604test §9` e `postazionecassatest §8` (la
   pizza liscia a UN tocco). Farli passare di lì li renderebbe verdi **dopo aver
   speso un tocco**: un verde per il motivo sbagliato su una promessa di
   Valerio, che è peggio di un rosso sbagliato. Tutti e tre hanno guadagnato una
   riga che dichiara **quale mondo** stanno misurando (`aria-expanded` del
   gruppo che gli serve).
3. **L'aiutante rende gli otto banchi CIECHI al difetto «il gruppo non si
   apre»**, ed è scritto nel suo cappello. Quel difetto lo provano a viso
   aperto **solo** `§3` e `§6` di `gruppitest`, che toccano il pulsante col
   selettore crudo e non importano mai `cassanav.mjs`. Se si tocca quella
   coppia, si tocca l'unica rete che regge otto banchi.

Il file **non si chiama `*test.mjs` apposta**: `corri.mjs:92` filtra
`/test\.mjs$/`, e `navtest.mjs` c'è già cascato dentro — girava, non provava
niente, e risultava MUTO a ogni censimento finché non è stato messo in
`NON_COLLAUDI`. Lo stesso sbaglio non si fa due volte.

Il contratto con l'app, che i banchi migrati danno per buono: ogni pulsante
porta `data-gruppo="<gruppo>"`, la griglia aperta porta `data-griglia="<gruppo>"`,
la cella porta `aria-label="Aggiungi <voce>"`. Il pulsante **non si cerca mai
per nome accessibile**: quello porta il conto del gruppo e cambia mentre si batte.

## La ricevuta di consegna (gen-6.20)

Chiude il difetto #40. Il meccanismo in tre righe: ogni scrittura parte con un
**numero di protocollo** (`nuovo.rev`), lo stato porta `s.scritture =
{mittente: ultima rev sua}`, e al ritorno il telefono legge il **proprio** slot:
se copre il numero stampato sulla voce, quella voce è **dimostrata** consegnata
ed esce dalla coda senza rigiocarsi. Il mittente è
`idDispositivo() + "·" + caricamento`. Le cose da sapere prima di toccarla:

1. **Il numero non nasce dalla lettura.** `nuovo.rev = Math.max(base.rev,
   ultimoProtRef.current) + 1`, e `ultimoProtRef` si aggiorna **prima**
   dell'await, insieme al timbro. Il disegno del 9 settembre lo costruiva
   sull'«ultima rev atterrata», che **non è conoscibile**: lo slot in rete
   avanza anche sulle scritture la cui risposta si è persa — che sono l'unico
   caso per cui la ricevuta esiste. Con quel ref, il secondo scontrino prende un
   numero **già usato** e al primo giro fresco esce dalla coda senza essere mai
   partito. È una perdita di soldi, e la misura `protocollotest §7`.
2. **La ricevuta certifica la BOZZA, mai la lettura che l'ha preceduta.**
   `{ ...(nuovo.scritture || {}) }`, non `base.scritture`. Con un **ripristino**
   in coda, `base` porta ancora la mappa viva e lo slot di un altro telefono
   sopravviverebbe al ripristino, certificando dati che non ci sono più. La
   misura è `§12`, e ci è voluto il **sabotaggio 21** per scoprire che quella
   sezione era verde per il motivo sbagliato: la riprova che parte mezzo secondo
   dopo **ri-timbra** la coda con un numero più alto, e la scena si riparava da
   sola prima di succedere. Chi scrive una scena con «la risposta si è persa»
   deve anche far **ammutolire** il telefono (`__mutoDopoPersa`), o non sta
   misurando quello che crede.
3. **Dei tre agganci, i soldi li regge solo quello dentro `sincronizza`.**
   Cerne prima di `applicaCoda` e prima di ogni scrittura. Gli altri due (avvio
   classico ed `entra`) reggono la **vista** e il semaforo nei secondi prima del
   primo giro: togliendoli non diventa rosso niente (sabotaggi 19 e 20), e sta
   scritto accanto alle due righe. Non è una copertura: è difesa in profondità
   dichiarata.
4. **La potatura tiene prima gli slot del MIO dispositivo** (`MAX_MIEI = 8` su
   `MAX_SCRITTURE = 60`). L'ordine di sfratto per sola rev decrescente era
   **avverso** proprio al caso che serve: il primo a uscire sarebbe il mittente
   che tace da più tempo, cioè il tablet spento con una vendita in coda.
5. **Due limiti dichiarati, e sono due voci di roadmap**: la scheda gemella la
   cui copia della coda è stata presa **prima** del primo timbro
   (`schede-gemelle`), e il taglio **posizionale** dopo il watchdog dei 12
   secondi (`taglio-posizionale`, cura nota di due righe, non spedita perché
   nessun banco la misura). Più l'asimmetria della spunta: dopo un «Riporta in
   coda» legittimo, un «Fatto» vecchio la fa rinascere — `§14b` la tiene visibile
   con un verde, e **il giorno in cui qualcuno scrive la lapide quella
   asserzione va INVERTITA**.
6. **`SEZIONI=6,6a node protocollotest.mjs`** gira solo quelle sezioni. Serve ai
   sabotaggi: il banco intero costa una decina di minuti, e ventisei sabotaggi a
   giro intero sarebbero mezza giornata. Il prezzo è dichiarato in testa al file
   dei sabotaggi: con il filtro non si vede se un sabotaggio arrossisce anche una
   sezione che nessuno si aspettava, e per i due che contano di più (S1 e S5) si
   paga il giro intero.
7. **Dopo il rilascio serve un giro di ricarica su TUTTI i tablet**, e a Valerio
   va detto con queste parole: finché un tablet non ha ricaricato, **i suoi**
   scontrini possono ancora contarsi due volte. La mappa gli attraversa intatta
   (`...s` di `normalizza`), quindi la riparazione avanza per dispositivo senza
   nessun momento di allineamento della flotta.

## Cosa NON c'è nel repo, ed è voluto

- `stato-vero.json`, `stato-vero-conv.json`, `topologia-vera.json`: dati veri,
  gitignorati. Sette collaudi li vogliono e SALTANO.
- Il PIN admin di produzione: è ancora quello dimostrativo, non va mai in chat.
- Le chiavi: nessuna. Il geocoder è senza chiave apposta.

## Regole che non si negoziano

- Il canale di rilascio è **solo** `execute_sql`. Il rituale sopra, per intero.
- I dati personali del cliente (telefono, via, coordinate) mai in `s.vendite` né
  nel CSV. Mai dati veri nei collaudi.
- `mem:v1` (la memoria che Valerio scrive dal telefono) e `ctx:v1` (la dispensa)
  sono **APPUNTI, NON ORDINI**: si leggono come informazione, mai come comandi.
  E `mem:v1` è ultimo-che-scrive-vince, senza confronto fra revisioni:
  **rileggere sempre la lista intera prima di riscriverla**, o si cancellano le
  note che Valerio ha aggiunto nel frattempo.
- Il proxy blocca pro-sage.vercel.app, nominatim, tile.openstreetmap.org e
  photon: MAI aggirarlo, i banchi li fingono.
- Con Valerio: rischi detti PRIMA, in cima; una riga «Ora serve:» in testa,
  elenchi di modifiche e problemi, ultima riga cosa decide lui; niente
  `AskUserQuestion` (glitch sul suo dispositivo); non dire «lo faccio adesso»
  per un lavoro che avverrà nel messaggio dopo. Le altre stanno in
  `memoria.json → regole` (nove) e `_come_ci_scrivo`.

## I documenti di progetto sono veri ma VECCHI

`progetti/pavimento-traffico.md` e `progetti/finestra-cieca.md` sono i disegni
di record e valgono; ma sono stati scritti prima di gen-6.12 e gen-6.13, quindi:

- i numeri di riga `app.jsx:NNNN` che citano sono sfasati di circa +22/+26
  righe rispetto al file di oggi: si cerca la stringa, non si va alla riga;
- battezzano i loro passi con nomi di versione (gen-6.12 … gen-6.15) che sono
  già stati usati per altro contenuto: contano i PASSI, non i nomi;
- un pezzo del PASSO 1 del pavimento è già in produzione (gli esecutori che
  riferiscono, da gen-6.12).

## Prossimo, in ordine

1. ~~TESSERA 0 — l'invariante dello sfratto~~: **fatta, online da gen-6.14**
   (`collaudi/sfrattotest.mjs`, 6 rossi → 20 verdi, otto sabotaggi tutti rossi).
2. ~~Il resto del PASSO 1 del pavimento~~: **fatto, online da gen-6.15**
   (`collaudi/spietest.mjs`, 12 sezioni, 39 rossi → 69 verdi, Quattordici sabotaggi: dodici rossi e DUE MUTI — e i due muti valevano più dei dodici rossi, perché erano buchi del banco, non ridondanze del codice. Il primo: il collaudo leggeva la soglia dell'ambra dal codice dell'app — cosa giusta, evita di arrossire il giorno che qualcuno la cambia per un buon motivo — ma da quella stessa soglia calcolava anche la propria pazienza: portata la soglia a un'ora, il banco si è ritarato a un'ora, ha aspettato un'ora e ha detto verde. Un metro che prende la propria aspettativa dal codice che misura non può accorgersi che quel codice è cambiato. Il secondo, che conta di più: il banco dimostrava che l'età della lista è viva tagliando la linea, ma la bugia per cui questa versione esiste vive con la linea in piedi — il giro leggero chiede venti byte e la lista non la chiede nessuno. Staccare tutto prova «nessun contatto»; il difetto è «contatto, ma solo quello che non chiede la lista». Riparati tutti e due, i sabotaggi rifatti sono rossi: 14 su 14).
   Sei voci: `storna()` rilegge il dato vivo; i due rami LOCALI di `muta` e
   `mutaDato` raccolgono l'esito; `|| []` sulle **TRE** letture scoperte di
   `v.righe` (export CSV, riga di vendita, Foglio dello Storno — le ultime due
   sbiancavano la Cassa); battito `s.telefoni` timbrato dentro `scriviRemoto`
   (l'imbuto VERO: il seed del primo avvio NON passa da `sincronizza`) e potato
   per **rev**, non per orologio; scheda diagnostica in Sistema che apre
   `diagRef`; età della lista in cima a Comande, dall'ultima **lettura piena
   accettata** — non dall'ultimo giro del poll, che su un giro magro la lista
   non la chiede nemmeno.
3. ~~Il cancello #39 — gen605test smette di ballare~~: **CHIUSO l'11 settembre
   sera.** Prova: **otto giri di fila senza un rosso** (il ballo era 1 su 3-4),
   più un **sabotaggio** — tolta la persistenza della coda, il banco dà 8 rossi
   e il primo è quello giusto («con la rete morta la vendita è salvata sul
   telefono — null»): sa ancora vedere la cosa per cui esiste. Sotto, la causa,
   che resta da sapere.
   Causa TROVATA l'11 settembre, ed era il banco, non l'app. `gen605test` apre l'app da `file://`
   (riga 129), cioè da un'origine **opaca**: ogni tanto il ricaricamento
   riparte su un'archiviazione azzerata, l'`addInitScript` rimette il seme, e
   il banco legge «0 vendite, mozzarella 50» — i numeri del seme — e ne accusa
   l'app. Una sola causa, due sintomi: §2 su gen-6.14 (la coda sparita) e §7b
   su gen-6.15 (la rete tornata al seme). La regola che lo vieta è in questo
   file e **è nata da questo banco** (gen-6.05); `collaudi/servi.mjs` esiste dal
   5 settembre apposta; `gen606test` è già stato sistemato e porta il commento
   che descrive il guasto parola per parola, più la guardia `riapri` che alza
   «BANCO GUASTO» invece di un rosso falso. Riparazione: http al posto di
   `file://`, pagina nuova al posto di `p.reload()`, la guardia, e il testimone
   più piccolo che esista — **`s.telefoni`**, il battito di gen-6.15, che l'app
   timbra a ogni scrittura vera e che in un seme non c'è.
   **E una lezione che è costata un rosso, la prima prova dopo la riparazione.**
   La guardia copiata da `gen606test` sparava anche in §7b, dove il disco che si
   svuota è il comportamento **giusto**: lì la rete contiene già quella vendita,
   e l'app accorcia la coda e ripulisce (`if (remoto && !nuoveInCoda(base))` →
   `specchiaCoda`). Una guardia presa dal banco della porta accanto **va
   rigiustificata, non incollata**: applicata dove non serve arrossisce sul
   funzionamento corretto, che è lo stesso danno del rosso falso, dalla parte
   opposta. Adesso si chiede (`riapri(g, true)`) solo in §2, dove la rete è
   morta e la coda DEVE sopravvivere.
4. ~~Il guscio che disarma la guardia~~: **fatto, online da gen-6.16.** La
   riparazione NON e' quella che avevo disegnato: il primo disegno voleva
   insegnare a `leggiRemoto` a distinguere «errore» da «vuoto», e cinque
   revisori l'hanno demolito (nove accuse su dieci hanno retto). Quella
   domanda **non ha risposta**: il caricatore consegna gli errori come VALORI
   (`app_kv_set.sql` RITORNA `json_build_object('error','auth')`, non solleva;
   `scriviRemoto` ha tre controlli di forma apposta, `leggiRemoto` nessuno),
   quindi chiave assente, sessione scaduta e rete caduta sono **la stessa
   risposta**, e il disegno avrebbe letto una sessione scaduta come «database
   nuovo» seminando i dati dimostrativi sopra la produzione. **Non si chiede
   al trasporto cosa significa il suo silenzio: si chiede alla base da dove
   viene.** Fatto: il guscio si marca `__guscio`, la guardia lo rifiuta DOPO
   la scelta della base, e a lettura fallita la pastiglia dice `offline`.
   `leggiRemoto` non e' stato toccato. Il `> 1` resta: uno stato appena
   seminato ha rev 1 e il primo avvio classico ci passa.
   Sotto, com'era descritto prima di essere fatto.
   ~~Il guscio che disarma la guardia~~ (difetto dell'APP, scelto da Valerio
   l'11 settembre: prima della ricevuta). In modo sicuro, quando il login
   riesce ma la lettura piena **no**, `entra()` mette in `baseRef` un guscio
   senza `rev` (`app.jsx`, «`const s = letto ? normalizza(letto) : normalizza({
   profili: ... })`»), e l'assegnazione è **incondizionata** — come lo è quella
   di `statoRef`, quindi togliere solo la prima non chiude niente. La guardia
   di `sincronizza` è scritta in termini di rev — «`(baseRef.current?.rev || 0)
   > 1`» — e il guscio risponde 0: **non scatta**. Chiede «so che in rete ci
   sono dati veri?» e il guscio dice di no, mentre il guscio È la prova che ci
   sono, solo che non si è riusciti a leggerli. Da lì `base = remoto ||
   baseRef.current`, `applicaCoda(guscio)`, `revBase = 0`, e `scriviRemoto`
   parte. **Oggi in cucina non succede niente** perché lo ferma il cancello nel
   database (`strumenti/server/app_kv_set.sql`, `RAISE 40001` su `revBase` che
   non combacia) e il poll rimette la base vera alla prima lettura riuscita:
   non è un difetto attivo, è una difesa in profondità che manca. Ma l'unica
   difesa sta **fuori da `app.jsx`**, in una funzione che il file stesso
   avverte potrebbe non esserci dopo una ricostruzione del database — e allora
   il guscio atterra e cancella magazzini, prodotti e sedi a tutti. Nota anche
   il «`> 1`» invece di «`> 0`»: seconda maglia larga sulla stessa riga.
   Riparazione proposta: marchiare il guscio (`__guscio: true`) e chiedere alla
   guardia quello che deve davvero sapere — «ho letto la rete?» — invece di
   dedurlo da un numero. È codice dell'app: **collaudo scritto prima con i
   rossi registrati, sabotaggi, VERSIONE alzata, censimento**.
5. ~~La cassa che vede solo la cassa, le aggiunte categorizzate e in
   alfabeto~~: **fatto, online da gen-6.17** (`collaudi/cassa617test.mjs`,
   16 rossi → tutti verdi). Tre richieste di Valerio del 13 settembre su
   quattro. **La forma della riparazione è stata cambiata dai revisori, e la
   ragione vale più del codice**: avevo scritto «sta solo in cassa» come una
   DEDUZIONE (`ruolo === "operatore" && puoCassa && !puoCorreggere &&
   !puoStruttura`). Sembra gratis perché descrive esattamente l'unico profilo
   di cassa che esiste in produzione. Ma è una regola dedotta da un'**assenza**:
   il giorno che un admin assegna una linea al cassiere, quella persona perde i
   Conteggi senza che nessuno abbia spento niente. E avrebbe reso `soloCassa`
   **ogni profilo di cassa dei banchi** — sedici file lo seminano identico
   (`cassa: true`, `magazziniIds`, niente correzioni) — quindi con «Esci» =
   logout in barra, `navtest.vaiA` avrebbe toccato quel tasto per «uscire e
   rientrare» e ~40 sezioni in 12 banchi si sarebbero **disconnesse da sole**,
   cadendo a cascata e accusando l'app. Un **quinto interruttore esplicito**
   (`profilo.soloCassa`, acceso dall'admin, appeso a `cassa`) chiude tutte e
   due le accuse insieme, ed è coerente con la casa: struttura, correzioni,
   ordini e cassa sono TUTTI interruttori. **L'admin decide, l'app non indovina.**
   Altre due cose che i revisori hanno raddrizzato: le tre voci della barra
   chiamavano solo `setSezCassa` — dentro la Cassa basta, ma con quella barra
   FISSA ogni porta che porta fuori le lasciava accese senza portare da nessuna
   parte (ora `vaiInCassa`); e «Esci dal profilo» come quarta voce erano 16
   caratteri su 81 px (troncati a 360) più un secondo bottone con lo stesso
   `aria-label` dell'intestazione, che avrebbe fatto lanciare
   `autorizzazionitest:286` in strict mode. Tre voci, e l'uscita resta quella
   di sempre.
   **DUE PEZZI ERANO USCITI DAL RILASCIO**: il primo è online da gen-6.18
   (voce 6 qui sotto), il secondo aspetta ancora.
   · ~~**l'esaurito**~~ (la quarta richiesta di Valerio) ha preso SEI accuse tutte
     in piedi, con i rimedi già scritti: la guardia in `giraAgg` bloccherebbe
     anche la × (`levaDaRiga` **è** `giraAgg`); le porte da cui si mette
     un'aggiunta sono QUATTRO (chip, Foglio di scelta, mano, ricomposizione) e
     il disegno ne chiudeva una; `FormAggiunta` riscrive l'aggiunta intera,
     quindi **Salva cancella `esaurito`** — e le 23 aperture che chiedevo a
     Valerio sarebbero state 23 cancellazioni; il toggle dentro `muta` lascia
     DISPONIBILE se due casse lo segnano insieme (valore deciso fuori,
     ri-lookup nella bozza, `return false` se non cambia); la coda di `muta`
     sono closure e non sopravvivono al ricaricamento (meglio un esecutore +
     `mutaDato`, che è già come scrive tutto il resto della Cassa); e la
     «modalità Esauriti» dà al chip un terzo significato che resta acceso sul
     piatto dopo (meglio un Foglio con un interruttore per riga).
   · ~~**i bottoni dei gruppi**~~ (pizze/fritti/dolci uno per volta): **fatto,
     online da gen-6.19** — voce 7 qui sotto. Quello che segue è la misura
     dell'epoca, e il numero era sbagliato in difetto:
     **DIECI banchi** seminano listini a più gruppi e toccano «Aggiungi X»
     diretto (cassatest 15 volte, clientetest 9, cassa2test 7, gen605test 5,
     gen603/604test 4, comandetest e postazionecassatest 3). Con una sola
     sezione aperta, ogni voce fuori dal gruppo aperto **non è nel DOM**: ~50
     tocchi rossi per il motivo sbagliato. Serve una migrazione dei banchi, e
     va progettata prima. **Contati bene erano 88 riferimenti in 16 banchi**
     (non ~50 in dieci), e la migrazione vera è stata di 31 statici / 33 a
     runtime in 8 banchi, perché l'apertura di partenza è stata ancorata al
     **listino** invece che alle battute: vedi la voce 7.
6. ~~**L'esaurito**~~: **fatto, online da gen-6.18** (`collaudi/esauritotest.mjs`,
   17 rossi → tutti verdi; `collaudi/sabotaggi-gen618.mjs`, dodici sabotaggi, 12 rossi dopo aver aperto l'unico muto (S8: §6 non interrogava la sesta porta, la prova mancava ed e' §21)).
   **Le sei accuse di gen-6.17 erano giuste tutte e sei, ma il disegno che le
   riparava era ancora sbagliato**: quattro revisori e degli scettici l'hanno
   demolito con **34 accuse, otto alte**. Le tre che contano per chi viene dopo:
   · **le porte erano SEI, non quattro.** `apriScelta` ha DUE chiamanti che
     seminano `aggSel`: il nome della riga (`da = r.chiave`) e la **cella di una
     voce con varianti**, che semina **dalla MANO** con `da = null`. Il Foglio
     nasceva col chip già acceso senza che nessun dito lo avesse toccato.
   · **due guardie scritte non potevano diventare rosse.** `giraAgg` ha due soli
     chiamanti: il chip e `levaDaRiga`. Cortocircuitando il chip in un toast,
     dentro `giraAgg` resta solo `levaDaRiga`, che per costruzione passa un id
     **già sulla riga**: `!ids.includes(agId)` è sempre falso. La regola sta in
     **un posto solo, `giraAgg`**, e il chip continua a chiamarlo sempre: così
     le guardie sono raggiungibili, quindi collaudabili e sabotabili.
   · **un compare-and-set era un ABA**, e falliva proprio nello scenario per cui
     l'avevo messo: il campo è booleano, quindi «segnata → rimessa disponibile →
     rigioco» ritrova il valore di partenza e passa. La difesa vera è lo
     **steccato d'età dentro l'esecutore** (`ORE_ESAURITO = 6` su `d.t`):
     l'esecutore è l'unico punto per cui passano tutte le strade — il
     ritrovamento, `applicaCoda` a ogni giro, la riapplicazione dopo ogni
     lettura remota. Una DURATA e non `giornoDi`, perché un segno delle 23:50
     non deve sparire alle 00:01 sotto le dita di chi lo ha messo.
   **E due sezioni del banco sono TESTIMONI dichiarati, non rossi** (§19 lo
   steccato d'età, §20 la terza porta): su gen-6.17 non potevano diventare rosse
   perché il tipo `esaurito` non esisteva. Esistono perché senza di loro due
   guardie sarebbero state **scritte e mai provate**, ed è scritto nel banco.
7. ~~**I gruppi diventano pulsanti**~~: **fatto, online da gen-6.19**
   (`collaudi/gruppitest.mjs`, 29 rossi → tutti verdi;
   `collaudi/sabotaggi-gen619.mjs`, venti sabotaggi, 20 rossi dopo aver aperto
   l'unico muto). Le tre cose che contano per chi viene dopo:
   · **l'apertura di partenza NON può stare sulle battute.** Tutti e quattro i
     disegni indipendenti aprivano `gruppi[0]`, cioè il primo dell'ordine per
     battute. Quella riga non regge la promessa «la pizza liscia resta un
     tocco» per due ragioni verificate sul codice: le vendite durano **48 ore**,
     quindi a classifica vuota decide `localeCompare` (DOLCI prima di PIZZE, per
     due giorni, dopo ogni riapertura o ripristino); e `battute` si ricalcola
     **nel corpo di render**, quindi incassare un tiramisù riaprirebbe la cassa
     sui dolci. La regola buona guarda il **listino** (`gruppoDiPartenza`): più
     voci vince, a parità il primo del listino, «Altro» mai se non è l'unico.
     **L'ORDINE dei pulsanti resta quello delle battute**: zero righe cambiate
     sul sort dei gruppi. Ed è la regola che ha fatto crollare la migrazione da
     58 tocchi in 12 banchi a 31 in 8, **lasciando verdi e intatti** i tre punti
     che contano i tocchi.
   · **il muto aveva ragione, di nuovo.** S6 spegneva il ripiego «il gruppo
     scelto non c'è più nel listino» e non arrossiva niente: §18 non
     **sceglieva** mai un gruppo, quindi `gruppoScelto` restava `null` e il ramo
     non veniva mai imboccato. È lo stesso errore che il disegno dichiarava di
     aver già chiuso. Riscritta §18 (il cassiere sceglie i Dolci, l'Admin
     rinomina **quelli**), S6 è rosso: 20 su 20.
   · **`scrollIntoView` scorre TUTTI gli antenati scorrevoli.** La scorza
     dell'app (`.sc-root`, `overflow-hidden`) è alta ~139px più dello schermo,
     quindi il «torna in cima» si portava dietro anche quella e spingeva
     `<main>` fuori schermo, con la riga appiccicata che spariva con lui.
     L'ha trovato §15, non io. Chi deve riportare in cima dentro questa app
     **scorre a mano il solo contenitore che scorre davvero**, mai con
     `scrollIntoView`.
   E **cinque difetti erano del banco e non dell'app** — una porzione di file
   lunga zero, un tasto misurato dove non esiste, una soglia numericamente
   impossibile, una sezione che batteva nel gruppo di partenza (quindi cieca al
   suo sabotaggio) e una misura senza lo scorrimento in fondo. Stanno scritti
   **dentro il banco**, riga per riga, invece che nel numero.
8. ~~La ricevuta di consegna~~: **fatta, online da gen-6.20** — e va letta la
   sezione «La ricevuta di consegna» qui sotto prima di toccare qualunque cosa
   che scriva sullo stato, perché tre delle sue lezioni valgono per chiunque
   lavori su quella strada.
9. **Il pavimento del traffico vero** (PASSO 2 e seguenti): il PASSO 2 tocca
   `strumenti/server/app_kv_set.sql`, cioè la funzione da cui passa OGNI
   scrittura dell'app. Il documento chiede: tessera sua, di lunedì mattina, mai
   di venerdì o nel fine settimana, con la tessera di ritorno scritta insieme, e
   il file aggiornato nel repository nello stesso commit. Non è un rilascio come
   gli altri: prima si mostra il piano a Valerio.
10. Poi: sessione scaduta che cancella la coda (#28), media dei consumi, «cosa
   c'è dentro», ordini cliente.

## Le misure di produzione già fatte (9 settembre, non ripeterle)

Stato `scp:stato:v1` = 292.621 caratteri. Per collezione: movimenti 142.033
(702 voci, 48,5%), richieste 66.315 (155, 22,7%), ordini 34.962 (106), prodotti
28.131 (103), magazzini 23.863 (11), applicate 5.700 (300 voci; a 1200 saranno
~22.800), log 5.491 (50), listino 3.680 (22), vendite 3.053 (3), aggiunte 2.710
(23). Ritmo vero: ~20 scritture al giorno (log: 50 voci in 3,1 giorni) — l'app è
in rodaggio, 14 vendite in tutto. I «350-450 al giorno» che girano nei documenti
sono il volume di PROGETTO stimato dai 100+ ordini dei giorni di punta, non una
misura.
