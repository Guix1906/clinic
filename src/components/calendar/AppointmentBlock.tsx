'use client';
import React, { useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CalendarAppointment, } from './types';
import { timeToMinutes, minutesToTime, TYPE_META, STATUS_META } from './utils';

const SLOT_HEIGHT = 48; // px per 30-min slot
const MIN_DURATION = 15; // minutes

interface Props {
  appt: CalendarAppointment;
  topPx: number;
  heightPx: number;
  columnWidth: number;
  onResize: (id: string, newEndTime: string) => void;
  onClick?: (appt: CalendarAppointment) => void;
}

export default function AppointmentBlock({
  appt, topPx, heightPx, columnWidth, onResize, onClick,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appt.id,
    data: { appt },
  });

  const resizing = useRef(false);
  const resizeStartY = useRef(0);
  const resizeStartEnd = useRef(timeToMinutes(appt.end_time));
  const [resizeEnd, setResizeEnd] = useState(appt.end_time);

  const meta   = TYPE_META[appt.type]   ?? { label: appt.type,   color: '#374151', bg: '#F3F4F6' };
  const status = STATUS_META[appt.status] ?? { label: appt.status, dot: '#9CA3AF' };

  const style: React.CSSProperties = {
    position: 'absolute',
    top: topPx,
    left: 2,
    width: columnWidth - 4,
    height: heightPx,
    background: meta.bg,
    border: `1.5px solid ${meta.color}33`,
    borderLeft: `3px solid ${meta.color}`,
    borderRadius: 6,
    padding: '3px 6px',
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.45 : 1,
    boxShadow: isDragging ? `0 8px 24px ${meta.color}44` : '0 1px 3px rgba(0,0,0,.08)',
    overflow: 'hidden',
    zIndex: isDragging ? 999 : 10,
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : 'box-shadow .15s',
    userSelect: 'none',
  };

  /* ── Resize handle mouse events ── */
  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizing.current = true;
    resizeStartY.current = e.clientY;
    resizeStartEnd.current = timeToMinutes(appt.end_time);

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const deltaMin = Math.round((ev.clientY - resizeStartY.current) / (SLOT_HEIGHT / 30)) * 15;
      const newEnd = Math.max(
        resizeStartEnd.current + MIN_DURATION,
        resizeStartEnd.current + deltaMin,
      );
      setResizeEnd(minutesToTime(Math.min(newEnd, 23 * 60 + 45)));
    };

    const onUp = (ev: MouseEvent) => {
      resizing.current = false;
      const deltaMin = Math.round((ev.clientY - resizeStartY.current) / (SLOT_HEIGHT / 30)) * 15;
      const newEnd = Math.max(
        resizeStartEnd.current + MIN_DURATION,
        resizeStartEnd.current + deltaMin,
      );
      onResize(appt.id, minutesToTime(Math.min(newEnd, 23 * 60 + 45)));
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const displayEnd = resizing.current ? resizeEnd : appt.end_time;
  const dur = timeToMinutes(displayEnd) - timeToMinutes(appt.start_time);
  const compact = heightPx < 40;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      onClick={() => !isDragging && onClick?.(appt)}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: status.dot, flexShrink: 0,
        }} />
        <span style={{
          fontSize: compact ? 10 : 11, fontWeight: 700, color: meta.color,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1,
        }}>
          {appt.patient_name}
        </span>
      </div>

      {!compact && (
        <>
          <div style={{ fontSize: 10, color: meta.color + 'CC', marginTop: 1 }}>
            {appt.start_time}–{displayEnd}
            {dur >= 60 ? ` · ${Math.floor(dur/60)}h${dur%60?dur%60+'min':''}` : ` · ${dur}min`}
          </div>
          <div style={{
            fontSize: 10, color: '#6B7280', marginTop: 2,
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>
            {meta.label}
            {appt.insurance ? ` · ${appt.insurance}` : ''}
          </div>
        </>
      )}

      {/* Resize handle */}
      <div
        onMouseDown={onResizeMouseDown}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 8,
          cursor: 'ns-resize', background: `${meta.color}22`,
          borderRadius: '0 0 5px 5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 20, height: 2, borderRadius: 1, background: meta.color + '66' }} />
      </div>
    </div>
  );
}
