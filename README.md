# Supply Chain Pro - sito di presentazione (GitHub Pages)

---

## Magazzino — inventario offline (`inventario.html`)

App **indipendente** e **100% offline**, in un unico file, pensata per vivere solo sul telefono.
Non ha nulla a che vedere con il sito di presentazione qui sopra: è un'applicazione a sé.

- **Materiali**: inserimento con giacenza, unità di misura e soglia di sotto scorta.
- **Uscite giornaliere**: registri quanto materiale è stato "dato via" ogni giorno; le giacenze si scalano da sole.
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

### Come usarla sul telefono
1. Apri `inventario.html` nel browser del telefono (o scaricalo e aprilo dai File).
2. Menu del browser → **Aggiungi a Home** per averla come icona.
3. Esporta ogni tanto un backup dalle Impostazioni per non perdere i dati.
