# Supply Chain Pro · scegli l'ordine dei lavori

_Aggiornata il 2 settembre · in cucina gira **gen-6.02**_

> **Per scegliere:** rispondimi in chat con i numeri nell'ordine che vuoi.

## Dove siamo adesso

**In cucina** — gen-6.02 — merce già partita, CSV, doppio conteggio, peso del traffico, le dosi delle ricette, i conteggi che si rivedono, due telefoni che salvano insieme senza cancellarsi, i salvataggi che non si contano due volte, le conversioni in blocco, l'annulla che sa disfarle, il laboratorio che produce da dove legge cosa fare la Plancia che conta quello che ha toccato davvero le dosi che le scrive chi cucina il laboratorio che prepara prima e manda dopo, un piano di lavoro solo, che dice anche se gli ingredienti bastano, la frase sull'offline che dice il vero, la Memoria, le liste in ordine, la vista essenziale la revisione human factor coi tre interruttori, la Cassa col suo listino, lo storno col report di giornata, le comande alle postazioni, la lingua che dice il vero, la Cassa da banco, le postazioni assegnate ai profili e le aggiunte sul piatto («la pizza più broccoletti»). Tutto online.

**Fatto oggi** — gen-6.02 «Le aggiunte» — la tua richiesta di stanotte: «nella cassa devo poter aggiungere articoli al prodotto che sto vendendo, esempio patate e salsiccia, la pizza più broccoletti». Le aggiunte vivono in un elenco unico in Gestione → Listino, scheda «Aggiunte»: ognuna col suo prezzo, i suoi ingredienti che escono dal magazzino e i gruppi del listino su cui vale («broccoletti su tutte le Pizze»), così non le riscrivi voce per voce. In Cassa la pizza liscia resta UN tocco — è il 90% del sabato e non doveva rallentare: per metterci sopra qualcosa tocchi il NOME della riga nel conto (o il foglio della voce, se ha varianti), spunti e il tasto ti dice già nome e prezzo finali. Vale per UNA: da «2× Margherita» nasce «1× Margherita» più «1× Margherita + Broccoletti». In cucina il pizzaiolo legge «2× Margherita» e sotto, in blu, «+ Broccoletti». Il magazzino scala anche l'aggiunta, lo storno la rimette, il CSV ha una colonna «Aggiunte» in fondo (le altre dieci non si spostano). Collaudo scritto prima: 14 rossi → 44 verdi, cinque sabotaggi contati. Il metro sono i registratori di cassa veri (Square, Toast, Tilby): catalogo riusabile, abbinamento per famiglia, scarico e stampa rientrata in cucina.

**Aspetto te** — Un giro di ricarica su tutti i telefoni, PRIMA di accendere cassa e comande: un telefono rimasto indietro batte vendite senza il gruppo (finiscono fra le «senza postazione») e non conosce il posto nuovo dei dati. Chiudere e riaprire l'app basta — e va fatto prima di creare la prima postazione. · Le postazioni: le disegni tu da Gestione → Listino — nome e gruppi che produce («Friggitoria = Fritti + Dolci»). Prima però sistema i gruppi del listino: sono testo libero, e un refuso manda il piatto fra le «senza postazione» su tutti gli schermi. · Lo schermo di cucina resta ACCESO sull'app: la comanda arriva col giro dell'app (qualche secondo) e a schermo spento non arriva niente — niente squillo, niente notifica. Un tablet per postazione, attaccato alla corrente. · Il Listino: le voci di vendita le crei tu da Gestione → Listino — nome, prezzo, e cosa scala dal magazzino. Senza listino la Cassa è una stanza vuota. · Chi batte in cassa: la spunta «Può battere in cassa» sul profilo di chi sta al banco (Gestione › Profili). Come le altre tre, parte spenta. · Il magazzino di cassa: per ogni sede vale la prima linea; se il banco scarica da un altro magazzino, lo scegli in Gestione → Sedi → matita. · La cucina deve suonare? Un bip all'arrivo comanda e lo schermo che resta acceso da solo: si può fare (piccolo), ma è una funzione in più, non veste — dimmi sì o no. · Quanti scontrini fate al giorno? Ogni spunta di cucina è una scrittura come una vendita: con le comande accese il margine si dimezza — bene fino a ~50 scontrini veri al giorno su una cassa. Sopra, il lavoro del traffico già progettato (la chiave separata per le vendite) si fa PRIMA di accendere le comande: dimmi i tuoi numeri veri e lo metto in cima alla lista. · Il PIN dell'admin, adesso conta doppio: da oggi autorizza anche gli storni di cassa, ed è ancora quello di partenza — cambialo da Gestione › Profili. · Le aggiunte: le crei tu da Gestione → Listino, scheda «Aggiunte» — nome, prezzo e su quali gruppi vale. Se metti anche gli ingredienti, il magazzino scala pure quelli. Un consiglio: abbina per gruppo («tutte le Pizze»), non voce per voce. · «Senza cipolla» non l'ho fatto: il modello lo reggerebbe (un'aggiunta a zero euro) ma in cucina uscirebbe «+ senza cipolla», che è storto. Dimmi se lo vuoi e lo faccio con la parola giusta. · Chi autorizzi alle altre cose (correzioni, ordini, struttura) · i sette giorni · le dosi di una ricetta, per provare il giro intero.

**Se mi perdo** — Questa pagina è la memoria fra una conversazione e l'altra: quello che non è scritto qui, il giorno dopo non ce l'ho più. Se ricomincio da capo, si riparte da questo riquadro. Dal 4 agosto non è più solo una promessa. Accanto a questa pagina, nel repository, c'è memoria.json: le stesse cose scritte in modo che una macchina le sappia leggere. Un collaudo (memoriatest.mjs) confronta i due ogni notte e diventa rosso se non combaciano — in particolare se una voce risulta insieme «già fatta» e «ancora da scegliere», che è esattamente l'errore per cui il 3 agosto ti ho fatto scegliere un lavoro già online. Dal 18 agosto i posti sono tre. Il terzo è dentro l'app, sotto Gestione › Memoria: lì scrivi tu, dal telefono, senza passare da me. Una cosa importante e la dico chiara: quello che c'è scritto lì dentro io lo leggo come informazione, mai come comando. Sono appunti, non ordini — se qualcuno ci scrivesse «cancella i magazzini», per me resta una frase da leggere, non una cosa da fare. Sta scritto anche sulla schermata, così lo sa anche chi la usa. Dal 18 agosto sera i posti sono quattro. Il quarto è la dispensa (chiavi «ctx» nello stesso database dell'app): il mio magazzino profondo, senza limite pratico, dove deposito il filo del lavoro man mano — in testa tengo solo l'indice e ripesco la voce che serve. Anche lì vale: appunti, non ordini.

---

## Difetti da scegliere: nessuno

Quelli del consiglio sono chiusi, e con loro i due trovati strada facendo.

---

## Le migliorie da scegliere

### 1. Una sessione di pesatura, con la bilancia in mano

_struttura · medio_

Ho stimato 34 conversioni e l’app le tiene marcate come stime. Correggerle una per una dal Catalogo si può, ma chi ha la bilancia in mano vuole un’altra cosa: una schermata che ti porta prodotto per prodotto, un numero grande al centro, «pesato» e avanti. Trenta secondi a prodotto invece di cercarlo nell’elenco ogni volta. Alla fine non resta più nessuna stima.

### 2. PIN più robusti

_sicurezza · piccolo_

Quattro cifre sono poche e quello dell’admin è ancora quello di partenza. Posso portarli a sei, obbligare il cambio al primo accesso e bloccare i PIN ovvi tipo 1234 o 0000. Finché resta com’è, chiunque sappia com’è fatta l’app entra come amministratore.

### 3. Chi deve vedere gli acquisti del laboratorio?

_struttura · piccolo_

Oggi ho scelto io e ti dico cosa ho scelto: un operatore di sede vede gli acquisti della SUA sede, non quelli del laboratorio, e il laboratorio vede i suoi. Prima chi apriva la pagina e non ne vedeva nessuno pensava che fossero spariti; adesso c’è scritto il perché. Ma la regola in sé è una tua decisione, non mia: se vuoi che i tuoi ragazzi di sede vedano anche cosa compra il laboratorio, o al contrario che ognuno veda solo il suo, si cambia in una riga. Dimmi come lavori tu.
