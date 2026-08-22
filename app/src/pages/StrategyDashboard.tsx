import React from 'react'
import { useAuth } from '../context/AuthContext'
import { LoginButton } from '../components/LoginButton'

export const StrategyDashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,166,166,0.08),transparent_28%),linear-gradient(180deg,#eef3f7_0%,#e7edf2_100%)] text-slate-800">
      <header className="border-b border-white/70 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <img src="/sextant-logo-horiz.svg" alt="Sextant" className="h-8 w-auto" />
            <p className="section-kicker mt-2">Position Fix / North Star alignment overview</p>
          </div>
          <LoginButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="surface-panel chart-grid rounded-[2rem] p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="section-kicker mb-3">Command Overview</p>
              <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">Strategic currents at a glance.</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Logged in as <span className="font-semibold text-slate-900">{user?.email || user?.username}</span>.
                The navigation bridge is displaying confidence, drift, and priority signals across the fleet.
              </p>
            </div>

            <div className="surface-panel-dark rounded-[1.75rem] p-6 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Current Fix</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/55">Confidence</p>
                  <p className="metric-number mt-2 text-3xl text-white">86%</p>
                </div>
                <div>
                  <p className="text-white/55">Drift Alerts</p>
                  <p className="metric-number mt-2 text-3xl text-white">3</p>
                </div>
              </div>
              <div className="mt-6 h-1.5 rounded-full bg-white/10">
                <div className="h-1.5 w-[86%] rounded-full bg-[linear-gradient(90deg,var(--horizon-teal),var(--celestial-gold))]" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="surface-panel rounded-[1.75rem] p-5">
            <p className="section-kicker">North Star Confidence</p>
            <p className="metric-number mt-3 text-4xl text-[var(--north-atlantic-blue)]">86%</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">Current bearing remains stable across enterprise strategy themes.</p>
          </article>

          <article className="surface-panel rounded-[1.75rem] p-5">
            <p className="section-kicker">Alignment Drift Alerts</p>
            <p className="metric-number mt-3 text-4xl text-[var(--celestial-gold)]">3</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">Business-unit courses showing measurable strategic drift.</p>
          </article>

          <article className="surface-panel rounded-[1.75rem] p-5">
            <p className="section-kicker">Priority Signals</p>
            <p className="metric-number mt-3 text-4xl text-[var(--horizon-teal)]">12</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">Fresh signals ready for executive review and position fixes.</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <article className="surface-panel rounded-[2rem] p-7">
            <p className="section-kicker mb-3">Alignment Map</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white/75 p-4">
                <p className="text-sm font-semibold text-slate-900">Enterprise Strategy</p>
                <p className="mt-2 text-sm text-slate-600">North Star and governing direction.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/75 p-4">
                <p className="text-sm font-semibold text-slate-900">Strategic Themes</p>
                <p className="mt-2 text-sm text-slate-600">Constellation of priorities and constraints.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/75 p-4">
                <p className="text-sm font-semibold text-slate-900">Business Units</p>
                <p className="mt-2 text-sm text-slate-600">Execution paths and local course corrections.</p>
              </div>
            </div>
          </article>

          <article className="surface-panel rounded-[2rem] p-7">
            <p className="section-kicker mb-3">Strategic Currents</p>
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white/75 p-4">
                <p className="text-sm font-semibold text-slate-900">Finance</p>
                <p className="mt-1 text-sm text-slate-600">Minor drift on capital allocation signals.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/75 p-4">
                <p className="text-sm font-semibold text-slate-900">Operations</p>
                <p className="mt-1 text-sm text-slate-600">Stable course with high confidence alignment.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/75 p-4">
                <p className="text-sm font-semibold text-slate-900">Product</p>
                <p className="mt-1 text-sm text-slate-600">Fresh signal detected around roadmap sequencing.</p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
