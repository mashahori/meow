import type { ReactNode } from 'react'

type FieldProps = {
  label: string
  error?: string
  children: ReactNode
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#504967]">{label}</label>
      {children}
      {error ? <p className="text-xs font-medium text-rose-500">{error}</p> : null}
    </div>
  )
}
