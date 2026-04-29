'use client';
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CalendarAppointment } from './types';
import AppointmentBlock from './AppointmentBlock';
import { timeToMinutes } from './utils';

const SLOT_HEIGHT = 48;   // px per 30-min slot
const START_HOUR  = 7;    // calendar starts at 07:00
const END_HOUR    = 21;   // calendar ends at 21:00
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2; // 30-min slots

interface Props {
  date: string;
  appointments: CalendarAppointment[];
  columnWidth: number;
  onResize: (id: string, newEndTime: string) => void;
  onSlotClick: (date: string, time: string) => void;
  onClick?: (appt: CalendarAppointment) => void;
}

export default function DayColumn({
  date, appointments, columnWidth, onResize, onSlotClick, onClick,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: date });

  const timeToTop = (t: string) =>
    (timeToMinutes(t) - START_HOUR * 60) / 30 * SLOT_HEIGHT;

  const durationToPx = (start: string, end: string) => {
    const dur = Math.max(15, timeToMinutes(end) - timeToMinutes(start));
    return dur / 30 * SLOT_HEIGHT;
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative',
        width: columnWidth,
        height: TOTAL_SLOTS * SLOT_HEIGHT,
        background: isOver ? '#EFF6FF' : 'transparent',
        transition: 'background .15s',
        borderRight: '1px solid #F3F4F6',
      }}
    >
      {/* 30-min slot lines + click zones */}
      {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
        const mins  = (START_HOUR * 60) + i * 30;
        const hh    = String(Math.floor(mins / 60)).padStart(2, '0');
        const mm    = String(mins % 60).padStart(2, '0');
        const isHour = mm === '00';
        return (
          <div
            key={i}
            onClick={() => onSlotClick(date, `${hh}:${mm}`)}
            style={{
              position: 'absolute',
              top: i * SLOT_HEIGHT,
              left: 0,
              right: 0,
              height: SLOT_HEIGHT,
              borderTop: `1px ${isHour ? 'solid #E5E7EB' : 'dashed #F3F4F6'}`,
              cursor: 'cell',
            }}
          />
        );
      })}

      {/* Appointment blocks */}
      {appointments.map(appt => {
        const top    = timeToTop(appt.start_time);
        const height = durationToPx(appt.start_time, appt.end_time);
        // Skip if outside visible range
        if (top + height < 0 || top > TOTAL_SLOTS * SLOT_HEIGHT) return null;
        return (
          <AppointmentBlock
            key={appt.id}
            appt={appt}
            topPx={Math.max(0, top)}
            heightPx={height}
            columnWidth={columnWidth}
            onResize={onResize}
            onClick={onClick}
          />
        );
      })}
    </div>
  );
}

export { START_HOUR, END_HOUR, TOTAL_SLOTS, SLOT_HEIGHT };
