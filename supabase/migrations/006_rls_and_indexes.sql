-- ============================================================
-- Migration 006: RLS granular + índices compostos
-- ============================================================
-- Corrige:
--   SEC-1  — políticas "using (true)" restantes (acesso aberto)
--   SCALE-1 — índices compostos para queries frequentes
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- FUNÇÕES AUXILIARES
-- ──────────────────────────────────────────────────────────

-- Retorna o UUID do doctor row do usuário logado (NULL se não cadastrado)
CREATE OR REPLACE FUNCTION get_my_doctor_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM doctors WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- Retorna TRUE se o usuário logado é membro ativo da clínica
CREATE OR REPLACE FUNCTION is_clinic_member()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM doctors
    WHERE auth_id = auth.uid() AND active = TRUE
  );
$$;

-- ──────────────────────────────────────────────────────────
-- SEC-1: PATIENTS — exige autenticação, membro da clínica
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_patients" ON patients;

CREATE POLICY "patients_select"
  ON patients FOR SELECT
  USING (is_clinic_member());

CREATE POLICY "patients_insert"
  ON patients FOR INSERT
  WITH CHECK (is_clinic_member());

CREATE POLICY "patients_update"
  ON patients FOR UPDATE
  USING (is_clinic_member());

CREATE POLICY "patients_delete"
  ON patients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE auth_id = auth.uid() AND role IN ('admin','medico') AND active = TRUE
    )
  );

-- ──────────────────────────────────────────────────────────
-- SEC-1: TRANSACTIONS — membro da clínica; delete só admin
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_transactions" ON transactions;

CREATE POLICY "transactions_select"
  ON transactions FOR SELECT
  USING (is_clinic_member());

CREATE POLICY "transactions_insert"
  ON transactions FOR INSERT
  WITH CHECK (is_clinic_member());

CREATE POLICY "transactions_update"
  ON transactions FOR UPDATE
  USING (is_clinic_member());

CREATE POLICY "transactions_delete"
  ON transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE auth_id = auth.uid() AND role = 'admin' AND active = TRUE
    )
  );

-- ──────────────────────────────────────────────────────────
-- SEC-1: PRESCRIPTIONS — membro da clínica
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_prescriptions" ON prescriptions;

CREATE POLICY "prescriptions_select"
  ON prescriptions FOR SELECT
  USING (is_clinic_member());

CREATE POLICY "prescriptions_insert"
  ON prescriptions FOR INSERT
  WITH CHECK (is_clinic_member());

CREATE POLICY "prescriptions_update"
  ON prescriptions FOR UPDATE
  USING (is_clinic_member());

CREATE POLICY "prescriptions_delete"
  ON prescriptions FOR DELETE
  USING (is_clinic_member());

-- ──────────────────────────────────────────────────────────
-- SEC-1: PATIENT_TAGS — membro da clínica
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_patient_tags" ON patient_tags;

CREATE POLICY "patient_tags_select"
  ON patient_tags FOR SELECT
  USING (is_clinic_member());

CREATE POLICY "patient_tags_insert"
  ON patient_tags FOR INSERT
  WITH CHECK (is_clinic_member());

CREATE POLICY "patient_tags_delete"
  ON patient_tags FOR DELETE
  USING (is_clinic_member());

-- ──────────────────────────────────────────────────────────
-- SEC-1: INVENTORY_ITEMS — membro da clínica
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_inventory_items" ON inventory_items;

CREATE POLICY "inventory_items_select"
  ON inventory_items FOR SELECT
  USING (is_clinic_member());

CREATE POLICY "inventory_items_insert"
  ON inventory_items FOR INSERT
  WITH CHECK (is_clinic_member());

CREATE POLICY "inventory_items_update"
  ON inventory_items FOR UPDATE
  USING (is_clinic_member());

CREATE POLICY "inventory_items_delete"
  ON inventory_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE auth_id = auth.uid() AND role IN ('admin','medico') AND active = TRUE
    )
  );

-- ──────────────────────────────────────────────────────────
-- SEC-1: INVENTORY_MOVEMENTS — membro da clínica
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_inventory_movements" ON inventory_movements;

CREATE POLICY "inventory_movements_select"
  ON inventory_movements FOR SELECT
  USING (is_clinic_member());

CREATE POLICY "inventory_movements_insert"
  ON inventory_movements FOR INSERT
  WITH CHECK (is_clinic_member());

-- ──────────────────────────────────────────────────────────
-- SEC-1: NOTIFICATIONS — cada doctor vê só as suas
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_notifications" ON notifications;

CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  USING (
    doctor_id = get_my_doctor_id()
    OR EXISTS (
      SELECT 1 FROM doctors
      WHERE auth_id = auth.uid() AND role = 'admin' AND active = TRUE
    )
  );

CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  WITH CHECK (is_clinic_member());

CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  USING (
    doctor_id = get_my_doctor_id()
  );

CREATE POLICY "notifications_delete"
  ON notifications FOR DELETE
  USING (
    doctor_id = get_my_doctor_id()
  );

-- ──────────────────────────────────────────────────────────
-- SEC-1: WAITLIST — membro da clínica
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_waitlist" ON waitlist;

CREATE POLICY "waitlist_select"
  ON waitlist FOR SELECT
  USING (is_clinic_member());

CREATE POLICY "waitlist_insert"
  ON waitlist FOR INSERT
  WITH CHECK (is_clinic_member());

CREATE POLICY "waitlist_update"
  ON waitlist FOR UPDATE
  USING (is_clinic_member());

CREATE POLICY "waitlist_delete"
  ON waitlist FOR DELETE
  USING (is_clinic_member());

-- ──────────────────────────────────────────────────────────
-- SEC-1: SECRETARY_DOCTORS — política open → restringe a admins
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_secretary_doctors" ON secretary_doctors;

CREATE POLICY "secretary_doctors_select"
  ON secretary_doctors FOR SELECT
  USING (is_clinic_member());

CREATE POLICY "secretary_doctors_insert"
  ON secretary_doctors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE auth_id = auth.uid() AND role = 'admin' AND active = TRUE
    )
  );

CREATE POLICY "secretary_doctors_delete"
  ON secretary_doctors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE auth_id = auth.uid() AND role = 'admin' AND active = TRUE
    )
  );

-- ──────────────────────────────────────────────────────────
-- SEC-1: COMMISSION_PAYOUTS — admin gerencia, colaborador vê os seus
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all_commission_payouts" ON commission_payouts;

CREATE POLICY "commission_payouts_select"
  ON commission_payouts FOR SELECT
  USING (
    doctor_id = get_my_doctor_id()
    OR EXISTS (
      SELECT 1 FROM doctors
      WHERE auth_id = auth.uid() AND role = 'admin' AND active = TRUE
    )
  );

CREATE POLICY "commission_payouts_insert"
  ON commission_payouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE auth_id = auth.uid() AND role = 'admin' AND active = TRUE
    )
  );

CREATE POLICY "commission_payouts_update"
  ON commission_payouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE auth_id = auth.uid() AND role = 'admin' AND active = TRUE
    )
  );

-- ──────────────────────────────────────────────────────────
-- SCALE-1: ÍNDICES COMPOSTOS
-- ──────────────────────────────────────────────────────────

-- Habilita pg_trgm para buscas ILIKE eficientes (já ativo no Supabase por padrão)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice composto: filtro por data + médico (query principal da agenda)
CREATE INDEX IF NOT EXISTS appointments_date_doctor_idx
  ON appointments(date, doctor_id);

-- Índice composto: prontuários por paciente ordenados por data
CREATE INDEX IF NOT EXISTS medical_records_patient_date_idx
  ON medical_records(patient_id, created_at DESC);

-- Índice composto: transações por médico + data (relatórios financeiros)
CREATE INDEX IF NOT EXISTS transactions_doctor_date_idx
  ON transactions(doctor_id, date DESC);

-- Índice em appointments.status (filtros de status na agenda)
CREATE INDEX IF NOT EXISTS appointments_status_idx
  ON appointments(status);

-- Índice em patients.name para buscas textuais (suporte ao ILIKE)
CREATE INDEX IF NOT EXISTS patients_name_trgm_idx
  ON patients USING gin (name gin_trgm_ops);

-- Nota: o índice gin_trgm_ops requer pg_trgm; ativo por padrão no Supabase.
-- Se o Supabase retornar erro "operator class not found", comente a linha acima.
