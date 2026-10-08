import { LogOut, Layers3 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useAuth } from '../hooks/use-auth'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [signOutError, setSignOutError] = useState<string | null>(null)

  return (
    <main className="min-h-svh bg-[#f7f5fc] p-6 text-[#1b1730] sm:p-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl bg-white px-6 py-5 shadow-[0_16px_50px_-24px_rgba(52,31,113,0.35)]">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#6d43e5] text-white">
            <Layers3 size={21} />
          </span>
          <div>
            <p className="font-display font-bold">Layered</p>
            <p className="text-xs text-[#928ba0]">Workspace ready</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="gap-2"
          onClick={async () => {
            setSignOutError(null)
            try {
              await signOut()
              navigate('/login')
            } catch (error) {
              setSignOutError(error instanceof Error ? error.message : 'Не удалось выйти из аккаунта.')
            }
          }}
        >
          <LogOut size={16} /> Sign out
        </Button>
      </div>
      {signOutError ? <p role="alert" className="mx-auto mt-4 max-w-5xl text-sm text-rose-600">{signOutError}</p> : null}
      <section className="mx-auto mt-10 max-w-5xl rounded-2xl border border-[#e9e4f1] bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7aa9]">Dashboard</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">Welcome, {user?.email ?? 'there'}.</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#888198]">
          This is the starting point for the shared application layout and your future workspace modules.
        </p>
      </section>
    </main>
  )
}
