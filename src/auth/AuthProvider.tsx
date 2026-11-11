import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { clearTokens, getTokens, LICENSE_BLOCKED_EVENT, login, SESSION_EXPIRED_EVENT } from '../lib/api'
import { useProfile } from '../lib/queries'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(() => getTokens() !== null)
  const { data: profile, isError: profileError } = useProfile(isAuthenticated)

  useEffect(() => {
    const expire = () => {
      queryClient.clear()
      setIsAuthenticated(false)
    }
    // Si la licencia vence con el panel abierto, el perfil trae el motivo y muestra el bloqueo.
    const blocked = () => queryClient.invalidateQueries({ queryKey: ['me'] })
    window.addEventListener(SESSION_EXPIRED_EVENT, expire)
    window.addEventListener(LICENSE_BLOCKED_EVENT, blocked)
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, expire)
      window.removeEventListener(LICENSE_BLOCKED_EVENT, blocked)
    }
  }, [queryClient])

  async function signIn(username: string, password: string) {
    await login(username, password)
    queryClient.clear()
    setIsAuthenticated(true)
  }

  function logout() {
    clearTokens()
    queryClient.clear()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, profile, profileError, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
