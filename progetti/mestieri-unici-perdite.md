# gen-6.24 · Il mestiere unico è unico anche fuori dalla barra

**Stato: disegno, da demolire prima del codice.**
Nato dalle parole di Valerio del 18 settembre — *«Il profilo al quale assegno le
postazioni vedo ancora cose che non mi servono oltre le postazioni»* — e da quello
che ho trovato andando a guardare **dopo** che l'interruttore era acceso.

## Il fatto, misurato

Il 18 settembre ho letto i profili veri in produzione. «Fm pizza» aveva **4
postazioni assegnate** e `soloPostazioni` **spento**: la causa immediata era
quella, e si è risolta accendendo l'interruttore. Ma andando a controllare cosa
succede **con l'interruttore acceso** ho trovato che gen-6.23 ha fatto il lavoro
a metà, e la metà che manca è mia.

`soloCassa` è completo da gen-6.17: barra, muro, **lente**, **« ? »**, **giro
guidato**, testi. I due gemelli nati a gen-6.23 hanno avuto solo **barra,
atterraggio e muro**. Ovunque il codice chieda «soloCassa?» senza chiedere anche
gli altri due, lì passa qualcosa.

**10 controlli rossi registrati su gen-6.23** (`mestiereunicotest` §20–§24, giro
del 18 settembre):

| dove | cosa vede un «solo postazioni» | tipo |
|---|---|---|
| la lente 🔍 | «Sposta o rimuovi prodotti», «Trasferisci le scorte», «Aggiungi più prodotti», «Contare quello che c'è» — e ogni riga di prodotto, che porta un bottone per i Magazzini | visibile |
| il « ? » | «Plancia: la rete a colpo d'occhio» e «Panoramica completa» | visibile |
| il primo accesso | **la panoramica di otto passi parte DA SOLA** | **muta** |
| la lente, per «solo conteggi» | i magazzini, e le comande che sono il mestiere dell'altro | visibile |

La più grave è la terza, e non perché sia la più grossa: perché **nessuno la
tocca — arriva addosso**. `passiPanoramica` ha otto passi fissi («Conta · Ordina
· Ricevi», «Dentro un magazzino», «Gestione rapida», «Ordini») e **uno solo** è
condizionato alla barra. Un pizzaiolo, la prima volta che entra, viene preso per
mano dentro il mestiere di un altro.

Tutte le porte della lente finiscono comunque **sul muro** di `contenuto()`: il
danno non è un permesso violato, è un'app che gli offre dieci cose e poi gliele
nega. Che è esattamente quello che Valerio ha descritto.

## La causa, in una riga

Tre domande diverse per la stessa cosa. `soloQui`, `soloPost`, `soloCont` sono
nati come tre variabili separate, e ogni posto che filtra ne ha imparata **una**.
Un mestiere unico resta unico a metà finché la domanda non è **una sola**.

## Il disegno

Una funzione, accanto alle tre che già ci sono, che risponde **quale** stanza —
non «sì o no». Chi filtra deve sapere cosa lasciar passare, non solo cosa
bloccare.

```js
function mestiereUnico(profilo) {
  if (soloCassa(profilo)) return "cassa";
  if (soloPostazioni(profilo)) return "comande";
  if (soloConteggi(profilo)) return "conteggi";
  return null;
}
```

Restituisce **l'id della vista**, non un'etichetta nuova: così ogni filtro
diventa un confronto diretto e non c'è una seconda tabella da tenere allineata.

Poi, i cinque punti:

1. `azioniTrovate` — `const solo = mestiereUnico(profilo); if (solo) return a.d === solo;`
   (oggi: `if (soloCassa(profilo)) return a.d === "cassa";`)
2. `righeRicerca` — `if (mestiereUnico(profilo)) return [];`
3. il `« ? »` — il blocco «Plancia»+«Panoramica» sotto `!unico` invece di `!soloQui`
4. il giro guidato automatico — `if (!unico && …)` invece di `if (!soloQui && …)`
5. dentro `Struttura`, le tre costanti si derivano dall'unica domanda:
   `const unico = mestiereUnico(profilo); const soloQui = unico === "cassa"; …`
   e il muro diventa una riga sola: `(unico && vista !== unico) ||`

## Cosa NON cambia, ed è la parte da difendere

- **Non si deduce niente.** `mestiereUnico` legge i tre interruttori dichiarati e
  basta. Un profilo con le postazioni assegnate e l'interruttore spento resta
  quello di prima, con tutte le sue voci: `§10` e `§21b` lo misurano.
- **`soloCassa` non si tocca.** §25 e §26 pretendono che la Cassa si comporti
  esattamente come a gen-6.17.
- **La lente non si spegne.** §20b e §24 pretendono che per il SUO mestiere la
  lente risponda ancora: senza quelle due righe, basterebbe rompere la ricerca
  per far diventare verde tutto il resto.

## Le accuse da portare alla demolizione

1. `mestiereUnico` sceglie il **primo** `if` vero: se due interruttori fossero
   accesi insieme, uno vincerebbe in silenzio. `unicoMestiere()` in `FormProfilo`
   li rende esclusivi, ma è una guardia **della scheda**, non del dato — un
   documento vecchio o una scrittura da un altro telefono potrebbero avere due
   campi a true. Serve una misura?
2. Il punto 5 è un **refactor** dentro `Struttura`, cioè il posto più caldo
   dell'app. Vale il rischio, o meglio lasciare le tre costanti come sono e
   toccare solo i quattro filtri?
3. `a.d === solo` per «comande» dipende dal fatto che nella tabella `AZIONI`
   l'unica voce con `d: "comande"` sia quella giusta. Regge il giorno che se ne
   aggiunge un'altra?
4. Il muro in una riga sola (`unico && vista !== unico`) perde la leggibilità dei
   tre casi separati. E se domani un mestiere unico avesse **due** viste?
5. C'è un quinto posto che non ho visto?

---

# Quello che la caccia ha trovato e io non avevo visto

Sei lenti indipendenti sul file vivo, poi **uno scettico per accusa** col mandato
di demolirla: **38 accuse, 36 in piedi, 2 cadute**. Le ho fuse per riga: sotto
ci sono solo le distinte. Ogni riga è stata letta il 18 settembre.

## B · Il mestiere unico sopravvive a ciò che lo rendeva possibile

Tre trappole di **dato**, non di schermo. Nessuna si vede finché non morde, e
tutte e tre scattano **senza che nessuno tocchi la scheda del profilo**.

**B1 — Cancellare una postazione non la toglie dai profili** (`app.jsx:13329`).
`soloPostazioni()` conta gli **id**, non le postazioni che esistono. Valerio
toglie «Fritti» da Gestione → Listino; l'id resta appeso nel profilo; il ragazzo
entra, atterra su Comande con **una voce sola in barra**, e dentro trova «Non ci
sono ancora postazioni»: non può nemmeno sedersi. **Chiuso in una stanza vuota,
e l'unica uscita è il tasto Esci.** Il magazzino la cascata ce l'ha già
(`eliminaMagazzinoCascata`, riga 1631); la postazione no.

**B2 — Cancellare l'ultimo magazzino riaccende tutta l'app** (`app.jsx:1631`, e
lo stesso al cambio sede in `FormMagazzino`). `magazziniIds` si svuota,
`soloConteggi()` passa a false, e quel profilo **si ritrova la barra piena** —
Home, Conteggi, Magazzini, Ordini — senza che nessuno abbia spento niente.
**È esattamente il danno che ho usato come argomento per NON dedurre i
permessi**, e ce l'ho in casa nel verso opposto. Peggio: il flag resta `true` nei
dati e l'interruttore **sparisce dalla scheda** (`{magIds.length > 0 && (`),
quindi Valerio non lo vede e non può spegnerlo.

**B3 — Cambiare sede a un profilo non azzera le postazioni** (`app.jsx:7783`).
Il selettore azzera i magazzini e non le postazioni: a video i chip diventano
quelli della sede nuova e nessuno è spuntato, ma l'interruttore resta **acceso**
e al salvataggio si riscrivono gli id della sede vecchia.

**La cura, in una riga sola di principio:** *un interruttore non resta acceso
sopra il vuoto, e non si nasconde mai se è acceso.*
- cascata della postazione sui profili, come quella del magazzino;
- quando la lista resta vuota si spegne anche il mestiere (`undefined`, non `false`);
- `setPostIds([])` al cambio sede, come già fa `cambiaRuolo`;
- un interruttore **già acceso** si disegna sempre, anche a lista vuota, così si
  può spegnere.

## C · La lingua che dice il vero (gen-5.99)

- `app.jsx:4908` — l'intestazione dice **«Magazzino, cassa e comande»** a chi ha
  una stanza sola. Tre lenti su sei l'hanno trovata da sole.
- `app.jsx:11185` e `11378-11379` — dentro **Conteggi**, a chi sta *solo* ai
  conteggi, due riquadri dicono «apri l'Inventario **da Magazzini**» e «aggiungilo
  **dal pannello Magazzini**»: un ordine che non può eseguire.
- `app.jsx:7888` e `7893` — **le frasi degli interruttori le ho scritte io**, e
  oggi promettono «vede SOLO … niente Home, né conteggi, né magazzini, né ordini»
  mentre la lente e il «?» gliele offrono. La cura A **rende vera la promessa**:
  non c'è testo da cambiare, c'è codice da finire.

## Dichiarati fuori da gen-6.24, con il motivo

- `4979` il «?» non chiede se la stanza che guardi è murata — caso limite,
  raggiungibile solo restando parcheggiati su una vista murata;
- `4831` il muro dice «manca un'autorizzazione» anche quando c'è — vero, ma è un
  difetto del muro per **tutti**, non dei mestieri unici: merita una voce sua;
- `4761` / `6003` — testi di contorno, nessun danno misurabile.

## Le accuse contro il mio disegno, da portare alla demolizione

1. `mestiereUnico` sceglie il **primo** `if` vero: due interruttori accesi insieme
   nei **dati** (non nella scheda, che li esclude) farebbero vincere uno in
   silenzio. Serve una misura, o è impossibile?
2. Il punto A5 è un **refactor dentro `Struttura`**, il posto più caldo dell'app.
   Vale il rischio, o si toccano solo i quattro filtri?
3. `a.d === solo` per «comande» regge il giorno che si aggiunge una seconda voce
   con `d: "comande"`?
4. Spegnere il flag nelle cascate (**B1/B2**) è una scrittura che parte da
   un'azione su un'**altra** entità: è dentro lo stesso `muta`, quindi
   rieseguibile — ma la guardia di stato c'è?
5. B2 dice «spegni il mestiere quando la lista si svuota». Ma se Valerio cancella
   il magazzino **per sbaglio** e poi lo ripristina da backup, il mestiere resta
   spento: è il verso giusto in cui sbagliare?
6. C'è un sesto posto che nessuna delle sei lenti ha guardato?
