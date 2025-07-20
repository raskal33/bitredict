"use client";

import { forwardRef, TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  help?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, help, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
      <textarea
        ref={ref}
        {...props}
        className={`
          w-full px-3 py-2 rounded-button bg-bg-card border-2 transition-colors
          text-text-primary placeholder-text-muted
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          ${error ? 'border-red-500' : 'border-border-card'}
          ${props.disabled ? 'bg-bg-overlay cursor-not-allowed' : ''}
        `}
              />
      {help && <p className="mt-1 text-xs text-text-muted">{help}</p>}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea; 