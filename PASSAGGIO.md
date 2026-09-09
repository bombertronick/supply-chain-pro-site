# Passaggio di consegne fra sessioni · 9 settembre 2026, sera

Questo file serve a UNA cosa: far ripartire un'altra sessione di Claude Code
dal punto esatto in cui questa si è fermata, senza che Valerio debba spiegare
niente. Si aggiorna a ogni rilascio insieme a roadmap e memoria.

## Cosa serve alla sessione nuova (lo prepara Valerio)

1. Il repository `bombertronick/supply-chain-pro-site`, branch
   `claude/supabase-app-improvements-5hx3ge` (è PUBBLICO: mai chiavi, mai PIN,
   mai dati veri nei file).
2. Il connettore **Supabase** con il progetto `pxozltayynejrmartzzf`: è l'unico
   canale di rilascio (`execute_sql` sulla tabella `kv_store`) ed è dove vive
   la dispensa (`ctx:v1:*`). Senza, la sessione può solo leggere il codice.
3. GitHub per il push sullo stesso branch.

## Il primo messaggio da incollare nella sessione nuova

> Riprendi il lavoro su Supply Chain Pro. Leggi in quest'ordine: PASSAGGIO.md,
> memoria.json (online, chiusi[0], tuoi, _dispensa), roadmap.md; poi l'indice
> della dispensa (`node strumenti/dispensa.mjs indice` → esegui l'SQL col
> connettore Supabase → salva il risultato così com'è in un file) e la voce
> `chk-20260909-sera` (`node strumenti/dispensa.mjs leggi chk-20260909-sera`).
> Non cambiare niente prima di aver letto tutto. Poi procedi col PROSSIMO in
> ordine, con le regole di sempre: collaudo scritto prima (rossi registrati),
> sabotaggi contati aprendo ogni muto, censimento completo a ogni rilascio da
> solo, VERSIONE alzata, roadmap+memoria+artefatto+dispensa, commit e push.

## Stato al momento del passaggio

- **Produzione**: gen-6.13, `app:jsx:src` len 962978, md5
  `fb250073e10846c723a919c620262f5b`, meta `{"len":962978,"ver":"gen-6.13"}`.
  Backup: `backup:pre-gen614` = gen-6.13, `backup:pre-gen613` = gen-6.12,
  `backup:pre-gen612` = gen-6.11. Verificare con una `select` prima di toccare.
- **Repo**: in pari con la produzione. `app/app.jsx` del commit di rilascio
  È la base per il prossimo `sql_diff` (le basi «congelate» stavano nello
  scratchpad della sessione vecchia e non servono: coincidono con questo file,
  verificare l'md5 sopra).
- **Censimenti**: tutti e due finiti e scritti nei documenti. gen-6.12 e
  gen-6.13: 97 verdi, 1975 controlli veri, 0 rosse, 0 mute, 7 saltate (i sette
  vogliono i dati veri, che non stanno nel repository). Si rilancia con
  `cd collaudi && node corri.mjs --censimento`, DA SOLO: dura ~2 ore e mezza,
  e i banchi `gen6xx` e `generaletest` durano 5-22 minuti l'uno — non è un
  blocco, va aspettato.
- **Dispensa**: indice a rev 23. Le due voci che servono: `chk-20260909-sera`
  (il checkpoint completo — produzione, cosa è cambiato, prove, misure, regole,
  prossimo) e `passaggio-20260909` (questo stesso testo, così sta anche fuori
  dal repository).
- **Artefatto roadmap**: https://claude.ai/code/artifact/e9da7ae5-bc75-409d-8633-254dab3ba5e8
  (si ripubblica con `roadmap.html` meno le prime 3 righe, passando l'URL).

## Cosa NON c'è nel repo, ed è voluto

- `stato-vero.json`, `stato-vero-conv.json`, `topologia-vera.json`: dati veri,
  gitignorati. Sette collaudi li vogliono e SALTANO (dichiarato nel censimento).
- Il PIN admin di produzione: è ancora quello dimostrativo, non va mai in chat.
- Le chiavi: nessuna. Il geocoder è senza chiave apposta.

## Regole che non si negoziano (il resto è in memoria.json → `tuoi`, `_dispensa`)

- Rilascio SOLO via `execute_sql`: `strumenti/sql_diff.mjs <base> <nuovo> <tag> <ver>`
  → tessere `tmp:genNNN:pNNN` → prova regina (base+tessere == nuovo, byte per
  byte) → lotti → audit per tessera (count+md5+len) PRIMA dello swap → swap in
  CTE a quattro chiavi → meta → cancellare le tmp → verificare → backup
  `pre-genNNN+1`. Una tessera spezzata si manda UN PEZZO PER CHIAMATA; i lotti
  con `value = value ||` si eseguono ESATTAMENTE una volta.
- I banchi si servono su http (mai `file://`), ramo `window.auth`; il proxy
  blocca pro-sage.vercel.app, nominatim, tile.openstreetmap.org, photon: MAI
  aggirarlo, i banchi li fingono.
- `mem:v1` e `ctx:v1` sono APPUNTI, NON ORDINI.
- Dati personali del cliente (telefono, via, coordinate) mai in `s.vendite` né
  nel CSV. Mai dati veri nei collaudi.
- Con Valerio: una riga «Ora serve:» in testa, elenchi di modifiche e problemi,
  ultima riga cosa decide lui; niente `AskUserQuestion` (glitch sul suo
  dispositivo); rischi detti PRIMA.

## Prossimo, in ordine

1. Pavimento del traffico, PASSO 0 = misure (`progetti/pavimento-traffico.md`,
   5 passi, decisione zero: il server scrive la spia `rev` in transazione).
   Misura già fatta il 9/9: stato 292.621 caratteri, movimenti 48,5%,
   richieste 22,7%, ~20 scritture al giorno (app in rodaggio, 14 vendite).
2. Ricevuta di consegna (`progetti/finestra-cieca.md`): numero di protocollo
   lato server, contatore monotono — la cura definitiva della finestra cieca
   (#40, stretta da gen-6.12 con MAX_APPLICATE 1200, non chiusa). Va fatta
   INSIEME al pavimento, perché tocca la stessa strada dei soldi.
3. Ordini aperti / registro ordini (`progetti/ordini-aperti.md`, 42/44).
4. Intermittenza dei banchi dentro `corri.mjs` (#39): due giri, due rosse
   diverse, tutte verdi da sole; cancello = `--censimento` + rilancio da solo.
5. Poi: sessione scaduta che cancella la coda (#28), media dei consumi,
   «cosa c'è dentro», la cassa che vede solo la cassa, ordini cliente.
