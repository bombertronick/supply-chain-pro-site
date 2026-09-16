*Consiglio simulato del 2 agosto 2026 · sei revisori indipendenti, mandati separati.
22 difetti proposti, 10 passati al vaglio di uno scettico incaricato di demolirli, 8 sopravvissuti.*

> **Cosa ho verificato io, personalmente, prima di darti questa pagina.** I due difetti
> in cima — il doppio ordine e la doppia richiesta — li ho aperti nel codice con i miei
> occhi, perché sono quelli che cambiano cosa fai domani. Sono veri tutti e due, e per il
> n.4 la protezione **esiste già** venti righe più su, in un'altra funzione: è solo non
> stata portata dove serviva. Gli altri sei li ho letti ma non riverificati uno per uno:
> hanno superato lo scettico, non il mio controllo diretto. Te lo dico perché la
> differenza conta.

---

# Verbale del consiglio — Supply Chain Pro, 2 agosto 2026

**In una riga:** l'app è messa bene — i conti, i permessi e il motore che tiene allineati i telefoni sono scritti con cura e reggono alla prova; gli otto punti qui sotto sono difetti veri ma stanno tutti ai bordi, e sette su otto si chiudono con poche righe.

Sei revisori hanno guardato sei settori diversi. Dieci segnalazioni sono passate al vaglio dello scettico; due erano lo stesso difetto visto da due parti, quindi restano **otto difetti**, in ordine di danno.

---

## 1. Si riordina la merce che è già stata ordinata

**Cosa succede in cucina.** Il retro ha bisogno di 8 kg di farina. Premi «Ricalcola», parte l'ordine, lo segni «ordinato». Il giorno dopo — la merce non è ancora arrivata — ricalcoli: l'app rifà da capo la stessa richiesta di 8 kg accanto a quella già partita. Al fornitore ne chiedi 16 per un bisogno di 8. Arriva il doppio, si paga il doppio, e su un fresco è roba da buttare. Se poi le consegne sono parziali nascono due righe di residuo e una resta lì per sempre a chiedere merce che non serve.

**Quando.** Tutti i giorni. Fra l'ordine e la consegna passa una notte, e in quella finestra ogni «Ricalcola» — più ogni conteggio di linea che attinge dal retro, più ogni evasione del laboratorio — rifà la domanda. L'app non ha proprio il concetto di «già in viaggio»: non esiste da nessuna parte nel codice.

**Dove.** `app-gen573.jsx:6000-6006` (`aggiornaOrdineDiretto`) e `app-gen573.jsx:8756-8760` (`aggiornaOrdineLab`): il fabbisogno è `parOggi − quantità in casa`, e la ricerca della riga da aggiornare guarda solo lo stato `da-ordinare`, mai `ordinato`.

**Costo.** Due righe per funzione, due funzioni: sottrarre dal fabbisogno quello che è già partito. Il caso «l'ordine in viaggio copre tutto» si toglie da sé, il ramo esiste già. Mezza giornata compreso un collaudo nuovo.

---

## 2. Due persone che salvano nello stesso momento: il lavoro di una sparisce

**Cosa succede in cucina.** Giulia in laboratorio evade dodici richieste. Nello stesso istante Marco a Fiumicino chiude un conteggio. Marco aveva letto la situazione un attimo prima, e quando salva riscrive tutto com'era prima delle evasioni di Giulia. Le dodici evasioni non esistono più — e, siccome per l'app la versione più recente vince, spariscono anche dallo schermo di Giulia al giro dopo. Nessun messaggio, nessuna riga di storico, e la merce risulta ancora in laboratorio quando invece è già in linea.

**Quando.** Ogni volta che due dispositivi salvano a cavallo l'uno dell'altro. Non è raro: ogni tocco fa partire subito un ciclo, e in raffica (Plancia, «Tutto arrivato», conferma di un conteggio) un telefono scrive quasi di continuo per qualche secondo. Aggravante trovata durante la verifica: le versioni sono l'orologio del telefono, quindi **un telefono con l'ora avanti scarta di proposito quello che hanno scritto gli altri** — lì non è più una finestra di millisecondi, è sistematico.

**Dove.** `app-gen573.jsx:142-146` (`scriviRemoto`: la scrittura non porta nessuna condizione sul valore precedente) e `app-gen573.jsx:10985-10997` (fra il «leggo» e lo «scrivo» c'è un giro di rete intero). Il commento in cima al motore promette «nessuna sovrascrittura tra utenti»: quella promessa oggi non è mantenuta.

**Costo.** Poche righe: dopo aver scritto, rileggere e controllare che sia rimasta la propria versione; se no, non svuotare la coda e lasciar ripartire il ciclo — l'app sa già riapplicare le modifiche sullo stato del vincitore. **È la correzione più delicata delle otto**, perché una rilettura vecchia o in cache va trattata come riuscita, altrimenti si rischia di applicare due volte la stessa modifica. Un giorno, con prove fatte bene.

---

## 3. Un CSV di catalogo senza le colonne giuste azzera tutte le unità di misura

**Cosa succede in cucina.** Importi un listino a due colonne (Nome; Prezzo). L'anteprima dice tranquillamente «1 aggiornato, 0 errori». Da quel momento ogni prodotto toccato ha perso l'unità base e tutte le conversioni: 4 buste di grana valgono 4 teglie invece di 12. Prelievi, richieste al laboratorio e righe d'ordine escono tutti con il numero sbagliato, e il magazzino continua a mostrare numeri credibili che non vogliono più dire niente. In più ogni prodotto toccato finisce nella prima categoria e dal primo fornitore dell'elenco.

**Quando.** Solo importando un file a colonne parziali — tipicamente un export dell'app ripulito in Excel, che è esattamente quello che il pannello invita a fare. **Non si torna indietro:** lo storico fotografa solo le caselle dei magazzini, non i prodotti. Serve un ripristino da backup.

**Dove.** `app-gen573.jsx:577-579` e `597-610`: unità base e conversioni vengono sempre riscritte, anche quando la colonna non c'è.

**Costo.** Quattro pezzi di riga: mettere unità, conversioni, categoria e fornitore nei dati solo se la colonna esiste davvero. Più una riga di avviso nell'anteprima. Un'ora.

---

## 4. Contare due volte la stessa linea fa arrivare il doppio della merce

**Cosa succede in cucina.** Conti la linea, parte la richiesta al laboratorio. Ti accorgi di aver battuto un numero sbagliato e riconti: nasce una **seconda** richiesta identica, perché la merce non è ancora arrivata e il fabbisogno è ancora tutto lì. Il laboratorio si trova due righe per lo stesso prodotto, «Confermo tutto» le serve entrambe, e sulla linea arriva il doppio mentre all'altra sede il laboratorio risponde «non ce n'è». Lo stesso schema vale sulle linee rifornite dal retro: ricontando prima di essere andati fisicamente a prendere la roba, il retro si svuota due volte.

**Quando.** Ogni secondo conteggio della stessa linea prima che il laboratorio abbia evaso: il numero sbagliato corretto, il cambio turno, due persone sulla stessa linea. La schermata di conteggio non mostra le richieste già in attesa e non impedisce di ricontare. Attenuante: le due righe gemelle si vedono in elenco, un occhio umano sta in mezzo — ma nessuno le segnala come doppioni.

**Dove.** `app-gen573.jsx:8489`: la richiesta viene aggiunta e basta. Duemilacinquecento righe più su, a `5967-5995`, la stessa cosa è fatta bene, con il commento che spiega perché: «due richieste per la stessa cosa fanno arrivare il doppio della merce». La protezione esiste già, semplicemente non è stata portata qui.

**Costo.** Due righe copiate da lì. Un quarto d'ora.

---

## 5. Se manca la rete e poi si chiude l'app, il lavoro fatto sparisce — e la schermata dice che è andato tutto bene

**Cosa succede in cucina.** Marco conta il retro in cantina, dove non prende. L'app gli fa vedere i numeri già aggiornati e alla fine gli scrive, a lettere grandi: **«Conteggio registrato — è aggiornato e sincronizzato con tutta la rete»**. Quella frase è falsa: è scritta subito, in locale, senza guardare se la rete abbia risposto. Il lavoro resta in una coda che sta solo nella memoria della pagina. Lui chiude l'app e va a servire; iOS sfratta la scheda. La mattina dopo il magazzino ha i numeri di ieri, il laboratorio non ha ricevuto nessuna richiesta, in linea manca la roba, e non c'è nemmeno una riga di storico a dire cosa è successo.

**Quando.** Serve il concorso di due cose: rete caduta e app chiusa (o sfrattata dal telefono) prima che la rete torni. Finché la pagina resta aperta il lavoro alla fine parte. Il problema è che **sul telefono non c'è nessuna spia**: la pastiglia «Riconnessione…» è nascosta sotto i 640 punti, cioè su tutti i telefoni. L'unico avviso è un messaggino ambra che dura tre secondi e — verificato — **esce una volta sola per buco di rete**: dal secondo conteggio in poi, schermata verde e silenzio. E se la rete non cade ma si impasta, l'avviso non esce affatto.

**Dove.** `app-gen573.jsx:8532` (la frase), `1164` (la spia nascosta), `10946` e `11015` (la coda in memoria e l'avviso a scatto singolo).

**Costo.** Tre interventi separati, da fare in quest'ordine: (a) cambiare la frase quando la rete non ha ancora risposto — dieci minuti; (b) mostrare la spia sul telefono quando c'è qualcosa da sapere — dieci minuti; (c) salvare su disco il lavoro in sospeso e riproporlo alla riapertura — mezza giornata. Nota per chi la scrive: la coda contiene funzioni e non si può salvare così com'è, va salvato il risultato già calcolato.

---

## 6. Lo storico dei movimenti pesa più del previsto e viaggia intero ogni tre secondi

**Cosa succede in cucina.** L'app tiene otto settimane di movimenti in uscita, e non ha nessun tetto sul loro numero — solo sull'età. Ma la causale che scrive più spesso, `conteggio`, è proprio una di quelle: **una riga per ogni articolo contato**, tutto il magazzino, ogni volta. Il risultato è che il pacchetto di dati che ogni telefono scarica ogni tre secondi si stabilizza intorno ai 200-600 KB di soli movimenti, contro i 115 KB di tutto il resto. Non è un guasto: è peso costante che si paga in dati mobili, batteria e lentezza di apertura, e che rende più probabili i fallimenti di scrittura del punto 5.

**Quando.** Sempre, in proporzione a quanto si lavora. **Va corretto il racconto:** non «cresce senza fine» — arriva a un tetto in otto settimane e lì resta. Fra sei mesi sarà come fra due.

**Dove.** `app-gen573.jsx:397-407` (il tetto c'è solo sul resto, non sulle uscite) e `8485` (un movimento per riga contata). Il commento a `393-394` giustifica la scelta dicendo che le uscite sono meno del 3% del traffico: nel flusso vero sono il 60-75%. `convlogictest.mjs` §2 sembra coprire il caso ma il suo scenario finto è rovesciato rispetto a come l'app scrive davvero — è verde per il motivo sbagliato.

**Costo.** Tre righe: un secondo contatore nello stesso ciclo. Più la correzione del commento e dello scenario del collaudo, che oggi raccontano una cucina diversa da questa.

---

## 7. Nella Plancia un profilo Laboratorio riceve un «fatto» per un lavoro non fatto

**Cosa succede in cucina.** Un profilo Laboratorio apre la Plancia, spunta la casella «tutta la sede fm», preme «Riempi al livello previsto». Vede il verde, il lampo su tutte e novanta le caselle, il contatore che vola, e nello storico resta scritto per sempre «Riempite 90 caselle». **Sul magazzino non si è mosso niente** — giustamente, perché quei magazzini non sono suoi: il muro dei permessi tiene, ma nessuno glielo dice. Chi crede al messaggio non ricontrolla, e il giorno dopo la linea è scarica.

**Quando.** Oggi mai: nei dati veri non esiste nessun profilo con ruolo Laboratorio, ci sono solo Admin e operatore. **È un difetto reale ma dormiente** — si sveglia il giorno in cui viene creato un profilo Laboratorio.

**Dove.** `app-gen573.jsx:2842-2844` e `2852-2855`: le tre selezioni per singola casella controllano i permessi, le due in blocco no. Poi la scrittura scarta in silenzio e il messaggio conta la selezione invece di quello che ha davvero fatto.

**Costo.** Due filtri, gli stessi che una funzione lì accanto ha già. Venti minuti. **Da guardare nello stesso passaggio**, perché è la stessa famiglia: il tasto «Annulla l'ultima modifica» (`2881-2895`) non controlla i permessi affatto — dopo un comando a vuoto resta lì con dentro la fotografia di magazzini altrui, e premuto più tardi ci riscrive sopra i valori vecchi.

---

## 8. Il giro automatico dei collaudi non apre nessuna scheda — e il documento di consegna dice una cosa non vera

**Cosa succede.** Il controllo più prezioso della rete di sicurezza — «ogni tasto che si vede si deve poter premere», con il dito messo al centro — gira su 44 schermate e su **zero** delle 40 schede che si aprono sopra (Gestione rapida, Rettifica giacenza, Trasferimento, Registra scarto, Ho prodotto, Ricezione merce, Evadi richiesta, Importa CSV). È lì che sta il lavoro. Peggio: `CONSEGNA.md:178` e `generaletest.mjs:23` dicono che quel giro «è l'unico che avrebbe preso il difetto peggiore del 31 luglio». Non è vero — quel difetto stava dentro una scheda che il giro non apre mai; l'hanno preso `bulk2test.mjs` e `lentesempretest.mjs`.

**Quanto è grave davvero.** Meno di come suona: i collaudi che premono un tasto lo premono per davvero, e se qualcosa gli sta davanti diventano rossi da soli. Il rischio vero è più stretto: un tasto morto che nessun collaudo preme, e i problemi che si vedono solo sul telefono (parecchi collaudi girano solo a schermo grande).

**Costo.** Sei righe dentro un ciclo che c'è già. E, a costo zero e subito, correggere quelle due frasi: il documento di consegna è il posto dove si va a leggere di cosa fidarsi.

---

# Cosa è stato controllato e sta bene

Non è un elenco di cortesia: sono i punti dove i revisori hanno cercato il guasto e non l'hanno trovato.

**I conti.** Le conversioni, gli arrotondamenti dei prodotti «solo interi» (per eccesso su quello che si chiede, per difetto su quello che si preleva davvero, compreso il caso «nel retro c'è mezza confezione quindi non parte niente») e il gesto «Ho prodotto» sono stati verificati facendo girare il codice, non leggendolo: 30 pezzi su una resa di 20 danno esattamente 1,5 volte la ricetta, e gli ingredienti che andrebbero sotto zero sono scritti in rosso prima di toccare qualcosa, non dopo.

**La quantità arrivata comanda su tutto.** Alla ricezione vale quello che è arrivato davvero, il residuo torna «da ordinare» in una riga nuova, e in «Ricevuti» il numero grande è l'arrivato con l'ordinato scritto accanto quando i due non coincidono. È la parte più delicata del rifornimento ed è fatta senza scorciatoie.

**Le porte verso il fornitore.** «Report ordine» e «Da mandare adesso» scartano i preparati sul momento: una riga vecchia non fa più comprare fuori una cosa che si fa in casa. E `reporttest.mjs` legge quel testo carattere per carattere — è il collaudo modello di tutta la cartella.

**Il «Confermo tutto» del laboratorio** simula i prelievi in fila e in due passate, così il numero annunciato è quello che succede davvero e la prima linea in elenco non si porta via l'extra delle altre.

**I permessi.** Nessuno è riuscito a trovare un punto in cui un operatore scriva sul magazzino di un'altra sede. C'è una regola sola per «chi vede cosa», usata da tutte le schermate, e nei punti caldi (ripristino dallo storico, trasferimento scorte, azioni in blocco) il controllo è rifatto **dentro** la scrittura, non solo sul tasto. `labtest.mjs` e `gen552test` tengono ferma la separazione fra le sedi.

**Il telefono.** Le fasce di sicurezza (notch, barra in basso) sono gestite ovunque contino — intestazione, barra, corpo che scorre, tasto fisso «Verifica e conferma». Gli stati vuoti dicono cosa fare e chi lo può fare. E prima di un gesto grosso la schermata elenca per nome cosa perderà cosa, e avvisa a parole quando la richiesta è più del doppio del previsto («se è stato il dito sul meno, torna indietro»).

**Il motore di sincronizzazione**, nonostante i punti 2 e 5, è il pezzo di codice più pensato del file: le modifiche viaggiano come istruzioni riapplicate sull'ultimo stato letto, non come fotografie, e le letture vecchie vengono rifiutate — è quello che ha chiuso la vecchia classe di difetti degli ordini che «sparivano». La potatura dello storico ordini evita tre trappole conosciute su tre.

**Il conteggio, il gesto più usato dell'app, è coperto bene.** `interi3test.mjs` fa il giro completo — evasione dal laboratorio, ricezione, conteggio, tre ruoli — e ogni volta rilegge i dati veri e controlla il numero finito in magazzino. E i quattro esiti di `corri.mjs` (verde / rosso / **muto** / **saltato**) sono l'invenzione che impedisce alla rete di mentire a se stessa.

### Allarmi rientrati (per non mandare nessuno a caccia di fantasmi)

- **L'app non rallenta a ogni tasto premuto quando manca la rete.** Era stato segnalato, è falso: i numeri battuti restano locali e si salva una volta sola alla conferma. Nel codice c'è perfino il commento che spiega la scelta.
- **Lo storico dei movimenti non cresce all'infinito.** Si ferma a un tetto dopo otto settimane.
- **Il magazzino non mente mai** nel difetto n.1: le quantità restano oneste, il danno è solo soldi e merce buttata.
- **Il laboratorio non va sotto zero** nel difetto n.4: c'è un freno che glielo impedisce. L'esito è «la linea prende troppo e l'altra sede resta corta», non un magazzino negativo.
- **Nessuna schermata è più permissiva delle altre**: la regola di visibilità è deliberatamente unificata fra Ordini e Storico ordini.

---

# Cosa il consiglio non ha potuto valutare

1. **L'app in produzione.** È stata esaminata la versione 5.73; in cucina gira la 5.72, «quasi identica». I numeri di riga fra le due copie in qualche punto ballano di una decina: chi corregge deve cercare la funzione per nome, non fidarsi del numero.

2. **Il pezzo che salva davvero i dati.** Il servizio che riceve e conserva lo stato non sta in questo progetto: non è stato possibile leggerlo. Quindi non si sa se il server offra un modo per accorgersi delle scritture sovrapposte (difetto n.2), né se le letture ripetute passino davvero sulla rete o siano servite dalla cache — per questo le stime di consumo dati del difetto n.6 non sono state confermate e non sono state riportate qui.

3. **Nessun collaudo è stato eseguito**, né la ricompilazione: il censimento è in corso e il divieto è stato rispettato. Tutto quello che c'è scritto sopra è stato verificato leggendo il codice riga per riga, oppure riesumando pezzi di codice in programmini a parte, fuori dalla cartella dei collaudi. Nessun file dei collaudi è stato toccato.

4. **Il ritmo vero della cucina.** Quanti conteggi si fanno al giorno, se il laboratorio fa un giro solo o due, quanto spesso due persone lavorano insieme: non si ricava né dal codice né dal documento di consegna. Le frequenze indicate («tutti i giorni», «raro») sono stime ragionate, non misure. Se una di queste stime è sbagliata, cambia l'ordine di questa lista — vale la pena dirlo.

5. **Il difetto n.7 sui dati veri:** nel salvataggio esaminato non esiste nessun profilo Laboratorio, quindi quella strada oggi non la percorre nessuno. Non è stato possibile sapere se e quando ne verrà creato uno.

---

**Se si può fare una cosa sola questa settimana:** il n.1 (doppio ordine). È l'unico che costa soldi tutti i giorni, la correzione è di due righe per funzione e non tocca niente altro.

**Se se ne possono fare due:** aggiungere la frase del n.5 — cambiare «sincronizzato con tutta la rete» in qualcosa di vero quando la rete non ha ancora risposto. Dieci minuti, e toglie l'unica bugia che l'app dice a chi sta lavorando.