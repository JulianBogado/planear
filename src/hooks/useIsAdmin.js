import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useIsAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    let cancelled = false

    if (!user) {
      setIsAdmin(false)
      return () => {
        cancelled = true
      }
    }

    setIsAdmin(null)

    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!cancelled) {
        setIsAdmin(error ? false : !!data)
      }
    })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  return isAdmin
}
