import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Field } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { useAuth } from '../hooks/use-auth'

const loginSchema = z.object({
  email: z.string().trim().email('Введите корректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
})

const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(8, 'Подтвердите пароль'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли должны совпадать',
    path: ['confirmPassword'],
  })

type AuthPageProps = {
  mode: 'login' | 'register'
}

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Не удалось выполнить запрос.'
}

export function AuthPage({ mode }: AuthPageProps) {
  const isLogin = mode === 'login'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const onLogin = loginForm.handleSubmit(async (credentials) => {
    setSubmitError(null)
    try {
      await signIn(credentials)
      navigate('/dashboard')
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })
  const onRegister = registerForm.handleSubmit(async ({ email, password }) => {
    setSubmitError(null)
    try {
      await signUp({ email, password })
      navigate('/dashboard')
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7f5fc] px-4 py-10 text-[#1b1730] sm:px-6">
      <section className="w-full max-w-md rounded-[2rem] bg-white px-6 py-8 shadow-[0_24px_80px_-32px_rgba(52,31,113,0.35)] sm:px-10 sm:py-12">
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7aa9]">
                {isLogin ? 'Welcome back' : 'Get started'}
              </p>
              <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-[#241c3b]">
                {isLogin ? 'Sign in to your workspace' : 'Create your account'}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#888198]">
                {isLogin ? 'Enter your details to continue where you left off.' : 'Start building better ideas with your team today.'}
              </p>
            </div>

            <form className="space-y-5" onSubmit={isLogin ? onLogin : onRegister} noValidate>
              <Field label="Email address" error={(isLogin ? loginForm.formState.errors.email : registerForm.formState.errors.email)?.message}>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-[#aaa4b7]" size={18} />
                  <Input className="pl-11" type="email" placeholder="you@example.com" {...(isLogin ? loginForm.register('email') : registerForm.register('email'))} />
                </div>
              </Field>
              <Field label="Password" error={(isLogin ? loginForm.formState.errors.password : registerForm.formState.errors.password)?.message}>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-3.5 text-[#aaa4b7]" size={18} />
                  <Input className="pl-11 pr-12" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...(isLogin ? loginForm.register('password') : registerForm.register('password'))} />
                  <button type="button" aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} className="absolute right-3 top-3 text-[#aaa4b7] hover:text-[#6d43e5]" onClick={() => setShowPassword((visible) => !visible)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
              {!isLogin ? (
                <Field label="Confirm password" error={registerForm.formState.errors.confirmPassword?.message}>
                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-3.5 text-[#aaa4b7]" size={18} />
                    <Input className="pl-11 pr-12" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" {...registerForm.register('confirmPassword')} />
                    <button type="button" aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'} className="absolute right-3 top-3 text-[#aaa4b7] hover:text-[#6d43e5]" onClick={() => setShowConfirmPassword((visible) => !visible)}>
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>
              ) : (
                <div className="flex justify-end">
                  <button type="button" className="text-sm font-semibold text-[#6d43e5] hover:text-[#512ab9]">Forgot password?</button>
                </div>
              )}
              {!isLogin ? (
                <p className="text-xs leading-5 text-[#928ba0]">By creating an account, you agree to our Terms and Privacy Policy.</p>
              ) : null}
              {submitError ? <p role="alert" className="text-sm font-medium text-rose-600">{submitError}</p> : null}
              <Button className="w-full gap-2" type="submit" disabled={isLogin ? loginForm.formState.isSubmitting : registerForm.formState.isSubmitting}>
                {isLogin
                  ? loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'
                  : registerForm.formState.isSubmitting ? 'Creating account…' : 'Create account'}
                <ArrowRight size={17} />
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-[#928ba0]">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <Link className="font-semibold text-[#6d43e5] hover:text-[#512ab9]" to={isLogin ? '/register' : '/login'}>
                {isLogin ? 'Create one' : 'Sign in'}
              </Link>
            </p>
      </section>
    </main>
  )
}
