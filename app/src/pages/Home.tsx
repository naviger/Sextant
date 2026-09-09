import React from 'react'
import { useAuth } from '../context/AuthContext'
import { LoginButton } from '../components/LoginButton'

export const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,166,166,0.08),transparent_30%),linear-gradient(180deg,#eef3f7_0%,#e7edf2_100%)] text-slate-800">
      <nav className="relative z-[200] border-b border-white/70 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img src="/sextant-logo-horiz.svg" alt="Sextant" className="h-8 w-auto" />
            <span className="section-kicker hidden sm:inline">Strategic Navigation</span>
          </div>
          <LoginButton />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="surface-panel chart-grid overflow-hidden rounded-[2rem] p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div>
              <p className="section-kicker mb-3">Current Position</p>
              <h1 className="max-w-3xl text-4xl font-semibold text-slate-900 sm:text-5xl">
                A calm executive view for aligning strategy, signals, and course corrections.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Sextant gives leadership teams a shared North Star, visible drift indicators,
                and a clearer fix on where the organization stands right now.
              </p>
            </div>

            <div className="surface-panel-dark drift-glow rounded-[1.75rem] p-6 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Navigation Fix</p>
              <p className="mt-3 font-semibold text-white/80">North Atlantic Blue / Horizon Teal</p>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/55">Alignment</p>
                  <p className="metric-number mt-1 text-2xl text-white">86%</p>
                </div>
                <div>
                  <p className="text-white/55">Drift</p>
                  <p className="metric-number mt-1 text-2xl text-white">3</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {isAuthenticated && user ? (
            <div className="surface-panel rounded-[2rem] p-7">
              <p className="section-kicker mb-2">Authenticated Fix</p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Welcome back, {user.firstName || user.username}.
              </h2>
              <p className="mt-2 text-slate-600">
                Your current position, roles, and operational bearings are available below.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
                  <p className="section-kicker">Username</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{user.username}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
                  <p className="section-kicker">Email</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{user.email}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
                  <p className="section-kicker">Name</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="surface-panel rounded-[2rem] p-7">
              <p className="section-kicker mb-2">Access Required</p>
              <h2 className="text-2xl font-semibold text-slate-900">Sign in to view your position fix</h2>
              <p className="mt-2 max-w-xl text-slate-600">
                Authentication exposes the profile and strategy surfaces needed for alignment review.
              </p>
              <div className="mt-6">
                <LoginButton />
              </div>
            </div>
          )}

          <aside className="surface-panel rounded-[2rem] p-7">
            <p className="section-kicker mb-3">Active Signals</p>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Secure Authentication</p>
                <p className="mt-1 text-sm text-slate-600">OIDC-based access with a clear current bearing.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Alignment Visibility</p>
                <p className="mt-1 text-sm text-slate-600">Enterprise and business-unit connections stay visible.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Strategic Depth</p>
                <p className="mt-1 text-sm text-slate-600">Confidence and drift indicators surface without clutter.</p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
