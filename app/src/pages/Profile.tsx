import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LoginButton } from '../components/LoginButton'

export const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#eef3f7_0%,#e7edf2_100%)]">
        <nav className="relative z-[200] border-b border-white/70 bg-white/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <img src="/sextant-logo-horiz.svg" alt="Sextant" className="h-8 w-auto" />
            <LoginButton />
          </div>
        </nav>
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="surface-panel chart-grid rounded-[2rem] p-8 text-center">
            <p className="section-kicker mb-2">Profile Required</p>
            <p className="text-lg font-semibold text-slate-900">Please login to view your profile.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,166,166,0.08),transparent_28%),linear-gradient(180deg,#eef3f7_0%,#e7edf2_100%)] text-slate-800">
      <nav className="relative z-[200] border-b border-white/70 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <img src="/sextant-logo-horiz.svg" alt="Sextant" className="h-8 w-auto" />
          <LoginButton />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="surface-panel overflow-hidden rounded-[2rem]">
          <div className="h-32 bg-[linear-gradient(135deg,rgba(14,15,214,0.95),rgba(0,166,166,0.9))]" />

          <div className="px-6 pb-6 lg:px-8">
            <div className="-mt-24 mb-6 flex flex-col md:flex-row md:items-end md:justify-between">
              <div className="md:flex-1">
                <div className="flex items-end gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white text-4xl shadow-[0_16px_40px_rgba(37,55,70,0.15)]">
                    <span className="metric-number text-2xl text-[var(--north-atlantic-blue)]">PF</span>
                  </div>
                  <div className="pb-2">
                    <h1 className="text-3xl font-semibold text-slate-900">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-slate-600">@{user.username}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="mt-4 rounded-full bg-[linear-gradient(135deg,var(--north-atlantic-blue),#2834ff)] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 md:mt-0"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <p className="section-kicker mb-3">Profile Information</p>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled={!isEditing}
                      className="input-field disabled:cursor-not-allowed disabled:bg-white/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Username
                    </label>
                    <input
                      type="text"
                      value={user.username}
                      disabled
                      className="input-field cursor-not-allowed bg-white/60"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={user.firstName}
                        disabled={!isEditing}
                        className="input-field disabled:cursor-not-allowed disabled:bg-white/60"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={user.lastName}
                        disabled={!isEditing}
                        className="input-field disabled:cursor-not-allowed disabled:bg-white/60"
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex gap-3">
                    <button className="rounded-full bg-[linear-gradient(135deg,var(--north-atlantic-blue),#2834ff)] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5">
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div>
                <p className="section-kicker mb-3">Assigned Roles</p>
                <div className="space-y-2">
                  {user.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full border border-[rgba(14,15,214,0.15)] bg-[rgba(14,15,214,0.08)] px-4 py-2 text-sm font-semibold text-[var(--north-atlantic-blue)]"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="italic text-slate-500">No roles assigned</p>
                  )}
                </div>

                <div className="mt-8">
                  <p className="section-kicker mb-3">Account Security</p>
                  <div className="space-y-2">
                    <button className="w-full rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-white">
                      Change Password
                    </button>
                    <button className="w-full rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-white">
                      Enable Two-Factor Authentication
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
