import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Header from './Header'
import { ProfileContext } from '@/context/ProfileContext'

export default function ProtectedLayout() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error) setUser(profile)
      setLoading(false)
    }

    fetchUser()
  }, [])

  if (loading) return <div className="text-white p-6">Loading...</div>

  return (
    <ProfileContext.Provider value={user}>
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </ProfileContext.Provider>
  )
}
