import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Field } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { useAuth } from '../hooks/use-auth'
import { useTranslation } from '../contexts/language-context'
import { LanguageSwitcher } from '../components/language-switcher'
import { PageFallback } from '../app/page-fallback'

function createLoginSchema(t: (text: string) => string) {
  return z.object({
    email: z.string().trim().email(t('Enter a valid email address')),
    password: z.string().min(8, t('Password must be at least 8 characters')),
  })
}

function createRegisterSchema(t: (text: string) => string) {
  return createLoginSchema(t)
    .extend({
      confirmPassword: z.string().min(8, t('Password must be at least 8 characters')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('Passwords must match'),
      path: ['confirmPassword'],
    })
}

type AuthPageProps = {
  mode: 'login' | 'register'
}

type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>
type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>

export function AuthPage({ mode }: AuthPageProps) {
  const { t } = useTranslation()
  const isLogin = mode === 'login'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { user, isLoading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const loginSchema = createLoginSchema(t)
  const registerSchema = createRegisterSchema(t)

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
      navigate('/budgets')
    } catch (error) {
      setSubmitError(error instanceof Error ? t(error.message) : t('Unable to complete the request.'))
    }
  })
  const onRegister = registerForm.handleSubmit(async ({ email, password }) => {
    setSubmitError(null)
    try {
      await signUp({ email, password })
      navigate('/budgets')
    } catch (error) {
      setSubmitError(error instanceof Error ? t(error.message) : t('Unable to complete the request.'))
    }
  })

  if (isLogin && isLoading) return <PageFallback />
  if (isLogin && user) return <Navigate to="/budgets" replace />

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#fafafa] px-4 py-10 text-[#1f1f1f] sm:px-6">
      <section className="w-full max-w-md rounded-[2rem] bg-white px-6 py-8 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.12)] sm:px-10 sm:py-12">
            <div className="mb-6 flex justify-end">
              <LanguageSwitcher />
            </div>
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#737373]">
                {t(isLogin ? 'Welcome back' : 'Get started')}
              </p>
              <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-[#262626]">
                {t(isLogin ? 'Sign in to your workspace' : 'Create your account')}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#737373]">
                {t(isLogin ? 'Enter your details to continue where you left off.' : 'Start building better ideas with your team today.')}
              </p>
            </div>

            <form className="space-y-5" onSubmit={isLogin ? onLogin : onRegister} noValidate>
              {isLogin && searchParams.get('passwordReset') === '1' ? (
                <p role="status" className="text-sm font-medium text-emerald-700">
                  {t('Password updated. Sign in with your new password.')}
                </p>
              ) : null}
              <Field label={t('Email address')} error={(isLogin ? loginForm.formState.errors.email : registerForm.formState.errors.email)?.message}>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-[#a3a3a3]" size={18} />
                  <Input className="pl-11" type="email" placeholder="you@example.com" {...(isLogin ? loginForm.register('email') : registerForm.register('email'))} />
                </div>
              </Field>
              <Field label={t('Password')} error={(isLogin ? loginForm.formState.errors.password : registerForm.formState.errors.password)?.message}>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-3.5 text-[#a3a3a3]" size={18} />
                  <Input className="pl-11 pr-12" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...(isLogin ? loginForm.register('password') : registerForm.register('password'))} />
                  <button type="button" aria-label={t(showPassword ? 'Hide password' : 'Show password')} className="absolute right-3 top-3 text-[#a3a3a3] hover:text-[#4b5563]" onClick={() => setShowPassword((visible) => !visible)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
              {!isLogin ? (
                <Field label={t('Confirm password')} error={registerForm.formState.errors.confirmPassword?.message}>
                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-3.5 text-[#a3a3a3]" size={18} />
                    <Input className="pl-11 pr-12" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" {...registerForm.register('confirmPassword')} />
                    <button type="button" aria-label={t(showConfirmPassword ? 'Hide password' : 'Show password')} className="absolute right-3 top-3 text-[#a3a3a3] hover:text-[#4b5563]" onClick={() => setShowConfirmPassword((visible) => !visible)}>
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>
              ) : (
                <div className="flex justify-end">
                  <Link className="text-sm font-semibold text-[#4b5563] hover:text-[#262626]" to="/forgot-password">{t('Forgot password?')}</Link>
                </div>
              )}
              {!isLogin ? (
                <p className="text-xs leading-5 text-[#737373]">{t('By creating an account, you agree to our Terms and Privacy Policy.')}</p>
              ) : null}
              {submitError ? <p role="alert" className="text-sm font-medium text-rose-600">{submitError}</p> : null}
              <Button className="w-full gap-2" type="submit" disabled={isLogin ? loginForm.formState.isSubmitting : registerForm.formState.isSubmitting}>
                {isLogin
                  ? loginForm.formState.isSubmitting ? t('Signing in…') : t('Sign in')
                  : registerForm.formState.isSubmitting ? t('Creating account…') : t('Create account')}
                <ArrowRight size={17} />
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-[#737373]">
              {t(isLogin ? "Don't have an account?" : 'Already have an account?')}{' '}
              <Link className="font-semibold text-[#4b5563] hover:text-[#262626]" to={isLogin ? '/register' : '/login'}>
                {t(isLogin ? 'Create one' : 'Sign in')}
              </Link>
            </p>
      </section>
    </main>
  )
}
