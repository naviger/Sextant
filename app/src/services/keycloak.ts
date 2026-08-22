import Keycloak from 'keycloak-js'

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'sextant',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'sextant-app',
}

let keycloakInstance: Keycloak.KeycloakInstance | null = null
let initPromise: Promise<boolean> | null = null

export const getKeycloakInstance = (): Keycloak.KeycloakInstance => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig)
  }
  return keycloakInstance
}

export const initKeycloak = async (): Promise<boolean> => {
  if (initPromise) {
    return initPromise
  }

  const keycloak = getKeycloakInstance()
  const initOperation = keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    checkLoginIframe: false,
    pkceMethod: 'S256',
  })

  const timeoutOperation = new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(false), 8000)
  })

  initPromise = Promise.race([initOperation, timeoutOperation])
    .catch((error) => {
      console.error('Keycloak initialization failed:', error)
      return false
    })
    .finally(() => {
      initPromise = null
    })

  return initPromise
}

export const login = (): void => {
  const keycloak = getKeycloakInstance()
  keycloak.login({ redirectUri: `${window.location.origin}/dashboard` })
}

export const logout = (): void => {
  const keycloak = getKeycloakInstance()
  keycloak.logout({ redirectUri: window.location.origin })
}

export const getToken = (): string | null => {
  const keycloak = getKeycloakInstance()
  return keycloak.token || null
}

export const isTokenExpired = (): boolean => {
  const keycloak = getKeycloakInstance()
  if (!keycloak.token) return true
  
  const expirationTime = (keycloak.tokenParsed?.exp || 0) * 1000
  return expirationTime < Date.now()
}

export const refreshToken = async (): Promise<boolean> => {
  const keycloak = getKeycloakInstance()
  try {
    const refreshed = await keycloak.updateToken(30)
    return refreshed
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}

export const getUserInfo = () => {
  const keycloak = getKeycloakInstance()
  const realmRoles = keycloak.realmAccess?.roles || []
  const clientRoles = Object.values(keycloak.resourceAccess || {}).flatMap((client) => client.roles || [])
  const roles = [...new Set([...realmRoles, ...clientRoles])]

  return {
    username: keycloak.tokenParsed?.preferred_username,
    email: keycloak.tokenParsed?.email,
    firstName: keycloak.tokenParsed?.given_name,
    lastName: keycloak.tokenParsed?.family_name,
    roles,
  }
}

export const hasRole = (role: string): boolean => {
  const keycloak = getKeycloakInstance()
  return keycloak.tokenParsed?.roles?.includes(role) || false
}

export const hasRealmRole = (role: string): boolean => {
  const keycloak = getKeycloakInstance()
  return keycloak.realmAccess?.roles?.includes(role) || false
}

export const isAuthenticated = (): boolean => {
  const keycloak = getKeycloakInstance()
  return keycloak.authenticated || false
}
