import { useAuth } from '../hooks/use-auth'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <section className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7aa9]">Dashboard</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">
        Welcome, {user?.email ?? 'there'}.
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-[#888198]">
        This is the starting point for the shared application layout and your future workspace modules.
      </p>
    </section>
  )
}
