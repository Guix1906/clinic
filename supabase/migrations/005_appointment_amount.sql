-- Migration 005: Valor financeiro no agendamento
-- Permite registrar o valor dos procedimentos no agendamento
-- e lançar automaticamente como receita ao finalizar o atendimento.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) DEFAULT NULL;

COMMENT ON COLUMN appointments.amount IS
  'Valor total dos procedimentos do agendamento. Lançado como receita em transactions ao finalizar o atendimento.';
