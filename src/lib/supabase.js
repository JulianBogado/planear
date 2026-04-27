import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Faltan variables de Supabase para el modo "${import.meta.env.MODE}". Revisá los archivos .env.[mode].local correspondientes.`,
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
