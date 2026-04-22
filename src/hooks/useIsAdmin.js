import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!error) setIsAdmin(!!data)
    })
  }, [])

  return isAdmin
}
