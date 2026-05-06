-- ============================================================
-- MedFlow — Migration 002: campos faltantes + modelos de prescrição
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Adiciona coluna medications em medical_records (anamnese)
alter table medical_records
  add column if not exists medications text;

-- 2. Tabela de modelos de prescrição
create table if not exists prescription_models (
  id         uuid primary key default uuid_generate_v4(),
  doctor_id  uuid references doctors(id) on delete cascade,
  name       text not null,
  items      jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists prescription_models_doctor_idx on prescription_models(doctor_id);

alter table prescription_models enable row level security;
drop policy if exists "allow_all_prescription_models" on prescription_models;
create policy "allow_all_prescription_models"
  on prescription_models for all using (true) with check (true);

-- 3. Adiciona coluna phone ao doctors (para exibição no perfil)
alter table doctors
  add column if not exists phone text;

-- 4. Índice para busca de pacientes por nome
create index if not exists patients_name_idx on patients(lower(name));
