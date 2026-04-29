'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import CalendarGrid from './CalendarGrid';
import { CalendarAppointment, ViewMode } from './types';
import { weekDays, shiftDate, todayStr, fmtDayHeader, TYPE_META, STATUS_META } from './utils';

/* ─── Quick-add modal ─── */
function QuickAddModal({
  date, time, onClose, onSave,
}: {
  date: string; time: string;
  onClose: () => void;
  onSave: (appt: Omit<CalendarAppointment, 'id'>) => Promise<void>;
}) {
  const [patientName, setPatientName] = useState('');
  const [startTime,   setStartTime]   = useState(time);
  const [endTime,     setEndTime]     = useState(() => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + 30;
    return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
  });
  const [type,   setType]   = useState('consulta');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!patientName.trim()) return;
    setSaving(true);
    await onSave({
      patient_id: '', patient_name: patientName,
      date, start_time: startTime, end_time: endTime,
      type, status: 'agendado',
    });
    setSaving(false);
    onClose();
  };

  const inp: React.CSSProperties = {
    height: 34, border: '1px solid #E5E7EB', borderRadius: 6,
    padding: '0 10px', fontSize: 13, color: '#111827',
    background: '#fff', fontFamily: 'inherit', width: '100%',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: 12, padding: 24,
        width: 360, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
          Novo agendamento · {date.split('-').reverse().join('/')} {startTime}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Nome do paciente" value={patientName}
            onChange={e => setPatientName(e.target.value)} style={inp} autoFocus />

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 3 }}>Início</div>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 3 }}>Fim</div>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inp} />
            </div>
          </div>

          <select value={type} onChange={e => setType(e.target.value)} style={inp}>
            {Object.entries(TYPE_META).map(([v, m]) => (
              <option key={v} value={v}>{m.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{
            height: 34, padding: '0 16px', border: '1px solid #E5E7EB',
            borderRadius: 6, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving || !patientName.trim()} style={{
            height: 34, padding: '0 16px', background: '#0066D0', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600,
            cursor: saving || !patientName.trim() ? 'default' : 'pointer',
            opacity: saving || !patientName.trim() ? .6 : 1, fontFamily: 'inherit',
          }}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Appointment detail popover ─── */
function ApptDetail({
  appt, onClose, onDelete,
}: {
  appt: CalendarAppointment; onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const meta   = TYPE_META[appt.type]   ?? { label: appt.type,   color: '#374151', bg: '#F3F4F6' };
  const status = STATUS_META[appt.status] ?? { label: appt.status, dot: '#9CA3AF' };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: 12, padding: 24, width: 320,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)',
        borderTop: `4px solid ${meta.color}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{appt.patient_name}</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9CA3AF', lineHeight: 1,
          }}>×</button>
        </div>

        {[
          { label: 'Data',      val: appt.date.split('-').reverse().join('/') },
          { label: 'Horário',   val: `${appt.start_time} – ${appt.end_time}` },
          { label: 'Tipo',      val: meta.label },
          { label: 'Status',    val: status.label },
          appt.insurance ? { label: 'Convênio', val: appt.insurance } : null,
          appt.notes     ? { label: 'Obs.',     val: appt.notes }     : null,
        ].filter(Boolean).map((row, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13,
          }}>
            <span style={{ color: '#6B7280' }}>{row!.label}</span>
            <span style={{ color: '#111827', fontWeight: 500 }}>{row!.val}</span>
          </div>
        ))}

        <button onClick={() => { onDelete(appt.id); onClose(); }} style={{
          marginTop: 16, width: '100%', height: 34, background: '#FEF2F2',
          color: '#EF4444', border: '1px solid #FECACA', borderRadius: 6,
          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
        }}>
          Cancelar agendamento
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════ */
export default function WeeklyCalendar() {
  const [view,       setView]       = useState<ViewMode>('week');
  const [refDate,    setRefDate]    = useState(todayStr());
  const [appts,      setAppts]      = useState<CalendarAppointment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [quickAdd,   setQuickAdd]   = useState<{ date: string; time: string } | null>(null);
  const [detail,     setDetail]     = useState<CalendarAppointment | null>(null);

  /* ── Load ── */
  const days = view === 'week' ? weekDays(refDate) : [refDate];

  const load = useCallback(async () => {
    setLoading(true);
    const start = days[0];
    const end   = days[days.length - 1];
    const { data } = await supabase
      .from('appointments')
      .select('id, patient_id, patients(name), date, start_time, end_time, type, status, insurance, notes')
      .gte('date', start)
      .lte('date', end)
      .order('start_time');

    const mapped: CalendarAppointment[] = (data ?? []).map((r: any) => ({
      id:           r.id,
      patient_id:   r.patient_id,
      patient_name: r.patients?.name ?? 'Paciente',
      date:         r.date,
      start_time:   r.start_time?.slice(0, 5) ?? '00:00',
      end_time:     r.end_time?.slice(0, 5)   ?? '00:30',
      type:         r.type,
      status:       r.status,
      insurance:    r.insurance ?? undefined,
      notes:        r.notes     ?? undefined,
    }));
    setAppts(mapped);
    setLoading(false);
  }, [days.join(',')]);

  useEffect(() => { load(); }, [load]);

  /* ── Drag-drop / resize update ── */
  const handleUpdate = useCallback(async (updated: CalendarAppointment) => {
    // Optimistic update
    setAppts(prev => prev.map(a => a.id === updated.id ? updated : a));
    setSaving(true);
    const { error } = await supabase.from('appointments').update({
      date:       updated.date,
      start_time: updated.start_time,
      end_time:   updated.end_time,
    }).eq('id', updated.id);
    if (error) {
      console.error('Calendar update failed:', error);
      load(); // revert on error
    }
    setSaving(false);
  }, [load]);

  /* ── Quick add ── */
  const handleQuickSave = useCallback(async (appt: Omit<CalendarAppointment, 'id'>) => {
    // Insert locally first (temp id)
    const tempId = `temp-${Date.now()}`;
    setAppts(prev => [...prev, { ...appt, id: tempId }]);

    const { data, error } = await supabase.from('appointments').insert({
      patient_id:  appt.patient_id || null,
      date:        appt.date,
      start_time:  appt.start_time,
      end_time:    appt.end_time,
      type:        appt.type,
      status:      appt.status,
    }).select('id').single();

    if (!error && data) {
      setAppts(prev => prev.map(a => a.id === tempId ? { ...a, id: data.id } : a));
    } else {
      setAppts(prev => prev.filter(a => a.id !== tempId));
      load();
    }
  }, [load]);

  /* ── Delete ── */
  const handleDelete = useCallback(async (id: string) => {
    setAppts(prev => prev.filter(a => a.id !== id));
    await supabase.from('appointments').update({ status: 'cancelado' }).eq('id', id);
  }, []);

  /* ── Navigation ── */
  const goBack = () => {
    setRefDate(d => view === 'week' ? shiftDate(d, -7) : shiftDate(d, -1));
  };
  const goForward = () => {
    setRefDate(d => view === 'week' ? shiftDate(d, 7) : shiftDate(d, 1));
  };

  const headerLabel = view === 'week'
    ? (() => {
        const start = days[0];
        const end   = days[6];
        const s = new Date(start + 'T12:00:00');
        const e = new Date(end   + 'T12:00:00');
        return `${s.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${e.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      })()
    : new Date(refDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const btn: React.CSSProperties = {
    height: 30, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 6,
    background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#374151',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        borderBottom: '1px solid #E5E7EB', flexShrink: 0, flexWrap: 'wrap',
      }}>
        <button onClick={() => setRefDate(todayStr())} style={{ ...btn, fontWeight: 600 }}>Hoje</button>
        <button onClick={goBack}    style={{ ...btn, padding: '0 8px' }}>‹</button>
        <button onClick={goForward} style={{ ...btn, padding: '0 8px' }}>›</button>

        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', flex: 1, minWidth: 180 }}>
          {headerLabel}
        </span>

        {saving && (
          <span style={{ fontSize: 11, color: '#0066D0', fontWeight: 500 }}>Salvando…</span>
        )}
        {loading && (
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>Carregando…</span>
        )}

        <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
          {(['day', 'week'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              height: 30, padding: '0 12px', border: 'none',
              background: view === v ? '#0066D0' : '#fff',
              color: view === v ? '#fff' : '#374151',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: view === v ? 600 : 400,
            }}>
              {v === 'day' ? 'Dia' : 'Semana'}
            </button>
          ))}
        </div>

        <button onClick={() => setQuickAdd({ date: refDate, time: '08:00' })} style={{
          ...btn, background: '#0066D0', color: '#fff', border: 'none', fontWeight: 600,
        }}>
          + Novo
        </button>
      </div>

      {/* ── Grid ── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CalendarGrid
          appointments={appts}
          view={view}
          referenceDate={refDate}
          onUpdate={handleUpdate}
          onSlotClick={(date, time) => setQuickAdd({ date, time })}
          onAppointmentClick={a => setDetail(a)}
        />
      </div>

      {/* ── Modals ── */}
      {quickAdd && (
        <QuickAddModal
          date={quickAdd.date}
          time={quickAdd.time}
          onClose={() => setQuickAdd(null)}
          onSave={handleQuickSave}
        />
      )}
      {detail && (
        <ApptDetail
          appt={detail}
          onClose={() => setDetail(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
