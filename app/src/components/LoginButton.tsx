import React from 'react'
import { useAuth } from '../context/AuthContext'

export const LoginButton: React.FC = () => {
  const { isAuthenticated, user, login, logout, isLoading } = useAuth()

  if (isLoading) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
      >
        Loading...
      </button>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <p className="font-semibold text-gray-800">{user.username}</p>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={login}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
    >
      Login
    </button>
  )
}
