import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, '-')}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-foreground mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full h-10 rounded-xl border border-border bg-card px-4 text-sm
            placeholder:text-muted-foreground/60
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-destructive focus:ring-destructive/30 focus:border-destructive' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-destructive font-medium">{error}</p>
      )}
    </div>
  );
};
