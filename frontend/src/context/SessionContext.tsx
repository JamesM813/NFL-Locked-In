import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import type { profileData, profileGroupData } from '@/utils/types'

// Single user-session context: the signed-in user's profile and group
// memberships (previously the separate ProfileContext and GroupContext).
type SessionContextType = {
  profile: profileData | null
  groups: profileGroupData[] | null
  refetchProfiles: () => Promise<void>
  refetchGroups: () => Promise<void>
}

export const SessionContext = createContext<SessionContextType | null>(null)

export function useSession() {
  return useContext(SessionContext)
}

export function useProfile() {
  const session = useContext(SessionContext)
  if (!session) return null
  return { profile: session.profile, refetchProfiles: session.refetchProfiles }
}

export function useGroup() {
  const session = useContext(SessionContext)
  if (!session) return null
  return { groups: session.groups, refetchGroups: session.refetchGroups }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<profileData | null>(null)
  const [groups, setGroups] = useState<profileGroupData[]>([])
  const [loading, setLoading] = useState(true)

  const refetchProfiles = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      setProfile(null)
      return
    }

    const { data: profileRow, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!error) {
      setProfile(profileRow)
    }
  }, [])

  const refetchGroups = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: userGroups, error: groupError } = await supabase
      .from('profile_groups')
      .select(`
        *,
        groups (
          id,
          name,
          group_picture_url
        ),
        group_member_counts!inner (
          group_size
        )
      `)
      .eq('user_id', authUser.id)

    if (!groupError && userGroups) {
      setGroups(userGroups.map(g => ({
        ...g,
        group_size: g.group_member_counts?.group_size ?? 0
      })))
    } else {
      console.error("Failed to refresh groups:", groupError)
    }
  }, [])

  useEffect(() => {
    async function fetchSession() {
      await Promise.all([refetchProfiles(), refetchGroups()])
      setLoading(false)
    }

    fetchSession()
  }, [refetchProfiles, refetchGroups])

  if (loading) return <LoadingSpinner />

  return (
    <SessionContext.Provider value={{ profile, groups, refetchProfiles, refetchGroups }}>
      {children}
    </SessionContext.Provider>
  )
}
