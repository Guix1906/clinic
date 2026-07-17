import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const padding = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
  padding: p = 'md',
  hover = false,
  className = '',
  children,
  ...props
}) => {
  const base = 'bg-card border border-border rounded-2xl transition-all duration-150';
  const hoverCls = hover ? 'hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5' : '';

  return (
    <div className={`${base} ${padding[p]} ${hoverCls} ${className}`} {...props}>
      {children}
    </div>
  );
};
