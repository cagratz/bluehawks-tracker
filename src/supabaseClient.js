import { createClient } from '@supabase/supabase-js'

const rawUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!rawUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars.\n' +
    'Copy .env.example → .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

// Normalize: keep only the scheme + host (strip any /rest/v1/ or other path suffixes)
const supabaseUrl = (() => {
  try {
    const u = new URL(rawUrl)
    return `${u.protocol}//${u.host}`
  } catch {
    return rawUrl
  }
})()

export const supabase = createClient(supabaseUrl, supabaseKey)
