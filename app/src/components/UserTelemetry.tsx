import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logUserEvent } from '../services/api'

export const UserTelemetry: React.FC = () => {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    void logUserEvent({
      action: 'page_view',
      target: `${location.pathname}${location.search}`,
      metadata: {
        hash: location.hash || '',
      },
    }).catch(() => undefined)
  }, [isAuthenticated, location.hash, location.pathname, location.search])

  return null
}
