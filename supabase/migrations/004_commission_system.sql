-- ============================================================
-- Migration 004: Sistema de Comissionamento por Colaborador
-- ============================================================

-- 1. commission_config no colaborador
--    formato: { "type": "percentage"|"fixed", "value": 10 }
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS commission_config JSONB DEFAULT NULL;

-- 2. Tabela de lotes de pagamento de comissão
--    (criada ANTES da FK em transactions)
CREATE TABLE IF NOT EXISTS commission_payouts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  total_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','pago','cancelado')),
  paid_at       TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commission_payouts_doctor_idx ON commission_payouts(doctor_id);
CREATE INDEX IF NOT EXISTS commission_payouts_status_idx ON commission_payouts(status);
CREATE INDEX IF NOT EXISTS commission_payouts_period_idx ON commission_payouts(period_start, period_end);

ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_commission_payouts" ON commission_payouts;
CREATE POLICY "allow_all_commission_payouts"
  ON commission_payouts FOR ALL USING (true) WITH CHECK (true);

-- trigger updated_at (reutiliza função se já existir)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_commission_payouts_updated ON commission_payouts;
CREATE TRIGGER trg_commission_payouts_updated
  BEFORE UPDATE ON commission_payouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Colunas de comissão em transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS commission_amount    NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS commission_status    TEXT          DEFAULT NULL
    CHECK (commission_status IN ('pendente','pago','cancelado')),
  ADD COLUMN IF NOT EXISTS commission_payout_id UUID          DEFAULT NULL
    REFERENCES commission_payouts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS transactions_commission_status_idx
  ON transactions(commission_status)
  WHERE commission_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS transactions_doctor_commission_idx
  ON transactions(doctor_id, date)
  WHERE commission_amount IS NOT NULL;

-- 4. Função: retorna valor de comissão para um colaborador + valor de venda
CREATE OR REPLACE FUNCTION calculate_commission(
  p_doctor_id UUID,
  p_amount    NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_config JSONB;
  v_type   TEXT;
  v_value  NUMERIC;
BEGIN
  SELECT commission_config
    INTO v_config
    FROM doctors
   WHERE id = p_doctor_id AND active = TRUE
   LIMIT 1;

  IF v_config IS NULL THEN
    RETURN NULL;
  END IF;

  v_type  := v_config->>'type';
  v_value := (v_config->>'value')::NUMERIC;

  IF v_value IS NULL OR v_value <= 0 THEN
    RETURN NULL;
  END IF;

  IF v_type = 'percentage' THEN
    RETURN ROUND((p_amount * v_value / 100.0), 2);
  ELSIF v_type = 'fixed' THEN
    RETURN ROUND(v_value, 2);
  END IF;

  RETURN NULL;
END;
$$;

-- 5. Trigger: recalcula comissão em INSERT/UPDATE de transactions
CREATE OR REPLACE FUNCTION trg_calc_commission_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_commission NUMERIC;
BEGIN
  -- Só receitas com doctor_id participam de comissão
  IF NEW.type <> 'receita' OR NEW.doctor_id IS NULL THEN
    NEW.commission_amount    := NULL;
    NEW.commission_status    := NULL;
    RETURN NEW;
  END IF;

  -- Cancelamento → anula comissão (não apaga se já estava pago)
  IF NEW.status = 'cancelado' THEN
    IF OLD IS NULL OR OLD.commission_status <> 'pago' THEN
      NEW.commission_amount    := NULL;
      NEW.commission_status    := 'cancelado';
    END IF;
    RETURN NEW;
  END IF;

  -- Calcula valor
  v_commission := calculate_commission(NEW.doctor_id, NEW.amount);

  IF v_commission IS NOT NULL THEN
    NEW.commission_amount := v_commission;
    -- Preserva 'pago' em re-saves; apenas inicializa quando NULL/cancelado
    IF NEW.commission_status IS NULL OR NEW.commission_status = 'cancelado' THEN
      NEW.commission_status := 'pendente';
    END IF;
  ELSE
    NEW.commission_amount := NULL;
    NEW.commission_status := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_commission ON transactions;
CREATE TRIGGER trg_calc_commission
  BEFORE INSERT OR UPDATE OF amount, status, doctor_id ON transactions
  FOR EACH ROW EXECUTE FUNCTION trg_calc_commission_fn();

-- 6. View de resumo de comissões por colaborador
CREATE OR REPLACE VIEW v_commission_summary AS
SELECT
  d.id                             AS doctor_id,
  d.name                           AS doctor_name,
  d.specialty,
  d.role,
  d.commission_config,
  COUNT(t.id) FILTER (
    WHERE t.commission_amount IS NOT NULL
  )                                AS total_transactions,
  COALESCE(SUM(t.commission_amount) FILTER (
    WHERE t.commission_status = 'pendente'
  ), 0)                            AS pendente,
  COALESCE(SUM(t.commission_amount) FILTER (
    WHERE t.commission_status = 'pago'
  ), 0)                            AS pago,
  COALESCE(SUM(t.commission_amount) FILTER (
    WHERE t.commission_status = 'cancelado'
  ), 0)                            AS cancelado,
  COALESCE(SUM(t.commission_amount) FILTER (
    WHERE t.commission_amount IS NOT NULL
    AND  t.commission_status <> 'cancelado'
  ), 0)                            AS total_earned
FROM doctors d
LEFT JOIN transactions t
  ON  t.doctor_id = d.id
  AND t.type = 'receita'
  AND t.commission_amount IS NOT NULL
WHERE d.active = TRUE
GROUP BY d.id, d.name, d.specialty, d.role, d.commission_config;

-- 7. Recalcula comissões de transações existentes (retroativo, idempotente)
UPDATE transactions t
SET
  commission_amount    = calculate_commission(t.doctor_id, t.amount),
  commission_status    = CASE
    WHEN t.status = 'cancelado'
      THEN 'cancelado'
    WHEN calculate_commission(t.doctor_id, t.amount) IS NOT NULL
      THEN COALESCE(t.commission_status, 'pendente')
    ELSE NULL
  END
WHERE t.type     = 'receita'
  AND t.doctor_id IS NOT NULL;
