import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

// Server-side Supabase client for the seeding script. Uses the service_role
// key, which bypasses RLS — never expose it to the frontend. In particular,
// never store it under a VITE_-prefixed name: Vite inlines every referenced
// VITE_ variable into the public browser bundle.
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    'Warning: rename VITE_SUPABASE_SERVICE_ROLE_KEY to SUPABASE_SERVICE_ROLE_KEY. ' +
    'VITE_-prefixed variables risk being bundled into client code.'
  )
}

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. Set them in the ' +
    'environment or in frontend/.env (service_role key: Supabase dashboard → ' +
    'Project Settings → API).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
