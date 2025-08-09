import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Header from './Header'
import Footer from './Footer'
import { ProfileContext } from '@/context/ProfileContext'
import { GroupContext } from '@/context/GroupContext'
import {LoadingSpinner} from "./LoadingSpinner";
import type { profileData, profileGroupData } from '@/utils/types'

export default function ProtectedLayout() {
  const [user, setUser] = useState<profileData | null>(null)
  const [groups, setGroups] = useState<profileGroupData[]>([])
  const [loading, setLoading] = useState(true)

  async function refetchProfile() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      setUser(null)
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!error) {
      setUser(profile)
    }
  }
  
  async function refetchGroups() {
    if (!user?.id) return;
  
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
      .eq('user_id', user.id);
  
    if (!groupError && userGroups) {
      setGroups(userGroups.map(g => ({
        ...g,
        group_size: g.group_member_counts?.group_size ?? 0
      })));
    } else {
      console.error("Failed to refresh groups:", groupError);
    }
  }
  

  useEffect(() => {
    async function fetchUserAndGroups() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)

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
        .eq('user_id', user.id);
      
      if (!groupError && userGroups) {
        setGroups(userGroups.map(g => ({
          ...g,
          group_size: g.group_member_counts?.group_size ?? 0
        })));
      }
      

      setLoading(false)
    }

    fetchUserAndGroups()
  }, [])

  if (loading) return <LoadingSpinner />;

  return (
    <ProfileContext.Provider value={{ 
      profile: user, 
      refetchProfiles: refetchProfile 
    }}>
      <GroupContext.Provider value={{ groups, refetchGroups }}>
        <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
          <Header />
          
          <main>
          
            <Outlet />
            <Footer />
          </main>
        </div>
      </GroupContext.Provider>
    </ProfileContext.Provider>
  )
}
