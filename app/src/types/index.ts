export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
  getToken: () => string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}
