import React from 'react';

type Status = 'stable' | 'observation' | 'critical' | 'info' | 'success' | 'warning';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: Status;
  children: React.ReactNode;
}

const statusStyles: Record<Status, string> = {
  stable: 'bg-success/10 text-success border border-success/20',
  observation: 'bg-warning/10 text-warning border border-warning/20',
  critical: 'bg-destructive/10 text-destructive border border-destructive/20',
  info: 'bg-info/10 text-info border border-info/20',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
};

export const Badge: React.FC<BadgeProps> = ({ status = 'info', children, className = '', ...props }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[status]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
