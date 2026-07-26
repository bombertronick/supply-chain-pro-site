# Supply Chain Pro - sito di presentazione (GitHub Pages)

---

## Magazzino — inventario offline (`inventario.html`)

App **indipendente** e **100% offline**, in un unico file, pensata per vivere solo sul telefono.
Non ha nulla a che vedere con il sito di presentazione qui sopra: è un'applicazione a sé.

- **Prodotti**: inserimento con giacenza, unità di misura, soglia, **prezzo di vendita** e **distinta base** (materie prime consumate).
- **Materie prime**: magazzino a parte con **costo** e giacenza; si scala da solo quando dai via un prodotto che le usa (modello a due livelli).
- **Guadagno**: costo prodotto = somma dei costi delle materie; margine = prezzo − costo; guadagno del giorno e per singola uscita.
- **Uscite giornaliere**: registri quanto è stato "dato via" ogni giorno; giacenze prodotto e materie aggiornate in automatico.
- **Tipologie**: raggruppi i prodotti per categoria (con colore).
- **Riepilogo**: totali, avvisi sotto scorta, uscite di oggi.
- **Cestino** dei movimenti cancellati, con ripristino o eliminazione definitiva.
- **PIN** locale opzionale.
- **Copertura**: l'app si apre come una calcolatrice funzionante; si entra digitando un codice segreto e premendo `=`. Pulsante 🔒 per ri-coprire all'istante.
- **Backup cifrato** (AES-256 con password): il file è illeggibile senza password, riapribile solo dall'app.
- **Installabile** con icona propria (manifest + icona generata, neutra quando la copertura è attiva).
- Tema **scuro**.

### Sicurezza
Nessuna connessione a internet, nessun server, nessuna libreria esterna: i dati restano solo nella
memoria del browser del dispositivo, quindi non c'è nulla di raggiungibile dall'esterno. I backup sono
cifrati con password (AES-256-GCM, chiave derivata via PBKDF2).

### Due formati
- **`inventario.html`** — file unico e autonomo. Perfetto per aprirlo al volo o servirlo in rete locale; niente da installare.
- **`app/`** — versione **PWA installabile** (stessa app + `manifest.webmanifest`, `sw.js`, icone). Servita via HTTPS si installa con icona propria su **iPhone e Android** e funziona offline grazie al service worker.

### Installazione
- **iPhone** (Safari): apri la pagina `app/` da un indirizzo HTTPS → Condividi → **Aggiungi a Home**. Da lì funziona offline.
- **Android** (Chrome): apri `app/` → menu → **Installa app**. Oppure genera un APK dalla PWA con [PWABuilder](https://www.pwabuilder.com/).
- **Privato senza nulla di pubblico**: servi `inventario.html` da un computer sulla stessa Wi‑Fi e fai *Aggiungi a Home* dall'indirizzo locale (essendo file unico funziona offline anche senza service worker).

Esporta ogni tanto un backup cifrato dalle Impostazioni per non perdere i dati.
