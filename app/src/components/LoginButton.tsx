import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyAccountProfile, logUserEvent } from '../services/api'
import { UserAvatar } from './UserAvatar'

export const LoginButton: React.FC = () => {
  const { isAuthenticated, user, login, logout, isLoading } = useAuth()
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)
  const buttonBase =
    'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200'

  useEffect(() => {
    if (!isAuthenticated) {
      setAvatarDataUrl(null)
      return
    }

    let mounted = true
    const loadAvatar = async () => {
      try {
        const profile = await getMyAccountProfile()
        if (mounted) {
          setAvatarDataUrl(profile.avatar_data_url || null)
        }
      } catch {
        if (mounted) {
          setAvatarDataUrl(null)
        }
      }
    }

    void loadAvatar()
    return () => {
      mounted = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) {
        return
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', onClickOutside)
    return () => {
      document.removeEventListener('click', onClickOutside)
    }
  }, [])

  const openAccountDetails = async () => {
    setIsOpen(false)
    try {
      await logUserEvent({ action: 'open_account_details', target: '/account' })
    } catch {
      // Non-blocking telemetry.
    }
    navigate('/account')
  }

  const openHistory = async () => {
    setIsOpen(false)
    try {
      await logUserEvent({ action: 'open_history', target: '/history' })
    } catch {
      // Non-blocking telemetry.
    }
    navigate('/history')
  }

  const handleLogout = async () => {
    setIsOpen(false)
    try {
      await logUserEvent({ action: 'logout_click', target: 'auth' })
    } catch {
      // Non-blocking telemetry.
    }
    logout()
  }

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
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="flex items-center gap-3 rounded-full border border-white/80 bg-white/70 px-2 py-1.5 backdrop-blur-md transition-colors hover:bg-white/90"
          onClick={() => setIsOpen((previous) => !previous)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <div className="text-right text-xs leading-tight">
            <p className="font-semibold text-slate-800">{user.username}</p>
            <p className="text-slate-500">{user.email}</p>
          </div>
          <UserAvatar
            username={user.username}
            displayName={`${user.firstName} ${user.lastName}`.trim()}
            avatarDataUrl={avatarDataUrl}
            sizeClassName="h-9 w-9"
          />
        </button>

        {isOpen && (
          <div
            className="absolute right-0 top-[calc(100%+0.45rem)] z-[120] w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_44px_rgba(37,55,70,0.18)]"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => void openAccountDetails()}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Account Details
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => void openHistory()}
              className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              History
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleLogout()}
              className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50"
            >
              Logout
            </button>
          </div>
        )}
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
