import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `textarea-${label?.toLowerCase().replace(/\s/g, '-')}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-foreground mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm
          placeholder:text-muted-foreground/60
          transition-colors duration-150 resize-none
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-destructive focus:ring-destructive/30 focus:border-destructive' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-destructive font-medium">{error}</p>
      )}
    </div>
  );
};
