'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type CommissionConfig = { type: 'percentage' | 'fixed'; value: number } | null;

type Doctor = {
  id: string;
  name: string;
  specialty: string | null;
  role: string;
  commission_config: CommissionConfig;
};

type CommissionSummary = {
  doctor_id: string;
  doctor_name: string;
  specialty: string | null;
  role: string;
  commission_config: CommissionConfig;
  total_transactions: number;
  pendente: number;
  pago: number;
  cancelado: number;
  total_earned: number;
};

type CommissionTx = {
  id: string;
  date: string;
  amount: number;
  commission_amount: number;
  commission_status: 'pendente' | 'pago' | 'cancelado';
  description: string | null;
  category: string | null;
  status: string;
  patients: { id: string; name: string } | null;
};

type Payout = {
  id: string;
  doctor_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: 'pendente' | 'pago' | 'cancelado';
  paid_at: string | null;
  notes: string | null;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

function roleLabel(role: string) {
  const map: Record<string, string> = {
    admin: 'Admin', medico: 'Médico', recepcionista: 'Recepcionista',
    enfermeiro: 'Enfermeiro', secretaria: 'Secretária',
  };
  return map[role] ?? role;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pendente:  { bg: '#FEF9C3', color: '#92400E' },
  pago:      { bg: '#DCFCE7', color: '#166534' },
  cancelado: { bg: '#FEE2E2', color: '#991B1B' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfigBadge({ cfg }: { cfg: CommissionConfig }) {
  if (!cfg) return <span style={{ fontSize: 11, color: '#9CA3AF' }}>Sem comissão</span>;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: '#EFF6FF', color: '#1E40AF' }}>
      {cfg.type === 'percentage' ? `${cfg.value}%` : fmtBRL(cfg.value)} / venda
    </span>
  );
}

// ─── CommissionConfigModal ─────────────────────────────────────────────────────

function ConfigModal({
  doctor,
  onClose,
  onSaved,
}: {
  doctor: Doctor;
  onClose: () => void;
  onSaved: (updated: Doctor) => void;
}) {
  const cfg = doctor.commission_config;
  const [type,    setType]    = useState<'percentage' | 'fixed'>(cfg?.type ?? 'percentage');
  const [value,   setValue]   = useState(cfg?.value?.toString() ?? '');
  const [enabled, setEnabled] = useState(cfg !== null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const handleSave = async () => {
    setError('');
    const numVal = parseFloat(value);
    if (enabled) {
      if (isNaN(numVal) || numVal <= 0) { setError('Informe um valor maior que zero.'); return; }
      if (type === 'percentage' && numVal > 100) { setError('Percentual não pode exceder 100%.'); return; }
    }

    setSaving(true);
    const newConfig: CommissionConfig = enabled
      ? { type, value: numVal }
      : null;

    const { error: dbErr } = await supabase
      .from('doctors')
      .update({ commission_config: newConfig })
      .eq('id', doctor.id);

    if (dbErr) { setError(dbErr.message); setSaving(false); return; }

    // Recalculate existing transactions for this doctor
    await fetch('/api/commissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'recalculate', doctor_id: doctor.id }),
    });

    setSaving(false);
    onSaved({ ...doctor, commission_config: newConfig });
  };

  const inp: React.CSSProperties = {
    width: '100%', height: 38, border: '1.5px solid #E5E7EB', borderRadius: 7,
    padding: '0 10px', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', background: '#fff',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
      onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: 420, maxWidth: '94vw',
        boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Configurar Comissão</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
              {doctor.name} · {roleLabel(doctor.role)}
            </div>
          </div>
          <button onClick={onClose} disabled={saving}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Toggle ativo/inativo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            background: enabled ? '#F0FDF4' : '#F9FAFB', borderRadius: 8,
            border: `1px solid ${enabled ? '#BBF7D0' : '#E5E7EB'}` }}>
            <div onClick={() => setEnabled(p => !p)} style={{
              width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
              background: enabled ? '#10B981' : '#D1D5DB', transition: 'background .2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                left: enabled ? 23 : 3, transition: 'left .2s',
              }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                {enabled ? 'Comissão ativada' : 'Sem comissão'}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>
                {enabled ? 'Calculada automaticamente em cada venda' : 'Clique para ativar'}
              </div>
            </div>
          </div>

          {enabled && (
            <>
              {/* Tipo */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151',
                  display: 'block', marginBottom: 6 }}>Tipo de comissão</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {([['percentage', '% Percentual', 'Ex: 10% do valor da venda'],
                     ['fixed',      'R$ Valor fixo', 'Ex: R$ 20,00 por venda']] as const).map(([t, label, desc]) => (
                    <button key={t} onClick={() => setType(t)}
                      style={{ padding: '10px 12px', border: `2px solid ${type === t ? '#0066D0' : '#E5E7EB'}`,
                        borderRadius: 8, background: type === t ? '#EFF6FF' : '#fff',
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: type === t ? '#0066D0' : '#374151' }}>{label}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151',
                  display: 'block', marginBottom: 4 }}>
                  {type === 'percentage' ? 'Percentual (%)' : 'Valor fixo (R$)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" min="0" step={type === 'percentage' ? '0.5' : '1'}
                    max={type === 'percentage' ? '100' : undefined}
                    value={value} onChange={e => setValue(e.target.value)}
                    placeholder={type === 'percentage' ? 'Ex: 10' : 'Ex: 25.00'}
                    style={inp}
                    onFocus={e => (e.target.style.borderColor = '#0066D0')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 12, color: '#9CA3AF', pointerEvents: 'none' }}>
                    {type === 'percentage' ? '%' : 'R$'}
                  </span>
                </div>

                {/* Preview */}
                {value && !isNaN(parseFloat(value)) && parseFloat(value) > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280',
                    background: '#F9FAFB', padding: '6px 10px', borderRadius: 6 }}>
                    💡 Exemplo: venda de R$ 300,00 →{' '}
                    <strong style={{ color: '#166534' }}>
                      {type === 'percentage'
                        ? fmtBRL(300 * parseFloat(value) / 100) + ' de comissão'
                        : fmtBRL(parseFloat(value)) + ' de comissão'}
                    </strong>
                  </div>
                )}
              </div>
            </>
          )}

          {error && <div style={{ fontSize: 12, color: '#EF4444' }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px 16px', borderTop: '1px solid #F3F4F6',
          display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} disabled={saving}
            style={{ height: 36, padding: '0 16px', border: '1px solid #E5E7EB',
              borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button disabled={saving} onClick={handleSave}
            style={{ height: 36, padding: '0 20px',
              background: saving ? '#E5E7EB' : '#0066D0', color: saving ? '#9CA3AF' : '#fff',
              border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700,
              cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PayoutModal ───────────────────────────────────────────────────────────────

function PayoutModal({
  doctor,
  onClose,
  onCreated,
}: {
  doctor: CommissionSummary;
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';
  const [from,  setFrom]  = useState(firstOfMonth);
  const [to,    setTo]    = useState(today);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleCreate = async () => {
    setError('');
    setSaving(true);
    const res = await fetch('/api/commissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'payout',
        doctor_id: doctor.doctor_id,
        period_start: from,
        period_end: to,
        notes: notes.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Erro ao criar lote'); setSaving(false); return; }
    setSaving(false);
    onCreated();
  };

  const inp: React.CSSProperties = {
    height: 36, border: '1.5px solid #E5E7EB', borderRadius: 7,
    padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
      onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: 400, maxWidth: '94vw',
        boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Gerar Lote de Pagamento</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{doctor.doctor_name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>×</button>
        </div>

        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>De</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Até</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Observação</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Pagamento referente ao mês de maio"
              style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ padding: '10px 12px', background: '#EFF6FF', borderRadius: 7, border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: 12, color: '#1E40AF' }}>
              💡 Serão agrupadas todas as comissões <strong>pendentes</strong> do período selecionado.
              O lote ficará com status <em>Pendente</em> até você confirmar o pagamento.
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: '#EF4444' }}>{error}</div>}
        </div>

        <div style={{ padding: '12px 18px 16px', borderTop: '1px solid #F3F4F6',
          display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ height: 36, padding: '0 16px', border: '1px solid #E5E7EB',
            borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button disabled={saving} onClick={handleCreate}
            style={{ height: 36, padding: '0 20px', background: saving ? '#E5E7EB' : '#0066D0',
              color: saving ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 7, fontSize: 13,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Gerando…' : 'Gerar Lote'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CommissionManager ────────────────────────────────────────────────────

export default function CommissionManager() {
  const [tab, setTab]             = useState<'config' | 'relatorio' | 'lotes'>('config');
  const [doctors, setDoctors]     = useState<Doctor[]>([]);
  const [summary, setSummary]     = useState<CommissionSummary[]>([]);
  const [payouts, setPayouts]     = useState<Payout[]>([]);
  const [txs, setTxs]             = useState<CommissionTx[]>([]);
  const [loading, setLoading]     = useState(true);
  const [configDoc, setConfigDoc] = useState<Doctor | null>(null);
  const [detailDoc, setDetailDoc] = useState<CommissionSummary | null>(null);
  const [payoutDoc, setPayoutDoc] = useState<CommissionSummary | null>(null);
  const [toast, setToast]         = useState('');
  const [filterPeriod, setFilterPeriod] = useState('mes');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadDoctors = useCallback(async () => {
    const { data } = await supabase
      .from('doctors')
      .select('id, name, specialty, role, commission_config')
      .eq('active', true)
      .order('name');
    setDoctors((data ?? []) as Doctor[]);
  }, []);

  const loadSummary = useCallback(async () => {
    const res = await fetch('/api/commissions?summary=true');
    const { data } = await res.json();
    setSummary((data ?? []) as CommissionSummary[]);
  }, []);

  const loadPayouts = useCallback(async () => {
    const { data } = await supabase
      .from('commission_payouts')
      .select('*, doctors(name)')
      .order('created_at', { ascending: false });
    setPayouts((data ?? []) as Payout[]);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadDoctors(), loadSummary(), loadPayouts()]);
    setLoading(false);
  }, [loadDoctors, loadSummary, loadPayouts]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Load transactions when a detail doctor is selected
  useEffect(() => {
    if (!detailDoc) { setTxs([]); return; }
    const now = new Date();
    const from = filterPeriod === 'mes'
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      : filterPeriod === 'ano'
      ? `${now.getFullYear()}-01-01`
      : '2000-01-01';
    fetch(`/api/commissions?doctor_id=${detailDoc.doctor_id}&from=${from}`)
      .then(r => r.json())
      .then(({ data }) => setTxs((data ?? []) as CommissionTx[]));
  }, [detailDoc, filterPeriod]);

  const handlePayoutStatus = async (payout: Payout, status: 'pago' | 'cancelado') => {
    const res = await fetch('/api/commissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payout_id: payout.id, status }),
    });
    if (res.ok) {
      showToast(status === 'pago' ? '✓ Lote marcado como pago' : '✓ Lote cancelado');
      loadAll();
    }
  };

  const handleTxStatus = async (tx: CommissionTx, newStatus: 'pago' | 'pendente' | 'cancelado') => {
    await fetch('/api/commissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: tx.id, commission_status: newStatus }),
    });
    setTxs(prev => prev.map(t => t.id === tx.id ? { ...t, commission_status: newStatus } : t));
    loadSummary();
  };

  const totalPendente = summary.reduce((s, d) => s + Number(d.pendente), 0);
  const totalPago     = summary.reduce((s, d) => s + Number(d.pago), 0);

  const row: React.CSSProperties = {
    padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
    borderBottom: '1px solid #F3F4F6', background: '#fff',
    transition: 'background .1s',
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
      Carregando comissões…
    </div>
  );

  return (
    <div style={{ fontFamily: 'inherit', maxWidth: 900, margin: '0 auto', padding: '20px 24px' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: '#10B981', color: '#fff', padding: '10px 18px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}>
          {toast}
        </div>
      )}

      {/* Header + KPIs */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4, marginTop: 0 }}>
          💰 Comissionamento
        </h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Configure e acompanhe comissões por colaborador com base em vendas/receitas.
        </p>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'A receber', value: totalPendente, color: '#F59E0B', bg: '#FEF9C3' },
            { label: 'Pago este mês', value: totalPago,     color: '#10B981', bg: '#DCFCE7' },
            { label: 'Colaboradores c/ comissão', value: doctors.filter(d => d.commission_config).length, isCnt: true, color: '#3B82F6', bg: '#EFF6FF' },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: kpi.bg, borderRadius: 10, padding: '14px 16px',
              border: `1px solid ${kpi.color}30` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>{kpi.label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>
                {kpi.isCnt ? kpi.value : fmtBRL(kpi.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E5E7EB' }}>
          {([
            ['config',    'Configuração'],
            ['relatorio', 'Relatório'],
            ['lotes',     'Lotes de Pgto'],
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding: '8px 18px', border: 'none', background: 'none',
                fontSize: 13, fontWeight: tab === id ? 700 : 400,
                color: tab === id ? '#0066D0' : '#6B7280',
                borderBottom: `2px solid ${tab === id ? '#0066D0' : 'transparent'}`,
                cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: Configuração ── */}
      {tab === 'config' && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
            fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Colaboradores ({doctors.length})
          </div>
          {doctors.map(doc => (
            <div key={doc.id}
              style={{ ...row }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>

              {/* Avatar */}
              <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: doc.commission_config ? '#DBEAFE' : '#F3F4F6',
                color: doc.commission_config ? '#1E40AF' : '#9CA3AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800 }}>
                {doc.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doc.name}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                  {roleLabel(doc.role)}{doc.specialty ? ` · ${doc.specialty}` : ''}
                </div>
              </div>

              {/* Commission badge */}
              <ConfigBadge cfg={doc.commission_config} />

              {/* Edit btn */}
              <button onClick={() => setConfigDoc(doc)}
                style={{ height: 32, padding: '0 14px', border: '1px solid #E5E7EB',
                  borderRadius: 7, background: '#fff', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', color: '#374151', flexShrink: 0 }}>
                ✏ Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Relatório ── */}
      {tab === 'relatorio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {summary.filter(d => d.commission_config !== null).length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              Nenhum colaborador com comissão configurada ainda.
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
              {summary.filter(d => d.commission_config !== null).map((s, i, arr) => (
                <div key={s.doctor_id}>
                  <div style={{ ...row, cursor: 'pointer', flexWrap: 'wrap', gap: 10 }}
                    onClick={() => setDetailDoc(detailDoc?.doctor_id === s.doctor_id ? null : s)}>

                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: '#DBEAFE', color: '#1E40AF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800 }}>
                      {s.doctor_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.doctor_name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{roleLabel(s.role)} · <ConfigBadge cfg={s.commission_config} /></div>
                    </div>

                    {/* KPIs inline */}
                    {[
                      { label: 'A receber', value: s.pendente, color: '#F59E0B' },
                      { label: 'Pago',      value: s.pago,     color: '#10B981' },
                      { label: 'Total',     value: s.total_earned, color: '#374151' },
                    ].map(kpi => (
                      <div key={kpi.label} style={{ textAlign: 'right', minWidth: 80 }}>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{kpi.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: kpi.color }}>
                          {fmtBRL(Number(kpi.value))}
                        </div>
                      </div>
                    ))}

                    {/* Payout btn */}
                    <button
                      onClick={e => { e.stopPropagation(); setPayoutDoc(s); }}
                      style={{ height: 30, padding: '0 12px', background: Number(s.pendente) > 0 ? '#0066D0' : '#F3F4F6',
                        color: Number(s.pendente) > 0 ? '#fff' : '#9CA3AF',
                        border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        cursor: Number(s.pendente) > 0 ? 'pointer' : 'default', fontFamily: 'inherit', flexShrink: 0 }}>
                      Pagar
                    </button>

                    <span style={{ color: '#9CA3AF', fontSize: 12 }}>{detailDoc?.doctor_id === s.doctor_id ? '▲' : '▼'}</span>
                  </div>

                  {/* Detail rows */}
                  {detailDoc?.doctor_id === s.doctor_id && (
                    <div style={{ background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
                      {/* Period filter */}
                      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>Período:</span>
                        {(['mes', 'ano', 'todos'] as const).map(p => (
                          <button key={p} onClick={() => setFilterPeriod(p)}
                            style={{ height: 26, padding: '0 10px', borderRadius: 20,
                              border: `1px solid ${filterPeriod === p ? '#0066D0' : '#E5E7EB'}`,
                              background: filterPeriod === p ? '#EFF6FF' : '#fff',
                              color: filterPeriod === p ? '#0066D0' : '#6B7280',
                              fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {p === 'mes' ? 'Este mês' : p === 'ano' ? 'Este ano' : 'Todos'}
                          </button>
                        ))}
                      </div>

                      {txs.length === 0 ? (
                        <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                          Nenhuma comissão no período
                        </div>
                      ) : txs.map(tx => (
                        <div key={tx.id} style={{ padding: '10px 16px 10px 54px', borderTop: '1px solid #F3F4F6',
                          display: 'flex', alignItems: 'center', gap: 10, background: '#fff' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: '#374151' }}>
                              {tx.description || tx.category || 'Receita'}
                              {tx.patients && <span style={{ color: '#9CA3AF' }}> · {tx.patients.name}</span>}
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                              {fmtDate(tx.date)} · Venda: {fmtBRL(tx.amount)}
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 80, textAlign: 'right' }}>
                            {fmtBRL(tx.commission_amount)}
                          </div>
                          <select
                            value={tx.commission_status}
                            onChange={e => handleTxStatus(tx, e.target.value as any)}
                            style={{ height: 28, padding: '0 6px', borderRadius: 6, fontSize: 11,
                              border: `1px solid ${STATUS_COLORS[tx.commission_status].color}40`,
                              background: STATUS_COLORS[tx.commission_status].bg,
                              color: STATUS_COLORS[tx.commission_status].color,
                              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <option value="pendente">Pendente</option>
                            <option value="pago">Pago</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {i < arr.length - 1 && <div style={{ height: 1, background: '#E5E7EB' }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Lotes de Pagamento ── */}
      {tab === 'lotes' && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
          {payouts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              Nenhum lote gerado ainda. Acesse a aba Relatório e clique em "Pagar".
            </div>
          ) : (
            <>
              <div style={{ padding: '10px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
                fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {payouts.length} lote{payouts.length !== 1 ? 's' : ''}
              </div>
              {payouts.map((p, i) => (
                <div key={p.id} style={{ ...row }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      {(p as any).doctors?.name ?? '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                      {fmtDate(p.period_start)} → {fmtDate(p.period_end)}
                      {p.notes && ` · ${p.notes}`}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', minWidth: 90, textAlign: 'right' }}>
                    {fmtBRL(p.total_amount)}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: STATUS_COLORS[p.status].bg, color: STATUS_COLORS[p.status].color }}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                  {p.status === 'pendente' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handlePayoutStatus(p, 'pago')}
                        style={{ height: 30, padding: '0 12px', background: '#10B981', color: '#fff',
                          border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit' }}>
                        ✓ Pagar
                      </button>
                      <button onClick={() => handlePayoutStatus(p, 'cancelado')}
                        style={{ height: 30, padding: '0 10px', background: '#fff', color: '#EF4444',
                          border: '1px solid #FEE2E2', borderRadius: 6, fontSize: 11,
                          cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancelar
                      </button>
                    </div>
                  )}
                  {p.status === 'pago' && p.paid_at && (
                    <div style={{ fontSize: 11, color: '#10B981' }}>
                      Pago em {fmtDate(p.paid_at.slice(0, 10))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {configDoc && (
        <ConfigModal
          doctor={configDoc}
          onClose={() => setConfigDoc(null)}
          onSaved={updated => {
            setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d));
            setConfigDoc(null);
            loadSummary();
            showToast('✓ Configuração salva');
          }}
        />
      )}

      {payoutDoc && (
        <PayoutModal
          doctor={payoutDoc}
          onClose={() => setPayoutDoc(null)}
          onCreated={() => {
            setPayoutDoc(null);
            loadAll();
            showToast('✓ Lote criado com sucesso');
          }}
        />
      )}
    </div>
  );
}
