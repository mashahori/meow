import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-xl border border-[#e2deeb] bg-white px-4 text-sm text-[#28223e] outline-none transition placeholder:text-[#aaa4b7] focus:border-violet-400 focus:ring-4 focus:ring-violet-100',
        className,
      )}
      {...props}
    />
  )
}
