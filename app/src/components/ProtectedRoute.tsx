import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="surface-panel chart-grid w-full max-w-sm rounded-[2rem] p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--north-atlantic-blue)]"></div>
          <p className="section-kicker mb-2">Position Fix</p>
          <h1 className="text-2xl font-semibold text-slate-900">Verifying access</h1>
          <p className="mt-2 text-sm text-slate-600">Locking in your current bearing and loading strategic context.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user && !user.roles.includes(requiredRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="surface-panel chart-grid w-full max-w-lg rounded-[2rem] p-8 text-center">
          <p className="section-kicker mb-2">Restricted Signal</p>
          <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
          <p className="mt-2 text-sm text-slate-600">
            You do not have the required permissions to access this course.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
