# Supply Chain Pro · scegli l'ordine dei lavori

_Aggiornata il 6 agosto · in cucina gira **gen-5.90**_

> **Per scegliere:** rispondimi in chat con i numeri nell'ordine che vuoi.

## Dove siamo adesso

**In cucina** — gen-5.90 — merce già partita, CSV, doppio conteggio, peso del traffico, le dosi delle ricette, i conteggi che si rivedono, due telefoni che salvano insieme senza cancellarsi, i salvataggi che non si contano due volte, le conversioni in blocco, l'annulla che sa disfarle, il laboratorio che produce da dove legge cosa fare la Plancia che conta quello che ha toccato davvero le dosi che le scrive chi cucina il laboratorio che prepara prima e manda dopo e un piano di lavoro solo, che dice anche se gli ingredienti bastano. Tutto online.

**Fatto oggi** — Dieci versioni, da gen-5.80 a gen-5.89: la sovrascrittura fra telefoni, il salvataggio contato due volte, le conversioni in blocco, l'annulla che le disfa, il laboratorio che produce dalla richiesta il conto vero della Plancia e le ricette scrivibili dal laboratorio. Più i collaudi che adesso aprono le schede: da zero a 116. Restano quattro difetti e tre migliorie.

**Aspetto te** — Un giro di ricarica su tutti i telefoni: chi tiene l'app aperta da ieri usa ancora la versione vecchia, che il server accetta apposta per non lasciare fuori nessuno — ma finché resta aperta può ancora sovrascrivere. Chiuderla e riaprirla basta. · I sette giorni (qui sopra) · il PIN dell'admin, che è ancora quello di partenza e va cambiato dall'app · le dosi di una ricetta, una qualsiasi, per provare il giro intero.

**Se mi perdo** — Questa pagina è la memoria fra una conversazione e l'altra: quello che non è scritto qui, il giorno dopo non ce l'ho più. Se ricomincio da capo, si riparte da questo riquadro. Dal 4 agosto non è più solo una promessa. Accanto a questa pagina, nel repository, c'è memoria.json: le stesse cose scritte in modo che una macchina le sappia leggere. Un collaudo (memoriatest.mjs) confronta i due ogni notte e diventa rosso se non combaciano — in particolare se una voce risulta insieme «già fatta» e «ancora da scegliere», che è esattamente l'errore per cui il 3 agosto ti ho fatto scegliere un lavoro già online.

---

## I difetti da scegliere

### 1. Un collaudo è rosso da giorni e non me n'ero accorta

__

Trovato stasera per caso, facendo la regressione. Il collaudo «gen555test» ha cinque controlli rossi sulle richieste al laboratorio — la parte che tiene separato «quanto è di livello» da «quanto è stato chiesto in più». NON l'ho rotto oggi: era già rosso su gen-5.75, cioè da prima di tutte le versioni di ieri e oggi. Non so ancora se è un difetto vero dell'app o un collaudo invecchiato che chiede una cosa che l'app fa in un altro modo: le due cose si somigliano e non voglio dirti che è l'una o l'altra prima di averlo guardato. È sfuggito perché a ogni rilascio faccio girare i collaudi della ZONA che tocco, non tutti e 57: il giro completo dura mezz'ora e gira di notte. Il rimedio non è solo capire questo caso, è accorgersi prima del prossimo.

### 2. «Sincronizzato con tutta la rete» viene detto anche quando la rete non c’è

__

Marco conta il retro in cantina, dove non prende. L’app gli scrive a lettere grandi «Conteggio registrato — è aggiornato e sincronizzato con tutta la rete». Quella frase è falsa: è scritta subito, in locale, senza guardare se la rete abbia risposto. Se lui chiude l’app prima che la rete torni, la mattina dopo il magazzino ha i numeri di ieri e il laboratorio non ha ricevuto niente. Sul telefono non c’è nemmeno una spia: la pastiglia «Riconnessione…» è nascosta sotto una certa larghezza, cioè su tutti i telefoni. Tre interventi separati; i primi due sono dieci minuti l’uno e tolgono la bugia subito.

---

## Le migliorie da scegliere

### 3. Una sessione di pesatura, con la bilancia in mano

__

Ho stimato 34 conversioni e l’app le tiene marcate come stime. Correggerle una per una dal Catalogo si può, ma chi ha la bilancia in mano vuole un’altra cosa: una schermata che ti porta prodotto per prodotto, un numero grande al centro, «pesato» e avanti. Trenta secondi a prodotto invece di cercarlo nell’elenco ogni volta. Alla fine non resta più nessuna stima.

### 4. PIN più robusti

__

Quattro cifre sono poche e quello dell’admin è ancora quello di partenza. Posso portarli a sei, obbligare il cambio al primo accesso e bloccare i PIN ovvi tipo 1234 o 0000. Finché resta com’è, chiunque sappia com’è fatta l’app entra come amministratore.

### 5. Chi deve vedere gli acquisti del laboratorio?

__

Oggi ho scelto io e ti dico cosa ho scelto: un operatore di sede vede gli acquisti della SUA sede, non quelli del laboratorio, e il laboratorio vede i suoi. Prima chi apriva la pagina e non ne vedeva nessuno pensava che fossero spariti; adesso c’è scritto il perché. Ma la regola in sé è una tua decisione, non mia: se vuoi che i tuoi ragazzi di sede vedano anche cosa compra il laboratorio, o al contrario che ognuno veda solo il suo, si cambia in una riga. Dimmi come lavori tu.
