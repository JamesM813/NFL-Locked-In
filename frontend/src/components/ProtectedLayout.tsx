import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Header from './Header'
import { ProfileContext } from '@/context/ProfileContext'
import { GroupContext } from '@/context/GroupContext'
import type { profileData, profileGroupData } from '@/utils/types'

export default function ProtectedLayout() {
  const [user, setUser] = useState<profileData | null>(null)
  const [groups, setGroups] = useState<profileGroupData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserAndGroups() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileError) {
        setUser(profile)

        const { data: userGroups, error: groupError } = await supabase
          .from('profile_groups')
          .select('*, groups(*)')
          .eq('user_id', user.id)
        
          console.log(userGroups)
        if (!groupError) setGroups(userGroups)
      }

      setLoading(false)
    }

    fetchUserAndGroups()
  }, [])

  if (loading) return <div className="text-white p-6">Loading...</div>

  return (
    <ProfileContext.Provider value={user}>
      <GroupContext.Provider value={groups}>
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
          <Header />
          <main>
            <Outlet />
          </main>
        </div>
      </GroupContext.Provider>
    </ProfileContext.Provider>
  )
}

