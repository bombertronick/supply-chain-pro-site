# «Metti e togli» — DISEGNO DEMOLITO, da rifare

> **STATO: DEMOLITO. Non si scrive codice su questo disegno.**
> Prima stesura: 17 settembre, sera. Demolita la stessa sera da sei lenti
> d'accusa piu' uno scettico per lente (dodici agenti, 320 letture del codice).
> **22 accuse fatali e 25 serie sono sopravvissute agli scettici.**
> Quello che segue non e' un piano: e' il verbale di cosa non va, e la
> direzione per il secondo giro.

Richiesta di Valerio, 17 settembre 21:56, confermata da lui su tutti e tre i
punti («sono tutte e 3 corrette»):

- **A** — aggiunte **ordinate e categorizzate** anche nel Foglio di scelta.
- **B** — il **«senza»**: «Boscaiola senza funghi».
- **C** — una **variante porta ingredienti**: «Bufala» = togli mozzarella,
  metti bufala, +2,00.

## PERCHE' IL PRIMO DISEGNO NON REGGE

Le quattro fatali, in ordine di danno. Tutte verificate sul file vero, con
riga; nessuna e' un'impressione.

### 1. La chiave del conto non conosce il «senza» (`app.jsx:14296-14297`)

```js
const chiave = voce.id + "|" + (variante?.id || "")
  + (aggOrd.length ? "|" + aggOrd.map((a) => a.id).sort().join("+") : "");
```

Tre pezzi, nessun quarto. Il ramo di fusione (`14303-14305`) trova la stessa
chiave e fa `qty + 1`: **«Boscaiola» e «Boscaiola senza funghi» diventano una
riga sola da due, con UN nome solo.** Una delle due pizze esce sbagliata dal
forno. Non serve sfortuna: basta battere due pizze dello stesso nome sullo
stesso scontrino, che al sabato e' la normalita'.
*Trovata indipendentemente da cinque lenti su sei.*

### 2. `aggiungi()` e' l'UNICO costruttore di riga, e non conosce il «via»

`grep setCarrello` da cinque risultati: `13924` (useState), **`14302` (l'unico
che compone un oggetto riga)**, `14348` (solo qty), e tre azzeramenti. Le tre
porte che modificano una riga gia' battuta — `metti()` 14368-14369,
`giraAgg()` 14424-14425, `lavoraSu()` 14454-14455 — fanno tutte
`cambia(chiave,-1)` + `aggiungi(voce, variante, scelte)`.

`aggiungi` ricava nome, chiave e distinta **solo da quei tre ingredienti**: un
quarto asse non passa. Quindi **il primo tocco sulla fascia cancella il
«senza», in silenzio**. E il caso peggiore e' peggio: se la riga ha qty 2,
`cambia(-1)` non la elimina, `aggiungi` ritrova la chiave nel ramo `gia` e la
riporta a 2 — **il «senza» sopravvive e sparisce invece l'aggiunta appena
pagata**.

### 3. `dentroId` e' progettato per decadere (`13042`, `13066`, `13075`)

E' la sorgente da cui il disegno pescava gli ingredienti da togliere.

- `13066`: `onCambia={(v) => { setDentro(v); setDentroId([]); }}` — **il primo
  carattere battuto nel campo «Cosa c'e' dentro» lo azzera**;
- `13075`: il toast subito dopo «Prendi dalla distinta» dice «sono nomi di
  magazzino, accorciali a mano» — cioe' **l'app insegna il gesto che lo
  cancella**;
- la dispensa consegnata a Valerio ripete la stessa istruzione.

Quindi la sezione «Togli» sarebbe **vuota proprio sulle voci curate bene**. E
quando sopravvive porta id di catalogo: la comanda direbbe *«Boscaiola senza
Mozzarella fiordilatte secchio 3 kg»*, che e' esattamente la cosa contro cui
il codice ha gia' preso posizione per iscritto.

### 4. Il taglio a zero e' sul CARRELLO, non sulla riga (`838-847`)

`calcoloScarico` tiene **una mappa per tutto lo scontrino** e taglia alla fine:
una riga negativa di una pizza **compensa la riga positiva di un'altra pizza**.
Una sottrazione sbagliata si mangia in silenzio lo scarico del piatto accanto.

### E cinque serie che cambiano comunque il disegno

5. **Meta' delle pizze non ha una porta**: il Foglio si apre solo sulle voci
   CON varianti (`14422`, `14453`, `14794`, `14888`: tutti i chiamanti sono
   dietro una guardia sulle varianti). Una pizza a formato unico non lo apre mai.
6. **La comanda si smentisce a una riga di distanza**: `13817` stampa
   «Boscaiola senza Funghi», `13827-13828` stampa sotto la composizione dal
   listino, che dice «funghi». Acceso di default (`13637`), e la co-occorrenza
   e' garantita al 100%.
7. **`registra` copia le righe per elenco chiuso di campi** (`14531`): `via`
   cadrebbe senza errore e non arriverebbe mai alla vendita.
8. **L'editor del listino ricostruisce le varianti da tre campi** (`13029`,
   `13051`): salvare una voce qualsiasi **cancellerebbe le distinte delle sue
   varianti** — cioe' il punto C si autodistrugge alla prima modifica.
9. **`converti` che torna null** fa `continue` su UNA riga: mezza sottrazione,
   sbagliata in tutte e due le direzioni, sotto un avviso che dice il contrario.

## COSA REGGE, E NON E' POCO

- **Il «senza» arriva davvero al forno.** `nomeBase()` con l'ordine prenotato a
  `1242-1247` conserva il suffisso, e in Comande quello span non e' troncato
  (sta in un flex-wrap, al contrario del conto). Il posto lasciato libero a
  giugno funziona.
- **Meta' del meccanismo esiste gia'**: `levaDaRiga`, `perCategoria` e
  `vuoleCategorie` sono scritti e collaudati.
- **Il punto A e' piccolo e indipendente**: le categorie nel Foglio sono una
  macchina gia' pronta che quel Foglio non chiama.

## LA DIREZIONE PER IL SECONDO GIRO

Non e' un piano approvato: e' da dove ripartire.

1. **Il «senza» entra nella CHIAVE**, non solo nella riga. Senza questo, tutto
   il resto e' decorazione.
2. **`aggiungi()` prende un quarto asse**, e le tre porte glielo ripassano. Il
   disegno vecchio non nominava nemmeno questa funzione: e' il buco piu' grande.
3. **La sorgente del «Togli» e' la `distinta`**, non `dentroId`: la distinta e'
   sempre compilata perche' e' quella che scarica il magazzino. Resta aperto il
   problema dei NOMI (di magazzino, lunghi): va deciso da dove esce l'etichetta
   che legge il cuoco.
4. **Il taglio a zero si sposta sulla RIGA.**
5. **La porta del Foglio va aperta anche alle voci senza varianti**, o il
   «senza» non esiste per meta' del listino.
6. **La riga grigia della comanda si spegne** sulle righe che portano un «via».
7. **Punto A per primo, da solo**: e' piccolo, indipendente, e non tocca ne' i
   soldi ne' il magazzino.
