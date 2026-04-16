import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(!!data))
  }, [])

  return isAdmin
}
