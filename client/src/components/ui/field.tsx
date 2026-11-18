import type { ReactNode } from 'react';

type FieldProps = {
  label: string;
  error?: string;
  htmlFor?: string;
  counter?: { length: number; max: number };
  children: ReactNode;
};

export function Field({ label, error, htmlFor, counter, children }: FieldProps) {
  return (
    <div className={`w-full min-w-0 space-y-2 ${error ? '[&_input]:border-[#d1242f] [&_input]:bg-[#ffebe9] [&_input:focus]:border-[#d1242f]' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
          {label}
        </label>
        {counter ? (
          <span
            className={`text-xs font-medium tabular-nums ${counter.length > counter.max ? 'text-[#d1242f]' : 'text-muted-foreground'}`}
          >
            {counter.length}/{counter.max}
          </span>
        ) : null}
      </div>
      {children}
      {error ? <p className="text-xs font-medium text-[#d1242f]">{error}</p> : null}
    </div>
  );
}
