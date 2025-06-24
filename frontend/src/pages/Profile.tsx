import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type userData = {
  id: string
  email: string
  username: string
  profilePicture: string
}

export default function Profile() {
  const [userData, setUserData] = useState<userData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('No user found')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select(`*`)
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
        } else if (data) {
          const profileData: userData = {
            id: user.id,
            email: user.email || '',
            username: data.username,
            profilePicture: data.profile_picture_url
          }
          setUserData(profileData)
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <p className="text-white">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="backdrop-blur-sm bg-white/10 shadow-2xl border-0 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Profile</CardTitle>
            <CardDescription className="text-gray-300">Your account details</CardDescription>
            <div><img src={userData?.profilePicture} alt="Profile Picture" className="absolute top-0 right-0 mt-4 mr-4 w-32 h-32 rounded-full border-2 border-white object-cover shadow-md"/></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {userData ? (
              <>
                <div>
                  <p className="text-sm text-gray-400">Email:</p>
                  <p className="text-lg">{userData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Username:</p>
                  <p className="text-lg">{userData.username}</p>
                </div>
              </>
            ) : (
              <p className="text-red-400">No user data found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
