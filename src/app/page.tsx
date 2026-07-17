'use client';
import React, { useState, useEffect, useRef, useCallback, CSSProperties } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '@/lib/supabase';
import { useAllowedDoctors, applyDoctorFilter } from '@/lib/useAllowedDoctors';
import { TYPE_META, STATUS_META } from '@/components/calendar/utils';
import DOMPurify from 'dompurify';
import ShineSweep from '@/components/ShineSweep';
import {
  DndContext, DragOverlay, useDroppable, useDraggable,
  MouseSensor, TouchSensor, useSensors, useSensor,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { CSS as DndCSS } from '@dnd-kit/utilities';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import {
  Users, DollarSign, CheckCircle2, UserX, Bell, Calendar,
  FileText, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Activity, ChevronRight, Stethoscope,
} from 'lucide-react';

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
  { id: 'agenda',        label: 'Agenda',         icon: 'calendar' },
  { id: 'prontuario',    label: 'Prontuários',    icon: 'file' },
  { id: 'pacientes',     label: 'Pacientes',      icon: 'users' },
  { id: 'financas',      label: 'Finanças',       icon: 'dollar' },
  { id: 'estoque',       label: 'Estoque',        icon: 'package' },
  { id: 'relatorios',    label: 'Relatórios',     icon: 'chart' },
  { id: 'configuracoes', label: 'Configurações',  icon: 'settings' },
];

/* ─────────────────────────────────────────
   DOCTOR CONTEXT — médico logado
───────────────────────────────────────── */
interface DoctorInfo { id: string; name: string; email: string; specialty: string; crm: string; phone?: string; }
const DoctorContext = React.createContext<DoctorInfo>({
  id: '', name: 'guilherme teixeira', email: 'gt@medflow.com',
  specialty: 'Clínica Geral', crm: 'CRM-12345',
});

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function Sidebar({ active, onNavigate, agendaBadge }: { active: NavId; onNavigate: (id: NavId) => void; agendaBadge: number }) {
  const doctor = React.useContext(DoctorContext);
  return (
    <aside className="bg-white border-r border-gray-200 shadow-sm" style={{
      width: 220, display: 'flex', flexDirection: 'column',
      flexShrink: 0, height: '100%', overflow: 'hidden',
    }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(111,101,232,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <img src="/logomarca_recortada.png" alt="MedCore" style={{ height: 64, width: 'auto', display: 'block' }} />
        </div>
        <div style={{ fontSize: 11, color: 'rgba(100,116,139,0.7)', marginTop: 2, fontWeight: 500 }}>Sistema Médico</div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          const badge = item.id === 'agenda' ? agendaBadge : item.badge;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
              borderRadius: 7, cursor: 'pointer', fontSize: 13, width: '100%',
              background: isActive ? 'rgba(111,101,232,0.10)' : 'transparent',
              color: isActive ? '#6F65E8' : '#1E293B',
              border: 'none', fontFamily: 'inherit', fontWeight: isActive ? 600 : 500,
              borderLeft: `3px solid ${isActive ? '#6F65E8' : 'transparent'}`,
              transition: 'all 0.1s', textAlign: 'left',
            }}>
              <Icon name={item.icon} size={15} color={isActive ? '#6F65E8' : '#64748B'} />
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
          }}>{initials(doctor.name)}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{doctor.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{doctor.specialty} · Admin</div>
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
  const [showMenu, setShowMenu]     = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu  = () => { if (hideTimeout.current) { clearTimeout(hideTimeout.current); hideTimeout.current = null; } setShowMenu(true); };
  const closeMenu = () => { hideTimeout.current = setTimeout(() => setShowMenu(false), 120); };

  const menuItems = [
    { label: 'Novo Agendamento',         desc: 'Agendar consulta ou procedimento', icon: 'calendar',  color: '#0066D0', bg: '#EFF6FF', action: () => { setShowMenu(false); onNewAppointment(); } },
    { label: 'Adicionar Paciente',       desc: 'Cadastrar novo paciente',           icon: 'user-plus', color: '#059669', bg: '#F0FDF4', action: () => { setShowMenu(false); onNewPatient(); } },
    { label: 'Adicionar Profissional',   desc: 'Médico ou especialista',            icon: 'user-plus', color: '#7C3AED', bg: '#F5F3FF', action: () => { setShowMenu(false); onNewProfessional(); } },
    { label: 'Adicionar Recepcionista',  desc: 'Acesso à recepção',                 icon: 'user-plus', color: '#F59E0B', bg: '#FFFBEB', action: () => { setShowMenu(false); onNewReceptionist(); } },
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

        {/* ── Premium + button with hover menu ── */}
        <div style={{ position: 'relative' }} onMouseEnter={openMenu} onMouseLeave={closeMenu}>
          <button style={{
            width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: 'none', cursor: 'pointer',
            background: showMenu
              ? 'linear-gradient(135deg, #1d4ed8 0%, #0066D0 100%)'
              : 'linear-gradient(135deg, #0066D0 0%, #2563EB 100%)',
            boxShadow: showMenu
              ? '0 4px 18px rgba(0,102,208,0.55), 0 0 0 3px rgba(0,102,208,0.15)'
              : '0 2px 10px rgba(0,102,208,0.35)',
            transform: showMenu ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease, background .18s ease',
          }}>
            <span style={{
              fontSize: 22, lineHeight: 1, color: '#fff', fontWeight: 300,
              display: 'inline-block',
              transform: showMenu ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform .22s cubic-bezier(.34,1.56,.64,1)',
              marginTop: -1,
            }}>+</span>
          </button>

          {/* Dropdown */}
          <div style={{
            position: 'absolute', top: 42, right: 0,
            opacity: showMenu ? 1 : 0,
            transform: showMenu ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.96)',
            pointerEvents: showMenu ? 'auto' : 'none',
            transition: 'opacity .18s ease, transform .2s cubic-bezier(.34,1.3,.64,1)',
            transformOrigin: 'top right',
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18), 0 3px 10px rgba(0,0,0,0.07)',
            zIndex: 200, minWidth: 248, overflow: 'hidden',
          }}>
            {/* Header strip */}
            <div style={{
              padding: '10px 16px 8px',
              fontSize: 10, fontWeight: 700, color: '#9CA3AF',
              letterSpacing: '0.09em', textTransform: 'uppercase',
              borderBottom: '1px solid #F3F4F6',
              background: '#FAFAFA',
            }}>Ação rápida</div>

            {menuItems.map((item, i) => (
              <button key={i} onClick={item.action}
                onMouseEnter={() => setHoveredItem(i)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '11px 16px', background: hoveredItem === i ? item.bg : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  borderBottom: i < menuItems.length - 1 ? '1px solid #F3F4F6' : 'none',
                  transition: 'background .12s ease',
                }}>
                {/* Color icon bubble */}
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: hoveredItem === i ? item.color : item.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .15s ease',
                  boxShadow: hoveredItem === i ? `0 3px 10px ${item.color}40` : 'none',
                }}>
                  <Icon name={item.icon} size={14} color={hoveredItem === i ? '#fff' : item.color} />
                </div>
                {/* Text */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: hoveredItem === i ? item.color : '#111827', transition: 'color .12s ease' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{item.desc}</div>
                </div>
                {/* Arrow */}
                <div style={{ marginLeft: 'auto', opacity: hoveredItem === i ? 1 : 0, transition: 'opacity .15s ease, transform .15s ease', transform: hoveredItem === i ? 'translateX(0)' : 'translateX(-4px)', color: item.color }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </button>
            ))}

            {/* Footer tip */}
            <div style={{ padding: '7px 16px', background: '#FAFAFA', borderTop: '1px solid #F3F4F6', fontSize: 10, color: '#C4C9D4', textAlign: 'center' }}>
              Pressione <kbd style={{ fontFamily: 'inherit', background: '#F3F4F6', borderRadius: 3, padding: '1px 4px', fontSize: 10, color: '#6B7280' }}>Ctrl</kbd> + <kbd style={{ fontFamily: 'inherit', background: '#F3F4F6', borderRadius: 3, padding: '1px 4px', fontSize: 10, color: '#6B7280' }}>N</kbd> para agendar
            </div>
          </div>
        </div>

        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
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
  insurance_number?: string; cpf?: string; address?: string;
  city?: string; state?: string; zip_code?: string; notes?: string;
  active?: boolean;
}
interface Appointment {
  id: string; patient_id: string; doctor_id?: string; date: string; start_time: string; end_time: string;
  type: string; status: string; notes?: string; insurance?: string; amount?: number;
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
  habits?: string; allergies?: string; medications?: string;
  complaint?: string; evolution?: string; diagnosis?: string;
  diagnosis_code?: string; conduct?: string;
  return_date?: string; return_notes?: string;
  duration_seconds?: number;
  created_at: string;
}
interface PrescriptionModel {
  id: string; name: string;
  items: { med: string; dose: string; freq: string; dur: string }[];
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

/** Copy text to clipboard with execCommand fallback for older browsers */
function copyToClipboard(text: string): void {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text: string): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
}

function fmtCurrency(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function weekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = (day + 6) % 7;  // days since Monday
  const start = new Date(now); start.setDate(now.getDate() - diffToMon);
  const end   = new Date(now); end.setDate(now.getDate() + (6 - diffToMon));
  return {
    start: start.toISOString().split('T')[0],
    end:   end.toISOString().split('T')[0],
  };
}

/* ── Time helpers ── */
function timeToMinutes(t: string): number {
  const [h, m] = (t ?? '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
function minutesToTime(mins: number): string {
  const clamped = Math.max(0, Math.min(mins, 23 * 60 + 59));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

/* ── Agenda time slots 07:00 → 21:00 in 30-min steps ── */
const AGENDA_TIMES: string[] = Array.from({ length: 29 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
});

/* ── Brazilian holidays ── */
function easterDate(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function isoDate(d: Date): string { return d.toISOString().split('T')[0]; }

function getBrazilHolidays(year: number): Record<string, string> {
  const easter = easterDate(year);
  return {
    // Feriados fixos nacionais
    [`${year}-01-01`]: 'Confraternização Universal',
    [`${year}-04-21`]: 'Tiradentes',
    [`${year}-05-01`]: 'Dia do Trabalho',
    [`${year}-09-07`]: 'Independência do Brasil',
    [`${year}-10-12`]: 'Nossa Sra. Aparecida',
    [`${year}-11-02`]: 'Finados',
    [`${year}-11-15`]: 'Proclamação da República',
    [`${year}-11-20`]: 'Consciência Negra',
    [`${year}-12-25`]: 'Natal',
    // Feriados móveis (base: Páscoa)
    [isoDate(addDays(easter, -48))]: 'Carnaval (2ª)',
    [isoDate(addDays(easter, -47))]: 'Carnaval',
    [isoDate(addDays(easter,  -2))]: 'Sexta-feira Santa',
    [isoDate(easter)]:               'Páscoa',
    [isoDate(addDays(easter,  60))]: 'Corpus Christi',
  };
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  agendado:       { bg: '#EFF6FF', color: '#2563EB' },
  confirmado:     { bg: '#F0FDFA', color: '#0F766E' },
  aguardando:     { bg: '#FEF3C7', color: '#D97706' },
  em_atendimento: { bg: '#F5F3FF', color: '#7C3AED' },
  concluido:      { bg: '#D1FAE5', color: '#10B981' },
  faltou:         { bg: '#FEE2E2', color: '#EF4444' },
  cancelado:      { bg: '#F3F4F6', color: '#9CA3AF' },
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
/* ─────────────────────────────────────────
   DASHBOARD — KPI CARD
───────────────────────────────────────── */
type KpiColor = 'blue' | 'emerald' | 'violet' | 'rose';
function KpiCard({ label, value, sub, trend, trendVal, color, icon }: {
  label: string; value: string | number; sub: string;
  trend: 'up' | 'down' | 'neutral'; trendVal: string;
  color: KpiColor; icon: React.ReactNode;
}) {
  const cm: Record<KpiColor,{bar:string; iconWrap:string; trendCls:string}> = {
    blue:    { bar:'bg-blue-500',    iconWrap:'bg-blue-50 text-blue-600',    trendCls:'bg-blue-50 text-blue-700'    },
    emerald: { bar:'bg-emerald-500', iconWrap:'bg-emerald-50 text-emerald-600', trendCls:'bg-emerald-50 text-emerald-700' },
    violet:  { bar:'bg-violet-500',  iconWrap:'bg-violet-50 text-violet-600', trendCls:'bg-violet-50 text-violet-700' },
    rose:    { bar:'bg-rose-500',    iconWrap:'bg-rose-50 text-rose-600',    trendCls:'bg-rose-50 text-rose-700'    },
  };
  const c = cm[color];
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className={`h-1 w-full ${c.bar}`} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase leading-tight">{label}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconWrap}`}>{icon}</div>
        </div>
        <div className="text-[2rem] font-extrabold text-slate-900 leading-none tracking-tight">{value}</div>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs text-slate-400">{sub}</span>
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.trendCls}`}>
            <TrendIcon size={10} />{trendVal}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   DASHBOARD — MAIN COMPONENT
───────────────────────────────────────── */
function Dashboard({ onNavigateProntuario, onNewAppointment, onNewPatient, onNavigate }: {
  onNavigateProntuario?: (patientId: string) => void;
  onNewAppointment?: () => void;
  onNewPatient?: () => void;
  onNavigate?: (screen: string) => void;
}) {
  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [transactions,  setTransactions]  = useState<Transaction[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [newPtsWeek,    setNewPtsWeek]    = useState(0);
  const [lowStock,      setLowStock]      = useState<InventoryItem[]>([]);
  const [loading,       setLoading]       = useState(true);   // fase 1: consultas de hoje
  const [kpiLoading,    setKpiLoading]    = useState(true);   // fase 2: KPIs + chart
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [period,        setPeriod]        = useState<'hoje'|'semana'|'mes'>('hoje');
  const [chartTx,       setChartTx]       = useState<Transaction[]>([]);
  const doctor = React.useContext(DoctorContext);

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
    const thirtyAgo = (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0]; })();

    // ── Fase 1 (crítica): consultas de hoje → desbloqueia UI imediatamente
    Promise.resolve(
      supabase.from('appointments')
        .select('*, patients(id,name,insurance)')
        .eq('date', today)
        .order('start_time')
        .limit(50)
    ).then(({ data }) => {
      setAppointments((data as Appointment[]) ?? []);
      setLoading(false); // mostra lista de hoje sem esperar KPIs
    }).catch(() => setLoading(false));

    // ── Fase 2 (background): KPIs + gráfico — não bloqueia o render
    Promise.all([
      supabase.from('transactions').select('*').gte('date', start).lte('date', end).limit(500),
      supabase.from('patients').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', start + 'T00:00:00'),
      supabase.from('inventory_items').select('id,name,quantity,min_quantity,unit').eq('active', true),
      supabase.from('transactions').select('amount,type,date').gte('date', thirtyAgo).order('date').limit(300),
    ]).then(([txn, total, newPts, stock, ctxn]) => {
      setTransactions((txn.data as Transaction[]) ?? []);
      setTotalPatients(total.count ?? 0);
      setNewPtsWeek(newPts.count ?? 0);
      const allStock = (stock.data as InventoryItem[]) ?? [];
      setLowStock(allStock.filter(i => i.quantity <= i.min_quantity));
      setChartTx((ctxn.data as Transaction[]) ?? []);
      setKpiLoading(false);
    }).catch(err => {
      console.error('Dashboard KPI load error:', err);
      setKpiLoading(false);
    });
  };

  useEffect(() => {
    supabase.from('doctors').select('id,name').eq('active', true)
      .then(({ data }) => setAnDoctors((data as DocItem[]) ?? []));
  }, []);

  useEffect(() => {
    if (!showAnalytics) return; // carrega só quando o painel de análise é aberto
    const now = new Date();
    let start = '';
    if      (anPeriod === '7dias')  { const d = new Date(now); d.setDate(d.getDate()-7);  start = d.toISOString().split('T')[0]; }
    else if (anPeriod === '30dias') { const d = new Date(now); d.setDate(d.getDate()-30); start = d.toISOString().split('T')[0]; }
    else if (anPeriod === 'mes')    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    else                            start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    setAnLoading(true);
    let apptQ = supabase.from('appointments').select('*').gte('date', start).limit(1000);
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
    }).catch(err => {
      console.error('Analytics load error:', err);
      setAnLoading(false);
    });
  }, [anPeriod, anProf, showAnalytics]);

  useEffect(() => { load(); }, []);

  // Skeleton para KPI cards enquanto fase 2 carrega
  const KpiSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col animate-pulse">
      <div className="h-1 w-full bg-slate-200" />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between">
          <div className="h-2 bg-slate-200 rounded w-20" />
          <div className="w-9 h-9 rounded-xl bg-slate-200" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-16" />
        <div className="h-2 bg-slate-200 rounded w-28 mt-auto" />
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex-1 overflow-y-auto bg-slate-50" style={{ padding:'20px 24px' }}>
      <div className="flex flex-col gap-5 max-w-[1400px] mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between animate-pulse">
          <div>
            <div className="h-5 bg-slate-200 rounded w-52 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-36" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-slate-200 rounded-xl w-36" />
            <div className="h-9 bg-slate-200 rounded-xl w-36" />
          </div>
        </div>
        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <KpiSkeleton key={i} />)}
        </div>
        {/* Body */}
        <div className="grid grid-cols-5 gap-4 animate-pulse">
          <div className="col-span-3 bg-white rounded-2xl border border-slate-100 h-64" />
          <div className="col-span-2 bg-white rounded-2xl border border-slate-100 h-64" />
        </div>
        <div className="grid grid-cols-3 gap-4 animate-pulse">
          {[0,1,2].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-48" />)}
        </div>
      </div>
    </div>
  );

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

  const faltasHoje = appointments.filter(a => a.status === 'faltou').length;
  const nowD = new Date();
  const dGreeting = nowD.getHours() < 12 ? 'Bom dia' : nowD.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const heroAppt = appointments.find(a => a.status === 'em_atendimento')
    ?? appointments.filter(a => ['aguardando','confirmado','agendado'].includes(a.status))
         .sort((a,b) => (a.start_time??'').localeCompare(b.start_time??''))[0];
  const dTypeLabel: Record<string,string> = {
    consulta:'Consulta', retorno:'Retorno', primeira_consulta:'1ª Consulta',
    avaliacao:'Avaliação', exame:'Exame', procedimento:'Procedimento', teleconsulta:'Teleconsulta',
  };

  const updateStatus = (id: string, status: string) => {
    const prev = appointments.find(x => x.id === id);
    setAppointments(a => a.map(x => x.id === id ? { ...x, status } : x));
    supabase.from('appointments').update({ status }).eq('id', id)
      .then(({ error }) => {
        if (error) {
          setAppointments(a => a.map(x => x.id === id ? { ...x, status: prev?.status ?? x.status } : x));
          alert('Erro ao atualizar status. Tente novamente.');
        }
      });
  };

  const suggestions: { icon:string; color:string; bg:string; text:string; action?:()=>void }[] = [];
  if (waiting > 0) suggestions.push({ icon:'user', color:'#0066D0', bg:'#EFF6FF', text:`${waiting} paciente${waiting>1?'s':''} aguardando na sala de espera` });
  lowStock.forEach(i => suggestions.push({ icon:'bell', color:'#EF4444', bg:'#FEE2E2', text:`Estoque crítico: ${i.name} (${i.quantity} ${i.unit??'un'})`, action:()=>onNavigate?.('estoque') }));
  if (pendRecVal > 0) suggestions.push({ icon:'dollar', color:'#D97706', bg:'#FFFBEB', text:`${fmtCurrency(pendRecVal)} em receitas pendentes (${pendRec.length})`, action:()=>onNavigate?.('financas') });
  if (pendDespVal > 0) suggestions.push({ icon:'dollar', color:'#EF4444', bg:'#FEE2E2', text:`${fmtCurrency(pendDespVal)} em despesas pendentes (${pendDesp.length})`, action:()=>onNavigate?.('financas') });

  // 7-day chart data
  const chartData = (() => {
    const days: { day: string; receita: number; despesa: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowD);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','');
      const dayTx = chartTx.filter(t => t.date === iso);
      days.push({
        day: label.charAt(0).toUpperCase() + label.slice(1),
        receita: dayTx.filter(t => t.type === 'receita').reduce((s,t) => s + Number(t.amount), 0),
        despesa: dayTx.filter(t => t.type === 'despesa').reduce((s,t) => s + Number(t.amount), 0),
      });
    }
    return days;
  })();

  const ssMap: Record<string,{c:string;bg:string;label:string}> = {
    agendado:      {c:'#2563EB', bg:'#EFF6FF', label:'Agendado'},
    confirmado:    {c:'#0F766E', bg:'#F0FDFA', label:'Confirmado'},
    aguardando:    {c:'#D97706', bg:'#FEF3C7', label:'Aguardando'},
    em_atendimento:{c:'#7C3AED', bg:'#F5F3FF', label:'Em atend.'},
    concluido:     {c:'#10B981', bg:'#D1FAE5', label:'Concluído'},
    faltou:        {c:'#EF4444', bg:'#FEE2E2', label:'Faltou'},
    cancelado:     {c:'#9CA3AF', bg:'#F3F4F6', label:'Cancelado'},
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50" style={{ padding:'20px 24px' }}>
      <div className="flex flex-col gap-5 max-w-[1400px] mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {dGreeting}, Dr. {(() => { const n = doctor.name.split(' ').slice(-1)[0]; return n.charAt(0).toUpperCase()+n.slice(1); })()} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {nowD.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              {' · '}
              <span className={totalAppt > 0 ? 'text-blue-600 font-medium' : 'text-slate-400'}>
                {totalAppt} atendimento{totalAppt !== 1 ? 's' : ''} hoje
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {(['hoje','semana','mes'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-2 text-xs font-semibold transition-all cursor-pointer border-0 ${period === p ? 'bg-blue-600 text-white' : 'text-slate-500 bg-white'}`}
                  style={{ fontFamily:'inherit' }}>
                  {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>
            <button className="relative w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 cursor-pointer"
              style={{ background:'#fff', border:'1px solid #E2E8F0' }}>
              <Bell size={18} />
              {(lowStock.length > 0 || pendRec.length > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-4 gap-4">
          {kpiLoading ? (
            [0,1,2,3].map(i => <KpiSkeleton key={i} />)
          ) : (<>
            <KpiCard
              label="Pacientes hoje"
              value={totalAppt}
              sub={`${confirmed} confirmados`}
              trend={totalAppt > 5 ? 'up' : totalAppt > 0 ? 'neutral' : 'down'}
              trendVal={`${totalAppt} agendados`}
              color="blue"
              icon={<Users size={18} />}
            />
            <KpiCard
              label="Faturamento semana"
              value={fmtCurrency(receitas)}
              sub={`${fmtCurrency(despesas)} em despesas`}
              trend={saldo >= 0 ? 'up' : 'down'}
              trendVal={`Saldo ${fmtCurrency(saldo)}`}
              color="emerald"
              icon={<DollarSign size={18} />}
            />
            <KpiCard
              label="Atendidos hoje"
              value={attended}
              sub={totalAppt > 0 ? `${Math.round(attended/totalAppt*100)}% de conclusão` : 'Sem agendamentos'}
              trend={attended > 0 ? 'up' : 'neutral'}
              trendVal={`${waiting} aguardando`}
              color="violet"
              icon={<CheckCircle2 size={18} />}
            />
            <KpiCard
              label="Faltas hoje"
              value={faltasHoje}
              sub={`${totalPatients} pacientes ativos`}
              trend={faltasHoje > 2 ? 'down' : faltasHoje > 0 ? 'neutral' : 'up'}
              trendVal={faltasHoje > 0 ? `${faltasHoje} falta${faltasHoje > 1 ? 's' : ''}` : 'Sem faltas'}
              color="rose"
              icon={<UserX size={18} />}
            />
          </>)}
        </div>

        {/* MIDDLE ROW: Chart + Hero + Finance */}
        <div className="grid grid-cols-5 gap-4">

          {/* Area Chart — Receita 7 dias */}
          <div className="col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Receita vs Despesa</h3>
                <p className="text-xs text-slate-400 mt-0.5">Últimos 7 dias</p>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span style={{ display:'inline-block', width:12, height:2, background:'#3B82F6', borderRadius:9999 }} />Receita
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span style={{ display:'inline-block', width:12, height:2, background:'#F87171', borderRadius:9999 }} />Despesa
                </span>
              </div>
            </div>
            {kpiLoading ? (
              <div className="animate-pulse bg-slate-100 rounded-xl" style={{ height: 180 }} />
            ) : <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F87171" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize:11, fill:'#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:'#94A3B8' }} axisLine={false} tickLine={false}
                  tickFormatter={(v:number) => v === 0 ? '0' : `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v, name) => [fmtCurrency(Number(v ?? 0)), name === 'receita' ? 'Receita' : 'Despesa']}
                  contentStyle={{ borderRadius:10, border:'1px solid #E2E8F0', fontSize:12, boxShadow:'0 4px 16px #0000001A' }} />
                <Area type="monotone" dataKey="receita" stroke="#3B82F6" strokeWidth={2.5}
                  fill="url(#gRec)" dot={false} activeDot={{ r:4, fill:'#3B82F6' }} />
                <Area type="monotone" dataKey="despesa" stroke="#F87171" strokeWidth={2}
                  fill="url(#gDesp)" dot={false} activeDot={{ r:3, fill:'#F87171' }} />
              </AreaChart>
            </ResponsiveContainer>}
          </div>

          {/* Right col: Hero + Finance */}
          <div className="col-span-2 flex flex-col gap-4">

            {/* Próximo Atendimento */}
            {heroAppt ? (
              <div className="flex-1 rounded-2xl p-5 flex flex-col gap-3"
                style={{ background:'linear-gradient(135deg,#1D4ED8 0%,#4338CA 100%)', boxShadow:'0 4px 20px #1D4ED833' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"
                      style={{ boxShadow:'0 0 0 3px #4ade8044' }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'#BAE6FD' }}>
                      {heroAppt.status === 'em_atendimento' ? 'Em atendimento' : 'Próximo'}
                    </span>
                  </div>
                  <span className="text-xl font-extrabold text-white">{heroAppt.start_time?.slice(0,5)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                    style={{ background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.35)' }}>
                    {initials(heroAppt.patients?.name ?? 'P')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-white truncate">{heroAppt.patients?.name ?? 'Paciente'}</div>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ background:'rgba(255,255,255,0.2)' }}>
                        {dTypeLabel[heroAppt.type] ?? heroAppt.type}
                      </span>
                      {heroAppt.patients?.insurance && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background:'rgba(255,255,255,0.1)', color:'#BAE6FD' }}>
                          {heroAppt.patients.insurance}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {heroAppt.status === 'agendado' && <>
                    <button onClick={() => updateStatus(heroAppt.id,'confirmado')}
                      className="inline-flex items-center justify-center h-8 flex-1 rounded-xl bg-primary text-white text-xs font-bold shadow-sm transition-all hover:bg-primary/90 hover:shadow">
                      ✓ Confirmar
                    </button>
                    <button onClick={() => { if (window.confirm('Marcar como faltou?')) updateStatus(heroAppt.id,'faltou'); }}
                      className="inline-flex items-center justify-center h-8 px-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-semibold transition-all hover:bg-red-100">
                      Faltou
                    </button>
                  </>}
                  {heroAppt.status === 'confirmado' && <>
                    <button onClick={() => updateStatus(heroAppt.id,'aguardando')}
                      className="inline-flex items-center justify-center h-8 flex-1 rounded-xl bg-warning text-white text-xs font-bold shadow-sm transition-all hover:bg-warning/90 hover:shadow">
                      Check-in na Sala
                    </button>
                    <button onClick={() => { if (window.confirm('Marcar como faltou?')) updateStatus(heroAppt.id,'faltou'); }}
                      className="inline-flex items-center justify-center h-8 px-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-semibold transition-all hover:bg-red-100">
                      Faltou
                    </button>
                  </>}
                  {heroAppt.status === 'aguardando' && <>
                    <button onClick={() => updateStatus(heroAppt.id,'em_atendimento')}
                      className="inline-flex items-center justify-center h-8 flex-1 rounded-xl bg-primary text-white text-xs font-bold shadow-sm transition-all hover:bg-primary/90 hover:shadow">
                      ▶ Iniciar Atendimento
                    </button>
                    <button onClick={() => { if (window.confirm('Marcar como faltou?')) updateStatus(heroAppt.id,'faltou'); }}
                      className="inline-flex items-center justify-center h-8 px-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-semibold transition-all hover:bg-red-100">
                      Faltou
                    </button>
                  </>}
                  {heroAppt.status === 'em_atendimento' && (
                    <button onClick={() => updateStatus(heroAppt.id,'concluido')}
                      className="inline-flex items-center justify-center h-8 flex-1 rounded-xl bg-success text-white text-xs font-bold shadow-sm transition-all hover:bg-success/90 hover:shadow">
                      ✓ Concluir Atendimento
                    </button>
                  )}
                  {heroAppt.patient_id && (
                    <button onClick={() => onNavigateProntuario?.(heroAppt.patient_id)}
                      className="inline-flex items-center justify-center h-8 px-3 rounded-xl border border-border bg-card text-foreground text-xs font-semibold transition-all hover:bg-muted hover:border-primary/40">
                      📋 Prontuário
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-2 p-6 text-center" style={{ minHeight:160 }}>
                <Calendar size={32} style={{ color:'#CBD5E1' }} />
                <div className="text-sm font-semibold text-slate-400">Sem atendimentos pendentes</div>
                <button onClick={onNewAppointment}
                  className="inline-flex items-center justify-center h-8 px-4 rounded-xl bg-primary text-white text-xs font-bold shadow-sm transition-all hover:bg-primary/90 hover:shadow">
                  + Novo Agendamento
                </button>
              </div>
            )}

            {/* Financeiro resumo */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">Financeiro da Semana</span>
                <button onClick={() => onNavigate?.('financas')}
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                  Ver mais →
                </button>
              </div>
              <div className="text-2xl font-extrabold leading-none mb-3"
                style={{ color: saldo >= 0 ? '#10B981' : '#EF4444' }}>
                {fmtCurrency(saldo)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-2.5" style={{ background:'#F0FDF4' }}>
                  <div className="text-[10px] text-slate-500 mb-1">↑ Receitas</div>
                  <div className="text-sm font-bold" style={{ color:'#10B981' }}>{fmtCurrency(receitas)}</div>
                </div>
                <div className="rounded-xl p-2.5" style={{ background:'#FEF2F2' }}>
                  <div className="text-[10px] text-slate-500 mb-1">↓ Despesas</div>
                  <div className="text-sm font-bold" style={{ color:'#EF4444' }}>{fmtCurrency(despesas)}</div>
                </div>
              </div>
              {(pendRecVal > 0 || pendDespVal > 0) && (
                <div className="mt-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium"
                  style={{ background:'#FFFBEB', borderColor:'#FDE68A', color:'#92400E' }}>
                  ⚠️ {pendRec.length + pendDesp.length} transação(ões) pendente(s) · {fmtCurrency(pendRecVal + pendDespVal)}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* BOTTOM ROW: Agenda + Assistente */}
        <div className="grid grid-cols-5 gap-4">

          {/* Agenda do Dia */}
          <div className="col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom:'1px solid #F1F5F9' }}>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-800">Agenda de Hoje</h3>
                <span className="text-xs text-slate-400">
                  {nowD.toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {[
                  {color:'#10B981',label:'Concluído'},
                  {color:'#7C3AED',label:'Em atend.'},
                  {color:'#D97706',label:'Aguardando'},
                  {color:'#EF4444',label:'Faltou'},
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
            {appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Calendar size={36} className="text-muted-foreground/30" />
                <div className="text-sm font-medium text-muted-foreground">Nenhum agendamento hoje</div>
                <button onClick={onNewAppointment}
                  className="inline-flex items-center justify-center h-8 px-4 rounded-xl bg-primary/10 text-primary text-xs font-bold transition-all hover:bg-primary/20">
                  + Novo Agendamento
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {appointments.map((a, i) => {
                  const name = a.patients?.name ?? 'Paciente';
                  const avatarBg  = ['#DBEAFE','#FEF3C7','#F0FDFA','#F3E8FF','#FEE2E2'][i%5];
                  const avatarTxt = ['#0066D0','#92400E','#0F766E','#7C3AED','#991B1B'][i%5];
                  const isDone = ['concluido','faltou','cancelado'].includes(a.status);
                  const ss = ssMap[a.status] ?? {c:'#9CA3AF', bg:'#F3F4F6', label:a.status};
                  return (
                    <div key={a.id} className={`
                      flex items-center gap-3 px-4 py-3 transition-all
                      ${i < appointments.length-1 ? 'border-b border-border/50' : ''}
                      ${a.status==='em_atendimento' ? 'bg-primary/5' : 'bg-card'}
                      ${isDone ? 'opacity-60' : 'opacity-100'}
                    `}>
                      <div className="flex w-10 flex-shrink-0 flex-col items-center text-center">
                        <div className="text-sm font-bold text-foreground">{a.start_time?.slice(0,5)}</div>
                        <div className="text-[10px] text-muted-foreground">{a.end_time?.slice(0,5)}</div>
                      </div>
                      <div className="w-1 flex-shrink-0 self-stretch rounded-full bg-primary/20" />
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: avatarBg, color: avatarTxt }}>
                        {initials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{name}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span>{dTypeLabel[a.type] ?? a.type.replace(/_/g,' ')}</span>
                          {a.patients?.insurance && <><span className="text-muted-foreground/40">·</span><span>{a.patients?.insurance}</span></>}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: statusMeta.bg || '#F1F5F9', color: statusMeta.textColor || '#374151' }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusMeta.dot || '#64748B' }} />
                        {ss.label}
                      </span>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        {a.status==='agendado' && <>
                          <button onClick={()=>updateStatus(a.id,'confirmado')} className="inline-flex h-7 items-center rounded-lg bg-success px-2.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-success/90 hover:shadow">Confirmar</button>
                          <button onClick={()=>{ if(window.confirm('Marcar como faltou?')) updateStatus(a.id,'faltou'); }} className="inline-flex h-7 items-center rounded-lg bg-destructive px-2.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-destructive/90">Faltou</button>
                        </>}
                        {a.status==='confirmado' && <>
                          <button onClick={()=>updateStatus(a.id,'aguardando')} className="inline-flex h-7 items-center rounded-lg bg-warning px-2.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-warning/90 hover:shadow">Check-in</button>
                          <button onClick={()=>{ if(window.confirm('Marcar como faltou?')) updateStatus(a.id,'faltou'); }} className="inline-flex h-7 items-center rounded-lg bg-destructive px-2.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-destructive/90">Faltou</button>
                        </>}
                        {a.status==='aguardando' && <>
                          <button onClick={()=>updateStatus(a.id,'em_atendimento')} className="inline-flex h-7 items-center rounded-lg bg-primary px-2.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow">▶ Iniciar</button>
                          <button onClick={()=>{ if(window.confirm('Marcar como faltou?')) updateStatus(a.id,'faltou'); }} className="inline-flex h-7 items-center rounded-lg bg-destructive px-2.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-destructive/90">Faltou</button>
                        </>}
                        {a.status==='em_atendimento' && (
                          <button onClick={()=>updateStatus(a.id,'concluido')} className="inline-flex h-7 items-center rounded-lg bg-success px-2.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-success/90 hover:shadow">✓ Concluir</button>
                        )}
                        {a.patient_id && (
                          <button onClick={()=>onNavigateProntuario?.(a.patient_id)} className="inline-flex h-7 items-center rounded-lg border border-border bg-muted px-2 text-[10px] font-bold text-foreground transition-all hover:bg-background">📋</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna direita: Assistente + Base de Pacientes */}
          <div className="col-span-2 flex flex-col gap-4">

            {/* Assistente Inteligente */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom:'1px solid #F1F5F9' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#1D4ED8,#7C3AED)' }}>🤖</div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Assistente Inteligente</div>
                  <div className="text-[10px] text-slate-400">Insights e alertas do dia</div>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {suggestions.length === 0 ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background:'#F0FDF4' }}>
                    <span style={{ fontSize:20 }}>✅</span>
                    <div>
                      <div className="text-xs font-bold" style={{ color:'#065F46' }}>Tudo em ordem!</div>
                      <div className="text-[10px]" style={{ color:'#059669' }}>Nenhum alerta no momento</div>
                    </div>
                  </div>
                ) : suggestions.map((s, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:s.bg, borderRadius:10, border:`1px solid ${s.color}22` }}>
                    <Icon name={s.icon} size={13} color={s.color} />
                    <span style={{ flex:1, fontSize:11, color:s.color, fontWeight:500, lineHeight:1.3 }}>{s.text}</span>
                    {s.action && (
                      <button onClick={s.action}
                        style={{ fontSize:10, fontWeight:700, color:s.color, background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', padding:0, textDecoration:'underline', flexShrink:0 }}>
                        Ver →
                      </button>
                    )}
                  </div>
                ))}
                {totalAppt > 0 && (
                  <div style={{ marginTop:4, padding:'10px 12px', background:'#F8FAFC', borderRadius:10, border:'1px solid #F1F5F9' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:11, color:'#6B7280', fontWeight:500 }}>Taxa de conclusão</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'#111827' }}>{Math.round(attended/totalAppt*100)}%</span>
                    </div>
                    <div style={{ height:6, background:'#E2E8F0', borderRadius:9999, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:Math.round(attended/totalAppt*100)+'%', background:'linear-gradient(90deg,#3B82F6,#10B981)', borderRadius:9999 }} />
                    </div>
                    <div style={{ fontSize:10, color:'#9CA3AF', marginTop:4 }}>{attended} de {totalAppt} concluído{attended!==1?'s':''}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Base de Pacientes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700">Base de Pacientes</span>
                <button onClick={() => onNavigate?.('pacientes')}
                  style={{ fontSize:11, color:'#2563EB', fontWeight:600, background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                  Ver todos →
                </button>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 leading-none">{totalPatients}</div>
                  <div className="text-[10px] text-slate-400 mt-1">pacientes ativos</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:10, color:'#6B7280' }}>Novos esta semana</span>
                    <span style={{ fontSize:12, fontWeight:700, color:'#2563EB' }}>+{newPtsWeek}</span>
                  </div>
                  <div style={{ height:6, background:'#F1F5F9', borderRadius:9999, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'#3B82F6', borderRadius:9999, width: totalPatients > 0 ? Math.min(100, Math.round(newPtsWeek/Math.max(totalPatients,1)*100*5))+'%' : '0%' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ANÁLISE DO PERÍODO (colapsável) */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <button onClick={() => setShowAnalytics(s => !s)}
            style={{ width:'100%', padding:'13px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', borderBottom:showAnalytics?'1px solid #F1F5F9':'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Activity size={15} color="#2563EB" />
              <span style={{ fontSize:14, fontWeight:700, color:'#111827' }}>Análise do Período</span>
              <span style={{ fontSize:11, color:'#9CA3AF' }}>relatórios e estatísticas avançadas</span>
            </div>
            <ChevronRight size={14} color="#9CA3AF" style={{ transform:showAnalytics?'rotate(90deg)':'none', transition:'transform 0.2s' }} />
          </button>
          {showAnalytics && (
            <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:14 }}>
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
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' as const }}>
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
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                      {([
                        { label:'Agendados',   value:anAppts.length, numColor:'#374151', iconBg:'#F3F4F6', iconColor:'#6B7280', icon:'calendar' },
                        { label:'Confirmados', value:anConfirmados,  numColor:'#0066D0', iconBg:'#EFF6FF', iconColor:'#0066D0', icon:'check' },
                        { label:'Atendidos',   value:anConcluidos,   numColor:'#10B981', iconBg:'#D1FAE5', iconColor:'#10B981', icon:'check' },
                        { label:'Faltaram',    value:anFaltaram,     numColor:'#EF4444', iconBg:'#FEE2E2', iconColor:'#EF4444', icon:'bell' },
                      ] as const).map((k,i)=>(
                        <Card key={i} style={{ padding:'14px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, textAlign:'center' as const }}>
                          <div style={{ fontSize:32, fontWeight:700, color:k.numColor, lineHeight:1 }}>{k.value}</div>
                          <div style={{ fontSize:12, color:'#6B7280' }}>{k.label}</div>
                          <div style={{ width:32, height:32, borderRadius:8, background:k.iconBg, display:'flex', alignItems:'center', justifyContent:'center', marginTop:2 }}>
                            <Icon name={k.icon} size={15} color={k.iconColor} />
                          </div>
                        </Card>
                      ))}
                    </div>
                    {anLoading ? <Spinner /> : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                        <Card style={{ padding:'14px 16px' }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#0066D0', marginBottom:10 }}>Pacientes</div>
                          <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
                            <DonutChart pct={novosPct} size={108} stroke={18} color="#60A5FA" bg="#BAE6FD">
                              <div style={{ textAlign:'center' as const }}>
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
                              {label:'Homens',  pct:homensPct,   total:homens,   color:'#0066D0', bg:'#DBEAFE'},
                              {label:'Mulheres',pct:mulheresPct, total:mulheres, color:'#EC4899', bg:'#FCE7F3'},
                            ].map((g,i)=>(
                              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                                <DonutChart pct={g.pct} size={42} stroke={7} color={g.color} bg={g.bg}>
                                  <span style={{ fontSize:9, fontWeight:700, color:g.color }}>{g.pct}%</span>
                                </DonutChart>
                                <div style={{ textAlign:'center' as const }}>
                                  <div style={{ fontSize:11, fontWeight:600, color:g.color }}>{g.label}</div>
                                  <div style={{ fontSize:10, color:'#9CA3AF' }}>Total: {g.total}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                        <Card style={{ padding:'14px 16px' }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#0066D0', marginBottom:10 }}>Procedimentos realizados</div>
                          <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
                            <DonutChart pct={totalProcs>0?100:0} size={108} stroke={18} color={PROC_COLORS[0]} bg="#E5E7EB">
                              <div style={{ textAlign:'center' as const }}>
                                <div style={{ fontSize:26, fontWeight:700, color:'#111827' }}>{totalProcs}</div>
                                <div style={{ fontSize:10, color:'#9CA3AF' }}>Procedimentos</div>
                              </div>
                            </DonutChart>
                          </div>
                          {byType.length===0
                            ? <div style={{ textAlign:'center' as const, fontSize:11, color:'#9CA3AF' }}>Sem dados</div>
                            : <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                                {byType.slice(0,4).map((t,i)=>(
                                  <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                                    <div style={{ width:8, height:8, borderRadius:'50%', background:PROC_COLORS[i%PROC_COLORS.length], flexShrink:0 }} />
                                    <span style={{ flex:1, fontSize:11, color:'#6B7280', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{t.label}</span>
                                    <span style={{ fontSize:11, fontWeight:600, color:'#111827' }}>{t.count}</span>
                                  </div>
                                ))}
                              </div>
                          }
                        </Card>
                        <Card style={{ padding:'14px 16px' }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#0066D0', marginBottom:10 }}>Pacientes x Convênio</div>
                          <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
                            <DonutChart pct={partPct} size={108} stroke={18} color="#60A5FA" bg="#FDE68A">
                              <div style={{ textAlign:'center' as const }}>
                                <div style={{ fontSize:20, fontWeight:700, color:'#111827' }}>{anAppts.length}</div>
                                <div style={{ fontSize:10, color:'#9CA3AF' }}>Pacientes</div>
                              </div>
                            </DonutChart>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                            {[
                              {label:'Particular',count:particularA,pct:partPct,color:'#60A5FA'},
                              {label:'Convênio',  count:convenioA,  pct:convPct, color:'#F59E0B'},
                            ].map((row,i)=>(
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <div style={{ width:8, height:8, borderRadius:'50%', background:row.color, flexShrink:0 }} />
                                <span style={{ flex:1, fontSize:12, color:'#6B7280' }}>{row.label}</span>
                                <span style={{ fontSize:12, fontWeight:700, color:'#111827' }}>{row.count}</span>
                                <span style={{ fontSize:11, color:'#9CA3AF', minWidth:28, textAlign:'right' as const }}>{row.pct}%</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                        <Card style={{ padding:'14px 16px' }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#0066D0', marginBottom:10 }}>Duração do atendimento</div>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:14 }}>
                            <Icon name="clock" size={22} color="#6B7280" />
                            <span style={{ fontSize:28, fontWeight:700, color:'#111827', fontStyle:'italic' }}>
                              {anAvgDur>0?`${anAvgDur}min`:'—'}
                            </span>
                          </div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:8 }}>Por tipo de consulta</div>
                          {byType.length===0
                            ? <div style={{ textAlign:'center' as const, fontSize:11, color:'#9CA3AF' }}>Sem dados</div>
                            : (() => {
                                const TYPE_DUR2: Record<string,number> = { consulta:30, retorno:15, primeira_consulta:45, avaliacao:30, exame:60, procedimento:45, teleconsulta:20 };
                                const TYPE_VAL  = PROC_TYPES.map(t => ({
                                  label: t.label,
                                  dur:   TYPE_DUR2[t.value] ?? 30,
                                  count: anAppts.filter(a => a.type === t.value).length,
                                })).filter(t => t.count > 0).slice(0,4);
                                return (
                                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                                    {TYPE_VAL.map((t,i) => (
                                      <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11 }}>
                                        <div style={{ width:8, height:8, borderRadius:'50%', background:PROC_COLORS[i%PROC_COLORS.length], flexShrink:0 }} />
                                        <span style={{ flex:1, color:'#6B7280', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{t.label}</span>
                                        <span style={{ color:'#111827', fontWeight:600, minWidth:38, textAlign:'right' as const }}>{t.dur}min</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()
                          }
                        </Card>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   AGENDA — DATE HELPERS
───────────────────────────────────────── */
/** Monday of the week that contains `dateIso` */
function weekStartFor(dateIso: string): string {
  const d = new Date(dateIso + 'T12:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().split('T')[0];
}
/** Shift an ISO date by N days */
function shiftDays(dateIso: string, n: number): string {
  const d = new Date(dateIso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

/* ─────────────────────────────────────────
   MINI CALENDAR PICKER
───────────────────────────────────────── */
const MONTH_NAMES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DOW_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function MiniCalendar({ selected, onSelect, onClose }: {
  selected: string;
  onSelect: (iso: string) => void;
  onClose:  () => void;
}) {
  const [vy, setVy] = useState(() => parseInt(selected.slice(0, 4)));
  const [vm, setVm] = useState(() => parseInt(selected.slice(5, 7)) - 1);

  const hols        = { ...getBrazilHolidays(vy), ...getBrazilHolidays(vy + 1) };
  const selWeekMon  = weekStartFor(selected);
  const todayIso    = todayISO();

  const firstOfMonth = new Date(vy, vm, 1);
  const startPad     = (firstOfMonth.getDay() + 6) % 7; // Mon = 0
  const daysInMonth  = new Date(vy, vm + 1, 0).getDate();
  const totalCells   = Math.ceil((startPad + daysInMonth) / 7) * 7;

  const prevM = () => vm === 0  ? (setVy(y => y - 1), setVm(11)) : setVm(m => m - 1);
  const nextM = () => vm === 11 ? (setVy(y => y + 1), setVm(0))  : setVm(m => m + 1);

  const navBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
    color: '#6B7280', padding: '0 6px', fontFamily: 'inherit', lineHeight: 1,
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />

      {/* Calendar popup */}
      <div style={{
        position: 'absolute', zIndex: 1000, top: '100%', left: 0, marginTop: 4,
        background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB',
        boxShadow: '0 8px 30px rgba(0,0,0,.14)', padding: '12px 10px', width: 252,
      }}>
        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={prevM} style={navBtn}>«</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0066D0' }}>
            {MONTH_NAMES_PT[vm]} {vy}
          </span>
          <button onClick={nextM} style={navBtn}>»</button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
          {DOW_PT.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#9CA3AF', padding: '2px 0' }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
          {Array.from({ length: totalCells }, (_, ci) => {
            const dayNum = ci - startPad + 1;
            if (dayNum < 1 || dayNum > daysInMonth) return <div key={ci} />;

            const iso        = `${vy}-${String(vm + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday    = iso === todayIso;
            const isHol      = !!hols[iso];
            const inSelWeek  = weekStartFor(iso) === selWeekMon;
            const isSun      = (ci + 1) % 7 === 0;
            const isSat      = ci % 7 === 6;

            return (
              <div key={ci} onClick={() => { onSelect(iso); onClose(); }}
                title={isHol ? hols[iso] : undefined}
                style={{
                  height: 32, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, cursor: 'pointer', position: 'relative',
                  background: inSelWeek ? '#DBEAFE' : 'transparent',
                  border: isToday ? '1.5px solid #0066D0' : '1.5px solid transparent',
                }}>
                <span style={{
                  fontSize: 12, fontWeight: isToday ? 700 : 400,
                  color: isHol ? '#BE123C' : isSat || isSun ? '#9CA3AF' : isToday ? '#0066D0' : '#374151',
                }}>
                  {dayNum}
                </span>
                {isHol && (
                  <div style={{
                    position: 'absolute', bottom: 3,
                    width: 4, height: 4, borderRadius: '50%', background: '#BE123C',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Today shortcut */}
        <button onClick={() => { onSelect(todayIso); onClose(); }} style={{
          marginTop: 10, width: '100%', height: 30, background: '#EFF6FF',
          border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 12,
          color: '#0066D0', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Hoje
        </button>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   AGENDA — DND HELPERS
───────────────────────────────────────── */
function DroppableSlot({ id, isWeekend, isHoliday, children }: {
  id: string; isWeekend: boolean; isHoliday?: boolean; children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const bg = isOver ? '#DBEAFE' : isHoliday ? '#FFF1F2' : isWeekend ? '#FAFAFA' : '#fff';
  return (
    <div ref={setNodeRef} style={{
      borderRight: '1px solid #E5E7EB',
      borderBottom: '1px solid #F3F4F6',
      minHeight: 28,
      background: bg,
      padding: 2,
      transition: 'background .1s',
    }}>
      {children}
    </div>
  );
}

// APPT_STATUS_META removido — usar STATUS_META importado de @/components/calendar/utils

function DraggableAppt({ appt, onDetail }: { appt: Appointment; onDetail?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appt.id,
    data: { appt },
  });
  const color   = STATUS_COLORS[appt.status]?.color ?? '#00BCD4';
  const bg      = STATUS_COLORS[appt.status]?.bg    ?? '#B2EBF2';
  const moveRef = React.useRef(false);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const sMeta = STATUS_META[appt.status];

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setTooltipRect(e.currentTarget.getBoundingClientRect());
  }, []);
  const handleMouseLeave = useCallback(() => setTooltipRect(null), []);

  const showTooltip = !!tooltipRect && !isDragging && !!sMeta;

  return (
    <>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onPointerDown={() => { moveRef.current = false; }}
        onPointerMove={() => { moveRef.current = true; }}
        onPointerUp={() => { if (!moveRef.current && !isDragging) onDetail?.(); }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          background: bg,
          borderLeft: `3px solid ${color}`,
          borderRadius: 4,
          padding: '4px 7px',
          fontSize: 10,
          color,
          lineHeight: 1.35,
          cursor: isDragging ? 'grabbing' : 'pointer',
          opacity: isDragging ? 0.35 : 1,
          transform: DndCSS.Translate.toString(transform),
          position: 'relative',
          zIndex: isDragging ? 999 : 1,
          userSelect: 'none',
          marginBottom: 2,
          transition: 'box-shadow .1s',
          boxShadow: showTooltip ? '0 2px 8px rgba(0,0,0,.12)' : 'none',
        }}
      >
        <div style={{ fontWeight: 700 }}>{appt.start_time?.slice(0, 5)}–{appt.end_time?.slice(0, 5)}</div>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {appt.patients?.name ?? 'Paciente'}
        </div>
      </div>

      {showTooltip && sMeta && tooltipRect && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          left: tooltipRect.right + 8,
          top: Math.max(4, tooltipRect.top + tooltipRect.height / 2 - 30),
          zIndex: 99999,
          pointerEvents: 'none',
          background: sMeta.bg,
          border: `1.5px solid ${sMeta.border}`,
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 4px 20px rgba(0,0,0,.14)',
          minWidth: 170,
          maxWidth: 240,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: sMeta.dot, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: sMeta.textColor }}>{sMeta.label}</span>
          </div>
          <div style={{ fontSize: 12, color: sMeta.textColor, opacity: 0.8, lineHeight: 1.4 }}>{sMeta.desc}</div>
        </div>,
        document.body,
      )}
    </>
  );
}

/* ─────────────────────────────────────────
   AGENDA SCREEN
───────────────────────────────────────── */
function Agenda() {
  const doctor  = React.useContext(DoctorContext);
  const access  = useAllowedDoctors();
  const [view,         setView]         = useState<'DIA' | 'SEMANA'>('SEMANA');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showAddAppt,  setShowAddAppt]  = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [activeAppt,         setActiveAppt]         = useState<Appointment | null>(null);
  const [refDate,            setRefDate]            = useState(todayISO());
  const [showPicker,         setShowPicker]         = useState(false);
  const [detailAppt,         setDetailAppt]         = useState<Appointment | null>(null);
  const [atendimentoAppt,    setAtendimentoAppt]    = useState<Appointment | null>(null);
  const scrollRef                                    = useRef<HTMLDivElement>(null);
  const [nowTop,             setNowTop]             = useState<number | null>(null);

  const today    = todayISO();
  const wStart   = weekStartFor(refDate);
  const wEnd     = shiftDays(wStart, 6);
  const holidays = getBrazilHolidays(new Date(refDate + 'T12:00:00').getFullYear());

  const allDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(wStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return {
      name:    names[d.getDay()],
      date:    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      iso:     d.toISOString().split('T')[0],
      isToday: d.toISOString().split('T')[0] === today,
      weekend: d.getDay() === 0 || d.getDay() === 6,
    };
  });
  const agendaDays = view === 'SEMANA'
    ? allDays
    : (allDays.find(d => d.iso === refDate) ? allDays.filter(d => d.iso === refDate) : [allDays[0]]);

  const loadAppointments = (forceIds?: string[]) => {
    setLoading(true);
    const ids = forceIds ?? access.allowedDoctorIds;
    let q = supabase.from('appointments')
      .select('*, patients(id,name,phone,birth_date,insurance)')
      .gte('date', wStart).lte('date', wEnd).order('start_time').limit(200);
    // Aplica filtro por médico só quando os IDs já foram carregados
    if (ids.length > 0) {
      q = applyDoctorFilter(q, ids);
    }
    q.then(({ data }) => { setAppointments((data as Appointment[]) ?? []); setLoading(false); });
  };

  // Dispara imediatamente na montagem (sem esperar access)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAppointments(); }, [wStart]);

  // Quando access terminar de carregar, re-fetch com filtro correto se necessário
  useEffect(() => {
    if (!access.loading) loadAppointments(access.allowedDoctorIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.loading]);

  /* ── Current time indicator ── */
  useEffect(() => {
    function refresh() {
      const now = new Date();
      const m = now.getHours() * 60 + now.getMinutes();
      if (m < 7 * 60 || m > 21 * 60 || !scrollRef.current) { setNowTop(null); return; }
      const todayVisible = today >= wStart && today <= wEnd &&
        (view === 'SEMANA' || refDate === today);
      if (!todayVisible) { setNowTop(null); return; }
      const si = Math.floor((m - 7 * 60) / 30);
      const fr = ((m - 7 * 60) % 30) / 30;
      const el = document.getElementById(`tl-${AGENDA_TIMES[si].replace(':', '')}`);
      if (!el) return;
      const cr = scrollRef.current.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      setNowTop(er.top - cr.top + scrollRef.current.scrollTop + er.height * fr);
    }
    if (!loading) { refresh(); const id = setInterval(refresh, 30_000); return () => clearInterval(id); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, wStart, wEnd, view, refDate]);

  /* ── DnD sensors ── */
  const sensors = useSensors(
    useSensor(MouseSensor,  { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor,  { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveAppt(appointments.find(a => a.id === e.active.id) ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveAppt(null);
    const { active, over } = e;
    if (!over) return;

    // over.id = "YYYY-MM-DD__HH:MM"  — exact cell the user dropped onto
    const parts = String(over.id).split('__');
    if (parts.length !== 2) return;
    const [newDate, newStart] = parts;
    const appt = active.data.current?.appt as Appointment;
    if (!appt) return;

    // No movement
    if (appt.date === newDate && appt.start_time?.slice(0, 5) === newStart) return;

    // Preserve original duration
    const durMins = Math.max(30,
      timeToMinutes(appt.end_time?.slice(0, 5) ?? '09:00') -
      timeToMinutes(appt.start_time?.slice(0, 5) ?? '08:00')
    );
    const newEnd = minutesToTime(timeToMinutes(newStart) + durMins);

    // Optimistic UI update
    setAppointments(prev => prev.map(a =>
      a.id === appt.id ? { ...a, date: newDate, start_time: newStart, end_time: newEnd } : a
    ));

    // Persist to Supabase
    supabase.from('appointments')
      .update({ date: newDate, start_time: newStart, end_time: newEnd })
      .eq('id', appt.id)
      .then(({ error }) => { if (error) loadAppointments(); }); // revert on error
  };

  const cols = `52px repeat(${agendaDays.length}, 1fr)`;

  // Computed for the header
  const todayAppts  = appointments.filter(a => a.date === today);
  const viewDay     = view === 'DIA' ? refDate : null;
  const viewAppts   = viewDay ? appointments.filter(a => a.date === viewDay) : [];
  const isViewToday = viewDay === today;

  const todayLabel = new Date(today + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header: Hoje em destaque + ações ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>

        {/* Top row */}
        <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {/* Título + data */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', textTransform: 'capitalize' }}>
                {isViewToday ? 'Agenda de Hoje' : view === 'DIA'
                  ? new Date(refDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
                  : `Semana ${allDays[0].date} – ${allDays[6].date}`}
              </div>
              {isViewToday && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  background: '#EFF6FF', color: '#0066D0' }}>
                  {todayLabel}
                </span>
              )}
            </div>

            {/* Appointment count strip */}
            {view === 'DIA' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                {[
                  { label: 'Total',     val: viewAppts.length,                                        color: '#374151' },
                  { label: 'Aguardando',val: viewAppts.filter(a => a.status === 'aguardando').length,  color: '#F59E0B' },
                  { label: 'Concluído', val: viewAppts.filter(a => a.status === 'concluido').length,   color: '#10B981' },
                  { label: 'Cancelado', val: viewAppts.filter(a => a.status === 'cancelado').length,   color: '#EF4444' },
                ].filter(s => s.label === 'Total' || s.val > 0).map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      <strong style={{ color: s.color }}>{s.val}</strong> {s.label}
                    </span>
                  </div>
                ))}
                {viewAppts.length === 0 && (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Nenhum agendamento · dia livre</span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowWaitlist(true)} style={{
              height: 34, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 7,
              background: '#fff', fontSize: 12, color: '#374151',
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name="list" size={13} color="#6B7280" /> Lista de espera
            </button>
            <button onClick={() => window.print()} style={{
              height: 34, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 7,
              background: '#fff', fontSize: 12, color: '#374151',
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name="printer" size={13} color="#6B7280" /> Imprimir
            </button>
            <button onClick={() => setShowAddAppt(true)} style={{
              height: 34, padding: '0 16px', background: '#0066D0', color: '#fff',
              border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="plus" size={14} color="#fff" /> Novo Agendamento
            </button>
          </div>
        </div>

        {/* Navigation row */}
        <div style={{ padding: '0 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
            <button onClick={() => setRefDate(d => view === 'SEMANA' ? shiftDays(d, -7) : shiftDays(d, -1))} style={{
              height: 28, width: 28, border: '1px solid #E5E7EB', borderRadius: 6,
              background: '#fff', fontSize: 16, cursor: 'pointer', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151',
            }}>‹</button>

            <button onClick={() => setRefDate(todayISO())} style={{
              height: 28, padding: '0 10px', border: `1px solid ${refDate === today ? '#0066D0' : '#E5E7EB'}`,
              borderRadius: 6, background: refDate === today ? '#EFF6FF' : '#fff',
              fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              color: refDate === today ? '#0066D0' : '#374151', fontWeight: refDate === today ? 600 : 400,
            }}>Hoje</button>

            <button onClick={() => setRefDate(d => view === 'SEMANA' ? shiftDays(d, 7) : shiftDays(d, 1))} style={{
              height: 28, width: 28, border: '1px solid #E5E7EB', borderRadius: 6,
              background: '#fff', fontSize: 16, cursor: 'pointer', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151',
            }}>›</button>

            <button onClick={() => setShowPicker(p => !p)} style={{
              height: 28, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 6,
              background: showPicker ? '#EFF6FF' : '#fff', fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit', color: showPicker ? '#0066D0' : '#374151', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>
                {view === 'SEMANA'
                  ? `${allDays[0].date} – ${allDays[6].date}`
                  : (allDays.find(d => d.iso === refDate)?.date ?? allDays[0].date)}
              </span>
              <span style={{ fontSize: 13 }}>📅</span>
            </button>

            {showPicker && (
              <MiniCalendar
                selected={refDate}
                onSelect={d => { setRefDate(d); setShowPicker(false); }}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>

          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 7, padding: 2 }}>
            {(['DIA', 'SEMANA'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                height: 26, padding: '0 14px', border: 'none', borderRadius: 5,
                background: view === v ? '#fff' : 'transparent',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                fontSize: 12, fontFamily: 'inherit',
                color:  view === v ? '#0066D0' : '#6B7280',
                fontWeight: view === v ? 700 : 400,
                cursor: 'pointer', transition: 'all .15s',
              }}>{v === 'DIA' ? 'Dia' : 'Semana'}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid — renderiza sempre; appointments chegam depois ── */}
      {(
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: cols, minWidth: 600 }}>

              {/* Header row */}
              <div style={{ borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }} />
              {agendaDays.map((d, i) => {
                const holiday = holidays[d.iso];
                return (
                  <div key={i} style={{
                    borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB',
                    padding: '6px 4px', textAlign: 'center',
                    background: holiday ? '#FFF1F2' : d.isToday ? '#EFF6FF' : d.weekend ? '#FAFAFA' : '#fff',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: holiday ? '#BE123C' : d.isToday ? '#0066D0' : '#374151' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: 10, color: holiday ? '#BE123C' : '#9CA3AF', fontWeight: holiday ? 600 : 400 }}>
                      {d.date}
                    </div>
                    {holiday && (
                      <div style={{
                        fontSize: 9, color: '#BE123C', marginTop: 2, lineHeight: 1.2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: '100%', padding: '0 2px',
                        background: '#FFE4E6', borderRadius: 3,
                      }} title={holiday}>
                        🇧🇷 {holiday}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Time slots */}
              {AGENDA_TIMES.map((t, ti) => (
                <React.Fragment key={ti}>
                  {/* Time label */}
                  <div id={`tl-${t.replace(':', '')}`} style={{
                    borderRight: '1px solid #E5E7EB', borderBottom: '1px solid #F3F4F6',
                    padding: '2px 6px 2px 0', fontSize: 10, color: '#9CA3AF', textAlign: 'right',
                    background: '#FAFAFA', userSelect: 'none',
                  }}>
                    {t}
                  </div>

                  {/* Droppable cell per day */}
                  {agendaDays.map((d, di) => {
                    const normTime = (s?: string) => {
                      if (!s) return '';
                      const [h, m] = s.split(':').map(Number);
                      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
                    };
                    const slotAppts = appointments.filter(
                      a => a.date === d.iso && normTime(a.start_time) === t
                    );
                    return (
                      <DroppableSlot key={di} id={`${d.iso}__${t}`} isWeekend={d.weekend} isHoliday={!!holidays[d.iso]}>
                        {slotAppts.map(a => <DraggableAppt key={a.id} appt={a} onDetail={() => setDetailAppt(a)} />)}
                      </DroppableSlot>
                    );
                  })}
                </React.Fragment>
              ))}

            </div>

            {/* ── Current time indicator — linha vermelha de ponta a ponta ── */}
            {nowTop !== null && (
              <div style={{
                position: 'absolute',
                top: nowTop,
                left: 0,
                right: 0,
                pointerEvents: 'none',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
              }}>
                <div style={{ width: 52, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 2 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', background: '#FEE2E2', borderRadius: 3, padding: '0 3px', lineHeight: '14px' }}>
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0, marginLeft: -4 }} />
                <div style={{ flex: 1, height: 2, background: '#EF4444' }} />
              </div>
            )}
          </div>

          {/* Ghost shown while dragging */}
          <DragOverlay dropAnimation={null}>
            {activeAppt && (
              <div style={{
                background: STATUS_COLORS[activeAppt.status]?.bg ?? '#B2EBF2',
                borderLeft: `3px solid ${STATUS_COLORS[activeAppt.status]?.color ?? '#00BCD4'}`,
                borderRadius: 3, padding: '4px 8px', fontSize: 10,
                color: STATUS_COLORS[activeAppt.status]?.color ?? '#006064',
                boxShadow: '0 6px 20px rgba(0,0,0,.18)',
                minWidth: 110, opacity: 0.92, pointerEvents: 'none',
              }}>
                <div style={{ fontWeight: 700 }}>{activeAppt.start_time?.slice(0, 5)}–{activeAppt.end_time?.slice(0, 5)}</div>
                <div>{activeAppt.patients?.name ?? 'Paciente'}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Barra de progresso fina no topo enquanto appointments carregam */}
      {loading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 30, overflow: 'hidden', background: '#E5E7EB' }}>
          <div style={{ height: '100%', background: '#0066D0', animation: 'agendaLoad 1.2s ease-in-out infinite', width: '40%' }} />
          <style>{`@keyframes agendaLoad { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }`}</style>
        </div>
      )}

      {showAddAppt  && <AddAppointmentModal onClose={() => setShowAddAppt(false)} onSaved={() => { setShowAddAppt(false); loadAppointments(); }} />}
      {showWaitlist && <WaitlistModal onClose={() => setShowWaitlist(false)} />}

      {detailAppt && (
        <AppointmentDetailModal
          appt={detailAppt}
          onClose={() => setDetailAppt(null)}
          onStatusChange={(id, status) => {
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            setDetailAppt(prev => prev ? { ...prev, status } : prev);
          }}
          onStartAtendimento={(appt) => {
            setDetailAppt(null);
            setAtendimentoAppt({ ...appt, status: 'em_atendimento' });
            setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'em_atendimento' } : a));
            supabase.from('appointments').update({ status: 'em_atendimento' }).eq('id', appt.id);
          }}
        />
      )}

      {atendimentoAppt && (
        <EHRAtendimento
          appt={atendimentoAppt}
          onClose={() => {
            setAtendimentoAppt(null);
            loadAppointments();
          }}
        />
      )}
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
  const [hoveredPt,   setHoveredPt]   = useState<string | null>(null);
  const [agendarPt,   setAgendarPt]   = useState<Patient | null>(null);
  const [editPt,      setEditPt]      = useState<Patient | null>(null);

  const reloadPatients = () =>
    supabase.from('patients').select('*').eq('active', true).order('name')
      .then(({ data }) => setPatients((data as Patient[]) ?? []));

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

  const iconBtn = (color: string): CSSProperties => ({
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none', border: `1px solid ${color}`, borderRadius: 5,
    cursor: 'pointer', color, fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
    padding: 0, flexShrink: 0,
  });

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
                : filtered.map((p, i) => {
                  const isHov = hoveredPt === p.id;
                  return (
                    <tr key={p.id}
                      onMouseEnter={() => setHoveredPt(p.id)}
                      onMouseLeave={() => setHoveredPt(null)}
                      style={{ borderBottom: '1px solid #F3F4F6', background: isHov ? '#F8FAFF' : 'transparent', transition: 'background .1s', position: 'relative' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: COLORS[i % COLORS.length], color: TCOLORS[i % TCOLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials(p.name)}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.email}</div>
                          </div>
                          {/* Hover popover */}
                          {isHov && (
                            <div style={{
                              position: 'absolute', left: 0, top: '100%', marginTop: 4, zIndex: 50,
                              background: '#fff', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              border: '1px solid #E5E7EB', padding: '10px 14px', minWidth: 220, pointerEvents: 'none',
                            }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 6 }}>{p.name}</div>
                              {p.birth_date && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>🎂 {new Date(p.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>}
                              {p.phone      && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>📱 {p.phone}</div>}
                              {p.email      && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>✉️ {p.email}</div>}
                              {p.insurance  && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>🏥 {p.insurance}</div>}
                              {p.city       && <div style={{ fontSize: 12, color: '#6B7280' }}>📍 {p.city}{p.state ? ` — ${p.state}` : ''}</div>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#374151' }}>{p.phone ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#374151' }}>{p.birth_date ? new Date(p.birth_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                      <td style={{ padding: '10px 14px' }}><Badge variant="blue">{p.insurance ?? 'Particular'}</Badge></td>
                      <td style={{ padding: '10px 14px', width: 120, minWidth: 120, maxWidth: 120 }}>
                        <div style={{ display: 'flex', gap: 5, opacity: isHov ? 1 : 0, pointerEvents: isHov ? 'auto' : 'none', transition: 'opacity .12s', justifyContent: 'flex-end' }}>
                          <button title="Prontuário" onClick={() => onNavigateProntuario?.(p.id)} style={iconBtn('#0066D0')}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          </button>
                          <button title="Agendar" onClick={() => setAgendarPt(p)} style={iconBtn('#059669')}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          </button>
                          <button title="Editar" onClick={() => setEditPt(p)} style={iconBtn('#F59E0B')}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </Card>
      )}
      {showAddPt && (
        <AddPatientModal
          onClose={() => setShowAddPt(false)}
          onSaved={() => { setShowAddPt(false); reloadPatients(); }}
        />
      )}
      {editPt && (
        <AddPatientModal
          patient={editPt}
          onClose={() => setEditPt(null)}
          onSaved={() => { setEditPt(null); reloadPatients(); }}
        />
      )}
      {agendarPt && (
        <AddAppointmentModal
          initialPatient={agendarPt}
          onClose={() => setAgendarPt(null)}
          onSaved={() => setAgendarPt(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   PRONTUÁRIO SCREEN
───────────────────────────────────────── */
function calcAgeDetailed(birthDate: string): string {
  const b = new Date(birthDate + 'T12:00:00');
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  let days = now.getDate() - b.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const parts = [];
  if (years > 0)  parts.push(`${years} ano${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} ${months !== 1 ? 'meses' : 'mês'}`);
  if (days > 0)   parts.push(`${days} dia${days !== 1 ? 's' : ''}`);
  return parts.join(', ') || '< 1 dia';
}

function Prontuario({ initialPatientId }: { initialPatientId?: string }) {
  const doctor = React.useContext(DoctorContext);
  const [activeSection, setActiveSection] = useState('historico');
  const [patients, setPatients]           = useState<Patient[]>([]);
  const [selected, setSelected]           = useState<Patient | null>(null);
  const [loading, setLoading]             = useState(true);
  const [showConsulta,    setShowConsulta]    = useState(false);
  const [editRecord,      setEditRecord]      = useState<MedicalRecord | null>(null);
  const [records,         setRecords]         = useState<MedicalRecord[]>([]);
  const [prescriptions,   setPrescriptions]   = useState<Prescription[]>([]);
  const [showTagInput,    setShowTagInput]    = useState(false);
  const [tagLabel,        setTagLabel]        = useState('');
  const [tags,            setTags]            = useState<{id:string;label:string;color:string}[]>([]);
  const [prescDate,       setPrescDate]       = useState(todayISO());
  const [showPrescDate,   setShowPrescDate]   = useState(true);
  const [prescModels,     setPrescModels]     = useState<PrescriptionModel[]>([]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showAddModel,    setShowAddModel]    = useState(false);
  const [showManageModels,setShowManageModels]= useState(false);
  const [newModelName,    setNewModelName]    = useState('');
  const [showCreatePresc, setShowCreatePresc] = useState(false);
  const [timerSecs,       setTimerSecs]       = useState(0);
  const [timerActive,     setTimerActive]     = useState(false);
  const [showDiags,       setShowDiags]       = useState(true);
  const [filterType,      setFilterType]      = useState('todos');
  const [listView,        setListView]        = useState(!initialPatientId);
  const [search,          setSearch]          = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openRowMenu,     setOpenRowMenu]     = useState<string | null>(null);
  const [hoveredRow,      setHoveredRow]      = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastConsults,    setLastConsults]    = useState<Record<string,string>>({});
  const [checkedIds,      setCheckedIds]      = useState<string[]>([]);
  const [genderFilter,    setGenderFilter]    = useState('');
  const [showFilterMenu,  setShowFilterMenu]  = useState(false);
  const [showAddPtInList, setShowAddPtInList] = useState(false);
  const [showApptModal,   setShowApptModal]   = useState(false);
  const [apptPatient,     setApptPatient]     = useState<Patient | null>(null);
  const [listTab,         setListTab]         = useState<'prontuario'|'atendimento'|'relacionamento'|'arquivos'>('prontuario');
  const [anamEditIdx,     setAnamEditIdx]     = useState<number | null>(null);
  const [anamEditVal,     setAnamEditVal]     = useState('');
  const [anamSaving,      setAnamSaving]      = useState(false);
  const [showAiModal,     setShowAiModal]     = useState(false);
  const [aiRelato,        setAiRelato]        = useState('');
  const [aiResult,        setAiResult]        = useState('');
  const [aiLoading,       setAiLoading]       = useState(false);
  const [aiSpecialty,     setAiSpecialty]     = useState('Generalista');
  const [isRecording,     setIsRecording]     = useState(false);
  const [aiInterim,       setAiInterim]       = useState('');
  const recognitionRef = React.useRef<any>(null);

  // ── Debounce da busca de prontuários ──
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  // ── Atendimento inline SOAP form ──
  const [atendQueixa,    setAtendQueixa]    = useState('');
  const [atendEvolucao,  setAtendEvolucao]  = useState('');
  const [atendDiag,      setAtendDiag]      = useState('');
  const [atendCid,       setAtendCid]       = useState('');
  const [atendConduta,   setAtendConduta]   = useState('');
  const [atendRetorno,   setAtendRetorno]   = useState('');
  const [atendSaving,    setAtendSaving]    = useState(false);
  const [atendSaved,     setAtendSaved]     = useState(false);

  // ── Exames section ──
  const [examLines,      setExamLines]      = useState<string[]>(['']);
  const [examUrgency,    setExamUrgency]    = useState('Rotina');
  const [examSaving,     setExamSaving]     = useState(false);
  const [examSaved,      setExamSaved]      = useState(false);

  // ── Documentos section ──
  const [docType,        setDocType]        = useState<'atestado'|'comparecimento'|'encaminhamento'>('atestado');
  const [atestDias,      setAtestDias]      = useState('1');
  const [atestMotivo,    setAtestMotivo]    = useState('');
  const [encamEspec,     setEncamEspec]     = useState('');
  const [encamMotivo,    setEncamMotivo]    = useState('');

  // ── Model picker with items ──
  const [pendingModelItems, setPendingModelItems] = useState<{med:string;dose:string;freq:string;dur:string}[]|null>(null);

  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Seu navegador não suporta gravação de voz. Use Chrome ou Edge.'); return; }
    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + ' ';
        else interim += t;
      }
      if (final) setAiRelato((prev: string) => prev + final);
      setAiInterim(interim);
    };
    rec.onerror = () => { setIsRecording(false); setAiInterim(''); };
    rec.onend = () => { setIsRecording(false); setAiInterim(''); };
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setAiInterim('');
  };

  useEffect(() => {
    if (!timerActive) return;
    const iv = setInterval(() => setTimerSecs(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [timerActive]);

  const timerStr = [
    String(Math.floor(timerSecs / 3600)).padStart(2, '0'),
    String(Math.floor((timerSecs % 3600) / 60)).padStart(2, '0'),
    String(timerSecs % 60).padStart(2, '0'),
  ].join(':');

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

  const extendedSections = [
    { id: 'historico',   label: 'Histórico de Consulta' },
    { id: 'acomp',       label: 'Tabela de acompanhamentos' },
    { id: 'atendimento', label: 'Atendimento' },
    { id: 'exames',      label: 'Exames e procedimentos' },
    { id: 'presc',       label: 'Prescrições' },
    { id: 'documentos',  label: 'Documentos e atestados' },
    { id: 'imagens',     label: 'Imagens e anexos' },
  ];

  // Patient code (pseudo-code from id)
  const patientCode = (id: string) =>
    String(parseInt(id.replace(/-/g, '').slice(0, 8), 16) % 900000 + 100000);

  useEffect(() => {
    supabase.from('patients').select('*').eq('active', true).order('name').limit(1000)
      .then(({ data }) => {
        const list = (data as Patient[]) ?? [];
        setPatients(list);
        if (initialPatientId) {
          const initial = list.find(p => p.id === initialPatientId);
          if (initial) { setSelected(initial); setListView(false); }
        }
        setLoading(false);
      });
    // Load last consultation per patient
    supabase.from('medical_records').select('patient_id, created_at').order('created_at', { ascending: false }).limit(5000)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        for (const r of (data ?? []) as any[]) {
          if (!map[r.patient_id]) map[r.patient_id] = r.created_at;
        }
        setLastConsults(map);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    supabase.from('medical_records').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => setRecords((data as MedicalRecord[]) ?? []));
    supabase.from('prescriptions').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => setPrescriptions((data as Prescription[]) ?? []));
    loadTags(selected.id);
  }, [selected]);

  // Carrega modelos de prescrição do médico
  useEffect(() => {
    supabase.from('prescription_models').select('*').order('created_at')
      .then(({ data }) => {
        if (data) setPrescModels(data.map((m: any) => ({
          id: m.id, name: m.name,
          items: Array.isArray(m.items) ? m.items : [],
        })));
      });
  }, []);

  if (loading) return <Spinner />;

  const anamnesisTitles = ['Antec. clínicos', 'Antec. cirúrgicos', 'Antec. familiares', 'Hábitos', 'Alergias', 'Medicamentos em uso'];
  const anamKeys       = ['clinical_history', 'surgical_history', 'family_history', 'habits', 'allergies', 'medications'];
  // rec0 for anamnesis: prefer a dedicated anamnesis record to avoid overwriting consultations
  const rec0 = records.find(r => (r as any).type === 'anamnesis') ?? records.find(r =>
    r.clinical_history || r.surgical_history || r.family_history || r.habits || r.allergies || (r as any).medications
  ) ?? null;
  const anamVals = [
    rec0?.clinical_history, rec0?.surgical_history, rec0?.family_history,
    rec0?.habits, rec0?.allergies, (rec0 as any)?.medications,
  ];
  const actionBtn: CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' };

  const filteredRecords = records.filter(r => {
    if (filterType === 'todos')      return true;
    if (filterType === 'historico')  return !!r.complaint || !!r.evolution || !!r.conduct || !!r.diagnosis;
    if (filterType === 'retornos')   return !!r.return_date;
    return true;
  });

  // ── Máscara de telefone BR ──
  function fmtPhone(raw: string | null | undefined): string {
    if (!raw) return '—';
    const d = raw.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return raw;
  }

  const searchedPatients = patients.filter(p => {
    // Text search — usa debouncedSearch
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      const matchText = p.name.toLowerCase().includes(q) ||
        (p.phone ?? '').includes(q) ||
        ((p as any).cpf ?? '').includes(q) ||
        patientCode(p.id).includes(q);
      if (!matchText) return false;
    }
    // Gender / status filter
    if (genderFilter === 'masculino') return p.gender === 'M' || p.gender === 'masculino';
    if (genderFilter === 'feminino')  return p.gender === 'F' || p.gender === 'feminino';
    if (genderFilter === 'obito')     return (p as any).status === 'obito';
    if (genderFilter === 'ativo')     return (p as any).active !== false;
    if (genderFilter === 'inativo')   return (p as any).active === false;
    return true;
  });

  // ══════════════════════════════════════════
  //  PATIENT LIST VIEW
  // ══════════════════════════════════════════
  if (listView) {
    const allChecked = searchedPatients.length > 0 && checkedIds.length === searchedPatients.length;
    const thStyle: CSSProperties = { padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'left', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap', userSelect: 'none' };
    const tdStyle: CSSProperties = { padding: '11px 12px', fontSize: 13, color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle' };

    /* ── Helpers ── */
    const insuranceMeta: Record<string, { bg: string; color: string }> = {
      'Particular':     { bg: '#F0FDF4', color: '#15803D' },
      'Unimed':         { bg: '#EFF6FF', color: '#1D4ED8' },
      'Bradesco Saúde': { bg: '#FEF3C7', color: '#92400E' },
      'Amil':           { bg: '#FDF4FF', color: '#7E22CE' },
      'SulAmérica':     { bg: '#FFF7ED', color: '#C2410C' },
    };
    const getInsMeta = (ins: string) => insuranceMeta[ins] ?? { bg: '#F3F4F6', color: '#374151' };
    const avPal      = ['#DBEAFE','#D1FAE5','#FEF3C7','#F3E8FF','#FEE2E2','#CCFBF1'];
    const avTxt      = ['#1D4ED8','#065F46','#92400E','#6D28D9','#991B1B','#0F766E'];
    const avColor    = (n: string) => { const i = n.charCodeAt(0) % avPal.length; return { bg: avPal[i], color: avTxt[i] }; };

    /* Age from birth_date */
    const calcAge = (bd: string) => {
      const d = new Date(bd + 'T12:00:00'), now = new Date();
      let a = now.getFullYear() - d.getFullYear();
      if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
      return a;
    };

    /* Relative last-visit date with color */
    const relVisit = (dateStr: string | undefined): { label: string; dotColor: string; textColor: string } => {
      if (!dateStr) return { label: 'Nunca', dotColor: '#D1D5DB', textColor: '#9CA3AF' };
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
      if (diff === 0) return { label: 'Hoje',                       dotColor: '#22C55E', textColor: '#15803D' };
      if (diff <= 7)  return { label: `${diff}d`,                   dotColor: '#22C55E', textColor: '#15803D' };
      if (diff <= 30) return { label: diff < 14 ? '1sem' : diff < 21 ? '2sem' : '3sem', dotColor: '#F59E0B', textColor: '#92400E' };
      return { label: `${Math.floor(diff / 30)}m`,                  dotColor: '#EF4444', textColor: '#DC2626' };
    };

    /* Highlight matched text */
    const hl = (text: string, q: string): React.ReactNode => {
      if (!q.trim()) return text;
      const norm = (s: string) => s.toLowerCase().replace(/[\s.\-()]/g, '');
      const idx = norm(text).indexOf(norm(q));
      if (idx < 0) return text;
      // find actual char positions (approximate — works for names)
      const lo = text.toLowerCase().indexOf(q.toLowerCase());
      if (lo < 0) return text;
      return <>{text.slice(0, lo)}<mark style={{ background: '#FEF9C3', color: '#854D0E', borderRadius: 2, padding: '0 1px', fontWeight: 700 }}>{text.slice(lo, lo + q.length)}</mark>{text.slice(lo + q.length)}</>;
    };

    /* Active filter chips */
    const filterChips: { label: string; onRemove: () => void }[] = [];
    if (genderFilter === 'masculino') filterChips.push({ label: 'Masculino',  onRemove: () => setGenderFilter('') });
    if (genderFilter === 'feminino')  filterChips.push({ label: 'Feminino',   onRemove: () => setGenderFilter('') });
    if (genderFilter === 'obito')     filterChips.push({ label: 'Óbitos',     onRemove: () => setGenderFilter('') });
    if (genderFilter === 'ativo')     filterChips.push({ label: 'Ativos',     onRemove: () => setGenderFilter('') });
    if (genderFilter === 'inativo')   filterChips.push({ label: 'Inativos',   onRemove: () => setGenderFilter('') });
    if (debouncedSearch)              filterChips.push({ label: `"${debouncedSearch}"`, onRemove: () => setSearch('') });

    /* Autocomplete suggestions */
    const suggestions = debouncedSearch.length >= 2
      ? patients.filter(p => p.name.toLowerCase().includes(debouncedSearch.toLowerCase())).slice(0, 5)
      : [];

    /* Quick-action btn style */
    const qaBtn = (color: string): CSSProperties => ({
      height: 24, padding: '0 8px', border: `1px solid ${color}20`, borderRadius: 4,
      background: `${color}10`, color, fontSize: 11, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    });

    return (
      <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F5F6F8' }}>

        {/* ── Header ── */}
        <div style={{ padding: '16px 20px 0', background: '#F5F6F8' }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Prontuários</div>
          </div>

          {/* Search + autocomplete */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 12, fontSize: 14, color: '#9CA3AF', pointerEvents: 'none' }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Buscar por nome, código, telefone ou CPF..."
                style={{ width: '100%', height: 38, border: '1px solid #E5E7EB', borderRadius: 7, padding: '0 42px 0 36px', fontSize: 13, color: '#374151', fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9CA3AF', lineHeight: 1 }}>×</button>
              )}
            </div>
            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: 42, left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 7, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 150, overflow: 'hidden' }}>
                {suggestions.map(s => (
                  <div key={s.id}
                    onMouseDown={() => { setSelected(s); setListView(false); setActiveSection('historico'); }}
                    style={{ padding: '9px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F3F4F6' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                  >
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: avColor(s.name).bg, color: avColor(s.name).color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{initials(s.name)}</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{hl(s.name, debouncedSearch)}</span>
                    {s.phone && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF' }}>{fmtPhone(s.phone)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter chips strip */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap', minHeight: 28, paddingBottom: 6 }}>
            {/* Always-visible filter pills */}
            {[
              { key: '',          label: 'Todos' },
              { key: 'ativo',     label: 'Ativos' },
              { key: 'masculino', label: 'Masc.' },
              { key: 'feminino',  label: 'Fem.' },
              { key: 'inativo',   label: 'Inativos' },
              { key: 'obito',     label: 'Óbito' },
            ].map(f => {
              const active = genderFilter === f.key;
              return (
                <button key={f.key} onClick={() => setGenderFilter(f.key)} style={{
                  height: 24, padding: '0 10px', borderRadius: 99, fontSize: 11, fontWeight: active ? 700 : 500,
                  border: active ? '1.5px solid #0066D0' : '1px solid #E5E7EB',
                  background: active ? '#EFF6FF' : '#fff',
                  color: active ? '#0066D0' : '#6B7280',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
                }}>{f.label}</button>
              );
            })}
            {/* Active search chip */}
            {debouncedSearch && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px', borderRadius: 99, background: '#FEF9C3', color: '#854D0E', fontSize: 11, fontWeight: 600, border: '1px solid #FDE68A' }}>
                "{debouncedSearch}"
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
              </span>
            )}
            {/* Clear all (when any filter active) */}
            {(genderFilter || debouncedSearch) && (
              <button onClick={() => { setGenderFilter(''); setSearch(''); }} style={{ height: 24, padding: '0 8px', border: 'none', background: 'none', fontSize: 11, color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                Limpar tudo
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ padding: '0 20px', background: '#F5F6F8' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', gap: 0 }}>
            {([
              { id: 'prontuario',    label: 'Prontuários' },
              { id: 'atendimento',   label: 'Atendimento' },
              { id: 'relacionamento',label: 'Relacionamento' },
              { id: 'arquivos',      label: 'Arquivos' },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setListTab(tab.id)} style={{
                padding: '10px 18px', fontSize: 13, fontWeight: listTab === tab.id ? 700 : 500,
                color: listTab === tab.id ? '#0066D0' : '#6B7280',
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                borderBottom: `2px solid ${listTab === tab.id ? '#0066D0' : 'transparent'}`,
                marginBottom: -2, transition: 'color .12s',
              }}>{tab.label}</button>
            ))}
          </div>
        </div>

        {/* ── Table area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', position: 'relative' }}>

          {/* Non-prontuario tabs placeholder */}
          {listTab !== 'prontuario' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
              <div style={{ fontSize: 36 }}>{listTab === 'atendimento' ? '🩺' : listTab === 'relacionamento' ? '🤝' : '📁'}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>
                {listTab === 'atendimento' ? 'Atendimentos rápidos' : listTab === 'relacionamento' ? 'Relacionamento com pacientes' : 'Arquivos e documentos'}
              </div>
              <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', maxWidth: 300 }}>
                {listTab === 'atendimento' ? 'Registre atendimentos sem abrir o prontuário completo.' : listTab === 'relacionamento' ? 'Acompanhe o histórico de comunicação e preferências.' : 'Gerencie documentos, laudos e imagens dos pacientes.'}
              </div>
            </div>
          )}

          {listTab === 'prontuario' && (<>
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 32 }}>
                      <input type="checkbox" checked={allChecked}
                        onChange={e => setCheckedIds(e.target.checked ? searchedPatients.map(p => p.id) : [])}
                        style={{ cursor: 'pointer' }} />
                    </th>
                    <th style={thStyle}>PACIENTE</th>
                    <th style={{ ...thStyle, color: '#9CA3AF' }}>TELEFONE</th>
                    <th style={{ ...thStyle, color: '#9CA3AF' }}>CÓDIGO</th>
                    <th style={thStyle}>ÚLTIMA CONSULTA</th>
                    <th style={thStyle}>CONVÊNIO</th>
                    <th style={{ ...thStyle, width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {searchedPatients.length === 0 ? (
                    /* ── Empty state ── */
                    <tr>
                      <td colSpan={7} style={{ padding: '60px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                          {debouncedSearch ? `Nenhum resultado para "${debouncedSearch}"` : 'Nenhum paciente encontrado'}
                        </div>
                        <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                          {debouncedSearch ? 'Tente outro nome, CPF ou telefone' : 'Cadastre o primeiro paciente para começar'}
                        </div>
                        {debouncedSearch && (
                          <button onClick={() => setSearch('')} style={{ marginTop: 12, height: 32, padding: '0 16px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>
                            Limpar busca
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : searchedPatients.map(p => {
                    const lastC  = lastConsults[p.id];
                    const av     = avColor(p.name);
                    const ins    = p.insurance ?? 'Particular';
                    const insMeta = getInsMeta(ins);
                    const visit  = relVisit(lastC);
                    const isMenuOpen = openRowMenu === p.id;
                    const isHovered  = hoveredRow === p.id;
                    const isChecked  = checkedIds.includes(p.id);

                    return (
                      <tr key={p.id}
                        style={{ background: isChecked ? '#EFF6FF' : isHovered ? '#F8FAFC' : '#fff', cursor: 'pointer', transition: 'background .1s' }}
                        onClick={() => { setSelected(p); setListView(false); setActiveSection('historico'); }}
                        onMouseEnter={() => setHoveredRow(p.id)}
                        onMouseLeave={() => { setHoveredRow(null); }}
                      >
                        {/* Checkbox — stop row click */}
                        <td style={{ ...tdStyle, width: 32 }} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isChecked}
                            onChange={e => setCheckedIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))}
                            style={{ cursor: 'pointer' }} />
                        </td>

                        {/* Avatar + Nome + idade (linha secundária) */}
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, userSelect: 'none' }}>
                              {initials(p.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#111827', fontSize: 13, lineHeight: 1.3 }}>
                                {hl(p.name, debouncedSearch)}
                              </div>
                              {p.birth_date && (
                                <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.2, marginTop: 1 }}>
                                  {calcAge(p.birth_date)} anos
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Telefone — de-emphasised */}
                        <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                          {fmtPhone(p.phone)}
                        </td>

                        {/* Código — de-emphasised */}
                        <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                          {patientCode(p.id)}
                        </td>

                        {/* Última consulta — tempo relativo + cor */}
                        <td style={{ ...tdStyle }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: visit.dotColor, flexShrink: 0, display: 'inline-block' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: visit.textColor }}>{visit.label}</span>
                            {lastC && <span style={{ fontSize: 11, color: '#D1D5DB' }}>{new Date(lastC).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>}
                          </div>
                        </td>

                        {/* Convênio badge */}
                        <td style={tdStyle}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: insMeta.bg, color: insMeta.color, whiteSpace: 'nowrap' }}>
                            {ins}
                          </span>
                        </td>

                        {/* Quick actions (hover) + kebab */}
                        <td style={{ ...tdStyle, width: 120, minWidth: 120, maxWidth: 120 }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            {/* Hover quick actions — fixed width so they don't shift layout */}
                            <div style={{ display: 'flex', gap: 4, opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none', transition: 'opacity .12s' }}>
                              <button onClick={() => { setSelected(p); setListView(false); setActiveSection('historico'); }} style={qaBtn('#0066D0')} title="Visualizar prontuário">Ver</button>
                              <button onClick={e => { e.stopPropagation(); setApptPatient(p); setShowApptModal(true); }} style={qaBtn('#059669')} title="Marcar consulta">Agendar</button>
                            </div>
                            {/* Kebab menu — portal para não ser cortado por overflow */}
                            <div style={{ position: 'relative' }}>
                              <button
                                id={`kebab-${p.id}`}
                                onClick={e => { e.stopPropagation(); setOpenRowMenu(isMenuOpen ? null : p.id); }}
                                style={{ width: 26, height: 26, border: '1px solid transparent', borderRadius: 5, background: isMenuOpen ? '#F3F4F6' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#9CA3AF', fontFamily: 'inherit' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F3F4F6'; }}
                                onMouseLeave={e => { if (!isMenuOpen) (e.currentTarget as HTMLElement).style.background = 'none'; }}
                              >⋮</button>
                              {isMenuOpen && ReactDOM.createPortal(
                                <>
                                  <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpenRowMenu(null)} />
                                  <div style={{
                                    position: 'fixed',
                                    zIndex: 9999,
                                    ...(() => {
                                      const btn = document.getElementById(`kebab-${p.id}`);
                                      if (!btn) return { top: 0, right: 0 };
                                      const r = btn.getBoundingClientRect();
                                      const dropH = 176;
                                      const goUp = r.bottom + dropH > window.innerHeight;
                                      return {
                                        top: goUp ? r.top - dropH : r.bottom + 4,
                                        left: Math.max(8, r.right - 170),
                                      };
                                    })(),
                                    background: '#fff', border: '1px solid #E5E7EB', borderRadius: 7,
                                    boxShadow: '0 8px 24px rgba(0,0,0,.12)', minWidth: 170, overflow: 'hidden',
                                  }}>
                                    {[
                                      { label: '👁  Visualizar',       action: () => { setSelected(p); setListView(false); setActiveSection('historico'); setOpenRowMenu(null); } },
                                      { label: '✏️  Editar dados',      action: () => { setSelected(p); setListView(false); setActiveSection('historico'); setOpenRowMenu(null); } },
                                      { label: '📅  Marcar consulta',  action: () => { setApptPatient(p); setShowApptModal(true); setOpenRowMenu(null); } },
                                      { label: '📋  Copiar código',     action: () => { copyToClipboard(patientCode(p.id)); setOpenRowMenu(null); } },
                                    ].map((item, idx) => (
                                      <div key={idx} onClick={item.action}
                                        style={{ padding: '9px 14px', fontSize: 13, color: '#374151', cursor: 'pointer', background: '#fff' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                                      >{item.label}</div>
                                    ))}
                                  </div>
                                </>,
                                document.body,
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer count */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 12, color: '#9CA3AF', background: '#FAFAFA' }}>
              {searchedPatients.length} paciente{searchedPatients.length !== 1 ? 's' : ''}
              {filterChips.length > 0 && <span style={{ marginLeft: 5, color: '#D1D5DB' }}>· com filtros ativos</span>}
            </div>
          </div>

          {/* ── Bulk action sticky bar ── */}
          {checkedIds.length > 0 && (
            <div style={{
              position: 'sticky', bottom: 20, margin: '12px 0 0',
              background: '#1E293B', borderRadius: 10, padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,.25)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                {checkedIds.length} selecionado{checkedIds.length > 1 ? 's' : ''}
              </span>
              <div style={{ flex: 1, height: 1, background: '#334155' }} />
              {[
                { label: '✉ Mensagem', color: '#60A5FA', stub: true },
                { label: '⬇ Exportar',  color: '#34D399', stub: true },
                { label: '🏷 Marcar',    color: '#A78BFA', stub: false },
              ].map(a => (
                <button key={a.label} disabled={a.stub} style={{ height: 30, padding: '0 12px', borderRadius: 6, border: `1px solid ${a.color}40`, background: `${a.color}15`, color: a.color, fontSize: 12, fontWeight: 600, cursor: a.stub ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: a.stub ? 0.4 : 1 }}>
                  {a.label}
                </button>
              ))}
              <button onClick={() => setCheckedIds([])} style={{ height: 30, padding: '0 10px', borderRadius: 6, border: '1px solid #475569', background: 'none', color: '#94A3B8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
            </div>
          )}
          </>)} {/* end listTab === 'prontuario' */}
        </div>
      </div>
      {showApptModal && (
        <AddAppointmentModal
          initialPatient={apptPatient ?? undefined}
          onClose={() => { setShowApptModal(false); setApptPatient(null); }}
        />
      )}
      </>
    );
  }

  // ── Novo layout EHR ao abrir um paciente ──
  if (!listView && selected) {
    return (
      <>
        <EHRAtendimento
          patient={selected}
          onClose={() => { setListView(true); setTimerActive(false); setTimerSecs(0); }}
        />
        {showAddPtInList && (
          <AddPatientModal
            onClose={() => setShowAddPtInList(false)}
            onSaved={() => {
              setShowAddPtInList(false);
              supabase.from('patients').select('*').eq('active', true).order('name')
                .then(({ data }) => setPatients((data as Patient[]) ?? []));
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ══ LEFT SIDEBAR ══ */}
      <div style={{ width: 210, borderRight: '1px solid #E5E7EB', background: '#fff', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Title + back + timer button */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Back link */}
          <button onClick={() => { setListView(true); setTimerActive(false); setTimerSecs(0); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#6B7280', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: 2 }}>
            ← Prontuários
          </button>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {selected?.name}
          </div>

          {/* Timer / Iniciar / Finalizar button */}
          {!timerActive ? (
            <button
              onClick={() => { if (selected) { setTimerActive(true); setTimerSecs(0); setActiveSection('atendimento'); setAtendSaved(false); setAtendQueixa(''); setAtendEvolucao(''); setAtendDiag(''); setAtendCid(''); setAtendConduta(''); setAtendRetorno(''); } }}
              style={{ width: '100%', height: 36, background: '#0066D0', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Icon name="clock" size={13} color="#fff" /> Iniciar atendimento
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Finalizar atendimento */}
              <button
                onClick={() => { setTimerActive(false); setTimerSecs(0); setShowConsulta(true); }}
                style={{ width: '100%', height: 36, background: '#DC2626', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block', flexShrink: 0 }} />
                Finalizar atendimento
              </button>
              {/* Duration row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13 }}>👁</span> Duração
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: 1 }}>{timerStr}</span>
              </div>
            </div>
          )}
        </div>

        {/* Nav sections */}
        <div style={{ flex: 1, paddingTop: 6 }}>
          {(timerActive ? extendedSections : sections).map(s => (
            <div key={s.id} onClick={() => setActiveSection(s.id)} style={{
              padding: '10px 12px', cursor: 'pointer', fontSize: 13,
              color: activeSection === s.id ? '#0066D0' : '#374151',
              fontWeight: activeSection === s.id ? 600 : 400,
              background: activeSection === s.id ? '#EFF6FF' : 'transparent',
              borderLeft: `3px solid ${activeSection === s.id ? '#0066D0' : 'transparent'}`,
            }}>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>


        <div style={{ flex: 1, overflowY: 'auto', background: '#F5F6F8' }}>
          {selected ? (
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* ── Tags ── */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {tags.map(t => (
                  <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', background: t.color ?? '#0066D0', color: '#fff', borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>
                    {t.label}
                    <span onClick={() => { if (window.confirm(`Remover tag "${t.label}"?`)) supabase.from('patient_tags').delete().eq('id', t.id).then(() => loadTags(selected.id)); }} style={{ cursor: 'pointer', opacity: 0.8 }}>×</span>
                  </span>
                ))}
                {showTagInput ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <input value={tagLabel} onChange={e => setTagLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') { setShowTagInput(false); setTagLabel(''); } }}
                      placeholder="Nome da tag" autoFocus
                      style={{ height: 26, border: '1px solid #0066D0', borderRadius: 4, padding: '0 7px', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 120 }} />
                    <button onClick={handleAddTag} style={{ height: 26, padding: '0 8px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
                    <button onClick={() => { setShowTagInput(false); setTagLabel(''); }} style={{ height: 26, padding: '0 6px', background: 'none', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12, cursor: 'pointer', color: '#9CA3AF', fontFamily: 'inherit' }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setShowTagInput(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid #0066D0', borderRadius: 9999, fontSize: 12, color: '#0066D0', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Icon name="tag" size={11} color="#0066D0" /> Adicionar Tag +
                  </button>
                )}
              </div>

              {/* ── Patient card ── */}
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#0066D0', flexShrink: 0 }}>
                    {initials(selected.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 1.9 }}>
                      {selected.birth_date && <div>Idade: {calcAgeDetailed(selected.birth_date)}</div>}
                      <div>Convênio: {selected.insurance ?? 'Particular'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="calendar" size={11} color="#9CA3AF" />
                        Primeira consulta: {records.length > 0
                          ? new Date(records[records.length - 1].created_at).toLocaleDateString('pt-BR')
                          : 'Sem registro'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => { try { navigator.share?.({ title: 'Prontuário', text: selected.name, url: window.location.href }); } catch {} }} style={{ width: 30, height: 30, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📤</button>
                    <button style={{ width: 30, height: 30, border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⊞</button>
                  </div>
                </div>
              </div>

              {/* ── Anamnesis cards ── */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {anamnesisTitles.map((a, i) => (
                  <div
                    key={i}
                    onClick={() => { setAnamEditIdx(i); setAnamEditVal(anamVals[i] ?? ''); }}
                    style={{
                      flex: '0 0 150px', background: '#fff',
                      border: `1px solid ${anamVals[i] ? '#D1D5DB' : '#E5E7EB'}`,
                      borderRadius: 7, padding: '10px 12px', minHeight: 68,
                      cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#0066D0';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(0,102,208,.1)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = anamVals[i] ? '#D1D5DB' : '#E5E7EB';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{a}</div>
                      <span style={{ fontSize: 11, color: '#9CA3AF', opacity: 0.6 }}>✏️</span>
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: anamVals[i] ? '#374151' : '#9CA3AF',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical' as any,
                    }}>
                      {anamVals[i] ?? 'Inserir informação'}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Últimos diagnósticos ── */}
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 7, overflow: 'hidden' }}>
                <div
                  onClick={() => setShowDiags(p => !p)}
                  style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>Últimos diagnósticos</span>
                  <span style={{ color: '#9CA3AF', fontSize: 11 }}>{showDiags ? '▲' : '▼'}</span>
                </div>
                {showDiags && (
                  <div style={{ padding: '8px 14px 12px', borderTop: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {records.filter(r => r.diagnosis).slice(0, 8).map(r => (
                      <Badge key={r.id} variant="blue">
                        {r.diagnosis_code ? `${r.diagnosis_code} · ` : ''}{r.diagnosis}
                      </Badge>
                    ))}
                    {records.filter(r => r.diagnosis).length === 0 && (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>Nenhum diagnóstico registrado</span>
                    )}
                  </div>
                )}
              </div>

              {/* ── Filter bar ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>Filtrar</span>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ height: 30, border: '1px solid #E5E7EB', borderRadius: 6, padding: '0 8px', fontSize: 12, color: '#374151', fontFamily: 'inherit', background: '#fff' }}>
                    <option value="todos">Todos</option>
                    <option value="historico">Atendimentos</option>
                    <option value="retornos">Retornos</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => window.print()} style={actionBtn}><Icon name="download" size={12} /> Baixar PDF</button>
                  <button onClick={() => window.print()} style={actionBtn}><Icon name="printer" size={12} /> Imprimir</button>
                  <button onClick={() => { try { navigator.share?.({ title: 'Prontuário', text: selected.name, url: window.location.href }); } catch {} navigator.clipboard?.writeText(window.location.href); }} style={actionBtn}><Icon name="share" size={12} /> Compartilhar</button>
                </div>
              </div>

              {/* ══ CONTENT BY SECTION ══ */}

              {activeSection === 'historico' && (
                filteredRecords.length === 0
                  ? <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: 13 }}>Nenhuma consulta registrada</div>
                  : filteredRecords.map(r => {
                      const d = new Date(r.created_at);
                      const recRx = prescriptions.filter(rx => rx.medical_record_id === r.id);
                      return (
                        <div key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

                          {/* Date badge */}
                          <div style={{ width: 48, flexShrink: 0, background: '#1E40AF', borderRadius: 8, padding: '8px 4px', textAlign: 'center', color: '#fff' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>
                              {d.toLocaleDateString('pt-BR', { day: '2-digit' })}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                              {d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')}
                            </div>
                            <div style={{ fontSize: 9, marginTop: 1, opacity: 0.85 }}>{d.getFullYear()}</div>
                          </div>

                          {/* Record card */}
                          <div style={{ flex: 1, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                            {/* Header */}
                            <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, color: '#374151' }}>Por: <strong>{doctor.name}</strong></span>
                                <span style={{ fontSize: 13, color: '#9CA3AF' }}>🔒</span>
                              </div>
                              <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                                ⏱ {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                {r.return_date ? ` (${Math.round((new Date(r.return_date + 'T12:00:00').getTime() - d.getTime()) / 60000)} min)` : ''}
                              </span>
                            </div>

                            {/* "Atendimento" section header */}
                            <div style={{ padding: '6px 14px', background: '#F3F4F6', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Atendimento</span>
                            </div>

                            {/* Fields */}
                            <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 13 }}>
                              {r.complaint && (
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Queixa principal:</div>
                                  <div style={{ fontSize: 13, color: '#374151' }}>{r.complaint}</div>
                                </div>
                              )}
                              {r.evolution && (
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Exame físico:</div>
                                  <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>{r.evolution}</div>
                                </div>
                              )}
                              {r.clinical_history && (
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Histórico e antecedentes:</div>
                                  <div style={{ fontSize: 13, color: '#374151' }}>{r.clinical_history}</div>
                                </div>
                              )}
                              {r.diagnosis && (
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Hipótese diagnóstica:</div>
                                  <div style={{ fontSize: 13, color: '#374151' }}>
                                    {r.diagnosis_code ? `${r.diagnosis_code} - ` : ''}{r.diagnosis}
                                  </div>
                                </div>
                              )}
                              {r.conduct && (
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Condutas:</div>
                                  <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>{r.conduct}</div>
                                </div>
                              )}
                              {recRx.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Prescrevo:</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {recRx.map(rx => (
                                      <div key={rx.id} style={{ fontSize: 13, color: '#374151' }}>
                                        {rx.medication}
                                        {rx.dosage    && ` ${rx.dosage}`}
                                        {rx.frequency && ` ${rx.frequency}`}
                                        {rx.duration  && ` por ${rx.duration}`}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {!r.complaint && !r.evolution && !r.conduct && !r.diagnosis && recRx.length === 0 && (
                                <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>Consulta sem detalhes registrados</div>
                              )}
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '8px 14px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <button onClick={() => setEditRecord(r)} style={{ fontSize: 12, color: '#0066D0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Inserir informações
                              </button>
                              <span style={{ fontSize: 13, color: '#D1D5DB' }}>🔒</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
              )}

            {activeSection === 'presc' && (() => {
              // Group prescriptions by date (day)
              const groups: { date: string; items: Prescription[] }[] = [];
              const map: Record<string, Prescription[]> = {};
              for (const rx of prescriptions) {
                const day = rx.created_at.split('T')[0];
                if (!map[day]) map[day] = [];
                map[day].push(rx);
              }
              for (const [date, items] of Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))) {
                groups.push({ date, items });
              }
              const mostRecent = prescriptions[0] ?? null;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* ── MedFlow Rx widget ── */}
                  <Card>
                    {/* Header */}
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* MedFlow Rx logo */}
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#0066D0 0%,#00B4D8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,102,208,.35)' }}>
                        <span style={{ color: '#fff', fontSize: 13, fontWeight: 900, fontStyle: 'italic', letterSpacing: -0.5 }}>Rx</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#0066D0' }}>MedFlow</span>
                          <span style={{ color: '#00B4D8', fontStyle: 'italic' }}>Rx</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Consulta: {selected?.name}</div>
                      </div>
                      {/* Toggle mostrar data */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>mostrar data</span>
                        <div onClick={() => setShowPrescDate(p => !p)} style={{
                          width: 36, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer',
                          background: showPrescDate ? '#0066D0' : '#D1D5DB', transition: 'background .2s',
                        }}>
                          <div style={{
                            position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
                            background: '#fff', transition: 'left .15s',
                            left: showPrescDate ? 18 : 2, boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                          }} />
                        </div>
                        <input type="date" value={prescDate} onChange={e => setPrescDate(e.target.value)} style={{
                          height: 28, border: '1px solid #D1D5DB', borderRadius: 6, padding: '0 8px',
                          fontSize: 12, color: '#374151', fontFamily: 'inherit', outline: 'none',
                        }} />
                      </div>
                      <button title="Configurações" style={{
                        width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 6,
                        background: '#fff', cursor: 'pointer', fontSize: 14, color: '#6B7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>⚙</button>
                    </div>

                    {/* Criar Prescrição */}
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 16, color: '#0066D0' }}>✦</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Criar Prescrição</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setShowModelPicker(true)} style={{
                          height: 32, padding: '0 14px', border: '1px solid #0066D0', borderRadius: 6,
                          background: '#fff', color: '#0066D0', fontSize: 12, fontWeight: 500,
                          cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          📋 Usar Modelo
                        </button>
                        <button onClick={() => { setPendingModelItems(null); setShowCreatePresc(true); }} style={{
                          height: 32, padding: '0 14px', border: 'none', borderRadius: 6,
                          background: '#0066D0', color: '#fff', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          ✦ Criar Item Em Branco
                        </button>
                      </div>
                    </div>

                    {/* Prescrições mais recentes */}
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Prescrições mais recentes</span>
                        <button onClick={() => setActiveSection('historico')} style={{ fontSize: 11, color: '#0066D0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                          📋 Ver Todo Histórico
                        </button>
                      </div>
                      {mostRecent ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#F9FAFB', borderRadius: 7, border: '1px solid #E5E7EB' }}>
                          <div style={{
                            width: 36, height: 36, background: '#EFF6FF', borderRadius: 6,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF', lineHeight: 1 }}>
                              {new Date(mostRecent.created_at).toLocaleDateString('pt-BR', { day: '2-digit' })}
                            </span>
                            <span style={{ fontSize: 9, color: '#1E40AF', fontWeight: 600 }}>
                              {new Date(mostRecent.created_at).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: '#374151', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {mostRecent.medication}
                            {groups[0]?.items.length > 1 ? ` + ${groups[0].items.length - 1} item(s) (...)` : ''}
                          </div>
                          <button onClick={() => setActiveSection('historico')} style={{
                            height: 26, padding: '0 10px', background: '#EFF6FF', border: '1px solid #BFDBFE',
                            borderRadius: 5, color: '#1E40AF', fontSize: 11, fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                          }}>
                            Revisar Prescrição
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '8px 0' }}>Nenhuma prescrição recente</div>
                      )}
                    </div>

                    {/* Biblioteca de modelos */}
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14 }}>📚</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Biblioteca de modelos</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button onClick={() => alert('💡 Dicas:\n\n• Salve prescrições frequentes como modelos\n• Use "Usar Modelo" para agilizar a criação\n• Modelos ficam disponíveis para todos os pacientes')} style={{ fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Dicas De Uso</button>
                          <button onClick={() => setShowManageModels(true)} style={{ fontSize: 11, color: '#0066D0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Gerenciar</button>
                        </div>
                      </div>
                      {prescModels.length === 0 ? (
                        <div style={{ border: '1.5px dashed #E5E7EB', borderRadius: 7, padding: '18px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>Você não adicionou modelos</div>
                          <button onClick={() => setShowAddModel(true)} style={{
                            fontSize: 12, color: '#0066D0', background: 'none', border: 'none',
                            cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            📋 Adicionar Modelo
                          </button>
                        </div>
                      ) : prescModels.map((m, mi) => (
                        <div key={m.id} style={{ padding: '8px 10px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#374151' }}>{m.name}</span>
                          <button onClick={() => { setPendingModelItems(m.items.map((it: any) => ({ med: it.med ?? it.medication ?? '', dose: it.dose ?? it.dosage ?? '', freq: it.freq ?? it.frequency ?? '', dur: it.dur ?? it.duration ?? '' }))); setShowCreatePresc(true); }} style={{ fontSize: 11, color: '#0066D0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Usar</button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* ── Historical prescription cards ── */}
                  {groups.map(group => {
                    const d = new Date(group.date + 'T12:00:00');
                    const day   = d.toLocaleDateString('pt-BR', { day: '2-digit' });
                    const month = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
                    const year  = d.getFullYear();
                    const time  = group.items[0]
                      ? new Date(group.items[0].created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : '';
                    return (
                      <div key={group.date} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        {/* Date badge */}
                        <div style={{
                          width: 48, flexShrink: 0, background: '#1E40AF', borderRadius: 8,
                          padding: '8px 4px', textAlign: 'center', color: '#fff',
                        }}>
                          <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{day}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>{month}</div>
                          <div style={{ fontSize: 9, marginTop: 1, opacity: 0.85 }}>{year}</div>
                        </div>
                        {/* Card */}
                        <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
                          {/* By line */}
                          <div style={{ padding: '7px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#374151' }}>Por: <strong>{doctor.name}</strong></span>
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>⏱ {time}</span>
                          </div>
                          {/* Section title */}
                          <div style={{ padding: '8px 14px', borderBottom: '1px solid #F3F4F6', fontSize: 13, fontWeight: 600, color: '#111827', background: '#F9FAFB' }}>
                            Prescrição
                          </div>
                          {/* Tab + imprimir */}
                          <div style={{ padding: '8px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontSize: 12, fontWeight: 500, color: '#1E40AF', background: '#EFF6FF',
                              border: '1px solid #BFDBFE', borderRadius: 5, padding: '2px 10px',
                            }}>Prescrição #1</span>
                            <button style={{
                              height: 24, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 5,
                              background: '#fff', fontSize: 11, color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                              onClick={() => window.print()}
                            >🖨 Imprimir</button>
                          </div>
                          {/* Items list */}
                          <div style={{ padding: '10px 14px' }}>
                            {group.items.map((rx, ri) => (
                              <div key={rx.id} style={{ fontSize: 13, color: '#374151', marginBottom: ri < group.items.length - 1 ? 5 : 0 }}>
                                <span style={{ color: '#6B7280' }}>–</span>{' '}
                                <strong>{rx.medication}</strong>
                                {rx.dosage    && <span style={{ color: '#6B7280' }}> {rx.dosage}</span>}
                                {rx.frequency && <span style={{ color: '#9CA3AF' }}> · {rx.frequency}</span>}
                                {rx.duration  && <span style={{ color: '#9CA3AF' }}> · {rx.duration}</span>}
                              </div>
                            ))}
                          </div>
                          {/* Footer */}
                          <div style={{ padding: '8px 14px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowCreatePresc(true)} style={{
                              fontSize: 12, color: '#0066D0', background: 'none', border: 'none',
                              cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
                            }}>Inserir informações</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>
              );
            })()}

              {activeSection === 'acomp' && (() => {
                const returnRecords = records.filter(r => r.return_date).sort((a, b) => (a.return_date! > b.return_date! ? 1 : -1));
                const upcoming = returnRecords.filter(r => r.return_date! >= new Date().toISOString().slice(0, 10));
                const past = returnRecords.filter(r => r.return_date! < new Date().toISOString().slice(0, 10));
                return (
                  <Card>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>📅 Acompanhamentos e Retornos</div>
                      <button onClick={() => setShowConsulta(true)} style={{ height: 30, padding: '0 12px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                        + Agendar retorno
                      </button>
                    </div>

                    {returnRecords.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Nenhum retorno registrado</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Agende um retorno ao finalizar uma consulta</div>
                      </div>
                    ) : (
                      <div>
                        {upcoming.length > 0 && (
                          <>
                            <div style={{ padding: '8px 16px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Próximos ({upcoming.length})</span>
                            </div>
                            {upcoming.map((r, i) => {
                              const d = new Date(r.return_date! + 'T12:00:00');
                              const daysUntil = Math.round((d.getTime() - Date.now()) / 86400000);
                              return (
                                <div key={r.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EFF6FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1E40AF', lineHeight: 1 }}>{d.getDate().toString().padStart(2, '0')}</div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#1E40AF' }}>{d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}</div>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Retorno agendado</div>
                                    {r.return_notes && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>{r.return_notes}</div>}
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: daysUntil <= 7 ? '#FEF9C3' : '#F0FDF4', color: daysUntil <= 7 ? '#92400E' : '#166534' }}>
                                    {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `em ${daysUntil} dias`}
                                  </span>
                                </div>
                              );
                            })}
                          </>
                        )}
                        {past.length > 0 && (
                          <>
                            <div style={{ padding: '8px 16px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Anteriores ({past.length})</span>
                            </div>
                            {past.slice(0, 5).map(r => {
                              const d = new Date(r.return_date! + 'T12:00:00');
                              const rec = records.find(rec => rec.return_date === r.return_date);
                              const hadConsult = records.some(rec2 => rec2.created_at.slice(0, 10) === r.return_date);
                              return (
                                <div key={r.id} style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.7 }}>
                                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#6B7280', lineHeight: 1 }}>{d.getDate().toString().padStart(2, '0')}</div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF' }}>{d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}</div>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: '#6B7280' }}>Retorno {d.toLocaleDateString('pt-BR')}</div>
                                    {r.return_notes && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.return_notes}</div>}
                                  </div>
                                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: hadConsult ? '#F0FDF4' : '#FFF7ED', color: hadConsult ? '#166534' : '#92400E' }}>
                                    {hadConsult ? '✓ Consulta realizada' : 'Sem registro'}
                                  </span>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })()}

              {activeSection === 'atendimento' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Header card */}
                  <div style={{ background: timerActive ? 'linear-gradient(135deg,#EFF6FF,#F0F9FF)' : '#fff', border: `1px solid ${timerActive ? '#BFDBFE' : '#E5E7EB'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: timerActive ? '#1E40AF' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🩺</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                        {timerActive ? 'Atendimento em andamento' : 'Registro de Consulta'}
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>
                        {timerActive ? `Duração: ${timerStr} · Clique em "Finalizar" na barra lateral para encerrar` : 'Inicie o atendimento para ativar o registro'}
                      </div>
                    </div>
                    {timerActive && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#DCFCE7', color: '#166534' }}>
                        ● Em consulta
                      </span>
                    )}
                  </div>

                  {/* SOAP Form */}
                  <Card>
                    {(() => {
                      const ta: CSSProperties = {
                        width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8,
                        padding: '9px 12px', fontSize: 13, color: '#111827',
                        fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                        lineHeight: 1.6, boxSizing: 'border-box', background: '#fff',
                        transition: 'border-color .15s',
                      };
                      const fieldLbl: CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 };
                      const fieldGrp: CSSProperties = { display: 'flex', flexDirection: 'column' };
                      const sectionBadge = (letter: string, color: string) => (
                        <span style={{ width: 20, height: 20, borderRadius: 5, background: color, color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{letter}</span>
                      );

                      return (
                        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                          {/* S — Subjective */}
                          <div style={fieldGrp}>
                            <label style={fieldLbl}>{sectionBadge('S','#3B82F6')} Queixa principal / Subjetivo</label>
                            <textarea
                              value={atendQueixa} onChange={e => setAtendQueixa(e.target.value)}
                              placeholder="Relato do paciente: queixa principal, história da doença atual, duração dos sintomas..."
                              rows={3} style={ta} disabled={atendSaved}
                              onFocus={e => (e.target.style.borderColor='#0066D0')}
                              onBlur={e => (e.target.style.borderColor='#E5E7EB')}
                            />
                          </div>

                          {/* O — Objective */}
                          <div style={fieldGrp}>
                            <label style={fieldLbl}>{sectionBadge('O','#10B981')} Exame físico / Objetivo</label>
                            <textarea
                              value={atendEvolucao} onChange={e => setAtendEvolucao(e.target.value)}
                              placeholder="Sinais vitais, achados do exame físico, resultados de exames laboratoriais/imagem..."
                              rows={3} style={ta} disabled={atendSaved}
                              onFocus={e => (e.target.style.borderColor='#0066D0')}
                              onBlur={e => (e.target.style.borderColor='#E5E7EB')}
                            />
                          </div>

                          {/* A — Assessment */}
                          <div style={fieldGrp}>
                            <label style={fieldLbl}>{sectionBadge('A','#F59E0B')} Diagnóstico / Avaliação</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10 }}>
                              <input
                                value={atendDiag} onChange={e => setAtendDiag(e.target.value)}
                                placeholder="Hipótese diagnóstica ou diagnóstico definitivo"
                                disabled={atendSaved}
                                style={{ ...ta, height: 36, padding: '0 10px', resize: 'none' } as CSSProperties}
                                onFocus={e => (e.target.style.borderColor='#0066D0')}
                                onBlur={e => (e.target.style.borderColor='#E5E7EB')}
                              />
                              <input
                                value={atendCid} onChange={e => setAtendCid(e.target.value.toUpperCase())}
                                placeholder="CID-10 (ex: J00)"
                                disabled={atendSaved}
                                style={{ ...ta, height: 36, padding: '0 10px', resize: 'none' } as CSSProperties}
                                onFocus={e => (e.target.style.borderColor='#0066D0')}
                                onBlur={e => (e.target.style.borderColor='#E5E7EB')}
                              />
                            </div>
                          </div>

                          {/* P — Plan */}
                          <div style={fieldGrp}>
                            <label style={fieldLbl}>{sectionBadge('P','#8B5CF6')} Conduta / Plano</label>
                            <textarea
                              value={atendConduta} onChange={e => setAtendConduta(e.target.value)}
                              placeholder="Orientações, medicamentos prescritos, solicitação de exames, encaminhamentos, plano terapêutico..."
                              rows={3} style={ta} disabled={atendSaved}
                              onFocus={e => (e.target.style.borderColor='#0066D0')}
                              onBlur={e => (e.target.style.borderColor='#E5E7EB')}
                            />
                          </div>

                          {/* Retorno */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>📅 Retorno em:</label>
                            <input
                              type="date" value={atendRetorno} onChange={e => setAtendRetorno(e.target.value)}
                              disabled={atendSaved}
                              style={{ height: 34, border: '1.5px solid #E5E7EB', borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', color: '#374151', outline: 'none' }}
                            />
                            {atendRetorno && <span style={{ fontSize: 11, color: '#6B7280' }}>
                              {Math.round((new Date(atendRetorno + 'T12:00:00').getTime() - Date.now()) / 86400000)} dias
                            </span>}
                          </div>

                          {/* Save / Saved */}
                          {!atendSaved ? (
                            <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid #F3F4F6' }}>
                              <button
                                disabled={atendSaving || (!atendQueixa.trim() && !atendEvolucao.trim() && !atendDiag.trim() && !atendConduta.trim())}
                                onClick={async () => {
                                  if (!selected) return;
                                  if (!atendQueixa.trim() && !atendEvolucao.trim() && !atendDiag.trim() && !atendConduta.trim()) return;
                                  setAtendSaving(true);
                                  const { error: atendErr } = await supabase.from('medical_records').insert({
                                    patient_id: selected.id,
                                    doctor_id: doctor?.id ?? null,
                                    date: new Date().toISOString().slice(0, 10),
                                    complaint: atendQueixa.trim() || null,
                                    evolution: atendEvolucao.trim() || null,
                                    diagnosis: atendDiag.trim() || null,
                                    diagnosis_code: atendCid.trim() || null,
                                    conduct: atendConduta.trim() || null,
                                    return_date: atendRetorno || null,
                                  });
                                  if (atendErr) {
                                    console.error('Erro ao salvar:', atendErr.message);
                                    alert('Erro ao salvar. Tente novamente.');
                                    setAtendSaving(false);
                                    return;
                                  }
                                  await supabase.from('medical_records').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).then(({ data }) => setRecords((data as MedicalRecord[]) ?? []));
                                  setAtendSaving(false);
                                  setAtendSaved(true);
                                }}
                                style={{
                                  height: 36, padding: '0 20px',
                                  background: (atendSaving || (!atendQueixa.trim() && !atendEvolucao.trim() && !atendDiag.trim() && !atendConduta.trim())) ? '#E5E7EB' : '#0066D0',
                                  color: (atendSaving || (!atendQueixa.trim() && !atendEvolucao.trim() && !atendDiag.trim() && !atendConduta.trim())) ? '#9CA3AF' : '#fff',
                                  border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700,
                                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                                }}
                              >
                                {atendSaving ? '⏳ Salvando…' : '💾 Salvar consulta'}
                              </button>
                              <button
                                onClick={() => { setActiveSection('presc'); }}
                                style={{ height: 36, padding: '0 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#374151', display: 'flex', alignItems: 'center', gap: 5 }}
                              >
                                💊 Ir para Prescrição
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                              <span style={{ fontSize: 18 }}>✅</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Consulta salva com sucesso!</div>
                                <div style={{ fontSize: 11, color: '#4B7B5A' }}>Registrada no histórico do paciente</div>
                              </div>
                              <button onClick={() => { setAtendSaved(false); setAtendQueixa(''); setAtendEvolucao(''); setAtendDiag(''); setAtendCid(''); setAtendConduta(''); setAtendRetorno(''); }}
                                style={{ height: 30, padding: '0 12px', border: '1px solid #BBF7D0', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#166534' }}>
                                + Nova consulta
                              </button>
                              <button onClick={() => setActiveSection('presc')}
                                style={{ height: 30, padding: '0 12px', background: '#0066D0', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#fff' }}>
                                💊 Prescrever
                              </button>
                            </div>
                          )}

                        </div>
                      );
                    })()}
                  </Card>
                </div>
              )}

              {activeSection === 'exames' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Quick add chips */}
                  <Card>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>🔬 Solicitar Exames</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>Clique para adicionar exames comuns ou escreva manualmente</div>
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                      {/* Quick add chips */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>ATALHOS RÁPIDOS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {['Hemograma completo','Glicemia jejum','HbA1c','TSH / T4 livre','Colesterol total e frações','Triglicerídeos','Creatinina','TGO / TGP','Urina tipo I','Rx tórax PA','ECG','Ecocardiograma','USG abdome total','Mamografia','PSA'].map(ex => (
                            <button
                              key={ex}
                              onClick={() => {
                                const empty = examLines.findIndex(l => !l.trim());
                                if (empty >= 0) {
                                  setExamLines(prev => prev.map((l, i) => i === empty ? ex : l));
                                } else {
                                  setExamLines(prev => [...prev, ex]);
                                }
                              }}
                              style={{ height: 28, padding: '0 10px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 20, fontSize: 11, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                              onMouseEnter={e => { (e.currentTarget).style.background='#DBEAFE'; (e.currentTarget).style.borderColor='#93C5FD'; }}
                              onMouseLeave={e => { (e.currentTarget).style.background='#F3F4F6'; (e.currentTarget).style.borderColor='#E5E7EB'; }}
                            >
                              + {ex}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Exam list */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>LISTA DE EXAMES SOLICITADOS</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label style={{ fontSize: 11, color: '#6B7280' }}>Prioridade:</label>
                            <select value={examUrgency} onChange={e => setExamUrgency(e.target.value)}
                              style={{ height: 28, padding: '0 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', background: '#fff' }}>
                              <option>Rotina</option>
                              <option>Urgência</option>
                              <option>Pré-operatório</option>
                              <option>Controle</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {examLines.map((line, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#F3F4F6', border: '1px solid #E5E7EB', fontSize: 10, fontWeight: 700, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
                              <input
                                value={line}
                                onChange={e => setExamLines(prev => prev.map((l, i) => i === idx ? e.target.value : l))}
                                placeholder={`Exame ${idx + 1}`}
                                style={{ flex: 1, height: 34, border: '1px solid #E5E7EB', borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                                onFocus={e => (e.target.style.borderColor='#0066D0')}
                                onBlur={e => (e.target.style.borderColor='#E5E7EB')}
                              />
                              <button onClick={() => setExamLines(prev => prev.length === 1 ? [''] : prev.filter((_, i) => i !== idx))}
                                style={{ width: 28, height: 28, border: '1px solid #FEE2E2', borderRadius: 6, background: '#FFF5F5', color: '#EF4444', fontSize: 14, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => setExamLines(prev => [...prev, ''])}
                          style={{ marginTop: 6, height: 30, padding: '0 12px', border: '1px dashed #0066D0', borderRadius: 6, background: '#EFF6FF', color: '#0066D0', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                          + Adicionar linha
                        </button>
                      </div>

                      {/* Actions */}
                      {!examSaved ? (
                        <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid #F3F4F6' }}>
                          <button
                            disabled={examSaving || examLines.every(l => !l.trim())}
                            onClick={async () => {
                              if (!selected) return;
                              const valid = examLines.filter(l => l.trim());
                              if (!valid.length) return;
                              setExamSaving(true);
                              const { error: examErr } = await supabase.from('medical_records').insert({
                                patient_id: selected.id,
                                doctor_id: doctor?.id ?? null,
                                date: new Date().toISOString().slice(0, 10),
                                conduct: `SOLICITAÇÃO DE EXAMES (${examUrgency}):\n${valid.map((e, i) => `${i + 1}. ${e}`).join('\n')}`,
                              });
                              if (examErr) {
                                console.error('Erro ao salvar:', examErr.message);
                                alert('Erro ao salvar. Tente novamente.');
                                setExamSaving(false);
                                return;
                              }
                              await supabase.from('medical_records').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).then(({ data }) => setRecords((data as MedicalRecord[]) ?? []));
                              setExamSaving(false);
                              setExamSaved(true);
                            }}
                            style={{ height: 36, padding: '0 20px', background: examLines.every(l => !l.trim()) ? '#E5E7EB' : '#0066D0', color: examLines.every(l => !l.trim()) ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            {examSaving ? '⏳ Salvando…' : '💾 Salvar e Imprimir'}
                          </button>
                          <button onClick={() => window.print()} style={{ height: 36, padding: '0 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#374151', display: 'flex', alignItems: 'center', gap: 5 }}>
                            🖨 Imprimir
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                          <span style={{ fontSize: 18 }}>✅</span>
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#166534' }}>Solicitação registrada!</div>
                          <button onClick={() => { setExamSaved(false); setExamLines(['']); }}
                            style={{ height: 30, padding: '0 12px', border: '1px solid #BBF7D0', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#166534' }}>
                            + Nova solicitação
                          </button>
                          <button onClick={() => window.print()}
                            style={{ height: 30, padding: '0 12px', background: '#0066D0', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#fff' }}>
                            🖨 Imprimir
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {activeSection === 'documentos' && (() => {
                const docTypes = [
                  { id: 'atestado',        label: '📋 Atestado Médico',      desc: 'Afastamento por dias' },
                  { id: 'comparecimento',  label: '📅 Declaração de Comparecimento', desc: 'Consulta realizada' },
                  { id: 'encaminhamento',  label: '📤 Encaminhamento',        desc: 'Para especialista' },
                ];

                const todayFull = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                const today2 = new Date().toLocaleDateString('pt-BR');

                let docContent = '';
                if (docType === 'atestado') {
                  docContent = `Atesto para os devidos fins que ${selected?.name}${selected?.birth_date ? `, nascido(a) em ${new Date(selected.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}, encontra-se sob meus cuidados médicos, necessitando de afastamento de suas atividades por ${atestDias} dia(s)${atestMotivo ? `, devido a ${atestMotivo}` : ''}.`;
                } else if (docType === 'comparecimento') {
                  docContent = `Declaro que ${selected?.name} compareceu a esta clínica para consulta médica no dia ${today2}, no período indicado.`;
                } else {
                  docContent = `Encaminho para avaliação com ${encamEspec || 'especialista'}${encamMotivo ? ` o(a) paciente ${selected?.name} com queixa de ${encamMotivo}` : ` o(a) paciente ${selected?.name}`}. Solicito avaliação e conduta.`;
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Type selector */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {docTypes.map(dt => (
                        <button key={dt.id} onClick={() => setDocType(dt.id as any)}
                          style={{ flex: 1, padding: '10px 12px', border: `2px solid ${docType === dt.id ? '#0066D0' : '#E5E7EB'}`, borderRadius: 8, background: docType === dt.id ? '#EFF6FF' : '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: docType === dt.id ? '#0066D0' : '#111827' }}>{dt.label}</div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{dt.desc}</div>
                        </button>
                      ))}
                    </div>

                    {/* Form */}
                    <Card>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', fontSize: 13, fontWeight: 700, color: '#111827' }}>
                        {docTypes.find(d => d.id === docType)?.label}
                      </div>
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {docType === 'atestado' && (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'end' }}>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Dias de afastamento</label>
                                <input type="number" min="1" value={atestDias} onChange={e => setAtestDias(e.target.value)}
                                  style={{ width: '100%', height: 36, border: '1.5px solid #E5E7EB', borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Motivo (opcional)</label>
                                <input value={atestMotivo} onChange={e => setAtestMotivo(e.target.value)}
                                  placeholder="Ex: estado gripal, pós-operatório, gastroenterite..."
                                  style={{ width: '100%', height: 36, border: '1.5px solid #E5E7EB', borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                              </div>
                            </div>
                          </>
                        )}

                        {docType === 'encaminhamento' && (
                          <>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Especialidade / Médico</label>
                              <input value={encamEspec} onChange={e => setEncamEspec(e.target.value)}
                                placeholder="Ex: Cardiologia, Dr. João Silva"
                                style={{ width: '100%', height: 36, border: '1.5px solid #E5E7EB', borderRadius: 7, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Motivo do encaminhamento</label>
                              <textarea value={encamMotivo} onChange={e => setEncamMotivo(e.target.value)}
                                placeholder="Descreva brevemente o motivo clínico do encaminhamento..."
                                rows={2}
                                style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                            </div>
                          </>
                        )}

                        {/* Preview */}
                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 18px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>Pré-visualização</div>
                          <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>ATESTADO MÉDICO</div>
                            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{docTypes.find(d => d.id === docType)?.label.replace(/^[^\s]+ /, '')}</div>
                          </div>
                          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8, marginBottom: 16 }}>
                            {docContent}
                          </div>
                          <div style={{ fontSize: 12, color: '#6B7280', borderTop: '1px solid #E5E7EB', paddingTop: 12, marginTop: 8 }}>
                            <div>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                            <div style={{ marginTop: 20, borderTop: '1px solid #9CA3AF', paddingTop: 4, display: 'inline-block', minWidth: 200 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Dr(a). {doctor.name}</div>
                              {doctor.specialty && <div style={{ fontSize: 11 }}>{doctor.specialty}</div>}
                            </div>
                          </div>
                        </div>

                        {/* Print button */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => window.print()}
                            style={{ height: 36, padding: '0 20px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                            🖨 Imprimir Documento
                          </button>
                          <button onClick={() => copyToClipboard(docContent)}
                            style={{ height: 36, padding: '0 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>
                            📋 Copiar texto
                          </button>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })()}

              {activeSection === 'imagens' && (
                <Card>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>🖼️ Imagens e Anexos</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Laudos, exames de imagem e outros arquivos do paciente</div>
                  </div>
                  <div style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📎</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Nenhum arquivo anexado</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Em breve: upload de imagens DICOM, laudos e PDFs</div>
                    </div>
                    <div style={{ padding: '12px 20px', background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: 10, maxWidth: 360 }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                        💡 <strong>Dica:</strong> Para ativar o armazenamento de arquivos, configure o Supabase Storage no painel do projeto e habilite o bucket <code style={{ background: '#E5E7EB', padding: '1px 4px', borderRadius: 3 }}>patient-files</code>.
                      </div>
                    </div>
                  </div>
                </Card>
              )}

            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 60, fontSize: 13 }}>Nenhum paciente selecionado</div>
          )}
        </div>{/* end scroll area */}

        {/* ── MedFlow AI Bar (aparece durante o atendimento) ── */}
        {timerActive && (
          <div style={{ flexShrink: 0, borderTop: '1px solid #E5E7EB' }}>
            {/* Tira de notificação teal */}
            <div style={{
              background: 'linear-gradient(90deg,#0D9488 0%,#0891B2 100%)',
              padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, letterSpacing: 0.3 }}>
                ✨ MedFlow AI · Assistente de Prontuário ativo — clique em &quot;Iniciar Registro&quot; para ditar o atendimento
              </span>
            </div>
            {/* Barra principal */}
            <div style={{
              background: '#fff', padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              {/* Ícone robô */}
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg,#0D9488 0%,#0891B2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 16 }}>🤖</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>
                Assistente de IA
              </span>
              {/* Especialidade */}
              <select
                value={aiSpecialty}
                onChange={e => setAiSpecialty(e.target.value)}
                style={{
                  height: 30, padding: '0 10px', border: '1px solid #E5E7EB',
                  borderRadius: 6, fontSize: 12, color: '#374151',
                  background: '#fff', fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                {['Generalista','Cardiologia','Pediatria','Ginecologia','Ortopedia','Neurologia','Dermatologia','Endocrinologia'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {/* Botão principal */}
              <button
                onClick={() => { setAiRelato(''); setAiResult(''); setShowAiModal(true); }}
                style={{
                  height: 34, padding: '0 14px',
                  background: 'linear-gradient(135deg,#0D9488 0%,#0891B2 100%)',
                  color: '#fff', border: 'none', borderRadius: 7,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>🎤</span> Iniciar Registro
              </button>
              {/* Menu ⋮ */}
              <button style={{
                width: 30, height: 30, background: 'none', border: '1px solid #E5E7EB',
                borderRadius: 6, cursor: 'pointer', fontSize: 16, color: '#6B7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>⋮</button>
            </div>
            {/* Aviso legal */}
            <div style={{ background: '#F9FAFB', padding: '4px 16px', borderTop: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                Ao usar o MedFlow AI, você concorda com os{' '}
                <span style={{ color: '#0891B2', cursor: 'pointer' }}>termos de uso</span>{' '}
                e a{' '}
                <span style={{ color: '#0891B2', cursor: 'pointer' }}>política de privacidade</span>.
              </span>
            </div>
          </div>
        )}
      </div>{/* end main content */}
    </div>{/* end two-column */}

    {/* ── Modal edição de anamnese ── */}
    {anamEditIdx !== null && (
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}
        onClick={e => e.target === e.currentTarget && !anamSaving && setAnamEditIdx(null)}
      >
        <div style={{
          background: '#fff', borderRadius: 12, width: 420, maxWidth: '94vw',
          boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid #F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                {anamnesisTitles[anamEditIdx]}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                {selected?.name}
              </div>
            </div>
            <button
              onClick={() => !anamSaving && setAnamEditIdx(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20, lineHeight: 1 }}
            >×</button>
          </div>

          {/* Body */}
          <div style={{ padding: '16px 18px' }}>
            <textarea
              value={anamEditVal}
              onChange={e => setAnamEditVal(e.target.value)}
              autoFocus
              placeholder={`Digite as informações de ${anamnesisTitles[anamEditIdx ?? 0].toLowerCase()}…`}
              style={{
                width: '100%', minHeight: 120, border: '1.5px solid #D1D5DB',
                borderRadius: 8, padding: '10px 12px', fontSize: 13,
                fontFamily: 'inherit', color: '#111827', resize: 'vertical',
                outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#0066D0')}
              onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
            />
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 18px 14px', display: 'flex', justifyContent: 'flex-end', gap: 8,
          }}>
            <button
              onClick={() => { setAnamEditIdx(null); setAnamEditVal(''); }}
              disabled={anamSaving}
              style={{
                height: 34, padding: '0 16px', border: '1px solid #E5E7EB',
                borderRadius: 7, background: '#fff', fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit', color: '#374151',
              }}
            >Cancelar</button>
            <button
              disabled={anamSaving}
              onClick={async () => {
                if (!selected || anamEditIdx === null) return;
                setAnamSaving(true);
                const field = anamKeys[anamEditIdx];
                const val   = anamEditVal.trim() || null;

                if (rec0?.id && (rec0 as any).type === 'anamnesis') {
                  // Atualiza o registro de anamnese dedicado
                  await supabase.from('medical_records').update({ [field]: val }).eq('id', rec0.id);
                } else if (rec0?.id && (rec0.clinical_history || rec0.surgical_history || rec0.family_history || rec0.habits || rec0.allergies || (rec0 as any).medications)) {
                  // Já existe um registro com campos de anamnese (migração): atualiza somente campos de anamnese
                  await supabase.from('medical_records').update({ [field]: val }).eq('id', rec0.id);
                } else {
                  // Cria registro de anamnese dedicado (não sobrescreve consultas)
                  await supabase.from('medical_records').insert({
                    patient_id: selected.id,
                    type: 'anamnesis',
                    date: new Date().toISOString().slice(0, 10),
                    [field]: val,
                  });
                }
                await supabase.from('medical_records').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).then(({ data }) => setRecords((data as MedicalRecord[]) ?? []));
                setAnamSaving(false);
                setAnamEditIdx(null);
                setAnamEditVal('');
              }}
              style={{
                height: 34, padding: '0 20px',
                background: anamSaving ? '#E5E7EB' : '#0066D0',
                color: anamSaving ? '#9CA3AF' : '#fff',
                border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700,
                cursor: anamSaving ? 'default' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {anamSaving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Modal IA Prontuário ── */}
    {showAiModal && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      }} onClick={e => { if (e.target === e.currentTarget && !aiLoading) { stopRecording(); setShowAiModal(false); } }}>
        <div style={{
          background: '#fff', borderRadius: 14, width: 620, maxWidth: '95vw',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,.25)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg,#0D9488 0%,#0891B2 100%)',
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🤖</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>MedFlow AI · Redação de Prontuário</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)' }}>
                Especialidade: {aiSpecialty} · Formato SOAP
              </div>
            </div>
            <button onClick={() => { if (!aiLoading) { stopRecording(); setShowAiModal(false); } }} style={{
              marginLeft: 'auto', background: 'rgba(255,255,255,.2)', border: 'none',
              borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: '#fff',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Input */}
            {!aiResult && (
              <>
                <div>
                  {/* Label + botão mic */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                      Descreva o atendimento livremente:
                    </div>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      title={isRecording ? 'Parar gravação' : 'Gravar por voz'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        height: 32, padding: '0 12px',
                        background: isRecording
                          ? 'linear-gradient(135deg,#DC2626,#EF4444)'
                          : 'linear-gradient(135deg,#0D9488,#0891B2)',
                        color: '#fff', border: 'none', borderRadius: 7,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: isRecording ? '0 0 0 3px rgba(220,38,38,.25)' : 'none',
                        transition: 'all .2s',
                      }}
                    >
                      {/* Ícone microfone SVG */}
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="2" width="6" height="11" rx="3"/>
                        <path d="M5 10a7 7 0 0 0 14 0"/>
                        <line x1="12" y1="19" x2="12" y2="22"/>
                        <line x1="8" y1="22" x2="16" y2="22"/>
                      </svg>
                      {isRecording ? 'Parar' : 'Gravar voz'}
                      {/* Bolinha pulsando quando grava */}
                      {isRecording && (
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%', background: '#fff',
                          animation: 'aiPulse 1s infinite',
                          display: 'inline-block',
                        }}/>
                      )}
                    </button>
                  </div>

                  {/* Área de texto com borda vermelha quando grava */}
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={aiRelato}
                      onChange={e => setAiRelato(e.target.value)}
                      placeholder={isRecording
                        ? 'Fale agora… o texto aparece aqui em tempo real.'
                        : 'Exemplos:\n• "Paciente 45 anos, dor torácica há 2 dias, PA 140/90, FC 88bpm…"\n• "Criança 6 anos com febre 38.8°C, tosse produtiva, orofaringe hiperemiada…"'}
                      style={{
                        width: '100%', minHeight: 140,
                        border: `1.5px solid ${isRecording ? '#EF4444' : '#D1D5DB'}`,
                        borderRadius: 8, padding: '10px 12px', fontSize: 13,
                        fontFamily: 'inherit', color: '#111827', resize: 'vertical',
                        outline: 'none', lineHeight: 1.5, boxSizing: 'border-box',
                        background: isRecording ? '#FFF5F5' : '#fff',
                        transition: 'border-color .2s, background .2s',
                      }}
                      autoFocus={!isRecording}
                    />
                    {/* Texto interim (o que o usuário está falando agora) */}
                    {aiInterim && (
                      <div style={{
                        position: 'absolute', bottom: 10, left: 12, right: 12,
                        fontSize: 12, color: '#EF4444', fontStyle: 'italic',
                        pointerEvents: 'none',
                      }}>
                        {aiInterim}…
                      </div>
                    )}
                  </div>

                  {/* Status de gravação */}
                  {isRecording && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
                      fontSize: 11, color: '#DC2626', fontWeight: 600,
                    }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#EF4444',
                        display: 'inline-block', animation: 'aiPulse 1s infinite',
                      }}/>
                      Gravando… fale normalmente em português
                    </div>
                  )}
                </div>

                {/* Keyframe de pulsação */}
                <style>{`
                  @keyframes aiPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.8); }
                  }
                `}</style>

                {selected && (
                  <div style={{ fontSize: 11, color: '#6B7280', background: '#F9FAFB', borderRadius: 6, padding: '6px 10px' }}>
                    👤 Paciente: <strong>{selected.name}</strong>
                    {selected.birth_date && ` · ${calcAgeDetailed(selected.birth_date)}`}
                    {(selected as any).gender && ` · ${(selected as any).gender === 'M' ? 'Masculino' : 'Feminino'}`}
                  </div>
                )}
              </>
            )}

            {/* Resultado */}
            {aiResult && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0D9488' }}>✅ Prontuário SOAP gerado</div>
                  <button onClick={() => { setAiResult(''); setAiRelato(''); }} style={{
                    height: 26, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 5,
                    background: '#fff', fontSize: 11, cursor: 'pointer', color: '#6B7280', fontFamily: 'inherit',
                  }}>↩ Novo relato</button>
                </div>
                <div style={{
                  background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8,
                  padding: '14px 16px', fontSize: 13, color: '#111827', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                }}>
                  {aiResult}
                </div>
              </div>
            )}

            {/* Loading */}
            {aiLoading && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 12, padding: '32px 0',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#0D9488,#0891B2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                  animation: 'pulse 1.5s infinite',
                }}>🤖</div>
                <div style={{ fontSize: 13, color: '#0D9488', fontWeight: 600 }}>Redigindo prontuário SOAP…</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Isso leva apenas alguns segundos</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px', borderTop: '1px solid #F3F4F6',
            display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#fff',
          }}>
            {!aiResult && !aiLoading && (
              <>
                <button onClick={() => setShowAiModal(false)} style={{
                  height: 36, padding: '0 16px', border: '1px solid #E5E7EB',
                  borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>Cancelar</button>
                <button
                  disabled={!aiRelato.trim()}
                  onClick={async () => {
                    if (!aiRelato.trim()) return;
                    setAiLoading(true);
                    try {
                      const res = await fetch('/api/ai-prontuario', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          relato: aiRelato,
                          patientName: selected?.name,
                          specialty: aiSpecialty,
                        }),
                      });
                      const data = await res.json();
                      if (data.result) setAiResult(data.result);
                      else setAiResult('Erro ao gerar prontuário. Verifique a chave da API.');
                    } catch {
                      setAiResult('Erro de conexão com o servidor.');
                    }
                    setAiLoading(false);
                  }}
                  style={{
                    height: 36, padding: '0 20px',
                    background: aiRelato.trim() ? 'linear-gradient(135deg,#0D9488 0%,#0891B2 100%)' : '#E5E7EB',
                    color: aiRelato.trim() ? '#fff' : '#9CA3AF',
                    border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700,
                    cursor: aiRelato.trim() ? 'pointer' : 'default',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  ✨ Gerar Prontuário SOAP
                </button>
              </>
            )}
            {aiResult && !aiLoading && (
              <>
                <button onClick={() => copyToClipboard(aiResult)} style={{
                  height: 36, padding: '0 14px', border: '1px solid #E5E7EB',
                  borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
                }}>📋 Copiar</button>
                <button onClick={() => {
                  setShowAiModal(false);
                  setShowConsulta(true);
                }} style={{
                  height: 36, padding: '0 16px',
                  background: 'linear-gradient(135deg,#0D9488 0%,#0891B2 100%)',
                  color: '#fff', border: 'none', borderRadius: 7,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>📝 Usar no Prontuário</button>
              </>
            )}
          </div>
        </div>
      </div>
    )}

    {/* ── Modals (portals over everything) ── */}
    {showConsulta && selected && (
      <ConsultaModal patient={selected} onClose={() => setShowConsulta(false)} onSaved={() => {
        setShowConsulta(false);
        supabase.from('medical_records').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).then(({ data }) => setRecords((data as MedicalRecord[]) ?? []));
        supabase.from('prescriptions').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).then(({ data }) => setPrescriptions((data as Prescription[]) ?? []));
      }} />
    )}
    {editRecord && selected && (
      <EditConsultaModal patient={selected} record={editRecord} onClose={() => setEditRecord(null)} onSaved={() => {
        setEditRecord(null);
        supabase.from('medical_records').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).then(({ data }) => setRecords((data as MedicalRecord[]) ?? []));
        supabase.from('prescriptions').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).then(({ data }) => setPrescriptions((data as Prescription[]) ?? []));
      }} />
    )}
    {showCreatePresc && selected && (
      <NovaPrescricaoModal
        patient={selected}
        initialItems={pendingModelItems ?? undefined}
        onClose={() => { setShowCreatePresc(false); setPendingModelItems(null); }}
        onSaved={() => {
          setPendingModelItems(null);
          supabase.from('prescriptions').select('*').eq('patient_id', selected.id).order('created_at', { ascending: false }).then(({ data }) => setPrescriptions((data as Prescription[]) ?? []));
        }}
      />
    )}

    {/* Adicionar paciente direto do prontuário */}
    {showAddPtInList && (
      <AddPatientModal onClose={() => setShowAddPtInList(false)} onSaved={() => {
        setShowAddPtInList(false);
        supabase.from('patients').select('*').eq('active', true).order('name')
          .then(({ data }) => setPatients((data as Patient[]) ?? []));
      }} />
    )}

    {/* Modal: selecionar modelo de prescrição */}
    {showModelPicker && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
        onClick={e => e.target === e.currentTarget && setShowModelPicker(false)}>
        <div style={{ background:'#fff', borderRadius:12, width:420, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.2)', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>Selecionar Modelo de Prescrição</div>
            <button onClick={() => setShowModelPicker(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:20 }}>×</button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            {prescModels.length === 0 ? (
              <div style={{ textAlign:'center', color:'#9CA3AF', fontSize:13, padding:'24px 0' }}>
                Nenhum modelo cadastrado.<br />
                <button onClick={() => { setShowModelPicker(false); setShowAddModel(true); }} style={{ marginTop:8, color:'#0066D0', background:'none', border:'none', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>+ Criar primeiro modelo</button>
              </div>
            ) : prescModels.map(m => (
              <div key={m.id} style={{ padding:'10px 12px', border:'1px solid #E5E7EB', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{m.name}</div>
                  <div style={{ fontSize:11, color:'#6B7280' }}>{m.items.length} medicamento(s)</div>
                </div>
                <button onClick={() => { setPendingModelItems(m.items.map((it: any) => ({ med: it.med ?? it.medication ?? '', dose: it.dose ?? it.dosage ?? '', freq: it.freq ?? it.frequency ?? '', dur: it.dur ?? it.duration ?? '' }))); setShowModelPicker(false); setShowCreatePresc(true); }} style={{ height:30, padding:'0 12px', background:'#0066D0', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Usar</button>
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 16px', borderTop:'1px solid #F3F4F6' }}>
            <button onClick={() => { setShowModelPicker(false); setShowAddModel(true); }} style={{ width:'100%', height:34, border:'1.5px dashed #0066D0', borderRadius:7, background:'#EFF6FF', color:'#0066D0', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>+ Criar novo modelo</button>
          </div>
        </div>
      </div>
    )}

    {/* Modal: adicionar modelo de prescrição */}
    {showAddModel && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
        onClick={e => e.target === e.currentTarget && setShowAddModel(false)}>
        <div style={{ background:'#fff', borderRadius:12, width:400, boxShadow:'0 20px 60px rgba(0,0,0,.2)', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>Salvar como Modelo</div>
            <button onClick={() => setShowAddModel(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:20 }}>×</button>
          </div>
          <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:500, color:'#374151', marginBottom:4 }}>Nome do modelo</div>
              <input value={newModelName} onChange={e => setNewModelName(e.target.value)} placeholder="Ex: Hipertensão leve, Gripe adulto..." autoFocus
                style={{ width:'100%', height:36, border:'1.5px solid #D1D5DB', borderRadius:7, padding:'0 10px', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                onFocus={e => (e.target.style.borderColor='#0066D0')} onBlur={e => (e.target.style.borderColor='#D1D5DB')}
              />
            </div>
            <div style={{ fontSize:12, color:'#6B7280' }}>O modelo será salvo vazio. Você pode criar uma prescrição e salvar como modelo a seguir.</div>
          </div>
          <div style={{ padding:'10px 18px 16px', display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={() => { setShowAddModel(false); setNewModelName(''); }} style={{ height:34, padding:'0 16px', border:'1px solid #E5E7EB', borderRadius:7, background:'#fff', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
            <button disabled={!newModelName.trim()} onClick={async () => {
              if (!newModelName.trim()) return;
              const { data } = await supabase.from('prescription_models').insert({ name: newModelName.trim(), items: [] }).select('*').single();
              if (data) setPrescModels(prev => [...prev, { id: data.id, name: data.name, items: [] }]);
              setShowAddModel(false); setNewModelName('');
            }} style={{ height:34, padding:'0 20px', background: newModelName.trim()?'#0066D0':'#E5E7EB', color: newModelName.trim()?'#fff':'#9CA3AF', border:'none', borderRadius:7, fontSize:13, fontWeight:700, cursor: newModelName.trim()?'pointer':'default', fontFamily:'inherit' }}>Salvar</button>
          </div>
        </div>
      </div>
    )}

    {/* Modal: gerenciar modelos */}
    {showManageModels && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
        onClick={e => e.target === e.currentTarget && setShowManageModels(false)}>
        <div style={{ background:'#fff', borderRadius:12, width:440, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.2)', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>Gerenciar Modelos de Prescrição</div>
            <button onClick={() => setShowManageModels(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:20 }}>×</button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            {prescModels.length === 0 ? (
              <div style={{ textAlign:'center', color:'#9CA3AF', fontSize:13, padding:'24px 0' }}>Nenhum modelo cadastrado.</div>
            ) : prescModels.map(m => (
              <div key={m.id} style={{ padding:'10px 12px', border:'1px solid #E5E7EB', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{m.name}</div>
                  <div style={{ fontSize:11, color:'#6B7280' }}>{m.items.length} medicamento(s)</div>
                </div>
                <button onClick={async () => {
                  if (!window.confirm(`Excluir modelo "${m.name}"?`)) return;
                  await supabase.from('prescription_models').delete().eq('id', m.id);
                  setPrescModels(prev => prev.filter(x => x.id !== m.id));
                }} style={{ height:28, padding:'0 10px', background:'#FEF2F2', color:'#EF4444', border:'1px solid #FECACA', borderRadius:6, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Excluir</button>
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 16px', borderTop:'1px solid #F3F4F6' }}>
            <button onClick={() => { setShowManageModels(false); setShowAddModel(true); }} style={{ width:'100%', height:34, border:'1.5px dashed #0066D0', borderRadius:7, background:'#EFF6FF', color:'#0066D0', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>+ Criar novo modelo</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

/* ─────────────────────────────────────────
   APPOINTMENT DETAIL MODAL
───────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  em_atendimento: 'Em atendimento', aguardando: 'Aguardando', confirmado: 'Confirmado',
  agendado: 'Agendado', concluido: 'Concluído', faltou: 'Faltou', cancelado: 'Cancelado',
};
const TYPE_LABEL: Record<string, string> = {
  consulta: 'Consulta', retorno: 'Retorno', primeira_consulta: 'Primeira Consulta',
  avaliacao: 'Avaliação', exame: 'Exame', procedimento: 'Procedimento', teleconsulta: 'Teleconsulta',
};

function AppointmentDetailModal({
  appt, onClose, onStatusChange, onStartAtendimento,
}: {
  appt: Appointment;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onStartAtendimento: (appt: Appointment) => void;
}) {
  const doctor    = React.useContext(DoctorContext);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const close = () => {
    setLeaving(true);
    setTimeout(onClose, 160);
  };

  const sc   = STATUS_COLORS[appt.status] ?? { bg: '#F3F4F6', color: '#6B7280' };
  const show = visible && !leaving;

  const dateStr = new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = `${appt.start_time?.slice(0, 5)} – ${appt.end_time?.slice(0, 5)}`;
  const phone   = appt.patients?.phone ?? '';
  const waHref  = phone ? `https://wa.me/55${phone.replace(/\D/g, '')}` : null;
  const canStart = !['concluido', 'cancelado', 'faltou', 'em_atendimento'].includes(appt.status);

  const handleCancel = async () => {
    onStatusChange(appt.id, 'cancelado');
    await supabase.from('appointments').update({ status: 'cancelado' }).eq('id', appt.id);
    close();
  };

  const bdr: CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: show ? 'rgba(10,14,30,.52)' : 'rgba(10,14,30,0)',
    backdropFilter: show ? 'blur(5px)' : 'blur(0px)',
    transition: 'background 180ms ease, backdrop-filter 180ms ease',
  };
  const box: CSSProperties = {
    width: 428, background: '#fff', borderRadius: 18,
    boxShadow: '0 32px 80px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.06)',
    overflow: 'hidden',
    transform: show ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
    opacity: show ? 1 : 0,
    transition: 'transform 160ms cubic-bezier(.22,1,.36,1), opacity 160ms ease',
  };

  return (
    <div style={bdr} onClick={e => e.target === e.currentTarget && close()}>
      <div style={box}>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 20px 14px',
          background: `linear-gradient(135deg, ${sc.bg} 0%, #fff 55%)`,
          borderBottom: '1px solid #F3F4F6',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0F1626', lineHeight: 1.15,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {appt.patients?.name ?? 'Paciente'}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                {TYPE_LABEL[appt.type] ?? appt.type}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20,
                background: sc.bg, color: sc.color,
                fontSize: 11, fontWeight: 700, letterSpacing: '.02em',
              }}>
                {STATUS_LABEL[appt.status] ?? appt.status}
              </span>
              <button onClick={close} style={{
                width: 30, height: 30, border: 'none', background: 'rgba(0,0,0,.06)',
                borderRadius: 8, cursor: 'pointer', fontSize: 18, color: '#6B7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit',
              }}>×</button>
            </div>
          </div>
        </div>

        {/* ── Info grid ── */}
        <div style={{ padding: '16px 20px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 14, columnGap: 20 }}>
            {([
              { k: 'Data',         v: dateStr },
              { k: 'Horário',      v: timeStr },
              { k: 'Profissional', v: doctor.name },
              { k: 'Convênio',     v: appt.insurance || 'Particular' },
            ] as { k: string; v: string }[]).map(({ k, v }) => (
              <div key={k}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF',
                  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{v}</div>
              </div>
            ))}
          </div>

          {appt.notes && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#F8F9FB',
              borderRadius: 9, borderLeft: '3px solid #DBEAFE' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF',
                textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Observações</div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{appt.notes}</div>
            </div>
          )}
        </div>

        {/* ── Status quick-change ── */}
        <div style={{ padding: '0 20px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['aguardando','confirmado','em_atendimento','concluido','faltou'] as const).map(s => {
            const active = appt.status === s;
            const c = STATUS_COLORS[s] ?? { bg: '#F3F4F6', color: '#6B7280' };
            return (
              <button key={s} onClick={async () => {
                if (active) return;
                if (s === 'faltou' && !window.confirm('Marcar como faltou?')) return;
                onStatusChange(appt.id, s);
                await supabase.from('appointments').update({ status: s }).eq('id', appt.id);
              }} style={{
                height: 26, padding: '0 10px', borderRadius: 20, fontFamily: 'inherit',
                border: active ? `1.5px solid ${c.color}` : '1px solid #E5E7EB',
                background: active ? c.bg : '#fff',
                color: active ? c.color : '#6B7280',
                fontSize: 11, fontWeight: active ? 700 : 500, cursor: active ? 'default' : 'pointer',
                transition: 'all .12s',
              }}>
                {STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>

        {/* ── Actions ── */}
        <div style={{ padding: '12px 20px 20px', borderTop: '1px solid #F3F4F6',
          display: 'flex', flexDirection: 'column', gap: 8 }}>
          {canStart && (
            <button onClick={() => onStartAtendimento(appt)} style={{
              width: '100%', height: 46, background: 'linear-gradient(135deg,#0055C8,#0077F5)',
              color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 4px 14px rgba(0,102,208,.35)',
            }}>
              <span style={{ fontSize: 16 }}>▶</span> Iniciar Atendimento
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, height: 38, background: '#D1FAE5', color: '#065F46',
                border: '1px solid #A7F3D0', borderRadius: 9, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                💬 WhatsApp
              </a>
            )}
            {!['cancelado','concluido'].includes(appt.status) && (
              <button onClick={handleCancel} style={{
                flex: 1, height: 38, background: '#FFF5F5', color: '#EF4444',
                border: '1px solid #FECACA', borderRadius: 9, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Cancelar
              </button>
            )}
            {!waHref && !['cancelado','concluido'].includes(appt.status) === false && (
              <button onClick={close} style={{
                flex: 1, height: 38, background: '#F9FAFB', color: '#374151',
                border: '1px solid #E5E7EB', borderRadius: 9, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Fechar
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   EHR ATENDIMENTO — layout 3 colunas
   Usado tanto pela Agenda (appt) quanto
   pelo Prontuário (patient)
───────────────────────────────────────── */
function EHRAtendimento({ appt, patient: patientProp, onClose }: {
  appt?: Appointment;
  patient?: Patient;
  onClose: () => void;
}) {
  const doctor      = React.useContext(DoctorContext);
  const editorRef   = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordIdRef = React.useRef<string | null>(null);
  const elapsedRef  = React.useRef(0);
  const startTs     = React.useRef(Date.now());

  // Resolve patient from either source
  const patientData = (appt?.patients as Patient | undefined) ?? patientProp ?? null;
  const patientId   = appt?.patient_id ?? patientProp?.id ?? '';
  const isApptMode  = !!appt;

  const [elapsed,   setElapsed]   = useState(0);
  const [isEmpty,   setIsEmpty]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [autoSaved, setAutoSaved] = useState<string>('');   // '' | 'saving' | 'saved'
  const [showPresc, setShowPresc] = useState(false);
  const [atestDias, setAtestDias] = useState('1');
  const [records,   setRecords]   = useState<MedicalRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'Atendimento'|'Prontuário'|'Relacionamento'|'Arquivos'>('Atendimento');

  /* ── Timer (somente modo agendamento) ── */
  useEffect(() => {
    if (!isApptMode) return;
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - startTs.current) / 1000);
      setElapsed(s);
      elapsedRef.current = s;
    }, 1000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fmtElapsed = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* ── Build HTML from old SOAP fields ── */
  const buildHtml = (r: MedicalRecord): string => {
    // If evolution already looks like rich HTML, use it directly
    if (r.evolution && /^<[a-z]/.test(r.evolution)) return r.evolution;
    const parts: string[] = [];
    if (r.clinical_history) parts.push(`<h3>História Clínica</h3><p>${r.clinical_history}</p>`);
    if (r.allergies)        parts.push(`<h3>Alergias</h3><p>${r.allergies}</p>`);
    if (r.medications)      parts.push(`<h3>Medicações</h3><p>${r.medications}</p>`);
    if (r.complaint)        parts.push(`<h3>Queixa Principal</h3><p>${r.complaint}</p>`);
    if (r.evolution)        parts.push(`<h3>Evolução</h3><p>${r.evolution}</p>`);
    if (r.diagnosis)        parts.push(`<h3>Diagnóstico</h3><p>${r.diagnosis}</p>`);
    if (r.conduct)          parts.push(`<h3>Conduta</h3><p>${r.conduct}</p>`);
    return parts.join('');
  };

  /* ── Load records ── */
  useEffect(() => {
    if (!patientId) return;
    supabase.from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const recs = (data as MedicalRecord[]) ?? [];
        setRecords(recs);
        // Always start with a blank editor — do NOT pre-fill from previous records
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
          setIsEmpty(true);
        }
        requestAnimationFrame(() => editorRef.current?.focus());
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  /* ── Persist ── */
  const persist = async (finalizar = false) => {
    const html = editorRef.current?.innerHTML ?? '';
    const payload = {
      patient_id:       patientId,
      doctor_id:        appt?.doctor_id ?? doctor.id,
      evolution:        html,
      duration_seconds: elapsedRef.current,
    };
    if (recordIdRef.current) {
      await supabase.from('medical_records').update(payload).eq('id', recordIdRef.current);
    } else {
      const { data } = await supabase.from('medical_records').insert(payload).select('id').single();
      if (data?.id) recordIdRef.current = data.id;
    }
    if (finalizar && appt) {
      await supabase.from('appointments').update({ status: 'concluido' }).eq('id', appt.id);
    }
  };

  /* ── Autosave debounce ── */
  const scheduleAutoSave = () => {
    setAutoSaved('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await persist(false);
      setAutoSaved('saved');
      setTimeout(() => setAutoSaved(''), 2500);
    }, 1500);
  };

  const handleInput = () => {
    const html = editorRef.current?.innerHTML ?? '';
    setIsEmpty(!html || html === '<br>');
    scheduleAutoSave();
  };

  /* ── Manual save / finalize ── */
  const handleSave = async () => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    setSaving(true);
    await persist(false);
    setSaving(false);
    setAutoSaved('saved');
    setTimeout(() => setAutoSaved(''), 2000);
  };

  const handleFinalize = async () => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    setSaving(true);
    await persist(true);

    // Lança receita automaticamente em Finanças ao finalizar o atendimento
    const valMatch = appt?.notes?.match(/__val:([\d.]+)__/);
    const txAmount = valMatch ? parseFloat(valMatch[1]) : 0;
    if (appt && txAmount > 0) {
      const typeLbl = TYPE_LABEL[appt.type] ?? appt.type;
      await supabase.from('transactions').insert({
        type:           'receita',
        amount:         txAmount,
        category:       appt.type,
        description:    `${typeLbl} — ${patientData?.name ?? 'Paciente'}`,
        date:           todayISO(),
        status:         'pendente',
        payment_method: null,
        patient_id:     patientId || null,
        doctor_id:      appt.doctor_id ?? doctor.id,
        notes:          `Gerado automaticamente ao finalizar o atendimento.`,
      });
    }

    setSaving(false);
    onClose();
  };

  /* ── Rich-text commands ── */
  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const insertSnippet = (field: string) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, `<p><strong>${field}:</strong>&nbsp;</p>`);
  };

  /* ── Atestado print ── */
  const printAtest = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><body style="font-family:Arial;padding:40px;max-width:600px;margin:auto">
      <h2 style="text-align:center">ATESTADO MÉDICO</h2>
      <p>Atesto que o(a) paciente <strong>${patientData?.name ?? ''}</strong>
      esteve sob minha responsabilidade médica, necessitando de afastamento
      de suas atividades por <strong>${atestDias} dia(s)</strong>.</p>
      <p style="margin-top:40px">Dr. ${doctor.name} — CRM ${doctor.crm}</p>
      <p style="color:#999;font-size:12px">${new Date().toLocaleDateString('pt-BR')}</p>
      </body></html>`);
    w.document.close(); w.print();
  };

  const ehrTabs = ['Atendimento', 'Prontuário', 'Relacionamento', 'Arquivos'] as const;

  /* ── Reusable inline style objects ── */
  const chipStyle: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    borderRadius: 9999, border: '1px solid #e2e8f0', background: '#fff',
    padding: '3px 10px', fontSize: 11, fontWeight: 500, color: '#374151',
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  };
  const btnSecondary: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff',
    padding: '4px 12px', fontSize: 12, fontWeight: 500, color: '#374151',
    cursor: 'pointer', fontFamily: 'inherit',
  };
  const btnPrimary: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    borderRadius: 7, border: 'none', background: '#2563eb',
    padding: '4px 14px', fontSize: 12, fontWeight: 600, color: '#fff',
    cursor: 'pointer', fontFamily: 'inherit',
  };
  const panelStyle: CSSProperties = {
    background: '#fff', border: '1px solid #e2e8f0',
    borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,.05)',
  };

  const docList = [
    { label: 'Prescrição Rápida',            icon: '💊', action: () => setShowPresc(true) },
    { label: 'Prescrições',                  icon: '📋', action: () => setShowPresc(true) },
    { label: 'Solicitações de Procedimento', icon: '📄', action: () => {} },
    { label: 'Encaminhamentos',              icon: '📤', action: () => {} },
    { label: 'Atestados',                    icon: '📄', action: () => {} },
    { label: 'Outros Documentos',            icon: '📁', action: () => {} },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'grid',
      gridTemplateColumns: '205px 1fr 355px', fontFamily: 'inherit',
      background: 'var(--color-muted, #f1f5f9)', overflow: 'hidden' }}>

      {/* ── Editor styles ── */}
      <style>{`
        #ehr-main-editor { outline: none; min-height: 300px; caret-color: #2563eb; }
        #ehr-main-editor h1,#ehr-main-editor h2,#ehr-main-editor h3 { margin:0 0 10px; color:#0F1626; font-weight:700; }
        #ehr-main-editor h3 { font-size:15px; }
        #ehr-main-editor p  { margin:0 0 10px; }
        #ehr-main-editor ul,#ehr-main-editor ol { padding-left:22px; margin:0 0 10px; }
        #ehr-main-editor li { margin-bottom:4px; }
        #ehr-main-editor strong { font-weight:700; }
        #ehr-main-editor em    { font-style:italic; }
      `}</style>

      {/* ══ LEFT SIDEBAR ══ */}
      <aside className="border-r border-primary/30 bg-gradient-to-b from-[#6F65E8] via-[#bdb8f4] to-white shadow-2xl" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Back */}
        <div style={{ padding: '12px 14px', flexShrink: 0 }}>
          <button onClick={onClose} className="ehr-action-secondary" style={{ fontSize: 12, height: 30 }}>
            ← Voltar
          </button>
        </div>

        {/* Avatar + name */}
        <div style={{ padding: '6px 14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%',
            border: '2px solid var(--color-primary, #2563eb)',
            background: 'var(--color-accent, #f0f4ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, color: 'var(--color-primary, #2563eb)' }}>
            {patientData ? initials(patientData.name) : '?'}
          </div>
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700,
              color: 'var(--color-foreground, #0f172a)', lineHeight: 1.3 }}>
              {patientData?.name ?? '—'}
            </p>
            {patientData?.birth_date && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted-foreground, #64748b)' }}>
                {calcAgeDetailed(patientData.birth_date)}
              </p>
            )}
          </div>

          {/* Insurance badge */}
          {(patientData?.insurance || appt?.insurance) && (
            <div style={{ marginTop: 8, padding: '3px 10px',
              background: 'var(--color-accent, #f0f4ff)',
              color: 'var(--color-accent-foreground, #1d4ed8)',
              borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>
              {patientData?.insurance ?? appt?.insurance}
            </div>
          )}

          {/* Timer pill — appt mode only */}
          {isApptMode && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', background: '#F8FAFF', borderRadius: 20, border: '1px solid #E0E9FF' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981',
                boxShadow: '0 0 0 2px rgba(16,185,129,.2)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0066D0',
                fontVariantNumeric: 'tabular-nums' }}>
                {fmtElapsed(elapsed)}
              </span>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div style={{ padding: '14px', borderTop: '1px solid var(--color-border, #e2e8f0)', flex: 1 }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700,
            color: 'var(--color-muted-foreground, #64748b)',
            textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Dados do paciente
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12,
            color: 'var(--color-muted-foreground, #64748b)' }}>
            {patientData?.phone && (
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                📞 {patientData.phone}
              </p>
            )}
            {patientData?.birth_date && (
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                📅 {new Date(patientData.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            )}
            {appt?.type && (
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                🩺 {TYPE_LABEL[appt.type] ?? appt.type}
                {appt.start_time && ` · ${appt.start_time.slice(0, 5)}`}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'var(--color-muted, #f1f5f9)' }}>

        {/* Tab header */}
        <header style={{ padding: '10px 16px 0', flexShrink: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '4px 6px', display: 'flex', gap: 4 }}>
            {ehrTabs.map(tab => (
              <button key={tab} type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  display: 'block', padding: '6px 14px', borderRadius: 6, border: 'none',
                  fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  background: activeTab === tab ? '#EFF6FF' : 'transparent',
                  color: activeTab === tab ? '#1d4ed8' : '#64748b',
                  borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                  transition: 'all 0.12s ease',
                }}>
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 84px' }}>

          {/* AI banner */}
          <div style={{ ...panelStyle, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ background: '#EFF6FF', borderBottom: '1px solid #BFDBFE',
              padding: '4px 14px', textAlign: 'center', fontSize: 12, color: '#1E40AF' }}>
              Você tem 5 usos restantes para testes do Scribe AI da Doctor Assistant!
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', gap: 8, flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: 12, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: 6 }}>
                🤖 Assistente de IA
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" style={btnSecondary}>Generalista</button>
                <button type="button" style={btnPrimary}
                  onClick={() => exec('insertHTML', '<p><em>— IA: reforçar educação em saúde e sinais de alarme.</em></p>')}>
                  📓 Iniciar Registro
                </button>
              </div>
            </div>
          </div>

          {/* ── Tab: Atendimento ── */}
          {activeTab === 'Atendimento' && (
            <div style={{ ...panelStyle, padding: '16px' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700,
                color: 'var(--color-foreground, #0f172a)' }}>
                Registro interno
              </h2>

              {/* Template + autosave */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center',
                flexWrap: 'wrap' as const, marginBottom: 8 }}>
                <select style={{ height: 36, flex: 1, minWidth: 0, fontSize: 12,
                  border: '1px solid #e2e8f0', borderRadius: 7, padding: '0 10px',
                  fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#374151' }}>
                  {['Selecione um modelo de anamnese', 'Modelo de anamnese geral',
                    'Retorno cardiologia', 'Acompanhamento diabetes', 'Queixa respiratória']
                    .map(t => <option key={t}>{t}</option>)}
                </select>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                  background: 'var(--color-muted, #f1f5f9)', borderRadius: 9999, fontSize: 11,
                  color: autoSaved === 'saved' ? '#10B981' : 'var(--color-muted-foreground, #64748b)',
                  whiteSpace: 'nowrap', flexShrink: 0 }}>
                  🕐 {autoSaved === 'saving' ? 'Salvando…' : autoSaved === 'saved' ? 'Autosalvo' : 'Agora'}
                </span>
              </div>

              {/* Snippet chips */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                {(['QP', 'HDA', 'Exame', 'Dx', 'Plano'] as const).map(s => (
                  <button key={s} type="button" onClick={() => insertSnippet(s)} style={chipStyle}>
                    ✨ {s}
                  </button>
                ))}
                <button type="button" onClick={() => exec('bold')}         style={{ ...chipStyle, fontWeight: 700 }}>B</button>
                <button type="button" onClick={() => exec('italic')}        style={{ ...chipStyle, fontStyle: 'italic' }}>I</button>
                <button type="button" onClick={() => exec('formatBlock','h3')}  style={chipStyle}>H</button>
                <button type="button" onClick={() => exec('insertUnorderedList')} style={chipStyle}>≡</button>
                <button type="button" onClick={() => exec('formatBlock','p')}    style={chipStyle}>¶</button>
              </div>

              {/* Editor */}
              <div style={{ minHeight: 340, position: 'relative', border: '1px solid #e2e8f0',
                borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                {isEmpty && (
                  <div style={{ position: 'absolute', top: 14, left: 14,
                    color: 'var(--color-muted-foreground, #64748b)', fontSize: 14,
                    pointerEvents: 'none', userSelect: 'none', lineHeight: 1.7 }}>
                    Digite o prontuário…
                  </div>
                )}
                <div id="ehr-main-editor" ref={editorRef}
                  contentEditable suppressContentEditableWarning
                  onInput={handleInput}
                  style={{ padding: '14px 16px', fontSize: 14, lineHeight: 1.75,
                    color: 'var(--color-foreground, #0f172a)', minHeight: 340,
                    wordBreak: 'break-word', outline: 'none' }} />
                <button type="button"
                  onClick={() => exec('insertHTML',
                    '<p><em>— IA: reforçar educação em saúde e sinais de alarme.</em></p>')}
                  title="Assistente de IA"
                  style={{
                    position: 'absolute', bottom: 12, right: 12,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    borderRadius: 9999, border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                    padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#fff',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 2px 10px rgba(124,58,237,.35)',
                  }}>
                  🤖 IA
                </button>
              </div>
            </div>
          )}

          {/* ── Tab: Prontuário (histórico) ── */}
          {activeTab === 'Prontuário' && (
            <div style={{ ...panelStyle, padding: '16px' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700,
                color: 'var(--color-foreground, #0f172a)' }}>
                Histórico de consultas
              </h2>
              {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13,
                  color: 'var(--color-muted-foreground, #64748b)' }}>
                  Nenhum registro encontrado.
                </div>
              ) : records.map((r, i) => (
                <div key={r.id ?? i} style={{ padding: '10px 12px', marginBottom: 8,
                  background: 'var(--color-muted, #f1f5f9)', borderRadius: 8,
                  fontSize: 13, lineHeight: 1.6 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-muted-foreground, #64748b)',
                    marginBottom: 5 }}>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString('pt-BR',
                          { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                    {r.duration_seconds && r.duration_seconds > 0
                      ? ` · ${Math.floor(r.duration_seconds / 60)} min` : ''}
                  </div>
                  <div style={{ color: 'var(--color-foreground, #0f172a)' }}
                    dangerouslySetInnerHTML={{ __html: typeof window !== 'undefined' ? DOMPurify.sanitize(r.evolution ?? r.complaint ?? '—') : (r.evolution ?? r.complaint ?? '—') }} />
                </div>
              ))}
            </div>
          )}

          {/* ── Tabs: placeholder ── */}
          {(activeTab === 'Relacionamento' || activeTab === 'Arquivos') && (
            <div style={{ ...panelStyle, padding: '48px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--color-muted-foreground, #64748b)' }}>
                Em breve
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ══ RIGHT SIDEBAR ══ */}
      <aside style={{ borderLeft: '1px solid var(--color-border, #e2e8f0)',
        background: 'var(--color-muted, #f1f5f9)',
        overflowY: 'auto', padding: '14px', display: 'flex',
        flexDirection: 'column', gap: 12 }}>

        {/* Documents */}
        <div style={{ ...panelStyle, padding: '12px 14px' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Documentos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {docList.map(({ label, icon, action }) => (
              <button key={label} type="button" onClick={action}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '8px 10px',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  borderRadius: 7, background: 'var(--color-card, #fff)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-muted, #f1f5f9)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-card, #fff)'}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>{icon} {label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: 6, background: '#EFF6FF', color: '#1d4ed8',
                  fontSize: 15, flexShrink: 0 }}>＋</span>
              </button>
            ))}
          </div>
        </div>

        {/* Atestado rápido */}
        <div style={{ ...panelStyle, padding: '12px 14px' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>📄 Atestado Rápido</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <input type="number" min={1} value={atestDias}
              onChange={e => setAtestDias(e.target.value)}
              style={{ width: 52, height: 30, border: '1px solid #e2e8f0',
                borderRadius: 6, padding: '0 6px', fontSize: 13, fontFamily: 'inherit',
                outline: 'none', textAlign: 'center', background: '#fff' }} />
            <span style={{ fontSize: 12, color: '#64748b' }}>dia(s)</span>
          </div>
          <button onClick={printAtest} style={{
            ...btnPrimary, width: '100%', justifyContent: 'center',
            height: 34, fontSize: 13, borderRadius: 8,
          }}>
            Imprimir Atestado
          </button>
        </div>

        {/* Planilhas e gráficos */}
        <div style={{ ...panelStyle, padding: '12px 14px' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Planilhas e Gráficos</h2>
          {[['Gráficos', 'Histórico clínico'], ['Planilhas', 'Acompanhamento']].map(([label, hint]) => (
            <button key={label} type="button"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '8px 10px', marginBottom: 6,
                border: '1px solid var(--color-border, #e2e8f0)',
                borderRadius: 7, background: 'var(--color-card, #fff)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-muted, #f1f5f9)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-card, #fff)'}>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span>{label}</span>
                <span style={{ fontSize: 10, color: 'var(--color-muted-foreground, #64748b)' }}>{hint}</span>
              </span>
              <span className="ehr-mini-icon" style={{ fontSize: 14 }}>＋</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ══ BOTTOM ACTION BAR ══ — position:fixed isolado do grid */}
      <div style={{
        position: 'fixed', bottom: 0, left: 205, right: 355, zIndex: 700,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 20px',
        background: '#fff',
        borderTop: '1px solid #e2e8f0',
        boxShadow: '0 -2px 12px rgba(0,0,0,.06)',
      }}>
        <span style={{ flex: 1, fontSize: 11, display: 'flex', alignItems: 'center', gap: 5,
          color: autoSaved === 'saved' ? '#10B981' : '#94a3b8', transition: 'color .3s' }}>
          {autoSaved === 'saving' && '● Salvando…'}
          {autoSaved === 'saved'  && '✓ Autosalvo'}
        </span>
        <button type="button" onClick={() => {
          const html = editorRef.current?.innerHTML ?? '';
          if (html.trim() && html !== '<br>' && !window.confirm('Fechar sem salvar? O conteúdo atual será descartado.')) return;
          onClose();
        }} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, height: 36,
          padding: '0 16px', border: '1px solid #e2e8f0', borderRadius: 8,
          background: '#fff', fontSize: 13, fontWeight: 500, color: '#374151',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>✕ Cancelar</button>
        <button type="button" onClick={handleSave} disabled={saving} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, height: 36,
          padding: '0 16px', border: '1.5px solid #2563eb', borderRadius: 8,
          background: '#fff', fontSize: 13, fontWeight: 600, color: '#2563eb',
          cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? .6 : 1,
        }}>✓ Salvar e continuar</button>
        <button type="button" onClick={handleFinalize} disabled={saving} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, height: 36,
          padding: '0 20px', border: 'none', borderRadius: 8,
          background: 'linear-gradient(135deg, #0055C8 0%, #0077F5 100%)',
          fontSize: 13, fontWeight: 700, color: '#fff',
          cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? .6 : 1,
          boxShadow: '0 2px 10px rgba(0,102,208,.28)',
        }}>{isApptMode ? 'Finalizar atendimento' : 'Salvar e fechar'}</button>
      </div>

      {/* Prescription modal */}
      {showPresc && patientData && (
        <NovaPrescricaoModal
          patient={patientData}
          onClose={() => setShowPresc(false)}
          onSaved={() => setShowPresc(false)}
        />
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
  const [showAddTxn, setShowAddTxn]     = useState(false);
  const [txnType, setTxnType]           = useState<'receita'|'despesa'|'transferencia'>('receita');

  const loadTxns = (p: string) => {
    const now = new Date();
    let start = '';
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

  // Chart: daily aggregation grouped by date
  const chartMap: Record<string, { receita: number; despesa: number }> = {};
  transactions.forEach(t => {
    if (!chartMap[t.date]) chartMap[t.date] = { receita: 0, despesa: 0 };
    if (t.type === 'receita') chartMap[t.date].receita += Number(t.amount);
    if (t.type === 'despesa') chartMap[t.date].despesa += Number(t.amount);
  });
  const chartData = Object.entries(chartMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      label: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      receita: v.receita,
      despesa: v.despesa,
    }));

  // Faturamento da semana
  const weekStart = weekRange().start;
  const weekRec = transactions
    .filter(t => t.type === 'receita' && t.date >= weekStart)
    .reduce((s, t) => s + Number(t.amount), 0);

  const periodLabel = period === 'semana' ? 'esta semana' : period === 'mes' ? 'este mês' : 'este ano';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Finanças</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Resumo {periodLabel}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ height: 32, border: '1px solid #E5E7EB', borderRadius: 7, padding: '0 10px', fontSize: 12, color: '#374151', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mês</option>
            <option value="ano">Este ano</option>
          </select>
          <button onClick={() => { setTxnType('receita'); setShowAddTxn(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon name="plus" size={12} color="#fff" /> Receita
          </button>
          <button onClick={() => { setTxnType('despesa'); setShowAddTxn(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon name="plus" size={12} color="#fff" /> Despesa
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Receitas', value: receitas, color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
              { label: 'Despesas', value: despesas, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
              { label: 'Saldo', value: saldo, color: saldo >= 0 ? '#0066D0' : '#EF4444', bg: saldo >= 0 ? '#EFF6FF' : '#FEF2F2', border: saldo >= 0 ? '#BFDBFE' : '#FECACA' },
              { label: 'Faturamento semana', value: weekRec, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
            ].map((k, i) => (
              <div key={i} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500, marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{fmtCurrency(k.value)}</div>
              </div>
            ))}
          </div>

          {/* Recharts: Receitas vs Despesas */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Receitas vs Despesas</div>
            {chartData.length === 0 ? (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>
                Nenhum dado no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData} barGap={2} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} width={42} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}
                    formatter={(value, name) => [fmtCurrency(Number(value)), name === 'receita' ? 'Receita' : 'Despesa']}
                  />
                  <Bar dataKey="receita" fill="#10B981" radius={[3,3,0,0]} />
                  <Bar dataKey="despesa" fill="#EF4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Últimas transações */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Últimas transações</span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{transactions.length} registros</span>
            </div>
            {transactions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Nenhuma transação no período</div>
            ) : transactions.slice(0, 12).map((t, i) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: i < Math.min(transactions.length, 12) - 1 ? '1px solid #F9FAFB' : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: t.type === 'receita' ? '#D1FAE5' : t.type === 'despesa' ? '#FEE2E2' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="dollar" size={13} color={t.type === 'receita' ? '#065F46' : t.type === 'despesa' ? '#991B1B' : '#6B7280'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description ?? t.category ?? t.type}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')} · {t.payment_method ?? '—'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.type === 'receita' ? '#10B981' : t.type === 'despesa' ? '#EF4444' : '#6B7280' }}>
                    {t.type === 'receita' ? '+' : t.type === 'despesa' ? '-' : ''}{fmtCurrency(Number(t.amount))}
                  </div>
                  <Badge variant={
                    t.status === 'concluido' || t.status === 'finalizado' ? 'green' :
                    t.status === 'pendente' ? 'yellow' :
                    t.status === 'cancelado' ? 'gray' : 'blue'
                  }>
                    {t.status === 'concluido' || t.status === 'finalizado' ? 'Concluído' :
                     t.status === 'pendente'  ? 'Pendente' :
                     t.status === 'cancelado' ? 'Cancelado' : t.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
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
  const [checkedInv,   setCheckedInv]   = useState<Set<string>>(new Set());
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
                    {h === '' ? (
                      <input type="checkbox"
                        checked={filtered.length > 0 && filtered.every(p => checkedInv.has(p.id))}
                        onChange={e => {
                          if (e.target.checked) setCheckedInv(new Set(filtered.map(p => p.id)));
                          else setCheckedInv(new Set());
                        }}
                      />
                    ) : h}
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
                        <td style={{ padding: '10px 12px' }}>
                          <input type="checkbox"
                            checked={checkedInv.has(p.id)}
                            onChange={e => setCheckedInv(prev => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(p.id); else next.delete(p.id);
                              return next;
                            })}
                          />
                        </td>
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
interface ProcedureItem { type: string; qty: number; price: number; }

function AddAppointmentModal({ onClose, onSaved, initialPatient }: { onClose: () => void; onSaved?: () => void; initialPatient?: Patient }) {
  const [mode, setMode]           = useState<'agendar' | 'bloquear'>('agendar');
  const [procedures, setProcedures] = useState<ProcedureItem[]>([{ type: 'consulta', qty: 1, price: 100 }]);
  const [patientSearch, setPatientSearch] = useState(initialPatient?.name ?? '');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient ?? null);
  const [insurance, setInsurance] = useState(initialPatient?.insurance ?? '');
  const [date,      setDate]      = useState(todayISO());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime,   setEndTime]   = useState('08:15');
  const [recurrence, setRecurrence] = useState('nao');
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

  const ctxDoctor = React.useContext(DoctorContext);

  const handleSave = async () => {
    if (mode === 'agendar' && !selectedPatient) return;
    if (!startTime || !endTime) {
      setSaveError('Informe o horário de início e fim.');
      return;
    }
    setSaving(true);
    setSaveError('');

    // Usa o médico logado via contexto; fallback: busca o primeiro ativo
    let doctorId: string | undefined = ctxDoctor.id || undefined;
    if (!doctorId) {
      const { data: docs } = await supabase
        .from('doctors').select('id').eq('active', true).limit(1);
      doctorId = docs?.[0]?.id;
    }
    if (!doctorId) {
      setSaveError('Nenhum médico encontrado. Configure um profissional antes de agendar.');
      setSaving(false);
      return;
    }

    if (mode === 'agendar' && selectedPatient) {
      const totalAmount = procedures.reduce((s, p) => s + (p.price * p.qty), 0);
      const encodedNotes = [
        notes || '',
        totalAmount > 0 ? `__val:${totalAmount}__` : '',
      ].filter(Boolean).join('\n') || null;
      const { error } = await supabase.from('appointments').insert({
        patient_id: selectedPatient.id,
        doctor_id:  doctorId,
        date,
        start_time: startTime,
        end_time:   endTime,
        type:    procedures[0]?.type ?? 'consulta',
        status:  'agendado',
        insurance: insurance || null,
        notes:   encodedNotes,
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
    width: '100%', height: 32, border: '1px solid #D1D5DB', borderRadius: 6,
    padding: '0 9px', fontSize: 12, color: '#111827', fontFamily: 'inherit',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
  };
  const lbl: CSSProperties = { fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 3, display: 'block' };
  const canSave = mode === 'bloquear' || !!selectedPatient;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 480, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Adicionar agendamento</span>
          <button onClick={onClose} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', borderRadius: 6, fontFamily: 'inherit' }}>×</button>
        </div>

        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
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
            <span style={lbl}>Procedimentos</span>

            {procedures.map((p, i) => {
              const code = `#${String(214744 + i * 1337).slice(0, 6)}`;
              const lineTotal = p.price * p.qty;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
                  background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px' }}>

                  {/* Código */}
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace',
                    minWidth: 54, flexShrink: 0 }}>{code}</span>

                  {/* Tipo */}
                  <select value={p.type}
                    onChange={e => { const n = [...procedures]; n[i] = { ...n[i], type: e.target.value }; setProcedures(n); }}
                    style={{ ...inp, flex: 1, height: 28, fontSize: 12, padding: '0 6px' }}>
                    {PROC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>

                  {/* Preço */}
                  <div style={{ position: 'relative', width: 90, flexShrink: 0 }}>
                    <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 11, color: '#6B7280', pointerEvents: 'none' }}>R$</span>
                    <input type="number" min={0} step={0.01} value={p.price}
                      onChange={e => { const n = [...procedures]; n[i] = { ...n[i], price: parseFloat(e.target.value) || 0 }; setProcedures(n); }}
                      style={{ ...inp, height: 28, fontSize: 12, paddingLeft: 26, paddingRight: 4,
                        textAlign: 'right', width: '100%' }} />
                  </div>

                  {/* Quantidade */}
                  <input type="number" value={p.qty} min={1}
                    onChange={e => { const n = [...procedures]; n[i] = { ...n[i], qty: Math.max(1, +e.target.value) }; setProcedures(n); }}
                    style={{ ...inp, width: 44, height: 28, fontSize: 12, textAlign: 'center', padding: '0 4px', flexShrink: 0 }} />

                  {/* Total linha */}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#111827',
                    minWidth: 72, textAlign: 'right', flexShrink: 0 }}>
                    {lineTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>

                  {/* Remover */}
                  <button
                    onClick={() => procedures.length > 1 && setProcedures(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: procedures.length > 1 ? 'pointer' : 'default',
                      color: procedures.length > 1 ? '#EF4444' : '#D1D5DB',
                      fontSize: 18, lineHeight: 1, padding: '0 2px', fontFamily: 'inherit', flexShrink: 0 }}>
                    ×
                  </button>
                </div>
              );
            })}

            <button onClick={() => setProcedures(prev => [...prev, { type: 'consulta', qty: 1, price: 100 }])}
              style={{ background: 'none', border: 'none', color: '#0066D0', fontSize: 12,
                fontWeight: 500, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
              + Adicionar procedimento
            </button>
          </div>

          {/* Valor total + aviso financeiro */}
          {(() => {
            const total = procedures.reduce((s, p) => s + p.price * p.qty, 0);
            return (
              <div style={{ background: '#F0FDF4', border: '1px solid #D1FAE5', borderRadius: 8,
                padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: '#059669', lineHeight: 1.4 }}>
                  Receita será lançada após finalização do atendimento.
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', flexShrink: 0 }}>
                  Valor total:{' '}
                  <span style={{ color: '#059669' }}>
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </span>
              </div>
            );
          })()}

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
              <Icon name="refresh" size={12} color="#0066D0" /> Avançar 15 min
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
            {recurrence !== 'nao' && (
              <div style={{ marginTop: 5, fontSize: 11, color: '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                ⚠️ Recorrência salva como referência — repetições futuras devem ser criadas manualmente.
              </div>
            )}
          </div>


          {/* Observações */}
          <div>
            <label style={lbl}>Observações <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              style={{ ...inp, height: 'auto', padding: '6px 9px', resize: 'vertical' as const }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '10px 16px', flexShrink: 0 }}>
          {saveError && (
            <div style={{ fontSize: 11, color: '#EF4444', marginBottom: 8, padding: '6px 10px', background: '#FEF2F2', borderRadius: 6, border: '1px solid #FECACA' }}>
              {saveError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={onClose} style={{ height: 32, padding: '0 16px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !canSave}
              style={{ height: 32, padding: '0 20px', background: canSave ? '#0066D0' : '#9CA3AF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {saving ? 'Salvando...' : 'Salvar'}
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

/* ─────────────────────────────────────────
   SECRETARY MANAGEMENT (Controle de Acesso)
───────────────────────────────────────── */
function SecretaryManagement() {
  type SecRow = { id: string; name: string; email: string; doctors: { id: string; name: string }[] };
  const [rows,    setRows]    = useState<SecRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: secs } = await supabase
      .from('doctors').select('id, name, email').eq('role', 'recepcionista').eq('active', true).order('name');
    if (!secs) { setLoading(false); return; }
    const ids = secs.map(s => s.id);
    const { data: links } = ids.length
      ? await supabase.from('secretary_doctors').select('secretary_id, doctors!doctor_id(id, name)').in('secretary_id', ids)
      : { data: [] };
    const map: Record<string, { id: string; name: string }[]> = {};
    (links ?? []).forEach((l: any) => {
      if (!map[l.secretary_id]) map[l.secretary_id] = [];
      if (l.doctors) map[l.secretary_id].push({ id: l.doctors.id, name: l.doctors.name });
    });
    setRows(secs.map(s => ({ ...s, doctors: map[s.id] ?? [] })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Controle de Acesso</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Gerencie recepcionistas e os médicos que cada uma pode visualizar</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ height: 34, padding: '0 16px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Adicionar Recepcionista
        </button>
      </div>

      {loading ? <Spinner /> : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>Nenhuma recepcionista cadastrada</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(r => (
            <div key={r.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{r.email}</div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#EFF6FF', color: '#0066D0', fontWeight: 600 }}>Recepcionista</span>
              </div>
              {r.doctors.length > 0 ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Acesso às agendas de:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {r.doctors.map(d => (
                      <span key={d.id} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: '#F3F4F6', color: '#374151', fontWeight: 500 }}>{d.name}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 12, color: '#F59E0B', fontStyle: 'italic' }}>⚠ Sem médico vinculado — sem acesso a nenhuma agenda</div>
              )}
            </div>
          ))}
        </div>
      )}
      {showAdd && <AddReceptionistModal onClose={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

/* ─────────────────────────────────────────
   COMMISSION MANAGER
───────────────────────────────────────── */
function CommissionManager() {
  type RecDoc = { id: string; name: string; email: string; commission_pct: number };
  const [recs,    setRecs]    = useState<RecDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [pctDraft,setPctDraft]= useState('');
  const [saving,  setSaving]  = useState(false);
  const [period,  setPeriod]  = useState<'mes' | 'trimestre' | 'ano'>('mes');
  const [summary, setSummary] = useState<{ rec_id: string; total: number; commission: number }[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('doctors').select('id, name, email, commission_config').eq('role', 'recepcionista').eq('active', true).order('name');
    setRecs((data ?? []).map((d: any) => ({
      id: d.id, name: d.name, email: d.email,
      commission_pct: d.commission_config?.value ?? 0,
    })));
    setLoading(false);
  };

  const loadSummary = async () => {
    const now = new Date();
    const fromDate = period === 'mes'
      ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      : period === 'trimestre'
      ? new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10)
      : new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const { data: txs } = await supabase
      .from('transactions').select('amount, doctor_id').eq('type', 'receita').gte('date', fromDate);
    const map: Record<string, number> = {};
    (txs ?? []).forEach((t: any) => { if (t.doctor_id) map[t.doctor_id] = (map[t.doctor_id] ?? 0) + Number(t.amount); });
    setSummary(recs.map(r => {
      const total = map[r.id] ?? 0;
      return { rec_id: r.id, total, commission: Math.round(total * r.commission_pct / 100 * 100) / 100 };
    }));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (recs.length) loadSummary(); }, [recs, period]);

  const savePct = async (id: string) => {
    setSaving(true);
    const pct = parseFloat(pctDraft) || 0;
    await supabase.from('doctors').update({ commission_config: { type: 'percentage', value: pct } }).eq('id', id);
    setSaving(false); setEditId(null);
    setRecs(prev => prev.map(r => r.id === id ? { ...r, commission_pct: pct } : r));
  };

  const PERIOD_LABELS = { mes: 'Este mês', trimestre: 'Trimestre', ano: 'Este ano' };

  return (
    <div style={{ padding: '20px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Comissões por Recepcionista</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>% sobre consultas agendadas pela recepcionista</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['mes','trimestre','ano'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              height: 30, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: period === p ? 700 : 500,
              background: period === p ? '#0066D0' : '#F3F4F6',
              color: period === p ? '#fff' : '#6B7280',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>{PERIOD_LABELS[p]}</button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : recs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>Nenhuma recepcionista cadastrada</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recs.map(r => {
            const s = summary.find(x => x.rec_id === r.id);
            const isEditing = editId === r.id;
            return (
              <div key={r.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#EFF6FF', color: '#0066D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {initials(r.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.email}</div>
                  </div>
                  {/* Comissão % */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {isEditing ? (
                      <>
                        <input value={pctDraft} onChange={e => setPctDraft(e.target.value)} type="number" min="0" max="100" step="0.5"
                          style={{ width: 64, height: 32, border: '1px solid #0066D0', borderRadius: 5, padding: '0 8px', fontSize: 13, fontFamily: 'inherit', outline: 'none', textAlign: 'right' }} />
                        <span style={{ fontSize: 13, color: '#374151' }}>%</span>
                        <button onClick={() => savePct(r.id)} disabled={saving}
                          style={{ height: 32, padding: '0 12px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {saving ? '...' : 'Salvar'}
                        </button>
                        <button onClick={() => setEditId(null)}
                          style={{ height: 32, padding: '0 10px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: r.commission_pct > 0 ? '#0066D0' : '#D1D5DB' }}>{r.commission_pct}%</div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>por consulta</div>
                        </div>
                        <button onClick={() => { setEditId(r.id); setPctDraft(String(r.commission_pct)); }}
                          style={{ height: 30, padding: '0 10px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                          ✏️ Editar
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* Resumo do período */}
                {s && s.total > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '8px 0', background: '#F9FAFB', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Receita no período</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>{fmtCurrency(s.total)}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '8px 0', background: '#F0FDF4', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>Comissão a pagar</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981' }}>{fmtCurrency(s.commission)}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   CLINICA SECTION
───────────────────────────────────────── */
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
    const { data: rec } = await supabase
      .from('doctors')
      .insert({ name: nomeR, email: emailR, role: 'recepcionista', gender: sexoR || null, clinic_active: clinAtiva, clinic_admin: adminClin })
      .select('id')
      .single();
    if (rec?.id) {
      const linked = profs.filter(p => p.ativo);
      if (linked.length > 0) {
        await supabase.from('secretary_doctors').insert(
          linked.map(p => ({ secretary_id: rec.id, doctor_id: p.id }))
        );
      }
    }
    setSaving(false);
    alert('Recepcionista cadastrada! Nota: o acesso ao sistema requer configuração manual da senha no painel Supabase (Authentication → Users).');
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
      phone: celularD || null,
      cpf: cpfD || null,
      gender: sexoD || null,
      clinic_active: clinAtiva,
      clinic_admin: adminClin,
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
function AddPatientModal({ onClose, onSaved, patient: editPatient }: { onClose: () => void; onSaved?: () => void; patient?: Patient }) {
  const isEdit = !!editPatient;
  type PatientTab = 'dados' | 'complementares' | 'convenios';
  const [activeTab, setActiveTab] = useState<PatientTab>('dados');
  const [avatarPt, setAvatarPt] = useState('');
  const handleEditFotoPt = () => { const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0]; if(!f)return; const r=new FileReader(); r.onload=(ev)=>setAvatarPt(ev.target?.result as string); r.readAsDataURL(f);}; i.click(); };

  const [nome,          setNome]          = useState(editPatient?.name ?? '');
  const [codigo,        setCodigo]        = useState('');
  const [dataNasc,      setDataNasc]      = useState(editPatient?.birth_date ?? '');
  const [sexo,          setSexo]          = useState<'M' | 'F' | ''>((editPatient?.gender as 'M'|'F'|'') ?? '');
  const [nomeCivil,     setNomeCivil]     = useState(false);
  const [generoOpc,     setGeneroOpc]     = useState(false);
  const [emailP,        setEmailP]        = useState(editPatient?.email ?? '');
  const [cpf,           setCpf]           = useState(editPatient?.cpf ?? '');
  const [rg,            setRg]            = useState('');
  const [obsP,          setObsP]          = useState(editPatient?.notes ?? '');
  const [comoConheceu,  setComoConheceu]  = useState('');
  const [celular,       setCelular]       = useState(editPatient?.phone ?? '');
  const [casa,          setCasa]          = useState('');
  const [endereco,      setEndereco]      = useState(editPatient?.address ?? '');
  const [numero,        setNumero]        = useState('');
  const [complemento,   setComplemento]   = useState('');
  const [bairro,        setBairro]        = useState('');
  const [cidade,        setCidade]        = useState(editPatient?.city ?? '');
  const [estado,        setEstado]        = useState(editPatient?.state ?? '');
  const [cep,           setCep]           = useState(editPatient?.zip_code ?? '');
  const [convenio,      setConvenio]      = useState(editPatient?.insurance ?? '');
  const [numPlano,      setNumPlano]      = useState(editPatient?.insurance_number ?? '');
  const [saving,        setSaving]        = useState(false);

  const handleSave = async () => {
    if (!nome) return;
    setSaving(true);
    const payload = {
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
    };
    if (isEdit && editPatient) {
      const { error } = await supabase.from('patients').update(payload).eq('id', editPatient.id);
      if (error) {
        console.error('Erro ao salvar:', error.message);
        alert('Erro ao salvar. Tente novamente.');
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from('patients').insert({ ...payload, active: true });
      if (error) {
        console.error('Erro ao salvar:', error.message);
        alert('Erro ao salvar. Tente novamente.');
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onSaved?.();
    onClose();
  };

  const inp: CSSProperties = {
    width: '100%', height: 36, border: '1px solid #D1D5DB', borderRadius: 4,
    padding: '0 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit',
    outline: 'none', background: '#fff', boxShadow: 'none', boxSizing: 'border-box',
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
          <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{isEdit ? 'Editar Paciente' : 'Adicionar Paciente'}</span>
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
            {saving ? 'Salvando...' : isEdit ? 'SALVAR ALTERAÇÕES' : 'SALVAR'}
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
  // Commission
  const [allDoctors,   setAllDoctors]   = useState<{ id: string; name: string; commission_config: any }[]>([]);
  const [selDoctorId,  setSelDoctorId]  = useState('');
  const [commPreview,  setCommPreview]  = useState<number | null>(null);

  useEffect(() => {
    supabase.from('patients').select('id,name,phone').eq('active', true).order('name').limit(100)
      .then(({ data }) => setAllPts((data as Patient[]) ?? []));
    supabase.from('doctors').select('id,name,commission_config').eq('active', true).order('name')
      .then(({ data }) => setAllDoctors((data ?? []) as any[]));
  }, []);

  // Live commission preview
  useEffect(() => {
    if (tipo !== 'receita' || !selDoctorId || !valor || parseFloat(valor) <= 0) {
      setCommPreview(null); return;
    }
    const doc = allDoctors.find(d => d.id === selDoctorId);
    const cfg = doc?.commission_config;
    if (!cfg) { setCommPreview(null); return; }
    const amt = parseFloat(valor.replace(',', '.'));
    if (cfg.type === 'percentage') setCommPreview(Math.round(amt * cfg.value / 100 * 100) / 100);
    else if (cfg.type === 'fixed') setCommPreview(cfg.value);
    else setCommPreview(null);
  }, [tipo, selDoctorId, valor, allDoctors]);

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
      doctor_id: selDoctorId || null,
      // commission_amount e commission_status são calculados pelo trigger do Postgres
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
          {/* Colaborador + Comissão (somente receita) */}
          {tipo === 'receita' && (
            <div>
              <label style={lbl}>Colaborador <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(para comissão)</span></label>
              <select value={selDoctorId} onChange={e => setSelDoctorId(e.target.value)} style={inp}>
                <option value="">Sem vinculação de comissão</option>
                {allDoctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}{d.commission_config
                      ? ` (${d.commission_config.type === 'percentage' ? `${d.commission_config.value}%` : `R$ ${d.commission_config.value}`})`
                      : ' (sem comissão)'}
                  </option>
                ))}
              </select>
              {commPreview !== null && (
                <div style={{ marginTop: 6, padding: '6px 10px', background: '#F0FDF4', borderRadius: 6,
                  border: '1px solid #BBF7D0', fontSize: 12, color: '#166534', fontWeight: 500 }}>
                  💰 Comissão calculada: <strong>R$ {commPreview.toFixed(2).replace('.', ',')}</strong>
                  &nbsp;·&nbsp;será registrada automaticamente
                </div>
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
  const doctor = React.useContext(DoctorContext);
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
    await supabase.from('waitlist').insert({ patient_id: selPt.id, doctor_id: doctor?.id || null, preferred_period: periodo, notes: notas || null, status: 'aguardando' });
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
  const doctor = React.useContext(DoctorContext);
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
    const doctorId = doctor?.id;
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
   NOVA PRESCRIÇÃO MODAL
─────────────────────────────────────────── */
function NovaPrescricaoModal({ patient, onClose, onSaved, initialItems }: {
  patient: Patient; onClose: () => void; onSaved?: () => void;
  initialItems?: { med: string; dose: string; freq: string; dur: string }[];
}) {
  const doctor = React.useContext(DoctorContext);
  const [items,  setItems]  = useState(initialItems && initialItems.length > 0 ? initialItems : [{ med: '', dose: '', freq: '', dur: '' }]);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const addItem    = () => setItems(p => [...p, { med: '', dose: '', freq: '', dur: '' }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const update     = (i: number, f: string, v: string) =>
    setItems(p => p.map((it, idx) => idx === i ? { ...it, [f]: v } : it));

  const handleSave = async () => {
    const valid = items.filter(it => it.med.trim());
    if (!valid.length) { setError('Adicione ao menos um medicamento.'); return; }
    setSaving(true); setError('');
    const doctorId = doctor?.id;
    for (const p of valid) {
      await supabase.from('prescriptions').insert({
        patient_id: patient.id, doctor_id: doctorId || null,
        medication: p.med, dosage: p.dose || null, frequency: p.freq || null, duration: p.dur || null,
      });
    }
    setSaving(false); onSaved?.(); onClose();
  };

  const inp: CSSProperties = { width: '100%', border: '1px solid #D1D5DB', borderRadius: 6, padding: '0 8px', height: 32, fontSize: 12, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 620, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', background: '#EFF6FF', borderRadius: '10px 10px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: '#1E40AF', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 800, fontStyle: 'italic' }}>Rx</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF' }}>Nova Prescrição</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>{patient.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Items */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8 }}>
            {['Medicamento *', 'Dose', 'Frequência', 'Duração', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{h}</div>
            ))}
          </div>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
              <input value={it.med}  onChange={e => update(i, 'med',  e.target.value)} placeholder="Ex: Amoxicilina" style={inp} autoFocus={i === 0} />
              <input value={it.dose} onChange={e => update(i, 'dose', e.target.value)} placeholder="500mg"           style={inp} />
              <input value={it.freq} onChange={e => update(i, 'freq', e.target.value)} placeholder="8/8h"            style={inp} />
              <input value={it.dur}  onChange={e => update(i, 'dur',  e.target.value)} placeholder="7 dias"          style={inp} />
              <button onClick={() => removeItem(i)} disabled={items.length === 1} style={{
                width: 28, height: 28, background: 'none', border: '1px solid #E5E7EB', borderRadius: 4,
                cursor: items.length > 1 ? 'pointer' : 'default', color: '#EF4444', fontSize: 16,
                opacity: items.length === 1 ? 0.3 : 1,
              }}>×</button>
            </div>
          ))}
          <button onClick={addItem} style={{
            alignSelf: 'flex-start', height: 30, padding: '0 12px', border: '1px dashed #0066D0',
            borderRadius: 6, background: 'none', color: '#0066D0', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}>+ Adicionar item</button>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '12px 20px' }}>
          {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={onClose} style={{ height: 36, padding: '0 20px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{ height: 36, padding: '0 24px', background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Salvando...' : 'Salvar Prescrição'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   EDIT CONSULTA MODAL
─────────────────────────────────────────── */
function EditConsultaModal({ patient, record, onClose, onSaved }: {
  patient: Patient; record: MedicalRecord; onClose: () => void; onSaved?: () => void;
}) {
  const doctor = React.useContext(DoctorContext);
  const [queixa,       setQueixa]       = useState(record.complaint      ?? '');
  const [evolucao,     setEvolucao]     = useState(record.evolution      ?? '');
  const [diagnostico,  setDiag]         = useState(record.diagnosis      ?? '');
  const [cid,          setCid]          = useState(record.diagnosis_code ?? '');
  const [conduta,      setConduta]      = useState(record.conduct        ?? '');
  const [retorno,      setRetorno]      = useState(record.return_date    ?? '');
  const [retornoNotes, setRetornoNotes] = useState(record.return_notes   ?? '');
  const [prescricoes,  setPrescricoes]  = useState<{id?:string;med:string;dose:string;freq:string;dur:string}[]>([]);
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState('');

  useEffect(() => {
    supabase.from('prescriptions').select('*').eq('medical_record_id', record.id).order('created_at')
      .then(({ data }) => {
        setPrescricoes((data ?? []).map((p: any) => ({
          id: p.id, med: p.medication ?? '', dose: p.dosage ?? '', freq: p.frequency ?? '', dur: p.duration ?? '',
        })));
      });
  }, [record.id]);

  const addPresc    = () => setPrescricoes(p => [...p, { med:'', dose:'', freq:'', dur:'' }]);
  const updatePresc = (i: number, field: string, val: string) =>
    setPrescricoes(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleSave = async () => {
    setSaving(true); setSaveError('');
    const { error } = await supabase.from('medical_records').update({
      complaint: queixa || null, evolution: evolucao || null,
      diagnosis: diagnostico || null, diagnosis_code: cid || null,
      conduct: conduta || null, return_date: retorno || null, return_notes: retornoNotes || null,
    }).eq('id', record.id);
    if (error) { setSaveError('Erro: ' + error.message); setSaving(false); return; }
    await supabase.from('prescriptions').delete().eq('medical_record_id', record.id);
    const doctorId = doctor?.id;
    for (const p of prescricoes.filter(p => p.med.trim())) {
      await supabase.from('prescriptions').insert({
        patient_id: patient.id, medical_record_id: record.id, doctor_id: doctorId || null,
        medication: p.med, dosage: p.dose || null, frequency: p.freq || null, duration: p.dur || null,
      });
    }
    setSaving(false); onSaved?.(); onClose();
  };

  const inp: CSSProperties = { width: '100%', border: '1px solid #D1D5DB', borderRadius: 6, padding: '8px 10px', fontSize: 13, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const lbl: CSSProperties = { fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' };
  const dateStr = new Date(record.created_at).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 30, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 10, width: 680, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', background: '#FFF7ED', borderRadius: '10px 10px 0 0' }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#EA580C' }}>Editar Consulta — {patient.name}</span>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{dateStr}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', borderRadius: 6 }}>×</button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '72vh', overflowY: 'auto' }}>
          <div>
            <label style={lbl}>Queixa principal</label>
            <textarea value={queixa} onChange={e => setQueixa(e.target.value)} rows={3} style={inp} placeholder="Queixa principal do paciente..." />
          </div>
          <div>
            <label style={lbl}>Evolução / Exame físico</label>
            <textarea value={evolucao} onChange={e => setEvolucao(e.target.value)} rows={3} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
            <div>
              <label style={lbl}>Diagnóstico / Hipótese</label>
              <input value={diagnostico} onChange={e => setDiag(e.target.value)} style={{ ...inp, padding: '0 10px', height: 36 }} />
            </div>
            <div>
              <label style={lbl}>CID-10</label>
              <input value={cid} onChange={e => setCid(e.target.value)} placeholder="Ex: K29" style={{ ...inp, padding: '0 10px', height: 36 }} />
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

          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Prescrições</span>
              <button onClick={addPresc} style={{ height: 28, padding: '0 12px', background: '#0066D0', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>+ Adicionar</button>
            </div>
            {prescricoes.length === 0
              ? <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '8px 0' }}>Nenhuma prescrição</div>
              : prescricoes.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'start' }}>
                  <div><input value={p.med}  onChange={e => updatePresc(i,'med', e.target.value)} placeholder="Medicamento *" style={{ ...inp, padding: '0 8px', height: 32, fontSize: 12 }} /></div>
                  <div><input value={p.dose} onChange={e => updatePresc(i,'dose',e.target.value)} placeholder="Dose"          style={{ ...inp, padding: '0 8px', height: 32, fontSize: 12 }} /></div>
                  <div><input value={p.freq} onChange={e => updatePresc(i,'freq',e.target.value)} placeholder="Frequência"    style={{ ...inp, padding: '0 8px', height: 32, fontSize: 12 }} /></div>
                  <div><input value={p.dur}  onChange={e => updatePresc(i,'dur', e.target.value)} placeholder="Duração"       style={{ ...inp, padding: '0 8px', height: 32, fontSize: 12 }} /></div>
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
            <button onClick={handleSave} disabled={saving} style={{ height: 36, padding: '0 24px', background: '#EA580C', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
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
  const ctx = React.useContext(DoctorContext);
  type CTab = 'perfil' | 'clinica' | 'horarios' | 'notificacoes' | 'acesso' | 'comissoes';
  const [activeTab,    setActiveTab]   = useState<CTab>('perfil');
  const [doctorId,     setDoctorId]    = useState('');
  const [nome,         setNome]        = useState(ctx.name);
  const [email,        setEmail]       = useState(ctx.email);
  const [crm,          setCrm]         = useState(ctx.crm);
  const [especialidade,setEsp]         = useState(ctx.specialty);
  const [celular,      setCelular]     = useState(ctx.phone ?? '');
  const [saving,       setSaving]      = useState(false);
  const [saved,        setSaved]       = useState(false);
  const [avatarUrl,    setAvatarUrl]   = useState('');

  // Carrega dados reais do médico ao montar
  useEffect(() => {
    supabase.from('doctors').select('*').eq('active', true).order('created_at').limit(1).single()
      .then(({ data }) => {
        if (!data) return;
        setDoctorId(data.id);
        setNome(data.name);
        setEmail(data.email);
        setCrm(data.crm ?? '');
        setEsp(data.specialty ?? '');
        setCelular(data.phone ?? '');
      });
  }, []);

  // Clínica
  const [clinNome,    setClinicNome]   = useState(() => localStorage.getItem('clin_nome')    ?? `Clínica ${ctx.name}`);
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
    if (doctorId) {
      await supabase.from('doctors').update({ name: nome, email, crm, specialty: especialidade, phone: celular }).eq('id', doctorId);
    } else {
      // Fallback: atualiza pelo email original
      await supabase.from('doctors').update({ name: nome, email, crm, specialty: especialidade, phone: celular }).eq('active', true);
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2200);
  };

  const inp: CSSProperties = { width:'100%', height:36, border:'1px solid #D1D5DB', borderRadius:6, padding:'0 10px', fontSize:13, color:'#111827', fontFamily:'inherit', outline:'none', background:'#fff', boxSizing:'border-box' };
  const lbl: CSSProperties = { fontSize:12, fontWeight:500, color:'#374151', marginBottom:4, display:'block' };
  const CTABS: {id:CTab;label:string}[] = [
    {id:'perfil',label:'Meu Perfil'},{id:'clinica',label:'Clínica'},
    {id:'horarios',label:'Horários de Atendimento'},{id:'notificacoes',label:'Notificações'},
    {id:'acesso',    label:'Controle de Acesso'},
    {id:'comissoes', label:'Comissões'},
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

        {activeTab === 'acesso' && (
          <div>
            <SecretaryManagement />
          </div>
        )}

        {activeTab === 'comissoes' && (
          <div style={{ margin: '-24px -28px' }}>
            <CommissionManager />
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
  const [screen,    setScreen]    = useState<NavId>('agenda');
  const [tabs,      setTabs]      = useState<Tab[]>([
    { id: 'agenda', label: 'Agenda', icon: 'calendar', closeable: false },
  ]);
  const [activeTab, setActiveTab] = useState<NavId>('agenda');
  const [agendaBadge, setAgendaBadge] = useState(0);
  const [notifCount,  setNotifCount]  = useState(0);
  const [showAddAppointment,  setShowAddAppointment]  = useState(false);
  const [showAddPatient,      setShowAddPatient]      = useState(false);
  const [showAddProfessional, setShowAddProfessional] = useState(false);
  const [showAddReceptionist, setShowAddReceptionist] = useState(false);
  const [agendaKey,           setAgendaKey]           = useState(0);
  const [prontuarioPatientId, setProntuarioPatientId] = useState<string | undefined>();
  const [doctor, setDoctor] = useState<DoctorInfo>({
    id: '', name: 'guilherme teixeira', email: 'gt@medflow.com',
    specialty: 'Clínica Geral', crm: 'CRM-12345',
  });

  useEffect(() => {
    // Carrega dados do médico logado (tenta usuário autenticado primeiro)
    supabase.auth.getUser().then(({ data: { user } }) => {
      const email = user?.email;
      const q = email
        ? supabase.from('doctors').select('*').eq('email', email).eq('active', true).limit(1).single()
        : supabase.from('doctors').select('*').eq('active', true).order('created_at').limit(1).single();
      q.then(({ data }) => {
        if (data) setDoctor({
          id: data.id, name: data.name, email: data.email,
          specialty: data.specialty ?? 'Clínica Geral',
          crm: data.crm ?? '', phone: data.phone ?? '',
        });
      });
    });

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
    dashboard:    <Dashboard onNavigateProntuario={handleNavigateProntuario} onNewAppointment={() => setShowAddAppointment(true)} onNewPatient={() => setShowAddPatient(true)} onNavigate={(s) => handleNavigate(s as any)} />,
    agenda:       <Agenda key={agendaKey} />,
    prontuario:   <Prontuario key={prontuarioPatientId} initialPatientId={prontuarioPatientId} />,
    pacientes:    <Pacientes onNavigateProntuario={handleNavigateProntuario} />,
    financas:     <Financas />,
    estoque:      <Estoque />,
    relatorios:   <Relatorios />,
    configuracoes: <Configuracoes />,
  };

  return (
    <DoctorContext.Provider value={doctor}>
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
            {screenMap[screen] ?? <Agenda />}
          </div>
        </div>
        {showAddAppointment  && <AddAppointmentModal  onClose={() => setShowAddAppointment(false)} onSaved={() => setAgendaKey(k => k + 1)} />}
        {showAddPatient      && <AddPatientModal      onClose={() => setShowAddPatient(false)} />}
        {showAddProfessional && <AddProfessionalModal onClose={() => setShowAddProfessional(false)} />}
        {showAddReceptionist && <AddReceptionistModal onClose={() => setShowAddReceptionist(false)} />}
      </div>
    </DoctorContext.Provider>
  );
}
