'use client';
import React, { useState, useEffect, CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import WeeklyCalendar from '@/components/calendar/WeeklyCalendar';

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
function Topbar({ screen, notifCount, onNewAppointment, onNewPatient, onNewProfessional, onNewReceptionist }: {
  screen: NavId; notifCount: number;
  onNewAppointment: () => void;
  onNewPatient: () => void;
  onNewProfessional: () => void;
  onNewReceptionist: () => void;
}) {
  const label = NAV_ITEMS.find(n => n.id === screen)?.label ?? 'Painel';
  const [showMenu, setShowMenu] = useState(false);

  const menuItems = [
    { label: 'Novo Agendamento',         icon: 'calendar',  action: () => { setShowMenu(false); onNewAppointment(); } },
    { label: 'Adicionar Paciente',       icon: 'user-plus', action: () => { setShowMenu(false); onNewPatient(); } },
    { label: 'Adicionar Prof. de Saúde', icon: 'user-plus', action: () => { setShowMenu(false); onNewProfessional(); } },
    { label: 'Adicionar Recepcionista',  icon: 'user-plus', action: () => { setShowMenu(false); onNewReceptionist(); } },
  ];

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
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* + button com dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(p => !p)} style={{
            width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: '#6B7280', border: 'none', cursor: 'pointer',
          }}>
            <Icon name="plus" size={16} color="#fff" />
          </button>
          {showMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowMenu(false)} />
              <div style={{
                position: 'absolute', top: 40, right: 0, background: '#fff',
                border: '1px solid #E5E7EB', borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 210, overflow: 'hidden',
              }}>
                {menuItems.map((item, i) => (
                  <button key={i} onClick={item.action} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: '#374151', fontFamily: 'inherit', textAlign: 'left',
                    borderBottom: i < menuItems.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Icon name={item.icon} size={14} color="#6B7280" />
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
        <button style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', position: 'relative' }}>
          <Icon name="bell" size={16} />
          {notifCount > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: '#EF4444', borderRadius: '50%', border: '1.5px solid #fff' }} />}
        </button>
        <button style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
          <Icon name="message" size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginLeft: 2 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#0066D0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>GT</div>
          <Icon name="chevron-down" size={12} color="#6B7280" />
        </div>
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
  id: string; patient_id: string; doctor_id?: string; date: string; start_time: string; end_time: string;
  type: string; status: string; notes?: string; insurance?: string;
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
interface MedicalRecord {
  id: string; patient_id: string; doctor_id?: string;
  clinical_history?: string; surgical_history?: string; family_history?: string;
  habits?: string; allergies?: string;
  complaint?: string; evolution?: string; diagnosis?: string;
  diagnosis_code?: string; conduct?: string;
  return_date?: string; return_notes?: string;
  created_at: string;
}
interface Prescription {
  id: string; patient_id: string; medical_record_id?: string;
  medication: string; dosage?: string; frequency?: string;
  duration?: string; instructions?: string;
  created_at: string;
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
function Dashboard({ onNavigateProntuario }: { onNavigateProntuario?: (patientId: string) => void }) {
  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [transactions,  setTransactions]  = useState<Transaction[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [newPtsWeek,    setNewPtsWeek]    = useState(0);
  const [lowStock,      setLowStock]      = useState<InventoryItem[]>([]);
  const [loading,       setLoading]       = useState(true);

  // Analytics section state
  type DocItem = { id: string; name: string };
  const [anPeriod,   setAnPeriod]   = useState('30dias');
  const [anProf,     setAnProf]     = useState('todos');
  const [anDoctors,  setAnDoctors]  = useState<DocItem[]>([]);
  const [anAppts,    setAnAppts]    = useState<Appointment[]>([]);
  const [anPatients, setAnPatients] = useState<Patient[]>([]);
  const [anAvgDur,   setAnAvgDur]   = useState(0);
  const [anLoading,  setAnLoading]  = useState(true);

  const load = () => {
    const today = todayISO();
    const { start, end } = weekRange();
    setLoading(true);
    Promise.all([
      supabase.from('appointments').select('*, patients(id,name,insurance)').eq('date', today).order('start_time'),
      supabase.from('transactions').select('*').gte('date', start).lte('date', end),
      supabase.from('patients').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', start + 'T00:00:00'),
      supabase.from('inventory_items').select('*').eq('active', true).filter('quantity', 'lte', 'min_quantity'),
    ]).then(([appt, txn, total, newPts, stock]) => {
      setAppointments((appt.data as Appointment[]) ?? []);
      setTransactions((txn.data as Transaction[]) ?? []);
      setTotalPatients(total.count ?? 0);
      setNewPtsWeek(newPts.count ?? 0);
      const allStock = (stock.data as InventoryItem[]) ?? [];
      setLowStock(allStock.filter(i => i.quantity <= i.min_quantity));
      setLoading(false);
    });
  };

  useEffect(() => {
    supabase.from('doctors').select('id,name').eq('active', true)
      .then(({ data }) => setAnDoctors((data as DocItem[]) ?? []));
  }, []);

  useEffect(() => {
    const now = new Date();
    let start = '';
    if      (anPeriod === '7dias')  { const d = new Date(now); d.setDate(d.getDate()-7);  start = d.toISOString().split('T')[0]; }
    else if (anPeriod === '30dias') { const d = new Date(now); d.setDate(d.getDate()-30); start = d.toISOString().split('T')[0]; }
    else if (anPeriod === 'mes')    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    else                            start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    setAnLoading(true);
    let apptQ = supabase.from('appointments').select('*').gte('date', start);
    if (anProf !== 'todos') apptQ = apptQ.eq('doctor_id', anProf);
    Promise.all([
      apptQ,
      supabase.from('patients').select('id,gender,insurance,created_at').eq('active', true),
      supabase.from('medical_records').select('duration_seconds').gte('created_at', start+'T00:00:00').not('duration_seconds','is',null),
    ]).then(([appt, pts, recs]) => {
      setAnAppts((appt.data as Appointment[]) ?? []);
      setAnPatients((pts.data as unknown as Patient[]) ?? []);
      const dr = (recs.data as { duration_seconds: number }[]) ?? [];
      const TYPE_DUR: Record<string,number> = { consulta:30, retorno:15, primeira_consulta:45, avaliacao:30, exame:60, procedimento:45, teleconsulta:20 };
      if (dr.length > 0) setAnAvgDur(Math.round(dr.reduce((s,r) => s+r.duration_seconds,0) / dr.length / 60));
      else {
        const ad = (appt.data as Appointment[]) ?? [];
        setAnAvgDur(ad.length > 0 ? Math.round(ad.reduce((s,a) => s+(TYPE_DUR[a.type]??30),0)/ad.length) : 0);
      }
      setAnLoading(false);
    });
  }, [anPeriod, anProf]);

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;

  const today      = todayISO();
  const confirmed  = appointments.filter(a => ['confirmado','agendado'].includes(a.status)).length;
  const attended   = appointments.filter(a => a.status === 'concluido').length;
  const waiting    = appointments.filter(a => a.status === 'aguardando').length;
  const totalAppt  = appointments.length;
  const receitas   = transactions.filter(t => t.type === 'receita').reduce((s,t) => s + Number(t.amount), 0);
  const despesas   = transactions.filter(t => t.type === 'despesa').reduce((s,t) => s + Number(t.amount), 0);
  const saldo      = receitas - despesas;
  const pendRec    = transactions.filter(t => t.type === 'receita' && t.status === 'pendente');
  const pendDesp   = transactions.filter(t => t.type === 'despesa' && t.status === 'pendente');
  const pendRecVal = pendRec.reduce((s,t) => s + Number(t.amount), 0);
  const pendDespVal= pendDesp.reduce((s,t) => s + Number(t.amount), 0);

  const kpis = [
    { label:'Pacientes do Dia',        value:String(totalAppt),       sub:`${confirmed} confirmados · ${waiting} aguardando`, prog:totalAppt?Math.round(confirmed/totalAppt*100):0, color:'#0066D0', bg:'#EFF6FF', icon:'user',      iconColor:'#0066D0' },
    { label:'Faturamento da Semana',   value:fmtCurrency(receitas),   sub:`saldo ${fmtCurrency(saldo)}`,                      prog:receitas?Math.round((receitas-despesas)/receitas*100):0, color:'#14B8A6', bg:'#F0FDFA', icon:'dollar',    iconColor:'#14B8A6' },
    { label:'Atendimentos Realizados', value:String(attended),        sub:`de ${totalAppt} agendados hoje`,                   prog:totalAppt?Math.round(attended/totalAppt*100):0,   color:'#10B981', bg:'#D1FAE5', icon:'check',     iconColor:'#10B981' },
    { label:'Total de Pacientes',      value:String(totalPatients),   sub:`${newPtsWeek} novo${newPtsWeek!==1?'s':''} esta semana`, prog:Math.min(totalPatients,100),                 color:'#FBBF24', bg:'#FEF3C7', icon:'user-plus', iconColor:'#FBBF24' },
  ];

  const days   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const maxRec = Math.max(...days.map((_,i) => transactions.filter(t=>t.type==='receita'&&new Date(t.date+'T12:00:00').getDay()===i).reduce((s,t)=>s+Number(t.amount),0)),1);
  const barData = days.map((day, i) => {
    const rec  = transactions.filter(t=>t.type==='receita'&&new Date(t.date+'T12:00:00').getDay()===i).reduce((s,t)=>s+Number(t.amount),0);
    const desp = transactions.filter(t=>t.type==='despesa'&&new Date(t.date+'T12:00:00').getDay()===i).reduce((s,t)=>s+Number(t.amount),0);
    return { day, rec, desp, recH:Math.round(rec/maxRec*100), despH:Math.round(desp/maxRec*100), active:new Date().getDay()===i };
  });

  const avatarColors = ['#DBEAFE','#FEF3C7','#F0FDFA','#F3E8FF','#FEE2E2'];
  const avatarText   = ['#0066D0','#92400E','#0F766E','#7C3AED','#991B1B'];

  const updateStatus = (id: string, status: string) =>
    supabase.from('appointments').update({ status }).eq('id', id)
      .then(() => setAppointments(prev => prev.map(x => x.id===id ? {...x,status} : x)));

  // Alertas
  const alerts: { icon: string; color: string; bg: string; text: string }[] = [];
  if (waiting > 0) alerts.push({ icon:'user', color:'#0066D0', bg:'#EFF6FF', text:`${waiting} paciente${waiting>1?'s':''} aguardando atendimento` });
  lowStock.forEach(i => alerts.push({ icon:'alert', color:'#EF4444', bg:'#FEF2F2', text:`Estoque baixo: ${i.name} (${i.quantity} ${i.unit??'un'})` }));
  if (pendRecVal > 0) alerts.push({ icon:'dollar', color:'#FBBF24', bg:'#FEF3C7', text:`${pendRec.length} receita${pendRec.length>1?'s':''} pendente${pendRec.length>1?'s':''}: ${fmtCurrency(pendRecVal)}` });
  if (pendDespVal > 0) alerts.push({ icon:'dollar', color:'#EF4444', bg:'#FEE2E2', text:`${pendDesp.length} despesa${pendDesp.length>1?'s':''} pendente${pendDesp.length>1?'s':''}: ${fmtCurrency(pendDespVal)}` });

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px 22px', background:'#F9FAFB', display:'flex', flexDirection:'column', gap:14 }}>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {kpis.map((k,i) => (
          <Card key={i} style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <span style={{ fontSize:12, fontWeight:500, color:'#6B7280' }}>{k.label}</span>
              <div style={{ width:30, height:30, borderRadius:7, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={k.icon} size={15} color={k.iconColor} />
              </div>
            </div>
            <div style={{ fontSize:k.value.startsWith('R$')?16:28, fontWeight:700, color:'#111827', lineHeight:1, marginBottom:5 }}>{k.value}</div>
            <div style={{ fontSize:11, color:'#9CA3AF' }}>{k.sub}</div>
            <div style={{ height:5, background:'#F3F4F6', borderRadius:9999, marginTop:10, overflow:'hidden' }}>
              <div style={{ height:'100%', width:Math.max(0,Math.min(100,k.prog))+'%', background:k.color, borderRadius:9999 }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Alertas — só aparece se houver algo */}
      {alerts.length > 0 && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {alerts.map((a,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 12px', background:a.bg, borderRadius:8, border:`1px solid ${a.color}22`, flex:'0 0 auto', maxWidth:'100%' }}>
              <Icon name={a.icon} size={13} color={a.color} />
              <span style={{ fontSize:12, color:a.color, fontWeight:500 }}>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

        {/* Fila de Atendimento */}
        <Card>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>Fila de Atendimento</span>
            <span style={{ fontSize:12, color:'#9CA3AF' }}>Hoje · {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>
          </div>
          {appointments.length === 0
            ? <div style={{ padding:'24px 16px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Nenhum agendamento hoje</div>
            : appointments.slice(0,6).map((a,i) => {
                const name = a.patients?.name ?? 'Paciente';
                const col  = avatarColors[i % avatarColors.length];
                const tc   = avatarText[i % avatarText.length];
                const isDone = ['concluido','faltou','cancelado'].includes(a.status);
                return (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 16px', borderBottom:i<Math.min(appointments.length,6)-1?'1px solid #F9FAFB':'none', opacity:isDone?0.55:1 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:col, color:tc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>{initials(name)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
                      <div style={{ fontSize:11, color:'#9CA3AF' }}>{a.start_time?.slice(0,5)} · {a.type.replace(/_/g,' ')}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                      {statusBadge(a.status)}
                      {a.status === 'agendado' && (
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => updateStatus(a.id,'confirmado')} style={{ height:22, padding:'0 7px', background:'#10B981', color:'#fff', border:'none', borderRadius:4, fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Confirmar</button>
                          <button onClick={() => a.patient_id && onNavigateProntuario?.(a.patient_id)} style={{ height:22, padding:'0 7px', background:'#fff', color:'#374151', border:'1px solid #E5E7EB', borderRadius:4, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>Prontuário</button>
                        </div>
                      )}
                      {a.status === 'confirmado' && (
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => updateStatus(a.id,'aguardando')} style={{ height:22, padding:'0 7px', background:'#FBBF24', color:'#fff', border:'none', borderRadius:4, fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Check-in</button>
                          <button onClick={() => a.patient_id && onNavigateProntuario?.(a.patient_id)} style={{ height:22, padding:'0 7px', background:'#fff', color:'#374151', border:'1px solid #E5E7EB', borderRadius:4, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>Prontuário</button>
                        </div>
                      )}
                      {a.status === 'aguardando' && (
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => updateStatus(a.id,'em_atendimento')} style={{ height:22, padding:'0 7px', background:'#0066D0', color:'#fff', border:'none', borderRadius:4, fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Chamar</button>
                          <button onClick={() => a.patient_id && onNavigateProntuario?.(a.patient_id)} style={{ height:22, padding:'0 7px', background:'#fff', color:'#374151', border:'1px solid #E5E7EB', borderRadius:4, fontSize:10, cursor:'pointer', fontFamily:'inherit' }}>Prontuário</button>
                        </div>
                      )}
                      {a.status === 'em_atendimento' && (
                        <button onClick={() => updateStatus(a.id,'concluido')} style={{ height:22, padding:'0 7px', background:'#10B981', color:'#fff', border:'none', borderRadius:4, fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Concluir</button>
                      )}
                    </div>
                  </div>
                );
              })
          }
        </Card>

        {/* Fluxo de Caixa */}
        <Card style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>Fluxo de Caixa da Semana</span>
            <span style={{ fontSize:12, color:'#9CA3AF' }}>{new Date().toLocaleDateString('pt-BR',{month:'short',day:'2-digit'})}</span>
          </div>
          <div style={{ padding:'12px 16px 8px' }}>
            <div style={{ fontSize:11, color:'#6B7280', marginBottom:2 }}>Saldo do período</div>
            <div style={{ fontSize:22, fontWeight:700, color: saldo>=0?'#10B981':'#EF4444' }}>{fmtCurrency(saldo)}</div>
            <div style={{ display:'flex', gap:16, marginTop:6 }}>
              {[{dot:'#0066D0',label:'Receitas',val:fmtCurrency(receitas)},{dot:'#EF4444',label:'Despesas',val:fmtCurrency(despesas)}].map((s,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:s.dot }} />
                  <span style={{ fontSize:11, color:'#9CA3AF' }}>{s.label}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Gráfico com valores */}
          <div style={{ padding:'0 16px 4px' }}>
            <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:90 }}>
              {barData.map((b,i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
                  {b.rec > 0 && <div style={{ fontSize:9, color:'#0066D0', fontWeight:600, marginBottom:2, whiteSpace:'nowrap' }}>
                    {b.rec >= 1000 ? `${(b.rec/1000).toFixed(1)}k` : String(Math.round(b.rec))}
                  </div>}
                  <div style={{ display:'flex', gap:2, alignItems:'flex-end', width:'100%', height:66 }}>
                    <div style={{ flex:1, background: b.active?'#3B82F6':'#BFDBFE', height:(b.recH||3)+'%', borderRadius:'2px 2px 0 0', minHeight:3, transition:'height 0.3s' }} />
                    <div style={{ flex:1, background: b.active?'#F87171':'#FECACA', height:(b.despH||3)+'%', borderRadius:'2px 2px 0 0', minHeight:3, transition:'height 0.3s' }} />
                  </div>
                  <div style={{ fontSize:10, color:b.active?'#111827':'#9CA3AF', marginTop:3, fontWeight:b.active?600:400 }}>{b.day}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Pendentes — só mostra se houver */}
          {(pendRecVal > 0 || pendDespVal > 0) ? (
            <div style={{ margin:'4px 16px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {pendRecVal > 0 && (
                <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:6, padding:'8px 11px' }}>
                  <div style={{ fontSize:11, color:'#6B7280', marginBottom:2 }}>Receitas pendentes</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#10B981' }}>{fmtCurrency(pendRecVal)}</div>
                  <div style={{ fontSize:10, color:'#9CA3AF', marginTop:1 }}>{pendRec.length} transação{pendRec.length>1?'s':''}</div>
                </div>
              )}
              {pendDespVal > 0 && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:6, padding:'8px 11px' }}>
                  <div style={{ fontSize:11, color:'#6B7280', marginBottom:2 }}>Despesas pendentes</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#EF4444' }}>{fmtCurrency(pendDespVal)}</div>
                  <div style={{ fontSize:10, color:'#9CA3AF', marginTop:1 }}>{pendDesp.length} transação{pendDesp.length>1?'s':''}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ margin:'4px 16px 14px', padding:'8px 11px', background:'#F0FDF4', borderRadius:6, display:'flex', alignItems:'center', gap:6 }}>
              <Icon name="check" size={13} color="#10B981" />
              <span style={{ fontSize:12, color:'#10B981', fontWeight:500 }}>Sem pendências financeiras esta semana</span>
            </div>
          )}
        </Card>
      </div>

      {/* Linha do tempo do dia */}
      <Card>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>Agenda de Hoje</span>
          <span style={{ fontSize:12, color:'#9CA3AF' }}>{appointments.length} agendamento{appointments.length!==1?'s':''}</span>
        </div>
        {appointments.length === 0
          ? <div style={{ padding:'20px 16px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Nenhum agendamento para hoje</div>
          : (
            <div style={{ padding:'12px 16px', display:'flex', gap:0, overflowX:'auto', alignItems:'stretch', minHeight:80 }}>
              {appointments.map((a,i) => {
                const statusColor: Record<string,string> = { agendado:'#0066D0', confirmado:'#10B981', aguardando:'#FBBF24', em_atendimento:'#8B5CF6', concluido:'#6B7280', faltou:'#EF4444', cancelado:'#9CA3AF' };
                const col = statusColor[a.status] ?? '#9CA3AF';
                return (
                  <div key={a.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:72, position:'relative', flex:'0 0 auto' }}>
                    {i < appointments.length-1 && (
                      <div style={{ position:'absolute', top:18, left:'50%', width:'100%', height:2, background:'#F3F4F6', zIndex:0 }} />
                    )}
                    <div style={{ width:36, height:36, borderRadius:'50%', background:col+'22', border:`2px solid ${col}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:col, zIndex:1, flexShrink:0 }}>
                      {a.start_time?.slice(0,5)}
                    </div>
                    <div style={{ fontSize:11, fontWeight:600, color:'#111827', marginTop:6, textAlign:'center', maxWidth:68, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {(a.patients?.name ?? 'Paciente').split(' ')[0]}
                    </div>
                    <div style={{ fontSize:10, color:col, fontWeight:500, marginTop:1 }}>{a.status.replace('_',' ')}</div>
                  </div>
                );
              })}
            </div>
          )
        }
      </Card>

      {/* ── Analytics Section ── */}
      {(() => {
        const PROC_COLORS = ['#F59E0B','#0066D0','#10B981','#7C3AED','#EF4444','#EC4899','#06B6D4'];
        const anConcluidos  = anAppts.filter(a => a.status === 'concluido').length;
        const anFaltaram    = anAppts.filter(a => a.status === 'faltou').length;
        const anConfirmados = anAppts.filter(a => ['confirmado','aguardando','em_atendimento','concluido'].includes(a.status)).length;
        const anTotalPts    = anPatients.length;
        const now3 = new Date();
        let anStart = '';
        if      (anPeriod === '7dias')  { const d = new Date(now3); d.setDate(d.getDate()-7);  anStart = d.toISOString().split('T')[0]; }
        else if (anPeriod === '30dias') { const d = new Date(now3); d.setDate(d.getDate()-30); anStart = d.toISOString().split('T')[0]; }
        else if (anPeriod === 'mes')    anStart = new Date(now3.getFullYear(), now3.getMonth(), 1).toISOString().split('T')[0];
        else                            anStart = new Date(now3.getFullYear(), 0, 1).toISOString().split('T')[0];
        const novos       = anPatients.filter(p => ((p as any).created_at??'').slice(0,10) >= anStart).length;
        const recorrentes = Math.max(0, anTotalPts - novos);
        const novosPct    = anTotalPts > 0 ? Math.round(novos/anTotalPts*100) : 0;
        const homens      = anPatients.filter(p => p.gender === 'M').length;
        const mulheres    = anPatients.filter(p => p.gender === 'F').length;
        const homensPct   = anTotalPts > 0 ? Math.round(homens/anTotalPts*100) : 0;
        const mulheresPct = anTotalPts > 0 ? Math.round(mulheres/anTotalPts*100) : 0;
        const convenioA   = anAppts.filter(a => a.insurance && a.insurance !== 'Particular').length;
        const particularA = anAppts.length - convenioA;
        const convPct     = anAppts.length > 0 ? Math.round(convenioA/anAppts.length*100)   : 0;
        const partPct     = anAppts.length > 0 ? Math.round(particularA/anAppts.length*100) : 0;
        const PROC_TYPES  = [{value:'consulta',label:'Consulta'},{value:'retorno',label:'Retorno'},{value:'primeira_consulta',label:'1ª Consulta'},{value:'avaliacao',label:'Avaliação'},{value:'exame',label:'Exame'},{value:'procedimento',label:'Procedimento'},{value:'teleconsulta',label:'Teleconsulta'}];
        const byType      = PROC_TYPES.map(t => ({ label:t.label, count:anAppts.filter(a=>a.type===t.value).length })).filter(t=>t.count>0).sort((a,b)=>b.count-a.count);
        const totalProcs  = byType.reduce((s,t) => s+t.count, 0);
        return (
          <>
            {/* Header filtros */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:13, fontWeight:600, color:'#111827', flex:1 }}>Análise do Período</span>
              <span style={{ fontSize:13, color:'#6B7280' }}>Período</span>
              <select value={anPeriod} onChange={e => setAnPeriod(e.target.value)}
                style={{ height:30, border:'1px solid #E5E7EB', borderRadius:6, padding:'0 8px', fontSize:12, color:'#111827', background:'#fff', fontFamily:'inherit' }}>
                <option value="7dias">Últimos 7 dias</option>
                <option value="30dias">Últimos 30 dias</option>
                <option value="mes">Este mês</option>
                <option value="ano">Este ano</option>
              </select>
              <span style={{ fontSize:13, color:'#6B7280' }}>Profissional</span>
              <select value={anProf} onChange={e => setAnProf(e.target.value)}
                style={{ height:30, border:'1px solid #E5E7EB', borderRadius:6, padding:'0 8px', fontSize:12, color:'#111827', background:'#fff', fontFamily:'inherit', minWidth:160 }}>
                <option value="todos">Todos</option>
                {anDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {/* KPIs atendimentos */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {([
                { label:'Pacientes agendados',    value:anAppts.length, numColor:'#374151', iconBg:'#F3F4F6', iconColor:'#6B7280', icon:'calendar' },
                { label:'Pacientes confirmados',  value:anConfirmados,   numColor:'#0066D0', iconBg:'#EFF6FF', iconColor:'#0066D0', icon:'check' },
                { label:'Pacientes atendidos',    value:anConcluidos,    numColor:'#10B981', iconBg:'#D1FAE5', iconColor:'#10B981', icon:'check' },
                { label:'Pacientes que faltaram', value:anFaltaram,      numColor:'#EF4444', iconBg:'#FEE2E2', iconColor:'#EF4444', icon:'bell' },
              ] as const).map((k,i) => (
                <Card key={i} style={{ padding:'14px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, textAlign:'center' }}>
                  <div style={{ fontSize:32, fontWeight:700, color:k.numColor, lineHeight:1 }}>{k.value}</div>
                  <div style={{ fontSize:12, color:'#6B7280' }}>{k.label}</div>
                  <div style={{ width:32, height:32, borderRadius:8, background:k.iconBg, display:'flex', alignItems:'center', justifyContent:'center', marginTop:2 }}>
                    <Icon name={k.icon} size={15} color={k.iconColor} />
                  </div>
                </Card>
              ))}
            </div>

            {/* 4 gráficos */}
            {anLoading ? <Spinner /> : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>

                {/* Pacientes */}
                <Card style={{ padding:'14px 16px' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0066D0', marginBottom:10 }}>Pacientes</div>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
                    <DonutChart pct={novosPct} size={108} stroke={18} color="#60A5FA" bg="#BAE6FD">
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:700, color:'#111827' }}>{anTotalPts}</div>
                        <div style={{ fontSize:10, color:'#9CA3AF' }}>Pacientes</div>
                      </div>
                    </DonutChart>
                  </div>
                  <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:10 }}>
                    {[{label:'Novos',color:'#60A5FA',val:novos},{label:'Recorren...',color:'#BAE6FD',val:recorrentes}].map((l,i)=>(
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#6B7280' }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:l.color }} />{l.label} ({l.val})
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-around' }}>
                    {[
                      {label:'Homens', pct:homensPct,   total:homens,   color:'#0066D0', bg:'#DBEAFE'},
                      {label:'Mulheres',pct:mulheresPct, total:mulheres, color:'#EC4899', bg:'#FCE7F3'},
                    ].map((g,i) => (
                      <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                        <DonutChart pct={g.pct} size={42} stroke={7} color={g.color} bg={g.bg}>
                          <span style={{ fontSize:9, fontWeight:700, color:g.color }}>{g.pct}%</span>
                        </DonutChart>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:11, fontWeight:600, color:g.color }}>{g.label}</div>
                          <div style={{ fontSize:10, color:'#9CA3AF' }}>Total: {g.total}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Procedimentos */}
                <Card style={{ padding:'14px 16px' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0066D0', marginBottom:10 }}>Procedimentos realizados</div>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
                    <DonutChart pct={totalProcs>0?100:0} size={108} stroke={18} color={PROC_COLORS[0]} bg="#E5E7EB">
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:26, fontWeight:700, color:'#111827' }}>{totalProcs}</div>
                        <div style={{ fontSize:10, color:'#9CA3AF' }}>Procedimentos</div>
                      </div>
                    </DonutChart>
                  </div>
                  {byType.length === 0
                    ? <div style={{ textAlign:'center', fontSize:11, color:'#9CA3AF' }}>Sem dados</div>
                    : <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        {byType.slice(0,4).map((t,i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background:PROC_COLORS[i%PROC_COLORS.length], flexShrink:0 }} />
                            <span style={{ flex:1, fontSize:11, color:'#6B7280', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{t.label}</span>
                            <span style={{ fontSize:11, fontWeight:600, color:'#111827' }}>{t.count}</span>
                          </div>
                        ))}
                      </div>
                  }
                </Card>

                {/* Convênio */}
                <Card style={{ padding:'14px 16px' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0066D0', marginBottom:10 }}>Pacientes x Convênio</div>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
                    <DonutChart pct={partPct} size={108} stroke={18} color="#60A5FA" bg="#FDE68A">
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:20, fontWeight:700, color:'#111827' }}>{anAppts.length}</div>
                        <div style={{ fontSize:10, color:'#9CA3AF' }}>Pacientes</div>
                      </div>
                    </DonutChart>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {[
                      {label:'Particular',count:particularA,pct:partPct,color:'#60A5FA'},
                      {label:'Convênio',  count:convenioA,  pct:convPct, color:'#F59E0B'},
                    ].map((row,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:row.color, flexShrink:0 }} />
                        <span style={{ flex:1, fontSize:12, color:'#6B7280' }}>{row.label}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:'#111827' }}>{row.count}</span>
                        <span style={{ fontSize:11, color:'#9CA3AF', minWidth:28, textAlign:'right' }}>{row.pct}%</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Duração */}
                <Card style={{ padding:'14px 16px' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0066D0', marginBottom:10 }}>Duração do atendimento</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:14 }}>
                    <Icon name="clock" size={22} color="#6B7280" />
                    <span style={{ fontSize:28, fontWeight:700, color:'#111827', fontStyle:'italic' }}>
                      {anAvgDur > 0 ? `${anAvgDur}min` : '—'}
                    </span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#0066D0', marginBottom:8 }}>Tipo de atendimento</div>
                  {anAppts.length === 0
                    ? <div style={{ textAlign:'center', fontSize:11, color:'#9CA3AF' }}>Sem dados</div>
                    : <div style={{ display:'flex', gap:10, alignItems:'flex-end', height:64, padding:'0 8px' }}>
                        {[
                          {label:'Particular',pct:partPct,color:'#60A5FA'},
                          {label:'Convênio',  pct:convPct, color:'#E5E7EB'},
                        ].map((b,i) => (
                          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                            <span style={{ fontSize:10, fontWeight:600, color:'#374151' }}>{b.pct}%</span>
                            <div style={{ width:'100%', height:Math.max(b.pct*0.5,3), background:b.color, borderRadius:'3px 3px 0 0' }} />
                            <span style={{ fontSize:9, color:'#9CA3AF', textAlign:'center', lineHeight:1.2 }}>{b.label}</span>
                          </div>
                        ))}
                      </div>
                  }
                </Card>
              </div>
            )}
          </>
        );
      })()}

    </div>
  );
}

/* ─────────────────────────────────────────
   AGENDA SCREEN
───────────────────────────────────────── */
function Agenda() {
  const [showAddAppt,  setShowAddAppt]  = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Extra action bar (Lista de Espera / Imprimir) */}
      <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0066D0' }}>guilherme teixeira</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { icon: 'list',    label: 'Lista de Espera', action: () => setShowWaitlist(true) },
            { icon: 'printer', label: 'Imprimir',        action: () => window.print() },
          ].map((a, i) => (
            <button key={i} onClick={a.action} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: '#374151' }}>
              <Icon name={a.icon} size={12} color="#6B7280" /> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Google-Calendar-style weekly grid */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <WeeklyCalendar />
      </div>

      {showAddAppt  && <AddAppointmentModal onClose={() => setShowAddAppt(false)} onSaved={() => {}} />}
      {showWaitlist && <WaitlistModal onClose={() => setShowWaitlist(false)} />}
    </div>
  );
}

/* ─────────────────────────────────────────
   PACIENTES SCREEN
───────────────────────────────────────── */
function Pacientes({ onNavigateProntuario }: { onNavigateProntuario?: (patientId: string) => void }) {
  const [patients,    setPatients]    = useState<Patient[]>([]);
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [showAddPt,   setShowAddPt]   = useState(false);

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
        <button onClick={() => setShowAddPt(true)} style={{ height: 34, padding: '0 16px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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
                      <button onClick={() => onNavigateProntuario?.(p.id)} style={{ height: 28, padding: '0 10px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 5, fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Ver prontuário</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Card>
      )}
      {showAddPt && <AddPatientModal onClose={() => { setShowAddPt(false); supabase.from('patients').select('*').eq('active', true).order('name').then(({ data }) => setPatients((data as Patient[]) ?? [])); }} />}
    </div>
  );
}

/* ─────────────────────────────────────────
   PRONTUÁRIO SCREEN
───────────────────────────────────────── */
function Prontuario({ initialPatientId }: { initialPatientId?: string }) {
  const [activeSection, setActiveSection] = useState('historico');
  const [patients, setPatients]           = useState<Patient[]>([]);
  const [selected, setSelected]           = useState<Patient | null>(null);
  const [loading, setLoading]             = useState(true);
  const [showConsulta, setShowConsulta]   = useState(false);
  const [records, setRecords]             = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showTagInput, setShowTagInput]   = useState(false);
  const [tagLabel, setTagLabel]           = useState('');
  const [tags, setTags]                   = useState<{id:string;label:string;color:string}[]>([]);

  const loadTags = (patientId: string) => {
    supabase.from('patient_tags').select('*').eq('patient_id', patientId).order('created_at')
      .then(({ data }) => setTags((data ?? []) as {id:string;label:string;color:string}[]));
  };

  const handleAddTag = async () => {
    if (!tagLabel.trim() || !selected) return;
    await supabase.from('patient_tags').insert({ patient_id: selected.id, label: tagLabel.trim() });
    setTagLabel(''); setShowTagInput(false);
    loadTags(selected.id);
  };

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
        const initial = initialPatientId ? list.find(p => p.id === initialPatientId) : list[0];
        if (initial) setSelected(initial);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    supabase.from('medical_records').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false })
      .then(({ data }) => setRecords((data as MedicalRecord[]) ?? []));
    supabase.from('prescriptions').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false })
      .then(({ data }) => setPrescriptions((data as Prescription[]) ?? []));
    loadTags(selected.id);
  }, [selected]);

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
          {tags.map(t => (
            <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: t.color ?? '#0066D0', color: '#fff', borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>
              {t.label}
              <span onClick={() => supabase.from('patient_tags').delete().eq('id', t.id).then(() => selected && loadTags(selected.id))} style={{ cursor: 'pointer', opacity: 0.7, lineHeight: 1 }}>×</span>
            </span>
          ))}
          {showTagInput ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <input value={tagLabel} onChange={e => setTagLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') { setShowTagInput(false); setTagLabel(''); } }}
                placeholder="Nome da tag" autoFocus
                style={{ height: 26, border: '1px solid #0066D0', borderRadius: 4, padding: '0 7px', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 120 }} />
              <button onClick={handleAddTag} style={{ height: 26, padding: '0 8px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
              <button onClick={() => { setShowTagInput(false); setTagLabel(''); }} style={{ height: 26, padding: '0 6px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12, cursor: 'pointer', color: '#9CA3AF', fontFamily: 'inherit' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setShowTagInput(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid #0066D0', borderRadius: 9999, fontSize: 12, color: '#0066D0', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Icon name="tag" size={11} color="#0066D0" /> Adicionar Tag +
            </button>
          )}
          <button onClick={() => selected && setShowConsulta(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {selected ? (
          <>
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
              {records.length > 0 && records[0].allergies && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {anamnesisTitles.map((a, i) => {
                    const r = records[0];
                    const vals = [r.clinical_history, r.surgical_history, r.family_history, r.habits, r.allergies];
                    return (
                      <div key={i} style={{ flex: '0 0 150px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '10px 12px', minHeight: 60 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{a}</div>
                        <div style={{ fontSize: 12, color: vals[i] ? '#374151' : '#9CA3AF' }}>{vals[i] ?? 'Sem informação'}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {(records.length === 0 || !records[0].allergies) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
                  {anamnesisTitles.map((a, i) => (
                    <div key={i} style={{ flex: '0 0 150px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '10px 12px', minHeight: 60 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{a}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>Sem informação</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                {([{ ic: 'download', label: 'Baixar PDF', action: () => window.print() }, { ic: 'printer', label: 'Imprimir', action: () => window.print() }, { ic: 'share', label: 'Compartilhar', action: () => { if (navigator.share) { navigator.share({ title: 'Prontuário', text: selected?.name ?? '', url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); alert('Link copiado!'); } } }] as const).map((b, i) => (
                  <button key={i} onClick={b.action} style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Icon name={b.ic} size={12} /> {b.label}
                  </button>
                ))}
              </div>
            </Card>

            {activeSection === 'historico' && (
              <Card>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6', fontSize: 13, fontWeight: 600, color: '#111827' }}>Histórico de Consultas</div>
                {records.length === 0
                  ? <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Nenhuma consulta registrada</div>
                  : records.map((r, i) => (
                    <div key={r.id} style={{ padding: '12px 16px', borderBottom: i < records.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{r.diagnosis ?? 'Consulta'}</span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {r.complaint    && <div style={{ fontSize: 12, color: '#374151', marginBottom: 2 }}><strong>Queixa:</strong> {r.complaint}</div>}
                      {r.evolution    && <div style={{ fontSize: 12, color: '#374151', marginBottom: 2 }}><strong>Evolução:</strong> {r.evolution}</div>}
                      {r.conduct      && <div style={{ fontSize: 12, color: '#374151', marginBottom: 2 }}><strong>Conduta:</strong> {r.conduct}</div>}
                      {r.diagnosis_code && <Badge variant="blue">{r.diagnosis_code}</Badge>}
                    </div>
                  ))
                }
              </Card>
            )}

            {activeSection === 'presc' && (
              <Card>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6', fontSize: 13, fontWeight: 600, color: '#111827' }}>Prescrições</div>
                {prescriptions.length === 0
                  ? <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Nenhuma prescrição registrada</div>
                  : prescriptions.map((rx, i) => (
                    <div key={rx.id} style={{ padding: '12px 16px', borderBottom: i < prescriptions.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{rx.medication}</span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(rx.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#374151' }}>
                        {rx.dosage && <span>{rx.dosage}</span>}
                        {rx.frequency && <span> · {rx.frequency}</span>}
                        {rx.duration && <span> · {rx.duration}</span>}
                      </div>
                      {rx.instructions && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{rx.instructions}</div>}
                    </div>
                  ))
                }
              </Card>
            )}

            {activeSection === 'acomp' && (
              <Card>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6', fontSize: 13, fontWeight: 600, color: '#111827' }}>Tabela de Acompanhamentos</div>
                {records.filter(r => r.return_date).length === 0
                  ? <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Nenhum retorno agendado</div>
                  : records.filter(r => r.return_date).map((r, i, arr) => (
                    <div key={r.id} style={{ padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Retorno agendado</div>
                        {r.return_notes && <div style={{ fontSize: 12, color: '#6B7280' }}>{r.return_notes}</div>}
                      </div>
                      <Badge variant="blue">{r.return_date ? new Date(r.return_date + 'T12:00:00').toLocaleDateString('pt-BR') : ''}</Badge>
                    </div>
                  ))
                }
              </Card>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Nenhum paciente cadastrado</div>
        )}
      </div>
      {showConsulta && selected && (
        <ConsultaModal patient={selected} onClose={() => setShowConsulta(false)} onSaved={() => {
          setShowConsulta(false);
          supabase.from('medical_records').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).then(({ data }) => setRecords((data as MedicalRecord[]) ?? []));
          supabase.from('prescriptions').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).then(({ data }) => setPrescriptions((data as Prescription[]) ?? []));
        }} />
      )}
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
  const [showAddTxn,  setShowAddTxn]    = useState(false);
  const [txnType,     setTxnType]       = useState<'receita'|'despesa'|'transferencia'>('receita');

  const loadTxns = (p: string) => {
    const now  = new Date();
    let start  = '';
    if (p === 'mes') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else if (p === 'semana') {
      start = weekRange().start;
    } else {
      start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    }
    setLoading(true);
    supabase.from('transactions').select('*').gte('date', start).order('date', { ascending: false })
      .then(({ data }) => { setTransactions((data as Transaction[]) ?? []); setLoading(false); });
  };

  useEffect(() => { loadTxns(period); }, [period]);

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
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Gerar relatório</button>
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
        {([{ label: 'RECEITA', color: '#0066D0', type: 'receita' }, { label: 'DESPESA', color: '#EF4444', type: 'despesa' }, { label: 'TRANSFERÊNCIA', color: '#6B7280', type: 'transferencia' }] as const).map((b, i) => (
          <button key={i} onClick={() => { setTxnType(b.type); setShowAddTxn(true); }} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 18px', background: b.color, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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
      {showAddTxn && <AddTransactionModal initialType={txnType} onClose={() => setShowAddTxn(false)} onSaved={() => { setShowAddTxn(false); loadTxns(period); }} />}
    </div>
  );
}

/* ─────────────────────────────────────────
   ESTOQUE SCREEN
───────────────────────────────────────── */
function Estoque() {
  const [items,        setItems]        = useState<InventoryItem[]>([]);
  const [tab,          setTab]          = useState('TODOS');
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [showAddInv,   setShowAddInv]   = useState(false);
  const [showEntrada,  setShowEntrada]  = useState(false);
  const [showSaida,    setShowSaida]    = useState(false);
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
          <button onClick={() => setShowAddInv(true)} style={{ height: 32, padding: '0 14px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Adicionar produto</button>
          <button onClick={() => setShowEntrada(true)} style={{ height: 32, padding: '0 14px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>ENTRADA</button>
          <button onClick={() => setShowSaida(true)} style={{ height: 32, padding: '0 14px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>SAÍDA</button>
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
      {showAddInv  && <AddInventoryModal onClose={() => setShowAddInv(false)} onSaved={() => { setShowAddInv(false); load(); }} />}
      {showEntrada && <InventoryMovementModal tipo="entrada" onClose={() => setShowEntrada(false)} onSaved={() => { setShowEntrada(false); load(); }} />}
      {showSaida   && <InventoryMovementModal tipo="saida"   onClose={() => setShowSaida(false)}   onSaved={() => { setShowSaida(false);   load(); }} />}
    </div>
  );
}

/* ─────────────────────────────────────────
   ADD APPOINTMENT MODAL
───────────────────────────────────────── */
interface ProcedureItem { type: string; qty: number; }

function AddAppointmentModal({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const [mode, setMode]           = useState<'agendar' | 'bloquear'>('agendar');
  const [procedures, setProcedures] = useState<ProcedureItem[]>([{ type: 'retorno', qty: 1 }]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [phone,    setPhone]    = useState('');
  const [phoneRes, setPhoneRes] = useState('');
  const [email,    setEmail]    = useState('');
  const [insurance, setInsurance] = useState('');
  const [date,      setDate]      = useState(todayISO());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime,   setEndTime]   = useState('08:15');
  const [recurrence, setRecurrence] = useState('nao');
  const [payLink,  setPayLink]  = useState(false);
  const [notes,    setNotes]    = useState('');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (patientSearch.length < 3) { setPatientResults([]); return; }
    supabase.from('patients').select('id,name,phone,email,insurance')
      .ilike('name', `%${patientSearch}%`).eq('active', true).limit(8)
      .then(({ data }) => setPatientResults((data as Patient[]) ?? []));
  }, [patientSearch]);

  useEffect(() => {
    if (!selectedPatient) return;
    setPhone(selectedPatient.phone ?? '');
    setEmail(selectedPatient.email ?? '');
    setInsurance(selectedPatient.insurance ?? 'Particular');
  }, [selectedPatient]);

  const PROC_TYPES = [
    { value: 'consulta',         label: 'Consulta' },
    { value: 'retorno',          label: 'Retorno' },
    { value: 'primeira_consulta',label: 'Primeira Consulta' },
    { value: 'avaliacao',        label: 'Avaliação' },
    { value: 'exame',            label: 'Exame' },
    { value: 'procedimento',     label: 'Procedimento' },
    { value: 'teleconsulta',     label: 'Teleconsulta' },
  ];
  const INSURANCES = ['Particular','Unimed','Bradesco Saúde','Amil','SulAmérica','Porto Seguro','Hapvida','NotreDame','Outro'];
  const modeOptions: { val: 'agendar' | 'bloquear'; text: string }[] = [
    { val: 'agendar',  text: 'Agendar' },
    { val: 'bloquear', text: 'Bloquear horário' },
  ];

  const handleNextSlot = () => {
    const [h, m] = startTime.split(':').map(Number);
    const s = h * 60 + m + 15;
    const e = s + 15;
    setStartTime(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
    setEndTime(`${String(Math.floor(e / 60)).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`);
  };

  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    if (mode === 'agendar' && !selectedPatient) return;
    setSaving(true);
    setSaveError('');

    // Busca qualquer médico; se não existir, cria o padrão
    let { data: docs } = await supabase.from('doctors').select('id').limit(1);
    let doctorId = docs?.[0]?.id;

    if (!doctorId) {
      const { data: created, error: createErr } = await supabase
        .from('doctors')
        .upsert(
          { name: 'guilherme teixeira', email: 'gt@medflow.com', specialty: 'Clínica Geral', crm: 'CRM-12345', role: 'admin', active: true },
          { onConflict: 'email' }
        )
        .select('id')
        .single();
      if (createErr || !created) {
        setSaveError('Não foi possível obter o médico: ' + (createErr?.message ?? 'tente novamente'));
        setSaving(false);
        return;
      }
      doctorId = created.id;
    }

    if (mode === 'agendar' && selectedPatient) {
      const { error } = await supabase.from('appointments').insert({
        patient_id: selectedPatient.id,
        doctor_id:  doctorId,
        date,
        start_time: startTime,
        end_time:   endTime,
        type:    procedures[0]?.type ?? 'consulta',
        status:  'agendado',
        insurance: insurance || null,
        notes:   notes || null,
      });
      if (error) {
        setSaveError('Erro ao salvar: ' + error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSaved?.();
    onClose();
  };

  const inp: CSSProperties = {
    width: '100%', height: 36, border: '1px solid #D1D5DB', borderRadius: 6,
    padding: '0 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
  };
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };
  const canSave = mode === 'bloquear' || !!selectedPatient;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 56, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginBottom: 40, flexShrink: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Adicionar agendamento</span>
          <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', borderRadius: 6, fontFamily: 'inherit' }}>×</button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Modo */}
          <div style={{ display: 'flex', gap: 24 }}>
            {modeOptions.map(({ val, text }) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                <input type="radio" name="appt-mode" checked={mode === val} onChange={() => setMode(val)}
                  style={{ accentColor: '#0066D0', width: 15, height: 15 }} />
                {text}
              </label>
            ))}
          </div>

          {/* Procedimentos */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={lbl}>Procedimentos</span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Quant.</span>
            </div>
            {procedures.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0066D0', flexShrink: 0 }} />
                <select value={p.type}
                  onChange={e => { const n = [...procedures]; n[i] = { ...n[i], type: e.target.value }; setProcedures(n); }}
                  style={{ ...inp, flex: 1 }}>
                  {PROC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input type="number" value={p.qty} min={1}
                  onChange={e => { const n = [...procedures]; n[i] = { ...n[i], qty: +e.target.value }; setProcedures(n); }}
                  style={{ ...inp, width: 56, textAlign: 'center', padding: '0 6px' }} />
              </div>
            ))}
            <button onClick={() => setProcedures(prev => [...prev, { type: 'consulta', qty: 1 }])}
              style={{ background: 'none', border: 'none', color: '#0066D0', fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
              + Adicionar
            </button>
          </div>

          {/* Paciente */}
          {mode === 'agendar' && (
            <div style={{ position: 'relative' }}>
              <label style={lbl}>Paciente</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Icon name="user" size={13} color="#9CA3AF" />
                </div>
                <input
                  value={selectedPatient ? selectedPatient.name : patientSearch}
                  onChange={e => { setSelectedPatient(null); setPatientSearch(e.target.value); }}
                  placeholder="Digite 3 letras para buscar..."
                  style={{ ...inp, paddingLeft: 32 }} />
              </div>
              {patientResults.length > 0 && !selectedPatient && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: 180, overflowY: 'auto' }}>
                  {patientResults.map(p => (
                    <div key={p.id}
                      onClick={() => { setSelectedPatient(p); setPatientSearch(''); setPatientResults([]); }}
                      style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                      <div style={{ fontWeight: 500, color: '#111827' }}>{p.name}</div>
                      {p.phone && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.phone}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Telefones */}
          {mode === 'agendar' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Telefone celular</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(__) ___-____" style={inp} />
              </div>
              <div>
                <label style={lbl}>Telefone residencial <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></label>
                <input value={phoneRes} onChange={e => setPhoneRes(e.target.value)} placeholder="(__) ___-____" style={inp} />
              </div>
            </div>
          )}

          {/* Email */}
          {mode === 'agendar' && (
            <div>
              <label style={lbl}>E-mail <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={inp} />
            </div>
          )}

          {/* Convênio */}
          {mode === 'agendar' && (
            <div>
              <label style={lbl}>Convênio</label>
              <select value={insurance} onChange={e => setInsurance(e.target.value)} style={inp}>
                <option value="">Selecione</option>
                {INSURANCES.map(ins => <option key={ins} value={ins}>{ins}</option>)}
              </select>
            </div>
          )}

          {/* Data / Hora */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ ...inp, width: 148 }} />
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              style={{ ...inp, width: 90 }} />
            <span style={{ fontSize: 13, color: '#374151' }}>às</span>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              style={{ ...inp, width: 90 }} />
            <button onClick={handleNextSlot} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#0066D0', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0, whiteSpace: 'nowrap' }}>
              <Icon name="refresh" size={12} color="#0066D0" /> Próximo horário livre
            </button>
          </div>

          {/* Recorrência */}
          <div>
            <select value={recurrence} onChange={e => setRecurrence(e.target.value)} style={{ ...inp, width: 190 }}>
              <option value="nao">Não se repete</option>
              <option value="semanal">Semanal</option>
              <option value="quinzenal">Quinzenal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>

          {/* Gerar link de pagamento */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0066D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, color: '#fff', fontWeight: 700 }}>$</div>
            <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>Gerar link de pagamento</span>
            <button onClick={() => setPayLink(p => !p)} style={{
              width: 42, height: 24, borderRadius: 12, padding: 0,
              background: payLink ? '#0066D0' : '#D1D5DB',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 4, width: 16, height: 16, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                left: payLink ? 22 : 4, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Observações */}
          <div>
            <label style={lbl}>Observações <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              style={{ ...inp, height: 'auto', padding: '8px 10px', resize: 'vertical' as const }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '14px 20px' }}>
          {saveError && (
            <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 10, padding: '8px 10px', background: '#FEF2F2', borderRadius: 6, border: '1px solid #FECACA' }}>
              {saveError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} style={{ height: 36, padding: '0 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
              CANCELAR
            </button>
            <button onClick={handleSave} disabled={saving || !canSave}
              style={{ height: 36, padding: '0 24px', background: canSave ? '#0066D0' : '#9CA3AF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {saving ? 'Salvando...' : 'SALVAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SHARED USER MODAL HELPERS
───────────────────────────────────────── */
function SenhaSection({ senha, setSenha, confirma, setConfirma }: {
  senha: string; setSenha: (v: string) => void;
  confirma: string; setConfirma: (v: string) => void;
}) {
  const inp: CSSProperties = {
    width: '100%', height: 36, border: '1px solid #D1D5DB', borderRadius: 4,
    padding: '0 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
  };
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };
  return (
    <>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0066D0', letterSpacing: '0.08em', margin: '20px 0 14px' }}>DEFINIR SENHA</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <div>
          <label style={lbl}>Senha</label>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)} style={inp} />
        </div>
        <div>
          <label style={lbl}>Confirme a senha</label>
          <input type="password" value={confirma} onChange={e => setConfirma(e.target.value)} style={inp} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
        Ao menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial
      </div>
    </>
  );
}

function ClinicaSection({ ativa, setAtiva, adminClinica, setAdminClinica }: {
  ativa: boolean; setAtiva: (v: boolean) => void;
  adminClinica: boolean; setAdminClinica: (v: boolean) => void;
}) {
  return (
    <>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0066D0', letterSpacing: '0.08em', margin: '20px 0 14px' }}>
        EM QUAIS CLÍNICAS ATENDE? <span style={{ color: '#EF4444' }}>*</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
        <button onClick={() => setAtiva(!ativa)} style={{
          width: 42, height: 24, borderRadius: 12, padding: 0, flexShrink: 0,
          background: ativa ? '#0066D0' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 4, width: 16, height: 16, borderRadius: '50%', background: '#fff', left: ativa ? 22 : 4, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
        <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>Clínica guilherme teixeira</span>
        <span style={{ fontSize: 12, color: '#6B7280', marginRight: 8 }}>Administrador da clínica?</span>
        <input type="checkbox" checked={adminClinica} onChange={e => setAdminClinica(e.target.checked)} style={{ accentColor: '#0066D0', width: 15, height: 15 }} />
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   ADD RECEPTIONIST MODAL
───────────────────────────────────────── */
function AddReceptionistModal({ onClose }: { onClose: () => void }) {
  const [emailR,      setEmailR]      = useState('');
  const [nomeR,       setNomeR]       = useState('');
  const [avatarRec,   setAvatarRec]   = useState('');
  const handleEditFotoRec = () => { const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0]; if(!f)return; const r=new FileReader(); r.onload=(ev)=>setAvatarRec(ev.target?.result as string); r.readAsDataURL(f);}; i.click(); };
  const [adminConta,  setAdminConta]  = useState(false);
  const [sexoR,       setSexoR]       = useState<'M' | 'F' | ''>('');
  const [senha,       setSenha]       = useState('');
  const [confirma,    setConfirma]    = useState('');
  const [clinAtiva,   setClinicaAtiva] = useState(false);
  const [adminClin,   setAdminClin]   = useState(false);
  const [profs,       setProfs]       = useState<{ id: string; name: string; ativo: boolean }[]>([]);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    supabase.from('doctors').select('id,name').eq('active', true).order('name')
      .then(({ data }) => setProfs((data ?? []).map((d: { id: string; name: string }) => ({ ...d, ativo: false }))));
  }, []);

  const toggleProf = (id: string) => setProfs(prev => prev.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p));

  const handleSave = async () => {
    if (!emailR || !nomeR) return;
    setSaving(true);
    await supabase.from('doctors').insert({ name: nomeR, email: emailR, role: 'recepcionista' });
    setSaving(false);
    onClose();
  };

  const inp: CSSProperties = {
    width: '100%', height: 36, border: '1px solid #D1D5DB', borderRadius: 4,
    padding: '0 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
  };
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };
  const req = <span style={{ color: '#EF4444' }}>*</span>;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 760, maxWidth: '96vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Recepcionista</span>
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', borderRadius: 6, fontFamily: 'inherit' }}>×</button>
        </div>

        <div style={{ padding: '20px 28px', maxHeight: '72vh', overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0066D0', letterSpacing: '0.08em', marginBottom: 16 }}>DADOS DO USUÁRIO</div>

          {/* Tipo */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Tipo</label>
            <select style={{ ...inp, maxWidth: 300, background: '#F9FAFB', color: '#6B7280' }} disabled>
              <option>Recepcionista</option>
            </select>
          </div>

          {/* Email + Nome + Foto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>E-mail {req}</label>
                <input type="email" value={emailR} onChange={e => setEmailR(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Nome {req}</label>
                <input value={nomeR} onChange={e => setNomeR(e.target.value)} style={inp} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={adminConta} onChange={e => setAdminConta(e.target.checked)} style={{ accentColor: '#0066D0', width: 14, height: 14 }} />
                Administrador da conta
              </label>
              <div>
                <label style={lbl}>Sexo {req}</label>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', height: 36 }}>
                  {([['M','Masculino'],['F','Feminino']] as const).map(([val, txt]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" name="rec-sexo" checked={sexoR === val} onChange={() => setSexoR(val)} style={{ accentColor: '#0066D0', width: 14, height: 14 }} />
                      {txt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {/* Foto */}
            <div style={{ textAlign: 'center', paddingTop: 2, width: 120 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Imagem de perfil</div>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', overflow: 'hidden' }}>
                {avatarRec ? <img src={avatarRec} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={28} color="#9CA3AF" />}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 6, lineHeight: 1.4 }}>Sua imagem deve ter no máximo 250x250px e 1MB.</div>
              <button onClick={handleEditFotoRec} style={{ fontSize: 11, color: '#0066D0', background: '#fff', border: '1px solid #0066D0', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>EDITAR FOTO</button>
            </div>
          </div>

          <SenhaSection senha={senha} setSenha={setSenha} confirma={confirma} setConfirma={setConfirma} />
          <ClinicaSection ativa={clinAtiva} setAtiva={setClinicaAtiva} adminClinica={adminClin} setAdminClinica={setAdminClin} />

          {/* Quais profissionais atende */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0066D0', letterSpacing: '0.08em', margin: '20px 0 14px' }}>QUAIS PROFISSIONAIS ATENDE?</div>
          {profs.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
              <button onClick={() => toggleProf(p.id)} style={{
                width: 42, height: 24, borderRadius: 12, padding: 0, flexShrink: 0,
                background: p.ativo ? '#0066D0' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 4, width: 16, height: 16, borderRadius: '50%', background: '#fff', left: p.ativo ? 22 : 4, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
              <span style={{ fontSize: 13, color: '#374151' }}>{p.name}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={onClose} style={{ height: 36, padding: '0 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>CANCELAR</button>
          <button onClick={handleSave} disabled={saving || !emailR || !nomeR}
            style={{ height: 36, padding: '0 24px', background: emailR && nomeR ? '#0066D0' : '#9CA3AF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: emailR && nomeR ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {saving ? 'Salvando...' : 'SALVAR'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ADD PROFESSIONAL MODAL
───────────────────────────────────────── */
function AddProfessionalModal({ onClose }: { onClose: () => void }) {
  const [tipo,       setTipo]       = useState('medico');
  const [avatarProf, setAvatarProf] = useState('');
  const handleEditFotoProf = () => { const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0]; if(!f)return; const r=new FileReader(); r.onload=(ev)=>setAvatarProf(ev.target?.result as string); r.readAsDataURL(f);}; i.click(); };
  const [emailD,     setEmailD]     = useState('');
  const [nomeD,      setNomeD]      = useState('');
  const [cpfD,       setCpfD]       = useState('');
  const [celularD,   setCelularD]   = useState('');
  const [adminConta, setAdminConta] = useState(false);
  const [sexoD,      setSexoD]      = useState<'M' | 'F' | ''>('');
  const [tratamento, setTratamento] = useState('');
  const [conselho,   setConselho]   = useState('');
  const [registro,   setRegistro]   = useState('');
  const [ufReg,      setUfReg]      = useState('');
  const [profissao,  setProfissao]  = useState('');
  const [cbo,        setCbo]        = useState('');
  const [rqe,        setRqe]        = useState('');
  const [cnes,       setCnes]       = useState('');
  const [senha,      setSenha]      = useState('');
  const [confirma,   setConfirma]   = useState('');
  const [clinAtiva,  setClinicaAtiva] = useState(false);
  const [adminClin,  setAdminClin]  = useState(false);
  const [saving,     setSaving]     = useState(false);

  const handleSave = async () => {
    if (!emailD || !nomeD) return;
    setSaving(true);
    await supabase.from('doctors').insert({
      name: nomeD,
      email: emailD,
      specialty: profissao || null,
      crm: registro || null,
      role: tipo === 'admin' ? 'admin' : 'medico',
    });
    setSaving(false);
    onClose();
  };

  const inp: CSSProperties = {
    width: '100%', height: 36, border: '1px solid #D1D5DB', borderRadius: 4,
    padding: '0 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
  };
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };
  const req = <span style={{ color: '#EF4444' }}>*</span>;

  const TIPOS = [
    { value: 'medico',      label: 'Profissional de saúde' },
    { value: 'enfermeiro',  label: 'Enfermeiro' },
    { value: 'admin',       label: 'Administrador' },
  ];
  const CONSELHOS = ['CRM','CRO','CRP','CREFITO','CRN','COREN','CFM','CFO','CFP'];
  const ESTADOS   = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
  const TRATAMENTOS = ['Dr.','Dra.','Prof.','Profa.'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 820, maxWidth: '96vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Profissional de Saúde</span>
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', borderRadius: 6, fontFamily: 'inherit' }}>×</button>
        </div>

        <div style={{ padding: '20px 28px', maxHeight: '72vh', overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0066D0', letterSpacing: '0.08em', marginBottom: 16 }}>DADOS DO USUÁRIO</div>

          {/* Tipo + Foto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Tipo */}
              <div>
                <label style={lbl}>Tipo</label>
                <select value={tipo} onChange={e => setTipo(e.target.value)} style={inp}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {/* Email + Nome */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>E-mail {req}</label>
                  <input type="email" value={emailD} onChange={e => setEmailD(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Nome {req}</label>
                  <input value={nomeD} onChange={e => setNomeD(e.target.value)} style={inp} />
                </div>
              </div>
              {/* CPF + Celular */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>CPF {req}</label>
                  <input value={cpfD} onChange={e => setCpfD(e.target.value)} placeholder="___.___.___-__" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Celular</label>
                  <input value={celularD} onChange={e => setCelularD(e.target.value)} placeholder="(__) _____-____" style={inp} />
                </div>
              </div>
              {/* Admin + Sexo */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={adminConta} onChange={e => setAdminConta(e.target.checked)} style={{ accentColor: '#0066D0', width: 14, height: 14 }} />
                Administrador da conta
              </label>
              <div>
                <label style={lbl}>Sexo {req}</label>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', height: 36 }}>
                  {([['M','Masculino'],['F','Feminino']] as const).map(([val, txt]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" name="prof-sexo" checked={sexoD === val} onChange={() => setSexoD(val)} style={{ accentColor: '#0066D0', width: 14, height: 14 }} />
                      {txt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {/* Foto */}
            <div style={{ textAlign: 'center', paddingTop: 2, width: 120 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Imagem de perfil</div>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', overflow: 'hidden' }}>
                {avatarProf ? <img src={avatarProf} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={28} color="#9CA3AF" />}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 6, lineHeight: 1.4 }}>Sua imagem deve ter no máximo 250x250px e 1MB.</div>
              <button onClick={handleEditFotoProf} style={{ fontSize: 11, color: '#0066D0', background: '#fff', border: '1px solid #0066D0', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>EDITAR FOTO</button>
            </div>
          </div>

          {/* Tratamento */}
          <div style={{ marginTop: 14 }}>
            <label style={lbl}>Tratamento</label>
            <select value={tratamento} onChange={e => setTratamento(e.target.value)} style={{ ...inp, maxWidth: 180 }}>
              <option value=""></option>
              {TRATAMENTOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Conselho + Registro + UF */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px', gap: 14, marginTop: 14 }}>
            <div>
              <label style={lbl}>Conselho</label>
              <select value={conselho} onChange={e => setConselho(e.target.value)} style={inp}>
                <option value=""></option>
                {CONSELHOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Registro</label>
              <input value={registro} onChange={e => setRegistro(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>UF</label>
              <select value={ufReg} onChange={e => setUfReg(e.target.value)} style={inp}>
                <option value=""></option>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Profissão */}
          <div style={{ marginTop: 14 }}>
            <label style={lbl}>Profissão {req}</label>
            <select value={profissao} onChange={e => setProfissao(e.target.value)} style={{ ...inp, maxWidth: 340 }}>
              <option value=""></option>
              {['Médico','Odontologista','Psicólogo','Fisioterapeuta','Nutricionista','Enfermeiro','Fonoaudiólogo','Outro'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* CBO + RQE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 14, marginTop: 14 }}>
            <div>
              <label style={lbl}>C.B.O. {req}</label>
              <select value={cbo} onChange={e => setCbo(e.target.value)} style={inp}>
                <option value=""></option>
                {['225105 – Clínico Geral','225106 – Cirurgião','225110 – Cardiologista','225120 – Dermatologista','225125 – Ortopedista','225135 – Pediatra','225145 – Ginecologista'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>RQE</label>
              <input value={rqe} onChange={e => setRqe(e.target.value)} style={inp} />
            </div>
          </div>

          {/* CNES */}
          <div style={{ marginTop: 14 }}>
            <label style={lbl}>CNES</label>
            <input value={cnes} onChange={e => setCnes(e.target.value)} style={{ ...inp, maxWidth: 280, background: '#F9FAFB' }} />
          </div>

          <SenhaSection senha={senha} setSenha={setSenha} confirma={confirma} setConfirma={setConfirma} />
          <ClinicaSection ativa={clinAtiva} setAtiva={setClinicaAtiva} adminClinica={adminClin} setAdminClinica={setAdminClin} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={onClose} style={{ height: 36, padding: '0 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>CANCELAR</button>
          <button onClick={handleSave} disabled={saving || !emailD || !nomeD}
            style={{ height: 36, padding: '0 24px', background: emailD && nomeD ? '#0066D0' : '#9CA3AF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: emailD && nomeD ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {saving ? 'Salvando...' : 'SALVAR'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ADD PATIENT MODAL
───────────────────────────────────────── */
function AddPatientModal({ onClose }: { onClose: () => void }) {
  type PatientTab = 'dados' | 'complementares' | 'convenios';
  const [activeTab, setActiveTab] = useState<PatientTab>('dados');
  const [avatarPt, setAvatarPt] = useState('');
  const handleEditFotoPt = () => { const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0]; if(!f)return; const r=new FileReader(); r.onload=(ev)=>setAvatarPt(ev.target?.result as string); r.readAsDataURL(f);}; i.click(); };

  const [nome,          setNome]          = useState('');
  const [codigo,        setCodigo]        = useState('');
  const [dataNasc,      setDataNasc]      = useState('');
  const [sexo,          setSexo]          = useState<'M' | 'F' | ''>('');
  const [nomeCivil,     setNomeCivil]     = useState(false);
  const [generoOpc,     setGeneroOpc]     = useState(false);
  const [emailP,        setEmailP]        = useState('');
  const [cpf,           setCpf]           = useState('');
  const [rg,            setRg]            = useState('');
  const [obsP,          setObsP]          = useState('');
  const [comoConheceu,  setComoConheceu]  = useState('');
  const [celular,       setCelular]       = useState('');
  const [casa,          setCasa]          = useState('');
  const [endereco,      setEndereco]      = useState('');
  const [numero,        setNumero]        = useState('');
  const [complemento,   setComplemento]   = useState('');
  const [bairro,        setBairro]        = useState('');
  const [cidade,        setCidade]        = useState('');
  const [estado,        setEstado]        = useState('');
  const [cep,           setCep]           = useState('');
  const [convenio,      setConvenio]      = useState('');
  const [numPlano,      setNumPlano]      = useState('');
  const [saving,        setSaving]        = useState(false);

  const handleSave = async () => {
    if (!nome) return;
    setSaving(true);
    await supabase.from('patients').insert({
      name: nome,
      email: emailP || null,
      phone: celular || null,
      birth_date: dataNasc || null,
      gender: sexo || null,
      cpf: cpf || null,
      insurance: convenio || 'Particular',
      insurance_number: numPlano || null,
      address: endereco ? `${endereco}${numero ? ', ' + numero : ''}${complemento ? ' ' + complemento : ''}` : null,
      city: cidade || null,
      state: estado || null,
      zip_code: cep || null,
      notes: obsP || null,
    });
    setSaving(false);
    onClose();
  };

  const inp: CSSProperties = {
    width: '100%', height: 36, border: '1px solid #D1D5DB', borderRadius: 4,
    padding: '0 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
  };
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };
  const req = <span style={{ color: '#EF4444' }}>*</span>;

  const TABS: { id: PatientTab; label: string }[] = [
    { id: 'dados',          label: 'Dados pessoais' },
    { id: 'complementares', label: 'Dados complementares' },
    { id: 'convenios',      label: 'Convênios' },
  ];

  const INSURANCES = ['Particular','Unimed','Bradesco Saúde','Amil','SulAmérica','Porto Seguro','Hapvida','NotreDame','Outro'];
  const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 940, maxWidth: '96vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginBottom: 40, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Adicionar Paciente</span>
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', borderRadius: 6, fontFamily: 'inherit' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', minHeight: 520 }}>
          {/* Sidebar */}
          <div style={{ width: 200, borderRight: '1px solid #E5E7EB', flexShrink: 0, paddingTop: 8 }}>
            <div style={{ padding: '12px 16px 8px', fontSize: 13, fontWeight: 600, color: '#374151' }}>Cadastros</div>
            {TABS.map(tab => (
              <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '10px 16px', fontSize: 13, cursor: 'pointer',
                color: activeTab === tab.id ? '#0066D0' : '#374151',
                background: activeTab === tab.id ? '#EFF6FF' : 'none',
                borderLeft: `3px solid ${activeTab === tab.id ? '#0066D0' : 'transparent'}`,
                transition: 'all 0.1s',
              }}>{tab.label}</div>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', maxHeight: '70vh' }}>

            {/* ── DADOS PESSOAIS ── */}
            {activeTab === 'dados' && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0066D0', letterSpacing: '0.08em', marginBottom: 16 }}>GERAL</div>

                {/* Nome + Código + Foto */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 14, marginBottom: 14, alignItems: 'start' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 14 }}>
                    <div>
                      <label style={lbl}>Nome {req}</label>
                      <input value={nome} onChange={e => setNome(e.target.value)} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Código</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input value={codigo} onChange={e => setCodigo(e.target.value)} style={inp} />
                      </div>
                    </div>
                  </div>
                  {/* Foto */}
                  <div style={{ textAlign: 'center', paddingTop: 2 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Imagem de perfil</div>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', overflow: 'hidden' }}>
                      {avatarPt ? <img src={avatarPt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="user" size={28} color="#9CA3AF" />}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 6, lineHeight: 1.4 }}>Sua imagem deve ter no máximo 250x250px e 1MB.</div>
                    <button onClick={handleEditFotoPt} style={{ fontSize: 11, color: '#0066D0', background: '#fff', border: '1px solid #0066D0', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>EDITAR FOTO</button>
                  </div>
                </div>

                {/* Data nasc + Sexo */}
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={lbl}>Data de nasc. {req}</label>
                    <input type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Sexo {req}</label>
                    <div style={{ display: 'flex', gap: 24, height: 36, alignItems: 'center' }}>
                      {([['M','Masculino'],['F','Feminino']] as const).map(([val, txt]) => (
                        <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                          <input type="radio" name="pt-sexo" checked={sexo === val} onChange={() => setSexo(val)}
                            style={{ accentColor: '#0066D0', width: 14, height: 14 }} />
                          {txt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={nomeCivil} onChange={e => setNomeCivil(e.target.checked)}
                      style={{ accentColor: '#0066D0', width: 14, height: 14 }} />
                    Nome civil
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={generoOpc} onChange={e => setGeneroOpc(e.target.checked)}
                      style={{ accentColor: '#0066D0', width: 14, height: 14 }} />
                    Gênero (opcional) para o paciente
                  </label>
                </div>

                {/* Email */}
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>E-mail</label>
                  <input type="email" value={emailP} onChange={e => setEmailP(e.target.value)} style={{ ...inp, maxWidth: 380 }} />
                </div>

                {/* CPF + RG */}
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={lbl}>CPF</label>
                    <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="___.___.___-__" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>RG</label>
                    <input value={rg} onChange={e => setRg(e.target.value)} style={{ ...inp, maxWidth: 200 }} />
                  </div>
                </div>

                {/* Observações */}
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Observações</label>
                  <textarea value={obsP} onChange={e => setObsP(e.target.value)} rows={4}
                    style={{ ...inp, height: 'auto', padding: '8px 10px', resize: 'vertical' as const, maxWidth: 580 }} />
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>* Esta informação será visível somente para você.</div>
                </div>

                {/* Como conheceu */}
                <div style={{ marginBottom: 24 }}>
                  <label style={lbl}>Como conheceu?</label>
                  <select value={comoConheceu} onChange={e => setComoConheceu(e.target.value)} style={{ ...inp, maxWidth: 260 }}>
                    <option value=""></option>
                    <option value="indicacao">Indicação</option>
                    <option value="instagram">Instagram</option>
                    <option value="google">Google</option>
                    <option value="facebook">Facebook</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: '#0066D0', letterSpacing: '0.08em', marginBottom: 16 }}>TELEFONES</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={lbl}>Celular {req}</label>
                    <input value={celular} onChange={e => setCelular(e.target.value)} placeholder="(__) _____-____" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Casa {req}</label>
                    <input value={casa} onChange={e => setCasa(e.target.value)} placeholder="(__) ____-____" style={inp} />
                  </div>
                </div>
              </>
            )}

            {/* ── DADOS COMPLEMENTARES ── */}
            {activeTab === 'complementares' && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0066D0', letterSpacing: '0.08em', marginBottom: 16 }}>ENDEREÇO</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 160px', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={lbl}>Endereço</label>
                    <input value={endereco} onChange={e => setEndereco(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Número</label>
                    <input value={numero} onChange={e => setNumero(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Complemento</label>
                    <input value={complemento} onChange={e => setComplemento(e.target.value)} style={inp} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px', gap: 14 }}>
                  <div>
                    <label style={lbl}>Bairro</label>
                    <input value={bairro} onChange={e => setBairro(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Cidade</label>
                    <input value={cidade} onChange={e => setCidade(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Estado</label>
                    <select value={estado} onChange={e => setEstado(e.target.value)} style={inp}>
                      <option value=""></option>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>CEP</label>
                    <input value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" style={inp} />
                  </div>
                </div>
              </>
            )}

            {/* ── CONVÊNIOS ── */}
            {activeTab === 'convenios' && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0066D0', letterSpacing: '0.08em', marginBottom: 16 }}>CONVÊNIO</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Convênio</label>
                  <select value={convenio} onChange={e => setConvenio(e.target.value)} style={{ ...inp, maxWidth: 300 }}>
                    <option value="">Selecione</option>
                    {INSURANCES.map(ins => <option key={ins} value={ins}>{ins}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Número do plano</label>
                  <input value={numPlano} onChange={e => setNumPlano(e.target.value)} style={{ ...inp, maxWidth: 300 }} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '1px solid #E5E7EB' }}>
          <button onClick={onClose} style={{ height: 36, padding: '0 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
            CANCELAR
          </button>
          <button onClick={handleSave} disabled={saving || !nome}
            style={{ height: 36, padding: '0 24px', background: nome ? '#0066D0' : '#9CA3AF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: nome ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {saving ? 'Salvando...' : 'SALVAR'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ADD TRANSACTION MODAL
───────────────────────────────────────── */
function AddTransactionModal({ initialType = 'receita', onClose, onSaved }: {
  initialType?: 'receita' | 'despesa' | 'transferencia';
  onClose: () => void; onSaved?: () => void;
}) {
  const [tipo, setTipo]         = useState<'receita'|'despesa'|'transferencia'>(initialType);
  const [valor, setValor]       = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData]         = useState(todayISO());
  const [status, setStatus]     = useState('concluido');
  const [pagamento, setPagamento] = useState('');
  const [notas, setNotas]       = useState('');
  const [ptSearch, setPtSearch]   = useState('');
  const [ptResults, setPtResults] = useState<Patient[]>([]);
  const [allPts,    setAllPts]    = useState<Patient[]>([]);
  const [ptOpen,    setPtOpen]    = useState(false);
  const [selPt,     setSelPt]     = useState<Patient | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    supabase.from('patients').select('id,name,phone').eq('active', true).order('name').limit(100)
      .then(({ data }) => setAllPts((data as Patient[]) ?? []));
  }, []);

  useEffect(() => {
    if (!ptOpen) { setPtResults([]); return; }
    if (ptSearch.length === 0) { setPtResults(allPts.slice(0, 20)); return; }
    setPtResults(allPts.filter(p => p.name.toLowerCase().includes(ptSearch.toLowerCase())).slice(0, 20));
  }, [ptSearch, ptOpen, allPts]);

  const CATS_R = ['Consulta','Procedimento','Exame','Teleconsulta','Convênio','Particular','Outro'];
  const CATS_D = ['Aluguel','Salários','Material','Equipamento','Marketing','Manutenção','Impostos','Outros'];
  const PAGS = [
    ['dinheiro','Dinheiro'],['cartao_credito','Cartão Crédito'],['cartao_debito','Cartão Débito'],
    ['pix','PIX'],['transferencia','Transferência'],['convenio','Convênio'],['boleto','Boleto'],
  ];
  const tipoColor = tipo === 'receita' ? '#10B981' : tipo === 'despesa' ? '#EF4444' : '#6B7280';
  const cats = tipo === 'receita' ? CATS_R : tipo === 'despesa' ? CATS_D : [];

  const handleSave = async () => {
    if (!valor || parseFloat(valor) <= 0) return;
    setSaving(true); setSaveError('');
    const { error } = await supabase.from('transactions').insert({
      type: tipo, amount: parseFloat(valor.replace(',','.')),
      category: categoria || null, description: descricao || null,
      date: data, status, payment_method: pagamento || null,
      patient_id: selPt?.id || null, notes: notas || null,
    });
    if (error) { setSaveError('Erro: ' + error.message); setSaving(false); return; }
    setSaving(false); onSaved?.(); onClose();
  };

  const inp: CSSProperties = { width: '100%', height: 36, border: '1px solid #D1D5DB', borderRadius: 6, padding: '0 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 56, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginBottom: 40, borderTop: `3px solid ${tipoColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Nova {tipo === 'receita' ? 'Receita' : tipo === 'despesa' ? 'Despesa' : 'Transferência'}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', borderRadius: 6 }}>×</button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Tipo</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([['receita','Receita','#10B981'],['despesa','Despesa','#EF4444'],['transferencia','Transferência','#6B7280']] as const).map(([val,txt,col]) => (
                <button key={val} onClick={() => setTipo(val)} style={{ flex: 1, height: 34, borderRadius: 6, border: `1px solid ${tipo === val ? col : '#E5E7EB'}`, background: tipo === val ? col : '#fff', color: tipo === val ? '#fff' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{txt}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Valor *</label>
            <input value={valor} onChange={e => setValor(e.target.value)} type="number" min="0" step="0.01" placeholder="0,00" style={{ ...inp, fontSize: 16, fontWeight: 600 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Categoria</label>
              {cats.length > 0
                ? <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inp}><option value="">Selecione</option>{cats.map(c => <option key={c} value={c}>{c}</option>)}</select>
                : <input value={categoria} onChange={e => setCategoria(e.target.value)} style={inp} />}
            </div>
            <div>
              <label style={lbl}>Descrição</label>
              <input value={descricao} onChange={e => setDescricao(e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Data</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inp}>
                <option value="concluido">Concluído</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Forma de pagamento</label>
            <select value={pagamento} onChange={e => setPagamento(e.target.value)} style={inp}>
              <option value="">Selecione</option>
              {PAGS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {tipo !== 'transferencia' && (
            <div style={{ position: 'relative' }}>
              <label style={lbl}>Paciente <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></label>
              {selPt ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, border: '1px solid #0066D0', borderRadius: 6, padding: '0 10px', background: '#EFF6FF' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0066D0', flexShrink: 0 }}>{selPt.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}</div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#111827' }}>{selPt.name}</span>
                  <button onClick={() => { setSelPt(null); setPtSearch(''); }} style={{ width: 18, height: 18, borderRadius: '50%', background: '#9CA3AF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 12, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
                </div>
              ) : (
                <>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <Icon name="search" size={13} color="#9CA3AF" />
                    </div>
                    <input
                      value={ptSearch}
                      onChange={e => setPtSearch(e.target.value)}
                      onFocus={() => setPtOpen(true)}
                      onBlur={() => setTimeout(() => setPtOpen(false), 150)}
                      placeholder="Digite o nome ou clique para ver todos..."
                      style={{ ...inp, paddingLeft: 32 }}
                    />
                  </div>
                  {ptOpen && ptResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 20, maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
                      {ptSearch.length === 0 && (
                        <div style={{ padding: '6px 12px', fontSize: 11, color: '#9CA3AF', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', fontWeight: 500 }}>
                          {allPts.length} paciente{allPts.length !== 1 ? 's' : ''} cadastrado{allPts.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      {ptResults.map(p => (
                        <div key={p.id}
                          onMouseDown={() => { setSelPt(p); setPtSearch(''); setPtOpen(false); }}
                          style={{ padding: '9px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: 8 }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F0F9FF')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0066D0', flexShrink: 0 }}>{p.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 500, color: '#111827' }}>{p.name}</div>
                            {p.phone && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.phone}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <div>
            <label style={lbl}>Notas <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} style={{ ...inp, height: 'auto', padding: '8px 10px', resize: 'vertical' as const }} />
          </div>
        </div>
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '14px 20px' }}>
          {saveError && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 10, padding: '8px 10px', background: '#FEF2F2', borderRadius: 6 }}>{saveError}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} style={{ height: 36, padding: '0 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>CANCELAR</button>
            <button onClick={handleSave} disabled={saving || !valor} style={{ height: 36, padding: '0 24px', background: valor ? tipoColor : '#9CA3AF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: valor ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {saving ? 'Salvando...' : 'SALVAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ADD INVENTORY MODAL
───────────────────────────────────────── */
function AddInventoryModal({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const [nome, setNome]           = useState('');
  const [codigo, setCodigo]       = useState('');
  const [categoria, setCategoria] = useState('');
  const [quantidade, setQtd]      = useState('0');
  const [unidade, setUnidade]     = useState('un');
  const [minimo, setMinimo]       = useState('0');
  const [custo, setCusto]         = useState('');
  const [vencimento, setVenc]     = useState('');
  const [fornecedor, setFornec]   = useState('');
  const [localizacao, setLocal]   = useState('');
  const [notas, setNotas]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    if (!nome) return;
    setSaving(true); setSaveError('');
    const { error } = await supabase.from('inventory_items').insert({
      name: nome, code: codigo || null, category: categoria || null,
      quantity: parseInt(quantidade) || 0, unit: unidade || 'un',
      min_quantity: parseInt(minimo) || 0,
      unit_cost: custo ? parseFloat(custo.replace(',','.')) : null,
      expiry_date: vencimento || null, supplier: fornecedor || null,
      location: localizacao || null, notes: notas || null, active: true,
    });
    if (error) { setSaveError('Erro: ' + error.message); setSaving(false); return; }
    setSaving(false); onSaved?.(); onClose();
  };

  const inp: CSSProperties = { width: '100%', height: 36, border: '1px solid #D1D5DB', borderRadius: 6, padding: '0 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };
  const CATS = [['medicamento','Medicamento'],['epi','EPI'],['higiene','Higiene'],['material_medico','Material Médico'],['equipamento','Equipamento'],['outro','Outro']];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 56, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Adicionar Produto</span>
          <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', borderRadius: 6 }}>×</button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
            <div><label style={lbl}>Nome *</label><input value={nome} onChange={e => setNome(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Código</label><input value={codigo} onChange={e => setCodigo(e.target.value)} style={inp} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inp}><option value="">Selecione</option>{CATS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
            </div>
            <div>
              <label style={lbl}>Unidade</label>
              <select value={unidade} onChange={e => setUnidade(e.target.value)} style={inp}>{['un','cx','fr','cp','ml','mg','g','L','kg','par','rolo'].map(u => <option key={u} value={u}>{u}</option>)}</select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Quantidade inicial</label><input type="number" min="0" value={quantidade} onChange={e => setQtd(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Estoque mínimo</label><input type="number" min="0" value={minimo} onChange={e => setMinimo(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Custo unitário</label><input type="number" min="0" step="0.01" value={custo} onChange={e => setCusto(e.target.value)} placeholder="0,00" style={inp} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Vencimento</label><input type="date" value={vencimento} onChange={e => setVenc(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Fornecedor</label><input value={fornecedor} onChange={e => setFornec(e.target.value)} style={inp} /></div>
          </div>
          <div><label style={lbl}>Localização</label><input value={localizacao} onChange={e => setLocal(e.target.value)} placeholder="Ex: Armário 2, Prateleira B" style={inp} /></div>
          <div><label style={lbl}>Notas</label><textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} style={{ ...inp, height: 'auto', padding: '8px 10px', resize: 'vertical' as const }} /></div>
        </div>
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '14px 20px' }}>
          {saveError && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 10 }}>{saveError}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} style={{ height: 36, padding: '0 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>CANCELAR</button>
            <button onClick={handleSave} disabled={saving || !nome} style={{ height: 36, padding: '0 24px', background: nome ? '#0066D0' : '#9CA3AF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: nome ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {saving ? 'Salvando...' : 'SALVAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   INVENTORY MOVEMENT MODAL
───────────────────────────────────────── */
function InventoryMovementModal({ tipo, onClose, onSaved }: { tipo: 'entrada'|'saida'; onClose: () => void; onSaved?: () => void }) {
  const [itemSearch, setItemSearch] = useState('');
  const [itemResults, setItemResults] = useState<InventoryItem[]>([]);
  const [selItem, setSelItem]       = useState<InventoryItem | null>(null);
  const [quantidade, setQtd]        = useState('1');
  const [motivo, setMotivo]         = useState('');
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');

  useEffect(() => {
    if (itemSearch.length < 2) { setItemResults([]); return; }
    supabase.from('inventory_items').select('*').eq('active', true).ilike('name', `%${itemSearch}%`).limit(8)
      .then(({ data }) => setItemResults((data as InventoryItem[]) ?? []));
  }, [itemSearch]);

  const handleSave = async () => {
    if (!selItem || !quantidade) return;
    setSaving(true); setSaveError('');
    const qty = parseInt(quantidade) || 0;
    const newQty = tipo === 'entrada' ? selItem.quantity + qty : Math.max(0, selItem.quantity - qty);
    const { error: movErr } = await supabase.from('inventory_movements').insert({ item_id: selItem.id, type: tipo, quantity: qty, reason: motivo || null });
    if (movErr) { setSaveError('Erro: ' + movErr.message); setSaving(false); return; }
    await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', selItem.id);
    setSaving(false); onSaved?.(); onClose();
  };

  const inp: CSSProperties = { width: '100%', height: 36, border: '1px solid #D1D5DB', borderRadius: 6, padding: '0 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };
  const tipoColor = tipo === 'entrada' ? '#0066D0' : '#EF4444';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 56, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginBottom: 40, borderTop: `3px solid ${tipoColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{tipo === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', borderRadius: 6 }}>×</button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <label style={lbl}>Produto *</label>
            <input value={selItem ? selItem.name : itemSearch} onChange={e => { setSelItem(null); setItemSearch(e.target.value); }} placeholder="Buscar produto..." style={inp} />
            {itemResults.length > 0 && !selItem && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: 160, overflowY: 'auto' }}>
                {itemResults.map(item => (
                  <div key={item.id} onClick={() => { setSelItem(item); setItemSearch(''); setItemResults([]); }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }} onMouseEnter={e => (e.currentTarget.style.background='#F9FAFB')} onMouseLeave={e => (e.currentTarget.style.background='#fff')}>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>Estoque: {item.quantity} {item.unit ?? 'un'}</div>
                  </div>
                ))}
              </div>
            )}
            {selItem && (
              <div style={{ marginTop: 6, padding: '8px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{selItem.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>Atual: {selItem.quantity} {selItem.unit ?? 'un'}</div>
                </div>
                <button onClick={() => setSelItem(null)} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Trocar</button>
              </div>
            )}
          </div>
          <div>
            <label style={lbl}>Quantidade *</label>
            <input type="number" min="1" value={quantidade} onChange={e => setQtd(e.target.value)} style={{ ...inp, maxWidth: 120 }} />
            {selItem && (
              <div style={{ fontSize: 11, color: tipo === 'entrada' ? '#10B981' : '#EF4444', marginTop: 4 }}>
                → Novo estoque: {tipo === 'entrada' ? selItem.quantity + (parseInt(quantidade)||0) : Math.max(0, selItem.quantity - (parseInt(quantidade)||0))} {selItem.unit ?? 'un'}
              </div>
            )}
          </div>
          <div>
            <label style={lbl}>Motivo <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></label>
            <input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder={tipo === 'entrada' ? 'Ex: Compra de fornecedor' : 'Ex: Consumo em consulta'} style={inp} />
          </div>
        </div>
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '14px 20px' }}>
          {saveError && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 10 }}>{saveError}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} style={{ height: 36, padding: '0 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>CANCELAR</button>
            <button onClick={handleSave} disabled={saving || !selItem} style={{ height: 36, padding: '0 24px', background: selItem ? tipoColor : '#9CA3AF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: selItem ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {saving ? 'Salvando...' : tipo === 'entrada' ? 'REGISTRAR ENTRADA' : 'REGISTRAR SAÍDA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   WAITLIST MODAL
───────────────────────────────────────── */
function WaitlistModal({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const [ptSearch, setPtSearch]   = useState('');
  const [ptResults, setPtResults] = useState<Patient[]>([]);
  const [selPt, setSelPt]         = useState<Patient | null>(null);
  const [periodo, setPeriodo]     = useState('qualquer');
  const [notas, setNotas]         = useState('');
  const [waitlist, setWaitlist]   = useState<{id:string;patients:{name:string};requested_at:string;preferred_period:string;status:string}[]>([]);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (ptSearch.length < 3) { setPtResults([]); return; }
    supabase.from('patients').select('id,name').ilike('name',`%${ptSearch}%`).eq('active',true).limit(8)
      .then(({ data }) => setPtResults((data as Patient[]) ?? []));
  }, [ptSearch]);

  useEffect(() => {
    supabase.from('waitlist').select('id,requested_at,preferred_period,status,patients(name)').eq('status','aguardando').order('created_at',{ascending:false}).limit(20)
      .then(({ data }) => setWaitlist((data as any[]) ?? []));
  }, []);

  const handleSave = async () => {
    if (!selPt) return;
    setSaving(true);
    const { data: doc } = await supabase.from('doctors').select('id').limit(1);
    await supabase.from('waitlist').insert({ patient_id: selPt.id, doctor_id: doc?.[0]?.id || null, preferred_period: periodo, notes: notas || null, status: 'aguardando' });
    setSaving(false); onSaved?.(); onClose();
  };

  const inp: CSSProperties = { width: '100%', height: 36, border: '1px solid #D1D5DB', borderRadius: 6, padding: '0 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 600, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Lista de Espera</span>
          <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', borderRadius: 6 }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Formulário */}
          <div style={{ padding: '16px 20px', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0066D0', letterSpacing: '0.06em' }}>ADICIONAR À FILA</div>
            <div style={{ position: 'relative' }}>
              <label style={lbl}>Paciente *</label>
              <input value={selPt ? selPt.name : ptSearch} onChange={e => { setSelPt(null); setPtSearch(e.target.value); }} placeholder="Buscar paciente..." style={inp} />
              {ptResults.length > 0 && !selPt && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: 140, overflowY: 'auto' }}>
                  {ptResults.map(p => <div key={p.id} onClick={() => { setSelPt(p); setPtSearch(''); setPtResults([]); }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }} onMouseEnter={e=>(e.currentTarget.style.background='#F9FAFB')} onMouseLeave={e=>(e.currentTarget.style.background='#fff')}>{p.name}</div>)}
                </div>
              )}
            </div>
            <div>
              <label style={lbl}>Período preferido</label>
              <select value={periodo} onChange={e => setPeriodo(e.target.value)} style={inp}>
                <option value="qualquer">Qualquer</option>
                <option value="manha">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Observações</label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3} style={{ ...inp, height: 'auto', padding: '8px 10px', resize: 'vertical' as const }} />
            </div>
            <button onClick={handleSave} disabled={saving || !selPt} style={{ height: 36, padding: '0 16px', background: selPt ? '#0066D0' : '#9CA3AF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: selPt ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {saving ? 'Adicionando...' : '+ Adicionar à fila'}
            </button>
          </div>
          {/* Lista atual */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0066D0', letterSpacing: '0.06em', marginBottom: 12 }}>AGUARDANDO ({waitlist.length})</div>
            {waitlist.length === 0
              ? <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingTop: 24 }}>Nenhum paciente na fila</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {waitlist.map((w, i) => (
                    <div key={w.id} style={{ padding: '8px 10px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{(w.patients as any)?.name ?? '—'}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {new Date(w.requested_at + 'T12:00:00').toLocaleDateString('pt-BR')} · {w.preferred_period === 'qualquer' ? 'Qualquer horário' : w.preferred_period}
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ height: 34, padding: '0 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CONSULTA MODAL (Iniciar Atendimento)
───────────────────────────────────────── */
function ConsultaModal({ patient, onClose, onSaved }: { patient: Patient; onClose: () => void; onSaved?: () => void }) {
  const [queixa, setQueixa]       = useState('');
  const [evolucao, setEvolucao]   = useState('');
  const [diagnostico, setDiag]    = useState('');
  const [cid, setCid]             = useState('');
  const [conduta, setConduta]     = useState('');
  const [retorno, setRetorno]     = useState('');
  const [retornoNotes, setRetornoNotes] = useState('');
  const [prescricoes, setPrescricoes]  = useState<{med:string;dose:string;freq:string;dur:string}[]>([]);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');

  const addPresc = () => setPrescricoes(p => [...p, { med:'', dose:'', freq:'', dur:'' }]);
  const updatePresc = (i: number, field: string, val: string) => setPrescricoes(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleSave = async () => {
    setSaving(true); setSaveError('');
    const { data: doc } = await supabase.from('doctors').select('id').limit(1);
    const doctorId = doc?.[0]?.id;
    const { data: rec, error } = await supabase.from('medical_records').insert({
      patient_id: patient.id, doctor_id: doctorId || null,
      complaint: queixa || null, evolution: evolucao || null,
      diagnosis: diagnostico || null, diagnosis_code: cid || null,
      conduct: conduta || null, return_date: retorno || null, return_notes: retornoNotes || null,
      started_at: new Date().toISOString(), finished_at: new Date().toISOString(),
    }).select('id').single();
    if (error) { setSaveError('Erro: ' + error.message); setSaving(false); return; }
    for (const p of prescricoes.filter(p => p.med)) {
      await supabase.from('prescriptions').insert({
        patient_id: patient.id, medical_record_id: rec?.id || null, doctor_id: doctorId || null,
        medication: p.med, dosage: p.dose || null, frequency: p.freq || null, duration: p.dur || null,
      });
    }
    setSaving(false); onSaved?.(); onClose();
  };

  const inp: CSSProperties = { width: '100%', border: '1px solid #D1D5DB', borderRadius: 6, padding: '8px 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 30, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 680, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', background: '#EFF6FF', borderRadius: '10px 10px 0 0' }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0066D0' }}>Consulta — {patient.name}</span>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', borderRadius: 6 }}>×</button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '72vh', overflowY: 'auto' }}>
          <div>
            <label style={lbl}>Queixa principal</label>
            <textarea value={queixa} onChange={e => setQueixa(e.target.value)} rows={3} style={inp} placeholder="Descreva a queixa principal do paciente..." />
          </div>
          <div>
            <label style={lbl}>Evolução / Exame físico</label>
            <textarea value={evolucao} onChange={e => setEvolucao(e.target.value)} rows={3} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
            <div>
              <label style={lbl}>Diagnóstico</label>
              <input value={diagnostico} onChange={e => setDiag(e.target.value)} style={{ ...inp, padding: '0 10px', height: 36 }} />
            </div>
            <div>
              <label style={lbl}>CID-10</label>
              <input value={cid} onChange={e => setCid(e.target.value)} placeholder="Ex: J06.9" style={{ ...inp, padding: '0 10px', height: 36 }} />
            </div>
          </div>
          <div>
            <label style={lbl}>Conduta / Plano terapêutico</label>
            <textarea value={conduta} onChange={e => setConduta(e.target.value)} rows={3} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Retorno em</label>
              <input type="date" value={retorno} onChange={e => setRetorno(e.target.value)} style={{ ...inp, padding: '0 10px', height: 36 }} />
            </div>
            <div>
              <label style={lbl}>Observações do retorno</label>
              <input value={retornoNotes} onChange={e => setRetornoNotes(e.target.value)} style={{ ...inp, padding: '0 10px', height: 36 }} />
            </div>
          </div>

          {/* Prescrições */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Prescrições</span>
              <button onClick={addPresc} style={{ height: 28, padding: '0 12px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>+ Adicionar</button>
            </div>
            {prescricoes.length === 0
              ? <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '8px 0' }}>Nenhuma prescrição adicionada</div>
              : prescricoes.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'start' }}>
                  <div><input value={p.med} onChange={e => updatePresc(i,'med',e.target.value)} placeholder="Medicamento *" style={{ ...inp, padding: '0 8px', height: 32, fontSize: 12 }} /></div>
                  <div><input value={p.dose} onChange={e => updatePresc(i,'dose',e.target.value)} placeholder="Dose" style={{ ...inp, padding: '0 8px', height: 32, fontSize: 12 }} /></div>
                  <div><input value={p.freq} onChange={e => updatePresc(i,'freq',e.target.value)} placeholder="Frequência" style={{ ...inp, padding: '0 8px', height: 32, fontSize: 12 }} /></div>
                  <div><input value={p.dur} onChange={e => updatePresc(i,'dur',e.target.value)} placeholder="Duração" style={{ ...inp, padding: '0 8px', height: 32, fontSize: 12 }} /></div>
                  <button onClick={() => setPrescricoes(p => p.filter((_,idx) => idx !== i))} style={{ width: 28, height: 32, background: 'none', border: '1px solid #E5E7EB', borderRadius: 4, cursor: 'pointer', color: '#EF4444', fontSize: 14, fontFamily: 'inherit' }}>×</button>
                </div>
              ))
            }
          </div>
        </div>
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '14px 20px' }}>
          {saveError && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 10 }}>{saveError}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={onClose} style={{ height: 36, padding: '0 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{ height: 36, padding: '0 24px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Salvando...' : 'Finalizar Consulta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   DONUT CHART (SVG ring)
───────────────────────────────────────── */
function DonutChart({ pct, size = 100, stroke = 16, color = '#60A5FA', bg = '#E5E7EB', children }: {
  pct: number; size?: number; stroke?: number; color?: string; bg?: string; children?: React.ReactNode;
}) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (Math.min(Math.max(pct, 0), 100) / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg}    strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={String(circ)} strokeDashoffset={String(off)} strokeLinecap="round" />
      </svg>
      {children && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   RELATÓRIOS SCREEN
───────────────────────────────────────── */
const PROC_TYPES_REL = [
  {value:'consulta',label:'Consulta'},{value:'retorno',label:'Retorno'},
  {value:'primeira_consulta',label:'1ª Consulta'},{value:'avaliacao',label:'Avaliação'},
  {value:'exame',label:'Exame'},{value:'procedimento',label:'Procedimento'},{value:'teleconsulta',label:'Teleconsulta'},
];

function Relatorios() {
  const [period,       setPeriod]       = useState('mes');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalPatients, setTotalPts]   = useState(0);
  const [loading,      setLoading]     = useState(true);

  useEffect(() => {
    const now = new Date();
    let start = '';
    if (period === 'semana') start = weekRange().start;
    else if (period === 'mes') start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    else start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    setLoading(true);
    Promise.all([
      supabase.from('transactions').select('*').gte('date', start).order('date'),
      supabase.from('appointments').select('id,type,status,date').gte('date', start),
      supabase.from('patients').select('id', { count: 'exact', head: true }).eq('active', true),
    ]).then(([txn, appt, pts]) => {
      setTransactions((txn.data as Transaction[]) ?? []);
      setAppointments((appt.data as Appointment[]) ?? []);
      setTotalPts(pts.count ?? 0);
      setLoading(false);
    });
  }, [period]);

  const receitas   = transactions.filter(t => t.type === 'receita').reduce((s,t) => s + Number(t.amount), 0);
  const despesas   = transactions.filter(t => t.type === 'despesa').reduce((s,t) => s + Number(t.amount), 0);
  const concluidos = appointments.filter(a => a.status === 'concluido').length;
  const faltaram   = appointments.filter(a => a.status === 'faltou').length;
  const taxaComp   = appointments.length > 0 ? Math.round(concluidos / appointments.length * 100) : 0;

  const byType   = PROC_TYPES_REL.map(t => ({ label: t.label, count: appointments.filter(a => a.type === t.value).length }))
    .filter(t => t.count > 0).sort((a,b) => b.count - a.count);
  const maxByType = Math.max(...byType.map(t => t.count), 1);

  const byPayment = Object.entries(
    transactions.filter(t => t.type === 'receita' && t.payment_method)
      .reduce((acc,t) => { const k = t.payment_method!; acc[k] = (acc[k]||0) + Number(t.amount); return acc; }, {} as Record<string,number>)
  ).sort((a,b) => b[1] - a[1]);
  const PAY_LABELS: Record<string,string> = { dinheiro:'Dinheiro', cartao_credito:'Cartão Crédito', cartao_debito:'Cartão Débito', pix:'PIX', transferencia:'Transferência', convenio:'Convênio', boleto:'Boleto' };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px 22px', background:'#F9FAFB', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:18, fontWeight:600, color:'#111827' }}>Relatórios</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:13, color:'#6B7280' }}>Período:</span>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ height:32, border:'1px solid #E5E7EB', borderRadius:6, padding:'0 8px', fontSize:13, color:'#111827', background:'#fff', fontFamily:'inherit' }}>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mês</option>
            <option value="ano">Este ano</option>
          </select>
          <button onClick={() => {
            const rows = [
              ['Data','Tipo','Descrição','Categoria','Valor','Forma Pgto','Status'],
              ...transactions.map(t => [t.date, t.type, t.description??'', t.category??'', String(t.amount), t.payment_method??'', t.status])
            ];
            const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
            const blob = new Blob(['﻿'+csv], { type:'text/csv;charset=utf-8;' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
            a.download = `relatorio_${period}_${new Date().toISOString().slice(0,10)}.csv`; a.click();
          }} style={{ height:32, padding:'0 14px', background:'#0066D0', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="download" size={13} color="#fff" /> Exportar CSV
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[
              { label:'Receita Total',   value:fmtCurrency(receitas),            color:'#10B981', bg:'#D1FAE5', icon:'dollar' },
              { label:'Despesa Total',   value:fmtCurrency(despesas),            color:'#EF4444', bg:'#FEE2E2', icon:'dollar' },
              { label:'Resultado',       value:fmtCurrency(receitas - despesas), color:receitas-despesas>=0?'#0066D0':'#EF4444', bg:'#EFF6FF', icon:'chart' },
              { label:'Total Pacientes', value:String(totalPatients),            color:'#7C3AED', bg:'#F3E8FF', icon:'users' },
            ].map((k,i) => (
              <Card key={i} style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:'#6B7280' }}>{k.label}</span>
                  <div style={{ width:30, height:30, borderRadius:7, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={k.icon} size={14} color={k.color} /></div>
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:k.color }}>{k.value}</div>
              </Card>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Card style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#111827', marginBottom:14 }}>Resumo de Atendimentos</div>
              {[
                { label:'Total agendado',         value:appointments.length, color:'#0066D0' },
                { label:'Concluídos',             value:concluidos,          color:'#10B981' },
                { label:'Faltaram',               value:faltaram,            color:'#EF4444' },
                { label:'Taxa de comparecimento', value:taxaComp+'%',        color:'#7C3AED' },
              ].map((row,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:i<3?'1px solid #F3F4F6':'none' }}>
                  <span style={{ fontSize:13, color:'#374151' }}>{row.label}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:row.color }}>{row.value}</span>
                </div>
              ))}
            </Card>
            <Card style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#111827', marginBottom:14 }}>Procedimentos Realizados</div>
              {byType.length === 0
                ? <div style={{ textAlign:'center', color:'#9CA3AF', fontSize:13, padding:'20px 0' }}>Nenhum atendimento no período</div>
                : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {byType.map((t,i) => (
                      <div key={i}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <span style={{ fontSize:12, color:'#374151' }}>{t.label}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:'#111827' }}>{t.count}</span>
                        </div>
                        <div style={{ height:6, background:'#F3F4F6', borderRadius:9999, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:Math.round(t.count/maxByType*100)+'%', background:'#0066D0', borderRadius:9999 }} />
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </Card>
          </div>

          <Card style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#111827', marginBottom:14 }}>Receita por Forma de Pagamento</div>
            {byPayment.length === 0
              ? <div style={{ textAlign:'center', color:'#9CA3AF', fontSize:13, padding:'12px 0' }}>Nenhuma receita no período</div>
              : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {byPayment.map(([key,val],i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:i<byPayment.length-1?'1px solid #F3F4F6':'none' }}>
                      <span style={{ fontSize:13, color:'#374151' }}>{PAY_LABELS[key] ?? key}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:80, height:6, background:'#F3F4F6', borderRadius:9999, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:receitas>0?Math.round(val/receitas*100)+'%':'0%', background:'#10B981', borderRadius:9999 }} />
                        </div>
                        <span style={{ fontSize:13, fontWeight:600, color:'#10B981', minWidth:80, textAlign:'right' }}>{fmtCurrency(val)}</span>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </Card>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   CONFIGURAÇÕES SCREEN
───────────────────────────────────────── */
function Configuracoes() {
  type CTab = 'perfil' | 'clinica' | 'horarios' | 'notificacoes';
  const [activeTab, setActiveTab] = useState<CTab>('perfil');
  const [nome, setNome]           = useState('guilherme teixeira');
  const [email, setEmail]         = useState('gt@medflow.com');
  const [crm, setCrm]             = useState('CRM-12345');
  const [especialidade, setEsp]   = useState('Clínica Geral');
  const [celular, setCelular]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  // Clínica
  const [clinNome,    setClinicNome]   = useState(() => localStorage.getItem('clin_nome')    ?? 'Clínica guilherme teixeira');
  const [clinCnpj,    setClinicCnpj]   = useState(() => localStorage.getItem('clin_cnpj')    ?? '');
  const [clinCnes,    setClinicCnes]   = useState(() => localStorage.getItem('clin_cnes')    ?? '');
  const [clinEndereco,setClinicEnd]    = useState(() => localStorage.getItem('clin_end')     ?? '');
  const [clinCidade,  setClinicCid]    = useState(() => localStorage.getItem('clin_cidade')  ?? '');
  const [clinEstado,  setClinicEst]    = useState(() => localStorage.getItem('clin_estado')  ?? '');
  const [clinCep,     setClinicCep]    = useState(() => localStorage.getItem('clin_cep')     ?? '');
  const [clinTel,     setClinicTel]    = useState(() => localStorage.getItem('clin_tel')     ?? '');
  const [clinEmail,   setClinicEmail]  = useState(() => localStorage.getItem('clin_email')   ?? '');
  const [clinSaved,   setClinicSaved]  = useState(false);
  const [horSaved,    setHorSaved]     = useState(false);

  const handleSaveClinica = () => {
    localStorage.setItem('clin_nome',   clinNome);
    localStorage.setItem('clin_cnpj',   clinCnpj);
    localStorage.setItem('clin_cnes',   clinCnes);
    localStorage.setItem('clin_end',    clinEndereco);
    localStorage.setItem('clin_cidade', clinCidade);
    localStorage.setItem('clin_estado', clinEstado);
    localStorage.setItem('clin_cep',    clinCep);
    localStorage.setItem('clin_tel',    clinTel);
    localStorage.setItem('clin_email',  clinEmail);
    setClinicSaved(true); setTimeout(() => setClinicSaved(false), 2200);
  };

  const handleSaveHorarios = () => {
    localStorage.setItem('horarios', JSON.stringify(horarios));
    setHorSaved(true); setTimeout(() => setHorSaved(false), 2200);
  };

  const handleEditFoto = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  type Horario = { dia: string; start: string; end: string; active: boolean };
  const [horarios, setHorarios]   = useState<Horario[]>(() => {
    const saved = localStorage.getItem('horarios');
    if (saved) try { return JSON.parse(saved) as Horario[]; } catch {}
    return [
    { dia:'Segunda', start:'08:00', end:'18:00', active:true },
    { dia:'Terça',   start:'08:00', end:'18:00', active:true },
    { dia:'Quarta',  start:'08:00', end:'18:00', active:true },
    { dia:'Quinta',  start:'08:00', end:'18:00', active:true },
    { dia:'Sexta',   start:'08:00', end:'17:00', active:true },
    { dia:'Sábado',  start:'08:00', end:'12:00', active:false },
    { dia:'Domingo', start:'08:00', end:'12:00', active:false },
  ]; });
  const [nAppt, setNAppt]       = useState(true);
  const [nConf, setNConf]       = useState(true);
  const [nEst, setNEst]         = useState(true);
  const [nFin, setNFin]         = useState(false);

  const handleSavePerfil = async () => {
    setSaving(true);
    await supabase.from('doctors').update({ name:nome, email, crm, specialty:especialidade }).eq('email','gt@medflow.com');
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2200);
  };

  const inp: CSSProperties = { width:'100%', height:36, border:'1px solid #D1D5DB', borderRadius:6, padding:'0 10px', fontSize:13, color:'#111827', fontFamily:'inherit', outline:'none', background:'#fff', boxSizing:'border-box' };
  const lbl: CSSProperties = { fontSize:12, fontWeight:500, color:'#374151', marginBottom:4, display:'block' };
  const CTABS: {id:CTab;label:string}[] = [
    {id:'perfil',label:'Meu Perfil'},{id:'clinica',label:'Clínica'},
    {id:'horarios',label:'Horários de Atendimento'},{id:'notificacoes',label:'Notificações'},
  ];

  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden', background:'#F9FAFB' }}>
      <div style={{ width:220, background:'#fff', borderRight:'1px solid #E5E7EB', flexShrink:0, paddingTop:16 }}>
        <div style={{ padding:'0 16px 12px', fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.08em' }}>CONFIGURAÇÕES</div>
        {CTABS.map(tab => (
          <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding:'10px 16px', fontSize:13, cursor:'pointer', color:activeTab===tab.id?'#0066D0':'#374151', background:activeTab===tab.id?'#EFF6FF':'none', borderLeft:`3px solid ${activeTab===tab.id?'#0066D0':'transparent'}`, fontWeight:activeTab===tab.id?500:400 }}>{tab.label}</div>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>

        {activeTab === 'perfil' && (
          <div style={{ maxWidth:580 }}>
            <div style={{ fontSize:16, fontWeight:600, color:'#111827', marginBottom:20 }}>Meu Perfil</div>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, padding:16, background:'#F9FAFB', borderRadius:8, border:'1px solid #E5E7EB' }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:'#0066D0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden' }}>
                {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : 'GT'}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:600, color:'#111827' }}>{nome}</div>
                <div style={{ fontSize:13, color:'#6B7280' }}>{especialidade} · {crm}</div>
                <button onClick={handleEditFoto} style={{ marginTop:5, fontSize:11, color:'#0066D0', background:'#fff', border:'1px solid #0066D0', borderRadius:4, padding:'3px 8px', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>EDITAR FOTO</button>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Nome completo</label><input value={nome} onChange={e => setNome(e.target.value)} style={inp} /></div>
                <div><label style={lbl}>E-mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Especialidade</label><input value={especialidade} onChange={e => setEsp(e.target.value)} style={inp} /></div>
                <div><label style={lbl}>CRM</label><input value={crm} onChange={e => setCrm(e.target.value)} style={inp} /></div>
              </div>
              <div><label style={lbl}>Celular</label><input value={celular} onChange={e => setCelular(e.target.value)} placeholder="(__) _____-____" style={{ ...inp, maxWidth:220 }} /></div>
              <div>
                <button onClick={handleSavePerfil} disabled={saving} style={{ height:36, padding:'0 24px', background: saved ? '#10B981' : '#0066D0', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clinica' && (
          <div style={{ maxWidth:580 }}>
            <div style={{ fontSize:16, fontWeight:600, color:'#111827', marginBottom:20 }}>Dados da Clínica</div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div><label style={lbl}>Nome da clínica</label><input value={clinNome} onChange={e => setClinicNome(e.target.value)} style={inp} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>CNPJ</label><input value={clinCnpj} onChange={e => setClinicCnpj(e.target.value)} placeholder="00.000.000/0001-00" style={inp} /></div>
                <div><label style={lbl}>CNES</label><input value={clinCnes} onChange={e => setClinicCnes(e.target.value)} style={inp} /></div>
              </div>
              <div><label style={lbl}>Endereço</label><input value={clinEndereco} onChange={e => setClinicEnd(e.target.value)} style={inp} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 100px', gap:14 }}>
                <div><label style={lbl}>Cidade</label><input value={clinCidade} onChange={e => setClinicCid(e.target.value)} style={inp} /></div>
                <div><label style={lbl}>Estado</label><select value={clinEstado} onChange={e => setClinicEst(e.target.value)} style={inp}>{['','SP','RJ','MG','RS','PR','SC','BA','PE','CE','GO','DF'].map(e=><option key={e} value={e}>{e}</option>)}</select></div>
                <div><label style={lbl}>CEP</label><input value={clinCep} onChange={e => setClinicCep(e.target.value)} placeholder="00000-000" style={inp} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={lbl}>Telefone</label><input value={clinTel} onChange={e => setClinicTel(e.target.value)} placeholder="(__) ____-____" style={inp} /></div>
                <div><label style={lbl}>E-mail da clínica</label><input type="email" value={clinEmail} onChange={e => setClinicEmail(e.target.value)} style={inp} /></div>
              </div>
              <div>
                <button onClick={handleSaveClinica} style={{ height:36, padding:'0 24px', background: clinSaved ? '#10B981' : '#0066D0', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  {clinSaved ? '✓ Salvo!' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'horarios' && (
          <div style={{ maxWidth:520 }}>
            <div style={{ fontSize:16, fontWeight:600, color:'#111827', marginBottom:6 }}>Horários de Atendimento</div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:18 }}>Configure os dias e horários de atendimento da clínica.</div>
            <Card>
              {horarios.map((h,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderBottom:i<horarios.length-1?'1px solid #F3F4F6':'none' }}>
                  <button onClick={() => { const n=[...horarios]; n[i]={...n[i],active:!n[i].active}; setHorarios(n); }} style={{ width:38, height:22, borderRadius:11, padding:0, background:h.active?'#0066D0':'#D1D5DB', border:'none', cursor:'pointer', position:'relative', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:3, width:16, height:16, borderRadius:'50%', background:'#fff', left:h.active?19:3, transition:'left 0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                  <span style={{ fontSize:13, fontWeight:500, color:h.active?'#111827':'#9CA3AF', width:72, flexShrink:0 }}>{h.dia}</span>
                  {h.active
                    ? <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <input type="time" value={h.start} onChange={e => { const n=[...horarios]; n[i]={...n[i],start:e.target.value}; setHorarios(n); }} style={{ height:30, border:'1px solid #E5E7EB', borderRadius:5, padding:'0 6px', fontSize:13, fontFamily:'inherit', outline:'none' }} />
                        <span style={{ fontSize:12, color:'#9CA3AF' }}>às</span>
                        <input type="time" value={h.end} onChange={e => { const n=[...horarios]; n[i]={...n[i],end:e.target.value}; setHorarios(n); }} style={{ height:30, border:'1px solid #E5E7EB', borderRadius:5, padding:'0 6px', fontSize:13, fontFamily:'inherit', outline:'none' }} />
                      </div>
                    : <span style={{ fontSize:12, color:'#9CA3AF', fontStyle:'italic' }}>Fechado</span>
                  }
                </div>
              ))}
            </Card>
            <div style={{ marginTop:14 }}>
              <button onClick={handleSaveHorarios} style={{ height:36, padding:'0 24px', background: horSaved ? '#10B981' : '#0066D0', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {horSaved ? '✓ Salvo!' : 'Salvar horários'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notificacoes' && (
          <div style={{ maxWidth:520 }}>
            <div style={{ fontSize:16, fontWeight:600, color:'#111827', marginBottom:6 }}>Notificações</div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:18 }}>Controle quais notificações você deseja receber.</div>
            <Card>
              {([
                { label:'Novos agendamentos',       sub:'Notificado quando um novo agendamento for criado',          val:nAppt, set:setNAppt },
                { label:'Confirmações de consulta', sub:'Notificado quando um paciente confirmar presença',           val:nConf, set:setNConf },
                { label:'Alertas de estoque',       sub:'Notificado quando itens estiverem com estoque baixo',        val:nEst,  set:setNEst  },
                { label:'Movimentações financeiras',sub:'Notificado sobre novas receitas e despesas registradas',     val:nFin,  set:setNFin  },
              ] as {label:string;sub:string;val:boolean;set:(v:any)=>void}[]).map((n,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', borderBottom:i<3?'1px solid #F3F4F6':'none' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'#111827' }}>{n.label}</div>
                    <div style={{ fontSize:12, color:'#9CA3AF', marginTop:1 }}>{n.sub}</div>
                  </div>
                  <button onClick={() => n.set((p:boolean) => !p)} style={{ width:42, height:24, borderRadius:12, padding:0, background:n.val?'#0066D0':'#D1D5DB', border:'none', cursor:'pointer', position:'relative', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:4, width:16, height:16, borderRadius:'50%', background:'#fff', left:n.val?22:4, transition:'left 0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              ))}
            </Card>
          </div>
        )}

      </div>
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
  const [showAddAppointment,  setShowAddAppointment]  = useState(false);
  const [showAddPatient,      setShowAddPatient]      = useState(false);
  const [showAddProfessional, setShowAddProfessional] = useState(false);
  const [showAddReceptionist, setShowAddReceptionist] = useState(false);
  const [agendaKey,           setAgendaKey]           = useState(0);
  const [prontuarioPatientId, setProntuarioPatientId] = useState<string | undefined>();

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

  const handleNavigateProntuario = (patientId: string) => {
    setProntuarioPatientId(patientId);
    handleNavigate('prontuario');
  };

  const screenMap: Partial<Record<NavId, React.ReactNode>> = {
    dashboard:    <Dashboard onNavigateProntuario={handleNavigateProntuario} />,
    agenda:       <Agenda key={agendaKey} />,
    prontuario:   <Prontuario key={prontuarioPatientId} initialPatientId={prontuarioPatientId} />,
    pacientes:    <Pacientes onNavigateProntuario={handleNavigateProntuario} />,
    financas:     <Financas />,
    estoque:      <Estoque />,
    relatorios:   <Relatorios />,
    configuracoes: <Configuracoes />,
  };

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar active={screen} onNavigate={handleNavigate} agendaBadge={agendaBadge} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar screen={screen} notifCount={notifCount}
          onNewAppointment={() => setShowAddAppointment(true)}
          onNewPatient={() => setShowAddPatient(true)}
          onNewProfessional={() => setShowAddProfessional(true)}
          onNewReceptionist={() => setShowAddReceptionist(true)}
        />
        <InternalTabs tabs={tabs} activeTab={activeTab} onSelect={handleNavigate} onClose={handleCloseTab} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {screenMap[screen] ?? <Dashboard />}
        </div>
      </div>
      {showAddAppointment  && <AddAppointmentModal  onClose={() => setShowAddAppointment(false)} onSaved={() => setAgendaKey(k => k + 1)} />}
      {showAddPatient      && <AddPatientModal      onClose={() => setShowAddPatient(false)} />}
      {showAddProfessional && <AddProfessionalModal onClose={() => setShowAddProfessional(false)} />}
      {showAddReceptionist && <AddReceptionistModal onClose={() => setShowAddReceptionist(false)} />}
    </div>
  );
}
