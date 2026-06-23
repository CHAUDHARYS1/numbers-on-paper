import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  // 'light' | 'dark' | 'system'
  const [preference, setPreference] = useState(
    () => localStorage.getItem('theme') || 'system'
  )

  // Resolved theme is always 'light' or 'dark'
  const [theme, setTheme] = useState(() => {
    const pref = localStorage.getItem('theme') || 'system'
    return pref === 'system' ? systemTheme() : pref
  })

  // Apply resolved theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // When in system mode, follow OS changes in real time
  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setTheme(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preference])

  const setThemePreference = (pref) => {
    setPreference(pref)
    localStorage.setItem('theme', pref)
    setTheme(pref === 'system' ? systemTheme() : pref)
  }

  // Quick toggle: switches light ↔ dark, exiting system mode
  const toggleTheme = () => setThemePreference(theme === 'light' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ theme, preference, toggleTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
