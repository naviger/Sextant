import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthContextType, User } from '../types'
import {
  initKeycloak,
  login as keycloakLogin,
  logout as keycloakLogout,
  getToken,
  getUserInfo,
  isAuthenticated,
} from '../services/keycloak'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticated = await initKeycloak()
        setIsAuth(authenticated)

        if (authenticated && isAuthenticated()) {
          const userInfo = getUserInfo()
          setUser({
            id: userInfo.username || '',
            username: userInfo.username || '',
            email: userInfo.email || '',
            firstName: userInfo.firstName || '',
            lastName: userInfo.lastName || '',
            roles: userInfo.roles || [],
          })
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = () => {
    keycloakLogin()
  }

  const logout = () => {
    setUser(null)
    setIsAuth(false)
    keycloakLogout()
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: isAuth,
    isLoading,
    login,
    logout,
    getToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
