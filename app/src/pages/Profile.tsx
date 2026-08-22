import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LoginButton } from '../components/LoginButton'

export const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Sextant</h1>
            <LoginButton />
          </div>
        </nav>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Please login to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Sextant</h1>
          <LoginButton />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32"></div>

          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-24 mb-6">
              <div className="md:flex-1">
                <div className="flex items-end gap-4">
                  <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center text-4xl">
                    👤
                  </div>
                  <div className="pb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-gray-600">@{user.username}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="mt-4 md:mt-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={user.username}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={user.firstName}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={user.lastName}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex gap-3">
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Assigned Roles</h2>
                <div className="space-y-2">
                  {user.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No roles assigned</p>
                  )}
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Security</h3>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      Change Password
                    </button>
                    <button className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
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
