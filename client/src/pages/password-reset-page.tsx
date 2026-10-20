import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Field } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { requestPasswordReset, resetPassword } from '../lib/auth-api'

const emailSchema = z.object({
  email: z.string().trim().email('Введите корректный email'),
})

const passwordSchema = z
  .object({
    password: z.string().min(8, 'Минимум 8 символов'),
    confirmPassword: z.string().min(8, 'Подтвердите пароль'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли должны совпадать',
    path: ['confirmPassword'],
  })

type PasswordResetPageProps = {
  mode: 'request' | 'reset'
}

type EmailValues = z.infer<typeof emailSchema>
type PasswordValues = z.infer<typeof passwordSchema>

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Не удалось выполнить запрос.'
}

export function PasswordResetPage({ mode }: PasswordResetPageProps) {
  const isRequest = mode === 'request'
  const [searchParams] = useSearchParams()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onRequest = emailForm.handleSubmit(async ({ email }) => {
    setSubmitError(null)
    try {
      await requestPasswordReset(email)
      setIsComplete(true)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  const onReset = passwordForm.handleSubmit(async ({ password }) => {
    if (!token) {
      setSubmitError('Ссылка для восстановления недействительна или устарела.')
      return
    }

    setSubmitError(null)
    try {
      await resetPassword(token, password)
      navigate('/login?passwordReset=1')
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  const isSubmitting = isRequest
    ? emailForm.formState.isSubmitting
    : passwordForm.formState.isSubmitting

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7f5fc] px-4 py-10 text-[#1b1730] sm:px-6">
      <section className="w-full max-w-md rounded-[2rem] bg-white px-6 py-8 shadow-[0_24px_80px_-32px_rgba(52,31,113,0.35)] sm:px-10 sm:py-12">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7aa9]">
            Password recovery
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-[#241c3b]">
            {isRequest ? 'Forgot your password?' : 'Choose a new password'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#888198]">
            {isRequest
              ? 'Enter your account email and we will send you a password reset link.'
              : 'Your new password must be at least 8 characters long.'}
          </p>
        </div>

        {isComplete ? (
          <div role="status" className="space-y-5">
            <p className="text-sm leading-6 text-[#504967]">
              If an account with that email exists, a password reset link has been sent.
            </p>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#6d43e5] hover:text-[#512ab9]"
              to="/login"
            >
              Back to sign in
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={isRequest ? onRequest : onReset}
            noValidate
          >
            {isRequest ? (
              <Field label="Email address" error={emailForm.formState.errors.email?.message}>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-[#aaa4b7]" size={18} />
                  <Input
                    className="pl-11"
                    type="email"
                    placeholder="you@example.com"
                    {...emailForm.register('email')}
                  />
                </div>
              </Field>
            ) : (
              <>
                <Field label="New password" error={passwordForm.formState.errors.password?.message}>
                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-3.5 text-[#aaa4b7]" size={18} />
                    <Input
                      className="pl-11"
                      type="password"
                      autoComplete="new-password"
                      {...passwordForm.register('password')}
                    />
                  </div>
                </Field>
                <Field label="Confirm new password" error={passwordForm.formState.errors.confirmPassword?.message}>
                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-3.5 text-[#aaa4b7]" size={18} />
                    <Input
                      className="pl-11"
                      type="password"
                      autoComplete="new-password"
                      {...passwordForm.register('confirmPassword')}
                    />
                  </div>
                </Field>
              </>
            )}

            {submitError ? (
              <p role="alert" className="text-sm font-medium text-rose-600">
                {submitError}
              </p>
            ) : null}
            <Button className="w-full gap-2" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait…'
                : isRequest
                  ? 'Send reset link'
                  : 'Reset password'}
              <ArrowRight size={17} />
            </Button>
          </form>
        )}

        {!isComplete ? (
          <p className="mt-8 text-center text-sm text-[#928ba0]">
            Remember your password?{' '}
            <Link
              className="font-semibold text-[#6d43e5] hover:text-[#512ab9]"
              to="/login"
            >
              Sign in
            </Link>
          </p>
        ) : null}
      </section>
    </main>
  )
}
