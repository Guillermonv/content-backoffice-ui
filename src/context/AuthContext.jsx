import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const login = (data) => {
    localStorage.setItem('token', data.token)
    setToken(data.token)
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
  }, [])

  const apiFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        ...options.headers,
      },
    })
    if (res.status === 401) {
      logout()
      return null
    }
    return res
  }, [logout])

  return (
    <AuthContext.Provider value={{ token, login, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
