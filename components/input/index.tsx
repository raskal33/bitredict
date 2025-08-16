"use client";

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  help?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, icon, help, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">{icon}</div>}
        <input
          ref={ref}
          {...props}
          className={`
            w-full px-3 py-2 rounded-button bg-bg-card border-2 transition-colors
            text-text-primary placeholder-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500' : 'border-border-card'}
            ${props.disabled ? 'bg-bg-overlay cursor-not-allowed' : ''}
          `}
        />
      </div>
      {help && <p className="mt-1 text-xs text-text-muted">{help}</p>}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 