-- ─────────────────────────────────────────────────────────────────────────
-- app_kv_set — la scrittura condivisa, con il cancello contro le
-- sovrascritture fra telefoni (gen-5.80, 4 agosto 2026).
--
-- PERCHE' QUESTO FILE ESISTE. Questa funzione vive nel database, non nel
-- sorgente dell'app: e' l'unico pezzo della correzione che non sta dentro
-- app.jsx. Se il database venisse ricostruito da zero senza di lei, il
-- client continuerebbe a mandare revBase e il server lo ignorerebbe — cioe'
-- si tornerebbe al difetto di prima SENZA che niente diventi rosso. Questa
-- e' esattamente la specie di regressione silenziosa che non si scopre
-- finche' non ha gia' fatto danno. Da qui si rimette com'e'.
--
-- COSA FA. Fra il momento in cui un telefono legge lo stato e quello in cui
-- lo riscrive passa un giro di rete. Se in quel mezzo secondo salva anche un
-- altro, prima il secondo arrivato riscriveva tutto sopra e il lavoro del
-- primo spariva. Adesso chi scrive dichiara in «revBase» da quale revisione
-- e' partito: la scrittura passa solo se in rete c'e' ancora quella.
-- Chi viene rifiutato non perde niente — la sua coda di modifiche non si
-- svuota mai prima della conferma, quindi si riapplica sulla base aggiornata.
--
-- DUE SCELTE DA SPIEGARE.
-- 1. Il cancello vale SOLO per 'scp:stato:v1'. Backup, indice dei punti di
--    ripristino e spia della revisione non hanno lettori concorrenti.
-- 2. Chi NON dichiara revBase scrive come prima. E' la versione vecchia
--    ancora aperta su un telefono durante il passaggio: bloccarla vorrebbe
--    dire lasciare qualcuno fuori a meta' turno. Resta il caso in cui una
--    versione vecchia sovrascriva una nuova, ed e' il motivo per cui dopo
--    un rilascio del genere va chiesto un giro di ricarica.
-- ─────────────────────────────────────────────────────────────────────────
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
BEGIN
  IF public.app_sess_valida(p_token) IS NOT TRUE THEN RETURN json_build_object('error','auth'); END IF;

  IF p_key = 'scp:stato:v1' THEN
    BEGIN
      v_atteso := (p_value::jsonb ->> 'revBase')::numeric;
    EXCEPTION WHEN others THEN v_atteso := NULL;
    END;
    IF v_atteso IS NOT NULL THEN
      -- FOR UPDATE: e' questo che rende atomico il leggi-controlla-scrivi.
      -- Senza, due chiamate contemporanee leggerebbero tutte e due la
      -- revisione vecchia e passerebbero tutte e due — cioe' il cancello
      -- ci sarebbe ma non terrebbe proprio nel caso per cui esiste.
      -- Il blocco con EXCEPTION apre la porta se il valore in rete non e'
      -- leggibile come JSON: meglio una scrittura in piu' che un'app
      -- bloccata per sempre da un dato corrotto.
      BEGIN
        SELECT true, (value::jsonb ->> 'rev')::numeric INTO v_c_e, v_ora
          FROM public.kv_store WHERE key = p_key FOR UPDATE;
      EXCEPTION WHEN others THEN v_c_e := false; v_ora := NULL;
      END;
      IF v_c_e AND coalesce(v_ora, 0) <> v_atteso THEN
        RAISE EXCEPTION 'conflitto: in rete c''e'' la revisione %, questa scrittura parte dalla %',
          coalesce(v_ora, 0), v_atteso USING ERRCODE = '40001';
      END IF;
    END IF;
  END IF;

  INSERT INTO public.kv_store(key, value) VALUES (p_key, p_value)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  RETURN json_build_object('ok', true);
END $function$;
