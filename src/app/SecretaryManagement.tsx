'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Doctor = { id: string; name: string; specialty: string | null; role: string };
type Link   = { secretary_id: string; doctor_id: string };

export default function SecretaryManagement() {
  const [secretaries, setSecretaries] = useState<Doctor[]>([]);
  const [doctors,     setDoctors]     = useState<Doctor[]>([]);
  const [links,       setLinks]       = useState<Link[]>([]);
  const [selected,    setSelected]    = useState<string>('');  // secretary id
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: all }, { data: lnk }] = await Promise.all([
      supabase.from('doctors').select('id,name,specialty,role').eq('active', true).order('name'),
      supabase.from('secretary_doctors').select('secretary_id,doctor_id'),
    ]);

    const all_ = (all ?? []) as Doctor[];
    setSecretaries(all_.filter(d => d.role === 'secretaria'));
    setDoctors(all_.filter(d => ['medico','admin'].includes(d.role)));
    setLinks((lnk ?? []) as Link[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const isLinked = (doctorId: string) =>
    links.some(l => l.secretary_id === selected && l.doctor_id === doctorId);

  const toggle = async (doctorId: string) => {
    if (!selected || saving) return;
    setSaving(true);

    if (isLinked(doctorId)) {
      await fetch('/api/secretary-doctors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretary_id: selected, doctor_id: doctorId }),
      });
      setLinks(prev => prev.filter(l => !(l.secretary_id === selected && l.doctor_id === doctorId)));
      showToast('Vínculo removido');
    } else {
      await fetch('/api/secretary-doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretary_id: selected, doctor_id: doctorId }),
      });
      setLinks(prev => [...prev, { secretary_id: selected, doctor_id: doctorId }]);
      showToast('Médico vinculado');
    }

    setSaving(false);
  };

  const selectedSec = secretaries.find(s => s.id === selected);
  const linkedCount = links.filter(l => l.secretary_id === selected).length;

  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', borderRadius: 8,
    border: '1px solid #E5E7EB', marginBottom: 6,
    background: '#fff', cursor: 'pointer',
    transition: 'all 0.15s',
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
      Carregando...
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 860, margin: '0 auto', fontFamily: 'inherit' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: '#10B981', color: '#fff',
          padding: '10px 18px', borderRadius: 10,
          fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 16px #00000033',
        }}>
          ✓ {toast}
        </div>
      )}

      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
        Controle de Acesso — Secretárias
      </h2>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
        Defina quais médicos cada secretária pode visualizar e gerenciar.
      </p>

      {secretaries.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', background: '#F9FAFB', borderRadius: 12, border: '1px dashed #E5E7EB' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👩‍💼</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Nenhuma secretária cadastrada</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
            Adicione um profissional com role = "secretaria" em Configurações → Equipe.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>

          {/* Coluna esquerda: lista de secretárias */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Secretárias
            </div>
            {secretaries.map(s => {
              const count = links.filter(l => l.secretary_id === s.id).length;
              const active = selected === s.id;
              return (
                <div key={s.id}
                  onClick={() => setSelected(s.id)}
                  style={{
                    ...row,
                    background: active ? '#EFF6FF' : '#fff',
                    borderColor: active ? '#BFDBFE' : '#E5E7EB',
                    boxShadow: active ? '0 0 0 2px #3B82F620' : 'none',
                  }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: active ? '#DBEAFE' : '#F3F4F6',
                    color: active ? '#2563EB' : '#6B7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {count} médico{count !== 1 ? 's' : ''} vinculado{count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coluna direita: médicos para vincular */}
          <div>
            {!selected ? (
              <div style={{ padding: 40, textAlign: 'center', background: '#F9FAFB', borderRadius: 12, border: '1px dashed #E5E7EB', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 28 }}>👈</div>
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>Selecione uma secretária para gerenciar os acessos</div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                      Médicos visíveis para {selectedSec?.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {linkedCount} de {doctors.length} vinculado{linkedCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {linkedCount < doctors.length && (
                    <button
                      onClick={async () => {
                        setSaving(true);
                        for (const d of doctors) {
                          if (!isLinked(d.id)) {
                            await fetch('/api/secretary-doctors', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ secretary_id: selected, doctor_id: d.id }),
                            });
                          }
                        }
                        await load();
                        setSaving(false);
                        showToast('Todos os médicos vinculados');
                      }}
                      style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      + Vincular todos
                    </button>
                  )}
                </div>

                {doctors.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    Nenhum médico cadastrado.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {doctors.map(d => {
                      const linked = isLinked(d.id);
                      return (
                        <div key={d.id}
                          onClick={() => toggle(d.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '11px 14px', cursor: saving ? 'wait' : 'pointer',
                            borderBottom: '1px solid #F3F4F6',
                            background: linked ? '#F0FDF4' : '#fff',
                            transition: 'background 0.15s',
                          }}>
                          {/* Toggle */}
                          <div style={{
                            width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                            background: linked ? '#10B981' : '#E5E7EB',
                            position: 'relative', transition: 'background 0.2s',
                          }}>
                            <div style={{
                              position: 'absolute', top: 3, borderRadius: '50%',
                              width: 16, height: 16, background: '#fff',
                              boxShadow: '0 1px 3px #00000033',
                              left: linked ? 21 : 3,
                              transition: 'left 0.2s',
                            }} />
                          </div>

                          {/* Avatar */}
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: linked ? '#D1FAE5' : '#F3F4F6',
                            color: linked ? '#065F46' : '#6B7280',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700,
                          }}>
                            {d.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                              Dr. {d.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                              {d.specialty ?? 'Especialidade não definida'}
                            </div>
                          </div>

                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: linked ? '#D1FAE5' : '#F3F4F6',
                            color: linked ? '#065F46' : '#9CA3AF',
                          }}>
                            {linked ? 'Com acesso' : 'Sem acesso'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
