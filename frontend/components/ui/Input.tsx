'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-300">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border ${
            error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-violet-500/60'
          } text-gray-100 placeholder-gray-500 text-sm outline-none transition-all focus:ring-2 ${
            error ? 'focus:ring-red-500/20' : 'focus:ring-violet-500/20'
          } ${className}`}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-300">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border ${
            error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-violet-500/60'
          } text-gray-100 placeholder-gray-500 text-sm outline-none transition-all resize-y focus:ring-2 ${
            error ? 'focus:ring-red-500/20' : 'focus:ring-violet-500/20'
          } min-h-[100px] ${className}`}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
