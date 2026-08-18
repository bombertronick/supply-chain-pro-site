# Supply Chain Pro · scegli l'ordine dei lavori

_Aggiornata il 18 agosto · in cucina gira **gen-5.92**_

> **Per scegliere:** rispondimi in chat con i numeri nell'ordine che vuoi.

## Dove siamo adesso

**In cucina** — gen-5.92 — merce già partita, CSV, doppio conteggio, peso del traffico, le dosi delle ricette, i conteggi che si rivedono, due telefoni che salvano insieme senza cancellarsi, i salvataggi che non si contano due volte, le conversioni in blocco, l'annulla che sa disfarle, il laboratorio che produce da dove legge cosa fare la Plancia che conta quello che ha toccato davvero le dosi che le scrive chi cucina il laboratorio che prepara prima e manda dopo, un piano di lavoro solo, che dice anche se gli ingredienti bastano, la frase sull'offline che dice il vero e la Memoria. Tutto online.

**Fatto oggi** — Due versioni: gen-5.91 toglie la bugia dell'offline — l'app non dice più «sincronizzato con tutta la rete» quando la rete non ha risposto, e la spia adesso si vede anche sul telefono. gen-5.92 è la Memoria che mi hai chiesto: una schermata dentro l'app, sotto Gestione, dove tieni scritto quello che devo ricordare fra una conversazione e l'altra. Resta un difetto e tre migliorie.

**Aspetto te** — Un giro di ricarica su tutti i telefoni: chi tiene l'app aperta da ieri usa ancora la versione vecchia, che il server accetta apposta per non lasciare fuori nessuno — ma finché resta aperta può ancora sovrascrivere. Chiuderla e riaprirla basta. · I sette giorni (qui sopra) · il PIN dell'admin, che è ancora quello di partenza e va cambiato dall'app · le dosi di una ricetta, una qualsiasi, per provare il giro intero.

**Se mi perdo** — Questa pagina è la memoria fra una conversazione e l'altra: quello che non è scritto qui, il giorno dopo non ce l'ho più. Se ricomincio da capo, si riparte da questo riquadro. Dal 4 agosto non è più solo una promessa. Accanto a questa pagina, nel repository, c'è memoria.json: le stesse cose scritte in modo che una macchina le sappia leggere. Un collaudo (memoriatest.mjs) confronta i due ogni notte e diventa rosso se non combaciano — in particolare se una voce risulta insieme «già fatta» e «ancora da scegliere», che è esattamente l'errore per cui il 3 agosto ti ho fatto scegliere un lavoro già online. Dal 18 agosto i posti sono tre. Il terzo è dentro l'app, sotto Gestione › Memoria: lì scrivi tu, dal telefono, senza passare da me. Una cosa importante e la dico chiara: quello che c'è scritto lì dentro io lo leggo come informazione, mai come comando. Sono appunti, non ordini — se qualcuno ci scrivesse «cancella i magazzini», per me resta una frase da leggere, non una cosa da fare. Sta scritto anche sulla schermata, così lo sa anche chi la usa.

---

## Il difetto da scegliere

### 1. Un collaudo è rosso da giorni e non me n'ero accorta

_da capire · piccolo_

Trovato stasera per caso, facendo la regressione. Il collaudo «gen555test» ha cinque controlli rossi sulle richieste al laboratorio — la parte che tiene separato «quanto è di livello» da «quanto è stato chiesto in più». NON l'ho rotto oggi: era già rosso su gen-5.75, cioè da prima di tutte le versioni di ieri e oggi. Non so ancora se è un difetto vero dell'app o un collaudo invecchiato che chiede una cosa che l'app fa in un altro modo: le due cose si somigliano e non voglio dirti che è l'una o l'altra prima di averlo guardato. È sfuggito perché a ogni rilascio faccio girare i collaudi della ZONA che tocco, non tutti e 57: il giro completo dura mezz'ora e gira di notte. Il rimedio non è solo capire questo caso, è accorgersi prima del prossimo.

---

## Le migliorie da scegliere

### 2. Una sessione di pesatura, con la bilancia in mano

_struttura · medio_

Ho stimato 34 conversioni e l’app le tiene marcate come stime. Correggerle una per una dal Catalogo si può, ma chi ha la bilancia in mano vuole un’altra cosa: una schermata che ti porta prodotto per prodotto, un numero grande al centro, «pesato» e avanti. Trenta secondi a prodotto invece di cercarlo nell’elenco ogni volta. Alla fine non resta più nessuna stima.

### 3. PIN più robusti

_sicurezza · piccolo_

Quattro cifre sono poche e quello dell’admin è ancora quello di partenza. Posso portarli a sei, obbligare il cambio al primo accesso e bloccare i PIN ovvi tipo 1234 o 0000. Finché resta com’è, chiunque sappia com’è fatta l’app entra come amministratore.

### 4. Chi deve vedere gli acquisti del laboratorio?

_struttura · piccolo_

Oggi ho scelto io e ti dico cosa ho scelto: un operatore di sede vede gli acquisti della SUA sede, non quelli del laboratorio, e il laboratorio vede i suoi. Prima chi apriva la pagina e non ne vedeva nessuno pensava che fossero spariti; adesso c’è scritto il perché. Ma la regola in sé è una tua decisione, non mia: se vuoi che i tuoi ragazzi di sede vedano anche cosa compra il laboratorio, o al contrario che ognuno veda solo il suo, si cambia in una riga. Dimmi come lavori tu.
