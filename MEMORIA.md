# Memoria di progetto — Supply Chain Pro

> Porta d'ingresso per una sessione nuova: viene letta all'avvio (la importa
> `CLAUDE.md`). Non sostituisce `PASSAGGIO.md`, `CLAUDE.md` di `supply-chain-pro`
> e la dispensa `ctx:v1:*`: li riassume e dice dove sono. Va aggiornata e **spinta**
> alla fine di ogni tappa. Massimo 6.000 caratteri.

## Stato adesso (aggiornato: 2026-09-15)
In produzione **gen-6.16 «Il guscio»** (12/09): Supabase `pxozltayynejrmartzzf`,
chiave `app:jsx:src`, 988.312 byte, md5 `cf97cfd7ced5c37f3d7d468d9486d5bb`.
L'app in cucina è sana. **ATTENZIONE**: la rete di sicurezza — collaudi `gen6*.mjs`,
`memoria.json`, `roadmap.md`, `PASSAGGIO.md`, `progetti/` — **non è su GitHub**: vive
solo nel container della sessione «Supply Chain Pro ripresa lavoro» (ramo
`claude/supply-chain-pro-resume-e2864o`, mai spinto). Prima di qualunque lavoro:
spingerla.

## Dove sta il lavoro
- codice vero: Supabase `pxozltayynejrmartzzf`, `kv_store` → `app:jsx:src`,
  `app:jsx:meta`, backup `backup:pre-gen<N>`. Si scrive **solo** via SQL (MCP).
- online: https://supply-chain-pro-sage.vercel.app/ (micro-loader Vercel che compila
  il JSX nel browser)
- repository (indietro): `supply-chain-pro` = Gen 4.2 + CLAUDE.md (17 KB) + docs;
  `supply-chain-pro-site/app/app.jsx` = 633.933 byte (dovrebbe essere la base
  congelata identica alla produzione, e non lo è)
- dispensa: chiavi `ctx:v1:*` in `kv_store` — checkpoint giornalieri
  (`chk-AAAAMMGG`), `passaggio-20260909`, `piano-ordini`, `dec-ordini-aperti`;
  `mem:v1` = Gestione › Memoria dentro l'app
- rami aperti: `claude/supply-chain-pro-resume-e2864o` (solo nel container!)

## Decisioni prese (e perché)
- 2026-09-12 — il guscio di `entra()` si marca `__guscio` e la guardia rifiuta una
  base marcata *dopo* la scelta della base; `leggiRemoto` non si tocca (chk-20260912).
- 2026-09-12 — il `> 1` della guardia della rev **resta**: uno stato appena seminato
  ha rev 1; con `> 0` un'installazione nuova non nascerebbe mai.
- 2026-09-09 — cura definitiva al doppio conteggio = ricevuta di consegna con
  protocollo del server; nel frattempo `MAX_APPLICATE` 1200 (finestra stretta, non chiusa).
- regola del caricatore (CONSEGNA.md): `meta.len` = `src.length` in JavaScript, zero
  caratteri astrali, backup `pre-gen<N>` prima di ogni rilascio.

## In sospeso — domande per chi decide
- 5 domande di design (sessione del 13/09): tocco/scorrimento in cassa, categorie,
  ordinamento, pulsanti di gruppo, schermata multi-sezione. I disegni stanno in
  quella sessione: rispondere lì, poi riportare qui l'esito.
- Dalla lista «Aspetto te» della roadmap: ricarica di tutti i telefoni prima di
  accendere cassa e comande · postazioni · listino · spunta «Può battere in cassa» ·
  magazzino di cassa · bip in cucina sì/no · quanti scontrini al giorno (sopra ~50
  prima il pavimento del traffico) · cambiare il PIN admin.

## Prossimi passi, in ordine
0. Spingere il lavoro dell'altra sessione su un ramo dedicato (vedi Stato).
1. Ricevuta di consegna (`progetti/finestra-cieca.md`) — tutta client, chiude la
   finestra cieca #40.
2. Pavimento vero, PASSO 2 = tessera SQL su `app_kv_set.sql` — di lunedì mattina,
   tessera di ritorno scritta insieme, **prima mostrare il piano a Valerio**.
3. #28 (sessione scaduta che cancella la coda), #22, #20, #23, #18 — dettagli in
   `roadmap.md` (non ancora su GitHub).

## Vincoli che non si toccano
- Niente in produzione senza `backup:pre-gen<N>`, `len` e md5 verificati; mai
  caratteri astrali.
- Collaudo scritto **prima** del codice: rossi registrati sulla versione online, poi
  verdi; sabotaggi contati; censimento completo a ogni rilascio.
- I documenti si chiudono **prima** del censimento (`memoriatest` li confronta).
- Il rilascio è solo via SQL; il repository tiene la base congelata `app/app.jsx`
  identica al byte alla produzione.
- Il contratto completo è in `PASSAGGIO.md` e nel `CLAUDE.md` di `supply-chain-pro`:
  leggerli prima di toccare qualsiasi cosa.

## Diario (le ultime dieci righe, la più recente in alto)
- 2026-09-15 · creata questa memoria da un'altra sessione (Agent Office) leggendo
  dispensa e repository; scoperto che la rete di sicurezza non è su GitHub
- 2026-09-12 · gen-6.16 «Il guscio» online (checkpoint `chk-20260912`)
- 2026-09-11 · gen-6.15 «Le spie che mancano» online
