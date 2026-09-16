import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const token = localStorage.getItem('tolseva_token')
      const user = JSON.parse(localStorage.getItem('tolseva_user') || 'null')
      const role = localStorage.getItem('tolseva_role')
      return token ? { token, user, role } : null
    } catch {
      return null
    }
  })

  const login = useCallback((token, user, role) => {
    localStorage.setItem('tolseva_token', token)
    localStorage.setItem('tolseva_user', JSON.stringify(user))
    localStorage.setItem('tolseva_role', role)
    setAuth({ token, user, role })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tolseva_token')
    localStorage.removeItem('tolseva_user')
    localStorage.removeItem('tolseva_role')
    setAuth(null)
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout, isLoggedIn: !!auth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
