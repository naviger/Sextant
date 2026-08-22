import axios, { AxiosInstance, AxiosError } from 'axios'
import { getToken, refreshToken } from './keycloak'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let apiInstance: AxiosInstance | null = null

export const getApiInstance = (): AxiosInstance => {
  if (!apiInstance) {
    apiInstance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add token
    apiInstance.interceptors.request.use(
      async (config) => {
        const token = getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for token refresh and error handling
    apiInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && originalRequest) {
          try {
            const refreshed = await refreshToken()
            if (refreshed) {
              const token = getToken()
              originalRequest.headers.Authorization = `Bearer ${token}`
              return apiInstance(originalRequest)
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  return apiInstance
}

export const apiCall = async <T>(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  data?: unknown
): Promise<T> => {
  const api = getApiInstance()
  const response = await api[method]<T>(url, data)
  return response.data
}

export const get = <T>(url: string): Promise<T> => apiCall('get', url)
export const post = <T>(url: string, data?: unknown): Promise<T> => apiCall('post', url, data)
export const put = <T>(url: string, data?: unknown): Promise<T> => apiCall('put', url, data)
export const patch = <T>(url: string, data?: unknown): Promise<T> => apiCall('patch', url, data)
export const del = <T>(url: string): Promise<T> => apiCall('delete', url)

// Health check
export const checkHealth = (): Promise<{ status: string }> => {
  return get('/health')
}

// User endpoints
export const getCurrentUser = (): Promise<{ id: string; username: string; email: string }> => {
  return get('/api/v1/users/me')
}

export const getUserProfile = (userId: string) => {
  return get(`/api/v1/users/${userId}`)
}

export const updateUserProfile = (userId: string, data: unknown) => {
  return put(`/api/v1/users/${userId}`, data)
}
