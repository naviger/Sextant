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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4"><img src="/naviger-logo-horiz.svg" alt="Naviger Logo" /></div>
          <div className="text-4xl mb-4"><img src="/sextant-logo-horiz.svg" alt="Sextant Logo" /></div>
          {/* <h1 className="text-3xl font-bold text-gray-900 mb-2">Sextant</h1> */}
          <p className="text-gray-600">Secure Authentication</p>
        </div>

        <div className="mb-6">

          <button
            onClick={login}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <span>🔐</span>
            Sign In
          </button>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            This application uses OpenID Connect (OIDC) for secure authentication.
          </p>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-900 font-semibold mb-2">Demo Credentials:</p>
          <p className="text-xs text-blue-800 mb-1">
            <strong>Username:</strong> demo@example.com
          </p>
          <p className="text-xs text-blue-800">
            <strong>Password:</strong> password123
          </p>
        </div>
      </div>
    </div>
  )
}
