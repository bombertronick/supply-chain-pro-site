# «Il telaio» (la Cassa) — DEMOLITO, da rifare

> **STATO: DEMOLITO.** Scritto e demolito la stessa notte (17-18 settembre) da
> cinque lenti piu' uno scettico per lente. **3 accuse fatali e 40 serie**
> sopravvissute. Non si scrive codice su questo disegno com'e'.
>
> **LE TRE FATALI, e tutte e tre colpiscono la MIA proposta sulla fascia:**
> 1. **Il chip a 32px fa rosso un banco esistente, per nome, oggi**:
>    `gen603test.mjs:527` misura quel chip e pretende `>= 43,5`. I 44 punti
>    sono dichiarati **21 volte nel sorgente** e in 5 asserzioni dei banchi.
> 2. **Rimpicciolire il chip fa risparmiare ZERO pixel.** L'area dei chip e'
>    gia' tappata a `6.1rem` (97,6px) e scorre: con dodici ingredienti e' alta
>    97,6 con i chip da 44 **e** con quelli da 32. Identica.
> 3. **Gli «80px» non esistono**: il solo telaio della fascia (bordi, testata,
>    spaziature) fa **69px**, e il conto onesto della Proposta A sarebbe 138.
>
> **DOVE STA DAVVERO LA COMPATTEZZA** (trovato dalla demolizione, ed e' la
> risposta alla richiesta di Valerio «un altro modo piu' compatto»): si prende
> sul **TETTO** della fascia aperta, **mai sul chip**. La pastiglia chiusa e'
> bloccata a 44-56 da tre banchi, il chip a 44 da un banco; **il tetto (15075,
> 15085) non ha nessun banco che lo difenda dal basso** — e' l'unica maniglia
> libera, ed e' quella giusta.
>
> **UN BUCO VERO CHE C'ERA GIA':** col ramo a categorie la fascia arriva a
> ~266px e **sfonda il tetto di 209 che `cassa617test.mjs:326` dichiara** — ma
> quel banco gira sul ramo SENZA categorie, quindi oggi il caso grasso non e'
> misurato contro il suo stesso limite.
>
> **E L'ARITMETICA DI QUESTO DISEGNO E' SBAGLIATA LO STESSO:** 88+8+444+8+344
> usa un gap da 8 **che nel codice non esiste, e' 12** — fa **900 su 892**.
> Avevo misurato la larghezza e sbagliato comunque il conto.
>
> Altre serie che contano: sul telefono il fondo e' **gia' occupato per 168px**
> da due strati fissi (la barra del totale non ha dove stare); la scheda «Oggi»
> che avevo chiamato spreco e' **l'unica porta verso lo storno**; il raggio del
> rail non sono gli 8 banchi di `data-fascia` ma **`cassanav.mjs`, che 19
> banchi importano**; «i soliti» non e' un lavoro di Cassa ma un campo nuovo
> nello schema piu' una porta in Gestione piu' `normalizza()`.
>
> **E LA COSA PIU' UTILE, dalla lente del metodo:** il telaio riscrive un
> lavoro che **nessuno ha ancora visto**. In produzione c'e' gen-6.22, il
> repository e' a gen-6.23 e non e' online, e **meta' delle ragioni del telaio
> sono gia' state pagate** da gen-6.23. Prima si manda online quello, poi si
> ridisegna sapendo cosa si e' visto con gli occhi.

---

# Il disegno com'era scritto (demolito, tenuto per storia)

Parole di Valerio, 17 settembre: «Va cambiato il layout ed il design della
cassa deve essere più rapido ed intuitivo ed avere a colpo d'occhio le
funzionalità della cassa».
E sulla fascia degli ingredienti, quando gli ho chiesto se moriva: **«La fascia
deve avere un altro modo più compatto per poter essere visualizzata, quindi
resta ma non come è adesso»**.

Esce da: 1 inventario del codice, 3 progetti indipendenti da vincoli opposti,
3 giudici (il cassiere del sabato, Valerio, chi scrive il codice). Vincitore
unanime: «Telaio fisso», 102 punti contro 60 e 43.

## I NUMERI VERI, MISURATI (non stimati)

Il progetto vincente chiedeva tre colonne da 300+480+360 = **1140px**. Non ci
stanno. Misurato aprendo l'app alle misure del tablet di Valerio:

| schermo | contenitore del contenuto | parte da x |
|---|---|---|
| 1180x820 (il tablet, orizzontale) | **892px** | 256 (dopo la barra laterale da 224) |
| 390x844 (il telefono) | **358px** | 16 |

**Il budget e' 892, non 1180.** Ogni disegno che non parte da qui e' gia'
sbagliato: a gen-5.52 una stima cosi' ha rotto «Magazzini» a 360px.

## COSA L'INVENTARIO HA TROVATO (le ragioni del lavoro)

- **Il cappello mangia 240-275px su 390x844** prima ancora della riga dei
  gruppi: titolo + sottotitolo (~66), scheda «Oggi» (~96-130), pastiglia del
  cliente (60). La pastiglia scrive «Banco» e nel 90% delle battute non si
  tocca mai.
- **Gli esauriti costano 3 tocchi e zero parole**: fascia chiusa da aprire,
  poi un'icona senza etichetta.
- **Il tocco sul nome della riga** e' l'UNICA porta per mettere un'aggiunta su
  una pizza senza formati (la maggioranza), e si annuncia con una
  sottolineatura tratteggiata.
- **Il progressivo da urlare in cucina non compare mai** quando serve: dopo
  l'incasso il toast dice solo «Incassato € X».
- **La ricerca dentro il listino non esiste**, con 26 voci.
- **Togliere una riga da tre costa tre tocchi.**

## IL TELAIO — le zone, coi numeri

### Tablet (892 di larghezza, 820 di altezza)

```
[ rail gruppi 88 ][ listino 444 ][ conto 344 ]      88+8+444+8+344 = 892
```

- **Rail dei gruppi**, colonna verticale a sinistra, col badge del conto. Due
  progetti nemici ci sono arrivati da soli senza parlarsi: e' il segnale piu'
  forte della gara.
- **Listino** al centro: celle come oggi, gruppo aperto.
- **Conto** a destra, appiccicato: gia' fatto in gen-6.23.
- **Il totale e' una lastra**, non un numero in fondo a una scheda: cifre
  grandi, quota fissa. L'invariante da collaudare: **il rettangolo del totale
  e' IDENTICO con una riga e con dodici**.

### Telefono (358)

Una colonna. Il totale NON deve stare in fondo alla pagina: serve una barra
del totale sempre visibile. **Il telefono non resta indietro** — e' un veto
esplicito del giudizio.

## LA FASCIA: RESTA, E DIVENTA COMPATTA (decisione di Valerio)

Oggi aperta: **166px di altezza**, chip da 44 che dicono «Acciughe + € 1,00».

**Proposta A (primaria) — il chip dimagrisce.** Chip a 32px, **solo il nome**:
il prezzo dell'aggiunta si legge gia' sulla riga del conto, scriverlo anche
sul chip e' dirlo due volte. Dodici chip su due righe passano da ~166 a ~80px.
Le categorie restano, come etichetta minuscola a sinistra.

**Proposta B (alternativa, solo tablet) — la fascia diventa verticale**, una
striscia stretta fra listino e conto. Costa larghezza invece che altezza, e
sul tablet l'altezza (820) e' la risorsa scarsa. MA il budget e' 892 e non
avanza: entrerebbe solo togliendo al listino.

**Da demolire:** quale delle due, o nessuna delle due.

## COSA SI RUBA AI PROGETTI PERDENTI

- il **totale come lastra** a quota fissa;
- il **progressivo grande** al posto del totale per pochi secondi dopo
  l'incasso, nel momento esatto in cui si urla in cucina;
- la **×** che butta la riga intera in un tocco (oggi una riga da tre costa
  tre tocchi);
- **«Cerca» e «È finita» come tasti con la parola scritta**, sempre nello
  stesso angolo (oggi gli esauriti sono un'icona muta dentro una fascia
  chiusa);
- la **ricerca dentro il listino**, che oggi non esiste;
- il **labbro ambra** sullo scontrino quando una riga non scala il magazzino;
- **«i soliti»**: le voci piu' battute in cima — ma **scelte da Valerio**, non
  dedotte dalle vendite (le vendite durano 48 ore: lunedi' ti ritrovi la fila
  di sabato).

## I VETI — non si negoziano, in nessun disegno

1. **Nessun tocco solo che registra la vendita.** Disfarla costa uno storno
   con motivo obbligatorio E il PIN di un admin.
2. **Nessun formato scelto dalla macchina.** «Metti il piu' venduto» stampa un
   prezzo sbagliato in silenzio, sulla voce piu' venduta. E' l'unico punto
   della gara dove si perdono soldi davvero.
3. **Nessuna pressione lunga come unica porta.** Non ha gemello da tastiera ne'
   da lettore di schermo.
4. **«L'ordine non conta» non si tocca**: prendere prima l'ingrediente e poi il
   piatto e' una richiesta di Valerio del gen-6.03.
5. **+ e − restano UN tocco.** Nessun «prima scegli, poi agisci».
6. **Niente modi invisibili** che cambiano il significato di un tocco.
7. **Gli avvisi di scarico restano PRIMA del pagamento**, non dopo.
8. **Le richieste vecchie di Valerio si spostano o si comprimono, non si
   cancellano** spacciandolo per semplificazione.

## LE DOMANDE APERTE PER LA DEMOLIZIONE

1. Il rail verticale a 88px regge i nomi dei gruppi veri («Salsiccia e
   friarielli» no, ma i GRUPPI: Pizze, Fritti, Dolci, Bevande)?
2. 444px di listino a quante colonne di celle corrispondono, e le celle
   restano leggibili con «Cosa c'e' dentro» dentro?
3. La fascia compatta a 32px regge il dito? Il minimo in questa casa e' 44
   punti, dichiarato piu' volte nei commenti. **32 sarebbe una regressione di
   accessibilita' su un bersaglio che si tocca tutta la sera.**
4. Togliere il prezzo dal chip: quanto costa davvero al banco, quando il
   cliente chiede «quanto viene con la bufala?»
5. Il telefono: dove sta la barra del totale senza rubare il posto alla barra
   di navigazione e alla fascia chiusa?
6. Quanti banchi rompe tutto questo? `data-fascia` sta in 11 file di banco,
   `data-agg` 32 volte, e le barre sono misurate voce per voce.
