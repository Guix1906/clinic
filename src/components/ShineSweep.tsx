'use client';

import React, { useState } from 'react';

type ShineSweepProps = {
  children: React.ReactNode;
  durationMs?: number;
  intervalMs?: number;
  angleDeg?: number;
  sweepWidth?: number;
  hoverBoost?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function ShineSweep({
  children,
  durationMs = 900,
  intervalMs = 4500,
  angleDeg = 30,
  sweepWidth = 55,
  hoverBoost = 0.15,
  className,
  style,
}: ShineSweepProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        isolation: 'isolate',
        cursor: 'default',
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}

      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          borderRadius: 'inherit',
          zIndex: 10,
          willChange: 'transform',
          transform: 'translateX(-120%)',
          animation: `shine-sweep ${durationMs}ms ease-in-out ${intervalMs}ms infinite`,
          filter: hovered ? `brightness(${1 + hoverBoost})` : 'none',
          transition: 'filter 250ms ease',
          transformOrigin: 'center',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.15) 25%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.15) 75%, transparent 100%)',
            transform: `rotate(${angleDeg}deg)`,
            width: `${sweepWidth}%`,
            left: '50%',
            top: 0,
            bottom: 0,
            marginLeft: `-${sweepWidth / 2}%`,
            willChange: 'transform',
            filter: 'blur(0.6px)',
            transformOrigin: 'center',
          }}
        />
      </span>

      <style jsx>{`
        @keyframes shine-sweep {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(120%);
          }
        }
      `}</style>
    </span>
  );
}
