-- ============================================================
-- MedFlow — Schema completo
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────
-- 1. PROFISSIONAIS (médicos / usuários do sistema)
-- ──────────────────────────────────────────────────────────
create table if not exists doctors (
  id          uuid primary key default uuid_generate_v4(),
  auth_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  email       text unique not null,
  specialty   text,
  crm         text,
  role        text not null default 'medico' check (role in ('admin','medico','recepcionista','enfermeiro')),
  avatar_url  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- 2. PACIENTES
-- ──────────────────────────────────────────────────────────
create table if not exists patients (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  email           text,
  phone           text,
  cpf             text unique,
  birth_date      date,
  gender          text check (gender in ('M','F','outro')),
  blood_type      text,
  insurance       text default 'Particular',
  insurance_number text,
  address         text,
  city            text,
  state           text,
  zip_code        text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  notes           text,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- 3. AGENDAMENTOS
-- ──────────────────────────────────────────────────────────
create table if not exists appointments (
  id            uuid primary key default uuid_generate_v4(),
  patient_id    uuid not null references patients(id) on delete cascade,
  doctor_id     uuid not null references doctors(id) on delete cascade,
  date          date not null,
  start_time    time not null,
  end_time      time not null,
  type          text not null default 'consulta' check (type in ('consulta','retorno','primeira_consulta','avaliacao','exame','procedimento','teleconsulta')),
  status        text not null default 'agendado' check (status in ('agendado','confirmado','aguardando','em_atendimento','concluido','faltou','cancelado')),
  notes         text,
  insurance     text,
  online        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists appointments_date_idx       on appointments(date);
create index if not exists appointments_doctor_id_idx  on appointments(doctor_id);
create index if not exists appointments_patient_id_idx on appointments(patient_id);

-- ──────────────────────────────────────────────────────────
-- 4. PRONTUÁRIOS
-- ──────────────────────────────────────────────────────────
create table if not exists medical_records (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references patients(id) on delete cascade,
  doctor_id       uuid references doctors(id) on delete set null,
  appointment_id  uuid references appointments(id) on delete set null,
  -- Anamnese
  clinical_history   text,
  surgical_history   text,
  family_history     text,
  habits             text,
  allergies          text,
  -- Consulta
  complaint          text,
  evolution          text,
  diagnosis          text,
  diagnosis_code     text,
  conduct            text,
  -- Retorno
  return_date        date,
  return_notes       text,
  -- Tempos
  started_at         timestamptz,
  finished_at        timestamptz,
  duration_seconds   int,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists medical_records_patient_idx on medical_records(patient_id);

-- ──────────────────────────────────────────────────────────
-- 5. PRESCRIÇÕES
-- ──────────────────────────────────────────────────────────
create table if not exists prescriptions (
  id                uuid primary key default uuid_generate_v4(),
  medical_record_id uuid references medical_records(id) on delete cascade,
  patient_id        uuid not null references patients(id) on delete cascade,
  doctor_id         uuid references doctors(id) on delete set null,
  medication        text not null,
  dosage            text,
  frequency         text,
  duration          text,
  instructions      text,
  created_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- 6. TAGS DE PACIENTE
-- ──────────────────────────────────────────────────────────
create table if not exists patient_tags (
  id         uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  label      text not null,
  color      text default '#0066D0',
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- 7. TRANSAÇÕES FINANCEIRAS
-- ──────────────────────────────────────────────────────────
create table if not exists transactions (
  id           uuid primary key default uuid_generate_v4(),
  type         text not null check (type in ('receita','despesa','transferencia')),
  amount       numeric(12,2) not null,
  category     text,
  description  text,
  date         date not null default current_date,
  status       text not null default 'pendente' check (status in ('pendente','concluido','cancelado')),
  patient_id   uuid references patients(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  doctor_id    uuid references doctors(id) on delete set null,
  payment_method text check (payment_method in ('dinheiro','cartao_credito','cartao_debito','pix','transferencia','convenio','boleto')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists transactions_date_idx  on transactions(date);
create index if not exists transactions_type_idx  on transactions(type);

-- ──────────────────────────────────────────────────────────
-- 8. ESTOQUE
-- ──────────────────────────────────────────────────────────
create table if not exists inventory_items (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  code           text unique,
  category       text check (category in ('medicamento','epi','higiene','material_medico','equipamento','outro')),
  quantity       int not null default 0,
  unit           text default 'un',
  min_quantity   int not null default 0,
  expiry_date    date,
  supplier       text,
  unit_cost      numeric(10,2),
  location       text,
  notes          text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- 9. MOVIMENTAÇÕES DE ESTOQUE
-- ──────────────────────────────────────────────────────────
create table if not exists inventory_movements (
  id         uuid primary key default uuid_generate_v4(),
  item_id    uuid not null references inventory_items(id) on delete cascade,
  type       text not null check (type in ('entrada','saida','ajuste')),
  quantity   int not null,
  reason     text,
  doctor_id  uuid references doctors(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_item_idx on inventory_movements(item_id);

-- ──────────────────────────────────────────────────────────
-- 10. NOTIFICAÇÕES
-- ──────────────────────────────────────────────────────────
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  doctor_id  uuid references doctors(id) on delete cascade,
  type       text not null check (type in ('agendamento','lembrete','estoque','financeiro','sistema')),
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- 11. LISTA DE ESPERA
-- ──────────────────────────────────────────────────────────
create table if not exists waitlist (
  id           uuid primary key default uuid_generate_v4(),
  patient_id   uuid not null references patients(id) on delete cascade,
  doctor_id    uuid references doctors(id) on delete set null,
  requested_at date not null default current_date,
  preferred_period text check (preferred_period in ('manha','tarde','noite','qualquer')),
  notes        text,
  status       text not null default 'aguardando' check (status in ('aguardando','agendado','cancelado')),
  created_at   timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- TRIGGERS: updated_at automático
-- ──────────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ declare
  t text;
begin
  foreach t in array array['doctors','patients','appointments','medical_records','inventory_items','transactions'] loop
    execute format(
      'create trigger trg_%I_updated_at before update on %I for each row execute function update_updated_at()',
      t, t
    );
  end loop;
exception when duplicate_object then null;
end $$;

-- ──────────────────────────────────────────────────────────
-- RLS: habilitar em todas as tabelas
-- ──────────────────────────────────────────────────────────
alter table doctors             enable row level security;
alter table patients            enable row level security;
alter table appointments        enable row level security;
alter table medical_records     enable row level security;
alter table prescriptions       enable row level security;
alter table patient_tags        enable row level security;
alter table transactions        enable row level security;
alter table inventory_items     enable row level security;
alter table inventory_movements enable row level security;
alter table notifications       enable row level security;
alter table waitlist            enable row level security;

-- Políticas temporárias (abertas) — ajuste conforme autenticação
create policy "allow_all_doctors"             on doctors             for all using (true) with check (true);
create policy "allow_all_patients"            on patients            for all using (true) with check (true);
create policy "allow_all_appointments"        on appointments        for all using (true) with check (true);
create policy "allow_all_medical_records"     on medical_records     for all using (true) with check (true);
create policy "allow_all_prescriptions"       on prescriptions       for all using (true) with check (true);
create policy "allow_all_patient_tags"        on patient_tags        for all using (true) with check (true);
create policy "allow_all_transactions"        on transactions        for all using (true) with check (true);
create policy "allow_all_inventory_items"     on inventory_items     for all using (true) with check (true);
create policy "allow_all_inventory_movements" on inventory_movements for all using (true) with check (true);
create policy "allow_all_notifications"       on notifications       for all using (true) with check (true);
create policy "allow_all_waitlist"            on waitlist            for all using (true) with check (true);

-- ──────────────────────────────────────────────────────────
-- DADOS INICIAIS (demo)
-- ──────────────────────────────────────────────────────────
insert into doctors (name, email, specialty, crm, role) values
  ('guilherme teixeira', 'gt@medflow.com', 'Clínica Geral', 'CRM-12345', 'admin')
on conflict (email) do nothing;

insert into patients (name, email, phone, birth_date, gender, insurance) values
  ('Maria Santos',   'maria@email.com',   '(11) 99001-0001', '1988-03-15', 'F', 'Particular'),
  ('João Oliveira',  'joao@email.com',    '(11) 99001-0002', '1975-07-22', 'M', 'Unimed'),
  ('Ana Lima',       'ana@email.com',     '(11) 99001-0003', '1995-11-05', 'F', 'Particular'),
  ('Ricardo Costa',  'ricardo@email.com', '(11) 99001-0004', '1980-01-30', 'M', 'Bradesco Saúde'),
  ('Paula Ferreira', 'paula@email.com',   '(11) 99001-0005', '1990-08-18', 'F', 'Particular')
on conflict do nothing;

insert into inventory_items (name, code, category, quantity, min_quantity) values
  ('Dipirona 500mg',   'MED-001', 'medicamento',    48,  10),
  ('Luvas P (cx 100)', 'EPI-002', 'epi',             5,  20),
  ('Álcool 70% 1L',    'HIG-003', 'higiene',        24,   8),
  ('Seringa 5ml',      'MED-004', 'material_medico',120, 50),
  ('Gaze estéril',     'MED-005', 'material_medico',  8, 30)
on conflict (code) do nothing;
