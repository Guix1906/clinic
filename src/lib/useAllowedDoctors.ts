'use client';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export type DoctorRef = { id: string; name: string; specialty: string | null };

export type AccessProfile = {
  role: 'admin' | 'medico' | 'secretaria' | 'recepcionista' | 'enfermeiro';
  selfId: string;          // doctor.id do usuário logado
  allowedDoctorIds: string[];  // IDs que pode ver/editar
  allowedDoctors: DoctorRef[]; // objetos completos para exibição
  isRestricted: boolean;   // true = secretaria com lista limitada
  loading: boolean;
};

const OPEN_ROLES = ['admin', 'medico', 'recepcionista', 'enfermeiro'];

export function useAllowedDoctors(): AccessProfile {
  const [profile, setProfile] = useState<AccessProfile>({
    role: 'medico',
    selfId: '',
    allowedDoctorIds: [],
    allowedDoctors: [],
    isRestricted: false,
    loading: true,
  });

  useEffect(() => {
    async function load() {
      // Dispara auth + busca do próprio médico em paralelo usando sessão cacheada
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setProfile(p => ({ ...p, loading: false })); return; }

      // Busca registro + lista de todos em paralelo (2 calls simultâneas em vez de sequenciais)
      const [{ data: me }, { data: all }] = await Promise.all([
        supabase.from('doctors').select('id, role, name, specialty').eq('auth_id', user.id).single(),
        supabase.from('doctors').select('id, name, specialty').eq('active', true).order('name'),
      ]);

      if (!me) { setProfile(p => ({ ...p, loading: false })); return; }

      const isRestricted = me.role === 'secretaria';

      if (!isRestricted) {
        const docs = (all ?? []) as DoctorRef[];
        setProfile({
          role: me.role as AccessProfile['role'],
          selfId: me.id,
          allowedDoctorIds: docs.map(d => d.id),
          allowedDoctors: docs,
          isRestricted: false,
          loading: false,
        });
      } else {
        // Secretaria: busca apenas médicos vinculados
        const { data: links } = await supabase
          .from('secretary_doctors')
          .select('doctor_id, doctors!doctor_id(id, name, specialty)')
          .eq('secretary_id', me.id);

        const docs: DoctorRef[] = (links ?? []).map((l: any) => ({
          id: l.doctor_id,
          name: l.doctors?.name ?? '',
          specialty: l.doctors?.specialty ?? null,
        }));

        setProfile({
          role: 'secretaria',
          selfId: me.id,
          allowedDoctorIds: docs.map(d => d.id),
          allowedDoctors: docs,
          isRestricted: true,
          loading: false,
        });
      }
    }

    load();
  }, []);

  return profile;
}

/** Filtra uma query do Supabase pelos IDs permitidos.
 *  Aceita qualquer etapa da chain (QueryBuilder ou FilterBuilder). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyDoctorFilter<T extends { in: (...a: any[]) => any; eq: (...a: any[]) => any }>(
  query: T,
  allowedDoctorIds: string[],
  column = 'doctor_id'
): T {
  if (allowedDoctorIds.length === 0) {
    return query.eq(column, '00000000-0000-0000-0000-000000000000') as T;
  }
  return query.in(column, allowedDoctorIds) as T;
}
