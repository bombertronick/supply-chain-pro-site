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
gen-5.69. La verità resta il database.

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

> `app_bootstrap()` restituisce `meta` come **stringa** JSON: va convertita con
> `(b.j->>'meta')::jsonb`, se no i confronti falliscono in silenzio.

---

## 3. I collaudi

61 file in `collaudi/`, **1076 controlli veri**. Girano con Chromium senza rete:
l'app viene compilata in un pacchetto locale e i dati sono finti.

```bash
cd collaudi
npm install                    # solo la prima volta
node build.mjs ../app/app.jsx  # costruisce il pacchetto da provare
node corri.mjs --censimento    # li fa girare TUTTI, senza fermarsi
node corri.mjs nometest.mjs    # uno solo
```

**Tre esiti, non due.** `verde`, `ROSSA` e **`MUTA`**. Un file che gira, esce
pulito e non stampa nemmeno un controllo non prova niente: per mesi ne ho
contati diversi come verdi. Chiamarli col loro nome è metà del valore.

**La bandierina.** `corri.mjs` scrive `.censimento-in-corso` mentre lavora, e
`build.mjs` **si rifiuta** di ricostruire il pacchetto finché c'è. *Il 31 luglio
ho invalidato tre censimenti ricostruendo il pacchetto mentre giravano: i file
provati prima e quelli dopo avevano visto due versioni diverse. Non è una
distrazione da ricordare, è una possibilità da togliere.*

**Una lacuna nota di `corri.mjs`**: in modalità censimento non conserva l'output
dei file rossi, quindi di una suite che fallisce *solo sotto carico* non si
riesce a sapere quale controllo sia caduto. Tre suite lo fanno
(`pintest`, `pin2test`, `pin535test`): passano da sole, cadono ogni tanto in
mezzo alle altre. Hanno attese a tempo fisso invece di aspettare che la
schermata sia pronta. Da sistemare: salvare l'output dei rossi, poi togliere
le attese fisse.

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

**Attenzione a `navtest.mjs`**: esporta `vaiA(p, dove)`, che sa che da gen-5.52
Catalogo, Analisi, Storico, Sedi, Profili, Accessi e Sistema stanno sotto
«Gestione». Navigare a mano è la causa numero uno di collaudi che diventano
rossi senza che l'app abbia niente che non va.

---

## 4. Cos'è online adesso

**In produzione: gen-5.69.** Censimento completo verde prima di ogni rilascio.

| versione | cosa |
|---|---|
| gen-5.65 | i tre tasti di «Gestione rapida» che non si potevano premere |
| gen-5.66 | marcare in blocco chi fa un prodotto · **e le due porte verso il fornitore che non ordinano più fuori i preparati** |
| gen-5.67 | il tutorial: 9 guide che mancavano, il tasto del « ? » che non dice più «Guida di "Home"» |
| gen-5.68 | **le ricette**: il gesto «Ho prodotto» che scala gli ingredienti |
| gen-5.69 | «In quali magazzini sta» dalla riga del prodotto, e l'avviso dei prodotti orfani che porta il rimedio con sé |

**Rimasto da fare, richiesto e non fatto:**

- **B** — la ricerca 🔍 deve trovare anche **le funzioni**, non solo i prodotti.
  Scrivi «sposta» e ti porta a «Sposta o rimuovi prodotti». È la risposta alla
  frase: *«devo poter fare tutto senza dovermi ricordare in che parte dell'app
  ho quella funzionalità»*.
- **C** — «Gestione rapida» riordinata a gruppi (*Aggiungere · Spostare ·
  Livelli*), con le stesse parole che usa la ricerca.

---

## 5. Quello che aspetta una decisione umana

Nessuna di queste la può prendere una macchina. Sono elencate perché ognuna
tiene ferma una funzione che è già costruita e collaudata.

| cosa | perché è ferma |
|---|---|
| **Le dosi delle ricette** | La macchina c'è e funziona. Senza «quanta farina in una breccola» non scala niente. Basta **una sola ricetta** per provare il giro intero. |
| **Da quale magazzino escono gli ingredienti** | Oggi: un magazzino della stessa sede che ce l'ha, preferendo chi ne ha abbastanza — e la schermata lo scrive prima di applicare. Se in cucina funziona diversamente, cambia solo quella preferenza. |
| **Quali prodotti li fa il laboratorio** | In catalogo sono **zero**. Finché è zero, tutto il lavoro sui preparati è in piedi ma non tocca niente. Si marcano in blocco: Catalogo → Prodotti → Modifica in blocco → «Chi lo fa». |
| **Il PIN dell'admin** | È ancora quello di partenza. Va cambiato. (Non è scritto qui, e non deve esserlo.) |
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
