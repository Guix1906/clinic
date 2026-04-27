'use client';
import React, { useState, useEffect, CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';

/* ─────────────────────────────────────────
   ICON COMPONENT
───────────────────────────────────────── */
const ICON_PATHS: Record<string, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  package: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
  chart: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  help: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  message: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  printer: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
  tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  'user-plus': <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>,
  'chevron-down': <><polyline points="6 9 12 15 18 9"/></>,
  list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  wifi: <><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
  refresh: <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
};

function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 2 }: {
  name: string; size?: number; color?: string; strokeWidth?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name]}
    </svg>
  );
}

/* ─────────────────────────────────────────
   SHARED UI
───────────────────────────────────────── */
const BADGE_VARIANTS: Record<string, CSSProperties> = {
  green:  { background: '#D1FAE5', color: '#065F46' },
  blue:   { background: '#DBEAFE', color: '#003D80' },
  red:    { background: '#FEE2E2', color: '#991B1B' },
  yellow: { background: '#FEF3C7', color: '#92400E' },
  teal:   { background: '#F0FDFA', color: '#0F766E' },
  gray:   { background: '#F3F4F6', color: '#6B7280' },
};

function Badge({ children, variant = 'blue' }: { children: React.ReactNode; variant?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 9999, fontSize: 11, fontWeight: 500,
      ...BADGE_VARIANTS[variant],
    }}>{children}</span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', ...style,
    }}>{children}</div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: '#9CA3AF' }}>
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────── */
type NavId = 'dashboard' | 'agenda' | 'prontuario' | 'pacientes' | 'financas' | 'estoque' | 'relatorios' | 'configuracoes';

const NAV_ITEMS: { id: NavId; label: string; icon: string; badge?: number }[] = [
  { id: 'dashboard',     label: 'Painel',        icon: 'grid' },
  { id: 'agenda',        label: 'Agenda',         icon: 'calendar' },
  { id: 'prontuario',    label: 'Prontuários',    icon: 'file' },
  { id: 'pacientes',     label: 'Pacientes',      icon: 'users' },
  { id: 'financas',      label: 'Finanças',       icon: 'dollar' },
  { id: 'estoque',       label: 'Estoque',        icon: 'package' },
  { id: 'relatorios',    label: 'Relatórios',     icon: 'chart' },
  { id: 'configuracoes', label: 'Configurações',  icon: 'settings' },
];

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function Sidebar({ active, onNavigate, agendaBadge }: { active: NavId; onNavigate: (id: NavId) => void; agendaBadge: number }) {
  return (
    <aside style={{
      width: 220, background: '#1E2130', display: 'flex', flexDirection: 'column',
      flexShrink: 0, height: '100%', overflow: 'hidden',
    }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#60A5FA', letterSpacing: '-0.03em' }}>Med</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#2DD4BF', letterSpacing: '-0.03em' }}>Flow</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Sistema Médico</div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          const badge = item.id === 'agenda' ? agendaBadge : item.badge;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
              borderRadius: 7, cursor: 'pointer', fontSize: 13, width: '100%',
              background: isActive ? 'rgba(96,165,250,0.15)' : 'none',
              color: isActive ? '#60A5FA' : 'rgba(255,255,255,0.55)',
              border: 'none', fontFamily: 'inherit', fontWeight: isActive ? 600 : 400,
              borderLeft: `3px solid ${isActive ? '#60A5FA' : 'transparent'}`,
              transition: 'all 0.1s', textAlign: 'left',
            }}>
              <Icon name={item.icon} size={15} color={isActive ? '#60A5FA' : 'rgba(255,255,255,0.4)'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge !== undefined && badge > 0 && (
                <span style={{
                  background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700,
                  minWidth: 18, height: 18, borderRadius: 9999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '7px 10px', borderRadius: 7, background: 'none',
          border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
          fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit', marginBottom: 8,
        }}>
          <Icon name="help" size={14} color="rgba(255,255,255,0.4)" />
          Central de Suporte
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#0066D0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>GT</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>guilherme teixeira</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Médico · Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────
   TOPBAR
───────────────────────────────────────── */
function Topbar({ screen, notifCount }: { screen: NavId; notifCount: number }) {
  const label = NAV_ITEMS.find(n => n.id === screen)?.label ?? 'Painel';
  return (
    <header style={{
      height: 52, background: '#fff', borderBottom: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0,
    }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</span>
      <div style={{ position: 'relative', flex: 1, maxWidth: 340, marginLeft: 8 }}>
        <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon name="search" size={14} color="#9CA3AF" />
        </div>
        <input placeholder="Buscar paciente, agenda..." style={{
          width: '100%', height: 34, background: '#F9FAFB', border: '1px solid #E5E7EB',
          borderRadius: 7, padding: '0 10px 0 32px', fontSize: 13, color: '#374151',
          fontFamily: 'inherit', outline: 'none',
        }} />
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
        <button style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', position: 'relative' }}>
          <Icon name="bell" size={16} />
          {notifCount > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: '#EF4444', borderRadius: '50%', border: '1.5px solid #fff' }} />}
        </button>
        <button style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
          <Icon name="message" size={16} />
        </button>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#0066D0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', marginLeft: 4,
        }}>GT</div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────
   INTERNAL TABS
───────────────────────────────────────── */
interface Tab { id: NavId; label: string; icon: string; closeable: boolean; }

function InternalTabs({ tabs, activeTab, onSelect, onClose }: {
  tabs: Tab[]; activeTab: NavId;
  onSelect: (id: NavId) => void;
  onClose: (id: NavId) => void;
}) {
  return (
    <div style={{
      height: 36, background: '#fff', borderBottom: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'flex-end', padding: '0 16px', gap: 2, flexShrink: 0,
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <div key={tab.id} onClick={() => onSelect(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px',
            height: 30, border: '1px solid #E5E7EB', borderBottom: 'none',
            borderRadius: '6px 6px 0 0', fontSize: 12, fontWeight: isActive ? 600 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative', top: 1,
            background: isActive ? '#F9FAFB' : '#fff',
            color: isActive ? '#0066D0' : '#6B7280',
          }}>
            <Icon name={tab.icon} size={11} color={isActive ? '#0066D0' : '#9CA3AF'} />
            {tab.label}
            {tab.closeable && (
              <button onClick={e => { e.stopPropagation(); onClose(tab.id); }} style={{
                width: 16, height: 16, borderRadius: 3, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: '#9CA3AF', lineHeight: 1, padding: 0,
              }}>×</button>
            )}
          </div>
        );
      })}
      <button style={{
        width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 5, cursor: 'pointer', color: '#9CA3AF', border: 'none',
        background: 'none', marginLeft: 2, fontSize: 18, lineHeight: 1,
      }}>+</button>
    </div>
  );
}

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Patient {
  id: string; name: string; email?: string; phone?: string;
  birth_date?: string; gender?: string; insurance?: string;
}
interface Appointment {
  id: string; patient_id: string; date: string; start_time: string; end_time: string;
  type: string; status: string; notes?: string;
  patients?: Patient;
}
interface Transaction {
  id: string; type: string; amount: number; category?: string;
  description?: string; date: string; status: string; payment_method?: string;
}
interface InventoryItem {
  id: string; name: string; code?: string; category?: string;
  quantity: number; min_quantity: number; expiry_date?: string;
  unit?: string; active: boolean;
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function fmtCurrency(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function weekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now); start.setDate(now.getDate() - day);
  const end   = new Date(now); end.setDate(now.getDate() + (6 - day));
  return {
    start: start.toISOString().split('T')[0],
    end:   end.toISOString().split('T')[0],
  };
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  em_atendimento: { bg: '#DBEAFE', color: '#0066D0' },
  aguardando:     { bg: '#FEF3C7', color: '#92400E' },
  confirmado:     { bg: '#F3E8FF', color: '#7C3AED' },
  agendado:       { bg: '#F3E8FF', color: '#7C3AED' },
  concluido:      { bg: '#D1FAE5', color: '#065F46' },
  faltou:         { bg: '#FEE2E2', color: '#991B1B' },
  cancelado:      { bg: '#F3F4F6', color: '#6B7280' },
};

function statusBadge(s: string) {
  const labels: Record<string, string> = {
    em_atendimento: '● Em atendimento', aguardando: '● Aguardando',
    confirmado: '● Confirmado', agendado: '● Agendado',
    concluido: '● Concluído', faltou: '● Faltou', cancelado: '● Cancelado',
  };
  const variants: Record<string, string> = {
    em_atendimento: 'green', aguardando: 'blue', confirmado: 'gray',
    agendado: 'gray', concluido: 'teal', faltou: 'red', cancelado: 'gray',
  };
  return <Badge variant={variants[s] ?? 'gray'}>{labels[s] ?? s}</Badge>;
}

/* ─────────────────────────────────────────
   DASHBOARD SCREEN
───────────────────────────────────────── */
function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newPatients,  setNewPatients]  = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = todayISO();
    const { start, end } = weekRange();

    Promise.all([
      supabase.from('appointments')
        .select('*, patients(id, name, insurance)')
        .eq('date', today)
        .order('start_time'),
      supabase.from('transactions')
        .select('*')
        .gte('date', start)
        .lte('date', end),
      supabase.from('patients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today + 'T00:00:00'),
    ]).then(([appt, txn, pts]) => {
      setAppointments((appt.data as Appointment[]) ?? []);
      setTransactions((txn.data as Transaction[]) ?? []);
      setNewPatients(pts.count ?? 0);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  const today = todayISO();
  const confirmed   = appointments.filter(a => ['confirmado','agendado'].includes(a.status)).length;
  const attended    = appointments.filter(a => a.status === 'concluido').length;
  const totalAppt   = appointments.length;
  const receitas    = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0);
  const despesas    = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0);
  const saldo       = receitas - despesas;

  const kpis = [
    { label: 'Pacientes do Dia',       value: String(totalAppt),        sub: `${confirmed} confirmados`,          prog: totalAppt ? Math.round(confirmed / totalAppt * 100) : 0, color: '#0066D0', bg: '#EFF6FF', icon: 'user',      iconColor: '#0066D0' },
    { label: 'Faturamento Previsto',   value: fmtCurrency(receitas),    sub: 'receitas da semana',                prog: 54,                                                      color: '#14B8A6', bg: '#F0FDFA', icon: 'dollar',    iconColor: '#14B8A6' },
    { label: 'Atendimentos Realizados',value: String(attended),         sub: `de ${totalAppt} hoje`,              prog: totalAppt ? Math.round(attended / totalAppt * 100) : 0, color: '#10B981', bg: '#D1FAE5', icon: 'check',     iconColor: '#10B981' },
    { label: 'Novos Pacientes',        value: String(newPatients),      sub: 'cadastrados hoje',                  prog: 25,                                                      color: '#FBBF24', bg: '#FEF3C7', icon: 'user-plus', iconColor: '#FBBF24' },
  ];

  // Group transactions by weekday for bar chart
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const barData = days.map((day, i) => {
    const dayTxns = transactions.filter(t => new Date(t.date + 'T12:00:00').getDay() === i);
    const rec  = dayTxns.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0);
    const desp = dayTxns.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0);
    const max  = Math.max(...transactions.map(t => Number(t.amount)), 1);
    return { day, rec: Math.round(rec / max * 100), desp: Math.round(desp / max * 100) };
  });

  const pendRec  = transactions.filter(t => t.type === 'receita' && t.status === 'pendente');
  const pendDesp = transactions.filter(t => t.type === 'despesa' && t.status === 'pendente');
  const pendRecVal  = pendRec.reduce((s, t) => s + Number(t.amount), 0);
  const pendDespVal = pendDesp.reduce((s, t) => s + Number(t.amount), 0);

  const avatarColors = ['#DBEAFE','#FEF3C7','#F0FDFA','#F3E8FF','#FEE2E2'];
  const avatarText   = ['#0066D0','#92400E','#0F766E','#7C3AED','#991B1B'];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {kpis.map((k, i) => (
          <Card key={i} style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>{k.label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={k.icon} size={15} color={k.iconColor} />
              </div>
            </div>
            <div style={{ fontSize: k.value.startsWith('R$') ? 16 : 28, fontWeight: 700, color: '#111827', lineHeight: 1, marginBottom: 5 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{k.sub}</div>
            <div style={{ height: 5, background: '#F3F4F6', borderRadius: 9999, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: k.prog + '%', background: k.color, borderRadius: 9999 }} />
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Fila de Atendimento</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Hoje · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
          </div>
          {appointments.length === 0
            ? <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Nenhum agendamento hoje</div>
            : appointments.slice(0, 6).map((a, i) => {
                const name = a.patients?.name ?? 'Paciente';
                const ini  = initials(name);
                const col  = avatarColors[i % avatarColors.length];
                const tc   = avatarText[i % avatarText.length];
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 16px', borderBottom: i < appointments.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                    <div style={{ width: 35, height: 35, borderRadius: '50%', background: col, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{ini}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{a.start_time?.slice(0,5)} · {a.type.replace('_',' ')}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {statusBadge(a.status)}
                      {a.status === 'aguardando' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button style={{ height: 24, padding: '0 8px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Chamar</button>
                          <button style={{ height: 24, padding: '0 8px', background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Prontuário</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          }
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Fluxo de Caixa da Semana</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date().toLocaleDateString('pt-BR',{month:'short',day:'2-digit'})}</span>
          </div>
          <div style={{ padding: '12px 16px 8px' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>Saldo do período</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>
              <span style={{ color: saldo >= 0 ? '#10B981' : '#EF4444' }}>{fmtCurrency(saldo)}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {[{ dot: '#0066D0', label: 'Receitas', val: fmtCurrency(receitas) }, { dot: '#EF4444', label: 'Despesas', val: fmtCurrency(despesas) }].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.dot }} />
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '0 16px 8px' }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 80 }}>
              {barData.map((b, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', width: '100%', height: 66 }}>
                    <div style={{ flex: 1, background: '#BFDBFE', height: (b.rec || 3) + '%', borderRadius: '2px 2px 0 0', minHeight: 3 }} />
                    <div style={{ flex: 1, background: '#FECACA', height: (b.desp || 3) + '%', borderRadius: '2px 2px 0 0', minHeight: 3 }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>{b.day}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ margin: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Receitas pendentes', val: fmtCurrency(pendRecVal),  color: '#0066D0', n: `${pendRec.length} transações` },
              { label: 'Despesas pendentes', val: fmtCurrency(pendDespVal), color: '#EF4444', n: `${pendDesp.length} transações` },
            ].map((s, i) => (
              <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '9px 11px' }}>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{s.n}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   AGENDA SCREEN
───────────────────────────────────────── */
function Agenda() {
  const [view, setView]               = useState<'DIA' | 'SEMANA'>('SEMANA');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]         = useState(true);

  const TIMES = ['08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45','10:00','10:15','10:30','10:45','11:00','11:15','11:30'];

  const { start, end } = weekRange();

  const agendaDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start + 'T12:00:00');
    d.setDate(d.getDate() + i);
    const names = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    return {
      name: names[d.getDay()],
      date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      iso:  d.toISOString().split('T')[0],
      today: d.toISOString().split('T')[0] === todayISO(),
      weekend: d.getDay() === 0 || d.getDay() === 6,
    };
  });

  useEffect(() => {
    supabase.from('appointments')
      .select('*, patients(id, name)')
      .gte('date', start)
      .lte('date', end)
      .order('start_time')
      .then(({ data }) => { setAppointments((data as Appointment[]) ?? []); setLoading(false); });
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#0066D0' }}>guilherme teixeira</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { icon: 'plus',    label: 'Novo\nAgendamento' },
            { icon: 'list',    label: 'Lista de\nEspera' },
            { icon: 'printer', label: 'Imprimir\nAgenda' },
          ].map((a, i) => (
            <button key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '5px 10px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Icon name={a.icon} size={13} color="#6B7280" />
              <span style={{ fontSize: 10, color: '#6B7280', whiteSpace: 'pre-line', textAlign: 'center', lineHeight: 1.2 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>{agendaDays[0].date} – {agendaDays[6].date}</span>
        </div>
        <div style={{ display: 'flex' }}>
          {(['DIA', 'SEMANA'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ height: 28, padding: '0 12px', background: view === v ? '#EFF6FF' : '#fff', border: '1px solid #E5E7EB', fontSize: 12, fontWeight: view === v ? 600 : 400, color: view === v ? '#0066D0' : '#6B7280', cursor: 'pointer', fontFamily: 'inherit' }}>{v}</button>
          ))}
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7,1fr)', minWidth: 700 }}>
            <div style={{ borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }} />
            {agendaDays.map((d, i) => (
              <div key={i} style={{ borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '8px 6px', textAlign: 'center', background: d.today ? '#EFF6FF' : d.weekend ? '#FAFAFA' : '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: d.today ? '#0066D0' : '#374151' }}>{d.name}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>{d.date}</div>
              </div>
            ))}
            {TIMES.map((t, ti) => (
              <React.Fragment key={ti}>
                <div style={{ borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #F3F4F6', padding: '2px 6px', fontSize: 10, color: '#9CA3AF', textAlign: 'right' }}>{t}</div>
                {agendaDays.map((d, di) => {
                  const appts = appointments.filter(a => a.date === d.iso && a.start_time?.slice(0,5) === t);
                  return (
                    <div key={di} style={{ borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #F3F4F6', minHeight: 24, background: d.weekend ? '#FAFAFA' : '#fff', padding: 2 }}>
                      {appts.map(a => (
                        <div key={a.id} style={{ background: '#B2EBF2', borderLeft: `3px solid ${STATUS_COLORS[a.status]?.color ?? '#00BCD4'}`, borderRadius: 3, padding: '3px 6px', fontSize: 10, color: '#006064', lineHeight: 1.3 }}>
                          <div style={{ fontWeight: 600 }}>{a.start_time?.slice(0,5)}–{a.end_time?.slice(0,5)}</div>
                          <div>{a.patients?.name ?? 'Paciente'}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   PACIENTES SCREEN
───────────────────────────────────────── */
function Pacientes() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    supabase.from('patients').select('*').eq('active', true).order('name')
      .then(({ data }) => { setPatients((data as Patient[]) ?? []); setLoading(false); });
  }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.phone ?? '').includes(search)
  );

  const COLORS = ['#DBEAFE','#FEF3C7','#F0FDFA','#F3E8FF','#FEE2E2','#D1FAE5'];
  const TCOLORS= ['#0066D0','#92400E','#0F766E','#7C3AED','#991B1B','#065F46'];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Pacientes</div>
        <button style={{ height: 34, padding: '0 16px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Novo Paciente
        </button>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon name="search" size={14} color="#9CA3AF" />
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, email ou telefone…"
          style={{ width: '100%', height: 36, border: '1px solid #E5E7EB', borderRadius: 6, paddingLeft: 32, fontSize: 13, color: '#374151', fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
      </div>
      <div style={{ fontSize: 12, color: '#6B7280' }}>{filtered.length} paciente{filtered.length !== 1 ? 's' : ''}</div>
      {loading ? <Spinner /> : (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Paciente','Contato','Data de Nascimento','Convênio',''].map((h, i) => (
                  <th key={i} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>Nenhum paciente encontrado</td></tr>
                : filtered.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: COLORS[i % COLORS.length], color: TCOLORS[i % TCOLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials(p.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{p.phone ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{p.birth_date ? new Date(p.birth_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={{ padding: '10px 14px' }}><Badge variant="blue">{p.insurance ?? 'Particular'}</Badge></td>
                    <td style={{ padding: '10px 14px' }}>
                      <button style={{ height: 28, padding: '0 10px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 5, fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Ver prontuário</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   PRONTUÁRIO SCREEN
───────────────────────────────────────── */
function Prontuario() {
  const [activeSection, setActiveSection] = useState('historico');
  const [patients, setPatients]           = useState<Patient[]>([]);
  const [selected, setSelected]           = useState<Patient | null>(null);
  const [loading, setLoading]             = useState(true);

  const sections = [
    { id: 'historico', label: 'Histórico de Consulta' },
    { id: 'acomp',     label: 'Tabela de acompanhamentos' },
    { id: 'presc',     label: 'Prescrições' },
  ];

  useEffect(() => {
    supabase.from('patients').select('*').eq('active', true).order('name')
      .then(({ data }) => {
        const list = (data as Patient[]) ?? [];
        setPatients(list);
        if (list.length > 0) setSelected(list[0]);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner />;

  const anamnesisTitles = ['Antec. clínicos', 'Antec. cirúrgicos', 'Antec. familiares', 'Hábitos', 'Alergias'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 20px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <select value={selected?.id ?? ''} onChange={e => setSelected(patients.find(p => p.id === e.target.value) ?? null)}
            style={{ height: 34, border: '1px solid #E5E7EB', borderRadius: 6, padding: '0 10px', fontSize: 13, color: '#111827', background: '#fff', fontFamily: 'inherit', minWidth: 200 }}>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid #0066D0', borderRadius: 9999, fontSize: 12, color: '#0066D0', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon name="tag" size={11} color="#0066D0" /> Adicionar Tag +
          </button>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon name="clock" size={13} color="#fff" /> Iniciar atendimento
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sections.map(s => (
            <div key={s.id} onClick={() => setActiveSection(s.id)} style={{
              fontSize: 13, padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
              borderLeft: `3px solid ${activeSection === s.id ? '#0066D0' : 'transparent'}`,
              background: activeSection === s.id ? '#EFF6FF' : 'none',
              color: activeSection === s.id ? '#0066D0' : '#374151',
              fontWeight: activeSection === s.id ? 500 : 400,
            }}>{s.label}</div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#F9FAFB' }}>
        {selected ? (
          <Card style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#0066D0', flexShrink: 0 }}>{initials(selected.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
                  {selected.birth_date && <><strong>Idade:</strong> {Math.floor((Date.now() - new Date(selected.birth_date + 'T12:00:00').getTime()) / 31557600000)} anos &nbsp;·&nbsp; </>}
                  <strong>Convênio:</strong> {selected.insurance ?? 'Particular'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto' }}>
              {anamnesisTitles.map((a, i) => (
                <div key={i} style={{ flex: '0 0 150px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '10px 12px', minHeight: 60 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{a}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>Inserir informação</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              {[{ ic: 'download', label: 'Baixar PDF' }, { ic: 'printer', label: 'Imprimir' }, { ic: 'share', label: 'Compartilhar' }].map((b, i) => (
                <button key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Icon name={b.ic} size={12} /> {b.label}
                </button>
              ))}
            </div>
          </Card>
        ) : (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Nenhum paciente cadastrado</div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   FINANÇAS SCREEN
───────────────────────────────────────── */
function Financas() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod]             = useState('mes');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const now  = new Date();
    let start  = '';
    if (period === 'mes') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else if (period === 'semana') {
      start = weekRange().start;
    } else {
      start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    }
    setLoading(true);
    supabase.from('transactions').select('*').gte('date', start).order('date', { ascending: false })
      .then(({ data }) => { setTransactions((data as Transaction[]) ?? []); setLoading(false); });
  }, [period]);

  const receitas = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0);
  const despesas = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0);
  const saldo    = receitas - despesas;

  const days   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const maxAmt = Math.max(...transactions.map(t => Number(t.amount)), 1);
  const barData = days.map((day, i) => {
    const val = transactions.filter(t => new Date(t.date + 'T12:00:00').getDay() === i).reduce((s, t) => s + Number(t.amount), 0);
    return { day, h: Math.round(val / maxAmt * 100), active: new Date().getDay() === i };
  });

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Análise financeira</div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Gerar relatório</button>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>Período</span>
        <select value={period} onChange={e => setPeriod(e.target.value)} style={{ height: 32, border: '1px solid #E5E7EB', borderRadius: 6, padding: '0 8px', fontSize: 13, color: '#111827', background: '#fff', fontFamily: 'inherit' }}>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mês</option>
          <option value="ano">Este ano</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[{ label: 'RECEITA', color: '#0066D0', type: 'receita' }, { label: 'DESPESA', color: '#EF4444', type: 'despesa' }, { label: 'TRANSFERÊNCIA', color: '#6B7280', type: 'transferencia' }].map((b, i) => (
          <button key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 18px', background: b.color, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon name="plus" size={13} color="#fff" /> {b.label}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Card style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Saldo total</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: saldo >= 0 ? '#0066D0' : '#EF4444' }}>{fmtCurrency(saldo)}</div>
            </Card>
            <Card style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Total Receitas</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>{fmtCurrency(receitas)}</div>
            </Card>
            <Card style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Total Despesas</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#EF4444' }}>{fmtCurrency(despesas)}</div>
            </Card>
          </div>
          <Card style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Balanço semanal</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
              {barData.map((b, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: (b.h || 3) + '%', background: b.active ? '#0066D0' : '#DBEAFE', borderRadius: '3px 3px 0 0', minHeight: 4 }} />
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>{b.day}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Últimas transações</span>
            </div>
            {transactions.length === 0
              ? <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Nenhuma transação no período</div>
              : transactions.slice(0, 10).map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < 9 ? '1px solid #F9FAFB' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: t.type === 'receita' ? '#D1FAE5' : t.type === 'despesa' ? '#FEE2E2' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="dollar" size={15} color={t.type === 'receita' ? '#065F46' : t.type === 'despesa' ? '#991B1B' : '#6B7280'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{t.description ?? t.category ?? t.type}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')} · {t.payment_method ?? '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.type === 'receita' ? '#10B981' : t.type === 'despesa' ? '#EF4444' : '#6B7280' }}>
                      {t.type === 'receita' ? '+' : t.type === 'despesa' ? '-' : ''}{fmtCurrency(Number(t.amount))}
                    </div>
                    <div style={{ marginTop: 2 }}><Badge variant={t.status === 'concluido' ? 'green' : t.status === 'cancelado' ? 'gray' : 'yellow'}>{t.status}</Badge></div>
                  </div>
                </div>
              ))
            }
          </Card>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   ESTOQUE SCREEN
───────────────────────────────────────── */
function Estoque() {
  const [items,   setItems]   = useState<InventoryItem[]>([]);
  const [tab,     setTab]     = useState('TODOS');
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const tabs = ['TODOS', 'ESTOQUE BAIXO', 'VENCE EM 30 DIAS', 'PRODUTOS VENCIDOS'];

  const load = () => {
    setLoading(true);
    supabase.from('inventory_items').select('*').eq('active', true).order('name')
      .then(({ data }) => { setItems((data as InventoryItem[]) ?? []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const today30 = new Date(); today30.setDate(today30.getDate() + 30);
  const t30iso  = today30.toISOString().split('T')[0];

  const filtered = items.filter(p => {
    if (tab === 'ESTOQUE BAIXO')     return p.quantity <= p.min_quantity;
    if (tab === 'VENCE EM 30 DIAS')  return p.expiry_date && p.expiry_date <= t30iso && p.expiry_date >= todayISO();
    if (tab === 'PRODUTOS VENCIDOS') return p.expiry_date && p.expiry_date < todayISO();
    return true;
  }).filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.code ?? '').toLowerCase().includes(search.toLowerCase()));

  const lowStock  = items.filter(p => p.quantity <= p.min_quantity).length;
  const expiring  = items.filter(p => p.expiry_date && p.expiry_date <= t30iso && p.expiry_date >= todayISO()).length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Meu Estoque</div>
          {(lowStock > 0 || expiring > 0) && (
            <div style={{ fontSize: 12, color: '#EF4444', marginTop: 2 }}>
              {lowStock > 0 && `${lowStock} item(ns) com estoque baixo`}
              {lowStock > 0 && expiring > 0 && ' · '}
              {expiring > 0 && `${expiring} item(ns) próximo(s) do vencimento`}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ height: 32, padding: '0 12px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="refresh" size={12} color="#6B7280" /> Atualizar
          </button>
          <button style={{ height: 32, padding: '0 14px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Adicionar produto</button>
          <button style={{ height: 32, padding: '0 14px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>ENTRADA</button>
          <button style={{ height: 32, padding: '0 14px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>SAÍDA</button>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: '8px 8px 0 0', borderBottom: '1px solid #E5E7EB', display: 'flex', padding: '0 8px' }}>
        {tabs.map(t => (
          <div key={t} onClick={() => setTab(t)} style={{
            padding: '10px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            color: tab === t ? '#0066D0' : '#6B7280',
            borderBottom: `2px solid ${tab === t ? '#0066D0' : 'transparent'}`,
            marginBottom: -1,
          }}>{t}</div>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon name="search" size={14} color="#9CA3AF" />
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', height: 36, border: '1px solid #E5E7EB', borderRadius: 6, paddingLeft: 32, fontSize: 13, color: '#374151', fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          placeholder="Pesquise por nome ou código do produto" />
      </div>
      <div style={{ fontSize: 12, color: '#6B7280' }}>Exibindo: {filtered.length} produto{filtered.length !== 1 ? 's' : ''}</div>
      {loading ? <Spinner /> : (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['', 'PRODUTO', 'CÓD.', 'QUANT.', 'VENCIMENTO', 'ESTOQUE MÍN.', 'STATUS'].map((h, i) => (
                  <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                    {h === '' ? <input type="checkbox" /> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>Nenhum produto encontrado</td></tr>
                : filtered.map((p, i) => {
                    const isLow     = p.quantity <= p.min_quantity;
                    const isExpiring= p.expiry_date && p.expiry_date <= t30iso && p.expiry_date >= todayISO();
                    const isExpired = p.expiry_date && p.expiry_date < todayISO();
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 12px' }}><input type="checkbox" /></td>
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: '#111827' }}>{p.name}</td>
                        <td style={{ padding: '10px 12px', color: '#9CA3AF', fontFamily: 'monospace' }}>{p.code ?? '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>{p.quantity} {p.unit ?? 'un'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {p.expiry_date
                            ? <Badge variant={isExpired ? 'red' : isExpiring ? 'yellow' : 'green'}>{new Date(p.expiry_date + 'T12:00:00').toLocaleDateString('pt-BR')}</Badge>
                            : <span style={{ color: '#D1D5DB' }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>{p.min_quantity}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {isExpired   ? <Badge variant="red">Vencido</Badge>
                           : isLow     ? <Badge variant="red">Estoque baixo</Badge>
                           : isExpiring? <Badge variant="yellow">Vence em breve</Badge>
                           :             <Badge variant="green">Normal</Badge>
                          }
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   APP ROOT
───────────────────────────────────────── */
export default function MedFlow() {
  const [screen,    setScreen]    = useState<NavId>('dashboard');
  const [tabs,      setTabs]      = useState<Tab[]>([
    { id: 'dashboard', label: 'Painel', icon: 'grid', closeable: false },
  ]);
  const [activeTab, setActiveTab] = useState<NavId>('dashboard');
  const [agendaBadge, setAgendaBadge] = useState(0);
  const [notifCount,  setNotifCount]  = useState(0);

  useEffect(() => {
    // Contagem real de agendamentos aguardando hoje
    supabase.from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('date', todayISO())
      .in('status', ['aguardando', 'agendado'])
      .then(({ count }) => setAgendaBadge(count ?? 0));

    supabase.from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
      .then(({ count }) => setNotifCount(count ?? 0));
  }, []);

  const handleNavigate = (id: NavId) => {
    setScreen(id);
    const item = NAV_ITEMS.find(n => n.id === id);
    if (!item) return;
    if (!tabs.find(t => t.id === id)) {
      setTabs(prev => [...prev, { id, label: item.label, icon: item.icon, closeable: true }]);
    }
    setActiveTab(id);
  };

  const handleCloseTab = (id: NavId) => {
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id) {
      const last = newTabs[newTabs.length - 1];
      setActiveTab(last.id);
      setScreen(last.id);
    }
  };

  const screenMap: Partial<Record<NavId, React.ReactNode>> = {
    dashboard:  <Dashboard />,
    agenda:     <Agenda />,
    prontuario: <Prontuario />,
    pacientes:  <Pacientes />,
    financas:   <Financas />,
    estoque:    <Estoque />,
  };

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar active={screen} onNavigate={handleNavigate} agendaBadge={agendaBadge} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar screen={screen} notifCount={notifCount} />
        <InternalTabs tabs={tabs} activeTab={activeTab} onSelect={handleNavigate} onClose={handleCloseTab} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {screenMap[screen] ?? <Dashboard />}
        </div>
      </div>
    </div>
  );
}
