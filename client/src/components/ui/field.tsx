import type { ReactNode } from 'react';

type FieldProps = {
  label: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
};

export function Field({ label, error, htmlFor, children }: FieldProps) {
  return (
    <div className={`space-y-2 ${error ? '[&_input]:border-[#d1242f] [&_input]:bg-[#ffebe9] [&_input:focus]:border-[#d1242f]' : ''}`}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs font-medium text-[#d1242f]">{error}</p> : null}
    </div>
  );
}
