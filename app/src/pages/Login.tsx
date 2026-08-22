import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const Login: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth()

  // If already authenticated, redirect to the strategy dashboard.
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="surface-panel chart-grid w-full max-w-sm rounded-[2rem] p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--north-atlantic-blue)]"></div>
          <p className="section-kicker mb-2">Signal Lock</p>
          <h1 className="text-2xl font-semibold text-slate-900">Loading your course</h1>
          <p className="mt-2 text-sm text-slate-600">Retrieving the latest authentication bearing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,166,166,0.08),transparent_30%),linear-gradient(180deg,#eef3f7_0%,#e7edf2_100%)] px-4 py-8 text-slate-800">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] surface-panel lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden p-8 lg:p-12">
          <div className="absolute inset-0 chart-grid opacity-50" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <img src="/naviger-logo-vert.svg" alt="Naviger" className="h-16 w-auto" />
              <img src="/sextant-logo-horiz.svg" alt="Sextant" className="mt-6 h-10 w-auto" />
              <p className="section-kicker mt-8">Strategic Navigation</p>
              <h1 className="mt-3 max-w-xl text-4xl font-semibold text-slate-900 sm:text-5xl">
                Sign in to fix your current position and review the organization&apos;s course.
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
                Sextant uses OIDC authentication to open a calm, executive-grade view of alignment,
                drift, and decision signals.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white/70 p-4">
                <p className="section-kicker">North Star</p>
                <p className="mt-2 text-sm text-slate-700">Shared enterprise vision</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/70 p-4">
                <p className="section-kicker">Bearing</p>
                <p className="mt-2 text-sm text-slate-700">AI guidance and navigation cues</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/70 p-4">
                <p className="section-kicker">Drift</p>
                <p className="mt-2 text-sm text-slate-700">Misalignment made visible early</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[linear-gradient(180deg,rgba(37,55,70,0.96),rgba(37,55,70,0.9))] p-8 text-white lg:p-12">
          <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/6 p-8 backdrop-blur-xl">
            <p className="section-kicker text-white/60">Secure Access</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Open the navigation bridge</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">
              Use your organizational credentials to continue into the strategy surfaces.
            </p>

            <button
              onClick={login}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--north-atlantic-blue),#2834ff)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(14,15,214,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(14,15,214,0.32)]"
            >
              Sign In
            </button>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
              <p className="section-kicker text-white/45">Authentication Model</p>
              <p className="mt-2 leading-7">
                This application uses OpenID Connect with a PKCE-based flow for secure access.
              </p>
            </div>

            <div className="mt-4 rounded-3xl border border-[rgba(230,182,85,0.25)] bg-[rgba(230,182,85,0.08)] p-4 text-sm text-white/85">
              <p className="section-kicker text-[rgba(230,182,85,0.8)]">Demo Access</p>
              <p className="mt-2">Username: demo@example.com</p>
              <p>Password: password123</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
