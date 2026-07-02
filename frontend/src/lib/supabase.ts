import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// SECURITY: never reference the service_role key here. Any VITE_-prefixed value
// read in client code is bundled into the public browser JS. The service_role
// key bypasses RLS and grants full DB access — it must stay server-side only
// (see src/lib/supabase-node.ts, used by `npm run seed`).

export const supabase = createClient(supabaseUrl, supabaseAnonKey)