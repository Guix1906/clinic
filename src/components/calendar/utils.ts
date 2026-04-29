/** Total minutes from 'HH:MM' */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** 'HH:MM' from total minutes */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Add/subtract minutes to a 'HH:MM' string */
export function shiftTime(time: string, deltaMins: number): string {
  return minutesToTime(timeToMinutes(time) + deltaMins);
}

/** Add/subtract days to a 'YYYY-MM-DD' string */
export function shiftDate(date: string, deltaDays: number): string {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().split('T')[0];
}

/** List of 'YYYY-MM-DD' for the week containing `date` (Mon–Sun) */
export function weekDays(date: string): string[] {
  const d = new Date(date + 'T12:00:00');
  const day = d.getDay(); // 0=Sun
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7)); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    return x.toISOString().split('T')[0];
  });
}

/** Format 'YYYY-MM-DD' → 'Seg 05/05' */
export function fmtDayHeader(date: string): { weekday: string; short: string } {
  const d = new Date(date + 'T12:00:00');
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return {
    weekday: weekdays[d.getDay()],
    short: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  };
}

/** Today as 'YYYY-MM-DD' */
export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Appointment type display info */
export const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  consulta:         { label: 'Consulta',      color: '#1D4ED8', bg: '#DBEAFE' },
  retorno:          { label: 'Retorno',        color: '#065F46', bg: '#D1FAE5' },
  primeira_consulta:{ label: '1ª Consulta',   color: '#6D28D9', bg: '#EDE9FE' },
  avaliacao:        { label: 'Avaliação',      color: '#92400E', bg: '#FEF3C7' },
  exame:            { label: 'Exame',          color: '#0F766E', bg: '#CCFBF1' },
  procedimento:     { label: 'Procedimento',   color: '#9D174D', bg: '#FCE7F3' },
  teleconsulta:     { label: 'Teleconsulta',   color: '#1E40AF', bg: '#BFDBFE' },
};

export const STATUS_META: Record<string, { label: string; dot: string }> = {
  agendado:       { label: 'Agendado',        dot: '#94A3B8' },
  confirmado:     { label: 'Confirmado',      dot: '#3B82F6' },
  aguardando:     { label: 'Aguardando',      dot: '#F59E0B' },
  em_atendimento: { label: 'Em atendimento',  dot: '#8B5CF6' },
  concluido:      { label: 'Concluído',       dot: '#10B981' },
  faltou:         { label: 'Faltou',          dot: '#EF4444' },
  cancelado:      { label: 'Cancelado',       dot: '#6B7280' },
};
