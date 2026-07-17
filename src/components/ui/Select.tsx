import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `select-${label?.toLowerCase().replace(/\s/g, '-')}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-foreground mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className={`
            w-full h-10 rounded-xl border border-border bg-card px-4 pr-10 text-sm
            appearance-none cursor-pointer
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-destructive focus:ring-destructive/30 focus:border-destructive' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-destructive font-medium">{error}</p>
      )}
    </div>
  );
};
