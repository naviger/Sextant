import React from 'react'
import { useAuth } from '../context/AuthContext'
import { LoginButton } from '../components/LoginButton'

export const StrategyDashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Sextant Strategy Dashboard</h1>
            <p className="text-sm text-slate-600">Position Fix: North Star alignment overview</p>
          </div>
          <LoginButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Welcome Aboard</h2>
          <p className="mt-2 text-slate-600">
            Logged in as <span className="font-medium text-slate-800">{user?.email || user?.username}</span>. Strategic signals and fleet alignment are now available.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">North Star Confidence</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">86%</p>
            <p className="mt-1 text-sm text-slate-600">Current bearing remains stable across enterprise strategy themes.</p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">Alignment Drift Alerts</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">3</p>
            <p className="mt-1 text-sm text-slate-600">Business-unit courses showing measurable strategic drift.</p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">Priority Signals</p>
            <p className="mt-2 text-3xl font-semibold text-sky-700">12</p>
            <p className="mt-1 text-sm text-slate-600">Fresh signals ready for executive review and position fixes.</p>
          </article>
        </section>
      </main>
    </div>
  )
}
