import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost'
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-60',
        variant === 'primary' &&
          'bg-[#6d43e5] text-white shadow-[0_12px_24px_-12px_rgba(91,54,211,0.8)] hover:bg-[#5c35cd]',
        variant === 'outline' &&
          'border border-[#ded9eb] bg-white/70 text-[#4c4562] hover:bg-white',
        variant === 'ghost' && 'text-[#756d8d] hover:bg-[#f0ecf8] hover:text-[#30294a]',
        className,
      )}
      {...props}
    />
  )
}
