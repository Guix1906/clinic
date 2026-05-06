-- ============================================================
-- Migration 003: Controle de acesso por secretária
-- ============================================================

-- 1. Adiciona 'secretaria' ao check de roles
alter table doctors
  drop constraint if exists doctors_role_check;

alter table doctors
  add constraint doctors_role_check
  check (role in ('admin','medico','recepcionista','enfermeiro','secretaria'));

-- 2. Tabela de vínculo secretária ↔ médico (N:M)
create table if not exists secretary_doctors (
  secretary_id  uuid not null references doctors(id) on delete cascade,
  doctor_id     uuid not null references doctors(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (secretary_id, doctor_id)
);

create index if not exists secretary_doctors_sec_idx on secretary_doctors(secretary_id);
create index if not exists secretary_doctors_doc_idx on secretary_doctors(doctor_id);

alter table secretary_doctors enable row level security;

drop policy if exists "allow_all_secretary_doctors" on secretary_doctors;
create policy "allow_all_secretary_doctors"
  on secretary_doctors for all using (true) with check (true);

-- 3. Função: retorna IDs de médicos que o usuário logado pode ver
--    - admin/medico sem vínculo → vê todos
--    - secretaria → só os médicos vinculados
create or replace function get_allowed_doctor_ids()
returns setof uuid
language plpgsql security definer
as $$
declare
  v_doctor_id uuid;
  v_role      text;
begin
  -- Descobre o doctor row do usuário logado
  select id, role
    into v_doctor_id, v_role
    from doctors
   where auth_id = auth.uid()
   limit 1;

  if v_doctor_id is null then
    -- Sem cadastro de doctor: não acessa nada
    return;
  end if;

  if v_role in ('admin', 'medico', 'recepcionista', 'enfermeiro') then
    -- Acesso total: retorna todos os médicos ativos
    return query select id from doctors where active = true;
  else
    -- secretaria: retorna apenas médicos vinculados
    return query
      select doctor_id
        from secretary_doctors
       where secretary_id = v_doctor_id;
  end if;
end;
$$;

-- 4. RLS policies granulares para appointments
drop policy if exists "allow_all_appointments" on appointments;

-- SELECT: médico vê seus próprios; secretaria vê dos vinculados; admin vê todos
create policy "appointments_select"
  on appointments for select
  using (
    doctor_id in (select get_allowed_doctor_ids())
  );

-- INSERT: secretaria só cria para médicos vinculados
create policy "appointments_insert"
  on appointments for insert
  with check (
    doctor_id in (select get_allowed_doctor_ids())
  );

-- UPDATE: mesmo critério
create policy "appointments_update"
  on appointments for update
  using (
    doctor_id in (select get_allowed_doctor_ids())
  );

-- DELETE: mesmo critério
create policy "appointments_delete"
  on appointments for delete
  using (
    doctor_id in (select get_allowed_doctor_ids())
  );

-- 5. RLS policies para medical_records (mesma lógica)
drop policy if exists "allow_all_medical_records" on medical_records;

create policy "medical_records_select"
  on medical_records for select
  using (
    doctor_id in (select get_allowed_doctor_ids())
    or doctor_id is null
  );

create policy "medical_records_insert"
  on medical_records for insert
  with check (
    doctor_id in (select get_allowed_doctor_ids())
    or doctor_id is null
  );

create policy "medical_records_update"
  on medical_records for update
  using (
    doctor_id in (select get_allowed_doctor_ids())
    or doctor_id is null
  );

create policy "medical_records_delete"
  on medical_records for delete
  using (
    doctor_id in (select get_allowed_doctor_ids())
    or doctor_id is null
  );

-- 6. Doctors: secretária pode ver todos os médicos (para saber nomes), mas não editar
drop policy if exists "allow_all_doctors" on doctors;

create policy "doctors_select"
  on doctors for select
  using (true);  -- todos podem listar médicos (necessário para UI)

create policy "doctors_insert"
  on doctors for insert
  with check (
    -- só admin pode criar
    exists (
      select 1 from doctors d
       where d.auth_id = auth.uid()
         and d.role = 'admin'
    )
  );

create policy "doctors_update"
  on doctors for update
  using (
    auth_id = auth.uid()  -- próprio usuário
    or exists (
      select 1 from doctors d
       where d.auth_id = auth.uid()
         and d.role = 'admin'
    )
  );

create policy "doctors_delete"
  on doctors for delete
  using (
    exists (
      select 1 from doctors d
       where d.auth_id = auth.uid()
         and d.role = 'admin'
    )
  );
