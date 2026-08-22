import React from 'react'
import { useAuth } from '../context/AuthContext'
import { LoginButton } from '../components/LoginButton'

export const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Sextant</h1>
          <LoginButton />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Sextant
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            A modern full-stack application with secure OIDC authentication
          </p>
        </div>

        {isAuthenticated && user ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Hello, {user.firstName || user.username}! 👋
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">Your Profile</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Username:</dt>
                    <dd className="font-medium text-gray-900">{user.username}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Email:</dt>
                    <dd className="font-medium text-gray-900">{user.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Name:</dt>
                    <dd className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">Your Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {role}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No roles assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-6">
              Please login to access your profile and other features.
            </p>
            <LoginButton />
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">🔐</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Secure Authentication</h3>
            <p className="text-gray-600 text-sm">
              OIDC-based authentication with Keycloak
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Management</h3>
            <p className="text-gray-600 text-sm">
              Powered by ArangoDB Enterprise
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Fast APIs</h3>
            <p className="text-gray-600 text-sm">
              Built with Python FastAPI
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
