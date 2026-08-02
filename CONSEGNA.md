# Supply Chain Pro — documento di consegna

*Scritto il 1 agosto 2026, alla fine di una giornata di lavoro, perché fino a
oggi tutto quello che sta in questo repository esisteva solo in una cartella
temporanea legata a una singola sessione. L'app era al sicuro; la rete di
sicurezza che impedisce di romperla, no.*

**A chi legge — persona o macchina.** Non serve conoscere la storia per
lavorarci. Serve sapere tre cose: dove sta l'app, come si mette online senza
romperla, e cosa è già stato deciso e perché. Sono le tre sezioni qui sotto.

---

## 1. Dov'è l'app

Non è un sito compilato. È **un file solo di React** conservato in Supabase,
nella tabella `kv_store`:

| chiave | cosa contiene |
|---|---|
| `app:jsx:src` | il sorgente, per intero |
| `app:jsx:meta` | `{"len": <lunghezza>, "ver": "gen-5.NN"}` |
| `backup:pre-genNNN` | una copia per ogni versione messa online |

Un caricatore su Vercel lo scarica e lo compila **nel browser**. In produzione:
https://supply-chain-pro-sage.vercel.app/

**Due regole del caricatore, e non sono negoziabili:**

1. **`meta.len` deve essere ESATTAMENTE `src.length`** contato in JavaScript.
   Se non combacia, il caricatore rifiuta e l'app non parte.
2. **Zero caratteri astrali** (emoji fuori dal piano base). Rompono il conteggio.

Il canale per scrivere è **solo** l'esecuzione SQL via MCP su Supabase
(progetto `pxozltayynejrmartzzf`). Le chiamate dirette a `*.supabase.co` sono
bloccate dal proxy: non è un ostacolo da aggirare, è la regola della rete.

`app/app.jsx` in questo repository è **la copia di lavoro**, allineata a
gen-5.72. La verità resta il database.

---

## 2. Come si mette online senza rompere niente

Il sorgente è ~620 000 caratteri: non si trasmette in un pezzo solo. Si
ricostruisce **sul server**, incollando pezzi presi dal sorgente vecchio più i
pezzi nuovi, e poi si controlla che il risultato sia identico al byte a quello
provato in locale.

### La sequenza, e perché ogni passo esiste

1. **Costruisci la versione nuova in locale** come coppie vecchio/nuovo
   (`strumenti/h5NN/NNa.txt` e `NNb.txt`, letti da file: scriverli dentro il
   codice fa sparire i `\d` delle espressioni regolari e interpolare i `${`).
2. **`strumenti/genNNN_pairs.mjs`** verifica che ogni ancora compaia **una
   volta sola**, che i pezzi non si sovrappongano, e ricostruisce il file in
   locale confrontandolo con quello atteso.
3. **`strumenti/bilancia.mjs`** controlla che un pezzo sostituito lasci la
   struttura come l'ha trovata: parentesi tonde, graffe, quadre e tag JSX in
   pari. *Esiste per un motivo preciso: il 31 luglio un pezzo ha perso una riga
   di apertura e un tag di chiusura, le md5 combaciavano tutte, il compilatore
   non ha protestato, e l'app ha mostrato la cosa sbagliata. Le md5 dicono «il
   testo è quello che intendevo», non «il testo ha senso».*
4. **Fai il backup** (`backup:pre-genNNN`).
5. **Carica i pezzi** in `tmp:genNNN:pNN` (chiavi con lo zero davanti: si
   ricompongono con `string_agg(value,'' ORDER BY key)`).
6. **Verifica la md5 della ricomposizione** *prima* di scrivere. Se non
   combacia, fermati: **è già successo** che un pezzo fosse lungo un byte in
   meno per un errore di conto, e questo cancello l'ha preso.
7. **Scrivi con la md5 come condizione**: `UPDATE ... WHERE md5(vecchio)=... AND
   md5(nuovo)=...`. Se qualcosa è cambiato sotto, l'UPDATE non fa niente invece
   di fare un danno.
8. **Aggiorna `meta`** (len + ver), **cancella i pezzi tmp**, **rileggi** con
   `app_bootstrap()` e verifica che `len` dichiarata = lunghezza vera.

> **Da gen-5.71 i passi 5–8 non si scrivono più a mano.**
> `strumenti/sql_deploy.mjs <vecchio.jsx> <hNNN> <nuovo.jsx> <tag>` verifica
> l'unicità delle ancore, l'assenza di sovrapposizioni e la ricostruzione
> locale, e poi **genera l'SQL completo** — backup, tessere, cancello md5,
> UPDATE condizionato, meta, pulizia. Le coordinate le contava una persona
> leggendo un elenco, ed è esattamente lì che il 30 luglio un pezzo è partito
> lungo un byte in meno.

### `sql_diff.mjs` — e le due cose che ha reso impossibili

`strumenti/sql_diff.mjs <vecchio.jsx> <nuovo.jsx> <tag> <ver>` fa lo stesso
lavoro **senza coppie scritte a mano**: le zone che cambiano le trova `diff`.

Serve quando fra la produzione e l'ultima versione ci sono più generazioni:
gen-5.70 e gen-5.71 erano tutte e due pronte, ma **gen-5.70 non l'ha mai vista
nessuno**. Passarci sopra avrebbe significato toccare la produzione due volte
per niente. Una sola scrittura, da gen-5.69 a gen-5.71.

Due protezioni che vengono da altrettanti sbagli veri:

1. **I pezzi di testo viaggiano in base64.** Il 2 agosto un pezzo conteneva
   `/[̀-ͯ]/` — la sequenza che in JavaScript indica gli accenti da
   togliere. Nel passaggio verso il server quella sequenza è diventata il
   *carattere* vero: il pezzo salvato era 10 caratteri più corto di quello
   provato in locale. **Il cancello md5 l'ha preso prima che si scrivesse
   qualcosa**, ma il modo di non correre il rischio è un altro: il base64 è
   fatto di sole lettere e numeri, e non c'è niente dentro che qualcuno possa
   interpretare per strada.
2. **La `meta` si aggiorna solo se il sorgente è davvero cambiato.**
   `... and (select md5(value) from kv_store where key='app:jsx:src') = '<md5
   nuova>'`. Senza, un UPDATE che non ha scritto niente lascerebbe una
   lunghezza dichiarata diversa da quella vera — ed è il caso esatto in cui il
   caricatore rifiuta di partire e **l'app non si apre più**. Con questa
   condizione l'intero file si può eseguire in un colpo solo: se il cancello
   non si apre, non cambia niente da nessuna parte.

> `app_bootstrap()` restituisce `meta` come **stringa** JSON: va convertita con
> `(b.j->>'meta')::jsonb`, se no i confronti falliscono in silenzio.

---

## 3. I collaudi

62 file in `collaudi/`, **1160 controlli veri**. Girano con Chromium senza rete:
l'app viene compilata in un pacchetto locale e i dati sono finti.

```bash
cd collaudi
npm install                    # solo la prima volta
node build.mjs ../app/app.jsx  # costruisce il pacchetto da provare
node corri.mjs --censimento    # li fa girare TUTTI, senza fermarsi
node corri.mjs nometest.mjs    # uno solo
```

**Tre esiti diventati quattro.** `verde`, `ROSSA` e **`MUTA`**. Un file che gira, esce
pulito e non stampa nemmeno un controllo non prova niente: per mesi ne ho
contati diversi come verdi. Chiamarli col loro nome è metà del valore.

**La bandierina.** `corri.mjs` scrive `.censimento-in-corso` mentre lavora, e
`build.mjs` **si rifiuta** di ricostruire il pacchetto finché c'è. *Il 31 luglio
ho invalidato tre censimenti ricostruendo il pacchetto mentre giravano: i file
provati prima e quelli dopo avevano visto due versioni diverse. Non è una
distrazione da ricordare, è una possibilità da togliere.*

**QUATTRO esiti, non tre.** Al `verde` / `ROSSA` / `MUTA` si è aggiunto
**`SALTA`**: la suite non è partita perché le manca un file di dati che in
questo repository non c'è (vedi sotto). *Un rosso che non è un difetto è la
cosa peggiore da mettere in un rapporto automatico: insegna a ignorare i
rossi.* Le saltate non contano come difetto e non spariscono dal conto.

**L'output dei rossi si conserva** in `collaudi/rossi/<nome>.txt`, e le ultime
25 righe di ognuno finiscono nel riassunto. *Era una lacuna dichiarata: di una
suite che cade solo sotto carico non si riusciva a sapere quale controllo fosse
caduto. Con il censimento che gira di notte da solo non era più una scomodità —
senza, il rapporto della mattina dice «rossa» e nessuno può farci niente.*
Restano da sistemare le attese a tempo fisso di `pintest`, `pin2test`,
`pin535test`: passano da sole, cadono ogni tanto in mezzo alle altre.

**Sette collaudi vengono saltati su un clone appena fatto**, e non è una
dimenticanza. `catalogotest`, `conv551test`, `convtest`, `gen552test`,
`mappatest`, `pesotest` e `ripristinotest` leggono `stato-vero.json`,
`stato-vero-conv.json` e `topologia-vera.json`: sono **i dati veri di
produzione** — nomi dei prodotti, fornitori, ordini, giacenze. **Questo
repository è pubblico**, quindi quei tre file stanno nel `.gitignore` e non ci
entrano. Si rigenerano esportando da *Gestione → Sistema → Backup* e
rinominando il file. Senza, `corri.mjs` li dichiara `SALTA` con il nome del
file mancante — non rossi.

**Ogni collaudo si spiega da solo.** In cima a ognuno c'è un commento che dice
quale difetto ha preso e perché quel controllo esiste. Leggeteli: valgono più
di questo documento.

I tre che contano di più:

- **`generaletest.mjs`** — il giro completo: 44 schermate × 3 ruoli × 2 schermi.
  Verifica che ogni schermata si raggiunga, che non sia vuota, che non sbordi, e
  soprattutto che **ogni tasto che si vede si possa premere davvero** (mette il
  dito al centro e guarda chi se lo prende). È l'unico che avrebbe preso il
  difetto peggiore del 31 luglio.
- **`bulk2test.mjs`** — quel difetto: in «Gestione rapida» tre voci su sei si
  vedevano benissimo e il dito ci passava attraverso.
- **`reporttest.mjs`** — le due porte da cui esce testo diretto a un fornitore.
  Controlla che un preparato non ci entri *e* che una riga «lab» ci resti.

### Girano da soli, ogni notte

`.github/workflows/collaudi.yml` — ogni notte alle **03:10 UTC**, a ogni push
su `main` o su un ramo `claude/**` che tocchi `app/` o `collaudi/`, e a mano
dalla scheda *Actions*. Se qualcosa diventa rosso **GitHub manda una mail al
proprietario del repository**: è quello il rapporto della mattina dopo.
L'output dei rossi resta scaricabile per 30 giorni.

**Cosa prova, e cosa no.** Prova `app/app.jsx`, cioè la copia che sta qui — non
quella online. La produzione sta in un database, e raggiungerla da un workflow
vorrebbe dire mettere una chiave in un repository pubblico: non si fa. Le due
copie coincidono perché **ogni rilascio le allinea nello stesso commit**; se un
giorno non coincidessero, il posto dove accorgersene è il rilascio.

> **GitHub spegne i lavori a orario dopo 60 giorni senza attività sul
> repository, e non lo dice.** Se per due mesi non si tocca niente, il
> censimento notturno smette di partire. Si riaccende dalla scheda *Actions*.

### Perché la costruzione rifà il foglio di stile ogni volta

`build.mjs` rigenera `tw.css` dal sorgente in prova a ogni pacchetto, e se non
ci riesce **si ferma** invece di costruire un pacchetto zoppo.

*Il 2 agosto ho scoperto che `tw.css` era un file costruito una volta, il 30
luglio, e mai più toccato. Ogni classe grafica scritta dopo quella data — nove
giorni — nel banco di prova **non c'era**: quegli elementi venivano misurati
senza il loro aspetto, e i collaudi che guardano dove finiscono le cose stavano
guardando una pagina diversa da quella vera. Non è esploso niente per fortuna,
non per costruzione.* Adesso non può più invecchiare, e chi clona il repository
ne ottiene uno giusto senza sapere che esiste. Per lo stesso motivo `tw.css`,
`app-under-test.jsx`, `bundle.js` e `rossi/` stanno nel `.gitignore`: sono
prodotti della costruzione, e un prodotto salvato è un prodotto che invecchia.

**Attenzione a `navtest.mjs`**: esporta `vaiA(p, dove)`, che sa che da gen-5.52
Catalogo, Analisi, Storico, Sedi, Profili, Accessi e Sistema stanno sotto
«Gestione». Navigare a mano è la causa numero uno di collaudi che diventano
rossi senza che l'app abbia niente che non va.

---

## 4. Cos'è online adesso

**In produzione: gen-5.72.** Censimento completo verde prima di ogni rilascio.

| versione | cosa |
|---|---|
| gen-5.65 | i tre tasti di «Gestione rapida» che non si potevano premere |
| gen-5.66 | marcare in blocco chi fa un prodotto · **e le due porte verso il fornitore che non ordinano più fuori i preparati** |
| gen-5.67 | il tutorial: 9 guide che mancavano, il tasto del « ? » che non dice più «Guida di "Home"» |
| gen-5.68 | **le ricette**: il gesto «Ho prodotto» che scala gli ingredienti |
| gen-5.69 | «In quali magazzini sta» dalla riga del prodotto, e l'avviso dei prodotti orfani che porta il rimedio con sé |
| gen-5.70 | **la lente 🔍 trova anche le funzioni**: 25 voci, cercabili con la parola che userebbe una persona |
| gen-5.71 | **«Gestione rapida» diventa un pannello a tre gruppi**, con le stesse identiche parole della ricerca |
| gen-5.72 | **la lente si raggiunge sempre**, anche con una scheda aperta — e i salti dalla lente chiudono quello che avevi aperto |

### Le ultime due, e perché sono una cosa sola

Nascono da una frase: *«devo poter fare tutto senza dovermi ricordare in che
parte dell'app ho quella determinata funzionalità che mi serve; un centro di
comando si chiama tale quando controlla tutte le sue periferiche»*.

Il conto le dava ragione: **mettere un prodotto in un magazzino si poteva fare
in quattro modi, con quattro nomi diversi, in tre schermate.** Spostare i tasti
non sarebbe bastato.

**gen-5.70** — la tabella `AZIONI` (25 voci). Ognuna porta delle *parole*: come
la cercherebbe una persona, non come si chiama nel menù. Chi ha in testa «devo
togliere della roba» scrive «togli», non «Sposta o rimuovi prodotti». La
ricerca ignora gli accenti (`senzaAccenti`) e **filtra per ruolo**: un operatore
non trova porte che poi non può aprire.

**gen-5.71** — il menù non riscrive più i nomi delle sue voci: li prende da
`AZIONI` con `nomeAzione(k)`, e anche i **titoli dei fogli** che si aprono.
Prima erano tre stringhe diverse per la stessa cosa. Adesso è una sola, e
`collaudi/gestionerapidatest.mjs` §2 lo **prova senza scriverla**: legge il nome
dal menù e poi lo cerca con la lente. Se qualcuno domani lo cambia in un posto
solo, diventa rosso da solo.

> **Il prezzo del posto sullo schermo, e il collaudo che lo fa pagare.**
> Dando alle voci i nomi lunghi della ricerca, i titoli sono andati a capo e
> l'ultima voce è finita sotto il bordo di un telefono 390×844. Si vedeva solo
> scorrendo. I nomi sono stati accorciati fino a farceli stare tutti e sei, e
> **§5 di `gestionerapidatest` boccia se una settima voce, o un nome più lungo,
> rifà sbordare il pannello.** Su schermi da 360px il foglio scorre ancora: lì
> non ci stanno, ed è dichiarato invece che scoperto per caso.

### gen-5.72 — la lente si raggiunge sempre, e le due trappole per arrivarci

Il difetto che gen-5.71 aveva trovato e lasciato aperto: l'intestazione con la
lente stava **sotto** i `Foglio` (`fixed inset-0 z-50`), quindi per cercare
qualcosa bisognava prima chiudere quello che si stava facendo.

**Trappola 1 — dove va messo lo z-index.** Il primo tentativo l'ho messo sul
*tasto* della lente, e non è servito a niente. L'intestazione ha
`backdropFilter`, e **`backdrop-filter` crea un contesto di impilamento**: lo
z-index di un figlio resta prigioniero lì dentro e non si confronta con i
fogli. Va alzata **l'intestazione intera** — `position:relative; zIndex:60`,
sopra i fogli (50) e sotto il tutorial (80).

**Trappola 2 — il prezzo, misurato e non immaginato.** Con l'intestazione
sopra, su un portatile **1440×760** un foglio alto partiva a 30px e il suo
**titolo** finiva coperto. Da `md` in su i fogli lasciano libera quella fascia
via `.sc-foglio` — **CSS nostro, dentro il codice, non una classe Tailwind
nuova**: il banco di prova usa un CSS precompilato e il caricatore di
produzione non è leggibile da qui, quindi una classe nuova poteva esserci in un
posto e non nell'altro. `lentesempretest` §6 tiene ferma la fascia.

**Il pezzo che non si vedeva.** Saltare dalla lente a una funzione della
sezione in cui si è *già* non cambiava la chiave del contenuto: la scheda
restava davanti e il tocco sembrava andato a vuoto. Un contatore (`giro`) sale
a ogni salto fatto dalla lente e rimonta il contenuto; la navigazione normale
non lo tocca. **Una promessa mantenuta a metà è peggio di una non fatta.**

---

## 5. Quello che aspetta una decisione umana

Nessuna di queste la può prendere una macchina. Sono elencate perché ognuna
tiene ferma una funzione che è già costruita e collaudata.

| cosa | perché è ferma |
|---|---|
| **Le dosi delle ricette** | La macchina c'è e funziona. Senza «quanta farina in una breccola» non scala niente. Basta **una sola ricetta** per provare il giro intero. |
| **Da quale magazzino escono gli ingredienti** | Oggi: un magazzino della stessa sede che ce l'ha, preferendo chi ne ha abbastanza — e la schermata lo scrive prima di applicare. Se in cucina funziona diversamente, cambia solo quella preferenza. |
| **Quali prodotti li fa il laboratorio** | In catalogo sono **zero**. Finché è zero, tutto il lavoro sui preparati è in piedi ma non tocca niente. Si marcano in blocco: Catalogo → Prodotti → Modifica in blocco → «Chi lo fa». |
| **Il PIN dell'admin** ⚠️ | È ancora quello di partenza, ed è **la cosa più urgente di questa tabella**. Non perché sia scritto qui — non lo è — ma perché **questo repository è pubblico** e i collaudi, per funzionare, contengono in chiaro i PIN dimostrativi. Finché quello vero coincide con quello dimostrativo, chi trova il repository trova la porta aperta. Va cambiato dall'app, oggi. |
| **12 righe d'ordine finte** | Righe di tipo `lab` in stato «ricevuto» per cose che il laboratorio si fa da sé: acquisti mai avvenuti. Si possono cancellare. |
| **I prezzi** | 0 prodotti su 102 ce l'hanno. Senza, «quanto vale la merce» salta le righe e lo dichiara. |
| **34 conversioni stimate** | L'app le tiene marcate come stime. Vanno pesate. |
| **7 prodotti in nessun magazzino** | Nessuno li conta, non entrano in nessun ordine. Da gen-5.69 si sistemano dal Catalogo, senza cambiare schermata. |
| **Duplicati** | fiori di zucca ×2, pecorino, grana, peperoni, basilico, carta forno. |

---

## 6. Due cose imparate a caro prezzo

**Un metro che mente è peggio di nessun metro.** Il primo giro di
`generaletest` diceva «36 tasti morti su 632». Erano **tutti falsi**, per due
errori miei: confrontavo il *testo* invece dell'*identità*, e portavo il tasto
in vista con lo scorrimento minimo — che lo parcheggia esattamente sotto la
barra che galleggia in basso. Se avessi riferito quel numero senza verificarlo,
avrei mandato qualcuno a caccia di 36 fantasmi. **Prima di riportare un numero,
guarda un caso singolo con gli occhi.**

**Quando un collaudo è rosso, ha ragione lui finché non si dimostra il
contrario.** `bulk2test` era rosso da mesi e l'avevo messo da parte dando la
colpa a lui, dopo quattro tentativi. Aveva ragione: c'era un difetto vero, e
grosso. Lo stesso giorno `roadmaptest` ha trovato una parentesi che avevo
dimenticato io. Due volte su due il collaudo aveva ragione e io torto.

**«Ha ragione lui» non vuol dire «è colpa dell'app».** Il censimento di
gen-5.71 è uscito con **tre rosse**, e le tre risposte erano tre cose diverse:

| rossa | cos'era |
|---|---|
| `bulk3test` | cercava un nome di voce che avevo cambiato io — difetto **del collaudo**, causato dalla modifica |
| `gen560test` | l'etichetta della lente cambiata a metà: tasto e campo dicevano due cose diverse — difetto **dell'app**, corretto nell'app |
| `gen552test` | la stessa etichetta, **più** un secondo rosso che non c'entrava niente |

Il secondo rosso di `gen552test` merita di essere raccontato. Il file seminava
un evento a *«adesso meno tre ore»* e lo chiamava **oggi**. Il censimento è
capitato all'1:37 di notte: tre ore prima era **ieri**. Non l'aveva mai preso
nessuno perché non era mai girato a quell'ora.

**Come l'ho dimostrato, invece di dedurlo:** ho ripreso il collaudo nella
versione *precedente alle mie modifiche* e l'ho fatto girare contro
**gen-5.69, cioè quello che era online in quel momento**. Stesso rosso, stesso
numero. Se non l'avessi fatto, avrei potuto passare ore a cercare nella mia
modifica un difetto che stava altrove.

*Adesso i tempi di quel file sono ancorati alla mezzanotte di oggi, non a
«adesso meno qualcosa»: quello che deve essere di oggi lo è a qualunque ora si
giri.* **Un collaudo che dipende dall'ora è peggio di un collaudo che manca:
manda a cercare un difetto che non c'è.**
