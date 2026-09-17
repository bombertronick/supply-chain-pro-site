CREATE OR REPLACE FUNCTION public.app_kv_set(p_token uuid, p_key text, p_value text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_atteso numeric;
  v_ora    numeric;
  v_c_e    boolean := false;
  v_rev    numeric;   -- la rev del payload, per la spia (NULL = la spia non si tocca) [PASSO 2]
BEGIN
  IF public.app_sess_valida(p_token) IS NOT TRUE THEN RETURN json_build_object('error','auth'); END IF;

  -- Compare-and-swap, SOLO sulla chiave dello stato condiviso (gen-5.80). IL CANCELLO
  -- QUI SOTTO NON CAMBIA di una riga rispetto alla produzione: il PASSO 2 aggiunge la
  -- spia (dopo l'INSERT) e il ramo diretto monotono, non tocca la regola del conflitto.
  IF p_key = 'scp:stato:v1' THEN
    -- [PASSO 2] LA RIPARAZIONE DEL NUL, E SOLO SU UN PAYLOAD GIA' ROTTO. JSON.stringify di una
    -- stringa che contiene il carattere U+0000 mette nel testo l'escape di sei caratteri
    -- (barra-u-zero-zero-zero-zero), e ::jsonb lo RIFIUTA: se entrasse nello stato, il cast qui
    -- sotto solleverebbe, v_atteso resterebbe NULL e il cancello si spegnerebbe per TUTTI.
    -- Si prova PRIMA il cast pulito e si ripara SOLO se ha fallito: cosi' un testo valido che
    -- contiene per davvero le sei lettere barra-u-zero-zero-zero-zero (dove la barra e' a sua
    -- volta escapata) passa al primo colpo e NON viene mai toccato. Con la replace fatta sempre,
    -- quel testo valido veniva alterato in silenzio: difetto trovato dalla demolizione.
    BEGIN
      v_atteso := (p_value::jsonb ->> 'revBase')::numeric;
    EXCEPTION WHEN others THEN
      p_value := replace(p_value, chr(92) || 'u0000', chr(92) || 'ufffd');
      BEGIN
        v_atteso := (p_value::jsonb ->> 'revBase')::numeric;
      EXCEPTION WHEN others THEN v_atteso := NULL;
      END;
    END;
    IF v_atteso IS NOT NULL THEN
      -- [PASSO 2] MODIFICA 1 — IL LUCCHETTO SI PRENDE PRIMA E FUORI DAL BLOCCO CON L'EXCEPTION.
      -- Misurato su Postgres vero, due casse con token DIVERSI e stato corrotto in rete: con il
      -- lucchetto preso DENTRO il blocco, il rollback della sottotransazione (lo fa scattare il
      -- cast sul valore illeggibile) lo RILASCIA, il cancello si spegne per tutte e due e passano
      -- entrambe — 98 vendite perse su 100. Con il lucchetto qui fuori, la seconda cassa aspetta,
      -- rilegge il valore che la prima ha appena riparato e riceve il 40001: 0 su 100.
      -- Il cast resta guardato e in caduta aperta (fail-open), ma ora SOTTO LUCCHETTO: un valore
      -- corrotto continua a non murare nessuno (la prima scrittura passa e ripara), e smette di
      -- aprire una gara. Il vecchio «40 gare su 40 identiche» era un artefatto del banco, che
      -- faceva correre le due casse sullo STESSO token: a metterle in fila era il lucchetto
      -- della riga di sessione di app_sess_valida, non il cancello.
      SELECT true INTO v_c_e FROM public.kv_store WHERE key = p_key FOR UPDATE;
      v_c_e := coalesce(v_c_e, false);
      IF v_c_e THEN
        BEGIN
          SELECT (value::jsonb ->> 'rev')::numeric INTO v_ora
            FROM public.kv_store WHERE key = p_key;
        EXCEPTION WHEN others THEN v_c_e := false; v_ora := NULL;
        END;
      END IF;
      IF v_c_e AND coalesce(v_ora, 0) <> v_atteso THEN
        RAISE EXCEPTION 'conflitto: in rete c''e'' la revisione %, questa scrittura parte dalla %',
          coalesce(v_ora, 0), v_atteso USING ERRCODE = '40001';
      END IF;
    END IF;
  END IF;

  -- [PASSO 2] MODIFICA 3 — LA SCRITTURA DIRETTA DELLA SPIA passa solo se SALE. E' la riga che
  -- il client scrive ancora dal suo lato (app.jsx) finche' non esce il PASSO 3, ed e' una gara
  -- fra due telefoni che atterrano fuori ordine e fra un ciclo sorpassato e uno nuovo. UN SOLO
  -- statement, quindi ATOMICO: l'ON CONFLICT prende il lucchetto e il WHERE guarda il valore
  -- CORRENTE della riga, non una fotografia. Solo CIFRE in arrivo (regex, non ::numeric, che
  -- accetta 'NaN'/'Infinity' e in Postgres NaN e' MAGGIORE di tutto: una spia 'NaN' murerebbe
  -- la chiave per sempre). Il CASE ripara il valore in rete non numerico (fail-open). Qualunque
  -- esito risponde {ok:true}: il client la manda in un catch vuoto e non deve vedere errori.
  IF p_key = 'scp:rev:v1' THEN
    IF p_value ~ '^[0-9]{1,30}$' THEN
      INSERT INTO public.kv_store(key, value) VALUES (p_key, p_value)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
        WHERE (CASE WHEN kv_store.value ~ '^[0-9]{1,30}$' THEN kv_store.value::numeric END) IS NULL
           OR EXCLUDED.value::numeric > (CASE WHEN kv_store.value ~ '^[0-9]{1,30}$' THEN kv_store.value::numeric END);
    END IF;
    RETURN json_build_object('ok', true);
  END IF;

  INSERT INTO public.kv_store(key, value) VALUES (p_key, p_value)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

  -- [PASSO 2] MODIFICA 2 — LA SPIA LA SCRIVE IL SERVER, nella stessa transazione dello stato
  -- (o passano tutte e due o nessuna) e NON MONOTONA: lo stato ha appena passato il cancello ed
  -- e' la verita', quindi la spia lo SEGUE, anche in giu'. Dopo un ripristino a mano o un
  -- ri-seed che riporta la rev indietro, la prima scrittura riallinea la spia; se qui fosse
  -- monotona, un seed a rev 1 sopra una spia a 1785… la lascerebbe alta PER SEMPRE e ogni
  -- telefono scaricherebbe lo stato intero a ogni giro (una rev che sale di uno non raggiunge
  -- mai 1,78e15). Il cast e' guardato: uno stato senza rev leggibile non tocca la spia.
  IF p_key = 'scp:stato:v1' THEN
    BEGIN
      v_rev := (p_value::jsonb ->> 'rev')::numeric;
    EXCEPTION WHEN others THEN v_rev := NULL;
    END;
    IF v_rev IS NOT NULL THEN
      INSERT INTO public.kv_store(key, value) VALUES ('scp:rev:v1', v_rev::text)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
    END IF;
  END IF;
  RETURN json_build_object('ok', true);
END $function$
