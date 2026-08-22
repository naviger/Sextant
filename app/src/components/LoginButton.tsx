import React from 'react'
import { useAuth } from '../context/AuthContext'

export const LoginButton: React.FC = () => {
  const { isAuthenticated, user, login, logout, isLoading } = useAuth()
  const buttonBase =
    'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200'

  if (isLoading) {
    return (
      <button
        disabled
        className={`${buttonBase} cursor-not-allowed border border-slate-300 bg-white/70 text-slate-500`}
      >
        Loading...
      </button>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-white/80 bg-white/70 px-3 py-2 backdrop-blur-md">
        <div className="text-right text-xs leading-tight">
          <p className="font-semibold text-slate-800">{user.username}</p>
          <p className="text-slate-500">{user.email}</p>
        </div>
        <button
          onClick={logout}
          className={`${buttonBase} border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50`}
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={login}
      className={`${buttonBase} bg-[linear-gradient(135deg,var(--north-atlantic-blue),#2834ff)] text-white shadow-[0_12px_30px_rgba(14,15,214,0.18)] hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(14,15,214,0.24)]`}
    >
      Login
    </button>
  )
}
