'use client';
import React, { useRef } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { CalendarAppointment, ViewMode } from './types';
import DayColumn, { START_HOUR, END_HOUR, TOTAL_SLOTS, SLOT_HEIGHT } from './DayColumn';
import AppointmentBlock from './AppointmentBlock';
import { timeToMinutes, minutesToTime, shiftTime, weekDays, fmtDayHeader, todayStr } from './utils';

const TIME_LABEL_WIDTH = 52;

interface Props {
  appointments: CalendarAppointment[];
  view: ViewMode;
  referenceDate: string;   // 'YYYY-MM-DD' — any day in the target week/day
  onUpdate: (updated: CalendarAppointment) => void;
  onSlotClick?: (date: string, time: string) => void;
  onAppointmentClick?: (appt: CalendarAppointment) => void;
}

export default function CalendarGrid({
  appointments, view, referenceDate, onUpdate, onSlotClick, onAppointmentClick,
}: Props) {
  const today    = todayStr();
  const days     = view === 'week' ? weekDays(referenceDate) : [referenceDate];
  const colRef   = useRef<HTMLDivElement>(null);

  /* ── Sensors ── */
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  /* ── Active drag tracking ── */
  const [activeAppt, setActiveAppt] = React.useState<CalendarAppointment | null>(null);

  const handleDragStart = (e: DragStartEvent) => {
    const appt = appointments.find(a => a.id === e.active.id);
    setActiveAppt(appt ?? null);
  };

  /* ── Drop handler ── */
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveAppt(null);
    const { active, over, delta } = e;
    if (!over || !active.data.current) return;

    const appt: CalendarAppointment = active.data.current.appt;
    const targetDate: string = over.id as string;

    // Vertical delta → snap to 15-min grid
    const deltaMin = Math.round(delta.y / (SLOT_HEIGHT / 30)) * 15;
    const newStart = shiftTime(appt.start_time, deltaMin);
    const dur      = timeToMinutes(appt.end_time) - timeToMinutes(appt.start_time);
    const newEnd   = minutesToTime(timeToMinutes(newStart) + dur);

    // Guard bounds
    const startMin = timeToMinutes(newStart);
    const endMin   = timeToMinutes(newEnd);
    if (startMin < START_HOUR * 60 || endMin > END_HOUR * 60) return;

    onUpdate({ ...appt, date: targetDate, start_time: newStart, end_time: newEnd });
  };

  /* ── Resize handler ── */
  const handleResize = (id: string, newEndTime: string) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;
    onUpdate({ ...appt, end_time: newEndTime });
  };

  /* ── Column width ── */
  const totalWidth = colRef.current?.offsetWidth ?? 800;
  const colW = Math.floor((totalWidth - TIME_LABEL_WIDTH) / days.length);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div ref={colRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* ── Day headers ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#fff', flexShrink: 0 }}>
          {/* Time gutter spacer */}
          <div style={{ width: TIME_LABEL_WIDTH, flexShrink: 0 }} />
          {days.map(d => {
            const { weekday, short } = fmtDayHeader(d);
            const isToday = d === today;
            return (
              <div key={d} style={{
                width: colW, flexShrink: 0, textAlign: 'center', padding: '8px 0',
                borderLeft: '1px solid #F3F4F6',
              }}>
                <div style={{ fontSize: 11, color: isToday ? '#0066D0' : '#9CA3AF', fontWeight: 600 }}>
                  {weekday}
                </div>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: isToday ? '#0066D0' : 'transparent',
                  color: isToday ? '#fff' : '#111827',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '2px auto 0',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {short.split('/')[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Scrollable grid ── */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          <div style={{ display: 'flex', position: 'relative' }}>

            {/* Time labels */}
            <div style={{ width: TIME_LABEL_WIDTH, flexShrink: 0 }}>
              {Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => {
                const mins = START_HOUR * 60 + i * 30;
                const hh   = String(Math.floor(mins / 60)).padStart(2, '0');
                const mm   = String(mins % 60).padStart(2, '0');
                const show = mm === '00';
                return (
                  <div key={i} style={{ height: SLOT_HEIGHT, position: 'relative' }}>
                    {show && (
                      <span style={{
                        position: 'absolute', top: -7, right: 8,
                        fontSize: 10, color: '#9CA3AF', fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}>
                        {hh}:00
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            {days.map(d => (
              <DayColumn
                key={d}
                date={d}
                appointments={appointments.filter(a => a.date === d)}
                columnWidth={colW}
                onResize={handleResize}
                onSlotClick={onSlotClick ?? (() => {})}
                onClick={onAppointmentClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Drag overlay — ghost clone */}
      <DragOverlay dropAnimation={null}>
        {activeAppt && (
          <div style={{
            background: '#DBEAFE',
            border: '2px dashed #3B82F6',
            borderRadius: 6,
            padding: '4px 8px',
            width: colW - 4,
            minHeight: 36,
            opacity: 0.85,
            boxShadow: '0 8px 24px rgba(59,130,246,.3)',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8' }}>
              {activeAppt.patient_name}
            </div>
            <div style={{ fontSize: 10, color: '#3B82F6' }}>
              {activeAppt.start_time}–{activeAppt.end_time}
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
