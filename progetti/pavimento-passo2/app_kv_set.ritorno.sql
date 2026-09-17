-- ─────────────────────────────────────────────────────────────────────────
-- app_kv_set — LA TESSERA DI RITORNO: il testo che gira in produzione
-- PRIMA del PASSO 2, byte per byte, letto con pg_get_functiondef il
-- 17 settembre 2026 (md5 4e43d3be9cf2227b62baa090c9b5482a, 1744 caratteri).
--
-- Si rimette con un CREATE OR REPLACE, e dopo averlo rimesso
-- md5(pg_get_functiondef(public.app_kv_set::regproc)) deve tornare a
-- quel numero: e il cancello del ritorno. Il file app_kv_set.sql accanto e
-- la tessera NUOVA (il PASSO 2); questo e il vecchio, tenuto intero e non
-- ricostruito a memoria — la versione «di 71 righe» che il disegno diceva di
-- rimettere aveva gli stessi statement ma commenti diversi dentro il corpo,
-- e un ritorno che non combacia col cancello non e un ritorno.
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

  -- Compare-and-swap, SOLO sulla chiave dello stato condiviso.
  -- Chi scrive dichiara in revBase da quale revisione e' partito: se in rete
  -- c'e' ancora quella, la scrittura passa; se si e' mossa, ha salvato un
  -- altro nel frattempo e questa scrittura viene rifiutata (il client
  -- rilegge, riapplica la sua coda sulla base nuova e riprova).
  -- Un client che non dichiara revBase (versione vecchia ancora aperta su un
  -- telefono durante il passaggio) scrive come prima: nessuno resta fuori.
  IF p_key = 'scp:stato:v1' THEN
    BEGIN
      v_atteso := (p_value::jsonb ->> 'revBase')::numeric;
    EXCEPTION WHEN others THEN v_atteso := NULL;
    END;
    IF v_atteso IS NOT NULL THEN
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
END $function$
