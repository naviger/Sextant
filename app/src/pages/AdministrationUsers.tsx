import React from 'react'
import { MainMenu } from '../components/MainMenu'
import { LoginButton } from '../components/LoginButton'

export const AdministrationUsers: React.FC = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,166,166,0.08),transparent_28%),linear-gradient(180deg,#eef3f7_0%,#e7edf2_100%)] text-slate-800">
      <header className="relative z-[200] border-b border-white/70 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <img src="/sextant-logo-horiz.svg" alt="Sextant" className="h-8 w-auto" />
          <LoginButton />
        </div>
      </header>

      <MainMenu breadcrumb="Administration / Users" />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="surface-panel rounded-[2rem] p-7">
          <p className="section-kicker mb-2">Users</p>
          <h1 className="text-3xl font-semibold text-slate-900">User management</h1>
          <p className="mt-4 text-slate-600">TBD: user administration controls will be added here.</p>
        </section>
      </main>
    </div>
  )
}
